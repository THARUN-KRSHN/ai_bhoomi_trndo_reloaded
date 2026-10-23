import httpx


class YouTubeProvider:
    def __init__(self, api_key: str | None, timeout: float = 30.0, max_results: int = 5):
        self.api_key, self.timeout, self.max_results = api_key, timeout, max_results

    @property
    def configured(self) -> bool:
        return bool(self.api_key)

    async def search(self, query: str) -> list[dict]:
        if not self.api_key:
            return []
        async with httpx.AsyncClient(timeout=httpx.Timeout(self.timeout)) as client:
            response = await client.get(
                "https://www.googleapis.com/youtube/v3/search",
                params={"key": self.api_key, "part": "snippet", "q": query, "type": "video", "maxResults": self.max_results},
            )
            response.raise_for_status()
            return [
                {
                    "title": item["snippet"]["title"],
                    "url": f"https://www.youtube.com/watch?v={item['id']['videoId']}",
                    "content": item["snippet"].get("description", ""),
                    "supporting_claim": "Relevant creative or educational resource.",
                }
                for item in response.json().get("items", [])
                if item.get("id", {}).get("videoId")
            ]
