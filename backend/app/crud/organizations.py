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

def get_membership(db: Session, org_id: str, user_id: str):
    return (
        db.query(OrganizationMember)
        .filter(OrganizationMember.org_id == org_id,
                OrganizationMember.user_id == user_id)
        .first()
    )

def require_org_member(db: Session, org_id: str, user_id: str):
    m = get_membership(db, org_id, user_id)
    return m

def require_org_admin(db: Session, org_id: str, user_id: str):
    m = get_membership(db, org_id, user_id)
    if not m:
        return None
    return m if m.role == "admin" else False

def delete_organization(db: Session, org_id: str):
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if org:
        db.delete(org)
        db.commit()
        return True
    return False