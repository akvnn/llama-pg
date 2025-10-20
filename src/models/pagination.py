from typing import Annotated
from fastapi import Query
from pydantic import BaseModel, Field

from src.models.document import DocumentInfo
from src.models.project import ProjectInfo


class PaginationParams(BaseModel):
    skip: Annotated[int, Field(default=0, ge=0, description="Number of items to skip")]
    limit: Annotated[int, Field(default=10, ge=1, le=100, description="Number of items per page")]


def get_pagination_params(
    page: int = Query(1, ge=1, description="Page number (1-based)"),
    per_page: int = Query(10, ge=1, le=100, description="Items per page"),
) -> PaginationParams:
    """Convert page-based to offset-based pagination"""
    skip = (page - 1) * per_page
    return PaginationParams(skip=skip, limit=per_page)


class ParamRequest(BaseModel):
    """Base param model"""

    organization_id: str
    project_id: str | None = None


class PaginationResponse(BaseModel):
    items: list[ProjectInfo | DocumentInfo]
    total_count: int | None = None
    page: int | None = None
    per_page: int | None = None
    total_pages: int
    has_next: bool
    has_previous: bool
