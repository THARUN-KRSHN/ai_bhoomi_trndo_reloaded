"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  TrendingUp,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { useStrategy } from "@/context/StrategyContext";
import { getStrategyReport } from "@/lib/api/client";
import { StrategyReport } from "@/lib/api/types";
import { Accordion } from "@/components/ui/Accordion";

export default function MarketAnalysisPage() {
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
        Loading Market Analysis...
      </div>
    );
  }

  const primaryOpp = report.opportunities?.[0];

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
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#E3FAEC] text-[#0C3D2D]">
            Market Context
          </span>
        </div>
        <h2 className="text-3xl font-black tracking-tight text-[#111211]">
          Market Analysis
        </h2>
        <p className="text-xs text-[#70736F] mt-1 max-w-2xl leading-relaxed">
          Observed consumer demand signals and local competitive dynamics for {primaryOpp?.title || "your opportunity"}.
        </p>
      </div>

      {/* 3. Executive Summary Card */}
      <div className="p-7 rounded-[26px] bg-[#FFFFFF] border border-[#E4E6E1] space-y-3 shadow-xs">
        <span className="text-[10px] uppercase font-bold tracking-wider text-[#70736F] block">
          Opportunity Summary
        </span>
        <h3 className="text-xl font-bold tracking-tight text-[#111211]">
          {report.market_summary}
        </h3>
        <p className="text-xs text-[#70736F] leading-relaxed">
          Demand observations are strictly separated from strategic interpretation. All claims reflect real-time web citations.
        </p>
      </div>

      {/* 4. Three Supporting Rounded Cards (First Layer) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Demand & Momentum Insight */}
        <div className="p-6 rounded-[24px] bg-[#FFFFFF] border border-[#E4E6E1] flex flex-col justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#70736F] block mb-2">
              Demand & Momentum
            </span>
            <p className="text-xs text-[#111211] font-semibold mb-2">
              {primaryOpp?.momentum
                ? `Momentum score: ${primaryOpp.momentum}/100`
                : "Trend momentum is not available yet"}
            </p>
            <p className="text-xs text-[#70736F] leading-relaxed">
              {primaryOpp?.momentum_reason || "Evaluated based on qualitative search demand; no historical time series was provided."}
            </p>
          </div>
        </div>

        {/* Card 2: Evidence Confidence */}
        <div className="p-6 rounded-[24px] bg-[#FFFFFF] border border-[#E4E6E1] flex flex-col justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#70736F] block mb-2">
              Evidence Confidence
            </span>
            <p className="text-xs text-[#0C3D2D] font-bold capitalize mb-2">
              {primaryOpp?.evidence_confidence || "Moderate"} Confidence
            </p>
            <p className="text-xs text-[#70736F] leading-relaxed">
              Based on {report.source_register?.length || 0} normalized citations. National findings require local validation.
            </p>
          </div>
        </div>

        {/* Card 3: Geographic Scope */}
        <div className="p-6 rounded-[24px] bg-[#FFFFFF] border border-[#E4E6E1] flex flex-col justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#70736F] block mb-2">
              Geographic Scope
            </span>
            <p className="text-xs text-[#111211] font-semibold mb-2 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#0C3D2D]" />
              <span>{report.business_context_summary.split("in")[1]?.split("offering")[0]?.trim() || "Regional Kerala"}</span>
            </p>
            <p className="text-xs text-[#70736F] leading-relaxed">
              Search behavior and inquiries reflect regional metropolitan consumer preferences.
            </p>
          </div>
        </div>
      </div>

      {/* 5. Progressive Disclosure Expandables (Second Layer) */}
      <div className="space-y-4">
        <Accordion
          title="Competitor & Substitute Observations"
          subtitle="Alternative options currently available to local customers"
        >
          <div className="space-y-2 pt-2">
            {report.competitor_substitute_observations.map((obs, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-[#F4F4F1] text-xs text-[#111211] flex items-start gap-2.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#0C3D2D] mt-1.5 flex-shrink-0" />
                <span className="leading-relaxed">{obs}</span>
              </div>
            ))}
          </div>
        </Accordion>

        <Accordion
          title="Evidence Scope & Limitations"
          subtitle="What is established, interpreted, and still uncertain"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-2">
            <div className="p-4 rounded-xl bg-[#F4F4F1] space-y-1">
              <span className="font-bold text-[#0C3D2D] block">Established Fact</span>
              <p className="text-[#70736F]">
                Customer search inquiries exist for aesthetic celebration gifting and transparent WhatsApp order channels.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#F4F4F1] space-y-1">
              <span className="font-bold text-[#111211] block">Interpretation</span>
              <p className="text-[#70736F]">
                Upfront starting tiers and process videos will differentiate your business from secretive commercial alternatives.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#F4F4F1] space-y-1">
              <span className="font-bold text-[#EAA023] block">Still Uncertain</span>
              <p className="text-[#70736F]">
                Exact neighborhood volume and long-distance transport viability must be validated during the 14-day test.
              </p>
            </div>
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
          href={`/market-strategy/report/${reportId}/positioning`}
          className="text-xs font-semibold text-[#0C3D2D] hover:underline flex items-center gap-1"
        >
          <span>Continue to Positioning</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
