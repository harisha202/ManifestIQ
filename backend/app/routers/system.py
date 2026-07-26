from fastapi import APIRouter, Depends
import time
import requests
import os
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.session import get_db
from app.config import settings
from app.services.ingest import FAISS_DATA_PATH

router = APIRouter()

@router.get("/status")
def get_system_status(db: Session = Depends(get_db)):
    status_report = {
        "database": {"status": "unknown", "latency_ms": 0},
        "vector_store": {"status": "unknown", "size_mb": 0},
        "ai_model": {"status": "unknown", "latency_ms": 0}
    }
    
    # 1. Database Health
    db_start = time.time()
    try:
        db.execute(text("SELECT 1"))
        status_report["database"]["status"] = "healthy"
    except Exception as e:
        status_report["database"]["status"] = "error"
        status_report["database"]["error"] = str(e)
    finally:
        status_report["database"]["latency_ms"] = round((time.time() - db_start) * 1000, 2)
        
    # 2. Vector Store Health (FAISS)
    index_path = os.path.join(FAISS_DATA_PATH, "index.faiss")
    if os.path.exists(index_path):
        status_report["vector_store"]["status"] = "healthy"
        size_bytes = os.path.getsize(index_path)
        status_report["vector_store"]["size_mb"] = round(size_bytes / (1024 * 1024), 2)
    else:
        status_report["vector_store"]["status"] = "empty_or_missing"
        
    # 3. AI Model Health (Gemini)
    ai_start = time.time()
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models?key={settings.GOOGLE_API_KEY}"
        resp = requests.get(url, timeout=3)
        if resp.status_code == 200:
            status_report["ai_model"]["status"] = "healthy"
        else:
            status_report["ai_model"]["status"] = "error"
    except Exception as e:
        status_report["ai_model"]["status"] = "error"
    finally:
        status_report["ai_model"]["latency_ms"] = round((time.time() - ai_start) * 1000, 2)
        
    return status_report
