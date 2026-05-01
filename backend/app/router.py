from fastapi import APIRouter

from app.api.auth import router as auth_router
from app.api.dashboard import router as dashboard_router
from app.api.project import router as project_router
from app.api.tasks import router as tasks_router

router = APIRouter()


@router.get("/status")
async def get_app_status():
    return {"status": "ok"}


router.include_router(auth_router)
router.include_router(project_router)
router.include_router(tasks_router)
router.include_router(dashboard_router)
