from datetime import datetime, timezone
from sqlalchemy import DateTime, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class StrategyRecord(Base):
    __tablename__ = "strategies"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    strategy_id: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    request_json: Mapped[str] = mapped_column(Text)
    report_json: Mapped[str] = mapped_column(Text)
    score_version: Mapped[str] = mapped_column(String(40))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class PromotionRecord(Base):
    __tablename__ = "promotions"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    promotion_id: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    strategy_id: Mapped[str] = mapped_column(String(64), index=True)
    merchant_id: Mapped[str] = mapped_column(String(100), index=True)
    request_json: Mapped[str] = mapped_column(Text)
    content_json: Mapped[str] = mapped_column(Text)
    demo: Mapped[bool] = mapped_column(default=False)
    idempotency_key: Mapped[str | None] = mapped_column(String(200), unique=True, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class AssetRecord(Base):
    __tablename__ = "assets"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    asset_id: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    merchant_id: Mapped[str] = mapped_column(String(100), index=True)
    promotion_id: Mapped[str | None] = mapped_column(String(64), index=True, nullable=True)
    filename: Mapped[str] = mapped_column(String(255))
    path: Mapped[str] = mapped_column(Text)
    mime_type: Mapped[str] = mapped_column(String(80))
    asset_type: Mapped[str] = mapped_column(String(40))
    width: Mapped[int | None] = mapped_column(Integer, nullable=True)
    height: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class OrderRecord(Base):
    __tablename__ = "orders"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    order_id: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    merchant_id: Mapped[str] = mapped_column(String(100), index=True)
    promotion_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    strategy_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    telegram_chat_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    product_name: Mapped[str] = mapped_column(String(200))
    quantity: Mapped[int] = mapped_column(Integer)
    unit_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    total_amount: Mapped[float | None] = mapped_column(Float, nullable=True)
    currency: Mapped[str] = mapped_column(String(3), default="INR")
    fulfillment_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(40), default="inquiry", index=True)
    payment_status: Mapped[str] = mapped_column(String(40), default="not_available")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class UsageRecord(Base):
    __tablename__ = "promotion_usage"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    merchant_id: Mapped[str] = mapped_column(String(100), index=True)
    period: Mapped[str] = mapped_column(String(7), index=True)
    idempotency_key: Mapped[str] = mapped_column(String(200), unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class TelegramBinding(Base):
    __tablename__ = "telegram_bindings"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    merchant_id: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    chat_id: Mapped[str] = mapped_column(String(100), unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class TelegramLinkToken(Base):
    __tablename__ = "telegram_link_tokens"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    token: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    merchant_id: Mapped[str] = mapped_column(String(100), index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    consumed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class TelegramUpdate(Base):
    __tablename__ = "telegram_updates"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    update_id: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
