from __future__ import annotations

import uuid
import httpx
import logging
from pathlib import Path
from threading import Lock

from fastapi import HTTPException
from PIL import Image

logger = logging.getLogger(__name__)

from app.core.config import Settings
from app.schemas.generation import (
    GeneratedImage,
    ImageGenerationRequest,
    ImageGenerationResponse,
    ImageModelName,
    CustomModelProvider,
)
from app.services.marketing_service import MarketingService
from app.services.model_registry import ModelRegistry
from app.services.prompt_enhancer import PromptEnhancer


class GenerationService:
    def __init__(self, registry: ModelRegistry, settings: Settings):
        self._registry = registry
        self._settings = settings
        self._prompt_enhancer = PromptEnhancer(registry.models.groq_client)
        self._marketing_service = MarketingService(registry.models.groq_client)
        self._generation_lock = Lock()

    def enhance_prompt(self, prompt: str, restaurant_name: str | None = None, cuisine_type: str | None = None, tone: str = "premium") -> tuple[str, str]:
        enhanced_prompt, negative_prompt, _source = self._prompt_enhancer.enhance(prompt, restaurant_name, cuisine_type, tone)
        return enhanced_prompt, negative_prompt

    def enhance_prompt_with_source(self, prompt: str, restaurant_name: str | None = None, cuisine_type: str | None = None, tone: str = "premium") -> tuple[str, str, str]:
        return self._prompt_enhancer.enhance(prompt, restaurant_name, cuisine_type, tone)

    def generate_campaign(self, request):
        return self._marketing_service.generate(request)

    def generate_images(self, request: ImageGenerationRequest) -> ImageGenerationResponse:
        enhanced_prompt, negative_prompt = self.enhance_prompt(
            request.prompt,
            tone=request.metadata.get("tone", "premium"),
            restaurant_name=request.metadata.get("restaurant_name"),
            cuisine_type=request.metadata.get("cuisine_type"),
        )
        if request.negative_prompt:
            negative_prompt = request.negative_prompt

        generation_id = str(uuid.uuid4())
        model_name = request.model.value
        provider = self._custom_provider(request) if request.model == ImageModelName.custom else None
        pipeline = None if provider == CustomModelProvider.openai else self._select_pipeline(request)
        if provider != CustomModelProvider.openai and pipeline is None and not self._settings.allow_placeholder_images:
            raise HTTPException(
                status_code=503,
                detail={
                    "message": "Image generation model is not ready.",
                    "load_error": self._registry.models.load_error,
                },
            )

        images: list[GeneratedImage] = []
        for index in range(request.count):
            with self._generation_lock:
                image = (
                    self._render_openai_image(
                        request=request,
                        prompt=enhanced_prompt,
                        negative_prompt=negative_prompt,
                        seed=None if request.seed is None else request.seed + index,
                    )
                    if provider == CustomModelProvider.openai
                    else self._render_image(
                        pipeline=pipeline,
                        prompt=enhanced_prompt,
                        negative_prompt=negative_prompt,
                        width=request.width,
                        height=request.height,
                        steps=request.steps,
                        guidance_scale=request.guidance_scale,
                        seed=None if request.seed is None else request.seed + index,
                        model_name=model_name,
                    )
                )
            output_name = f"{generation_id}-{index + 1}.png"
            self._save_output(image, output_name)
            images.append(GeneratedImage(file_name=output_name, base64_data=self._registry.to_base64(image)))

        return ImageGenerationResponse(
            generation_id=generation_id,
            model=model_name,
            enhanced_prompt=enhanced_prompt,
            negative_prompt=negative_prompt,
            images=images,
        )

    def _select_pipeline(self, request: ImageGenerationRequest):
        models = self._registry.models
        pipeline = None
        if request.model == ImageModelName.base:
            pipeline = models.base_pipeline
        elif request.model == ImageModelName.lora:
            pipeline = models.lora_pipeline or models.base_pipeline
        elif request.model == ImageModelName.custom:
            provider = self._custom_provider(request)
            if provider == CustomModelProvider.hugging_face:
                pipeline = self._build_custom_pipeline(request)

        if pipeline is not None and request.device:
            target_device = request.device.lower()
            if target_device in ("cpu", "cuda"):
                try:
                    current_device = str(getattr(pipeline, "device", ""))
                    if target_device not in current_device:
                        import torch
                        dtype = torch.float16 if target_device == "cuda" else torch.float32
                        logger.info("Moving pipeline to %s with dtype %s", target_device, dtype)
                        pipeline.to(device=target_device, dtype=dtype)
                except Exception:
                    logger.exception("Failed to move pipeline to device %s", target_device)

        return pipeline

    def _build_custom_pipeline(self, request: ImageGenerationRequest):
        model_id = self._metadata_value(request.metadata, "model_id", "modelId", "custom_model_id", "customModelId")
        api_key = self._metadata_value(request.metadata, "api_key", "apiKey", "hf_token", "hfToken")

        if StableDiffusionPipeline is None or torch is None or not model_id:
            return None

        dtype = torch.float16 if self._registry.models.device == "cuda" else torch.float32
        try:
            pipeline = StableDiffusionPipeline.from_pretrained(
                model_id,
                torch_dtype=dtype,
                safety_checker=None,
                token=api_key or self._settings.hf_token,
            ).to(self._registry.models.device)
            if DPMSolverMultistepScheduler is not None:
                pipeline.scheduler = DPMSolverMultistepScheduler.from_config(
                    pipeline.scheduler.config,
                    use_karras_sigmas=True,
                    algorithm_type="dpmsolver++",
                )
            return pipeline
        except Exception:
            logger.exception("Custom model loading failed")
            return None

    def _custom_provider(self, request: ImageGenerationRequest) -> CustomModelProvider | None:
        raw = self._metadata_value(request.metadata, "provider", "custom_provider", "customProvider")
        if raw:
            try:
                return CustomModelProvider(raw)
            except ValueError:
                return None
        if request.provider is not None:
            return request.provider
        return None

    def _render_openai_image(self, request: ImageGenerationRequest, prompt: str, negative_prompt: str, seed: int | None) -> Image.Image:
        model_id = self._metadata_value(request.metadata, "model_id", "modelId", "custom_model_id", "customModelId")
        api_key = self._metadata_value(request.metadata, "api_key", "apiKey", "openai_api_key", "openaiApiKey")
        if not model_id or not api_key:
            raise HTTPException(status_code=400, detail={"message": "OpenAI custom model requires model_id and api_key."})

        payload: dict[str, object] = {
            "model": model_id,
            "prompt": prompt,
            "size": f"{request.width}x{request.height}",
            "response_format": "b64_json",
        }
        if seed is not None:
            payload["seed"] = seed

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

        with httpx.Client(timeout=120) as client:
            response = client.post("https://api.openai.com/v1/images/generations", json=payload, headers=headers)
            response.raise_for_status()
            data = response.json()

        image_data = data["data"][0].get("b64_json")
        if not image_data:
            raise HTTPException(status_code=502, detail={"message": "OpenAI image response did not include image data."})

        from base64 import b64decode
        from io import BytesIO

        return Image.open(BytesIO(b64decode(image_data))).convert("RGB")

    @staticmethod
    def _metadata_value(metadata: dict[str, object], *keys: str) -> str | None:
        for key in keys:
            value = metadata.get(key)
            if isinstance(value, str) and value.strip():
                return value.strip()
        return None

    def _render_image(
        self,
        pipeline,
        prompt: str,
        negative_prompt: str,
        width: int,
        height: int,
        steps: int,
        guidance_scale: float,
        seed: int | None,
        model_name: str,
    ) -> Image.Image:
        if pipeline is None:
            return self._registry.generate_placeholder_image(prompt, model_name, width, height)

        # Adjust steps for DPM scheduler compatibility
        # DPM scheduler requires specific step counts, use 20 for stability
        adjusted_steps = min(steps, 25) if steps > 25 else steps

        kwargs = {
            "prompt": prompt,
            "negative_prompt": negative_prompt,
            "num_inference_steps": adjusted_steps,
            "guidance_scale": guidance_scale,
        }
        if seed is not None and hasattr(pipeline, "device"):
            try:
                import torch

                generator = torch.Generator(device=pipeline.device).manual_seed(seed)
                kwargs["generator"] = generator
            except Exception:
                pass
        result = pipeline(**kwargs)
        return result.images[0]

    def _save_output(self, image: Image.Image, output_name: str) -> None:
        self._settings.output_dir.mkdir(parents=True, exist_ok=True)
        image.save(self._settings.output_dir / output_name)
