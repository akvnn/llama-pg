from fastapi import Query
from pydantic import BaseModel, Field, field_validator

from src.models.document import DocumentInfo
from src.models.project import ProjectInfo


class PaginationParams(BaseModel):
    skip: int = Field(0, ge=0, description="Number of items to skip")
    limit: int = Field(10, ge=1, le=100, description="Number of items per page")


def get_pagination_params(
    page: int = Query(1, ge=1, description="Page number (1-based)"),
    per_page: int = Query(10, ge=1, le=100, description="Items per page"),
) -> PaginationParams:
    """Convert page-based to offset-based pagination"""
    skip = (page - 1) * per_page
    return PaginationParams(skip=skip, limit=per_page)


class ParamRequest(BaseModel):
    """Base param model"""

    project_name: str | None = None

    @field_validator("project_name")
    @classmethod
    def validate_project_name(cls, v):
        if v is not None and str(v).lower() == "ai":
            raise ValueError("Project name cannot be 'ai' as it is used by pgai")
        return v


class PaginationResponse(BaseModel):
    items: list[ProjectInfo | DocumentInfo]
    total_count: int | None = None
    page: int | None = None
    per_page: int | None = None
    total_pages: int
    has_next: bool
    has_previous: bool
