import { BusinessRequest, Order, PromotionRequest, PromotionResponse, StrategyReport } from "./types";
import { SAMPLE_STRATEGY_REPORT } from "../demo/sampleReport";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

const ENABLE_DEMO_DATA =
  process.env.NEXT_PUBLIC_ENABLE_DEMO_DATA !== "false";

function authHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? sessionStorage.getItem("trndo_access_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export class ApiError extends Error {
  status?: number;
  data?: unknown;

  constructor(message: string, status?: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }

}

/**
 * Checks provider status from backend (without exposing keys)
 */
export async function getProviderStatus(): Promise<{
  tavily: string;
  youtube: string;
  openai: string;
}> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/providers/status`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      throw new ApiError("Failed to fetch provider status", res.status);
    }
    return await res.json();
  } catch (err) {
    if (ENABLE_DEMO_DATA) {
      return {
        tavily: "demo_mode",
        youtube: "demo_mode",
        openai: "demo_mode",
      };
    }
    throw err;
  }
}

/**
 * Generates strategy report by calling POST /api/v1/strategy/generate
 * Falls back to explicitly labeled demo fixture if backend is offline and demo mode is enabled.
 */
export async function generateStrategyReport(
  request: BusinessRequest
): Promise<StrategyReport> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s for research & LLM

    const res = await fetch(`${API_BASE_URL}/api/v1/strategy/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorText = await res.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = errorText;
      }
      throw new ApiError(
        errorData?.detail || `Server responded with status ${res.status}`,
        res.status,
        errorData
      );
    }

    const report: StrategyReport = await res.json();
    return report;
  } catch (err: unknown) {
    // If backend is unreachable (e.g. connection refused, network error) and demo mode is allowed:
    if (ENABLE_DEMO_DATA) {
      console.warn(
        "Backend /api/v1/strategy/generate unavailable. Providing demonstration report fixture.",
        err
      );
      // Return demo fixture customized to current request product
      const demoReport = {
        ...SAMPLE_STRATEGY_REPORT,
        strategy_id: `demo-${Date.now()}`,
        generated_at: new Date().toISOString(),
        demo: true,
        business_objective: request.objective,
        target_segment: request.target_audience,
        primary_positioning:
          request.product_positioning || SAMPLE_STRATEGY_REPORT.primary_positioning,
        business_context_summary: `${request.category} in ${request.city}, ${request.region} offering ${request.products_services[0]?.name || "custom products"}.`,
      };
      return demoReport;
    }
    throw err;
  }
}

/**
 * Retrieves an existing strategy report by ID
 */
export async function getStrategyReport(
  strategyId: string
): Promise<StrategyReport> {
  // If demo ID, return demo fixture
  if (strategyId.startsWith("demo-")) {
    return {
      ...SAMPLE_STRATEGY_REPORT,
      strategy_id: strategyId,
      demo: true,
    };
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/strategy/${strategyId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json", ...authHeaders() },
    });

    if (!res.ok) {
      throw new ApiError(
        `Failed to fetch strategy report ${strategyId}`,
        res.status
      );
    }

    return await res.json();
  } catch (err) {
    if (ENABLE_DEMO_DATA) {
      return {
        ...SAMPLE_STRATEGY_REPORT,
        strategy_id: strategyId,
        demo: true,
      };
    }
    throw err;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? sessionStorage.getItem("trndo_access_token") : null;
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {}),
    },
  });
  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch {
      // Preserve the status-based message when the server does not return JSON.
    }
    if (res.status === 401 && typeof window !== "undefined") {
      sessionStorage.removeItem("trndo_access_token");
      window.dispatchEvent(new Event("trndo-auth-expired"));
    }
    throw new ApiError(detail, res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export interface AuthUser {
  user_id: string;
  phone_number: string;
  onboarding_complete: boolean;
  onboarding_skipped: boolean;
}

export async function authenticate(path: "/api/v1/auth/register" | "/api/v1/auth/login", phone_number: string, pin: string) {
  const result = await request<{ access_token: string; user_id: string; onboarding_complete: boolean }>(path, {
    method: "POST",
    body: JSON.stringify({ phone_number, pin }),
  });
  sessionStorage.setItem("trndo_access_token", result.access_token);
  return result;
}

export function getCurrentUser() {
  return request<AuthUser>("/api/v1/auth/me");
}

export async function logout() {
  await request<void>("/api/v1/auth/logout", { method: "POST" });
  sessionStorage.removeItem("trndo_access_token");
}

export async function getProfile() {
  return request<{ profile: Record<string, unknown> | null; version: number }>("/api/v1/profile");
}

export async function saveProfile(profile: Record<string, unknown>) {
  return request<{ profile: Record<string, unknown>; version: number }>("/api/v1/profile", {
    method: "PUT",
    body: JSON.stringify(profile),
  });
}

export async function skipOnboarding() {
  return request<{ onboarding_complete: boolean; onboarding_skipped: boolean }>("/api/v1/auth/onboarding/skip", { method: "POST" });
}

export async function getCategoryOptions(category: string) {
  return request<{ category: string; products: string[]; audiences: string[]; brand_personalities: string[]; channels: string[] }>(`/api/v1/trends/category-options?category=${encodeURIComponent(category)}`);
}

export async function getRecentTrends(limit = 5) {
  return request<Array<{ search_id: string; topic: string; demo: boolean; created_at: string; result: Record<string, unknown>; error: string | null }>>(`/api/v1/trends/recent?limit=${limit}`);
}

export async function searchTrends(topic: string, filters: Record<string, unknown> = {}) {
  return request<{ search_id: string; topic: string; demo: boolean; result: Record<string, unknown> }>("/api/v1/trends/search", {
    method: "POST",
    body: JSON.stringify({ topic, filters }),
  });
}

export async function generateStrategyFromTrend(searchId: string) {
  return request<StrategyReport>(`/api/v1/strategy/from-trend/${encodeURIComponent(searchId)}`, { method: "POST" });
}

export async function generatePromotion(input: PromotionRequest): Promise<PromotionResponse> {
  return request<PromotionResponse>("/api/v1/promotions/generate", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getPromotion(promotionId: string): Promise<PromotionResponse> {
  return request<PromotionResponse>(`/api/v1/promotions/${encodeURIComponent(promotionId)}`);
}

export async function sendPromotionToTelegram(
  promotionId: string,
  merchantId = "development-merchant"
): Promise<{ sent_assets: number }> {
  return request(`/api/v1/promotions/${encodeURIComponent(promotionId)}/telegram/send?merchant_id=${encodeURIComponent(merchantId)}`, {
    method: "POST",
  });
}

export async function getOrder(orderId: string, merchantId = "development-merchant"): Promise<Order> {
  return request<Order>(`/api/v1/orders/${encodeURIComponent(orderId)}?merchant_id=${encodeURIComponent(merchantId)}`);
}

export async function transitionOrder(orderId: string, status: string, merchantId = "development-merchant"): Promise<Order> {
  return request<Order>(`/api/v1/orders/${encodeURIComponent(orderId)}/transition?merchant_id=${encodeURIComponent(merchantId)}&status=${encodeURIComponent(status)}`, {
    method: "POST",
  });
}

export async function getPaymentInstructions(orderId: string, merchantId = "development-merchant") {
  return request<{ order_id: string; upi_uri: string; qr_url: string; verification_note: string }>(
    `/api/v1/orders/${encodeURIComponent(orderId)}/payment-instructions?merchant_id=${encodeURIComponent(merchantId)}`,
    { method: "POST" }
  );
}

export { API_BASE_URL, ENABLE_DEMO_DATA };
