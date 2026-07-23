from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.models.document import Document
from app.models.query_log import QueryLog
from app.services.qa_chain import ask_question as qa_ask_question

router = APIRouter()

class QueryRequest(BaseModel):
    document_id: int
    query: str

@router.post("/ask")
def ask_question(request: QueryRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Verify document exists and belongs to user
    doc = db.query(Document).filter(Document.id == request.document_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found or access denied")
        
    # Get answer
    result = qa_ask_question(doc.id, request.query)
    
    # Log query
    new_log = QueryLog(
        user_id=current_user.id,
        document_id=doc.id,
        query_text=request.query,
        response_text=result["answer"],
        citation=result["citation"],
        is_grounded=1 if result["is_grounded"] else 0
    )
    db.add(new_log)
    db.commit()
    
    return result
