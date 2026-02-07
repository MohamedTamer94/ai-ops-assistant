from sqlalchemy import func, desc
from app.models.ingestion import Ingestion
from app.crud.projects import check_project_in_organization
from app.models.log_event import LogEvent

def create_ingestion(db, project_id, source_type, status="pending"):
    ingestion = Ingestion(
        project_id=project_id,
        source_type=source_type,
        status=status,
    )
    db.add(ingestion)
    db.commit()
    db.refresh(ingestion)
    return ingestion

def check_ingestion_in_project(db, ingestion_id, project_id):
    ingestion = db.query(Ingestion).filter(Ingestion.id == ingestion_id, Ingestion.project_id == project_id).first()
    return ingestion

def get_ingestion_scoped(db, ingestion_id, project_id, org_id):
    project = check_project_in_organization(db, project_id=project_id, org_id=org_id)
    if not project:
        return None
    ingestion = check_ingestion_in_project(db, ingestion_id=ingestion_id, project_id=project.id)
    if not ingestion:
        return None
    return ingestion

def get_ingestions_for_project(db, project_id):
    return db.query(Ingestion).filter(Ingestion.project_id == project_id).all()

def get_top_fingerprints_for_ingestion(db, ingestion_id, limit=10):
    subq = db.query(
        LogEvent,
        func.count(LogEvent.id).over(partition_by=LogEvent.fingerprint).label('fp_count'),
        func.row_number().over(
            partition_by=LogEvent.fingerprint, 
            order_by=[LogEvent.seq.desc()]
        ).label('rn')
    ).filter(LogEvent.ingestion_id == ingestion_id).subquery()

    top_errors_query = db.query(subq).filter(subq.c.rn == 1).order_by(desc(subq.c.fp_count)).limit(limit).all()

    top_error_groups = []
    for row in top_errors_query:
        top_error_groups.append({
            "fingerprint": row.fingerprint,
            "count": row.fp_count,
            "latest": serialize_log(row)
        })

    return top_error_groups

def get_evidence_ids_for_fingerprint(db, ingestion_id: str, fingerprint: str, head=5, tail=5):
    head_rows = (
        db.query(LogEvent.id)
        .filter(LogEvent.ingestion_id == ingestion_id, LogEvent.fingerprint == fingerprint)
        .order_by(LogEvent.seq.asc())
        .limit(head)
        .all()
    )
    tail_rows = (
        db.query(LogEvent.id)
        .filter(LogEvent.ingestion_id == ingestion_id, LogEvent.fingerprint == fingerprint)
        .order_by(LogEvent.seq.desc())
        .limit(tail)
        .all()
    )
    # Dedup while preserving order-ish
    ids = [r.id for r in head_rows] + [r.id for r in tail_rows]
    seen = set()
    out = []
    for _id in ids:
        if _id not in seen:
            seen.add(_id)
            out.append(_id)
    return out

def get_ingestion_stats(db, ingestion):
    ingestion_id = ingestion.id
    # 1. Basic stats
    base_stats = db.query(
        func.count(LogEvent.id),
        func.count(LogEvent.ts).label("events_with_ts"),
        func.min(LogEvent.ts),
        func.max(LogEvent.ts)
    ).filter(LogEvent.ingestion_id == ingestion_id).one()

    # 2. Level & Service counts
    level_counts = db.query(LogEvent.level, func.count(LogEvent.id)).filter(LogEvent.ingestion_id == ingestion_id).group_by(LogEvent.level).all()
    service_counts = db.query(LogEvent.service, func.count(LogEvent.id)).filter(LogEvent.ingestion_id == ingestion_id).group_by(LogEvent.service).all()

    # 3- We use a subquery to find the latest log per fingerprint using window functions
    top_error_groups = get_top_fingerprints_for_ingestion(db, ingestion_id)

    return {
        "total_events": base_stats[0],
        "total_events_with_ts": base_stats[1],
        "min_ts": base_stats[2],
        "max_ts": base_stats[3],
        "level_counts": {l or "UNKNOWN": c for l, c in level_counts},
        "service_counts": {s or "unknown": c for s, c in service_counts},
        "top_fingerprints": top_error_groups,
        "findings": ingestion.findings or []
    }

def serialize_log(log_event):
    return {
        "id": log_event.id,
        "ts": log_event.ts.isoformat() if log_event.ts else None,
        "service": log_event.service,
        "level": log_event.level,
        "seq": log_event.seq,
        "message": log_event.message,
        "fingerprint": log_event.fingerprint,
    }

def list_ingestion_events(db, ingestion_id, cursor=0, limit=100):
    events_query = db.query(LogEvent).filter(LogEvent.ingestion_id == ingestion_id, LogEvent.seq > cursor).order_by(LogEvent.seq.asc()).limit(limit)
    events = events_query.all()
    return events