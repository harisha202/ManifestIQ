# Temporary fix for older Python versions (like 3.8) that have outdated SQLite
try:
    import pysqlite3
    import sys
    sys.modules["sqlite3"] = pysqlite3
except ImportError:
    pass

import os
import logging
from pythonjsonlogger import jsonlogger
import sentry_sdk
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.db.session import engine, Base, get_db
from app.config import settings
from app.routers import auth, documents, query, analytics, system

# Configure structured JSON logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)
logHandler = logging.StreamHandler()
formatter = jsonlogger.JsonFormatter('%(asctime)s %(levelname)s %(name)s %(message)s')
logHandler.setFormatter(formatter)
logger.addHandler(logHandler)

# Initialize Sentry if configured
if settings.SENTRY_DSN:
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        traces_sample_rate=1.0,
        profiles_sample_rate=1.0,
    )
    logging.info("Sentry initialized")

# Create database tables
Base.metadata.create_all(bind=engine)

from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.limiter import limiter

app = FastAPI(title=settings.PROJECT_NAME)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], # Restricted to frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(documents.router, prefix="/api/documents", tags=["documents"])
app.include_router(query.router, prefix="/api/query", tags=["query"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
app.include_router(system.router, prefix="/api/system", tags=["system"])

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "../../uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/api/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

@app.get("/")
def read_root():
    logging.info("Root endpoint accessed")
    return {"message": "Welcome to the ManifestIQ API"}

@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    from app.routers.system import get_system_status
    status = get_system_status(db)
    # Map the status to the requested format
    return {
        "status": "healthy" if status["database"]["status"] == "healthy" and status["vector_store"]["status"] == "healthy" else "degraded",
        "database": {
            "status": "connected" if status["database"]["status"] == "healthy" else "error",
            "latency": status["database"].get("latency_ms", 0)
        },
        "vector_store": {
            "status": "ready" if status["vector_store"]["status"] == "healthy" else "error",
            "latency": 5 # FAISS is local, latency is minimal, hardcode or measure later.
        },
        "llm": {
            "status": "available" if status["ai_model"]["status"] == "healthy" else "error",
            "latency": status["ai_model"].get("latency_ms", 0)
        }
    }

@app.get("/ready")
def readiness_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ready"}
    except Exception as e:
        logging.error(f"Readiness check failed: {e}")
        return {"status": "unready", "detail": str(e)}

# Force reload
