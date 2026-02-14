
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.db import get_db
from app.dependencies.auth_dependencies import get_current_user
from app.crud.organizations import create_organization as create_organization_crud, add_user_to_organization, require_org_admin, list_organization_users as list_organization_users_crud, delete_organization as delete_organization_crud, add_user_to_org as add_user_to_org_crud, remove_user_from_org as remove_user_from_org_crud, update_user_role_in_org as update_user_role_in_org_crud
from app.schemas.orgs import OrgCreateRequest, UpdateOrgUserRequest, AddUserRequest
from app.security.rate_limit import limiter


router = APIRouter()

@router.post("/")
@limiter.limit("60/minute")
def create_organization(request: Request, org: OrgCreateRequest, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    db_org = create_organization_crud(db, name=org.name)
    add_user_to_organization(db, org_id=db_org.id, user_id=current_user.id, role="admin")
    return {"id": db_org.id, "name": db_org.name}

@router.delete("/{org_id}")
@limiter.limit("60/minute")
def delete_organization(request: Request, org_id: str, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    org_membership = require_org_admin(db, org_id=org_id, user_id=str(current_user.id))
    if org_membership is False:
        raise HTTPException(status_code=403, detail="Admin role required")
    elif org_membership is None:
        raise HTTPException(status_code=404, detail="Organization not found")
    success = delete_organization_crud(db, org_id)
    if success:
        return {"message": "Organization deleted successfully"}
    else:
        return {"error": "Organization not found"}
    
@router.get("/{org_id}/users")
@limiter.limit("100/minute")
def list_organization_users(request: Request, org_id: str, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    membership = require_org_admin(db, org_id=org_id, user_id=str(current_user.id))
    if membership is False:
        raise HTTPException(status_code=403, detail="Admin role required")
    elif membership is None:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    members = list_organization_users_crud(db, org_id)
    return [{"user_id": m.user_id, "role": m.role, "name": m.user.name, "email": m.user.email} for m in members]

@router.post("/{org_id}/users")
@limiter.limit("60/minute")
def add_user_to_org(request: Request, payload: AddUserRequest, org_id: str, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    membership = require_org_admin(db, org_id=org_id, user_id=str(current_user.id))
    if membership is False:
        raise HTTPException(status_code=403, detail="Admin role required")
    elif membership is None:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    new_membership = add_user_to_org_crud(db, org_id=org_id, email=payload.email, role=payload.role)
    return {"user_id": new_membership.user_id, "role": new_membership.role}

@router.delete("/{org_id}/users/{user_id}")
@limiter.limit("60/minute")
def remove_user_from_org(request: Request, org_id: str, user_id: str, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    membership = require_org_admin(db, org_id=org_id, user_id=str(current_user.id))
    if membership is False:
        raise HTTPException(status_code=403, detail="Admin role required")
    elif membership is None:
        raise HTTPException(status_code=404, detail="Organization not found")
    if user_id == str(current_user.id):
        raise HTTPException(status_code=400, detail="Cannot remove self from organization")
    success = remove_user_from_org_crud(db, org_id=org_id, user_id=user_id)
    if success:
        return {"message": "User removed from organization"}
    else:
        return {"error": "User not found in organization"}
    
@router.patch("/{org_id}/users/{user_id}")
@limiter.limit("60/minute")
def update_user_role_in_org(request: Request, update_req: UpdateOrgUserRequest, org_id: str, user_id: str, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    membership = require_org_admin(db, org_id=org_id, user_id=str(current_user.id))
    if membership is False:
        raise HTTPException(status_code=403, detail="Admin role required")
    elif membership is None:
        raise HTTPException(status_code=404, detail="Organization not found")
    if user_id == str(current_user.id):
        raise HTTPException(status_code=400, detail="Cannot change role of self")
    if update_req.role not in ["admin", "member"]:
        raise HTTPException(status_code=400, detail="Invalid role specified")
    updated_membership = update_user_role_in_org_crud(db, org_id=org_id, user_id=user_id, new_role=update_req.role)
    if not updated_membership:
        raise HTTPException(status_code=404, detail="User not found in organization")
    return {"user_id": updated_membership.user_id, "role": updated_membership.role}
