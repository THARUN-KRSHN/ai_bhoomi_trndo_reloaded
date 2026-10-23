import httpx

from app.config import get_settings


class TelegramClient:
    def __init__(self, token: str | None = None, timeout: float = 15.0):
        self.token = token or get_settings().telegram_bot_token
        self.timeout = timeout

    @property
    def configured(self) -> bool:
        return bool(self.token)

    async def call(self, method: str, payload: dict) -> dict:
        if not self.token:
            raise RuntimeError("Telegram bot token is not configured")
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(f"https://api.telegram.org/bot{self.token}/{method}", json=payload)
            response.raise_for_status()
            body = response.json()
            if not body.get("ok"):
                raise RuntimeError(f"Telegram API rejected {method}")
            return body

    async def send_message(self, chat_id: str, text: str, reply_markup: dict | None = None) -> dict:
        payload = {"chat_id": chat_id, "text": text}
        if reply_markup:
            payload["reply_markup"] = reply_markup
        return await self.call("sendMessage", payload)

    async def send_photo(self, chat_id: str, photo_url: str, caption: str) -> dict:
        return await self.call("sendPhoto", {"chat_id": chat_id, "photo": photo_url, "caption": caption})

    async def get_updates(self, offset: int | None = None, timeout: int = 30) -> list[dict]:
        payload = {"timeout": timeout, "allowed_updates": ["message", "callback_query"]}
        if offset is not None:
            payload["offset"] = offset
        return (await self.call("getUpdates", payload)).get("result", [])
