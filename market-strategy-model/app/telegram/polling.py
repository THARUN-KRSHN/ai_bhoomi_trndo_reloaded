import asyncio
import logging

from app.telegram.client import TelegramClient
from app.telegram.handlers import handle_update

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def run() -> None:
    client = TelegramClient()
    if not client.configured:
        raise RuntimeError("TELEGRAM_BOT_TOKEN must be configured before polling starts")
    offset = None
    while True:
        for update in await client.get_updates(offset=offset):
            offset = int(update["update_id"]) + 1
            try:
                await handle_update(update, client)
            except Exception:
                logger.exception("Telegram update handling failed")


if __name__ == "__main__":
    asyncio.run(run())
