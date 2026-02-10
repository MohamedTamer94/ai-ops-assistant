
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.dependencies.auth_dependencies import get_current_user
from app.crud.organizations import create_organization as create_organization_crud, add_user_to_organization, require_org_admin
from app.schemas.orgs import OrgCreateRequest


router = APIRouter()

@router.post("/")
def create_organization(org: OrgCreateRequest, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    db_org = create_organization_crud(db, name=org.name)
    add_user_to_organization(db, org_id=db_org.id, user_id=current_user.id, role="admin")
    return {"id": db_org.id, "name": db_org.name}

@router.delete("/{org_id}")
def delete_organization(org_id: str, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    org_membership = require_org_admin(db, org_id=org_id, user_id=str(current_user.id))
    if org_membership is False:
        raise HTTPException(status_code=403, detail="Admin role required")
    elif org_membership is None:
        raise HTTPException(status_code=404, detail="Organization not found")
    success = delete_organization(db, org_id)
    if success:
        return {"message": "Organization deleted successfully"}
    else:
        return {"error": "Organization not found"}