"use client";

import { useState } from "react";
import { Check, MapPin, Sparkles, ArrowRight, Info, ShieldCheck, ChevronRight } from "lucide-react";
import { DemoOpportunity } from "@/lib/api/types";
import { Drawer } from "@/components/ui/Drawer";

interface OpportunityCardProps {
  opportunity: DemoOpportunity;
  isSelected: boolean;
  onSelect: () => void;
}

export function OpportunityCard({
  opportunity,
  isSelected,
  onSelect,
}: OpportunityCardProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  return (
    <>
      <div
        onClick={onSelect}
        className={`group relative rounded-[26px] p-6 border cursor-pointer transition-all duration-200 flex flex-col justify-between ${
          isSelected
            ? "bg-[#FFFFFF] border-[#111211] shadow-md ring-2 ring-[#70F0A6]"
            : "bg-[#FFFFFF] border-[#E4E6E1] hover:border-[#111211]/30 hover:shadow-xs"
        }`}
      >
        <div>
          {/* Top row: Category pill, location & selection check */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-[#F4F4F1] text-[#111211]">
                {opportunity.category}
              </span>
              <span className="text-xs text-[#70736F] flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#A0A49F]" />
                {opportunity.city}
              </span>
            </div>

            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                isSelected
                  ? "bg-[#70F0A6] text-[#0C3D2D]"
                  : "border border-[#D1D5CE] bg-transparent group-hover:border-[#111211]"
              }`}
            >
              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </div>
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold tracking-tight text-[#111211] mb-2 leading-snug">
            {opportunity.title}
          </h3>

          {/* One-sentence description */}
          <p className="text-xs text-[#70736F] leading-relaxed line-clamp-2 mb-4">
            {opportunity.explanation}
          </p>

          {/* 2 Key Metadata Pills: Status & Shop Fit */}
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#FAFBF9] border border-[#E4E6E1] text-[#111211]">
              {opportunity.trend_state}
            </span>
            <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[#E3FAEC] text-[#0C3D2D]">
              {opportunity.shop_fit_label.split("(")[0].trim()}
            </span>
          </div>
        </div>

        {/* Footer: View Details text trigger and Select indicator */}
        <div className="pt-3 border-t border-[#F0F2EE] flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsDetailsOpen(true);
            }}
            className="text-[#70736F] hover:text-[#111211] font-semibold flex items-center gap-1 focus:outline-none"
          >
            <Info className="w-3.5 h-3.5 text-[#A0A49F]" />
            <span>View Details</span>
          </button>

          <span
            className={`font-semibold ${
              isSelected ? "text-[#0C3D2D]" : "text-[#70736F] group-hover:text-[#111211]"
            }`}
          >
            {isSelected ? "Selected" : "Select"}
          </span>
        </div>
      </div>

      {/* Progressive Disclosure Drawer */}
      <Drawer
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title={opportunity.title}
        categoryTag={opportunity.category}
        footer={
          <div className="w-full flex items-center justify-between">
            <span className="text-xs text-[#70736F]">
              {isSelected ? "Currently selected" : "Click to select"}
            </span>
            <button
              type="button"
              onClick={() => {
                onSelect();
                setIsDetailsOpen(false);
              }}
              className="px-5 py-2.5 rounded-full bg-[#0C3D2D] text-[#70F0A6] text-xs font-bold hover:bg-[#14523E] transition-colors"
            >
              {isSelected ? "Keep Selected" : "Select Opportunity"}
            </button>
          </div>
        }
      >
        <div className="space-y-6 text-xs">
          {/* Overview */}
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#70736F] block mb-1">
              Market Context & Explanation
            </span>
            <p className="text-sm text-[#111211] leading-relaxed">
              {opportunity.explanation}
            </p>
          </div>

          {/* Details Bento Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-[#F4F4F1]">
              <span className="text-[10px] uppercase tracking-wider text-[#70736F] font-bold block mb-1">
                Geographic Scope
              </span>
              <span className="font-semibold text-[#111211]">
                {opportunity.geographic_scope}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F4F4F1]">
              <span className="text-[10px] uppercase tracking-wider text-[#70736F] font-bold block mb-1">
                Evidence Confidence
              </span>
              <span className="font-semibold text-[#0C3D2D] capitalize">
                {opportunity.evidence_confidence} confidence
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F4F4F1]">
              <span className="text-[10px] uppercase tracking-wider text-[#70736F] font-bold block mb-1">
                Shop Fit Rationale
              </span>
              <span className="font-semibold text-[#111211]">
                {opportunity.shop_fit_label}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F4F4F1]">
              <span className="text-[10px] uppercase tracking-wider text-[#70736F] font-bold block mb-1">
                Trend Momentum
              </span>
              <span className="font-semibold text-[#70736F] italic">
                {opportunity.momentum
                  ? `${opportunity.momentum}/100`
                  : "Trend momentum is not available yet"}
              </span>
            </div>
          </div>

          {/* Available signal info */}
          <div className="p-4 rounded-2xl bg-[#FAFBF9] border border-[#E4E6E1] space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#70736F] block">
              Observed Signal Availability
            </span>
            <p className="text-[#111211] leading-relaxed font-medium">
              {opportunity.source_availability}
            </p>
          </div>

          {/* Demonstration Notice */}
          <div className="p-3.5 rounded-2xl bg-[#FFFDF7] border border-[#FDE68A] text-[#92400E] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#EAA023] flex-shrink-0" />
            <span>Demo data · Not live market research</span>
          </div>
        </div>
      </Drawer>
    </>
  );
}
