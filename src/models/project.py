from pydantic import BaseModel


class ProjectInfo(BaseModel):
    project_name: str
    number_of_documents: int
