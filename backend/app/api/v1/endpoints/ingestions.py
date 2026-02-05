from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.dependencies.auth_dependencies import get_current_user
from app.crud.organizations import require_org_member
from app.crud.ingestions import create_ingestion as create_ingestion_crud, check_ingestion_in_project, get_ingestion_scoped, get_ingestions_for_project
from app.crud.projects import check_project_in_organization
from app.schemas.ingestions import IngestionCreateRequest, IngestionPasteLogsRequest
from app.utils.storage import save_ingestion_text

router = APIRouter()

@router.post("/")
def create_ingestion(org_id: str, project_id: str, payload: IngestionCreateRequest, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    org_membership = require_org_member(db, org_id, current_user.id)
    if not org_membership:
        raise HTTPException(status_code=403, detail="Not a member of this organization")
    project = check_project_in_organization(db, project_id=project_id, org_id=org_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found in this organization")
    ingestion = create_ingestion_crud(db, project_id=project.id, source_type=payload.source_type, status="pending")
    return {"id": ingestion.id, "project_id": ingestion.project_id, "source_type": ingestion.source_type, "status": ingestion.status}

@router.post("/{ingestion_id}/logs/paste")
def paste_logs(org_id: str, project_id: str, ingestion_id: str, payload: IngestionPasteLogsRequest, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
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
    return {"message": "Logs saved successfully."}
    
@router.get("/{ingestion_id}")
def get_ingestion(org_id: str, project_id: str, ingestion_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    org_membership = require_org_member(db, org_id, current_user.id)
    if not org_membership:
        raise HTTPException(status_code=403, detail="Not a member of this organization")
    ingestion = get_ingestion_scoped(db, ingestion_id=ingestion_id, project_id=project_id, org_id=org_id)
    if not ingestion:
        raise HTTPException(status_code=404, detail="Ingestion not found in this project and organization")
    return {"id": ingestion.id, "project_id": ingestion.project_id, "source_type": ingestion.source_type, "status": ingestion.status}

@router.get("/")
def list_ingestions(org_id: str, project_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    org_membership = require_org_member(db, org_id, current_user.id)
    if not org_membership:
        raise HTTPException(status_code=403, detail="Not a member of this organization")
    project = check_project_in_organization(db, project_id=project_id, org_id=org_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found in this organization")
    ingestions = get_ingestions_for_project(db, project_id=project.id)
    return [{"id": ingestion.id, "project_id": ingestion.project_id, "source_type": ingestion.source_type, "status": ingestion.status} for ingestion in ingestions]