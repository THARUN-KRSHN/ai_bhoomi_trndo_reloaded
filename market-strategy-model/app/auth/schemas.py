from pydantic import BaseModel, Field


class AuthRequest(BaseModel):
    phone_number: str = Field(min_length=7, max_length=32)
    pin: str = Field(min_length=6, max_length=12, pattern=r"^\d+$")


class AuthResponse(BaseModel):
    access_token: str
    user_id: str
    onboarding_complete: bool
    onboarding_skipped: bool = False


class PinChangeRequest(BaseModel):
    current_pin: str = Field(min_length=6, max_length=12, pattern=r"^\d+$")
    new_pin: str = Field(min_length=6, max_length=12, pattern=r"^\d+$")


class ProductProfile(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: str = Field(min_length=1, max_length=2000)
    verified_attributes: list[str] = Field(default_factory=list, max_length=30)
    price: float | None = Field(default=None, ge=0)
    unit_cost: float | None = Field(default=None, ge=0)
    stock_or_capacity: int | None = Field(default=None, ge=0)


class ShopProfileRequest(BaseModel):
    shop_name: str = Field(min_length=1, max_length=200)
    category: str = Field(min_length=1, max_length=100)
    subcategory: str | None = Field(default=None, max_length=100)
    city: str = Field(min_length=1, max_length=100)
    region: str = Field(min_length=1, max_length=100)
    country: str = Field(min_length=1, max_length=100)
    description: str = Field(default="", max_length=2000)
    audience_description: str = Field(default="", max_length=1000)
    primary_language: str = Field(min_length=2, max_length=80)
    secondary_languages: list[str] = Field(default_factory=list, max_length=5)
    brand_personality: list[str] = Field(default_factory=list, max_length=10)
    price_positioning: str = Field(default="mid_range", max_length=30)
    differentiating_benefits: list[str] = Field(default_factory=list, max_length=20)
    preferred_channels: list[str] = Field(default_factory=list, max_length=10)
    products: list[ProductProfile] = Field(default_factory=list, max_length=30)
    objective: str = Field(default="increase_qualified_inquiries", max_length=80)
    constraints: list[str] = Field(default_factory=list, max_length=30)
