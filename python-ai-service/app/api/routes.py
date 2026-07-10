from fastapi import APIRouter, Depends, Request

from app.core.config import Settings, get_settings
from app.schemas.generation import (
    CampaignRequest,
    CampaignResponse,
    ImageGenerationRequest,
    ImageGenerationResponse,
    PromptEnhanceRequest,
    PromptEnhanceResponse,
)
from app.services.generation_service import GenerationService
from app.services.model_registry import NEGATIVE_PROMPT
from app.services.model_registry import ModelRegistry

router = APIRouter()


def get_registry(request: Request) -> ModelRegistry:
    return request.app.state.registry


def get_generation_service(request: Request, settings: Settings = Depends(get_settings)) -> GenerationService:
    return GenerationService(get_registry(request), settings)


@router.get("/health")
def health(request: Request):
    registry = get_registry(request)
    return {
        "status": "ok",
        "device": registry.models.device,
        "model_loaded": registry.models.image_ready,
        "placeholder_images_allowed": registry.settings.allow_placeholder_images,
        "load_error": registry.models.load_error,
    }


@router.get("/ready")
def ready(request: Request):
    registry = get_registry(request)
    ready_for_images = registry.models.image_ready or registry.settings.allow_placeholder_images
    return {
        "ready": ready_for_images,
        "device": registry.models.device,
        "model_loaded": registry.models.image_ready,
        "load_error": registry.models.load_error,
    }


@router.post("/prompt/enhance", response_model=PromptEnhanceResponse)
def enhance_prompt(payload: PromptEnhanceRequest, service: GenerationService = Depends(get_generation_service)):
    enhanced_prompt, negative_prompt, source = service.enhance_prompt_with_source(
        payload.prompt,
        restaurant_name=payload.restaurant_name,
        cuisine_type=payload.cuisine_type,
        tone=payload.tone,
    )
    return PromptEnhanceResponse(
        enhanced_prompt=enhanced_prompt,
        negative_prompt=negative_prompt or NEGATIVE_PROMPT,
        source=source,
    )


@router.post("/images/generate", response_model=ImageGenerationResponse)
def generate_image(payload: ImageGenerationRequest, service: GenerationService = Depends(get_generation_service)):
    return service.generate_images(payload)


@router.post("/campaigns/generate", response_model=CampaignResponse)
def generate_campaign(payload: CampaignRequest, service: GenerationService = Depends(get_generation_service)):
    return service.generate_campaign(payload)
