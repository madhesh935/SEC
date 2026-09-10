"""LLM provider integration, kept behind this single module so the provider
can change without touching callers (spec section 36). The LLM only turns
already-decided structured strategy into natural language - it never decides
patient stage, consent, or escalation itself (spec sections 91).
"""

from __future__ import annotations

import json

import httpx

from app.config import get_settings
from app.core.exceptions import LLMServiceError
from app.core.logging import get_logger

logger = get_logger(__name__)

_REQUEST_TIMEOUT = httpx.Timeout(connect=5.0, read=20.0, write=5.0, pool=5.0)


class LLMService:
    def __init__(self) -> None:
        self._settings = get_settings()

    def _endpoint_and_headers(self) -> tuple[str, dict[str, str]]:
        provider = self._settings.llm_provider.lower()
        if provider == "openrouter":
            return (
                "https://openrouter.ai/api/v1/chat/completions",
                {
                    "Authorization": f"Bearer {self._settings.llm_api_key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://gericare.ai",
                    "X-Title": "GeriCare AI",
                },
            )
        raise LLMServiceError(f"Unsupported LLM_PROVIDER: {self._settings.llm_provider}")

    async def _chat_completion(
        self,
        messages: list[dict[str, str]],
        max_tokens: int = 300,
        temperature: float = 0.6,
        response_format_json: bool = False,
    ) -> str:
        if not self._settings.llm_api_key:
            raise LLMServiceError("LLM service is not configured.")

        url, headers = self._endpoint_and_headers()
        payload: dict = {
            "model": self._settings.llm_model,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
        }
        if response_format_json:
            payload["response_format"] = {"type": "json_object"}

        try:
            async with httpx.AsyncClient(timeout=_REQUEST_TIMEOUT) as client:
                response = await client.post(url, headers=headers, json=payload)
        except httpx.TimeoutException as exc:
            raise LLMServiceError("The language model timed out.") from exc
        except httpx.HTTPError as exc:
            raise LLMServiceError("The language model service is unreachable.") from exc

        if response.status_code >= 400:
            logger.warning("llm_error_response", status=response.status_code)
            raise LLMServiceError("The language model returned an error.")

        try:
            data = response.json()
            return data["choices"][0]["message"]["content"]
        except (KeyError, IndexError, json.JSONDecodeError) as exc:
            raise LLMServiceError("The language model returned an unexpected response.") from exc

    async def generate_patient_response(self, system_prompt: str, user_utterance: str) -> str:
        content = await self._chat_completion(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_utterance},
            ],
            max_tokens=200,
            temperature=0.6,
        )
        return content.strip()

    async def generate_caregiver_summary(self, prompt: str) -> str:
        content = await self._chat_completion(
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You summarize dementia-care interaction data for a caregiver in "
                        "plain, non-clinical language. Never claim a diagnosis."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            max_tokens=250,
            temperature=0.4,
        )
        return content.strip()

    async def generate_family_prompt(self, context: str) -> list[str]:
        content = await self._chat_completion(
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Suggest 3 short, warm conversation prompts a family member could use "
                        "with a loved one, based ONLY on the approved context given. Respond as "
                        'a JSON object: {"prompts": ["...", "...", "..."]}. Do not invent facts '
                        "not present in the context."
                    ),
                },
                {"role": "user", "content": context},
            ],
            max_tokens=200,
            temperature=0.5,
            response_format_json=True,
        )
        try:
            parsed = json.loads(content)
            prompts = parsed.get("prompts", [])
            return [p for p in prompts if isinstance(p, str)][:5]
        except json.JSONDecodeError:
            return []
