import os
import shutil
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from app.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.models.document import Document
from app.services.ingest import ingest_document

router = APIRouter()

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "../../uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
async def upload_document(
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
        
    # Ingest into ChromaDB
    try:
        chunks_count = ingest_document(file_path, new_doc.id)
    except Exception as e:
        db.delete(new_doc)
        db.commit()
        raise HTTPException(status_code=500, detail=f"Failed to process document: {str(e)}")
        
    return {"message": "Document uploaded and processed successfully", "document_id": new_doc.id, "chunks": chunks_count}

@router.get("/list")
def list_documents(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    docs = db.query(Document).filter(Document.user_id == current_user.id).order_by(Document.upload_date.desc()).all()
    return [{"id": d.id, "filename": d.filename, "upload_date": d.upload_date} for d in docs]
