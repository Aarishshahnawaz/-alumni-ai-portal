"""
Configuration settings for AlumniAI Service
"""

from pydantic_settings import BaseSettings
from typing import List, Optional
import os


class Settings(BaseSettings):
    # Server Configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8001
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # API Configuration
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "AlumniAI Service"
    VERSION: str = "1.0.0"
    
    # Security
    SECRET_KEY: str = "your-secret-key-here"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # External APIs
    OPENAI_API_KEY: Optional[str] = None
    HUGGINGFACE_API_KEY: Optional[str] = None
    
    # Database (optional for caching)
    REDIS_URL: Optional[str] = None
    MONGODB_URL: Optional[str] = None
    
    # Model Configuration
    MODEL_CACHE_DIR: str = "./models"
    MAX_FILE_SIZE_MB: int = 10
    SUPPORTED_FILE_TYPES: List[str] = ["pdf", "doc", "docx", "txt"]
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "logs/alumni_ai.log"
    
    # Performance
    MAX_WORKERS: int = 4
    BATCH_SIZE: int = 32
    CACHE_TTL: int = 3600
    
    # Feature Flags
    ENABLE_CACHING: bool = True
    ENABLE_METRICS: bool = True
    ENABLE_GPU: bool = False
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Create settings instance
settings = Settings()

# Ensure model cache directory exists
os.makedirs(settings.MODEL_CACHE_DIR, exist_ok=True)
os.makedirs(os.path.dirname(settings.LOG_FILE), exist_ok=True)