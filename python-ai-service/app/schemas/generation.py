from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class ImageModelName(str, Enum):
    base = "base"
    lora = "lora"
    custom = "custom"


class CustomModelProvider(str, Enum):
    hugging_face = "hugging_face"
    openai = "openai"


class PromptEnhanceRequest(BaseModel):
    prompt: str = Field(min_length=1, max_length=2000)
    restaurant_name: str | None = None
    cuisine_type: str | None = None
    tone: str = "premium"


class PromptEnhanceResponse(BaseModel):
    enhanced_prompt: str
    negative_prompt: str
    source: str


class ImageGenerationRequest(BaseModel):
    prompt: str = Field(min_length=1, max_length=2000)
    model: ImageModelName = ImageModelName.lora
    count: int = Field(default=1, ge=1, le=4)
    width: int = Field(default=1024, ge=256, le=2048)
    height: int = Field(default=1024, ge=256, le=2048)
    guidance_scale: float = Field(default=9.0, ge=1.0, le=20.0)
    steps: int = Field(default=30, ge=10, le=80)
    seed: int | None = None
    negative_prompt: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)
    provider: CustomModelProvider | None = None
    device: str | None = None


class GeneratedImage(BaseModel):
    file_name: str
    content_type: str = "image/png"
    base64_data: str


class ImageGenerationResponse(BaseModel):
    generation_id: str
    model: str
    enhanced_prompt: str
    negative_prompt: str
    images: list[GeneratedImage]


class CampaignRequest(BaseModel):
    prompt: str = Field(min_length=1, max_length=2000)
    restaurant_name: str | None = None
    cuisine_type: str | None = None
    tone: str = "premium"
    image_file_name: str | None = None
    image_content_type: str | None = None
    image_base64_data: str | None = None


class CampaignResponse(BaseModel):
    headline: str
    caption: str
    cta: str
    hashtags: list[str]
    google_ads_copy: str
    facebook_post: str
    instagram_post: str
    tiktok_caption: str
    reel_script: str
    email_subject: str
    email_body: str
    sms_message: str
    push_notification: str
    menu_description: str
    seo_description: str
    promotional_offer: str
    content_calendar: list[str]
