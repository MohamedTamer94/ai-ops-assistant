from app.models.organization import Organization
from app.models.org_member import OrganizationMember
from sqlalchemy.orm import Session

def create_organization(db: Session, name: str):
    db_org = Organization(name=name)
    db.add(db_org)
    db.commit()
    db.refresh(db_org)
    return db_org

def add_user_to_organization(db: Session, org_id: str, user_id: str, role: str = "member"):
    db_org_member = OrganizationMember(org_id=org_id, user_id=user_id, role=role)
    db.add(db_org_member)
    db.commit()
    db.refresh(db_org_member)
    return db_org_member