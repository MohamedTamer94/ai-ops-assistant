import uuid
from sqlalchemy import JSON, Column, ForeignKey, Index, Integer, Numeric, String, DateTime, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db import Base

class LogEvent(Base):
    __tablename__ = "log_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ingestion_id = Column(UUID(as_uuid=True), ForeignKey("ingestions.id", ondelete="CASCADE"), nullable=False, index=True)

    ts = Column(DateTime(timezone=True), nullable=True)
    ts_raw = Column(String, nullable=True)
    service = Column(String, nullable=True)
    level = Column(String, nullable=True)
    seq = Column(Integer, nullable=False)

    message = Column(Text, nullable=False)
    raw = Column(Text, nullable=False)
    attrs = Column(JSON, nullable=True)
    parse_kind = Column(String, nullable=True)
    parse_confidence = Column(Numeric(precision=3, scale=2), nullable=True) # Decimal from 0 to 1 indicating confidence in parsing
    fingerprint = Column(String, nullable=False, index=True)

    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    ingestion = relationship("Ingestion", back_populates="log_events")
    __table_args__ = (
        UniqueConstraint("ingestion_id", "seq", name="uq_log_events_ingestion_id_seq"),
        Index("ix_log_events_ingestion_id_seq", "ingestion_id", "seq"),
        Index("ix_log_events_ingestion_id_ts", "ingestion_id", "ts"),
        Index("ix_log_events_ingestion_id_fingerprint", "ingestion_id", "fingerprint"),
    )

