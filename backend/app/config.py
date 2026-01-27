from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
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
    secret_key: str = Field(..., env="JWT_SECRET")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

settings = Settings()