from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    # LLM / AI
    groq_api_key: str = Field(..., env="GROQ_API_KEY")
    groq_llm_model: str = Field(default="llama-3.3-70b-versatile", env="GROQ_LLM_MODEL")

    # Application environment
    env: str = Field(default="local", env="ENV")

    # Core Services
    database_url: str = Field(..., env="DATABASE_URL")
    redis_url: str = Field(..., env="REDIS_URL")

    # App Configuration
    debug: bool = False
    api_host: str = "0.0.0.0"
    api_port: int = 8000

    # Secrets
    jwt_secret: str = Field(..., env="JWT_SECRET")

    # Storage Configuration
    storage_dir: str = Field(default="./storage", env="STORAGE_DIR")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

settings = Settings()