import httpx


class TavilyProvider:
    def __init__(self, api_key: str | None, timeout: float = 30.0, max_results: int = 5):
        self.api_key, self.timeout, self.max_results = api_key, timeout, max_results

    @property
    def configured(self) -> bool:
        return bool(self.api_key)

    async def search(self, queries: list[str]) -> list[dict]:
        if not self.api_key:
            return []
        results: list[dict] = []
        async with httpx.AsyncClient(timeout=httpx.Timeout(self.timeout)) as client:
            for query in queries:
                response = await client.post(
                    "https://api.tavily.com/search",
                    json={"api_key": self.api_key, "query": query, "search_depth": "basic", "max_results": self.max_results},
                )
                response.raise_for_status()
                results.extend(response.json().get("results", []))
        return results
