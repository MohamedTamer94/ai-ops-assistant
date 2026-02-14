from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Request
from sqlalchemy.orm import Session

from app.db import get_db
from app.dependencies.auth_dependencies import get_current_user
from app.crud.organizations import require_org_member
from app.crud.ingestions import create_ingestion as create_ingestion_crud, check_ingestion_in_project, get_finding_details, get_group_overview, get_ingestion_scoped, get_ingestions_for_project, get_ingestion_stats, get_top_fingerprints_for_ingestion, list_ingestion_events, serialize_log, create_insights_data, delete_ingestion
from app.crud.projects import check_project_in_organization
from app.schemas.ingestions import IngestionCreateRequest, IngestionPasteLogsRequest, InsightGenRequest
from app.utils.storage import save_ingestion_text
from app.tasks.ingestion_processing import process_ingestion
from app.models.ai_analysis import AiAnalysis
from app.utils.ai_insights import generate_insights as generate_insights_util
from app.crud.ai_analyses import create_ai_analysis, find_ai_analysis
from app.security.rate_limit import limiter

router = APIRouter()

@router.post("/")
@limiter.limit("30/minute")
def create_ingestion(request: Request, org_id: str, project_id: str, payload: IngestionCreateRequest, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    org_membership = require_org_member(db, org_id, current_user.id)
    if not org_membership:
        raise HTTPException(status_code=403, detail="Not a member of this organization")
    project = check_project_in_organization(db, project_id=project_id, org_id=org_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found in this organization")
    ingestion = create_ingestion_crud(db, project_id=project.id, source_type=payload.source_type, status="pending")
    return {"id": ingestion.id, "project_id": ingestion.project_id, "source_type": ingestion.source_type, "status": ingestion.status}

@router.post("/{ingestion_id}/logs/paste")
@limiter.limit("30/minute")
def paste_logs(request: Request, org_id: str, project_id: str, ingestion_id: str, payload: IngestionPasteLogsRequest, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    org_membership = require_org_member(db, org_id, current_user.id)
    if not org_membership:
        raise HTTPException(status_code=403, detail="Not a member of this organization")
    project = check_project_in_organization(db, project_id=project_id, org_id=org_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found in this organization")
    ingestion = check_ingestion_in_project(db, ingestion_id=ingestion_id, project_id=project.id)
    if not ingestion:
        raise HTTPException(status_code=404, detail="Ingestion not found in this project")
    save_ingestion_text(ingestion_id, payload.text)
    process_ingestion.delay(ingestion_id)
    return {"message": "Logs saved successfully."}

@router.post("/{ingestion_id}/logs/upload")
@limiter.limit("30/minute")
def upload_logs(request: Request, org_id: str, project_id: str, ingestion_id: str, file: UploadFile = File(...), db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    org_membership = require_org_member(db, org_id, current_user.id)
    if not org_membership:
        raise HTTPException(status_code=403, detail="Not a member of this organization")
    project = check_project_in_organization(db, project_id=project_id, org_id=org_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found in this organization")
    ingestion = check_ingestion_in_project(db, ingestion_id=ingestion_id, project_id=project.id)
    if not ingestion:
        raise HTTPException(status_code=404, detail="Ingestion not found in this project")
    content = file.file.read().decode("utf-8")
    save_ingestion_text(ingestion_id, content)
    process_ingestion.delay(ingestion_id)
    return {"message": "Logs uploaded and saved successfully."}
    
@router.get("/{ingestion_id}")
@limiter.limit("60/minute")
def get_ingestion(request: Request, org_id: str, project_id: str, ingestion_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    org_membership = require_org_member(db, org_id, current_user.id)
    if not org_membership:
        raise HTTPException(status_code=403, detail="Not a member of this organization")
    ingestion = get_ingestion_scoped(db, ingestion_id=ingestion_id, project_id=project_id, org_id=org_id)
    if not ingestion:
        raise HTTPException(status_code=404, detail="Ingestion not found in this project and organization")
    return {"id": ingestion.id, "project_id": ingestion.project_id, "source_type": ingestion.source_type, "status": ingestion.status}

@router.get("/{ingestion_id}/overview")
@limiter.limit("60/minute")
def get_ingestion_overview(request: Request, org_id: str, project_id: str, ingestion_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    org_membership = require_org_member(db, org_id, current_user.id)
    if not org_membership:
        raise HTTPException(status_code=403, detail="Not a member of this organization")
    ingestion = get_ingestion_scoped(db, ingestion_id=ingestion_id, project_id=project_id, org_id=org_id)
    if not ingestion:
        raise HTTPException(status_code=404, detail="Ingestion not found in this project and organization")
    stats = get_ingestion_stats(db, ingestion=ingestion)
    return {
        "ingestion": 
            {
                "id": ingestion.id, 
                "project_id": ingestion.project_id,
                "source_type": ingestion.source_type,
                "status": ingestion.status, 
                "finding_status": ingestion.finding_status,
            },
        "stats": {
            "total_events": stats["total_events"],
            "total_events_with_ts": stats["total_events_with_ts"],
            "time_range": {
                "min_ts": stats["min_ts"],
                "max_ts": stats["max_ts"],
            },
            "levels": stats["level_counts"],
            "services_top": stats["service_counts"],
        },
        "groups": {
            "top": stats["top_fingerprints"]
        },
        "findings": {
            "count": len(stats["findings"]),
            "items": stats["findings"],
        }
    }    

@router.get("/{ingestion_id}/groups")
@limiter.limit("60/minute")
def get_ingestion_groups(request: Request, org_id: str, project_id: str, ingestion_id: str, offset: int = 0, limit: int = 10, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    org_membership = require_org_member(db, org_id, current_user.id)
    if not org_membership:
        raise HTTPException(status_code=403, detail="Not a member of this organization")
    ingestion = get_ingestion_scoped(db, ingestion_id=ingestion_id, project_id=project_id, org_id=org_id)
    if not ingestion:
        raise HTTPException(status_code=404, detail="Ingestion not found in this project and organization")
    groups = get_top_fingerprints_for_ingestion(db=db, ingestion_id=ingestion.id, limit=limit + 1, offset=offset)
    page = groups[:limit]
    has_more = len(groups) > limit
    next_offset = offset + limit if has_more else None
    return {"items": page, "next_offset": next_offset, "has_more": has_more}

@router.get("/")
@limiter.limit("60/minute")
def list_ingestions(request: Request, org_id: str, project_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    org_membership = require_org_member(db, org_id, current_user.id)
    if not org_membership:
        raise HTTPException(status_code=403, detail="Not a member of this organization")
    project = check_project_in_organization(db, project_id=project_id, org_id=org_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found in this organization")
    ingestions = get_ingestions_for_project(db, project_id=project.id)
    return [{"id": ingestion.id, "project_id": ingestion.project_id, "source_type": ingestion.source_type, "status": ingestion.status} for ingestion in ingestions]

@limiter.limit("60/minute")
@router.get("/{ingestion_id}/events")
def get_ingestion_events(request: Request, org_id: str, project_id: str, ingestion_id: str, 
                         cursor: int = 0, limit: int = Query(100, gt=0, le=500), 
                         levels: Optional[str] = Query(None), service: Optional[str] = Query(None), 
                         fingerprint: Optional[str] = Query(None), ts_from: Optional[datetime] = Query(None), 
                         ts_to: Optional[datetime] = Query(None), q: Optional[str] = Query(None), 
                         db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    org_membership = require_org_member(db, org_id, current_user.id)
    if not org_membership:
        raise HTTPException(status_code=403, detail="Not a member of this organization")
    ingestion = get_ingestion_scoped(db, ingestion_id=ingestion_id, project_id=project_id, org_id=org_id)
    if not ingestion:
        raise HTTPException(status_code=404, detail="Ingestion not found in this project and organization")
    events = list_ingestion_events(db, ingestion_id=ingestion.id, cursor=cursor, limit=limit + 1, levels=levels, service=service, fingerprint=fingerprint, ts_from=ts_from, ts_to=ts_to, q=q)
    page = events[:limit]
    has_more = len(events) > limit
    next_cursor = page[-1].seq if (has_more and page) else None
    return {"items": [serialize_log(event) for event in page], "next_cursor": next_cursor, "has_more": has_more}

@router.get("/{ingestion_id}/findings")
@limiter.limit("60/minute")
def get_ingestion_findings(request: Request, org_id: str, project_id: str, ingestion_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    org_membership = require_org_member(db, org_id, current_user.id)
    if not org_membership:
        raise HTTPException(status_code=403, detail="Not a member of this organization")
    ingestion = get_ingestion_scoped(db, ingestion_id=ingestion_id, project_id=project_id, org_id=org_id)
    if not ingestion:
        raise HTTPException(status_code=404, detail="Ingestion not found in this project and organization")
    findings = ingestion.findings or []
    return {"count": len(findings), "items": findings}

@limiter.limit("60/minute")
@router.get("/{ingestion_id}/findings/{finding_id}")
def get_ingestion_finding_details(request: Request, org_id: str, project_id: str, ingestion_id: str, finding_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    org_membership = require_org_member(db, org_id, current_user.id)
    if not org_membership:
        raise HTTPException(status_code=403, detail="Not a member of this organization")
    ingestion = get_ingestion_scoped(db, ingestion_id=ingestion_id, project_id=project_id, org_id=org_id)
    if not ingestion:
        raise HTTPException(status_code=404, detail="Ingestion not found in this project and organization")
    finding = get_finding_details(db, finding_id=finding_id, ingestion_id=ingestion.id)
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found in this ingestion")
    ai_insight = db.query(AiAnalysis).filter_by(ingestion_id=ingestion.id, scope_type="finding", scope_id=finding_id).first()
    insight_result = ai_insight.result if ai_insight else None
    return {
        "finding": finding["finding"],
        "evidence_preview": finding["evidence_preview"],
        "insight": insight_result,
    }
@limiter.limit("60/minute")
@router.get("/{ingestion_id}/groups/{fingerprint}")
def get_ingestion_group_details(request: Request, org_id: str, project_id: str, ingestion_id: str, fingerprint: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    org_membership = require_org_member(db, org_id, current_user.id)
    if not org_membership:
        raise HTTPException(status_code=403, detail="Not a member of this organization")
    ingestion = get_ingestion_scoped(db, ingestion_id=ingestion_id, project_id=project_id, org_id=org_id)
    if not ingestion:
        raise HTTPException(status_code=404, detail="Ingestion not found in this project and organization")
    events = get_group_overview(db, ingestion_id=ingestion.id, fingerprint=fingerprint)
    if not events:
        raise HTTPException(status_code=404, detail="Group not found in this ingestion")
    ai_insight = db.query(AiAnalysis).filter_by(ingestion_id=ingestion.id, scope_type="group", scope_id=fingerprint).first()
    insight_result = ai_insight.result if ai_insight else None
    return {
        "group": {
            "fingerprint": fingerprint,
            "total_events": events["count"],
            "first_seen": events["first_seen"],
            "last_seen": events["last_seen"],
            "sample": serialize_log(events["sample"]) if events["sample"] else None,
            "latest": serialize_log(events["latest"]) if events["latest"] else None,
        },
        "breakdown": {
            "levels": events["level_counts"],
            "services": events["service_counts"],
        },
        "insight": insight_result,
    }

@limiter.limit("20/minute")
@router.post("/{ingestion_id}/insights")
def generate_insights(request: Request, payload: InsightGenRequest, org_id: str, project_id: str, ingestion_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    org_membership = require_org_member(db, org_id, current_user.id)
    if not org_membership:
        raise HTTPException(status_code=403, detail="Not a member of this organization")
    ingestion = get_ingestion_scoped(db, ingestion_id=ingestion_id, project_id=project_id, org_id=org_id)
    if not ingestion:
        raise HTTPException(status_code=404, detail="Ingestion not found in this project and organization")
    if ingestion.status != "done":
        raise HTTPException(status_code=400, detail="Ingestion must be in 'done' status to generate insights")
    # check if there's existing insight for this scope
    existing_insight = find_ai_analysis(db, ingestion_id=ingestion.id, scope_type=payload.scope_type, scope_id=payload.fingerprint or payload.finding_id)
    if existing_insight:
        db.delete(existing_insight)
        db.commit()
    insight_data, error = create_insights_data(db, payload.scope_type, ingestion, fingerprint=payload.fingerprint, finding_id=payload.finding_id)
    if not insight_data:
        raise HTTPException(status_code=400, detail=error)
    print(insight_data)
    result = generate_insights_util(insight_data)
    create_ai_analysis(db, ingestion_id=ingestion.id, scope_type=payload.scope_type, scope_id=payload.fingerprint or payload.finding_id, result=result)
    return {"insight": result}

@limiter.limit("60/minute")
@router.delete("/{ingestion_id}")
def delete_ingestion_endpoint(request: Request, org_id: str, project_id: str, ingestion_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    org_membership = require_org_member(db, org_id, current_user.id)
    if not org_membership:
        raise HTTPException(status_code=403, detail="Not a member of this organization")
    ingestion = get_ingestion_scoped(db, ingestion_id=ingestion_id, project_id=project_id, org_id=org_id)
    if not ingestion:
        raise HTTPException(status_code=404, detail="Ingestion not found in this project and organization")
    delete_ingestion(db, ingestion)
    return {"message": "Ingestion deleted successfully."}