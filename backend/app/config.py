"""Centralized application configuration loaded from environment variables."""

from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_env: str = Field(default="development", alias="APP_ENV")
    app_name: str = Field(default="GeriCare AI", alias="APP_NAME")
    api_v1_prefix: str = Field(default="/api/v1", alias="API_V1_PREFIX")
    port: int = Field(default=8000, alias="PORT")

    firebase_project_id: str = Field(default="", alias="FIREBASE_PROJECT_ID")
    firebase_storage_bucket: str = Field(default="", alias="FIREBASE_STORAGE_BUCKET")
    firebase_service_account_path: str = Field(
        default="", alias="FIREBASE_SERVICE_ACCOUNT_PATH"
    )
    firebase_web_api_key: str = Field(default="", alias="FIREBASE_WEB_API_KEY")
    default_caregiver_role_on_first_login: bool = Field(
        default=True, alias="DEFAULT_CAREGIVER_ROLE_ON_FIRST_LOGIN"
    )

    elevenlabs_api_key: str = Field(default="", alias="ELEVENLABS_API_KEY")
    elevenlabs_stt_model: str = Field(default="scribe_v1", alias="ELEVENLABS_STT_MODEL")
    elevenlabs_tts_model: str = Field(
        default="eleven_turbo_v2_5", alias="ELEVENLABS_TTS_MODEL"
    )
    elevenlabs_voice_id: str = Field(default="", alias="ELEVENLABS_VOICE_ID")

    llm_provider: str = Field(default="openrouter", alias="LLM_PROVIDER")
    llm_api_key: str = Field(default="", alias="LLM_API_KEY")
    llm_model: str = Field(default="anthropic/claude-3.5-sonnet", alias="LLM_MODEL")

    embedding_model: str = Field(
        default="sentence-transformers/all-MiniLM-L6-v2", alias="EMBEDDING_MODEL"
    )

    cors_origins: str = Field(default="http://localhost:3000", alias="CORS_ORIGINS")

    repetition_similarity_threshold: float = Field(
        default=0.78, alias="REPETITION_SIMILARITY_THRESHOLD"
    )
    distress_alert_threshold: int = Field(default=60, alias="DISTRESS_ALERT_THRESHOLD")
    urgent_alert_threshold: int = Field(default=85, alias="URGENT_ALERT_THRESHOLD")

    pairing_code_ttl_seconds: int = Field(default=600, alias="PAIRING_CODE_TTL_SECONDS")
    pairing_pin_ttl_seconds: int = Field(default=300, alias="PAIRING_PIN_TTL_SECONDS")
    access_token_ttl_minutes: int = Field(default=60, alias="ACCESS_TOKEN_TTL_MINUTES")
    refresh_token_ttl_days: int = Field(default=30, alias="REFRESH_TOKEN_TTL_DAYS")
    jwt_secret: str = Field(default="", alias="JWT_SECRET")
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")

    log_level: str = Field(default="INFO", alias="LOG_LEVEL")

    @field_validator("cors_origins")
    @classmethod
    def _validate_cors(cls, v: str) -> str:
        return v

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def is_production(self) -> bool:
        return self.app_env.lower() == "production"

    def validate_production_secrets(self) -> None:
        """Fail loudly on startup if mandatory production secrets are missing."""
        if not self.is_production:
            return
        missing = []
        if not self.firebase_project_id:
            missing.append("FIREBASE_PROJECT_ID")
        if not self.firebase_service_account_path:
            missing.append("FIREBASE_SERVICE_ACCOUNT_PATH")
        if not self.elevenlabs_api_key:
            missing.append("ELEVENLABS_API_KEY")
        if not self.llm_api_key:
            missing.append("LLM_API_KEY")
        if not self.jwt_secret:
            missing.append("JWT_SECRET")
        if missing:
            raise RuntimeError(
                f"Missing mandatory production configuration: {', '.join(missing)}"
            )


@lru_cache
def get_settings() -> Settings:
    return Settings()
