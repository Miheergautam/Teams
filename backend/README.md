# Teams Backend

FastAPI backend for Teams, backed by MongoDB and JWT authentication.

## Stack

- FastAPI
- Motor (MongoDB async driver)
- JWT via `python-jose`

## Environment

Create `backend/.env`:

```
mongo_url=mongodb://localhost:27017
db_name=teams
secret_key=change_me
algorithm=HS256
```

## Run locally

```
pip install -r requirements.txt
uvicorn main:app --reload
```

Base URL: `http://127.0.0.1:8000/api`

## Routes

### Health
- `GET /api/`
- `GET /api/status`

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/status`
- `GET /api/auth/users` (ADMIN only)
- `GET /api/auth/user/{user_id}` (ADMIN or the user)

### Projects
- `POST /api/projects/`
- `GET /api/projects/users`
- `POST /api/projects/{project_id}/add-member`
- `POST /api/projects/{project_id}/add-members`
- `GET /api/projects/{project_id}/members`
- `GET /api/projects/{project_id}/member-candidates` (owner only)
  - Optional query: `search` (string), `limit` (1–200)

### Tasks
- `POST /api/tasks/projects/{project_id}`
- `GET /api/tasks/projects/{project_id}`
- `PATCH /api/tasks/{task_id}`
- `DELETE /api/tasks/{task_id}` (owner only)

### Dashboard
- `GET /api/dashboard/stats`

## Auth notes

All non-auth routes require `Authorization: Bearer <token>`.
