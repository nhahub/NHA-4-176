from __future__ import annotations

import json
import logging

from app.schemas.generation import CampaignRequest, CampaignResponse

logger = logging.getLogger(__name__)


class MarketingService:
    def __init__(self, groq_client: object | None):
        self._groq_client = groq_client

    def generate(self, request: CampaignRequest) -> CampaignResponse:
        if self._groq_client is None:
            return self._fallback(request)

        system_prompt = (
            "You are a restaurant marketing strategist. Produce concise, high-converting campaign copy "
            "for food and restaurant promotions. Return JSON with keys headline (str), caption (str), cta (str), "
            "hashtags (list of strings, e.g., [\"#tag1\", \"#tag2\"]), google_ads_copy (str), facebook_post (str), "
            "instagram_post (str), tiktok_caption (str), reel_script (str), email_subject (str), email_body (str), "
            "sms_message (str), push_notification (str), menu_description (str), seo_description (str), "
            "promotional_offer (str), and content_calendar (list of strings, e.g., [\"Day 1: ...\", \"Day 2: ...\", \"Day 3: ...\"])."
        )
        user_prompt = (
            f"Prompt: {request.prompt}\n"
            f"Restaurant: {request.restaurant_name or 'Unknown'}\n"
            f"Cuisine: {request.cuisine_type or 'Unknown'}\n"
            f"Tone: {request.tone}"
        )
        try:
            response = self._groq_client.chat.completions.create(
                model="llama-3.1-8b-instant",
                max_tokens=900,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": system_prompt + " Return valid raw JSON only."},
                    {"role": "user", "content": user_prompt},
                ],
            )
            payload = response.choices[0].message.content.strip()
            # Strip markdown block wrappers if present
            if payload.startswith("```"):
                lines = payload.splitlines()
                if lines[0].startswith("```"):
                    lines = lines[1:]
                if lines[-1].startswith("```"):
                    lines = lines[:-1]
                payload = "\n".join(lines).strip()
            
            return CampaignResponse.model_validate(json.loads(payload))
        except Exception as exc:
            logger.error(f"Campaign generation failed: {exc}", exc_info=True)
            return self._fallback(request)

    def _fallback(self, request: CampaignRequest) -> CampaignResponse:
        base = request.prompt.strip().rstrip(".")
        restaurant = request.restaurant_name or "your restaurant"
        cuisine = request.cuisine_type or "signature cuisine"
        hashtags = [
            f"#{restaurant.replace(' ', '')}",
            f"#{cuisine.replace(' ', '')}",
            "#FoodAdsAI",
            "#RestaurantMarketing",
        ]
        return CampaignResponse(
            headline=f"Bring more guests to {restaurant}",
            caption=f"{base}. Crafted for {restaurant} and designed to showcase {cuisine}.",
            cta="Order now and taste the difference.",
            hashtags=hashtags,
            google_ads_copy=f"Discover {restaurant} specials. Fresh visuals, stronger clicks, better conversions.",
            facebook_post=f"Introducing a fresh campaign for {restaurant}. {base}.",
            instagram_post=f"New visuals. New cravings. {base}. #FoodAdsAI",
            tiktok_caption=f"{base} - made to stop the scroll.",
            reel_script="Open with the hero dish, cut to the kitchen, end on the call to action.",
            email_subject=f"Your next promotion for {restaurant}",
            email_body=f"We built a campaign around {base} for {cuisine}.",
            sms_message=f"{restaurant}: check out our newest offer today.",
            push_notification=f"New campaign ready for {restaurant}.",
            menu_description=f"A polished menu description for {cuisine} served with a premium tone.",
            seo_description=f"SEO-friendly promotional copy for {cuisine} restaurants.",
            promotional_offer="Limited-time launch offer.",
            content_calendar=[
                "Day 1: teaser post",
                "Day 2: hero image",
                "Day 3: offer reminder",
            ],
        )
