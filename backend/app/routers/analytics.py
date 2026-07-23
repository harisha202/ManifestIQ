from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.models.document import Document
from app.models.query_log import QueryLog
import datetime
from sqlalchemy.sql import extract

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
    
    # 4. Avg response time (mocked for now)
    avg_response_time = "1.8s" 
    
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
        
    # --- Live Charts Data ---
    
    # Query Volume Over Time (Last 7 days)
    # Since sqlite and postgres date functions differ significantly, we'll process in Python for this demo
    all_queries = db.query(QueryLog).filter(QueryLog.user_id == current_user.id).all()
    
    # Group queries by day name
    volume_dict = {}
    today = datetime.datetime.utcnow().date()
    for i in range(6, -1, -1):
        day = today - datetime.timedelta(days=i)
        volume_dict[day.strftime('%a')] = 0
        
    for q in all_queries:
        if q.timestamp:
            q_date = q.timestamp.date()
            if (today - q_date).days <= 6:
                volume_dict[q_date.strftime('%a')] += 1
                
    volumeData = [{"name": k, "queries": v} for k, v in volume_dict.items()]
    
    # Most Queried Documents
    doc_counts = db.query(
        QueryLog.document_id,
        func.count(QueryLog.id).label('total')
    ).filter(QueryLog.user_id == current_user.id).group_by(QueryLog.document_id).order_by(desc('total')).limit(4).all()
    
    mostQueriedData = []
    for dc in doc_counts:
        doc = db.query(Document).filter(Document.id == dc.document_id).first()
        doc_name = doc.filename if doc else f"Doc {dc.document_id}"
        mostQueriedData.append({"name": doc_name[:15] + "...", "value": dc.total})
        
    if not mostQueriedData:
        mostQueriedData = [{"name": "No queries yet", "value": 1}]
        
    # Document Upload Trends
    all_docs = db.query(Document).filter(Document.user_id == current_user.id).all()
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    upload_dict = {m: 0 for m in months}
    for d in all_docs:
        if d.upload_date:
            upload_dict[months[d.upload_date.month - 1]] += 1
            
    # Return last 4 months dynamically
    current_month = today.month
    uploadTrends = []
    for i in range(3, -1, -1):
        m_idx = (current_month - 1 - i) % 12
        uploadTrends.append({"name": months[m_idx], "uploads": upload_dict[months[m_idx]]})

    return {
        "overview": {
            "documents_uploaded": docs_count,
            "questions_asked": questions_count,
            "avg_response_time": avg_response_time,
            "percent_grounded": percent_grounded
        },
        "recent_activity": recent_activity,
        "volumeData": volumeData,
        "mostQueriedData": mostQueriedData,
        "uploadTrends": uploadTrends
    }
