from pydantic import BaseModel
from typing import Literal

class IngestionCreateRequest(BaseModel):
    source_type: Literal["paste", "upload", "bundle"]

class IngestionPasteLogsRequest(BaseModel):
    text: str