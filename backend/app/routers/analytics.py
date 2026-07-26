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
    
    # 4. Avg response time
    avg_resp = db.query(func.avg(QueryLog.response_time)).filter(QueryLog.user_id == current_user.id).scalar()
    avg_response_time = f"{avg_resp / 1000:.1f}s" if avg_resp else "0.0s"
    
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
        
    # Document Type Distribution
    type_counts = {"PDF": 0, "DOCX": 0, "TXT": 0, "Other": 0}
    status_counts = {"Success": 0, "Failed": 0, "Processing": 0}
    
    for d in all_docs:
        ext = d.filename.split('.')[-1].lower() if '.' in d.filename else ''
        if ext == 'pdf': type_counts["PDF"] += 1
        elif ext == 'docx': type_counts["DOCX"] += 1
        elif ext == 'txt': type_counts["TXT"] += 1
        else: type_counts["Other"] += 1
        
        status = d.status or 'Indexed'
        if status == 'Indexed': status_counts["Success"] += 1
        elif status == 'Failed': status_counts["Failed"] += 1
        else: status_counts["Processing"] += 1
        
    docTypeData = [{"name": k, "value": v} for k, v in type_counts.items() if v > 0]
    uploadStatusData = [{"name": k, "value": v} for k, v in status_counts.items() if v > 0]
    
    # Response Time and Retrieval Time Trends (simulated based on historical queries)
    # Group queries by day name, calculate avg
    perf_dict = {}
    for i in range(6, -1, -1):
        day = today - datetime.timedelta(days=i)
        perf_dict[day.strftime('%a')] = {"count": 0, "total_resp": 0}
        
    for q in all_queries:
        if q.timestamp and q.response_time:
            q_date = q.timestamp.date()
            if (today - q_date).days <= 6:
                day_name = q_date.strftime('%a')
                perf_dict[day_name]["count"] += 1
                perf_dict[day_name]["total_resp"] += q.response_time
                
    performanceTrends = []
    for k, v in perf_dict.items():
        avg_resp = v["total_resp"] / v["count"] if v["count"] > 0 else 0
        avg_retrieval = avg_resp * 0.15 if avg_resp > 0 else 0 # Simulate retrieval as 15% of total time
        performanceTrends.append({
            "name": k, 
            "responseTime": round(avg_resp),
            "retrievalTime": round(avg_retrieval)
        })
        
    # Storage Metrics (Logical Categories)
    import os
    from app.services.ingest import FAISS_DATA_PATH
    
    UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "../../uploads")
    docs_size_bytes = 0
    doc_sizes = []
    
    for d in all_docs:
        file_path = os.path.join(UPLOAD_DIR, f"{d.id}_{d.filename}")
        size = 0
        if os.path.exists(file_path):
            size = os.path.getsize(file_path)
            docs_size_bytes += size
        doc_sizes.append({
            "name": d.filename, 
            "size_bytes": size,
            "pages": d.pages or 0,
            "chunks": d.chunk_count or 0
        })
            
    docs_size_mb = docs_size_bytes / (1024 * 1024)
    
    faiss_size_mb = 0
    faiss_path = os.path.join(FAISS_DATA_PATH, "index.faiss")
    if os.path.exists(faiss_path):
        faiss_size_mb = os.path.getsize(faiss_path) / (1024 * 1024)
        
    # Logical Metadata Size Estimation (Query Logs + Document Metadata text)
    metadata_size_mb = (questions_count * 2.5 + docs_count * 15) / 1024
        
    storageMetrics = [
        {"name": "Documents", "value": round(docs_size_mb, 2)},
        {"name": "Vector Index", "value": round(faiss_size_mb, 2)},
        {"name": "Metadata", "value": round(metadata_size_mb, 2)}
    ]
    
    # Top 10 Largest Documents Table Data
    doc_sizes.sort(key=lambda x: x["size_bytes"], reverse=True)
    largestDocsData = []
    for ds in doc_sizes[:10]:
        mb = ds["size_bytes"] / (1024 * 1024)
        if mb > 0 or True: # Include all docs for table even if small
            largestDocsData.append({
                "name": ds["name"], 
                "size_mb": f"{mb:.2f} MB",
                "pages": ds["pages"],
                "chunks": ds["chunks"]
            })

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
        "uploadTrends": uploadTrends,
        "storageMetrics": storageMetrics,
        "docTypeData": docTypeData,
        "uploadStatusData": uploadStatusData,
        "performanceTrends": performanceTrends,
        "largestDocsData": largestDocsData
    }
