import uuid
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.db import Base
from sqlalchemy.dialects.postgresql import UUID

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    name = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())