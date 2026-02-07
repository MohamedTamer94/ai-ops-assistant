from app.celery_worker import celery
from app.db import SessionLocal
from app.models.ingestion import Ingestion
from app.utils.storage import read_ingestion_text
from app.models.log_event import LogEvent
from app.utils.fingerprint import make_fingerprint
from app.utils.log_parser import parse_logs
from app.tasks.findings_engine import analyze_logs_for_findings

@celery.task
def process_ingestion(ingestion_id: str):
    db = SessionLocal()
    ingestion = db.query(Ingestion).filter(Ingestion.id == ingestion_id).first()
    try:
        if not ingestion:
            return
        ingestion.status = "processing"
        db.commit()
        logs = read_ingestion_text(ingestion_id)
        parsed_logs = parse_logs(logs)
        events = []
        for seq, log_entry in enumerate(parsed_logs, start=1):
            fingerprint = make_fingerprint(log_entry.get("signature"))
            log_event = LogEvent(
                ingestion_id=ingestion.id,
                ts=log_entry.get("ts"),
                ts_raw=log_entry.get("ts_raw"),
                service=log_entry.get("service"),
                level=log_entry.get("level"),
                seq=seq,
                message=log_entry.get("message", ""),
                fingerprint=fingerprint,
                raw=log_entry.get("raw", ""),
                attrs=log_entry.get("attrs", {}),
                parse_kind=log_entry.get("parse").get("kind") if log_entry.get("parse") else None,
                parse_confidence=log_entry.get("parse").get("confidence") if log_entry.get("parse") else None,
            )
            events.append(log_event)
        db.add_all(events)
        db.commit()
        ingestion.status = "done"
        db.commit()
        analyze_logs_for_findings.delay(ingestion_id)
    except Exception as e:
        ingestion.status = "failed"
        db.commit()
        raise e
    finally:
        db.close()