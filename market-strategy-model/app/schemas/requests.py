from decimal import Decimal
from enum import Enum

from pydantic import BaseModel, Field, field_validator, model_validator


class Objective(str, Enum):
    awareness = "awareness"
    qualified_inquiries = "qualified_inquiries"
    sales = "sales"
    repeat_purchase = "repeat_purchase"
    new_product_launch = "new_product_launch"
    seasonal_promotion = "seasonal_promotion"
    inventory_reduction = "inventory_reduction"


class Product(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: str = Field(min_length=1, max_length=2000)
    verified_attributes: list[str] = Field(default_factory=list, max_length=30)
    price: Decimal | None = Field(default=None, ge=0)
    unit_cost: Decimal | None = Field(default=None, ge=0)
    stock_or_capacity: int | None = Field(default=None, ge=0)


class BusinessRequest(BaseModel):
    business_name: str | None = Field(default=None, max_length=200)
    category: str = Field(min_length=1, max_length=120)
    subcategory: str | None = Field(default=None, max_length=120)
    city: str = Field(min_length=1, max_length=120)
    region: str = Field(min_length=1, max_length=120)
    country: str = Field(min_length=1, max_length=120)
    primary_language: str = Field(min_length=2, max_length=80)
    secondary_languages: list[str] = Field(default_factory=list, max_length=10)
    products_services: list[Product] = Field(min_length=1, max_length=50)
    target_audience: str = Field(min_length=1, max_length=2000)
    objective: Objective
    preferred_channels: list[str] = Field(default_factory=list, max_length=20)
    budget_type: str | None = Field(default=None, max_length=80)
    budget_amount: Decimal | None = Field(default=None, ge=0)
    brand_personality: str | None = Field(default=None, max_length=500)
    product_positioning: str | None = Field(default=None, max_length=1000)
    desired_tone: str | None = Field(default=None, max_length=200)
    campaign_time_horizon: str = Field(min_length=1, max_length=120)
    constraints: list[str] = Field(default_factory=list, max_length=30)
    approved_price_floor: Decimal | None = Field(default=None, ge=0)
    maximum_discount: Decimal | None = Field(default=None, ge=0, le=100)
    fulfilment_capacity: int | None = Field(default=None, ge=0)
    preferred_content_formats: list[str] = Field(default_factory=list, max_length=20)

    @model_validator(mode="after")
    def validate_budget_and_floor(self) -> "BusinessRequest":
        if self.budget_amount is not None and self.budget_type is None:
            raise ValueError("budget_type is required when budget_amount is supplied")
        for product in self.products_services:
            if (
                self.approved_price_floor is not None
                and product.price is not None
                and product.price < self.approved_price_floor
            ):
                raise ValueError("product price cannot be below the approved price floor")
        return self

