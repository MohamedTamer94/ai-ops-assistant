
from pydantic import BaseModel


class OrgCreateRequest(BaseModel):
    name: str

class UpdateOrgUserRequest(BaseModel):
    role: str

class AddUserRequest(BaseModel):
    email: str
    role: str = "member"