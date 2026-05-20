import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI-First CRM HCP Module"
    API_V1_STR: str = "/api/v1"
    
    # Database Settings
    # Supports SQLite out-of-the-box, can be overridden with PostgreSQL or MySQL connection string.
    DATABASE_URL: str = "sqlite:///./crm.db"
    
    # JWT Settings
    SECRET_KEY: str = "supersecretkey_crm_hcp_module_109238!@#"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    
    # Groq LLM Settings
    GROQ_API_KEY: Optional[str] = None
    GROQ_PRIMARY_MODEL: str = "gemma2-9b-it"
    GROQ_COMPLEX_MODEL: str = "llama-3.3-70b-versatile"
    
    # Environment
    ENVIRONMENT: str = "development"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True

settings = Settings()
