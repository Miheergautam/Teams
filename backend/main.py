from fastapi import FastAPI
from contextlib import asynccontextmanager
from shared.db.database import get_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.mongodb_client, app.database = get_db()
    print("Connected to MongoDB")

    yield

    app.mongodb_client.close()
    print("Disconnected from MongoDB")

app = FastAPI(lifespan=lifespan)

@app.get("/")
async def get_health_status():
    return {"status": "Teams ok"}