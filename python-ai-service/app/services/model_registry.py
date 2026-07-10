from __future__ import annotations

import base64
import io
import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from app.core.config import Settings

logger = logging.getLogger(__name__)

try:
    import torch
    from diffusers import DPMSolverMultistepScheduler, StableDiffusionPipeline
    from peft import PeftModel
except Exception:  # pragma: no cover - optional runtime dependencies
    torch = None
    StableDiffusionPipeline = None
    DPMSolverMultistepScheduler = None
    PeftModel = None

try:
    from groq import Groq
except Exception:  # pragma: no cover - optional runtime dependencies
    Groq = None

from PIL import Image, ImageDraw, ImageFont


NEGATIVE_PROMPT = (
    "oversaturated, ugly, 3d, render, cartoon, grain, low-res, kitsch, blurred, "
    "soft, deformed, extra limbs, close up, b&w, weird colors, watermark, blur, "
    "text, writing, logo, oversharpen"
)


@dataclass
class LoadedModels:
    base_pipeline: Any | None = None
    lora_pipeline: Any | None = None
    groq_client: Any | None = None
    device: str = "cpu"
    load_error: str | None = None

    @property
    def image_ready(self) -> bool:
        return self.base_pipeline is not None


class ModelRegistry:
    def __init__(self, settings: Settings):
        self.settings = settings
        self._models = LoadedModels()
        self._loaded = False

    @property
    def models(self) -> LoadedModels:
        return self._models

    def load(self) -> LoadedModels:
        if self._loaded:
            return self._models

        # Validate CUDA actually works — is_available() can return True inside
        # containers where CUDA libs are installed but no physical GPU is present.
        device = "cpu"
        try:
            if torch is not None and torch.cuda.is_available():
                torch.zeros(1).cuda()  # real test — throws if no driver
                device = "cuda"
        except Exception:
            logger.warning("CUDA reported as available but failed validation; falling back to CPU")
            device = "cpu"
        self._models.device = device
        self._models.groq_client = self._build_groq_client()

        if StableDiffusionPipeline is None:
            message = "diffusers/torch not available"
            logger.warning("%s; image generation is not ready", message)
            self._models.load_error = message
            self._loaded = True
            self._raise_if_strict()
            return self._models

        dtype = torch.float16 if device == "cuda" else torch.float32
        logger.info("Loading base image pipeline from %s", self.settings.base_model_id)

        try:
            base = StableDiffusionPipeline.from_pretrained(
                self.settings.base_model_id,
                torch_dtype=dtype,
                safety_checker=None,
                token=self.settings.hf_token,
            ).to(device)

            if DPMSolverMultistepScheduler is not None:
                base.scheduler = DPMSolverMultistepScheduler.from_config(
                    base.scheduler.config,
                    use_karras_sigmas=True,
                    algorithm_type="dpmsolver++",
                )

            # 4 GB VRAM optimizations — keeps memory usage under budget
            base.enable_attention_slicing()
            base.vae.enable_tiling()
            logger.info("Applied 4 GB VRAM optimizations (attention slicing + VAE tiling)")

            self._models.base_pipeline = base
            self._models.lora_pipeline = self._build_lora_pipeline(base, device, dtype)
            self._models.load_error = None
            self._loaded = True
        except Exception as exc:
            logger.exception("Image model loading failed")
            self._models.load_error = str(exc)
            self._loaded = True
            self._raise_if_strict()

        return self._models

    def _build_groq_client(self) -> Any | None:
        if Groq is None or not self.settings.groq_api_key:
            return None
        return Groq(api_key=self.settings.groq_api_key)

    def _build_lora_pipeline(self, base_pipeline: Any, device: str, dtype: Any) -> Any:
        adapter_path = self.settings.lora_adapter_path
        if not adapter_path.exists() or PeftModel is None:
            logger.warning("LoRA adapter missing or PEFT unavailable; reusing base pipeline")
            return base_pipeline

        if not (adapter_path / "adapter_config.json").exists() or not (adapter_path / "adapter_model.safetensors").exists():
            logger.warning("LoRA adapter files are incomplete at %s; reusing base pipeline", adapter_path)
            return base_pipeline

        logger.info("Loading LoRA adapter from %s", adapter_path)
        lora_pipeline = StableDiffusionPipeline.from_pretrained(
            self.settings.base_model_id,
            torch_dtype=dtype,
            safety_checker=None,
            token=self.settings.hf_token,
        ).to(device)

        lora_pipeline.unet = PeftModel.from_pretrained(lora_pipeline.unet, str(adapter_path))
        if DPMSolverMultistepScheduler is not None:
            lora_pipeline.scheduler = DPMSolverMultistepScheduler.from_config(
                lora_pipeline.scheduler.config,
                use_karras_sigmas=True,
                algorithm_type="dpmsolver++",
            )
        # 4 GB VRAM optimizations for LoRA pipeline
        lora_pipeline.enable_attention_slicing()
        lora_pipeline.vae.enable_tiling()
        return lora_pipeline

    def shutdown(self) -> None:
        self._models = LoadedModels()
        self._loaded = False

    def _raise_if_strict(self) -> None:
        if self.settings.is_production and not self.settings.allow_placeholder_images:
            raise RuntimeError(self._models.load_error or "Image model is not ready")

    def generate_placeholder_image(self, prompt: str, model_name: str, width: int, height: int) -> Image.Image:
        image = Image.new("RGB", (width, height), color=(244, 240, 232))
        draw = ImageDraw.Draw(image)
        title = f"{model_name.upper()} fallback"
        body = prompt.strip().replace("\n", " ")
        body = body[:700] + ("..." if len(body) > 700 else "")

        try:
            font = ImageFont.truetype("arial.ttf", 26)
            body_font = ImageFont.truetype("arial.ttf", 18)
        except Exception:
            font = ImageFont.load_default()
            body_font = ImageFont.load_default()

        draw.rounded_rectangle((24, 24, width - 24, height - 24), radius=28, outline=(180, 156, 128), width=3)
        draw.text((48, 52), title, fill=(42, 31, 25), font=font)
        draw.multiline_text((48, 104), body, fill=(78, 63, 54), font=body_font, spacing=8)
        return image

    @staticmethod
    def to_base64(image: Image.Image) -> str:
        buffer = io.BytesIO()
        image.save(buffer, format="PNG")
        return base64.b64encode(buffer.getvalue()).decode("utf-8")
