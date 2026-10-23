import os
import time
import json
import logging
import statistics
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed
from flask import Flask, request, jsonify, render_template
from dotenv import load_dotenv
from groq import Groq

# Initialize Flask
app = Flask(__name__)

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO").upper(),
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s"
)
logger = logging.getLogger("trendo")

# 1. Load Environment Variables
load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b")
SERPAPI_KEY = os.getenv("SERPAPI_KEY")
MARKETING_STUDIO_URL = os.getenv("MARKETING_STUDIO_URL", "http://localhost:3000/marketing-studio")
STRATEGY_API_URL = os.getenv("STRATEGY_API_URL", "http://127.0.0.1:8000")
client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None
logger.info("App booted | model=%s | api_key_present=%s", GROQ_MODEL, bool(GROQ_API_KEY))
logger.info("SerpApi configured | key_present=%s", bool(SERPAPI_KEY))


@app.before_request
def _log_request_start():
    request._start_ts = time.time()
    logger.info(
        "HTTP request start | method=%s | path=%s | remote=%s",
        request.method,
        request.path,
        request.remote_addr,
    )


@app.after_request
def _log_request_end(response):
    started = getattr(request, "_start_ts", None)
    elapsed_ms = round((time.time() - started) * 1000, 2) if started else None
    logger.info(
        "HTTP request end | method=%s | path=%s | status=%s | elapsed_ms=%s",
        request.method,
        request.path,
        response.status_code,
        elapsed_ms,
    )
    return response


def generate_inventory_trends(user_input):
    """Generates product keywords for a given business."""
    logger.info("LLM generation start | business=%s", user_input)
    if client is None:
        logger.error("LLM generation skipped | GROQ_API_KEY missing")
        return [], "GROQ_API_KEY missing"
    prompt = (
        "You are a trend forecaster for retail search demand. "
        f"Business: {user_input.strip()}. "
        "Generate 25 TREND-SPECIFIC product/search keywords, not generic catalog terms. "
        "Include style/aesthetic/fit/micro-trend intent like oversized, old money, vintage, y2k, coquette, streetwear, quiet luxury when relevant. "
        "Use 2-4 words per keyword. "
        "Output format: one single comma-separated line only, no numbering, no extra text. "
        "Good examples: oversized tshirt, oversized jeans, old money fashion, vintage jeans."
    )
    try:
        llm_start = time.time()
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=320,
        )
        logger.info(
            "LLM generation complete | model=%s | elapsed_ms=%s | finish_reason=%s",
            GROQ_MODEL,
            round((time.time() - llm_start) * 1000, 2),
            response.choices[0].finish_reason if response and response.choices else None,
        )
        raw_text = (response.choices[0].message.content or "").strip().replace("*", "").replace("\n", "")
        logger.info("LLM raw response length=%s", len(raw_text))
        if not raw_text:
            logger.error("LLM returned empty content")
            return [], "Model returned empty content"
        # Deduplicate, keep order
        seen = set()
        cleaned = []
        for k in [x.strip() for x in raw_text.split(",") if x.strip()]:
            low = k.lower()
            if low not in seen:
                seen.add(low)
                cleaned.append(k)
        logger.info("Keywords prepared | total=%s | sample=%s", len(cleaned), cleaned[:5])
        return cleaned, None
    except Exception as e:
        logger.exception("LLM generation failed | error=%s", str(e))
        return [], str(e)


def calculate_reliability(series):
    """Reliability score from time series quality and signal characteristics."""
    if not series:
        return {"score": 0.0, "coverage": 0.0, "non_zero_ratio": 0.0, "stability": 0.0, "trend_signal": 0.0}

    n = len(series)
    coverage = 1.0
    non_zero_ratio = sum(1 for v in series if v > 0) / n
    mean_val = statistics.fmean(series)
    std_val = statistics.pstdev(series) if n > 1 else 0.0
    cv = std_val / (mean_val + 1e-6)
    stability = max(0.0, 1.0 - min(cv, 2.0) / 2.0)
    trend_signal = min(abs(series[-1] - series[0]) / 50.0, 1.0)

    score = 100.0 * (
        0.35 * coverage
        + 0.25 * non_zero_ratio
        + 0.20 * stability
        + 0.20 * trend_signal
    )
    return {
        "score": round(score, 2),
        "coverage": round(coverage, 3),
        "non_zero_ratio": round(non_zero_ratio, 3),
        "stability": round(stability, 3),
        "trend_signal": round(trend_signal, 3),
    }


def get_trends_data(keywords):
    """Fetches Google Trends TIMESERIES data via SerpApi."""
    logger.info("Trends fetch start | keywords_count=%s", len(keywords) if keywords else 0)
    if not SERPAPI_KEY:
        logger.error("SERPAPI_KEY missing")
        return {
            "scores": {},
            "reliability": {},
            "errors": ["SERPAPI_KEY missing"],
            "meta": {"provider": "serpapi", "engine": "google_trends", "timeline_points": 0}
        }

    if not keywords:
        logger.warning("Trends fetch skipped | no keywords")
        return {
            "scores": {},
            "reliability": {},
            "errors": ["No keywords provided"],
            "meta": {"provider": "serpapi", "engine": "google_trends", "timeline_points": 0}
        }

    batches = [keywords[i:i + 5] for i in range(0, len(keywords), 5)]
    all_results = {}
    reliability_results = {}
    all_errors = []
    max_timeline_points = 0

    endpoint = "https://serpapi.com/search.json"

    for i, batch in enumerate(batches):
        logger.info("Trends batch start | batch_index=%s | batch=%s", i + 1, batch)
        try:
            batch_start = time.time()
            params = {
                "engine": "google_trends",
                "q": ",".join(batch),
                "data_type": "TIMESERIES",
                "geo": "IN",
                "date": "today 3-m",
                "hl": "en",
                "tz": -330,
                "api_key": SERPAPI_KEY,
            }
            resp = requests.get(endpoint, params=params, timeout=60)
            resp.raise_for_status()
            payload = resp.json()
            timeline = ((payload.get("interest_over_time") or {}).get("timeline_data") or [])
            max_timeline_points = max(max_timeline_points, len(timeline))

            if not timeline:
                err = f"No timeline_data in batch {i + 1}"
                logger.warning("Trends batch empty timeline | batch_index=%s", i + 1)
                all_errors.append(err)
                continue

            lookup = {k.lower(): k for k in batch}
            series_map = {k: [] for k in batch}

            for point in timeline:
                values = point.get("values") or []
                for item in values:
                    query = str(item.get("query", "")).strip()
                    extracted = item.get("extracted_value")
                    if not isinstance(extracted, (int, float)):
                        continue
                    original = lookup.get(query.lower())
                    if original:
                        series_map[original].append(float(extracted))

            for name, series in series_map.items():
                if series:
                    all_results[name] = round(statistics.fmean(series), 2)
                    reliability_results[name] = calculate_reliability(series)
                else:
                    all_errors.append(f"No time series points for keyword '{name}'")

            logger.info(
                "Trends batch success | batch_index=%s | timeline_points=%s | keywords_scored=%s | elapsed_ms=%s",
                i + 1,
                len(timeline),
                len([k for k in batch if k in all_results]),
                round((time.time() - batch_start) * 1000, 2),
            )
            time.sleep(2)
        except Exception as e:
            logger.exception("Trends batch failed | batch_index=%s | error=%s", i + 1, str(e))
            all_errors.append(f"error_batch_{i+1}: {str(e)}")

    logger.info(
        "Trends fetch complete | result_keys=%s | reliability_keys=%s | errors=%s",
        len(all_results),
        len(reliability_results),
        len(all_errors),
    )
    return {
        "scores": all_results,
        "reliability": reliability_results,
        "errors": all_errors,
        "meta": {
            "provider": "serpapi",
            "engine": "google_trends",
            "timeline_points": max_timeline_points,
            "batches": len(batches),
        }
    }


def analyze_trends(results, reliability_map):
    """Simple ranking analysis from trend scores."""
    logger.info("Analysis start | input_keys=%s", len(results) if results else 0)
    numeric = {k: v for k, v in results.items() if isinstance(v, (int, float))}
    ranked = sorted(numeric.items(), key=lambda x: x[1], reverse=True)
    rel_scores = [v.get("score", 0) for v in reliability_map.values() if isinstance(v, dict)]
    reliability_summary = {
        "avg_reliability": round(statistics.fmean(rel_scores), 2) if rel_scores else 0.0,
        "min_reliability": round(min(rel_scores), 2) if rel_scores else 0.0,
        "max_reliability": round(max(rel_scores), 2) if rel_scores else 0.0,
    }
    logger.info("Analysis complete | numeric=%s | top1=%s", len(numeric), ranked[0] if ranked else None)
    return {
        "total_keywords_analyzed": len(numeric),
        "top_10": [
            {
                "keyword": k,
                "score": s,
                "reliability_score": (reliability_map.get(k) or {}).get("score", 0.0),
            }
            for k, s in ranked[:10]
        ],
        "bottom_5": [
            {
                "keyword": k,
                "score": s,
                "reliability_score": (reliability_map.get(k) or {}).get("score", 0.0),
            }
            for k, s in ranked[-5:]
        ] if ranked else [],
        "reliability_summary": reliability_summary,
    }


def get_product_images(keywords, per_keyword=1):
    """Fetch product image thumbnails using SerpApi Google Images."""
    if not SERPAPI_KEY:
        return {}

    endpoint = "https://serpapi.com/search.json"
    images = {}

    def fetch_one(kw):
        try:
            params = {
                "engine": "google_images",
                "q": kw,
                "ijn": 0,
                "api_key": SERPAPI_KEY,
            }
            resp = requests.get(endpoint, params=params, timeout=8)
            resp.raise_for_status()
            payload = resp.json()
            results = payload.get("images_results") or []

            if results:
                picked = []
                for item in results[:max(per_keyword, 1)]:
                    picked.append({
                        "thumbnail": item.get("thumbnail"),
                        "original": item.get("original"),
                        "title": item.get("title"),
                        "source": item.get("source"),
                        "link": item.get("link"),
                    })
                return kw, picked
            else:
                return kw, []
        except Exception as e:
            logger.warning("Image fetch failed | keyword=%s | error=%s", kw, str(e))
            return kw, []

    # Parallel image fetching to keep response time bounded.
    max_workers = min(6, max(1, len(keywords)))
    with ThreadPoolExecutor(max_workers=max_workers) as ex:
        futures = [ex.submit(fetch_one, kw) for kw in keywords]
        for fut in as_completed(futures):
            kw, items = fut.result()
            images[kw] = items

    return images


@app.route('/get_trends', methods=['POST'])
def api_endpoint():
    """Web endpoint for your website to call."""
    data = request.json or {}
    business = data.get('business') or data.get('occasion', 'general')
    logger.info("API /get_trends payload parsed | business=%s", business)

    keywords, llm_error = generate_inventory_trends(business)
    if not keywords:
        logger.error("API /get_trends failed | business=%s | model=%s | error=%s", business, GROQ_MODEL, llm_error)
        return jsonify({
            "status": "error",
            "business": business,
            "model": GROQ_MODEL,
            "message": "Keyword generation failed",
            "error": llm_error or "No keywords generated"
        }), 502

    trends_payload = get_trends_data(keywords)
    scores = trends_payload.get("scores", {})
    reliability = trends_payload.get("reliability", {})
    analysis = analyze_trends(scores, reliability)
    top_keywords = [x.get("keyword") for x in analysis.get("top_10", []) if x.get("keyword")][:8]
    product_images = get_product_images(top_keywords)
    logger.info(
        "API /get_trends success | business=%s | keywords=%s | analyzed=%s",
        business,
        len(keywords),
        analysis.get("total_keywords_analyzed"),
    )

    return jsonify({
        "status": "success",
        "business": business,
        "model": GROQ_MODEL,
        "keywords": keywords,
        "results": scores,
        "reliability": reliability,
        "analysis": analysis,
        "product_images": product_images,
        "trends_meta": trends_payload.get("meta", {}),
        "trends_errors": trends_payload.get("errors", []),
    })


@app.route('/', methods=['GET'])
def home():
    return render_template('index.html')


@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "ok",
        "message": "UI at /, API POST /get_trends with JSON: {\"business\": \"women clothing store\"}"
    })


@app.route('/marketing-studio', methods=['GET'])
def marketing_studio():
    """Bridge the legacy trend screen to the unified TRNDO frontend."""
    from flask import redirect
    return redirect(MARKETING_STUDIO_URL)


@app.route('/integration/status', methods=['GET'])
def integration_status():
    """Expose non-secret local service URLs for the dashboard shell."""
    return jsonify({
        "product": "TRNDO AI",
        "trend_discovery": "connected",
        "marketing_studio_url": MARKETING_STUDIO_URL,
        "strategy_api_url": STRATEGY_API_URL,
    })


if __name__ == "__main__":
    # Render uses the PORT environment variable
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
