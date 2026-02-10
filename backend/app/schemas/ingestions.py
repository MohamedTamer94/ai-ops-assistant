from pydantic import BaseModel
from typing import Literal, Optional

class IngestionCreateRequest(BaseModel):
    source_type: Literal["paste", "upload", "bundle"]

class IngestionPasteLogsRequest(BaseModel):
    text: str

class InsightGenRequest(BaseModel):
    scope_type: Literal["group", "finding"]
    fingerprint: Optional[str] = None
    finding_id: Optional[str] = None