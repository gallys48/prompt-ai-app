from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import uuid4

import httpx

from app.core.config import settings


class GigaChatError(Exception):
    """Ошибка интеграции с GigaChat."""


class GigaChatClient:
    AUTH_URL = "https://ngw.devices.sberbank.ru:9443/api/v2/oauth"
    CHAT_COMPLETIONS_URL = "https://gigachat.devices.sberbank.ru/api/v1/chat/completions"

    def __init__(self) -> None:
        self.auth_key = settings.GIGACHAT_AUTH_KEY
        self.scope = settings.GIGACHAT_SCOPE
        self.model = settings.GIGACHAT_MODEL
        self.verify_ssl = settings.GIGACHAT_VERIFY_SSL
        self.ca_bundle = settings.GIGACHAT_CA_BUNDLE
        self.timeout = settings.GIGACHAT_TIMEOUT_SECONDS

        self._access_token: str | None = None
        self._access_token_expires_at: datetime | None = None

    def _get_verify_param(self) -> bool | str:
        if not self.verify_ssl:
            return False

        if self.ca_bundle:
            return self.ca_bundle

        return True

    async def get_access_token(self) -> str:
        if self._access_token and self._access_token_expires_at:
            if self._access_token_expires_at > datetime.now(UTC) + timedelta(seconds=30):
                return self._access_token

        headers = {
            "Authorization": f"Basic {self.auth_key}",
            "RqUID": str(uuid4()),
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json",
        }

        data = {
            "scope": self.scope,
        }

        async with httpx.AsyncClient(
            verify=self._get_verify_param(),
            timeout=self.timeout,
        ) as client:
            response = await client.post(
                self.AUTH_URL,
                headers=headers,
                data=data,
            )

        if response.status_code != 200:
            raise GigaChatError(
                f"Ошибка получения OAuth token: "
                f"status={response.status_code}, body={response.text}"
            )

        payload = response.json()

        access_token = payload.get("access_token")
        expires_at_raw = payload.get("expires_at")

        if not access_token:
            raise GigaChatError("GigaChat не вернул access_token")

        self._access_token = access_token
        self._access_token_expires_at = self._parse_expires_at(expires_at_raw)

        return access_token

    def _parse_expires_at(self, expires_at_raw: Any) -> datetime:
        if isinstance(expires_at_raw, int | float):
            try:
                return datetime.fromtimestamp(expires_at_raw / 1000, tz=UTC)
            except Exception:
                pass

        return datetime.now(UTC) + timedelta(minutes=25)

    async def chat_completion(
        self,
        messages: list[dict[str, str]],
    ) -> tuple[str, str | None]:
        access_token = await self.get_access_token()

        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

        body = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.7,
        }

        async with httpx.AsyncClient(
            verify=self._get_verify_param(),
            timeout=self.timeout,
        ) as client:
            response = await client.post(
                self.CHAT_COMPLETIONS_URL,
                headers=headers,
                json=body,
            )

        if response.status_code != 200:
            raise GigaChatError(
                f"Ошибка chat completion: "
                f"status={response.status_code}, body={response.text}"
            )

        payload = response.json()

        choices = payload.get("choices") or []

        if not choices:
            raise GigaChatError(f"GigaChat не вернул choices: {payload}")

        message = choices[0].get("message") or {}
        content = message.get("content")

        if not content:
            raise GigaChatError(f"GigaChat не вернул content: {payload}")

        gigachat_message_id = payload.get("id")

        return content, gigachat_message_id


gigachat_client = GigaChatClient()