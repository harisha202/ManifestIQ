from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.session import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    upload_date = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="Indexed")
    summary = Column(Text, nullable=True)
    keywords = Column(Text, nullable=True) # JSON serialized list of strings
    suggested_questions = Column(Text, nullable=True) # JSON serialized list of strings
    pages = Column(Integer, nullable=True, default=0)
    chunk_count = Column(Integer, nullable=True, default=0)
    user_id = Column(Integer, ForeignKey("users.id"))

    user = relationship("User")
