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
    jwt_algorithm: str = Field(default="HS256", env="JWT_ALGORITHM")
    jwt_expiration_minutes: int = Field(default=60, env="JWT_EXPIRATION_MINUTES")

    # Storage Configuration
    storage_dir: str = Field(default="./storage", env="STORAGE_DIR")

    # Security Configuration
    allowed_origins: list[str] = Field(
        default=["http://localhost:5173"],
        env="ALLOWED_ORIGINS"
    )
    cors_allow_credentials: bool = Field(default=True, env="CORS_ALLOW_CREDENTIALS")
    cors_allow_methods: list[str] = Field(
        default=["GET", "POST", "PUT", "DELETE"],
        env="CORS_ALLOW_METHODS"
    )

    # Rate Limiting
    rate_limit_enabled: bool = Field(default=True, env="RATE_LIMIT_ENABLED")
    rate_limit_default: str = Field(default="100/minute", env="RATE_LIMIT_DEFAULT")
    rate_limit_auth_login: str = Field(default="10/minute", env="RATE_LIMIT_AUTH_LOGIN")
    rate_limit_auth_register: str = Field(default="5/minute", env="RATE_LIMIT_AUTH_REGISTER")

    # Security
    require_https: bool = Field(default=False, env="REQUIRE_HTTPS")
    secure_cookies: bool = Field(default=True, env="SECURE_COOKIES")
    
    # Request Validation
    max_body_size: int = Field(default=10_485_760, env="MAX_BODY_SIZE")  # 10MB
    request_timeout_seconds: int = Field(default=30, env="REQUEST_TIMEOUT_SECONDS")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

settings = Settings()