import uuid
from sqlalchemy import Column, ForeignKey, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db import Base

class Ingestion(Base):
    __tablename__ = "ingestions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    source_type = Column(String, nullable=False)  # later: CHECK constraint
    status = Column(String, nullable=False, default="pending")  # later: CHECK constraint
    finding_status = Column(String, nullable=False, default="pending")  # pending, processing, done, failed
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    project = relationship("Project", back_populates="ingestions")
    log_events = relationship("LogEvent", back_populates="ingestion", cascade="all, delete-orphan", passive_deletes=True,)
    findings = relationship("Finding", back_populates="ingestion", cascade="all, delete-orphan", passive_deletes=True,)
    ai_analyses = relationship("AiAnalysis", back_populates="ingestion", cascade="all, delete-orphan", passive_deletes=True,)
