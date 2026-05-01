from fastapi import FastAPI
from contextlib import asynccontextmanager
from shared.db.database import get_db
from fastapi.middleware.cors import CORSMiddleware


from app.router import router as app_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.mongodb_client, app.database = get_db()
    print("Connected to MongoDB")

    yield

    app.mongodb_client.close()
    print("Disconnected from MongoDB")

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://026ac8e0.teams-1sv.pages.dev",
        "https://teams-1sv.pages.dev",
        "https://teams-production-4b58.up.railway.app",
        "http://127.0.0.1:8000",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def get_health_status():
    return {"status": "Teams ok"}

app.include_router(app_router, prefix="/api")