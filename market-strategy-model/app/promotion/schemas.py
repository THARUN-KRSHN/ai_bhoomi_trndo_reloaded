from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field, field_validator


class PromotionFormat(str, Enum):
    portrait = "portrait"
    square = "square"
    story = "story"


class ProductSnapshot(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: str = Field(min_length=1, max_length=2000)
    price: float | None = Field(default=None, ge=0)
    verified_attributes: list[str] = Field(default_factory=list, max_length=30)


class PromotionRequest(BaseModel):
    strategy_id: str | None = None
    merchant_id: str = Field(default="development-merchant", min_length=1, max_length=100)
    product_snapshot: ProductSnapshot | None = None
    brand_asset_id: str | None = None
    product_image_asset_id: str | None = None
    language: str = Field(min_length=2, max_length=80)
    secondary_language: str | None = Field(default=None, max_length=80)
    channels: list[str] = Field(default_factory=list, max_length=10)
    formats: list[PromotionFormat] = Field(default_factory=lambda: [PromotionFormat.portrait], max_length=3)
    campaign_notes: str | None = Field(default=None, max_length=2000)
    approved_price: float | None = Field(default=None, ge=0)
    approved_offer: str | None = Field(default=None, max_length=500)
    cta_preferences: str | None = Field(default=None, max_length=300)
    include_telegram_order_link: bool = False
    demo_mode: bool = False
    idempotency_key: str | None = Field(default=None, max_length=200)

    @field_validator("formats")
    @classmethod
    def unique_formats(cls, values: list[PromotionFormat]) -> list[PromotionFormat]:
        if len(set(values)) != len(values):
            raise ValueError("formats must not contain duplicates")
        return values


class PromotionContent(BaseModel):
    promotion_title: str
    campaign_angle: str
    strategic_rationale: str
    primary_caption: str
    short_caption: str
    instagram_caption: str | None = None
    whatsapp_share_text: str | None = None
    telegram_customer_message: str | None = None
    hashtags: list[str] = Field(default_factory=list)
    call_to_action: str
    poster_headline: str
    poster_subheadline: str | None = None
    approved_product_details: list[str] = Field(default_factory=list)
    design_direction: str
    language: str
    assumptions: list[str] = Field(default_factory=list)
    content_warnings: list[str] = Field(default_factory=list)


class PromotionResponse(BaseModel):
    promotion_id: str
    strategy_id: str
    merchant_id: str
    demo: bool
    content: PromotionContent
    poster_asset_ids: list[str]
    asset_urls: list[str]
    created_at: datetime
    quota_remaining: int
    quota_reset_date: str
