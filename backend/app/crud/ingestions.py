from sqlalchemy import asc, func, desc
from app.models.ingestion import Ingestion
from app.crud.projects import check_project_in_organization
from app.models.log_event import LogEvent
from app.models.finding import Finding
from app.utils.fingerprint import redact_message

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

def get_top_fingerprints_for_ingestion(db, ingestion_id, limit=10, offset=0):
    subq = db.query(
        LogEvent,
        func.count(LogEvent.id).over(partition_by=LogEvent.fingerprint).label('fp_count'),
        func.row_number().over(
            partition_by=LogEvent.fingerprint, 
            order_by=[LogEvent.seq.desc()]
        ).label('rn')
    ).filter(LogEvent.ingestion_id == ingestion_id).subquery()

    top_errors_query = db.query(subq).filter(subq.c.rn == 1).order_by(desc(subq.c.fp_count), asc(subq.c.fingerprint)).offset(offset).limit(limit).all()

    top_error_groups = []
    for row in top_errors_query:
        top_error_groups.append({
            "fingerprint": row.fingerprint,
            "count": row.fp_count,
            "latest": serialize_log(row)
        })

    return top_error_groups

from sqlalchemy import func

def get_group_overview(db, ingestion_id, fingerprint):
    # 1. Combined Aggregates
    stats = db.query(
        func.count(LogEvent.id),
        func.min(LogEvent.ts),
        func.max(LogEvent.ts)
    ).filter(
        LogEvent.ingestion_id == ingestion_id, 
        LogEvent.fingerprint == fingerprint
    ).one()

    count, first_seen, last_seen = stats

    if count == 0:
        return None

    # 2. Level & Service Distributions
    level_counts = db.query(LogEvent.level, func.count(LogEvent.id)).filter(
        LogEvent.ingestion_id == ingestion_id, LogEvent.fingerprint == fingerprint
    ).group_by(LogEvent.level).all()

    service_counts = db.query(LogEvent.service, func.count(LogEvent.id)).filter(
        LogEvent.ingestion_id == ingestion_id, LogEvent.fingerprint == fingerprint
    ).group_by(LogEvent.service).all()

    # 3. Samples (The Sample and the Latest)
    sample = db.query(LogEvent).filter(
        LogEvent.ingestion_id == ingestion_id, 
        LogEvent.fingerprint == fingerprint
    ).order_by(LogEvent.ts.desc().nullslast(), LogEvent.seq.asc()).first()

    latest = db.query(LogEvent).filter(
        LogEvent.ingestion_id == ingestion_id, 
        LogEvent.fingerprint == fingerprint
    ).order_by(LogEvent.ts.desc().nullslast(),LogEvent.seq.desc()).first()

    return {
        "count": count,
        "first_seen": first_seen,
        "last_seen": last_seen,
        "sample": sample if sample else None,
        "latest": latest if latest else None,
        "level_counts": {l or "UNKNOWN": c for l, c in level_counts},
        "service_counts": {s or "unknown": c for s, c in service_counts}
    }

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

def serialize_log(log_event, redact=None):
    return {
        "id": str(log_event.id),
        "ts": log_event.ts.isoformat() if log_event.ts else None,
        "service": log_event.service,
        "level": log_event.level,
        "seq": log_event.seq,
        "message": log_event.message if not redact else redact_message(log_event.message),
        "fingerprint": log_event.fingerprint,
    }

def list_ingestion_events(db, ingestion_id, cursor=0, limit=100, levels=None, service=None, fingerprint=None, ts_from=None, ts_to=None, q=None):
    events_query = db.query(LogEvent).filter(LogEvent.ingestion_id == ingestion_id, LogEvent.seq > cursor)
    if levels is not None:
        levels_list = [x.strip().upper() for x in levels.split(",") if x.strip()]
        if levels_list:
            events_query = events_query.filter(LogEvent.level.in_(levels_list))
    if service is not None:
        if service == "unknown":
            events_query = events_query.filter((LogEvent.service == None) | (LogEvent.service == ""))
        else:
            events_query = events_query.filter(LogEvent.service == service)
    if fingerprint is not None:
        events_query = events_query.filter(LogEvent.fingerprint == fingerprint)
    if ts_from is not None:
        events_query = events_query.filter(LogEvent.ts >= ts_from)
    if ts_to is not None:
        events_query = events_query.filter(LogEvent.ts <= ts_to)
    if q is not None:
        if q and q.strip():
            events_query = events_query.filter(LogEvent.message.ilike(f"%{q}%"))
    events = events_query.order_by(LogEvent.seq.asc()).limit(limit).all()
    return events

def get_finding_details(db, finding_id, ingestion_id):
    finding = db.query(Finding).filter(Finding.id == finding_id, Finding.ingestion_id == ingestion_id).first()
    if not finding:
        return None
    evidence_preview = db.query(LogEvent).filter(
        LogEvent.ingestion_id == finding.ingestion_id, LogEvent.id.in_(finding.evidence_event_ids)).order_by(LogEvent.seq.asc()).limit(20).all()
    return {
        "finding": finding,
        "evidence_preview": [serialize_log(e) for e in evidence_preview]
    }

def create_insights_data(db, scope_type, ingestion, fingerprint=None, finding_id=None):
    # Collect necessary data for insight generation based on scope
    if scope_type == "group":
        if not fingerprint:
            return None, "Fingerprint is required for group-scoped insights"
        events = get_group_overview(db, ingestion_id=ingestion.id, fingerprint=fingerprint)
        if not events:
            return None, "No events found for this fingerprint"
        insight_data = {
            "type": "group",
            "fingerprint": fingerprint,
            "total_count": events["count"],
            "first_seen": events["first_seen"].isoformat() if events["first_seen"] else None,
            "last_seen": events["last_seen"].isoformat() if events["last_seen"] else None,
            "breakdown": {
                "levels": events["level_counts"],
                "services": events["service_counts"],
            }
        }
        # fetch more events from the group to provide richer context for insight generation
        group_events = list_ingestion_events(db, ingestion_id=ingestion.id, fingerprint=fingerprint, limit=12)
        insight_data["events"] = [serialize_log(event, redact=True) for event in group_events]
        return insight_data, None
    elif scope_type == "finding":
        if not finding_id:
            return None, "Finding ID is required for finding-scoped insights"
        finding = get_finding_details(db, finding_id=finding_id, ingestion_id=ingestion.id)
        if not finding:
            return None, "Finding not found"
        insight_data = {
            "type": "finding",
            "finding_id": finding_id,
            "title": finding["finding"].title,
            "rule_id": finding["finding"].rule_id,
            "severity": finding["finding"].severity,
            "confidence": finding["finding"].confidence,
            "matched_fingerprints": finding["finding"].matched_fingerprints,
        }
        # fetch evidence events to provide richer context for insight generation
        evidence_event_ids = finding["finding"].evidence_event_ids or []
        evidence_events = db.query(LogEvent).filter(LogEvent.ingestion_id == ingestion.id, LogEvent.id.in_(evidence_event_ids)).limit(12).all()
        insight_data["events"] = [serialize_log(event, redact=True) for event in evidence_events]
        return insight_data, None
    else: 
        return None, "Invalid scope type"
    
def delete_ingestion(db, ingestion):
    db.delete(ingestion)
    db.commit()