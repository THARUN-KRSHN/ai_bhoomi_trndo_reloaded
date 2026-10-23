from enum import Enum

from pydantic import BaseModel, Field


class OrderStatus(str, Enum):
    inquiry = "inquiry"
    pending_confirmation = "pending_confirmation"
    confirmed = "confirmed"
    awaiting_payment = "awaiting_payment"
    payment_reported = "payment_reported"
    paid = "paid"
    ready = "ready"
    fulfilled = "fulfilled"
    rejected = "rejected"
    cancelled = "cancelled"


class OrderCreate(BaseModel):
    merchant_id: str = Field(min_length=1, max_length=100)
    promotion_id: str | None = None
    strategy_id: str | None = None
    product_name: str = Field(min_length=1, max_length=200)
    quantity: int = Field(gt=0, le=1000)
    unit_price: float | None = Field(default=None, ge=0)
    currency: str = Field(default="INR", min_length=3, max_length=3)
    fulfillment_notes: str | None = Field(default=None, max_length=1000)
    telegram_chat_id: str | None = None


class OrderResponse(BaseModel):
    order_id: str
    merchant_id: str
    status: OrderStatus
    product_name: str
    quantity: int
    unit_price: float | None
    total_amount: float | None
    currency: str
    payment_status: str
