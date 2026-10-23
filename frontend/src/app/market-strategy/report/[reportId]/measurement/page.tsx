"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  TrendingUp,
  Scale,
  ShieldAlert,
  CheckCircle2,
  AlertOctagon,
  ArrowLeft,
  ArrowRight,
  Target,
} from "lucide-react";
import { useStrategy } from "@/context/StrategyContext";
import { getStrategyReport } from "@/lib/api/client";
import { StrategyReport } from "@/lib/api/types";
import { Accordion } from "@/components/ui/Accordion";

export default function MeasurementPage() {
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
        Loading Measurement Framework...
      </div>
    );
  }

  const kpis = report.kpi_plan?.metrics || [];
  const guardrails = report.kpi_plan?.guardrails || [];
  const decisionRules = report.kpi_plan?.decision_rules || [];
  const primaryKpi = kpis[0] || "Qualified WhatsApp Inquiries";

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
            Validation & Governance
          </span>
        </div>
        <h2 className="text-3xl font-black tracking-tight text-[#111211]">
          Measurement & Validation
        </h2>
        <p className="text-xs text-[#70736F] mt-1 max-w-2xl leading-relaxed">
          How to validate the strategy with real customer inquiries and orders during the test window.
        </p>
      </div>

      {/* 3. Executive Summary Card: Testable Hypothesis */}
      <div className="p-7 rounded-[26px] bg-[#FFFFFF] border border-[#E4E6E1] space-y-3 shadow-xs">
        <span className="text-[10px] uppercase font-bold tracking-wider text-[#70736F] block">
          Primary Testable Hypothesis
        </span>
        <h3 className="text-xl font-bold tracking-tight text-[#111211] leading-snug">
          &ldquo;{report.kpi_plan?.test_hypothesis}&rdquo;
        </h3>
        <p className="text-xs text-[#70736F] leading-relaxed">
          Success is evaluated on confirmed inquiries and deposits. Vanity metrics like social views and impressions are strictly separated from commercial intent.
        </p>
      </div>

      {/* 4. Three Supporting Rounded Cards (First Layer) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Primary KPI */}
        <div className="p-6 rounded-[24px] bg-[#FFFFFF] border border-[#E4E6E1] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#70736F]">
                Primary KPI
              </span>
              <Target className="w-4 h-4 text-[#0C3D2D]" />
            </div>
            <p className="text-sm font-bold text-[#111211] mb-2 leading-snug">
              {primaryKpi}
            </p>
            <p className="text-xs text-[#70736F] leading-relaxed">
              Attributed directly to the WhatsApp inquiry link embedded in campaign videos.
            </p>
          </div>
        </div>

        {/* Card 2: Baseline Comparison */}
        <div className="p-6 rounded-[24px] bg-[#FFFFFF] border border-[#E4E6E1] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#70736F]">
                Baseline Method
              </span>
              <Scale className="w-4 h-4 text-[#0C3D2D]" />
            </div>
            <p className="text-sm font-bold text-[#111211] mb-2 leading-snug">
              14-Day Evaluation Window
            </p>
            <p className="text-xs text-[#70736F] leading-relaxed">
              {report.kpi_plan?.comparison_method || "Compare test inquiries against the average weekly inbound inquiry volume."}
            </p>
          </div>
        </div>

        {/* Card 3: Post-Test Decision */}
        <div className="p-6 rounded-[24px] bg-[#FFFFFF] border border-[#E4E6E1] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#70736F]">
                Merchant Decision
              </span>
              <TrendingUp className="w-4 h-4 text-[#0C3D2D]" />
            </div>
            <p className="text-sm font-bold text-[#0C3D2D] mb-2 leading-snug">
              Scale or Revise
            </p>
            <p className="text-xs text-[#70736F] leading-relaxed">
              If inquiries hit target threshold, open bookings permanently. If inquiries lag, adjust pricing before increasing spend.
            </p>
          </div>
        </div>
      </div>

      {/* 5. Progressive Disclosure Expandables (Second Layer) */}
      <div className="space-y-4">
        {/* Supporting Metrics */}
        {kpis.length > 1 && (
          <Accordion
            title="Supporting Business Metrics"
            subtitle={`${kpis.length - 1} secondary indicators tracking conversion and engagement`}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              {kpis.slice(1).map((kpi, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-[#F4F4F1] space-y-1.5"
                >
                  <span className="text-[10px] font-mono font-bold text-[#0C3D2D]">
                    METRIC 0{idx + 2}
                  </span>
                  <h4 className="text-xs font-bold text-[#111211] leading-snug">
                    {kpi}
                  </h4>
                  <p className="text-[11px] text-[#70736F]">
                    Tracks funnel conversion without substituting for primary inquiries.
                  </p>
                </div>
              ))}
            </div>
          </Accordion>
        )}

        {/* Decision Rules */}
        {decisionRules.length > 0 && (
          <Accordion
            title="Decision Rules & Continuation Triggers"
            subtitle="Clear criteria for when to scale, refine, or terminate the initiative"
          >
            <div className="space-y-2 pt-2">
              {decisionRules.map((rule, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-[#F4F4F1] text-xs text-[#111211] flex items-start gap-2.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#0C3D2D] flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{rule}</span>
                </div>
              ))}
            </div>
          </Accordion>
        )}

        {/* Guardrails */}
        {guardrails.length > 0 && (
          <Accordion
            title="Measurement Guardrails & Vanity Metric Safeguards"
            subtitle="Rules to protect against overestimating customer interest"
          >
            <div className="space-y-2 pt-2">
              {guardrails.map((g, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-[#FFFDF7] border border-[#FDE68A] text-xs text-[#92400E] flex items-start gap-2.5"
                >
                  <AlertOctagon className="w-4 h-4 text-[#EAA023] flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed font-medium">{g}</span>
                </div>
              ))}
            </div>
          </Accordion>
        )}
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
          href={`/market-strategy/report/${reportId}/risks`}
          className="text-xs font-semibold text-[#0C3D2D] hover:underline flex items-center gap-1"
        >
          <span>Continue to Risks & Assumptions</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
