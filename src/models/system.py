import datetime
from pydantic import BaseModel
from typing import Dict


class ErrorInfo(BaseModel):
    message: str
    details: Dict[str, str]
    recorded_at: datetime.datetime


class StatInfo(BaseModel):
    total_count: int
    projects_count: int
    status_counts: Dict[str, int]


class SystemResponse(BaseModel):
    items: list[ErrorInfo]
