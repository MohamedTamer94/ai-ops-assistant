
from pydantic import BaseModel


class OrgCreateRequest(BaseModel):
    name: str