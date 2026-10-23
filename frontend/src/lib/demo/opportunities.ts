import { DemoOpportunity } from "../api/types";

/**
 * Explicit demonstration opportunities representing potential upstream trend signals.
 * NOTE: These are illustrative demonstration records for workflow testing and development.
 * They are NOT live trend assertions or statistical guarantees.
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
