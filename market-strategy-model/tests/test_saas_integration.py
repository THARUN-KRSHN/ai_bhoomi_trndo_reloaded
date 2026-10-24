import pytest
from fastapi.testclient import TestClient

from app.db.database import Base, engine, SessionLocal
from app.db.models import ShopProfile, StrategyRecord, UserRecord, OrderRecord, PromotionRecord
from app.main import app

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield


def test_auth_and_profile_flow():
    phone = "+919876500001"
    pin = "123456"

    # Register User A
    res = client.post("/api/v1/auth/register", json={"phone_number": phone, "pin": pin})
    assert res.status_code in (200, 409)
    if res.status_code == 409:
        res = client.post("/api/v1/auth/login", json={"phone_number": phone, "pin": pin})
    assert res.status_code == 200
    token_a = res.json()["access_token"]
    user_id_a = res.json()["user_id"]

    headers_a = {"Authorization": f"Bearer {token_a}"}

    # Check Me
    res_me = client.get("/api/v1/auth/me", headers=headers_a)
    assert res_me.status_code == 200
    assert res_me.json()["user_id"] == user_id_a

    # Save Profile
    profile_data = {
        "shop_name": "Aria Bakery",
        "category": "Food & bakery",
        "city": "Kochi",
        "region": "Kerala",
        "country": "India",
        "primary_language": "English",
        "products": [{"name": "Sourdough Loaf", "price": 250}],
        "audience_description": "Local families",
        "objective": "increase_qualified_inquiries",
    }
    res_prof = client.put("/api/v1/profile", json=profile_data, headers=headers_a)
    assert res_prof.status_code == 200
    assert res_prof.json()["profile"]["shop_name"] == "Aria Bakery"

    # Fetch Profile
    res_get_prof = client.get("/api/v1/profile", headers=headers_a)
    assert res_get_prof.status_code == 200
    assert res_get_prof.json()["profile"]["city"] == "Kochi"

    # Test Strategy list
    res_strat = client.get("/api/v1/strategies", headers=headers_a)
    assert res_strat.status_code == 200
    assert isinstance(res_strat.json(), list)

    # Test Promotions list
    res_promo = client.get("/api/v1/promotions", headers=headers_a)
    assert res_promo.status_code == 200
    assert isinstance(res_promo.json(), list)

    # Test Conversations list
    res_conv = client.get("/api/v1/telegram/conversations", headers=headers_a)
    assert res_conv.status_code == 200
    assert "conversations" in res_conv.json()


def test_cross_account_isolation():
    # Create User A
    res_a = client.post("/api/v1/auth/register", json={"phone_number": "+919999900001", "pin": "112233"})
    if res_a.status_code == 409:
        res_a = client.post("/api/v1/auth/login", json={"phone_number": "+919999900001", "pin": "112233"})
    token_a = res_a.json()["access_token"]
    user_a = res_a.json()["user_id"]

    # Create User B
    res_b = client.post("/api/v1/auth/register", json={"phone_number": "+919999900002", "pin": "445566"})
    if res_b.status_code == 409:
        res_b = client.post("/api/v1/auth/login", json={"phone_number": "+919999900002", "pin": "445566"})
    token_b = res_b.json()["access_token"]
    user_b = res_b.json()["user_id"]

    import uuid
    order_id = f"test-order-{uuid.uuid4().hex}"
    # User A creates an order
    with SessionLocal() as session:
        order_a = OrderRecord(
            order_id=order_id,
            merchant_id=user_a,
            user_id=user_a,
            product_name="Signature Bento Cake",
            quantity=1,
            unit_price=450.0,
            total_amount=450.0,
            status="confirmed",
        )
        session.add(order_a)
        session.commit()

    # User A can access order A
    res_get_a = client.get(f"/api/v1/orders/{order_id}?merchant_id={user_a}", headers={"Authorization": f"Bearer {token_a}"})
    assert res_get_a.status_code == 200

    # User B cannot access User A's order
    res_get_b = client.get(f"/api/v1/orders/{order_id}?merchant_id={user_a}", headers={"Authorization": f"Bearer {token_b}"})
    assert res_get_b.status_code == 404


def test_order_transition_and_payment_instructions():
    import uuid
    # Create User
    phone = f"+9198765{uuid.uuid4().hex[:5]}"
    res = client.post("/api/v1/auth/register", json={"phone_number": phone, "pin": "998877"})
    token = res.json()["access_token"]
    user_id = res.json()["user_id"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create Order
    order_id = f"test-ord-{uuid.uuid4().hex[:8]}"
    with SessionLocal() as session:
        order = OrderRecord(
            order_id=order_id,
            merchant_id=user_id,
            user_id=user_id,
            product_name="Pastel Wedding Cake",
            quantity=1,
            unit_price=2500.0,
            total_amount=2500.0,
            status="pending_confirmation",
        )
        session.add(order)
        session.commit()

    # Transition order to confirmed
    res_trans = client.post(
        f"/api/v1/orders/{order_id}/transition?merchant_id={user_id}&status=confirmed",
        headers=headers,
    )
    assert res_trans.status_code == 200
    assert res_trans.json()["status"] == "confirmed"

    # Get Payment Instructions
    res_pay = client.post(
        f"/api/v1/orders/{order_id}/payment-instructions?merchant_id={user_id}",
        headers=headers,
    )
    assert res_pay.status_code == 200
    pay_data = res_pay.json()
    assert "upi_uri" in pay_data
    assert "qr_url" in pay_data
    assert "verification_note" in pay_data


def test_pin_change_lifecycle():
    import uuid
    phone = f"+9198764{uuid.uuid4().hex[:5]}"
    pin_old = "111222"
    pin_new = "333444"

    res_reg = client.post("/api/v1/auth/register", json={"phone_number": phone, "pin": pin_old})
    assert res_reg.status_code == 200
    token = res_reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Change PIN
    res_chg = client.patch(
        "/api/v1/auth/pin",
        json={"current_pin": pin_old, "new_pin": pin_new},
        headers=headers,
    )
    assert res_chg.status_code == 204

    # Old PIN rejected
    res_old_login = client.post("/api/v1/auth/login", json={"phone_number": phone, "pin": pin_old})
    assert res_old_login.status_code == 401

    # New PIN accepted
    res_new_login = client.post("/api/v1/auth/login", json={"phone_number": phone, "pin": pin_new})
    assert res_new_login.status_code == 200
    assert "access_token" in res_new_login.json()

