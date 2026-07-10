# Python AI Service

FastAPI service that loads the notebook-derived AI components once and exposes them over HTTP.

## Responsibilities

- Prompt enhancement
- Base image generation
- LoRA image generation
- Groq-backed campaign copy generation
- Readiness reporting for production model availability

## Production model behavior

The service loads the base Stable Diffusion pipeline and the LoRA adapter from `LORA_ADAPTER_PATH`.
Docker Compose mounts the repository adapter files into `/app/models/lora`.

Set `HF_TOKEN` when the base model requires Hugging Face authentication.
Image generation returns HTTP 503 when the model is unavailable unless `ALLOW_PLACEHOLDER_IMAGES=true` is explicitly set for development.

## Local run

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
