from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict

DEFAULT_SCORE_WEIGHTS = {
    "demand_evidence": 0.25,
    "shop_fit": 0.25,
    "differentiation": 0.15,
    "commercial_feasibility": 0.20,
    "execution_feasibility": 0.15,
}


class Settings(BaseSettings):
    app_env: str = "development"
    app_name: str = "TRNDO Intelligence"
    database_url: str = "sqlite:///./trndo_market.db"
    tavily_api_key: str | None = None
    youtube_api_key: str | None = None
    openai_api_key: str | None = None
    openai_model: str = "gpt-4o-mini"
    openai_text_model: str | None = None
    max_web_results: int = 5
    max_youtube_results: int = 5
    cache_ttl_seconds: int = 21600
    request_timeout_seconds: float = 30.0
    allowed_origins: str = "http://localhost:3000"
    score_version: str = "heuristic-v1"
    telegram_bot_token: str | None = None
    telegram_bot_username: str | None = None
    telegram_webhook_secret: str | None = None
    telegram_mode: str = "polling"
    telegram_owner_chat_id: str | None = None
    asset_storage_dir: str = "./storage"
    promotion_storage_dir: str = "./storage/promotions"
    max_asset_size_bytes: int = 5 * 1024 * 1024
    max_upload_mb: int = 10
    free_monthly_promotion_quota: int = 5
    premium_monthly_promotion_quota: int = 100
    merchant_upi_vpa: str | None = None
    merchant_upi_name: str | None = None
    upi_merchant_vpa: str | None = None
    upi_payee_name: str | None = None
    payment_currency: str = "INR"
    public_base_url: str | None = None
    payment_token_ttl_hours: int = 24
    openai_image_model: str | None = None
    enable_ai_background_art: bool = False
    promotion_demo_mode: bool = True
    default_monthly_promotion_limit: int = 5
    trend_finder_base_url: str = "http://127.0.0.1:5000"
    trend_finder_timeout_seconds: float = 60.0
    auth_session_ttl_hours: int = 24
    auth_max_login_attempts: int = 5
    auth_lockout_minutes: int = 15

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]

    @property
    def openai_text_model_effective(self) -> str:
        return self.openai_text_model or self.openai_model

    @property
    def effective_upi_vpa(self) -> str | None:
        return self.upi_merchant_vpa or self.merchant_upi_vpa

    @property
    def effective_upi_payee_name(self) -> str | None:
        return self.upi_payee_name or self.merchant_upi_name

    @property
    def effective_asset_storage_dir(self) -> str:
        return self.promotion_storage_dir or self.asset_storage_dir

    @property
    def effective_max_upload_bytes(self) -> int:
        return self.max_upload_mb * 1024 * 1024

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
