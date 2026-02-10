from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.dependencies.auth_dependencies import get_current_user
from app.schemas.projects import ProjectCreateRequest
from app.crud.projects import create_project as create_project_crud, get_projects_by_org
from app.crud.organizations import get_membership, require_org_admin

router = APIRouter()

@router.post("/")
def create_project(
    org_id: str,
    project: ProjectCreateRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    membership = get_membership(db, org_id=org_id, user_id=str(current_user.id))
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this organization")
    if membership.role != "admin":
        raise HTTPException(status_code=403, detail="Admin role required")

    db_project = create_project_crud(db, org_id=org_id, name=project.name)
    return {"id": db_project.id, "name": db_project.name, "org_id": db_project.org_id}

@router.get("/")
def list_projects(
    org_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    membership = get_membership(db, org_id=org_id, user_id=str(current_user.id))
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this organization")

    projects = get_projects_by_org(db, org_id=org_id)
    return [{"id": p.id, "name": p.name, "org_id": p.org_id} for p in projects]

@router.delete("/{project_id}")
def delete_project(
    project_id: str,
    org_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    membership = require_org_admin(db, org_id=org_id, user_id=str(current_user.id))
    if membership is False:
        raise HTTPException(status_code=403, detail="Admin role required")
    elif membership is None:
        raise HTTPException(status_code=404, detail="Organization not found")
    success = delete_project(db, project_id)
    if success:
        return {"message": "Project deleted successfully"}
    else:
        return {"error": "Project not found"}