
import uuid
from backend.app.db import Base

from sqlalchemy import Column, ForeignKey, String, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func

class Finding(Base):
    __tablename__ = 'findings'

    id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    ingestion_id = Column(UUID(as_uuid=True), ForeignKey('ingestions.id'), nullable=False, index=True)
    rule_id = Column(String, nullable=False, index=True)
    title = Column(String, nullable=False)
    severity = Column(String, nullable=False)
    confidence = Column(String, nullable=False)
    evidence_event_ids = Column(JSONB, nullable=True)

    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())