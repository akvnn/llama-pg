from typing import Optional
import uuid
from pydantic import BaseModel, field_validator
from enum import Enum


class DocumentStatus(str, Enum):
    QUEUED = "queued"
    PARSED = "parsed"
    EMBEDDED = "embedded"


class DocumentInfo(BaseModel):
    project_name: str
    document_type: str
    document_status: DocumentStatus
    document_id: uuid.UUID


class DocumentDetail(BaseModel):
    document_name: str
    raw_text: str
    parsed_markdown_text: Optional[str]
    document_id: uuid.UUID


class DocumentParamsRequest(BaseModel):
    """Document model"""

    project_name: str
    document_id: uuid.UUID

    @field_validator("project_name")
    @classmethod
    def validate_project_name(cls, v):
        if v is not None and str(v).lower() == "ai":
            raise ValueError("Project name cannot be 'ai' as it is used by pgai")
        return v
