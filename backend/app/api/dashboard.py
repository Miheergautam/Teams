from fastapi import APIRouter, Depends
from shared.db.database import get_database

from app.core.jwt import get_current_user
from app.schema.tasks import TaskStatus

router = APIRouter(prefix="/dashboard")


@router.get("/stats")
async def get_dashboard_stats(
    db=Depends(get_database),
    current_user=Depends(get_current_user),
):
    user_id = str(current_user["_id"])

    project_ids_set = set()
    async for m in db.project_members.find({"user_id": user_id}):
        project_ids_set.add(m["project_id"])

    if not project_ids_set:
        return {
            "totalTasks": 0,
            "todoTasks": 0,
            "totalProjects": 0,
        }

    project_ids = list(project_ids_set)

    total_tasks = await db.tasks.count_documents({"project_id": {"$in": project_ids}})
    todo_tasks = await db.tasks.count_documents(
        {
            "project_id": {"$in": project_ids},
            "status": TaskStatus.TODO,
        }
    )

    return {
        "totalTasks": total_tasks,
        "todoTasks": todo_tasks,
        "totalProjects": len(project_ids),
    }
