
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.dependencies.auth_dependencies import get_current_user
from app.crud.organizations import create_organization as create_organization_crud, add_user_to_organization
from app.schemas.orgs import OrgCreateRequest


router = APIRouter()

@router.post("/")
def create_organization(org: OrgCreateRequest, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    db_org = create_organization_crud(db, name=org.name)
    add_user_to_organization(db, org_id=db_org.id, user_id=current_user.id, role="admin")
    return {"id": db_org.id, "name": db_org.name}