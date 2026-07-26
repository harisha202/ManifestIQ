import os
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    PROJECT_NAME: str = "ManifestIQ API"
    
    # PostgreSQL / SQLite connection string
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./manifestiq.db")
    
    # JWT Auth settings
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-key-for-development")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Required External APIs
    GOOGLE_API_KEY: str = Field(..., description="Google Gemini API Key is required")
    
    # Optional Error Tracking
    SENTRY_DSN: str = os.getenv("SENTRY_DSN", "")

    class Config:
        env_file = ".env"

settings = Settings()
