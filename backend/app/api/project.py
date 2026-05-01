import re
from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from shared.db.database import get_database

from app.core.jwt import get_current_user
from app.schema.project import (
    AddMemberRequest,
    AddMembersRequest,
    CreateProjectRequest,
    ProjectRole,
)

router = APIRouter(prefix="/projects")


@router.post("/")
async def create_project(
    request: CreateProjectRequest,
    db=Depends(get_database),
    current_user=Depends(get_current_user),
):
    user_id = str(current_user["_id"])

    project = request.model_dump()
    project["created_by"] = user_id

    result = await db.projects.insert_one(project)
    await db.project_members.insert_one(
        {
            "user_id": user_id,
            "project_id": str(result.inserted_id),
            "role": ProjectRole.OWNER,
        }
    )

    return {"message": "Project created", "project_id": str(result.inserted_id)}


@router.post("/{project_id}/add-member")
async def add_member(
    project_id: str,
    request: AddMemberRequest,
    db=Depends(get_database),
    current_user=Depends(get_current_user),
):
    try:
        owner = await db.project_members.find_one(
            {
                "user_id": str(current_user["_id"]),
                "project_id": project_id,
                "role": ProjectRole.OWNER,
            }
        )

    except Exception:
        raise HTTPException(status_code=403, detail="Not allowed")

    if not owner:
        raise HTTPException(status_code=403, detail="Not allowed")

    # add member
    await db.project_members.insert_one(
        {"user_id": request.user_id, "project_id": project_id, "role": request.role}
    )

    return {"message": "Member added"}


@router.post("/{project_id}/add-members")
async def add_members(
    project_id: str,
    request: AddMembersRequest,
    db=Depends(get_database),
    current_user=Depends(get_current_user),
):
    owner = await db.project_members.find_one(
        {
            "user_id": str(current_user["_id"]),
            "project_id": project_id,
            "role": ProjectRole.OWNER,
        }
    )

    if not owner:
        raise HTTPException(status_code=403, detail="Not allowed")

    user_ids = list({user_id for user_id in request.user_ids if user_id})
    if not user_ids:
        return {"message": "No members to add", "added": 0}

    object_ids = []
    invalid_ids = []
    for user_id in user_ids:
        try:
            object_ids.append(ObjectId(user_id))
        except Exception:
            invalid_ids.append(user_id)

    if invalid_ids:
        raise HTTPException(status_code=400, detail="Invalid user ids")

    existing_members = set()
    async for m in db.project_members.find(
        {"project_id": project_id, "user_id": {"$in": user_ids}}
    ):
        existing_members.add(m["user_id"])

    existing_users = set()
    async for u in db.users.find({"_id": {"$in": object_ids}}):
        existing_users.add(str(u["_id"]))

    to_add = [
        user_id
        for user_id in user_ids
        if user_id in existing_users and user_id not in existing_members
    ]

    if not to_add:
        return {"message": "No new members added", "added": 0}

    await db.project_members.insert_many(
        [
            {
                "user_id": user_id,
                "project_id": project_id,
                "role": request.role,
            }
            for user_id in to_add
        ]
    )

    return {"message": "Members added", "added": len(to_add)}


@router.get("/{project_id}/members")
async def get_members(
    project_id: str, db=Depends(get_database), current_user=Depends(get_current_user)
):
    user_id = str(current_user["_id"])

    existing_members = await db.project_members.find_one(
        {"user_id": user_id, "project_id": project_id}
    )

    if not existing_members:
        raise HTTPException(status_code=403, detail="Not allowed")

    members = []
    async for m in db.project_members.find({"project_id": project_id}):
        m["_id"] = str(m["_id"])

        user = None
        try:
            user = await db.users.find_one({"_id": ObjectId(m["user_id"])})
        except Exception:
            user = None

        if user:
            user["_id"] = str(user["_id"])
            user.pop("password", None)

        m["user"] = user
        members.append(m)
    return members


@router.get("/{project_id}/member-candidates")
async def get_member_candidates(
    project_id: str,
    search: Optional[str] = None,
    limit: int = 50,
    db=Depends(get_database),
    current_user=Depends(get_current_user),
):
    owner = await db.project_members.find_one(
        {
            "user_id": str(current_user["_id"]),
            "project_id": project_id,
            "role": ProjectRole.OWNER,
        }
    )

    if not owner:
        raise HTTPException(status_code=403, detail="Not allowed")

    member_ids = []
    async for m in db.project_members.find({"project_id": project_id}):
        try:
            member_ids.append(ObjectId(m["user_id"]))
        except Exception:
            continue

    safe_limit = max(1, min(limit, 200))

    if search:
        safe_search = re.escape(search)
        query = {
            "_id": {"$nin": member_ids},
            "$or": [
                {"email": {"$regex": safe_search, "$options": "i"}},
                {"firstName": {"$regex": safe_search, "$options": "i"}},
                {"lastName": {"$regex": safe_search, "$options": "i"}},
            ],
        }
    else:
        query = {"_id": {"$nin": member_ids}}

    users = []
    async for u in db.users.find(query).limit(safe_limit):
        u["_id"] = str(u["_id"])
        u.pop("password", None)
        users.append(u)

    return users


@router.get("/users")
async def get_my_projects(
    db=Depends(get_database), current_user=Depends(get_current_user)
):

    project_ids = []
    async for m in db.project_members.find({"user_id": str(current_user["_id"])}):
        project_ids.append(ObjectId(m["project_id"]))

    projects = []
    async for p in db.projects.find({"_id": {"$in": project_ids}}):
        p["_id"] = str(p["_id"])
        projects.append(p)

    return projects
