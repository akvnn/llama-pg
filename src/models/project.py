import datetime
from pydantic import BaseModel


class ProjectRequest(BaseModel):
    organization_id: str
    project_name: str
    project_description: str


class ProjectInfo(BaseModel):
    project_id: str
    project_name: str
    number_of_documents: int
    created_at: datetime.datetime | None = None
    updated_at: datetime.datetime | None = None
    description: str | None = None
    created_by_user_id: str | None = None
