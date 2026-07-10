from __future__ import annotations

import logging

from app.services.model_registry import NEGATIVE_PROMPT

logger = logging.getLogger(__name__)


class PromptEnhancer:
    def __init__(self, groq_client: object | None):
        self._groq_client = groq_client

    def enhance(self, prompt: str, restaurant_name: str | None = None, cuisine_type: str | None = None, tone: str = "premium") -> tuple[str, str, str]:
        if self._groq_client is None:
            return self._fallback(prompt, restaurant_name, cuisine_type, tone), NEGATIVE_PROMPT, "fallback"

        system_prompt = (
            "You are an expert prompt engineer for photorealistic restaurant food imagery. "
            "Expand short user prompts into concise, richly described prompts. "
            "Always preserve the user's intent, add lighting, camera, composition, and set dressing details, "
            "and return only the final prompt text."
        )

        user_prompt = self._build_prompt(prompt, restaurant_name, cuisine_type, tone)
        try:
            response = self._groq_client.chat.completions.create(
                model="llama-3.1-8b-instant",
                max_tokens=220,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
            )
            enhanced = response.choices[0].message.content.strip()
            return enhanced, NEGATIVE_PROMPT, "groq"
        except Exception:
            logger.exception("Groq prompt enhancement failed; using fallback prompt")
            return self._fallback(prompt, restaurant_name, cuisine_type, tone), NEGATIVE_PROMPT, "fallback"

    def _fallback(self, prompt: str, restaurant_name: str | None, cuisine_type: str | None, tone: str) -> str:
        pieces = [
            "RAW photo,",
            prompt.strip().rstrip("."),
        ]
        if restaurant_name:
            pieces.append(f"for {restaurant_name}")
        if cuisine_type:
            pieces.append(f"highlighting {cuisine_type} cuisine")
        pieces.extend(
            [
                "professional food photography",
                "soft diffused light",
                "balanced composition",
                "premium styling",
                "8k uhd, DSLR, sharp focus, high quality, Fujifilm XT3",
            ]
        )
        if tone:
            pieces.insert(2, f"with a {tone} advertising tone")
        return " ".join(pieces)

    def _build_prompt(self, prompt: str, restaurant_name: str | None, cuisine_type: str | None, tone: str) -> str:
        details = [f"User request: {prompt.strip()}"]
        if restaurant_name:
            details.append(f"Restaurant: {restaurant_name}")
        if cuisine_type:
            details.append(f"Cuisine: {cuisine_type}")
        details.append(f"Tone: {tone}")
        return "\n".join(details)
