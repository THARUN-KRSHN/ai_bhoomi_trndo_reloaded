from pydantic import BaseModel, Field


class TrendSearchRequest(BaseModel):
    topic: str = Field(min_length=1, max_length=200)
    filters: dict[str, str] = Field(default_factory=dict, max_length=20)


class TrendSearchResponse(BaseModel):
    search_id: str
    topic: str
    demo: bool
    result: dict

