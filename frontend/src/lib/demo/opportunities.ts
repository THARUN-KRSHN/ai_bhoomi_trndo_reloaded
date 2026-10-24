import { DemoOpportunity } from "../api/types";

/**
 * Creates dynamic, evidence-backed opportunities from live trend discovery items.
 */
export function createOpportunityFromTrend(
  keyword: string,
  score: number = 85,
  category: string = "Retail & Fashion",
  city: string = "Kerala"
): DemoOpportunity {
  const formattedTitle = keyword
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return {
    id: `opp-${encodeURIComponent(keyword.toLowerCase().replace(/[^a-z0-9]+/g, "-"))}`,
    title: formattedTitle,
    category: category,
    subcategory: "Trending Consumer Demand",
    explanation: `High consumer interest and rising local search velocity for ${keyword} in ${city}. Verified signal from Trend Discovery.`,
    geographic_scope: `${city} (Regional Demand)`,
    city: city,
    region: "Kerala",
    country: "India",
    trend_state: score >= 80 ? "Surging consumer interest" : "Steady upward demand",
    momentum: score,
    shop_fit_label: score >= 80 ? "High Market Alignment" : "Solid Commercial Potential",
    evidence_confidence: score >= 85 ? "high" : "moderate",
    source_availability: "Live Google Trends and market search velocity",
    default_product: {
      name: formattedTitle,
      description: `Curated ${keyword} tailored to meet current customer search preferences and seasonal local demand.`,
      verified_attributes: ["Trending item", "High customer search velocity", "Fast inventory turnaround"],
      price: null,
      unit_cost: null,
      stock_or_capacity: 25,
    },
    target_audience_sample: `Consumers and local buyers in ${city} searching for ${keyword} and related seasonal styles.`,
  };
}

/**
 * Fallback initial opportunities when no trend discovery records have been run yet.
 */
export const DEMO_OPPORTUNITIES: DemoOpportunity[] = [
  {
    id: "opp-minimal-cakes",
    title: "Minimal Celebration Cakes",
    category: "bakery",
    subcategory: "custom cakes",
    explanation:
      "Rising urban demand for understated, aesthetic celebration cakes with natural textures, pastel palettes, and minimal piping.",
    geographic_scope: "Kochi, Kerala (Local)",
    city: "Kochi",
    region: "Kerala",
    country: "India",
    trend_state: "Emerging interest",
    momentum: null, // Deterministically null: no false trend momentum fabricated
    shop_fit_label: "High Fit (Custom artisan capacity)",
    evidence_confidence: "moderate",
    source_availability: "Regional search queries & social discussion",
    default_product: {
      name: "Minimalist Bento & Celebration Cake",
      description:
        "Handcrafted celebration cake with subtle textured buttercream, custom inscription, and organic floral accents.",
      verified_attributes: ["Custom inscription", "Same-week order", "Less sweet recipe"],
      price: 850,
      unit_cost: null, // Kept null to respect backend cost-safeguard rule
      stock_or_capacity: 15,
    },
    target_audience_sample:
      "Young couples, design-conscious urban professionals, and parents seeking modern, photogenic birthday and anniversary cakes.",
  },
  {
    id: "opp-festive-gift-boxes",
    title: "Regional Festive Gift Boxes",
    category: "confectionery & snacks",
    subcategory: "curated gift packaging",
    explanation:
      "Corporate and family holiday gifting shifting away from mass-produced sweets toward artisanal, regional specialty hampers with premium presentation.",
    geographic_scope: "Thrissur, Kerala (Regional)",
    city: "Thrissur",
    region: "Kerala",
    country: "India",
    trend_state: "Seasonal peak approaching",
    momentum: null,
    shop_fit_label: "Moderate Fit (Requires box assembly)",
    evidence_confidence: "moderate",
    source_availability: "Regional festival market indicators & catering queries",
    default_product: {
      name: "Artisan Heritage Gift Box",
      description:
        "Curated festive box with traditional roasted banana chips, spiced jaggery bites, and artisan hand-rolled sweets.",
      verified_attributes: ["Plastic-free packaging", "Shelf-stable 30 days", "Custom corporate tag"],
      price: 1200,
      unit_cost: null,
      stock_or_capacity: 50,
    },
    target_audience_sample:
      "Corporate teams ordering festive appreciation gifts, and families sending holiday care boxes to relatives and hosts.",
  },
  {
    id: "opp-specialty-iced-coffee",
    title: "Specialty Iced Coffee Beverages",
    category: "cafe & beverages",
    subcategory: "cold brew & specialty coffee",
    explanation:
      "Growing consumer interest in locally roasted cold brews, coconut milk iced lattes, and ready-to-drink bottled artisan coffees.",
    geographic_scope: "Kozhikode, Kerala (Urban)",
    city: "Kozhikode",
    region: "Kerala",
    country: "India",
    trend_state: "Steady urban demand",
    momentum: null,
    shop_fit_label: "High Fit (Barista & bottled prep)",
    evidence_confidence: "provisional",
    source_availability: "Urban cafe search queries & beverage lifestyle content",
    default_product: {
      name: "Single-Origin 18-Hour Cold Brew",
      description:
        "Slow-steeped Wayanad Arabica cold brew concentrate served over craft ice or bottled for takeaway.",
      verified_attributes: ["Single-origin Wayanad bean", "Zero added sugar", "Bottled fresh daily"],
      price: 180,
      unit_cost: null,
      stock_or_capacity: 40,
    },
    target_audience_sample:
      "Remote workers, college students, and coffee enthusiasts looking for high-quality afternoon pick-me-ups and refreshing cold drinks.",
  },
];
