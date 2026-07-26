import os
import shutil
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, BackgroundTasks, Request
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from app.dependencies import get_current_user
from app.config import settings
from app.db.session import get_db
from app.models.user import User
from app.models.document import Document
from app.services.ingest import ingest_document_sync, FAISS_DATA_PATH, google_ef
from langchain_community.vectorstores import FAISS
from pydantic import BaseModel
from typing import List

router = APIRouter()

class SearchRequest(BaseModel):
    query: str
    document_ids: List[int] = []

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "../../uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...), 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
        
    # Save file record in DB
    new_doc = Document(filename=file.filename, user_id=current_user.id)
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)
    
    # Save file to disk
    file_path = os.path.join(UPLOAD_DIR, f"{new_doc.id}_{file.filename}")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Start ingestion in background
    background_tasks.add_task(ingest_document_sync, file_path, new_doc.id, db)
        
    return {"message": "Document uploaded and processing started in background", "document_id": new_doc.id}

@router.get("/list")
def list_documents(
    skip: int = 0, 
    limit: int = 20, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    query = db.query(Document).filter(Document.user_id == current_user.id)
    total = query.count()
    docs = query.order_by(Document.upload_date.desc()).offset(skip).limit(limit).all()
    
    import json
    
    items = []
    for d in docs:
        sq = []
        if d.suggested_questions:
            try:
                sq = json.loads(d.suggested_questions)
            except:
                pass
                
        items.append({
            "id": d.id, 
            "filename": d.filename, 
            "upload_date": d.upload_date,
            "status": d.status,
            "pages": d.pages,
            "chunk_count": d.chunk_count,
            "file_size_bytes": d.file_size_bytes,
            "suggested_questions": sq,
            "summary": d.summary,
            "keywords": json.loads(d.keywords) if d.keywords else []
        })
        
    return {
        "total": total,
        "items": items
    }

@router.post("/search")
def semantic_search(
    request: SearchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not os.path.exists(os.path.join(FAISS_DATA_PATH, "index.faiss")):
        return {"results": []}
        
    # Verify user has access to these documents
    user_docs = db.query(Document.id).filter(Document.user_id == current_user.id).all()
    user_doc_ids = [d[0] for d in user_docs]
    
    target_docs = request.document_ids if request.document_ids else user_doc_ids
    # Filter out any docs they don't own
    valid_docs = [d for d in target_docs if d in user_doc_ids]
    
    if not valid_docs:
        return {"results": []}
        
    faiss_db = FAISS.load_local(FAISS_DATA_PATH, google_ef, allow_dangerous_deserialization=True)
    
    # We must filter by document_ids
    # FAISS filter syntax for LangChain allows matching metadata
    
    results = []
    for doc_id in valid_docs:
        docs_and_scores = faiss_db.similarity_search_with_score(request.query, k=3, filter={"document_id": doc_id})
        for doc, score in docs_and_scores:
            conf = max(0.0, min(100.0, 100.0 - (score * 50.0)))
            results.append({
                "document_id": doc_id,
                "content": doc.page_content,
                "confidence": conf,
                "page": doc.metadata.get("page", 0) + 1
            })
            
    # Sort by confidence descending
    results.sort(key=lambda x: x["confidence"], reverse=True)
    return {"results": results[:10]}

def get_current_user_from_token(
    request: Request,
    token: str = None,
    db: Session = Depends(get_db)
):
    auth_header = request.headers.get("Authorization")
    actual_token = None
    if auth_header and auth_header.startswith("Bearer "):
        actual_token = auth_header.split(" ")[1]
    elif token:
        actual_token = token
        
    if not actual_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
        
    try:
        payload = jwt.decode(actual_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email = payload.get("sub")
        if not email:
            raise HTTPException(status_code=401)
    except JWTError:
        raise HTTPException(status_code=401)
        
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401)
    return user

@router.get("/{document_id}/pdf")
def get_document_pdf(
    document_id: int,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    file_path = os.path.join(UPLOAD_DIR, f"{doc.id}_{doc.filename}")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="PDF file not found on disk")
        
    return FileResponse(file_path, media_type="application/pdf", filename=doc.filename)

class DeleteRequest(BaseModel):
    document_ids: List[int]

@router.post("/delete")
def bulk_delete_documents(
    request: DeleteRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Fetch docs ensuring they belong to user
    docs = db.query(Document).filter(Document.id.in_(request.document_ids), Document.user_id == current_user.id).all()
    
    deleted_count = 0
    for doc in docs:
        # Delete file from disk if it exists
        file_path = os.path.join(UPLOAD_DIR, f"{doc.id}_{doc.filename}")
        if os.path.exists(file_path):
            os.remove(file_path)
            
        # Delete from DB (vector store chunks are not removed in this basic version, requires more complex logic, but DB + File is fine for UI polish)
        db.delete(doc)
        deleted_count += 1
        
    db.commit()
    return {"message": f"Successfully deleted {deleted_count} documents", "deleted_count": deleted_count}
