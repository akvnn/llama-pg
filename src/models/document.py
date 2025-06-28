import datetime
import uuid
from pydantic import BaseModel, field_validator
from enum import Enum


class DocumentStatus(str, Enum):
    PENDING = "Pending"
    QUEUED_PARSING = "Queued for Parsing"
    QUEUED_EMBEDDING = "Queued for Embedding"
    READY = "Ready for Search"


class DocumentInfo(BaseModel):
    project_name: str
    document_type: str
    document_status: DocumentStatus
    document_id: uuid.UUID
    created_at: datetime.datetime
    updated_at: datetime.datetime | None = None


class DocumentDetail(BaseModel):
    document_name: str
    document_type: str
    document_status: DocumentStatus
    document_id: uuid.UUID
    created_at: datetime.datetime
    updated_at: datetime.datetime | None = None
    parsed_markdown_text: str | None = None
    summary: str | None = None


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
