from pydantic import BaseModel, EmailStr
from typing import Optional
from enum import Enum

class Role(str, Enum):
    MEMBER = "MEMBER"
    ADMIN = "ADMIN"

class RegisterRequest(BaseModel):
    firstname: str
    lastname: Optional[str]
    email: EmailStr 
    password: str
    role: Role = Role.MEMBER

class LoginRequest(BaseModel):
    email: EmailStr
    password: str