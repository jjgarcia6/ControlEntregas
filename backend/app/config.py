import json
from typing import Any, List

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


def _parse_cors(v: Any) -> List[str]:
    if isinstance(v, list):
        return v
    if isinstance(v, str):
        try:
            parsed = json.loads(v)
            if isinstance(parsed, list):
                return parsed
        except json.JSONDecodeError:
            pass
        return [origin.strip() for origin in v.split(",") if origin.strip()]
    return []


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    DATABASE_URL: str
    JWT_SECRET_KEY: str
    # 32-byte URL-safe base64 Fernet key. Generate with:
    # python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
    # Default is insecure dev key — MUST be overridden in production.
    ENCRYPTION_KEY: str = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 60
    JWT_REFRESH_LEEWAY_SECONDS: int = 7200
    CORS_ORIGINS: str = '["http://localhost:5173"]'
    ENVIRONMENT: str = "development"
    ADMIN_EMAIL: str = "admin@sistema.com"
    ADMIN_PASSWORD: str

    @property
    def cors_origins_list(self) -> List[str]:
        return _parse_cors(self.CORS_ORIGINS)

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def clean_database_url(cls, v: Any) -> Any:
        if isinstance(v, str):
            return v.strip()
        return v

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def coerce_to_str(cls, v: Any) -> Any:
        if isinstance(v, list):
            return json.dumps(v)
        return v


settings: Settings = Settings()  # type: ignore[call-arg]
