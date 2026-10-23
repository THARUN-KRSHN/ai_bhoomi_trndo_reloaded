"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  TrendingUp,
  Target,
  Share2,
  CalendarCheck,
  FileCheck2,
  BarChart3,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  ArrowUpRight,
} from "lucide-react";
import { useStrategy } from "@/context/StrategyContext";
import { getStrategyReport } from "@/lib/api/client";
import { StrategyReport } from "@/lib/api/types";
import { ExecutiveRecommendation } from "@/components/report/ExecutiveRecommendation";

export default function ReportOverviewPage() {
  const routeParams = useParams();
  const reportId = (routeParams?.reportId as string) || "current";
  const { currentReport, setCurrentReport, getReportById } = useStrategy();
  const [report, setReport] = useState<StrategyReport | null>(currentReport);
  const [loading, setLoading] = useState(!currentReport);

  useEffect(() => {
    async function load() {
      const cached = getReportById(reportId);
      if (cached) {
        setReport(cached);
        setCurrentReport(cached);
        setLoading(false);
        return;
      }
      try {
        const fetched = await getStrategyReport(reportId);
        setReport(fetched);
        setCurrentReport(fetched);
      } catch (err) {
        console.error("Failed to load report overview", err);
      } finally {
        setLoading(false);
      }
    }

    if (!report || report.strategy_id !== reportId) {
      load();
    }
  }, [reportId, report, getReportById, setCurrentReport]);

  if (loading || !report) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-[#0C3D2D] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-[#70736F]">Loading strategy report...</p>
      </div>
    );
  }

  const primaryOpp = report.opportunities?.[0];
  const nextAction = report.next_steps?.[0] || "Prepare test assets";

  return (
    <div className="space-y-10">
      {/* SECTION A: Report Header */}
      <div className="p-5 sm:p-6 rounded-[24px] bg-[#FFFFFF] border border-[#E4E6E1] flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-[#E3FAEC] text-[#0C3D2D]">
            Strategy Report
          </span>
          <span className="font-bold text-[#111211]">
            {primaryOpp?.title || report.business_context_summary}
          </span>
          <span className="text-[#C4C7C0]">·</span>
          <span className="text-[#70736F]">
            Goal: <strong className="capitalize text-[#111211]">{report.business_objective.replace(/_/g, " ")}</strong>
          </span>
          <span className="text-[#C4C7C0]">·</span>
          <span className="text-[#70736F]">
            Location: <strong className="text-[#111211]">{report.business_context_summary.split("in")[1]?.split("offering")[0]?.trim() || "Kochi, Kerala"}</strong>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/market-strategy"
            className="text-xs font-semibold text-[#70736F] hover:text-[#111211]"
          >
            ← Back to Studio
          </Link>
          <Link
            href={`/marketing-studio/create?strategy=${report.strategy_id}`}
            className="rounded-full bg-[#0C3D2D] px-4 py-2 text-xs font-bold text-[#70F0A6] hover:bg-[#14523E]"
          >
            Create Promotion
          </Link>
        </div>
      </div>

      {/* SECTION B: Executive Recommendation Hero (Reference A) */}
      <ExecutiveRecommendation
        recommendation={report.executive_recommendation}
        decision={report.recommended_decision}
        businessContext={report.business_context_summary}
        objective={report.business_objective}
        fitReason={primaryOpp ? `Heuristic Shop Fit: ${primaryOpp.shop_fit}/100 based on verified artisan capacity.` : undefined}
        campaignRole="14-day localized validation test before committing long-term equipment or labor."
        keyRisk={report.pricing_safeguards?.[0] || "Maintain approved price floor; no discounts."}
        evidenceRationale={`Report built from ${report.source_register?.length || 0} normalized source references.`}
        reportId={report.strategy_id}
      />

      {/* SECTION C: Key Takeaway Strip (At most 3 compact cards - Rule 2) */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Priority Score */}
        <div className="p-5 rounded-[22px] bg-[#FFFFFF] border border-[#E4E6E1] flex flex-col justify-between">
          <span className="text-[10px] uppercase tracking-wider text-[#70736F] font-bold block mb-1">
            Opportunity Priority
          </span>
          <div className="flex items-baseline gap-1 my-1">
            <span className="text-2xl font-black text-[#111211]">
              {primaryOpp?.priority_score ? Math.round(primaryOpp.priority_score) : "N/A"}
            </span>
            <span className="text-xs text-[#70736F]">/ 100</span>
          </div>
          <span className="text-[11px] text-[#8E928D]">
            Deterministic heuristic score
          </span>
        </div>

        {/* Evidence Confidence */}
        <div className="p-5 rounded-[22px] bg-[#FFFFFF] border border-[#E4E6E1] flex flex-col justify-between">
          <span className="text-[10px] uppercase tracking-wider text-[#70736F] font-bold block mb-1">
            Evidence Confidence
          </span>
          <div className="my-1">
            <span className="text-xl font-bold text-[#0C3D2D] capitalize">
              {primaryOpp?.evidence_confidence || "Moderate"}
            </span>
          </div>
          <span className="text-[11px] text-[#8E928D]">
            {report.source_register?.length || 0} external citations checked
          </span>
        </div>

        {/* Recommended Next Action */}
        <div className="p-5 rounded-[22px] bg-[#FFFFFF] border border-[#E4E6E1] flex flex-col justify-between">
          <span className="text-[10px] uppercase tracking-wider text-[#70736F] font-bold block mb-1">
            Next Action
          </span>
          <p className="text-xs font-semibold text-[#111211] line-clamp-2 my-1 leading-snug">
            {nextAction}
          </p>
          <Link
            href={`/market-strategy/report/${report.strategy_id}/execution`}
            className="text-[11px] font-semibold text-[#0C3D2D] hover:underline"
          >
            View Execution Plan →
          </Link>
        </div>
      </section>

      {/* SECTION D: 4 Primary Bento Cards (References B & C) */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-[#111211]">
            Strategy Workspaces
          </h2>
          <p className="text-xs text-[#70736F] mt-0.5">
            Select a card to explore detailed insights and campaign execution.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card 1: The Market */}
          <Link
            href={`/market-strategy/report/${report.strategy_id}/market-analysis`}
            className="group p-6 sm:p-7 rounded-[26px] bg-[#FFFFFF] border border-[#E4E6E1] hover:border-[#111211]/30 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-[#F4F4F1] flex items-center justify-center text-[#111211]">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div className="w-7 h-7 rounded-full bg-[#F4F4F1] flex items-center justify-center text-[#111211] group-hover:bg-[#111211] group-hover:text-white transition-colors">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </div>

              <h3 className="text-lg font-bold text-[#111211] mb-1.5 group-hover:text-[#0C3D2D] transition-colors">
                The Market
              </h3>

              <p className="text-xs text-[#70736F] leading-relaxed line-clamp-2 mb-4">
                {report.market_summary}
              </p>
            </div>

            <div className="pt-3 border-t border-[#F0F2EE] flex items-center justify-between text-xs font-semibold text-[#0C3D2D]">
              <span>Explore Market Signals</span>
              <span>→</span>
            </div>
          </Link>

          {/* Card 2: Your Strategy */}
          <Link
            href={`/market-strategy/report/${report.strategy_id}/positioning`}
            className="group p-6 sm:p-7 rounded-[26px] bg-[#0C3D2D] text-white border border-[#0C3D2D] hover:border-[#70F0A6]/40 transition-all flex flex-col justify-between shadow-xs"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-[#14523E] flex items-center justify-center text-[#70F0A6]">
                  <Target className="w-4 h-4" />
                </div>
                <div className="w-7 h-7 rounded-full bg-[#14523E] flex items-center justify-center text-[#70F0A6] group-hover:bg-[#70F0A6] group-hover:text-[#0C3D2D] transition-colors">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </div>

              <h3 className="text-lg font-bold text-white mb-1.5 group-hover:text-[#70F0A6] transition-colors">
                Your Strategy
              </h3>

              <p className="text-xs text-[#E3FAEC] leading-relaxed line-clamp-2 mb-4">
                {report.primary_positioning}
              </p>
            </div>

            <div className="pt-3 border-t border-[#70F0A6]/20 flex items-center justify-between text-xs font-semibold text-[#70F0A6]">
              <span>View Strategy & Positioning</span>
              <span>→</span>
            </div>
          </Link>

          {/* Card 3: Where to Reach Customers */}
          <Link
            href={`/market-strategy/report/${report.strategy_id}/channels`}
            className="group p-6 sm:p-7 rounded-[26px] bg-[#FFFFFF] border border-[#E4E6E1] hover:border-[#111211]/30 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-[#F4F4F1] flex items-center justify-center text-[#111211]">
                  <Share2 className="w-4 h-4" />
                </div>
                <div className="w-7 h-7 rounded-full bg-[#F4F4F1] flex items-center justify-center text-[#111211] group-hover:bg-[#111211] group-hover:text-white transition-colors">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </div>

              <h3 className="text-lg font-bold text-[#111211] mb-1.5 group-hover:text-[#0C3D2D] transition-colors">
                Where to Reach Customers
              </h3>

              <p className="text-xs text-[#70736F] leading-relaxed line-clamp-2 mb-4">
                Recommended touchpoints across {Object.keys(report.channel_strategy || {}).join(", ").replace(/_/g, " ")}.
              </p>
            </div>

            <div className="pt-3 border-t border-[#F0F2EE] flex items-center justify-between text-xs font-semibold text-[#0C3D2D]">
              <span>View Channels & Formats</span>
              <span>→</span>
            </div>
          </Link>

          {/* Card 4: Your Action Plan */}
          <Link
            href={`/market-strategy/report/${report.strategy_id}/execution`}
            className="group p-6 sm:p-7 rounded-[26px] bg-[#FFFFFF] border border-[#E4E6E1] hover:border-[#111211]/30 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-[#F4F4F1] flex items-center justify-center text-[#111211]">
                  <CalendarCheck className="w-4 h-4" />
                </div>
                <div className="w-7 h-7 rounded-full bg-[#F4F4F1] flex items-center justify-center text-[#111211] group-hover:bg-[#111211] group-hover:text-white transition-colors">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </div>

              <h3 className="text-lg font-bold text-[#111211] mb-1.5 group-hover:text-[#0C3D2D] transition-colors">
                Your Action Plan
              </h3>

              <p className="text-xs text-[#70736F] leading-relaxed line-clamp-2 mb-4">
                Phased 14-day execution sequence starting with: &ldquo;{report.campaign_steps?.[0] || "Launch test"}&rdquo;
              </p>
            </div>

            <div className="pt-3 border-t border-[#F0F2EE] flex items-center justify-between text-xs font-semibold text-[#0C3D2D]">
              <span>See Action Plan Timeline</span>
              <span>→</span>
            </div>
          </Link>
        </div>
      </section>

      {/* SECTION E: Supporting Report Sections (Evidence & Measurement) */}
      <section className="pt-4 border-t border-[#E4E6E1] space-y-4">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#70736F] block mb-0.5">
            Validation & Governance
          </span>
          <h3 className="text-base font-bold text-[#111211]">
            Evidence & Measurement
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href={`/market-strategy/report/${report.strategy_id}/evidence`}
            className="p-5 rounded-[22px] bg-[#FFFFFF] border border-[#E4E6E1] hover:border-[#111211]/30 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-[#F4F4F1] flex items-center justify-center text-[#111211]">
                <FileCheck2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#111211] group-hover:text-[#0C3D2D] transition-colors">
                  Research Evidence
                </h4>
                <p className="text-[11px] text-[#70736F]">
                  {report.source_register?.length || 0} verified external citations
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#70736F] group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <Link
            href={`/market-strategy/report/${report.strategy_id}/measurement`}
            className="p-5 rounded-[22px] bg-[#FFFFFF] border border-[#E4E6E1] hover:border-[#111211]/30 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-[#F4F4F1] flex items-center justify-center text-[#111211]">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#111211] group-hover:text-[#0C3D2D] transition-colors">
                  Measure Results
                </h4>
                <p className="text-[11px] text-[#70736F]">
                  Hypothesis, baseline & stop/scale rules
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#70736F] group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Quieter Secondary Link */}
        <div className="pt-2 text-center sm:text-left">
          <Link
            href={`/market-strategy/report/${report.strategy_id}/risks`}
            className="text-xs font-semibold text-[#70736F] hover:text-[#111211] underline underline-offset-4 inline-flex items-center gap-1"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-[#EAA023]" />
            <span>View Assumptions, Missing Data & Risks →</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
