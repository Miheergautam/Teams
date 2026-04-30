from pydantic import BaseModel, Field
from enum import Enum

class ProjectRole(str, Enum):
    OWNER = "OWNER"
    MEMBER = "MEMBER"

class CreateProjectRequest(BaseModel):
    name: str = Field(..., min_length=3)
    description: str = ""

class AddMemberRequest(BaseModel):
    user_id: str
    role: ProjectRole = ProjectRole.MEMBER