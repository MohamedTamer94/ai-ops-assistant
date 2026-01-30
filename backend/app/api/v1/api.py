

from fastapi import APIRouter

from app.api.v1.endpoints import auth, orgs, projects

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(orgs.router, prefix="/orgs", tags=["orgs"])
api_router.include_router(projects.router, prefix="/orgs/{org_id}/projects", tags=["projects"])