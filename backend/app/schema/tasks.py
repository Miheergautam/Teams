from pydantic import BaseModel, Field
from enum import Enum
from typing import List, Optional
from datetime import datetime


class TaskStatus(str, Enum):
    TODO = "TODO"
    IN_PROGRESS = "IN_PROGRESS"
    DONE = "DONE"


class Task(BaseModel):
    name: str
    description: str = ""
    project_id: str

    assigned_to: List[str] = Field(default_factory=list)
    created_by: str

    status: TaskStatus = TaskStatus.TODO

    due_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None


class CreateTaskRequest(BaseModel):
    name: str = Field(..., min_length=3)
    description: str = ""
    assigned_to: List[str] = Field(default_factory=list)
    due_date: Optional[datetime] = None


class UpdateTaskRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    assigned_to: Optional[List[str]] = None
    status: Optional[TaskStatus] = None
    due_date: Optional[datetime] = None