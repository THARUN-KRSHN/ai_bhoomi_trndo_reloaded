import { StrategyReport } from "../api/types";

/**
 * Deterministic sample report strictly matching backend StrategyReport schema.
 * Visibly flagged as demo: true.
 * Used for development previews and offline fallback when the backend server is not running.
 */
export const SAMPLE_STRATEGY_REPORT: StrategyReport = {
  strategy_id: "demo-report-minimal-cakes-001",
  generated_at: new Date().toISOString(),
  demo: true,
  generation_method: "openai_responses_structured_outputs",
  research_status: "live",
  business_context_summary:
    "Bakery business in Kochi, Kerala, offering Minimalist Bento & Celebration Cakes for nearby urban customers.",
  executive_recommendation:
    "Run a 14-day measurable local campaign targeting design-conscious young professionals and celebration organizers. Focus on aesthetic presentation, transparent pricing, and 48-hour WhatsApp pre-orders. Keep discounts off the table to protect brand prestige.",
  recommended_decision: "run_test",
  business_objective: "qualified_inquiries",
  target_segment:
    "Young couples, creative professionals, and celebration planners in Kochi seeking minimalist, photogenic cakes.",
  jobs_to_be_done: [
    "Find an elegant, contemporary celebration cake that looks bespoke and photogenic.",
    "Order reliably with clear lead times without stressful back-and-forth messaging.",
    "Avoid generic, overly sweet supermarket or mass-bakery alternatives.",
  ],
  customer_need:
    "Customers desire understated luxury and reliable fulfillment for small gatherings, milestone birthdays, and private parties.",
  barriers: [
    "Uncertainty over flavor quality vs. visual aesthetic.",
    "Concerns about fragile transport and delivery timing across Kochi traffic.",
    "Reluctance to enquire when prices are hidden behind 'DM for price'.",
  ],
  market_summary:
    "Observed market evidence highlights steady inquiry volume for Korean-style bento cakes and pastel rustic finishes. National and regional discussions favor simple ordering funnels, while local reviews emphasize punctual delivery and moisture retention.",
  competitor_substitute_observations: [
    "Mass-market commercial bakeries offer rapid turnaround but rely heavily on generic fondant and heavy artificial coloring.",
    "Home bakers often have irregular turnaround schedules and opaque pricing, causing inquiry drop-off.",
    "Premium hotel pastry shops charge 3x rates with rigid catalogue designs.",
  ],
  opportunities: [
    {
      title: "Artisan Minimalist Celebration Cakes with Upfront Inquiry Menu",
      demand_evidence_ids: ["ev-tav-01", "ev-tav-02", "ev-tav-03"],
      momentum: null, // Deterministically null: no false trend momentum fabricated
      momentum_reason:
        "No continuous historical time-series data available; evaluated on observed qualitative search demand.",
      durability: "steady_local_need",
      shop_fit: 82,
      differentiation: 74,
      commercial_feasibility: 68,
      execution_feasibility: 78,
      priority_score: 72,
      evidence_confidence: "moderate",
      limitations: [
        "Demand evidence is derived from regional search queries and web discussions; localized neighborhood purchasing power requires empirical validation.",
        "Unit cost is unverified by backend; profitability cannot be guaranteed.",
      ],
      decision: "run_test",
    },
  ],
  primary_positioning:
    "Kochi's dedicated studio for understated, photo-ready celebration cakes with effortless WhatsApp booking.",
  value_proposition:
    "Tastefully designed celebration cakes made to order in Kochi, featuring subtle textures, balanced sweetness, and stress-free direct booking.",
  offer_recommendation:
    "Feature a 'Signature 1kg Celebration Bundle' with complimentary custom calligraphy topper and insulated safe-transport packaging for the first 25 pre-orders.",
  pricing_safeguards: [
    "Maintain strict price floor at ₹850; do not run steep percentage discounts.",
    "State all starting prices transparently to eliminate friction while preserving custom tier margins.",
    "Do not claim profitability guarantees until true ingredient and refrigeration unit costs are verified.",
  ],
  channel_strategy: {
    instagram:
      "Showcase close-up slice textures, natural lighting reveals, and simple size guides in Reels and Carousel posts to build aesthetic trust.",
    whatsapp:
      "Serve as the primary qualified inquiry and pre-order channel using a pre-populated catalog link and automated intake questions.",
    local_search:
      "Optimize Google Business Profile with high-resolution imagery and direct WhatsApp action links for nearby event searches.",
  },
  campaign_steps: [
    "Step 1: Publish 3 high-contrast Instagram Reels showcasing the minimal piping process, texture slice, and pristine boxed presentation.",
    "Step 2: Add a clear Instagram Bio link to a 1-click WhatsApp inquiry flow with an upfront menu guide.",
    "Step 3: Run targeted neighborhood organic outreach sharing early weekend booking slots 5 days in advance.",
    "Step 4: Send post-celebration follow-ups offering priority slots for upcoming family occasions to drive repeat intent.",
  ],
  content_formats: [
    "Short aesthetic video (behind-the-scenes assembly & packaging)",
    "Carousel menu with clear pricing and portion sizes",
    "Customer unboxing stories and celebration feedback",
  ],
  call_to_action:
    "Tap the link in bio to check weekend availability on WhatsApp. Only 15 custom slots available per week.",
  language: "English with Malayalam greeting context",
  creative_direction:
    "Editorial minimalism, warm natural daylight, soft ceramic and linen backdrops, muted greens and warm creams. No flashy commercial graphics.",
  research_resources: [
    "https://www.youtube.com/watch?v=demo_bento_cake_packaging",
    "https://www.youtube.com/watch?v=demo_minimalist_buttercream_tips",
  ],
  source_register: [
    {
      evidence_id: "ev-tav-01",
      url: "https://example.com/kochi-artisan-food-trends",
      publisher: "Kerala Food & Lifestyle Journal",
      published_at: "2024-11-14T08:00:00Z",
      retrieved_at: new Date().toISOString(),
      geographic_scope: "local",
      supporting_claim:
        "Urban consumers in Kochi show a 40% uptick in preferences for bespoke, low-sweetness cakes over traditional commercial varieties.",
      limitations: [
        "Regional lifestyle editorial survey; sample size limited to metropolitan consumer respondents.",
      ],
    },
    {
      evidence_id: "ev-tav-02",
      url: "https://example.com/south-india-baking-insights",
      publisher: "South India Retail & Hospitality Forum",
      published_at: "2024-10-02T11:30:00Z",
      retrieved_at: new Date().toISOString(),
      geographic_scope: "regional",
      supporting_claim:
        "WhatsApp Business catalogues have become the leading booking channel for custom celebration bakeries across South Indian Tier-1 and Tier-2 cities.",
      limitations: [
        "Covers multi-city aggregation; specific conversion rates in suburban wards may vary.",
      ],
    },
    {
      evidence_id: "ev-tav-03",
      url: "https://example.com/consumer-dessert-preferences",
      publisher: "Independent Confectionery Review",
      published_at: "2024-09-18T14:15:00Z",
      retrieved_at: new Date().toISOString(),
      geographic_scope: "national",
      supporting_claim:
        "Transparent pricing with upfront starting tiers reduces inquiry abandonment by over 35% among millennial shoppers.",
      limitations: [
        "National survey benchmark; must be tested with local Kochi consumer cohort.",
      ],
    },
  ],
  kpi_plan: {
    metrics: [
      "Qualified WhatsApp inquiries per week (Target: 15–20)",
      "Inquiry-to-confirmed order conversion rate (Target: >= 35%)",
      "Average order value (Target: >= ₹950)",
      "Customer delivery satisfaction score (Target: >= 4.7/5)",
    ],
    test_hypothesis:
      "Transparent pricing combined with aesthetic process Reels will increase qualified WhatsApp inquiries by at least 25% within 14 days without relying on price discounting.",
    comparison_method:
      "Compare the 14-day test period against historical inbound inquiries and measure direct attribution through the unique WhatsApp link.",
    guardrails: [
      "Cap custom orders at 15 cakes per week to protect artisan quality and delivery punctuality.",
      "Never discount below the ₹850 approved price floor.",
      "Do not promise delivery outside a 12km radius until climate-controlled transport is established.",
    ],
    decision_rules: [
      "If qualified inquiries exceed 15/week and conversion is >= 35%, expand channel budget and consider hiring a packaging assistant.",
      "If inquiries fall below 8/week, review video hook styling and test an alternate primary flavor before revising positioning.",
      "If delivery complaints emerge, pause wider radius fulfillment immediately.",
    ],
  },
  assumptions: [
    "Merchant has the artisanal skill and equipment to produce consistent minimalist buttercream finishes.",
    "Merchant can respond to WhatsApp inquiries within a 2-hour window during business hours.",
    "Ingredient costs remain stable over the 14-day campaign horizon.",
  ],
  missing_information: [
    "Precise unit ingredient and packaging cost was not provided; exact gross margin cannot be asserted.",
    "Long-term temperature-controlled delivery capability beyond 12km remains unverified.",
  ],
  next_steps: [
    "Photograph 3 signature minimalist cakes in natural light against neutral backgrounds.",
    "Set up WhatsApp Business automated quick-reply menu with transparent pricing tiers.",
    "Publish the first process Reel and monitor inbound inquiry volume over the initial 72 hours.",
  ],
  score_version: "heuristic-v1",
};
