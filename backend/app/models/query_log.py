from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.session import Base

class QueryLog(Base):
    __tablename__ = "query_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=True)
    query_text = Column(String, nullable=False)
    response_text = Column(Text, nullable=False)
    citation = Column(String, nullable=True)
    is_grounded = Column(Integer, default=1) # 1 for True, 0 for False (or use Boolean)
    timestamp = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
    document = relationship("Document")
