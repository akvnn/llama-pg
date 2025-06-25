from datetime import datetime
from pydantic import BaseModel


class ErrorInfo(BaseModel):
    message: str
    code: int
    timestamp: datetime.datetime


class StatInfo(BaseModel):
    queued_count: int
    parsed_count: int
    embedded_count: int


class SystemResponse(BaseModel):
    items: list[ErrorInfo | StatInfo]
