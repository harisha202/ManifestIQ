from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.models.document import Document
from app.models.query_log import QueryLog

router = APIRouter()

@router.get("/dashboard")
def get_dashboard_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # 1. Documents uploaded
    docs_count = db.query(Document).filter(Document.user_id == current_user.id).count()
    
    # 2. Questions asked
    questions_count = db.query(QueryLog).filter(QueryLog.user_id == current_user.id).count()
    
    # 3. % Grounded answers
    grounded_count = db.query(QueryLog).filter(QueryLog.user_id == current_user.id, QueryLog.is_grounded == 1).count()
    percent_grounded = int((grounded_count / questions_count * 100)) if questions_count > 0 else 100
    
    # 4. Avg response time (mocked for now as we don't store duration, could add later)
    avg_response_time = "1.2s" 
    
    # Recent activity
    recent_activity_db = db.query(QueryLog).filter(QueryLog.user_id == current_user.id).order_by(QueryLog.timestamp.desc()).limit(5).all()
    recent_activity = []
    for activity in recent_activity_db:
        recent_activity.append({
            "id": activity.id,
            "query": activity.query_text,
            "document_id": activity.document_id,
            "timestamp": activity.timestamp
        })
        
    return {
        "overview": {
            "documents_uploaded": docs_count,
            "questions_asked": questions_count,
            "avg_response_time": avg_response_time,
            "percent_grounded": percent_grounded
        },
        "recent_activity": recent_activity
    }
