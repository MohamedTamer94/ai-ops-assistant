
from app.db import Base

import uuid
from sqlalchemy import Column, ForeignKey, String, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

class AiAnalysis(Base):
    __tablename__ = "ai_analyses"

    id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    ingestion_id = Column(UUID(as_uuid=True), ForeignKey('ingestions.id', ondelete="CASCADE"), nullable=False, index=True)
    mode = Column(String, nullable=False)
    result = Column(JSONB, nullable=True, default={})
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    ingestion = relationship('Ingestion', back_populates='ai_analyses')