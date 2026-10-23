from uuid import uuid4

from fastapi import HTTPException

from app.db.models import OrderRecord
from app.orders.schemas import OrderCreate, OrderStatus


TRANSITIONS = {
    OrderStatus.inquiry: {OrderStatus.pending_confirmation, OrderStatus.rejected, OrderStatus.cancelled},
    OrderStatus.pending_confirmation: {OrderStatus.confirmed, OrderStatus.rejected, OrderStatus.cancelled},
    OrderStatus.confirmed: {OrderStatus.awaiting_payment, OrderStatus.cancelled},
    OrderStatus.awaiting_payment: {OrderStatus.payment_reported, OrderStatus.paid, OrderStatus.cancelled},
    OrderStatus.payment_reported: {OrderStatus.paid, OrderStatus.cancelled},
    OrderStatus.paid: {OrderStatus.ready, OrderStatus.cancelled},
    OrderStatus.ready: {OrderStatus.fulfilled},
    OrderStatus.fulfilled: set(),
    OrderStatus.rejected: set(),
    OrderStatus.cancelled: set(),
}


def create_order(session, request: OrderCreate) -> OrderRecord:
    total = None if request.unit_price is None else round(request.unit_price * request.quantity, 2)
    record = OrderRecord(
        order_id=str(uuid4()),
        merchant_id=request.merchant_id,
        promotion_id=request.promotion_id,
        strategy_id=request.strategy_id,
        telegram_chat_id=request.telegram_chat_id,
        product_name=request.product_name,
        quantity=request.quantity,
        unit_price=request.unit_price,
        total_amount=total,
        currency=request.currency.upper(),
        fulfillment_notes=request.fulfillment_notes,
        status=OrderStatus.inquiry.value,
        payment_status="pending" if total is not None else "unavailable",
    )
    session.add(record)
    session.commit()
    return record


def transition_order(session, order_id: str, target: OrderStatus, merchant_id: str) -> OrderRecord:
    record = session.query(OrderRecord).filter_by(order_id=order_id, merchant_id=merchant_id).first()
    if record is None:
        raise HTTPException(status_code=404, detail="Order not found")
    current = OrderStatus(record.status)
    if target == current:
        return record
    if target not in TRANSITIONS[current]:
        raise HTTPException(status_code=409, detail=f"invalid order transition from {current.value} to {target.value}")
    if target == OrderStatus.paid and record.payment_status != "verified":
        raise HTTPException(status_code=409, detail="payment must be independently verified before marking paid")
    record.status = target.value
    if target == OrderStatus.payment_reported:
        record.payment_status = "reported_not_verified"
    if target == OrderStatus.paid:
        record.payment_status = "verified"
    session.commit()
    return record
