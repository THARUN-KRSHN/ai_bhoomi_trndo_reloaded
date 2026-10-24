import json
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.database import Base
from app.db.models import (
    OrderRecord,
    PromotionRecord,
    ShopProfile,
    TelegramBinding,
    TelegramConversationState,
    TelegramUpdate,
)
from app.orders.schemas import OrderStatus
from app.telegram import handlers
from app.telegram.service import (
    consume_link_token,
    create_link_token,
    find_product,
    get_conversation_state,
    record_update_once,
)


class NonClosingSession:
    """Wraps session so 'with SessionLocal()' in handlers doesn't close our test session."""

    def __init__(self, s):
        self.s = s

    def __enter__(self):
        return self.s

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            self.s.rollback()
        else:
            self.s.commit()


class FakeClient:
    """Mock Telegram client that records outgoing messages without calling real Telegram API."""

    def __init__(self, should_fail: bool = False):
        self.messages: list[dict] = []
        self.should_fail = should_fail

    async def send_message(self, chat_id: str, text: str, reply_markup: dict | None = None) -> dict:
        if self.should_fail:
            raise RuntimeError("Telegram API network failure")
        msg = {"chat_id": str(chat_id), "text": text, "reply_markup": reply_markup}
        self.messages.append(msg)
        return {"ok": True, "result": msg}

    @property
    def last_message(self) -> dict | None:
        return self.messages[-1] if self.messages else None


@pytest.fixture
def session(tmp_path):
    engine = create_engine(f"sqlite:///{tmp_path / 'telegram.db'}")
    Base.metadata.create_all(engine)
    with sessionmaker(bind=engine, expire_on_commit=False)() as db:
        yield db


@pytest.fixture
def patched_handlers(session, monkeypatch):
    monkeypatch.setattr(handlers, "SessionLocal", lambda: NonClosingSession(session))
    return handlers


# ---------------------------------------------------------------------------
# Core Service Unit Tests
# ---------------------------------------------------------------------------


def test_link_token_is_single_use(session):
    token = create_link_token(session, "merchant-1")
    assert consume_link_token(session, token, "chat-1")
    assert not consume_link_token(session, token, "chat-2")
    assert session.query(TelegramBinding).filter_by(chat_id="chat-1").count() == 1


def test_telegram_updates_are_deduplicated(session):
    assert record_update_once(session, "42")
    assert not record_update_once(session, "42")


# ---------------------------------------------------------------------------
# Section J Required 18 Tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_01_start_returns_welcome_response(session, patched_handlers):
    """1. /start returns the welcome response with inline buttons."""
    client = FakeClient()
    update = {"update_id": 101, "message": {"chat": {"id": 12345}, "text": "/start"}}
    res = await patched_handlers.handle_update(update, client)
    assert res["status"] == "welcome"
    assert len(client.messages) == 1
    last = client.last_message
    assert "Welcome to TRNDO AI Merchant Assistant!" in last["text"]
    assert "Choose an option below to continue" in last["text"]
    buttons = [btn["text"] for row in last["reply_markup"]["inline_keyboard"] for btn in row]
    assert any("Browse Products" in b for b in buttons)
    assert any("My Orders" in b for b in buttons)
    assert any("Contact Shop" in b for b in buttons)
    assert any("Help" in b for b in buttons)


@pytest.mark.asyncio
async def test_02_help_returns_help_information(session, patched_handlers):
    """2. /help returns help information explaining how to browse, enquire, order, and check orders."""
    client = FakeClient()
    update = {"update_id": 102, "message": {"chat": {"id": 12345}, "text": "/help"}}
    res = await patched_handlers.handle_update(update, client)
    assert res["status"] == "help"
    last = client.last_message
    assert "/products" in last["text"]
    assert "/orders" in last["text"]
    assert "/cancel" in last["text"]


@pytest.mark.asyncio
async def test_03_products_uses_actual_catalogue_data(session, patched_handlers):
    """3. /products uses actual catalogue data from verified shop profile."""
    profile = ShopProfile(
        profile_id="prof-test-1",
        user_id="merchant-test-1",
        profile_json=json.dumps({
            "shop_name": "Aria Bakery",
            "city": "Kochi",
            "products": [
                {"name": "Sourdough Loaf", "price": 250.0, "description": "Naturally fermented"},
                {"name": "Butter Croissant", "price": 120.0, "description": "Flaky French pastry"},
            ],
        }),
    )
    session.add(profile)
    session.commit()

    client = FakeClient()
    update = {"update_id": 103, "message": {"chat": {"id": 12345}, "text": "/products"}}
    res = await patched_handlers.handle_update(update, client)
    assert res["status"] == "catalog_shown"
    last = client.last_message
    assert "Sourdough Loaf" in last["text"]
    assert "₹250.00" in last["text"]
    assert "Naturally fermented" in last["text"]
    assert "Butter Croissant" in last["text"]
    assert "₹120.00" in last["text"]


@pytest.mark.asyncio
async def test_04_unknown_products_do_not_produce_fabricated_product_information(session, patched_handlers):
    """4. Unknown products do not produce fabricated product information."""
    # find_product returns None
    assert find_product(session, "NonExistentHoverboard") is None

    # Callback for non-existent item reports unavailable
    client = FakeClient()
    update = {
        "update_id": 104,
        "callback_query": {
            "data": "order_prod:NonExistentHoverboard",
            "message": {"chat": {"id": 12345}},
        },
    }
    res = await patched_handlers.handle_update(update, client)
    assert res["status"] == "product_unavailable"
    assert "unavailable in the shop catalogue" in client.last_message["text"]

    # When catalogue is empty, reply that shop catalogue is currently unavailable
    session.query(ShopProfile).delete()
    session.commit()
    update_empty = {"update_id": 105, "message": {"chat": {"id": 12345}, "text": "/products"}}
    res_empty = await patched_handlers.handle_update(update_empty, client)
    assert res_empty["status"] == "catalog_empty"
    assert "catalogue is currently unavailable" in client.last_message["text"]


@pytest.mark.asyncio
async def test_05_enquiry_is_saved_and_notifies_correct_merchant(session, patched_handlers):
    """5. An enquiry is saved and notifies the correct merchant."""
    session.add(
        ShopProfile(
            profile_id="prof-spice",
            user_id="merchant-spice",
            profile_json=json.dumps({
                "shop_name": "Organic Spice Co",
                "products": [{"name": "Cardamom Pods", "price": 400.0, "description": "Grade A Green"}],
            }),
        )
    )
    session.add(TelegramBinding(merchant_id="merchant-spice", chat_id="merchant-chat-888"))
    session.commit()

    client = FakeClient()
    cust_chat = "cust-chat-enq-1"

    # Step 1: customer clicks ask question
    await patched_handlers.handle_update({
        "update_id": 106,
        "callback_query": {"data": "enquire_prod:Cardamom Pods", "message": {"chat": {"id": cust_chat}}},
    }, client)
    assert "What would you like to know about Cardamom Pods" in client.last_message["text"]

    # Step 2: customer sends question
    res_q = await patched_handlers.handle_update({
        "update_id": 107,
        "message": {"chat": {"id": cust_chat}, "text": "Are these organically certified?"},
    }, client)
    assert res_q["status"] == "enquiry_processed"

    # Customer receives enquiry_received template with verified details
    cust_msg = [m for m in client.messages if m["chat_id"] == cust_chat][-1]
    assert "received your enquiry about Cardamom Pods" in cust_msg["text"]
    assert "Grade A Green" in cust_msg["text"]
    assert "₹400.00" in cust_msg["text"]

    # Merchant receives alert
    merchant_msg = [m for m in client.messages if m["chat_id"] == "merchant-chat-888"][-1]
    assert "Cardamom Pods" in merchant_msg["text"]
    assert "Are these organically certified?" in merchant_msg["text"]
    assert cust_chat in merchant_msg["text"]


@pytest.mark.asyncio
async def test_06_valid_order_request_created_with_server_calculated_total(session, patched_handlers):
    """6. A valid order request is created with a server-calculated total."""
    session.add(
        ShopProfile(
            profile_id="prof-coffee",
            user_id="merchant-coffee",
            profile_json=json.dumps({
                "shop_name": "Coffee Roasters",
                "products": [{"name": "Cold Brew", "price": 150.0, "description": "Single origin"}],
            }),
        )
    )
    session.add(TelegramBinding(merchant_id="merchant-coffee", chat_id="merchant-chat-coffee"))
    session.commit()

    client = FakeClient()
    cust_chat = "cust-chat-order-01"

    # Step 1: select product
    await patched_handlers.handle_update({
        "update_id": 108,
        "callback_query": {"data": "order_prod:Cold Brew", "message": {"chat": {"id": cust_chat}}},
    }, client)

    # Step 2: enter quantity
    res_qty = await patched_handlers.handle_update({
        "update_id": 109,
        "message": {"chat": {"id": cust_chat}, "text": "3"},
    }, client)
    assert res_qty["status"] == "quantity_recorded"
    assert res_qty["quantity"] == 3

    # Step 3: enter fulfillment notes
    res_notes = await patched_handlers.handle_update({
        "update_id": 110,
        "message": {"chat": {"id": cust_chat}, "text": "Deliver to Office 4B"},
    }, client)
    assert res_notes["status"] == "summary_presented"
    # Check server calculation in summary: 3 * 150.0 = 450.00
    assert "₹450.00" in client.last_message["text"]

    # Step 4: confirm draft
    res_confirm = await patched_handlers.handle_update({
        "update_id": 111,
        "callback_query": {"data": "confirm_order_draft", "message": {"chat": {"id": cust_chat}}},
    }, client)
    assert res_confirm["status"] == "order_created"
    order_id = res_confirm["order_id"]

    # Check DB record
    order = session.query(OrderRecord).filter_by(order_id=order_id).first()
    assert order is not None
    assert order.product_name == "Cold Brew"
    assert order.quantity == 3
    assert float(order.unit_price) == 150.0
    assert float(order.total_amount) == 450.0
    assert order.fulfillment_notes == "Deliver to Office 4B"
    assert order.telegram_chat_id == cust_chat

    # Customer receives order_received template
    cust_msg = [m for m in client.messages if m["chat_id"] == cust_chat][-1]
    assert order_id in cust_msg["text"]
    assert "awaiting confirmation" in cust_msg["text"]

    # Merchant receives notification with buttons
    m_msg = [m for m in client.messages if m["chat_id"] == "merchant-chat-coffee"][-1]
    assert order_id in m_msg["text"]
    assert "₹450.00" in m_msg["text"]
    assert "Deliver to Office 4B" in m_msg["text"]
    m_buttons = [btn["callback_data"] for row in m_msg["reply_markup"]["inline_keyboard"] for btn in row]
    assert f"confirm:{order_id}" in m_buttons
    assert f"reject:{order_id}" in m_buttons
    assert f"send_upi:{order_id}" in m_buttons


@pytest.mark.asyncio
async def test_07_invalid_quantity_and_unknown_pricing_handled(session, patched_handlers):
    """7. Invalid quantity and unknown pricing are handled correctly."""
    session.add(
        ShopProfile(
            profile_id="prof-pottery",
            user_id="merchant-pottery",
            profile_json=json.dumps({
                "shop_name": "Custom Pottery",
                "products": [{"name": "Custom Ceramic Vase", "price": None, "description": "Made to order"}],
            }),
        )
    )
    session.commit()

    client = FakeClient()
    cust_chat = "cust-chat-err"

    # Start ordering
    await patched_handlers.handle_update({
        "update_id": 112,
        "callback_query": {"data": "order_prod:Custom Ceramic Vase", "message": {"chat": {"id": cust_chat}}},
    }, client)

    # Invalid negative quantity
    res_inv1 = await patched_handlers.handle_update({
        "update_id": 113,
        "message": {"chat": {"id": cust_chat}, "text": "-5"},
    }, client)
    assert res_inv1["status"] == "invalid_quantity"
    assert "positive whole number" in client.last_message["text"]

    # Invalid string quantity
    res_inv2 = await patched_handlers.handle_update({
        "update_id": 114,
        "message": {"chat": {"id": cust_chat}, "text": "two"},
    }, client)
    assert res_inv2["status"] == "invalid_quantity"

    # Valid quantity for item with unknown price (price=None)
    await patched_handlers.handle_update({
        "update_id": 115,
        "message": {"chat": {"id": cust_chat}, "text": "2"},
    }, client)
    await patched_handlers.handle_update({
        "update_id": 116,
        "message": {"chat": {"id": cust_chat}, "text": "Blue glaze"},
    }, client)

    summary_msg = client.last_message["text"]
    assert "Price to be confirmed by shop" in summary_msg

    # Confirm order with unknown price -> does not invent price
    res_order = await patched_handlers.handle_update({
        "update_id": 117,
        "callback_query": {"data": "confirm_order_draft", "message": {"chat": {"id": cust_chat}}},
    }, client)
    order_id = res_order["order_id"]
    order = session.query(OrderRecord).filter_by(order_id=order_id).first()
    assert order.unit_price is None
    assert order.total_amount is None


@pytest.mark.asyncio
async def test_08_merchant_confirmation_updates_correct_order(session, patched_handlers):
    """8. Merchant confirmation updates the correct order and notifies customer."""
    session.add(TelegramBinding(merchant_id="merchant-conf-test", chat_id="merchant-chat-conf"))
    order = OrderRecord(
        order_id="ORD-CONFIRM-999",
        merchant_id="merchant-conf-test",
        product_name="Sourdough Loaf",
        quantity=2,
        unit_price=100.0,
        total_amount=200.0,
        status="pending_confirmation",
        payment_status="unpaid",
        telegram_chat_id="cust-chat-999",
    )
    session.add(order)
    session.commit()

    client = FakeClient()
    # Merchant clicks confirm
    res = await patched_handlers.handle_update({
        "update_id": 118,
        "callback_query": {
            "data": f"confirm:{order.order_id}",
            "message": {"chat": {"id": "merchant-chat-conf"}},
        },
    }, client)
    assert res["status"] == "confirmed"

    # Check DB status
    session.refresh(order)
    assert order.status == "confirmed"

    # Check merchant received confirmation
    m_msg = [m for m in client.messages if m["chat_id"] == "merchant-chat-conf"][-1]
    assert f"Order {order.order_id} confirmed" in m_msg["text"]

    # Check customer received order_confirmed template with Pay via UPI button
    cust_msg = [m for m in client.messages if m["chat_id"] == "cust-chat-999"][-1]
    assert f"Your order {order.order_id} has been confirmed" in cust_msg["text"]
    assert "200" in cust_msg["text"]
    assert any("Pay via UPI" in btn["text"] for row in cust_msg["reply_markup"]["inline_keyboard"] for btn in row)


@pytest.mark.asyncio
async def test_09_unauthorized_merchant_actions_are_rejected(session, patched_handlers):
    """9. Unauthorized merchant actions are rejected."""
    session.add(TelegramBinding(merchant_id="merchant-owner", chat_id="merchant-owner-chat"))
    session.add(TelegramBinding(merchant_id="merchant-intruder", chat_id="merchant-intruder-chat"))
    order = OrderRecord(
        order_id="ORD-SECURE-001",
        merchant_id="merchant-owner",
        product_name="Cake",
        quantity=1,
        total_amount=500.0,
        status="pending_confirmation",
        payment_status="unpaid",
        telegram_chat_id="cust-chat-secure",
    )
    session.add(order)
    session.commit()

    client = FakeClient()

    # Case 1: Unlinked stranger chat
    res_stranger = await patched_handlers.handle_update({
        "update_id": 119,
        "callback_query": {
            "data": f"confirm:{order.order_id}",
            "message": {"chat": {"id": "stranger-chat"}},
        },
    }, client)
    assert res_stranger["status"] == "unauthorized"

    # Case 2: Different merchant chat attempting to alter another merchant's order
    res_intruder = await patched_handlers.handle_update({
        "update_id": 120,
        "callback_query": {
            "data": f"confirm:{order.order_id}",
            "message": {"chat": {"id": "merchant-intruder-chat"}},
        },
    }, client)
    assert res_intruder["status"] == "unauthorized"

    # Verify order status was NOT changed in DB
    session.refresh(order)
    assert order.status == "pending_confirmation"


@pytest.mark.asyncio
async def test_10_customer_order_history_is_private(session, patched_handlers):
    """10. Customer order history is private to the correct Telegram identity."""
    order_a = OrderRecord(
        order_id="ORD-ALICE-111",
        merchant_id="merchant-1",
        product_name="Alice's Cake",
        quantity=1,
        total_amount=350.0,
        status="confirmed",
        payment_status="unpaid",
        telegram_chat_id="alice-chat-id",
    )
    order_b = OrderRecord(
        order_id="ORD-BOB-222",
        merchant_id="merchant-1",
        product_name="Bob's Secret Item",
        quantity=2,
        total_amount=800.0,
        status="confirmed",
        payment_status="unpaid",
        telegram_chat_id="bob-chat-id",
    )
    session.add_all([order_a, order_b])
    session.commit()

    client = FakeClient()

    # Alice asks for /orders
    res_alice = await patched_handlers.handle_update({
        "update_id": 121,
        "message": {"chat": {"id": "alice-chat-id"}, "text": "/orders"},
    }, client)
    assert res_alice["status"] == "orders_shown"
    alice_text = client.last_message["text"]
    assert "Alice's Cake" in alice_text
    assert "ORD-ALICE"[:8] in alice_text
    assert "Bob's Secret Item" not in alice_text

    # Charlie (no orders) asks for /orders
    res_charlie = await patched_handlers.handle_update({
        "update_id": 122,
        "message": {"chat": {"id": "charlie-chat-id"}, "text": "/orders"},
    }, client)
    assert res_charlie["status"] == "no_orders"
    assert "no active or past orders" in client.last_message["text"]


@pytest.mark.asyncio
async def test_11_upi_instructions_contain_correct_amount_and_merchant(session, patched_handlers, monkeypatch):
    """11. UPI instructions contain the correct amount and merchant details."""
    from app.config import get_settings

    settings = get_settings()
    monkeypatch.setattr(settings, "upi_merchant_vpa", "merchant@okhdfc")
    monkeypatch.setattr(settings, "upi_payee_name", "Aria Bakery")

    order = OrderRecord(
        order_id="ORD-UPI-TEST-1",
        merchant_id="merchant-1",
        product_name="Special Cake",
        quantity=1,
        total_amount=450.0,
        status="confirmed",
        payment_status="unpaid",
        telegram_chat_id="cust-upi-chat",
    )
    session.add(order)
    session.commit()

    client = FakeClient()
    res = await patched_handlers.handle_update({
        "update_id": 123,
        "callback_query": {"data": f"pay_order:{order.order_id}", "message": {"chat": {"id": "cust-upi-chat"}}},
    }, client)
    assert res["status"] == "upi_sent"

    msg = client.last_message["text"]
    assert "ORD-UPI-TEST-1" in msg
    assert "merchant@okhdfc" in msg
    assert "Aria Bakery" in msg
    assert "₹450.00" in msg
    assert "upi://pay?pa=merchant%40okhdfc" in msg

    # Contains 'I Have Paid' button
    buttons = [btn["callback_data"] for row in client.last_message["reply_markup"]["inline_keyboard"] for btn in row]
    assert f"paid_claim:{order.order_id}" in buttons


@pytest.mark.asyncio
async def test_12_customer_payment_claim_does_not_mark_order_paid(session, patched_handlers):
    """12. A customer payment claim does not mark an order paid."""
    session.add(TelegramBinding(merchant_id="merchant-claim", chat_id="merchant-chat-claim"))
    order = OrderRecord(
        order_id="ORD-CLAIM-888",
        merchant_id="merchant-claim",
        product_name="Matcha Latte",
        quantity=2,
        total_amount=360.0,
        status="awaiting_payment",
        payment_status="unpaid",
        telegram_chat_id="cust-claim-chat",
    )
    session.add(order)
    session.commit()

    client = FakeClient()
    res = await patched_handlers.handle_update({
        "update_id": 124,
        "callback_query": {
            "data": f"paid_claim:{order.order_id}",
            "message": {"chat": {"id": "cust-claim-chat"}},
        },
    }, client)
    assert res["status"] == "payment_reported"

    # Refresh order from DB
    session.refresh(order)
    # Must NOT be marked paid or verified!
    assert order.status != "paid"
    assert order.status == "payment_reported"
    assert order.payment_status != "verified"

    # Customer receives payment_reported template
    cust_msg = [m for m in client.messages if m["chat_id"] == "cust-claim-chat"][-1]
    assert "recorded your payment notification" in cust_msg["text"]
    assert "awaiting verification by the shop" in cust_msg["text"]

    # Merchant receives alert with button to verify and mark paid
    m_msg = [m for m in client.messages if m["chat_id"] == "merchant-chat-claim"][-1]
    assert "Customer Reported Payment" in m_msg["text"]
    m_btns = [btn["callback_data"] for row in m_msg["reply_markup"]["inline_keyboard"] for btn in row]
    assert f"confirm_paid:{order.order_id}" in m_btns


@pytest.mark.asyncio
async def test_13_repeated_updates_do_not_create_duplicate_orders(session, patched_handlers):
    """13. Repeated updates do not create duplicate orders."""
    client = FakeClient()
    update = {
        "update_id": 9999,
        "message": {"chat": {"id": 12345}, "text": "/help"},
    }
    res1 = await patched_handlers.handle_update(update, client)
    assert res1["status"] == "help"
    assert len(client.messages) == 1

    # Second delivery of identical update_id
    res2 = await patched_handlers.handle_update(update, client)
    assert res2["status"] == "duplicate_ignored"
    # No duplicate message dispatched
    assert len(client.messages) == 1


def test_14_invalid_webhook_secrets_are_rejected(monkeypatch):
    """14. Invalid webhook secrets are rejected."""
    from fastapi.testclient import TestClient
    from app.config import get_settings
    from app.main import app
    from app.telegram import routes

    settings = get_settings()
    monkeypatch.setattr(settings, "telegram_webhook_secret", "secret-test-token-12345")

    client = TestClient(app)

    # Wrong secret token
    res_bad = client.post(
        "/api/v1/telegram/webhook",
        json={"update_id": 555, "message": {"chat": {"id": 123}, "text": "/start"}},
        headers={"x-telegram-bot-api-secret-token": "wrong-secret"},
    )
    assert res_bad.status_code == 403
    assert "invalid Telegram webhook secret" in res_bad.json()["detail"]

    # Correct secret token
    async def mock_handle(payload, client_arg):
        return {"status": "ok"}

    monkeypatch.setattr(routes, "handle_update", mock_handle)

    res_good = client.post(
        "/api/v1/telegram/webhook",
        json={"update_id": 556, "message": {"chat": {"id": 123}, "text": "/start"}},
        headers={"x-telegram-bot-api-secret-token": "secret-test-token-12345"},
    )
    assert res_good.status_code == 200


@pytest.mark.asyncio
async def test_15_telegram_delivery_failure_is_handled_truthfully(session):
    """15. Telegram delivery failure is handled truthfully (not marked sent or crashed)."""
    from app.telegram.handlers import _send_safe

    client = FakeClient(should_fail=True)
    success = await _send_safe(client, "12345", "Test message")
    assert success is False


@pytest.mark.asyncio
async def test_16_fallback_response_returned_for_unrecognized_input(session, patched_handlers):
    """16. The fallback response is returned for unrecognized input."""
    client = FakeClient()
    update = {
        "update_id": 125,
        "message": {"chat": {"id": "random-chat-99"}, "text": "abracadabra 9999 xyz"},
    }
    res = await patched_handlers.handle_update(update, client)
    assert res["status"] == "fallback"
    last = client.last_message
    assert "couldn't understand that request" in last["text"].lower()
    buttons = [btn["text"] for row in last["reply_markup"]["inline_keyboard"] for btn in row]
    assert any("Browse Products" in b for b in buttons)


@pytest.mark.asyncio
async def test_17_conversation_state_survives_a_restart(session, patched_handlers):
    """17. Conversation state survives a restart (persisted in TelegramConversationState)."""
    session.add(
        ShopProfile(
            profile_id="prof-restart",
            user_id="merchant-restart",
            profile_json=json.dumps({
                "shop_name": "Restart Bakery",
                "products": [{"name": "Baguette", "price": 80.0, "description": "Crispy French loaf"}],
            }),
        )
    )
    session.commit()

    cust_chat = "restart-cust-chat"
    client = FakeClient()

    # Step 1: User clicks order
    await patched_handlers.handle_update({
        "update_id": 201,
        "callback_query": {"data": "order_prod:Baguette", "message": {"chat": {"id": cust_chat}}},
    }, client)

    # Check state was persisted in DB table
    state, ctx = get_conversation_state(session, cust_chat)
    assert state == "awaiting_quantity"
    assert ctx["product_name"] == "Baguette"

    # Simulate restart by expiring session
    session.expire_all()

    # Step 2: User sends quantity
    res_turn2 = await patched_handlers.handle_update({
        "update_id": 202,
        "message": {"chat": {"id": cust_chat}, "text": "4"},
    }, client)
    assert res_turn2["status"] == "quantity_recorded"

    # Verify state in DB is now awaiting_fulfillment with quantity 4 preserved
    session.expire_all()
    state2, ctx2 = get_conversation_state(session, cust_chat)
    assert state2 == "awaiting_fulfillment"
    assert ctx2["quantity"] == 4
    assert ctx2["product_name"] == "Baguette"

    # Step 3: User sends notes
    res_turn3 = await patched_handlers.handle_update({
        "update_id": 203,
        "message": {"chat": {"id": cust_chat}, "text": "Slice it please"},
    }, client)
    assert res_turn3["status"] == "summary_presented"
    assert "₹320.00" in client.last_message["text"]
    assert "Slice it please" in client.last_message["text"]


@pytest.mark.asyncio
async def test_18_existing_market_strategy_and_promotion_integrations_continue_working(session, patched_handlers):
    """18. Existing Market Strategy and promotion integrations continue working."""
    promo = PromotionRecord(
        promotion_id="promo_summer_fest",
        merchant_id="merchant-promo",
        strategy_id="strat-123",
        request_json="{}",
        content_json=json.dumps({
            "promotion_title": "Summer Festival Special",
            "poster_headline": "Cool Down With Artisanal Iced Tea",
        }),
    )
    session.add(promo)
    session.commit()

    client = FakeClient()
    # Customer arrives via deep link: /start promo_summer_fest
    res = await patched_handlers.handle_update({
        "update_id": 204,
        "message": {"chat": {"id": "promo-cust-chat"}, "text": "/start promo_summer_fest"},
    }, client)
    assert res["status"] == "campaign_welcome"
    assert res["promotion_id"] == "promo_summer_fest"

    msg = client.last_message
    assert "Summer Festival Special" in msg["text"]
    buttons = [btn["text"] for row in msg["reply_markup"]["inline_keyboard"] for btn in row]
    assert any("Order Summer Festival Special" in b for b in buttons)
    assert any("Ask a Question" in b for b in buttons)
