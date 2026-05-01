from datetime import datetime
from typing import List

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from shared.db.database import get_database

from app.core.jwt import get_current_user
from app.schema.tasks import CreateTaskRequest, TaskStatus, UpdateTaskRequest

router = APIRouter(prefix="/tasks")


async def validate_assignees(project_id: str, assignees: List[str], db):
    if not assignees:
        return

    member_ids = set()
    async for m in db.project_members.find(
        {"project_id": project_id, "user_id": {"$in": assignees}}
    ):
        member_ids.add(m["user_id"])

    missing = set(assignees) - member_ids
    if missing:
        raise HTTPException(
            status_code=400,
            detail="Some assignees are not members of this project",
        )


@router.post("/projects/{project_id}")
async def create_task(
    project_id: str,
    request: CreateTaskRequest,
    db=Depends(get_database),
    current_user=Depends(get_current_user),
):
    user_id = str(current_user["_id"])

    member = await db.project_members.find_one(
        {"user_id": user_id, "project_id": project_id}
    )

    if not member:
        raise HTTPException(status_code=403, detail="Not allowed")

    await validate_assignees(project_id, request.assigned_to, db)

    task = request.model_dump()
    task["project_id"] = project_id
    task["created_by"] = user_id
    task["status"] = TaskStatus.TODO
    task["created_at"] = datetime.utcnow()

    result = await db.tasks.insert_one(task)

    return {"message": "Task created", "task_id": str(result.inserted_id)}


@router.get("/projects/{project_id}")
async def get_tasks(
    project_id: str, db=Depends(get_database), current_user=Depends(get_current_user)
):
    user_id = str(current_user["_id"])

    # check
    member = await db.project_members.find_one(
        {"user_id": user_id, "project_id": project_id}
    )

    if not member:
        raise HTTPException(status_code=403, detail="Not allowed")

    tasks = []
    async for t in db.tasks.find({"project_id": project_id}):
        t["_id"] = str(t["_id"])
        tasks.append(t)

    return tasks


@router.patch("/{task_id}")
async def update_task(
    task_id: str,
    request: UpdateTaskRequest,
    db=Depends(get_database),
    current_user=Depends(get_current_user),
):
    user_id = str(current_user["_id"])

    task = await db.tasks.find_one({"_id": ObjectId(task_id)})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # check
    member = await db.project_members.find_one(
        {"user_id": user_id, "project_id": task["project_id"]}
    )

    if not member:
        raise HTTPException(status_code=403, detail="Not allowed")

    update_data = request.model_dump(exclude_unset=True)
    update_data["updated_at"] = datetime.utcnow()

    if "assigned_to" in update_data:
        await validate_assignees(task["project_id"], update_data["assigned_to"], db)

    await db.tasks.update_one({"_id": ObjectId(task_id)}, {"$set": update_data})

    return {"message": "Task updated", "task_id": task_id}


@router.delete("/{task_id}")
async def delete_task(
    task_id: str, db=Depends(get_database), current_user=Depends(get_current_user)
):
    user_id = str(current_user["_id"])

    task = await db.tasks.find_one({"_id": ObjectId(task_id)})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    member = await db.project_members.find_one(
        {"user_id": user_id, "project_id": task["project_id"]}
    )

    if not member:
        raise HTTPException(status_code=403, detail="Not allowed")

    if member["role"] != "OWNER":
        raise HTTPException(status_code=403, detail="Not allowed")

    await db.tasks.delete_one({"_id": ObjectId(task_id)})

    return {"message": "Task deleted"}
