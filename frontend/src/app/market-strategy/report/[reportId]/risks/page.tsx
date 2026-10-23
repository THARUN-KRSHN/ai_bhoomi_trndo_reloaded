"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertTriangle,
  ShieldAlert,
  Info,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { useStrategy } from "@/context/StrategyContext";
import { getStrategyReport } from "@/lib/api/client";
import { StrategyReport } from "@/lib/api/types";
import { Accordion } from "@/components/ui/Accordion";

export default function RisksAndAssumptionsPage() {
  const routeParams = useParams();
  const reportId = (routeParams?.reportId as string) || "current";
  const { currentReport, setCurrentReport, getReportById } = useStrategy();
  const [report, setReport] = useState<StrategyReport | null>(currentReport);

  useEffect(() => {
    if (!report || report.strategy_id !== reportId) {
      const cached = getReportById(reportId);
      if (cached) {
        setReport(cached);
        setCurrentReport(cached);
      } else {
        getStrategyReport(reportId).then((r) => {
          setReport(r);
          setCurrentReport(r);
        });
      }
    }
  }, [reportId, report, getReportById, setCurrentReport]);

  if (!report) {
    return (
      <div className="py-24 text-center text-xs text-[#70736F]">
        Loading Risks & Assumptions...
      </div>
    );
  }

  const missingInfo = report.missing_information || [];
  const assumptions = report.assumptions || [];

  // Top 3 material risks with explicit consequence and mitigation
  const materialRisks = [
    {
      title: "Inbound Inquiry Conversion Lag",
      consequence: "Merchant spends time on social content without generating confirmed, deposit-backed orders.",
      mitigation: "Include upfront starting price tiers in video descriptions to filter out non-serious inquiries and set an automated WhatsApp FAQ.",
    },
    {
      title: "Perishability & Local Transport Limits",
      consequence: "Product damage or melted decoration during delivery across long distances.",
      mitigation: "Restrict initial campaign radius to 5–7 km or offer storefront pickup only until insulated delivery packaging is verified.",
    },
    {
      title: "Production Capacity Bottleneck",
      consequence: "Overpromising festival delivery slots leading to quality issues or cancelled customer orders.",
      mitigation: "Set a strict daily cap of 5–8 custom orders with mandatory 48-hour advance booking via WhatsApp.",
    },
  ];

  return (
    <div className="space-y-8">
      {/* 1. Back Navigation Pill */}
      <div>
        <Link
          href={`/market-strategy/report/${reportId}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-[#FFFFFF] border border-[#E4E6E1] text-[#70736F] hover:text-[#111211] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Report Overview</span>
        </Link>
      </div>

      {/* 2. Page Title & 1-Sentence Explanation */}
      <div>
        <div className="flex items-center space-x-2 mb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
            Governance & Transparency
          </span>
        </div>
        <h2 className="text-3xl font-black tracking-tight text-[#111211]">
          Risks & Assumptions
        </h2>
        <p className="text-xs text-[#70736F] mt-1 max-w-2xl leading-relaxed">
          Material operational risks, their business consequences, and recommended mitigations for your business.
        </p>
      </div>

      {/* 3. Executive Summary Card */}
      <div className="p-7 rounded-[26px] bg-[#FFFFFF] border border-[#E4E6E1] space-y-3 shadow-xs">
        <span className="text-[10px] uppercase font-bold tracking-wider text-[#70736F] block">
          Governance Summary
        </span>
        <h3 className="text-xl font-bold tracking-tight text-[#111211] leading-snug">
          Safeguarded Recommendations with Known Operational Boundaries
        </h3>
        <p className="text-xs text-[#70736F] leading-relaxed">
          TRNDO AI does not conceal uncertainties. Recommendations account for unverified cost structures and limit upfront exposure to a 14-day controlled test.
        </p>
      </div>

      {/* 4. Three Most Material Risks (First Layer) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-[#111211]">
            Material Operational Risks & Mitigations
          </span>
          <span className="text-xs text-[#70736F]">3 Critical Watchpoints</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {materialRisks.map((risk, idx) => (
            <div
              key={idx}
              className="p-6 rounded-[24px] bg-[#FFFFFF] border border-[#E4E6E1] flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-[#92400E] bg-[#FEF3C7] px-2 py-0.5 rounded-full">
                    RISK 0{idx + 1}
                  </span>
                  <AlertTriangle className="w-4 h-4 text-[#EAA023]" />
                </div>
                <h4 className="text-sm font-bold text-[#111211] leading-snug">
                  {risk.title}
                </h4>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#70736F] block">
                    Consequence
                  </span>
                  <p className="text-xs text-[#70736F] leading-relaxed">
                    {risk.consequence}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E4E6E1] space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0C3D2D] block">
                  Recommended Mitigation
                </span>
                <p className="text-xs text-[#0C3D2D] font-medium leading-relaxed">
                  {risk.mitigation}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Collapsible Additional Considerations (Second Layer) */}
      <div className="space-y-4">
        <Accordion
          title="Additional Considerations & Unverified Information"
          subtitle={`${missingInfo.length} unverified parameters and ${assumptions.length} baseline model assumptions`}
        >
          <div className="space-y-6 pt-2">
            {/* Unverified Information */}
            {missingInfo.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-[#92400E]">
                  <AlertTriangle className="w-4 h-4 text-[#EAA023]" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Unverified Information Gaps
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {missingInfo.map((info, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-[#FFFDF7] border border-[#FDE68A] text-xs text-[#111211] flex items-start gap-2.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#EAA023] mt-1.5 flex-shrink-0" />
                      <span className="leading-relaxed font-medium">{info}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Model Assumptions */}
            {assumptions.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-[#0C3D2D]">
                  <Info className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Explicit Strategy Assumptions
                  </span>
                </div>
                <div className="space-y-2">
                  {assumptions.map((assump, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-[#F4F4F1] text-xs text-[#111211] flex items-start gap-2.5"
                    >
                      <span className="font-mono font-bold text-[#0C3D2D] text-[11px] mt-0.5">
                        0{idx + 1}
                      </span>
                      <span className="leading-relaxed">{assump}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Accordion>
      </div>

      {/* 6. Consistent Back to Report Button */}
      <div className="pt-6 border-t border-[#E4E6E1] flex items-center justify-between">
        <Link
          href={`/market-strategy/report/${reportId}`}
          className="px-6 py-2.5 rounded-full bg-[#111211] text-white text-xs font-semibold hover:bg-[#252825] transition-colors"
        >
          ← Back to Report Overview
        </Link>

        <Link
          href="/market-strategy/brief"
          className="text-xs font-semibold text-[#0C3D2D] hover:underline flex items-center gap-1"
        >
          <span>Modify Strategy Brief</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
