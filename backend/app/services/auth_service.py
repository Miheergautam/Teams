from app.schema.auth import RegisterRequest, LoginRequest
from shared.db.dependency import get_database
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(password, hashed):
    return pwd_context.verify(password, hashed)


def register(request: RegisterRequest):
    db = get_database()

    existing_user = db.users.find_one({"email": request.email})
    if existing_user:
        return None, "User already exists"

    user_data = request.dict()

    user_data["password"] = hash_password(user_data["password"])
    result = db.users.insert_one(user_data)

    user_data["_id"] = str(result.inserted_id)
    return user_data, None


def login(request: LoginRequest):
    db = get_database()

    user = db.users.find_one({"email": request.email})
    if not user:
        return None, "User not found"

    
    if not verify_password(request.password, user["password"]):
        return None, "Invalid credentials"

    user["_id"] = str(user["_id"])
    return user, None

def get_all_users():
    db = get_database()
    users = db.users.find()
    for user in users:
        user["_id"] = str(user["_id"])
    return [user for user in users]


def get_user_by_id(user_id: str):
    db = get_database()
    user = db.users.find_one({"_id": user_id})
    if not user:
        return None
    user["_id"] = str(user["_id"])
    return user
    