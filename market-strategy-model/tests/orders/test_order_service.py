import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.database import Base
from app.orders.schemas import OrderCreate, OrderStatus
from app.orders.service import create_order, transition_order


@pytest.fixture
def session(tmp_path):
    engine = create_engine(f"sqlite:///{tmp_path / 'orders.db'}")
    Base.metadata.create_all(engine)
    with sessionmaker(bind=engine)() as db:
        yield db


def test_order_total_is_server_calculated_and_payment_reported_is_not_paid(session):
    order = create_order(session, OrderCreate(merchant_id="m1", product_name="Cake", quantity=2, unit_price=250))
    assert order.total_amount == 500
    transition_order(session, order.order_id, OrderStatus.pending_confirmation, "m1")
    transition_order(session, order.order_id, OrderStatus.confirmed, "m1")
    transition_order(session, order.order_id, OrderStatus.awaiting_payment, "m1")
    transition_order(session, order.order_id, OrderStatus.payment_reported, "m1")
    assert order.status == OrderStatus.payment_reported.value
    assert order.payment_status == "reported_not_verified"
    with pytest.raises(Exception):
        transition_order(session, order.order_id, OrderStatus.paid, "m1")
