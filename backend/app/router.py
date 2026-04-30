from fastapi import APIRouter
from app.api.auth import router as auth_router

router = APIRouter()

@router.get("/status")
async def get_app_status():
    return {"status": "ok"}

router.include_router(auth_router)
