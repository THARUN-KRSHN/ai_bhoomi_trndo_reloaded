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
    max_web_results: int = 5
    max_youtube_results: int = 5
    cache_ttl_seconds: int = 21600
    request_timeout_seconds: float = 30.0
    allowed_origins: str = "http://localhost:3000"
    score_version: str = "heuristic-v1"

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
