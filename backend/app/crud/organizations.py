from app.models.organization import Organization
from app.models.org_member import OrganizationMember
from sqlalchemy.orm import Session

from app.models.user import User

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

def list_organization_users(db: Session, org_id: str):
    return (
        db.query(OrganizationMember)
        .filter(OrganizationMember.org_id == org_id)
        .all()
    )

def add_user_to_org(db: Session, org_id: str, email: str, role: str = "member"):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return None
    # check if user is already a member
    existing_membership = db.query(OrganizationMember).filter(OrganizationMember.org_id == org_id, OrganizationMember.user_id == user.id).first()
    if existing_membership:
        return existing_membership
    new_membership = OrganizationMember(org_id=org_id, user_id=user.id, role=role)
    db.add(new_membership)
    db.commit()
    db.refresh(new_membership)
    return new_membership

def remove_user_from_org(db: Session, org_id: str, user_id: str):
    membership = db.query(OrganizationMember).filter(OrganizationMember.org_id == org_id, OrganizationMember.user_id == user_id).first()
    if membership:
        db.delete(membership)
        db.commit()
        return True
    return False

def update_user_role_in_org(db: Session, org_id: str, user_id: str, new_role: str):
    membership = db.query(OrganizationMember).filter(OrganizationMember.org_id == org_id, OrganizationMember.user_id == user_id).first()
    if membership:
        membership.role = new_role
        db.commit()
        db.refresh(membership)
        return membership
    return None