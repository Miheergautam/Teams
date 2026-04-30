from fastapi import APIRouter, Depends
from app.schema.auth import RegisterRequest, LoginRequest
from app.services.auth_service import register, login, get_all_users, get_user_by_id
from shared.db.database import get_database
from app.core.jwt import create_jwt_token
from app.core.rbac import require_roles

router = APIRouter(prefix="/auth")

@router.get("/status")
async def get_auth_status():
    return {"status": "auth ok"}


@router.post("/register")
async def user_register(request_data: RegisterRequest, db = Depends(get_database)):
    user, error = await register(request_data, db)

    if error:
        return {"message": error}

    if not user:
        return {"message": "Registration failed"}

    token = create_jwt_token(str(user["_id"]), user["role"])

    user["_id"] = str(user["_id"])

    return {
        "message": "Registration successful",
        "user": user,
        "token": token
    }


@router.post("/login")
async def user_login(request: LoginRequest, db = Depends(get_database)):
    user, error = await login(request, db)

    if error:
        return {"message": error}

    if not user:
        return {"message": "Login failed"}

    token = create_jwt_token(str(user["_id"]), user["role"])

    user["_id"] = str(user["_id"])

    return {
        "message": "Login successful",
        "user": user,
        "token": token
    }


@router.get("/users")
async def get_users(db = Depends(get_database), user = Depends(require_roles(["ADMIN"]))):
    users = await get_all_users(db)
    return {"users": users}


@router.get("/user/{user_id}")
async def get_user(user_id: str, db = Depends(get_database), current_user = Depends(require_roles(["ADMIN","MEMBER"]))):
    user, error = await get_user_by_id(user_id, db, current_user)

    if error:
        return {"message": error}

    if not user:
        return {"message": "User not found"}

    return {"user": user}