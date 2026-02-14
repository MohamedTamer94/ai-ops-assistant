
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from typing import Annotated

from app.crud.users import create_user, get_user_by_email, authenticate_user
from app.db import get_db
from app.schemas.users import RegisterRequest
from app.security.password import hash_password
from app.crud.organizations import create_organization, add_user_to_organization
from app.security.jwt import create_access_token
from app.security.rate_limit import limiter
from app.dependencies.auth_dependencies import get_current_user


router = APIRouter()

@router.post("/register")
@limiter.limit("5/minute")
async def register(request: Request, user: RegisterRequest, db: Session = Depends(get_db)):
    existing = get_user_by_email(db, user.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    password = hash_password(user.password)
    user = create_user(db, user.name, user.email, password)
    organization = create_organization(db, name=user.name + "'s Organization")
    add_user_to_organization(db, org_id=organization.id, user_id=user.id, role="admin")
    return {"id": user.id, "name": user.name, "email": user.email}

@router.post("/login")
@limiter.limit("10/minute")
async def login(request: Request, form_data: Annotated[OAuth2PasswordRequestForm, Depends()], db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token(user_id=str(user.id))
    return {"access_token": token, "token_type": "bearer"}

@router.get("/me")
@limiter.limit("60/minute")
async def read_current_user(request: Request, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    return {"id": current_user.id, "name": current_user.name, "email": current_user.email, "organizations": [{"id": org.id, "name": org.name} for org in current_user.organizations]}
