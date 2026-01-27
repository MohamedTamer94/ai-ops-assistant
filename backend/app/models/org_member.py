from sqlalchemy import Column, ForeignKey, Integer, String, DateTime, UniqueConstraint
from sqlalchemy.sql import func
from app.db import Base
import uuid
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

class OrganizationMember(Base):
    __tablename__ = "org_members"

    id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    org_id = Column(UUID(as_uuid=True), ForeignKey('organizations.id'), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False, index=True)
    role = Column(String, nullable=False, default="member")
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    user = relationship("User", back_populates="org_members")
    organization = relationship("Organization", back_populates="org_members")

    __table_args__ = (
        # Ensure a user can only have one role per organization
        UniqueConstraint('org_id', 'user_id', name='uix_org_user'),
    )


