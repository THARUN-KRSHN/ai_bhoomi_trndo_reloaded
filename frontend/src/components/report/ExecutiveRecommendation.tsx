"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Compass, Info, ShieldCheck, ArrowRight } from "lucide-react";
import { DecisionBadge } from "./DecisionBadge";
import { Decision } from "@/lib/api/types";
import { Drawer } from "@/components/ui/Drawer";

interface ExecutiveRecommendationProps {
  recommendation: string;
  decision: Decision;
  businessContext: string;
  objective: string;
  fitReason?: string;
  campaignRole?: string;
  keyRisk?: string;
  evidenceRationale?: string;
  reportId: string;
}

export function ExecutiveRecommendation({
  recommendation,
  decision,
  businessContext,
  objective,
  fitReason,
  campaignRole,
  keyRisk,
  evidenceRationale,
  reportId,
}: ExecutiveRecommendationProps) {
  const [isRationaleOpen, setIsRationaleOpen] = useState(false);

  return (
    <>
      <div className="relative overflow-hidden rounded-[28px] sm:rounded-[32px] bg-[#111211] text-[#FFFFFF] p-7 sm:p-9 lg:p-10 border border-[#222522] shadow-xl">
        {/* Editorial Decorative glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#0C3D2D]/30 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        {/* Top Header */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#232723]">
          <div className="flex items-center space-x-2.5">
            <span className="w-2 h-2 rounded-full bg-[#70F0A6]" />
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#70F0A6]">
              Recommended Action
            </span>
          </div>

          <DecisionBadge decision={decision} size="md" />
        </div>

        {/* Strong Recommendation Headline */}
        <div className="relative z-10 py-6 sm:py-8 max-w-4xl">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-snug text-[#FFFFFF]">
            {recommendation}
          </h2>

          <p className="text-xs sm:text-sm text-[#C4C7C0] leading-relaxed mt-3 max-w-2xl">
            {campaignRole || "Run a low-risk, measurable test in your local area to validate demand before expanding fulfillment commitments."}
          </p>
        </div>

        {/* Bottom Supporting Reason & Drawer Action */}
        <div className="relative z-10 pt-6 border-t border-[#232723] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div className="text-[#A0A49F] flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#70F0A6]" />
            <span>{fitReason || businessContext}</span>
          </div>

          <button
            type="button"
            onClick={() => setIsRationaleOpen(true)}
            className="inline-flex items-center gap-1.5 font-semibold text-[#70F0A6] hover:underline self-start sm:self-auto focus:outline-none"
          >
            <Info className="w-3.5 h-3.5" />
            <span>Why this recommendation?</span>
          </button>
        </div>
      </div>

      {/* Progressive Disclosure Drawer */}
      <Drawer
        isOpen={isRationaleOpen}
        onClose={() => setIsRationaleOpen(false)}
        title="Why this recommendation?"
        categoryTag="Strategic Rationale"
        footer={
          <Link
            href={`/market-strategy/report/${reportId}/positioning`}
            className="px-5 py-2.5 rounded-full bg-[#0C3D2D] text-[#70F0A6] text-xs font-bold hover:bg-[#14523E] transition-colors flex items-center gap-1.5"
          >
            <span>Explore Positioning Plan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        }
      >
        <div className="space-y-5 text-xs text-[#111211]">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#70736F] block mb-1">
              Core Strategic Logic
            </span>
            <p className="text-sm font-semibold text-[#111211] leading-snug">
              {recommendation}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#F4F4F1] space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#70736F] block">
              Business Context & Fit
            </span>
            <p className="text-[#111211] leading-relaxed">
              {fitReason || businessContext}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#E3FAEC] border border-[#70F0A6]/40 space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#0C3D2D] block">
              Evidence Basis
            </span>
            <p className="text-[#0C3D2D] leading-relaxed">
              {evidenceRationale || "Synthesized from normalized web evidence and local competitor observations. No trend momentum is claimed without historical time-series data."}
            </p>
          </div>

          {keyRisk && (
            <div className="p-4 rounded-2xl bg-[#FFFDF7] border border-[#FDE68A] space-y-1 text-[#92400E]">
              <span className="text-[10px] uppercase font-bold tracking-wider block">
                Primary Guardrail
              </span>
              <p className="leading-relaxed">{keyRisk}</p>
            </div>
          )}
        </div>
      </Drawer>
    </>
  );
}
