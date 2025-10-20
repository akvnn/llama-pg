import datetime
from pydantic import BaseModel, field_validator
from typing import Literal
from uuid import UUID


class UserRequest(BaseModel):
    username: str
    password: str

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        return v


class UserResponse(BaseModel):
    token: str
    user_org_ids: list[UUID]


class CreateOrganizationRequest(BaseModel):
    name: str


class CreateOrganizationResponse(BaseModel):
    id: UUID


class OrganizationInfo(BaseModel):
    id: UUID
    name: str
    joined_at: datetime.datetime
    role: str


class OrganizationUserInfo(BaseModel):
    user_id: UUID
    username: str
    joined_at: datetime.datetime
    role: str


class OrganizationUserRequest(BaseModel):
    username: str
    role: Literal["admin", "member"]


class OrganizationUserKickRequest(BaseModel):
    username: str


class OrganizationUserKickResponse(BaseModel):
    username: str
