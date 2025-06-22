from typing import Optional
from pydantic import BaseModel, Field, field_validator


class ProjectRequest(BaseModel):
    """Base document model"""

    project_name: str = Field(..., description="Project name")
    table_name: Optional[str] = Field("wiki", description="Table name")

    @field_validator("project_name")
    @classmethod
    def validate_project_name(cls, v):
        if v is not None and str(v).lower() == "ai":
            raise ValueError("Project name cannot be 'ai' as it is used by pgai")
        return v

    @field_validator("table_name")
    @classmethod
    def validate_table_name(cls, v):
        if v is not None and str(v).startswith("parser"):
            raise ValueError("Table name cannot start with 'parser'")
        return v


class RAGRequest(BaseModel):
    """RAG request model"""

    project_name: str = Field(..., description="Project name")
    table_name: Optional[str] = Field("wiki_embedding", description="Table name")
    query: str = Field(..., description="Query string")
    limit: Optional[int] = Field(5, ge=1, description="Number of results to return")
