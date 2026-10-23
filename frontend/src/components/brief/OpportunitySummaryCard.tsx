"use client";

import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import { DemoOpportunity } from "@/lib/api/types";

interface OpportunitySummaryCardProps {
  opportunity: DemoOpportunity;
}

export function OpportunitySummaryCard({
  opportunity,
}: OpportunitySummaryCardProps) {
  return (
    <div className="rounded-[24px] bg-[#FFFFFF] border border-[#E4E6E1] p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#E3FAEC] text-[#0C3D2D]">
              {opportunity.category}
            </span>
            <span className="text-xs text-[#70736F] flex items-center gap-1">
              <MapPin className="w-3 h-3 text-[#A0A49F]" />
              {opportunity.city}, {opportunity.region}
            </span>
          </div>

          <h3 className="text-xl font-bold tracking-tight text-[#111211]">
            {opportunity.title}
          </h3>

          <p className="text-xs text-[#70736F] max-w-2xl leading-relaxed">
            {opportunity.explanation}
          </p>
        </div>

        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#F0F2EE]">
          <span className="text-[11px] font-semibold text-[#0C3D2D] bg-[#E3FAEC] px-2.5 py-1 rounded-full">
            {opportunity.trend_state}
          </span>
          <Link
            href="/market-strategy"
            className="text-xs font-semibold text-[#70736F] hover:text-[#111211] hover:underline flex items-center gap-1"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Change Opportunity</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
