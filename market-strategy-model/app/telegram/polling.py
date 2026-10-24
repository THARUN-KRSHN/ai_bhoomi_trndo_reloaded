import asyncio
import logging

import httpx

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
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code == 409:
                logger.error(
                    "Telegram polling stopped: another consumer is using getUpdates "
                    "or this bot has an active webhook. Set TELEGRAM_MODE=webhook "
                    "or stop the other poller before restarting."
                )
                break
            logger.warning("Telegram polling HTTP error: %s. Retrying in 3s...", exc)
            await asyncio.sleep(3)
        except Exception as exc:
            logger.warning("Telegram polling error: %s. Retrying in 3s...", exc)
            await asyncio.sleep(3)


if __name__ == "__main__":
    asyncio.run(run())
