from motor.motor_asyncio import AsyncIOMotorClient
from config import settings

def get_db():
    client = AsyncIOMotorClient(settings.mongo_url)
    db = client[settings.db_name]
    return client, db

def get_database():
    client, db = get_db()
    return db