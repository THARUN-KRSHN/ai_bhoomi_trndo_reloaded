import asyncio
import logging

from app.telegram.client import TelegramClient
from app.telegram.handlers import handle_update

logger = logging.getLogger("telegram_polling")


async def run() -> None:
    client = TelegramClient()
    if not client.configured:
        logger.warning("TELEGRAM_BOT_TOKEN is not configured; telegram polling disabled")
        return
    logger.info("Starting Telegram Bot long-polling worker...")
    offset = None
    while True:
        try:
            updates = await client.get_updates(offset=offset, timeout=5)
            for update in updates:
                offset = int(update["update_id"]) + 1
                try:
                    await handle_update(update, client)
                except Exception:
                    logger.exception("Telegram update handling failed")
        except asyncio.CancelledError:
            logger.info("Telegram polling stopped")
            break
        except Exception as exc:
            logger.warning(f"Telegram polling error: {exc}. Retrying in 3s...")
            await asyncio.sleep(3)


if __name__ == "__main__":
    asyncio.run(run())
