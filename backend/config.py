import os

class Settings:
    PROJECT_NAME: str = "MediScan AI Backend"
    API_V1_STR: str = "/api/v1"
    
    # Security
    JWT_SECRET: str = os.getenv("JWT_SECRET", "9f4d7f5c1c8a14e91244243a7e53f1f3a2b724e8156db740ad62b8813adbe5b8")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database
    # If MONGODB_URL is not set or empty, fallback to SQLite locally.
    MONGODB_URL: str = os.getenv("MONGODB_URL", "")
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "mediscan_ai")
    
    # LLM API
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "AIzaSyBt_9vv1igk3d-rO-dps0hGLYIQSoKHs_Q")
    
    # Model Paths
    MODEL_PATH: str = os.getenv("MODEL_PATH", "models/multi_disease_model.h5")

settings = Settings()
