from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    mongo_url: str
    db_name: str
    secret_key: str
    algorithm: str

    class Config:
        env_file = ".env"

settings = Settings()