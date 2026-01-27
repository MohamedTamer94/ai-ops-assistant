
import uuid
from sqlalchemy import Column, Integer, ForeignKey, String, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.app.db import Base
from sqlalchemy.dialects.postgresql import UUID


class Ingestion(Base):
    __tablename__ = "ingestions"

    id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id'), nullable=False, index=True)
    source_type = Column(String, nullable=False)
    status = Column(String, nullable=False, default="pending")
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    project = relationship('Project', back_populates='ingestions')