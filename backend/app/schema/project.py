from enum import Enum
from typing import List

from pydantic import BaseModel, Field


class ProjectRole(str, Enum):
    OWNER = "OWNER"
    MEMBER = "MEMBER"


class CreateProjectRequest(BaseModel):
    name: str = Field(..., min_length=3)
    description: str = ""


class AddMemberRequest(BaseModel):
    user_id: str
    role: ProjectRole = ProjectRole.MEMBER


class AddMembersRequest(BaseModel):
    user_ids: List[str] = Field(default_factory=list)
    role: ProjectRole = ProjectRole.MEMBER
