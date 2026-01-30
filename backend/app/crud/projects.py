from app.models.project import Project
from sqlalchemy.orm import Session

def create_project(db: Session, org_id: str, name: str):
    project = Project(org_id=org_id, name=name)
    db.add(project)
    db.commit()
    db.refresh(project)
    return project

def get_projects_by_org(db: Session, org_id: str):
    return db.query(Project).filter(Project.org_id == org_id).all()