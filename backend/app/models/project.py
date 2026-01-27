from sqlalchemy import Column, ForeignKey, Integer, String, DateTime, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db import Base
import uuid
from sqlalchemy.dialects.postgresql import UUID

class Project(Base):
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    name = Column(String, index=True, nullable=False)
    org_id = Column(UUID(as_uuid=True), ForeignKey('organizations.id', ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    organization = relationship("Organization", back_populates="projects")
    ingestions = relationship("Ingestion", back_populates="project", cascade="all, delete-orphan", passive_deletes=True,)

    __tableargs__ = (
        # Ensure project names are unique within an organization
        UniqueConstraint('org_id', 'name', name='uix_org_project_name'),
    )