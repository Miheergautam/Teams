from bson import ObjectId
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str):
    return pwd_context.verify(plain, hashed)

async def register(request, db):
    existing_user = await db.users.find_one({"email": request.email})
    if existing_user:
        return None, "User already exists"

    user_data = request.dict()
    user_data["password"] = hash_password(user_data["password"])

    result = await db.users.insert_one(user_data)
    user_data["_id"] = result.inserted_id

    return user_data, None


async def login(request, db):
    user = await db.users.find_one({"email": request.email})
    if not user:
        return None, "User not found"

    if not verify_password(request.password, user["password"]):
        return None, "Invalid credentials"

    return user, None


async def get_all_users(db):
    users = []
    async for user in db.users.find():
        user["_id"] = str(user["_id"])
        users.append(user)
    return users


async def get_user_by_id(user_id: str, db, current_user):
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if (user and str(user["_id"])) != str(current_user["_id"]) and current_user["role"] != "ADMIN":
        return None, "Forbidden"
    if user:
        user["_id"] = str(user["_id"])
    return user, None