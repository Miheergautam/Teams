from fastapi import APIRouter, Depends
from app.schema.auth import RegisterRequest, LoginRequest
from app.services.auth_service import register, login, get_all_users

router  = APIRouter(prefix="/auth")

@router.get("/status")
async def get_auth_status():
    return {"status": "auth ok"}

@router.post("/register")
def user_register(request: RegisterRequest):
    user, error = register(request)
    if error:
        return {"message": error}
        
    return {
        "message": "Registration successful",
        "user": user
    }


@router.post("/login")
def user_login(request: LoginRequest):
    user, error = login(request)
    if error:
        return {"message": error}

    return {
        "message": "Login successful",
        "user": user
    }


@router.get("/users")
def get_users():
    users = get_all_users()
    return {"users": users}

@router.get("/user/{id}")
def get_user(user_id: str):
    user = get_user_by_id(user_id)
    if not user:
        return {"message": "User not found"}
    return {"user": user}
