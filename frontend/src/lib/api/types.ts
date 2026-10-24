// Type definitions strictly matching backend schemas in app/schemas/requests.py and app/schemas/reports.py

export type Objective =
  | "awareness"
  | "qualified_inquiries"
  | "sales"
  | "repeat_purchase"
  | "new_product_launch"
  | "seasonal_promotion"
  | "inventory_reduction";

export interface Product {
  name: string;
  description: string;
  verified_attributes?: string[];
  price?: number | null;
  unit_cost?: number | null;
  stock_or_capacity?: number | null;
}

export interface BusinessRequest {
  business_name?: string | null;
  category: string;
  subcategory?: string | null;
  city: string;
  region: string;
  country: string;
  primary_language: string;
  secondary_languages?: string[];
  products_services: Product[];
  target_audience: string;
  objective: Objective;
  preferred_channels?: string[];
  budget_type?: string | null;
  budget_amount?: number | null;
  brand_personality?: string | null;
  product_positioning?: string | null;
  desired_tone?: string | null;
  campaign_time_horizon: string;
  constraints?: string[];
  approved_price_floor?: number | null;
  maximum_discount?: number | null;
  fulfilment_capacity?: number | null;
  preferred_content_formats?: string[];
}

export type GeographicScope = "national" | "regional" | "local" | "unknown";

export interface Evidence {
  evidence_id: string;
  title: string;
  url: string;
  publisher: string;
  snippet: string;
  published_at?: string | null;
  retrieved_at: string;
  source_type: string;
  geographic_scope: GeographicScope;
  relevance: number;
  observed_metric?: string | null;
  supporting_claim: string;
  limitations: string[];
}

export type Decision =
  | "pursue"
  | "run_test"
  | "monitor"
  | "no_action"
  | "insufficient_evidence";

export interface Opportunity {
  title: string;
  demand_evidence_ids: string[];
  momentum?: number | null;
  momentum_reason: string;
  durability: string;
  shop_fit: number;
  differentiation: number;
  commercial_feasibility: number;
  execution_feasibility: number;
  priority_score?: number | null;
  evidence_confidence: string;
  limitations: string[];
  decision: Decision;
}

export interface SourceRegisterItem {
  evidence_id: string;
  url: string;
  publisher: string;
  published_at?: string | null;
  retrieved_at: string;
  geographic_scope: GeographicScope;
  supporting_claim: string;
  limitations: string[];
}

export interface KPIPlan {
  metrics: string[];
  test_hypothesis: string;
  comparison_method: string;
  guardrails: string[];
  decision_rules: string[];
}

export interface StrategyReport {
  strategy_id: string;
  generated_at: string;
  demo: boolean;
  generation_method: string;
  research_status: string;
  business_context_summary: string;
  executive_recommendation: string;
  recommended_decision: Decision;
  business_objective: string;
  target_segment: string;
  jobs_to_be_done: string[];
  customer_need: string;
  barriers: string[];
  market_summary: string;
  competitor_substitute_observations: string[];
  opportunities: Opportunity[];
  primary_positioning: string;
  value_proposition: string;
  offer_recommendation: string;
  pricing_safeguards: string[];
  channel_strategy: Record<string, string>;
  campaign_steps: string[];
  content_formats: string[];
  call_to_action: string;
  language: string;
  creative_direction: string;
  research_resources: string[];
  source_register: SourceRegisterItem[];
  kpi_plan: KPIPlan;
  assumptions: string[];
  missing_information: string[];
  next_steps: string[];
  score_version: string;
}

// Demo Opportunity type for the upstream adapter
export interface DemoOpportunity {
  id: string;
  title: string;
  category: string;
  subcategory: string;
  explanation: string;
  geographic_scope: string;
  city: string;
  region: string;
  country: string;
  trend_state: string;
  momentum?: number | null;
  shop_fit_label: string;
  evidence_confidence: "high" | "moderate" | "provisional" | "insufficient";
  source_availability: string;
  default_product: Product;
  target_audience_sample: string;
}

export type PromotionFormat = "portrait" | "square" | "story";

export interface PromotionRequest {
  strategy_id?: string | null;
  merchant_id?: string;
  product_snapshot: {
    name: string;
    description: string;
    price?: number | null;
    verified_attributes?: string[];
  };
  logo_asset_id?: string | null;
  brand_asset_id?: string | null;
  product_image_asset_id?: string | null;
  product_image_url?: string | null;
  language: string;
  channels: string[];
  formats: PromotionFormat[];
  campaign_notes?: string;
  approved_price?: number | null;
  cta_preferences?: string;
  include_telegram_order_link?: boolean;
  demo_mode?: boolean;
  idempotency_key?: string;
}

export interface PromotionContent {
  promotion_title: string;
  campaign_angle: string;
  strategic_rationale: string;
  primary_caption: string;
  short_caption: string;
  instagram_caption?: string | null;
  whatsapp_share_text?: string | null;
  telegram_customer_message?: string | null;
  hashtags: string[];
  call_to_action: string;
  poster_headline: string;
  poster_subheadline?: string | null;
  approved_product_details: string[];
  design_direction: string;
  language: string;
  assumptions: string[];
  content_warnings: string[];
}

export interface PromotionResponse {
  promotion_id: string;
  strategy_id: string;
  merchant_id: string;
  demo: boolean;
  content: PromotionContent;
  poster_asset_ids: string[];
  asset_urls: string[];
  created_at: string;
  quota_remaining: number;
  quota_reset_date: string;
}

export type OrderStatus =
  | "inquiry"
  | "pending_confirmation"
  | "confirmed"
  | "awaiting_payment"
  | "payment_reported"
  | "paid"
  | "ready"
  | "fulfilled"
  | "rejected"
  | "cancelled";

export interface Order {
  order_id: string;
  merchant_id: string;
  status: OrderStatus;
  product_name: string;
  quantity: number;
  unit_price: number | null;
  total_amount: number | null;
  currency: string;
  payment_status: string;
  fulfillment_notes?: string | null;
  created_at?: string;
}
