from sqlalchemy.orm import Session
import uuid
from app.models.ai_analysis import AiAnalysis
from app.utils.ai_insights import generate_prompt

def create_ai_analysis(db: Session, ingestion_id: uuid.UUID, scope_type: str, scope_id: str, result: str) -> AiAnalysis:
    ai_analysis = AiAnalysis(
        ingestion_id=ingestion_id,
        scope_type=scope_type,
        scope_id=scope_id,
        result=result
    )
    db.add(ai_analysis)
    db.commit()
    db.refresh(ai_analysis)
    return ai_analysis

def find_ai_analysis(db: Session, ingestion_id: uuid.UUID, scope_type: str, scope_id: str) -> AiAnalysis | None:
    return db.query(AiAnalysis).filter_by(ingestion_id=ingestion_id, scope_type=scope_type, scope_id=scope_id).first()