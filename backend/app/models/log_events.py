
import uuid
from sqlalchemy.sql import func
from sqlalchemy import Column, ForeignKey, Integer, String, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from backend.app.db import Base

class LogEvent(Base):
    __tablename__ = "log_events"

    id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    ingestion_id = Column(UUID(as_uuid=True), ForeignKey('ingestions.id'), nullable=False, index=True)
    ts = Column(DateTime(timezone=True), nullable=True)
    service = Column(String, nullable=True)
    level = Column(String, nullable=True)
    message = Column(String, nullable=True)
    raw = Column(String, nullable=True)
    fingerprint = Column(String, nullable=True, index = True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    ingestion = relationship('Ingestion', back_populates='log_events')