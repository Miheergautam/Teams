Teams

A simple team workspace for managing projects, tasks, and members.

Structure

- backend/ – FastAPI + MongoDB.
- frontend/ – React + Vite UI with TailwindCSS.

Quick start

Backend

1. Create backend/.env with:

mongo_url=mongodb://localhost:27017
db_name=teams
secret_key=change_me
algorithm=HS256

2. Install dependencies and run:

cd backend
python -m venv .venv
source .venv/bin/activate  # macOS
pip install -r requirements.txt
uvicorn main:app --reload

The API will be available at http://127.0.0.1:8000/.

Frontend

cd frontend
npm install
npm run dev

The Vite dev server defaults to http://localhost:5173.

Notes

- The frontend uses src/api/axios.ts with baseURL = http://127.0.0.1:8000/api.
- Authenticated routes require Authorization: Bearer <token>.
- Only project owners can add members or view the candidate list for a project.
- Task assignees must be project members.
