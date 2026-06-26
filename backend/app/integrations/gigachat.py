from __future__ import annotations

import logging
from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import uuid4

import httpx

from app.core.config import settings


logger = logging.getLogger(__name__)


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
                logger.debug("Using cached GigaChat access token")
                return self._access_token

        logger.info(
            "Requesting GigaChat OAuth token scope=%s verify_ssl=%s",
            self.scope,
            self.verify_ssl,
        )

        headers = {
            "Authorization": f"Basic {self.auth_key}",
            "RqUID": str(uuid4()),
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json",
        }

        data = {
            "scope": self.scope,
        }

        try:
            async with httpx.AsyncClient(
                verify=self._get_verify_param(),
                timeout=self.timeout,
            ) as client:
                response = await client.post(
                    self.AUTH_URL,
                    headers=headers,
                    data=data,
                )

        except httpx.HTTPError as exc:
            logger.exception("GigaChat OAuth HTTP error")
            raise GigaChatError(f"Ошибка HTTP при получении OAuth token: {exc}") from exc

        if response.status_code != 200:
            logger.warning(
                "GigaChat OAuth failed status=%s body_preview=%s",
                response.status_code,
                response.text[:500],
            )

            raise GigaChatError(
                f"Ошибка получения OAuth token: "
                f"status={response.status_code}, body={response.text[:500]}"
            )

        payload = response.json()

        access_token = payload.get("access_token")
        expires_at_raw = payload.get("expires_at")

        if not access_token:
            logger.warning("GigaChat OAuth response without access_token")
            raise GigaChatError("GigaChat не вернул access_token")

        self._access_token = access_token
        self._access_token_expires_at = self._parse_expires_at(expires_at_raw)

        logger.info(
            "GigaChat OAuth token received expires_at=%s",
            self._access_token_expires_at,
        )

        return access_token

    def _parse_expires_at(self, expires_at_raw: Any) -> datetime:
        if isinstance(expires_at_raw, int | float):
            try:
                return datetime.fromtimestamp(expires_at_raw / 1000, tz=UTC)
            except Exception:
                logger.warning(
                    "Failed to parse GigaChat expires_at=%s",
                    expires_at_raw,
                )

        return datetime.now(UTC) + timedelta(minutes=25)

    async def chat_completion(
        self,
        messages: list[dict[str, str]],
    ) -> tuple[str, str | None]:
        access_token = await self.get_access_token()

        logger.info(
            "Sending GigaChat chat completion model=%s messages_count=%s",
            self.model,
            len(messages),
        )

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

        try:
            async with httpx.AsyncClient(
                verify=self._get_verify_param(),
                timeout=self.timeout,
            ) as client:
                response = await client.post(
                    self.CHAT_COMPLETIONS_URL,
                    headers=headers,
                    json=body,
                )

        except httpx.HTTPError as exc:
            logger.exception("GigaChat chat completion HTTP error")
            raise GigaChatError(f"Ошибка HTTP при запросе chat completion: {exc}") from exc

        if response.status_code != 200:
            logger.warning(
                "GigaChat chat completion failed status=%s body_preview=%s",
                response.status_code,
                response.text[:500],
            )

            raise GigaChatError(
                f"Ошибка chat completion: "
                f"status={response.status_code}, body={response.text[:500]}"
            )

        payload = response.json()

        choices = payload.get("choices") or []

        if not choices:
            logger.warning("GigaChat response without choices")
            raise GigaChatError(f"GigaChat не вернул choices: {payload}")

        message = choices[0].get("message") or {}
        content = message.get("content")

        if not content:
            logger.warning("GigaChat response without content")
            raise GigaChatError(f"GigaChat не вернул content: {payload}")

        gigachat_message_id = payload.get("id")

        logger.info(
            "GigaChat chat completion success gigachat_message_id=%s",
            gigachat_message_id,
        )

        return content, gigachat_message_id


gigachat_client = GigaChatClient()