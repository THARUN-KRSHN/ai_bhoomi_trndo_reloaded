"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookmarkCheck,
  Target,
  Users,
  Compass,
  SlidersHorizontal,
  Pencil,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";
import { useStrategy } from "@/context/StrategyContext";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { OpportunitySummaryCard } from "@/components/brief/OpportunitySummaryCard";
import { EditSectionModal, SectionType } from "@/components/brief/EditSectionModal";
import { Accordion } from "@/components/ui/Accordion";

export default function StrategyBriefPage() {
  const router = useRouter();
  const {
    selectedOpportunity,
    brief,
    updateBrief,
    saveDraft,
    isDraftSaved,
  } = useStrategy();

  const [activeEditSection, setActiveEditSection] = useState<SectionType | null>(null);

  const handleGenerate = () => {
    saveDraft();
    router.push("/market-strategy/generating");
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <Breadcrumbs items={[{ label: "Strategy Brief" }]} />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
          <div>
            <div className="flex items-center space-x-2 mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#E3FAEC] text-[#0C3D2D]">
                Step 02
              </span>
              <span className="text-[11px] font-semibold text-[#8E928D] uppercase tracking-wider">
                Brief Configuration
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#111211]">
              Set your strategy direction
            </h1>
            <p className="text-xs text-[#70736F] mt-1">
              Confirm your goal and audience. TRNDO will use your saved business context where available.
            </p>
          </div>

          <div className="flex items-center space-x-3 self-start sm:self-auto">
            <button
              type="button"
              onClick={saveDraft}
              className={`px-4 py-2 rounded-full text-xs font-semibold border flex items-center gap-1.5 transition-all ${
                isDraftSaved
                  ? "bg-[#E3FAEC] text-[#0C3D2D] border-[#70F0A6]"
                  : "bg-[#FFFFFF] text-[#111211] border-[#E4E6E1] hover:border-[#111211]"
              }`}
            >
              <BookmarkCheck className="w-3.5 h-3.5" />
              <span>{isDraftSaved ? "Draft Saved" : "Save Draft"}</span>
            </button>

            <button
              type="button"
              onClick={handleGenerate}
              className="px-6 py-2 rounded-full bg-[#0C3D2D] text-[#70F0A6] text-xs font-bold hover:bg-[#14523E] flex items-center gap-2 shadow-xs transition-all group focus:outline-none focus:ring-2 focus:ring-[#70F0A6]"
            >
              <span>Generate Strategy</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Selected Opportunity Summary */}
      <OpportunitySummaryCard opportunity={selectedOpportunity} />

      {/* Strategy Essentials: 3 Main Cards */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold tracking-tight text-[#111211]">
            Strategy Essentials
          </h2>
          <span className="text-xs text-[#70736F]">
            Select a card to edit its details
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Your Goal */}
          <div className="rounded-[24px] bg-[#FFFFFF] border border-[#E4E6E1] p-6 hover:border-[#111211]/30 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-xl bg-[#F4F4F1] flex items-center justify-center text-[#111211]">
                  <Target className="w-4 h-4" />
                </div>
                <button
                  type="button"
                  onClick={() => setActiveEditSection("goal")}
                  className="w-7 h-7 rounded-full bg-[#F4F4F1] hover:bg-[#E4E6E1] flex items-center justify-center text-[#111211] transition-colors"
                  aria-label="Edit Goal"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>

              <h3 className="text-base font-bold text-[#111211] mb-1">Your Goal</h3>
              <p className="text-xs text-[#0C3D2D] font-semibold mb-2 capitalize">
                {brief.objective.replace(/_/g, " ")} · {brief.campaign_time_horizon}
              </p>
              <p className="text-xs text-[#70736F] leading-relaxed">
                Aiming for measurable customer inquiries over a {brief.campaign_time_horizon} horizon.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActiveEditSection("goal")}
              className="mt-4 pt-3 border-t border-[#F0F2EE] text-xs font-semibold text-[#0C3D2D] hover:underline text-left"
            >
              Edit Goal →
            </button>
          </div>

          {/* Card 2: Your Audience */}
          <div className="rounded-[24px] bg-[#FFFFFF] border border-[#E4E6E1] p-6 hover:border-[#111211]/30 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-xl bg-[#F4F4F1] flex items-center justify-center text-[#111211]">
                  <Users className="w-4 h-4" />
                </div>
                <button
                  type="button"
                  onClick={() => setActiveEditSection("audience")}
                  className="w-7 h-7 rounded-full bg-[#F4F4F1] hover:bg-[#E4E6E1] flex items-center justify-center text-[#111211] transition-colors"
                  aria-label="Edit Audience"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>

              <h3 className="text-base font-bold text-[#111211] mb-1">Your Audience</h3>
              <p className="text-xs text-[#111211] font-semibold mb-2 line-clamp-1">
                {brief.target_audience}
              </p>
              <p className="text-xs text-[#70736F] leading-relaxed line-clamp-2">
                Occasion: Special celebrations, milestone birthdays, and private parties.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActiveEditSection("audience")}
              className="mt-4 pt-3 border-t border-[#F0F2EE] text-xs font-semibold text-[#0C3D2D] hover:underline text-left"
            >
              Edit Audience →
            </button>
          </div>

          {/* Card 3: Market & Brand */}
          <div className="rounded-[24px] bg-[#FFFFFF] border border-[#E4E6E1] p-6 hover:border-[#111211]/30 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-xl bg-[#F4F4F1] flex items-center justify-center text-[#111211]">
                  <Compass className="w-4 h-4" />
                </div>
                <button
                  type="button"
                  onClick={() => setActiveEditSection("positioning")}
                  className="w-7 h-7 rounded-full bg-[#F4F4F1] hover:bg-[#E4E6E1] flex items-center justify-center text-[#111211] transition-colors"
                  aria-label="Edit Brand"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>

              <h3 className="text-base font-bold text-[#111211] mb-1">Market & Brand</h3>
              <p className="text-xs text-[#111211] font-semibold mb-2">
                {brief.city} · {brief.primary_language} · {brief.brand_personality?.split(",")[0] || "Artisan"}
              </p>
              <p className="text-xs text-[#70736F] leading-relaxed line-clamp-2">
                Tone: {brief.desired_tone || "Friendly & refined"}. Focuses on transparent pricing.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActiveEditSection("positioning")}
              className="mt-4 pt-3 border-t border-[#F0F2EE] text-xs font-semibold text-[#0C3D2D] hover:underline text-left"
            >
              Edit Brand & Market →
            </button>
          </div>
        </div>
      </section>

      {/* Advanced Settings: Collapsed Accordion */}
      <section className="pt-2">
        <Accordion
          title="Advanced Strategy Settings"
          subtitle="Budget, price floor, channels, and operational safeguards"
          badge="Optional"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs pt-2">
            <div className="p-4 rounded-xl bg-[#F4F4F1] space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#70736F]">
                Budget Type
              </span>
              <p className="font-semibold text-[#111211] capitalize">
                {brief.budget_type || "Organic marketing"}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#F4F4F1] space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#70736F]">
                Approved Price Floor
              </span>
              <p className="font-semibold text-[#111211]">
                ₹{brief.approved_price_floor || 850} minimum
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#F4F4F1] space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#70736F]">
                Fulfillment Capacity
              </span>
              <p className="font-semibold text-[#111211]">
                {brief.fulfilment_capacity || 15} units / week
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#F4F4F1] space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#70736F]">
                Distribution Channels
              </span>
              <p className="font-semibold text-[#111211] capitalize">
                {brief.preferred_channels?.join(", ").replace(/_/g, " ") || "Instagram, WhatsApp"}
              </p>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <span className="text-xs text-[#70736F]">
              Need to add specific price limits or constraints?
            </span>
            <button
              type="button"
              onClick={() => setActiveEditSection("constraints")}
              className="text-xs font-semibold text-[#0C3D2D] hover:underline"
            >
              Modify Constraints & Safeguards →
            </button>
          </div>
        </Accordion>
      </section>

      {/* Pre-generation Summary Banner & Single Primary Action */}
      <div className="p-6 sm:p-7 rounded-[26px] bg-[#FFFFFF] border border-[#E4E6E1] flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xs">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#0C3D2D] block mb-1">
            Ready to Generate
          </span>
          <p className="text-sm font-semibold text-[#111211]">
            TRNDO will research the opportunity, evaluate its fit, and prepare a strategy for your selected goal.
          </p>
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#0C3D2D] text-[#70F0A6] text-sm font-bold hover:bg-[#14523E] transition-all flex items-center justify-center gap-2 shadow-xs group focus:outline-none focus:ring-2 focus:ring-[#70F0A6] flex-shrink-0"
        >
          <span>Generate Strategy</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Edit Section Modal */}
      {activeEditSection && (
        <EditSectionModal
          section={activeEditSection}
          brief={brief}
          onSave={(updated) => updateBrief(updated)}
          onClose={() => setActiveEditSection(null)}
        />
      )}
    </div>
  );
}
