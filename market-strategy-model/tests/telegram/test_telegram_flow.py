import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.database import Base
from app.db.models import TelegramBinding
from app.telegram.service import consume_link_token, create_link_token, record_update_once


@pytest.fixture
def session(tmp_path):
    engine = create_engine(f"sqlite:///{tmp_path / 'telegram.db'}")
    Base.metadata.create_all(engine)
    with sessionmaker(bind=engine)() as db:
        yield db


def test_link_token_is_single_use(session):
    token = create_link_token(session, "merchant-1")
    assert consume_link_token(session, token, "chat-1")
    assert not consume_link_token(session, token, "chat-2")
    assert session.query(TelegramBinding).filter_by(chat_id="chat-1").count() == 1


def test_telegram_updates_are_deduplicated(session):
    assert record_update_once(session, "42")
    assert not record_update_once(session, "42")


@pytest.mark.asyncio
async def test_handler_rejects_unauthorized_callback(session, monkeypatch):
    from app.telegram import handlers

    monkeypatch.setattr(handlers, "SessionLocal", lambda: session)

    class FakeClient:
        async def send_message(self, chat_id, text, reply_markup=None):
            self.message = text

    result = await handlers.handle_update(
        {"update_id": 1, "callback_query": {"data": "confirm:missing", "message": {"chat": {"id": 99}}}},
        FakeClient(),
    )
    assert result["status"] == "unauthorized"
