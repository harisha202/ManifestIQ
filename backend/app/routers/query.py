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

from typing import Optional, List, Dict, Any
from fastapi import Request
from fastapi.responses import StreamingResponse
import json
from app.limiter import limiter

class QueryRequest(BaseModel):
    document_id: Optional[int] = None
    document_ids: Optional[List[int]] = None
    query: str
    chat_history: Optional[List[Dict[str, Any]]] = None

class FeedbackRequest(BaseModel):
    feedback: int # 1 for thumbs up, -1 for thumbs down, 0 for clear

@router.post("/ask")
@limiter.limit("20/minute")
def ask_question(request: Request, body_request: QueryRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Consolidate requested document IDs
    req_ids = body_request.document_ids or []
    if body_request.document_id and body_request.document_id not in req_ids:
        req_ids.append(body_request.document_id)
        
    if not req_ids:
        raise HTTPException(status_code=400, detail="Must provide at least one document ID")
        
    # Verify all documents exist and belong to user
    docs = db.query(Document).filter(Document.id.in_(req_ids), Document.user_id == current_user.id).all()
    if len(docs) != len(req_ids):
        raise HTTPException(status_code=404, detail="One or more documents not found or access denied")
        
    doc_map = {d.id: d.filename for d in docs}
    pages_map = {d.id: d.pages for d in docs}
        
    # Instead of getting result synchronously, return a StreamingResponse
    def stream_generator():
        import time
        start_time = time.time()
        # Iterate over the qa_ask_question generator
        full_answer = ""
        citations_str = "[]"
        retrieval_time = 0
        is_grounded = 0
        
        for chunk in qa_ask_question(req_ids, body_request.query, body_request.chat_history):
            try:
                data = json.loads(chunk.strip())
                if data["type"] == "complete":
                    full_answer = data.get("full_answer", "")
                    
                    # Add filename to citations
                    if "citations" in data:
                        for cit in data["citations"]:
                            doc_id = cit.get("document_id")
                            cit["filename"] = doc_map.get(doc_id, f"Doc {doc_id}")
                            cit["total_pages"] = pages_map.get(doc_id, 0)
                            
                    citations_str = str(data.get("citations", []))
                    
                    if "retrieval_analytics" not in data:
                        data["retrieval_analytics"] = {}
                        
                    retrieval_time = data["retrieval_analytics"].get("time_ms", 0)
                    total_response_time = int((time.time() - start_time) * 1000)
                    data["retrieval_analytics"]["total_time_ms"] = total_response_time
                    
                    is_grounded = 1 if data.get("is_grounded") else 0
                    
                    # Log query to DB
                    primary_doc_id = req_ids[0] if req_ids else None
                    new_log = QueryLog(
                        user_id=current_user.id,
                        document_id=primary_doc_id,
                        query_text=body_request.query,
                        response_text=full_answer,
                        citation=citations_str,
                        response_time=total_response_time, # Store total response time in DB
                        is_grounded=is_grounded,
                        feedback=0
                    )
                    db.add(new_log)
                    db.commit()
                    
                    # Inject log_id into the final complete event
                    data["log_id"] = new_log.id
                    yield json.dumps(data) + "\n"
                else:
                    yield chunk
            except Exception as e:
                yield chunk
                
    return StreamingResponse(stream_generator(), media_type="text/event-stream")

@router.get("/history")
def get_query_history(
    skip: int = 0, 
    limit: int = 20, 
    document_id: Optional[int] = None,
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    query = db.query(QueryLog).filter(QueryLog.user_id == current_user.id)
    if document_id:
        query = query.filter(QueryLog.document_id == document_id)
        
    total = query.count()
    logs = query.order_by(QueryLog.timestamp.desc()).offset(skip).limit(limit).all()
    
    # We should also return document filenames to display nicely on the frontend
    result_logs = []
    for log in logs:
        doc = db.query(Document).filter(Document.id == log.document_id).first()
        result_logs.append({
            "id": log.id,
            "query": log.query_text,
            "answer": log.response_text,
            "citations": eval(log.citation) if log.citation else [],
            "document_name": doc.filename if doc else f"Doc {log.document_id}",
            "is_grounded": bool(log.is_grounded),
            "timestamp": log.timestamp,
            "response_time_ms": log.response_time
        })
        
    return {
        "total": total,
        "items": result_logs
    }

@router.post("/{log_id}/feedback")
def submit_feedback(
    log_id: int, 
    request: FeedbackRequest, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    log = db.query(QueryLog).filter(QueryLog.id == log_id, QueryLog.user_id == current_user.id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Query log not found or access denied")
        
    if request.feedback not in [-1, 0, 1]:
        raise HTTPException(status_code=400, detail="Feedback must be -1, 0, or 1")
        
    log.feedback = request.feedback
    db.commit()
    
    return {"status": "success", "feedback": log.feedback}
