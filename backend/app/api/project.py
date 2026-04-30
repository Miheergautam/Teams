from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from app.schema.project import CreateProjectRequest, ProjectRole, AddMemberRequest
from app.core.jwt import get_current_user
from shared.db.database import get_database

router = APIRouter(prefix="/projects")

@router.post("/")
async def create_project(request: CreateProjectRequest, db=Depends(get_database), current_user=Depends(get_current_user)):
    user_id = str(current_user["_id"])

    project = request.model_dump()
    project["created_by"] = user_id

    result = await db.projects.insert_one(project)
    await db.project_members.insert_one({
        "user_id": user_id,
        "project_id": str(result.inserted_id),
        "role": ProjectRole.OWNER
    })

    return {
        "message": "Project created",
        "project_id": str(result.inserted_id)
    }

@router.post("/{project_id}/add-member")
async def add_member(project_id: str, request: AddMemberRequest, db=Depends(get_database), current_user=Depends(get_current_user)):
    try:
        owner = await db.project_members.find_one({
            "user_id": str(current_user["_id"]),
            "project_id": project_id,
            "role": ProjectRole.OWNER
        })

    except Exception:
        raise HTTPException(status_code=403, detail="Not allowed")

    if not owner:
        raise HTTPException(status_code=403, detail="Not allowed")

    # add member
    await db.project_members.insert_one({
        "user_id": request.user_id,
        "project_id": project_id,
        "role": request.role
    })

    return {"message": "Member added"}

@router.get("/{project_id}/members")
async def get_members(project_id: str,db=Depends(get_database),current_user=Depends(get_current_user)):
    user_id = str(current_user["_id"])

    existing_members = await db.project_members.find_one({"user_id": user_id, "project_id": project_id})

    if not existing_members:
        raise HTTPException(status_code=403, detail="Not allowed")
    
    members = []
    async for m in db.project_members.find({"project_id": project_id}):
        m["_id"] = str(m["_id"])
        members.append(m)
    return members


@router.get("/users")
async def get_my_projects(db=Depends(get_database), current_user=Depends(get_current_user)):
    
    project_ids = []
    async for m in db.project_members.find({"user_id": str(current_user["_id"])}):
        project_ids.append(ObjectId(m["project_id"]))

    projects = []
    async for p in db.projects.find({"_id": {"$in": project_ids}}):
        p["_id"] = str(p["_id"])
        projects.append(p)

    return projects