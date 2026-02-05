from app.models.ingestion import Ingestion
from app.crud.projects import check_project_in_organization

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