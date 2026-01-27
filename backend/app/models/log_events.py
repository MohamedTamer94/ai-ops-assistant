import uuid
from sqlalchemy import Column, ForeignKey, String, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db import Base

class LogEvent(Base):
    __tablename__ = "log_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ingestion_id = Column(UUID(as_uuid=True), ForeignKey("ingestions.id", ondelete="CASCADE"), nullable=False, index=True)

    ts = Column(DateTime(timezone=True), nullable=True)
    service = Column(String, nullable=True)
    level = Column(String, nullable=True)

    message = Column(Text, nullable=False)
    raw = Column(Text, nullable=False)
    fingerprint = Column(String, nullable=False, index=True)

    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    ingestion = relationship("Ingestion", back_populates="log_events")
