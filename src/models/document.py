import base64
import datetime
import uuid
from pydantic import BaseModel, field_validator
from enum import Enum
from dataclasses import dataclass


@dataclass
class DocumentSearchResult:
    """
    Data class representing a search result from the vector database.
    """

    id: int
    title: str
    metadata: dict
    text: str
    project_id: str
    chunk: str
    distance: float

    def __str__(self):
        return f"""WikiSearchResult:
                ID: {self.id}
                Title: {self.title}
                Metadata: {self.metadata}
                Text: {self.text[:100]}...
                Project ID:{self.project_id} 
                Chunk: {self.chunk}
                Distance: {self.distance:.4f}"""


class DocumentStatus(str, Enum):
    PENDING = "Pending"
    QUEUED_PARSING = "Queued for Parsing"
    QUEUED_EMBEDDING = "Queued for Embedding"
    READY = "Ready for Search"


class DocumentInfo(BaseModel):
    document_id: uuid.UUID
    document_uploaded_name: str
    metadata: dict
    status: DocumentStatus
    uploaded_by_user_id: uuid.UUID
    created_at: datetime.datetime
    project_id: uuid.UUID
    project_name: str
    organization_id: str


class DocumentDetail(BaseModel):
    document_name: str
    document_type: str
    metadata: dict
    document_status: DocumentStatus
    document_id: uuid.UUID
    created_at: datetime.datetime
    updated_at: datetime.datetime | None = None
    parsed_markdown_text: str | None = None
    file_bytes: str
    summary: str | None = None
    uploaded_by_user_id: uuid.UUID

    @field_validator("file_bytes", mode="before")
    @classmethod
    def encode_bytes_to_base64(cls, v):
        if isinstance(v, bytes):
            return base64.b64encode(v).decode("utf-8")
        return v


class DocumentParamsRequest(BaseModel):
    """Document model"""

    project_id: str
    organization_id: str
    document_id: uuid.UUID
