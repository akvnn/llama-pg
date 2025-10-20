from typing import Annotated
from pydantic import BaseModel, Field


class ProjectRequest(BaseModel):
    """Base document model"""

    organization_id: str
    project_name: str
    project_description: str


class RAGRequest(BaseModel):
    """RAG request model"""

    project_id: str
    organization_id: str
    query: str
    limit: Annotated[
        int, Field(default=5, ge=1, description="Number of results to return")
    ]
