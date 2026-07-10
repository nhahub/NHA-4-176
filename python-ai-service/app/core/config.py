from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parent.parent.parent.parent / ".env",
        extra="ignore"
    )

    app_name: str = "FoodAds AI Service"
    environment: str = Field(default="development", alias="APP_ENVIRONMENT")
    base_model_id: str = Field(default="stablediffusionapi/realistic-vision-v51", alias="BASE_MODEL_ID")
    lora_adapter_path: Path = Field(default=Path("/app/models/lora"), alias="LORA_ADAPTER_PATH")
    hf_token: str | None = Field(default=None, alias="HF_TOKEN")
    groq_api_key: str | None = Field(default=None, alias="GROQ_API_KEY")
    allow_placeholder_images: bool = Field(default=False, alias="ALLOW_PLACEHOLDER_IMAGES")
    output_dir: Path = Field(default=Path("/app/output"), alias="OUTPUT_DIR")

    @property
    def is_production(self) -> bool:
        return self.environment.lower() in {"prod", "production"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
