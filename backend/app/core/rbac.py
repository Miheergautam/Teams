from fastapi import Depends, HTTPException
from app.core.jwt import get_current_user

def require_roles(allowed_roles: list[str]):
    def checker(user: dict = Depends(get_current_user)):
        if user.get("role") not in allowed_roles:
            raise HTTPException(status_code=403, detail="Forbidden")
        return user
    return checker