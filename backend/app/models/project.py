from sqlalchemy import Column, ForeignKey, Integer, String, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db import Base
import uuid
from sqlalchemy.dialects.postgresql import UUID

class Project(Base):
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    name = Column(String, unique=True, index=True, nullable=False)
    org_id = Column(UUID(as_uuid=True), ForeignKey('organizations.id'), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    organization = relationship('Organization', back_populates='projects')