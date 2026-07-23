import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "ManifestIQ API"
    # PostgreSQL connection string
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql+pg8000://user:password@localhost/manifestiq")
    
    # JWT Auth settings
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-key-for-development")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Gemini API Key for LangChain
    GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY", "")

    class Config:
        env_file = ".env"

settings = Settings()
