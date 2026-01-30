from fastapi import APIRouter, Depends

from sqlalchemy.orm import Session

from app.schemas.projects import ProjectCreateRequest
from app.crud.projects import create_project as create_project_crud, get_projects_by_org
from app.db import get_db

router = APIRouter()

@router.post("/")
async def create_project(db: Session = Depends(get_db), org_id: str = None, project: ProjectCreateRequest = None):
    db_project = create_project_crud(db, org_id=org_id, name=project.name)
    return {"id": db_project.id, "name": db_project.name, "org_id": db_project.org_id}

@router.get("/")
async def list_projects(db: Session = Depends(get_db), org_id: str = None):
    projects = get_projects_by_org(db, org_id=org_id)
    return [{"id": project.id, "name": project.name, "org_id": project.org_id} for project in projects]