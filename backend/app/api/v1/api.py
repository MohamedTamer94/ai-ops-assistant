

from fastapi import APIRouter

from app.api.v1.endpoints import auth, orgs, projects, ingestions

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(orgs.router, prefix="/orgs", tags=["orgs"])
api_router.include_router(projects.router, prefix="/orgs/{org_id}/projects", tags=["projects"])
api_router.include_router(ingestions.router, prefix="/orgs/{org_id}/projects/{project_id}/ingestions", tags=["ingestions"])