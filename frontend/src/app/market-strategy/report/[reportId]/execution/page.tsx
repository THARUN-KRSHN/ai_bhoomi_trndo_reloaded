"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  CalendarCheck,
  Clock,
  ArrowLeft,
  ArrowRight,
  ShieldAlert,
  ChevronDown,
  CheckCircle2,
} from "lucide-react";
import { useStrategy } from "@/context/StrategyContext";
import { getStrategyReport } from "@/lib/api/client";
import { StrategyReport } from "@/lib/api/types";
import { Accordion } from "@/components/ui/Accordion";

export default function CampaignExecutionPage() {
  const routeParams = useParams();
  const reportId = (routeParams?.reportId as string) || "current";
  const { currentReport, setCurrentReport, getReportById } = useStrategy();
  const [report, setReport] = useState<StrategyReport | null>(currentReport);
  const [expandedStepIndex, setExpandedStepIndex] = useState<number | null>(0);

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
        Loading Campaign Action Plan...
      </div>
    );
  }

  const steps = report.campaign_steps || [];
  const channels = Object.keys(report.channel_strategy || {});

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
            Action Plan
          </span>
        </div>
        <h2 className="text-3xl font-black tracking-tight text-[#111211]">
          Execution Sequence
        </h2>
        <p className="text-xs text-[#70736F] mt-1 max-w-2xl leading-relaxed">
          A compact 14-day timeline of high-level campaign actions to test and validate customer response.
        </p>
      </div>

      {/* 3. Executive Summary Card */}
      <div className="p-7 rounded-[26px] bg-[#FFFFFF] border border-[#E4E6E1] space-y-3 shadow-xs">
        <span className="text-[10px] uppercase font-bold tracking-wider text-[#70736F] block">
          Primary Next Step
        </span>
        <h3 className="text-xl font-bold tracking-tight text-[#111211]">
          {report.next_steps?.[0] || "Prepare 3 aesthetic process videos and launch WhatsApp pre-order menu"}
        </h3>
        <p className="text-xs text-[#70736F] leading-relaxed">
          Test windows are proposed as experimental periods. Adjust post timings based on actual daily inquiry response.
        </p>
      </div>

      {/* 4. Compact Visual Timeline (Steps 1 to 4) */}
      <div className="space-y-3">
        {steps.map((step, idx) => {
          const stepNum = idx + 1;
          const isExpanded = expandedStepIndex === idx;
          const assignedChannel =
            channels[idx % channels.length]?.replace(/_/g, " ") || "Instagram & WhatsApp";
          const assignedFormat =
            report.content_formats?.[idx % (report.content_formats?.length || 1)] || "Short video & menu";

          return (
            <div
              key={idx}
              className="rounded-[22px] bg-[#FFFFFF] border border-[#E4E6E1] transition-all overflow-hidden"
            >
              {/* High-level summary row */}
              <button
                type="button"
                onClick={() => setExpandedStepIndex(isExpanded ? null : idx)}
                className="w-full p-5 flex items-center justify-between text-left hover:bg-[#FAFBF9] transition-colors focus:outline-none"
              >
                <div className="flex items-center space-x-4 pr-4">
                  <div className="w-8 h-8 rounded-full bg-[#0C3D2D] text-[#70F0A6] flex items-center justify-center font-bold text-xs flex-shrink-0">
                    0{stepNum}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#F4F4F1] text-[#70736F] capitalize">
                        {assignedChannel}
                      </span>
                      <span className="text-[11px] text-[#8E928D] flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#A0A49F]" />
                        Days {stepNum * 3 - 2}–{stepNum * 3 + 1}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-[#111211] leading-snug">
                      {step}
                    </h4>
                  </div>
                </div>

                <div
                  className={`w-7 h-7 rounded-full bg-[#F4F4F1] flex items-center justify-center text-[#70736F] transition-transform duration-200 flex-shrink-0 ${
                    isExpanded ? "rotate-180 bg-[#111211] text-white" : ""
                  }`}
                >
                  <ChevronDown className="w-4 h-4" />
                </div>
              </button>

              {/* Expandable step details (Progressive Disclosure) */}
              {isExpanded && (
                <div className="p-5 pt-0 border-t border-[#F0F2EE] mt-1 space-y-3 animate-in fade-in duration-200 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                    <div className="p-3 rounded-xl bg-[#F4F4F1]">
                      <span className="text-[10px] uppercase tracking-wider text-[#70736F] font-bold block mb-0.5">
                        Media Format
                      </span>
                      <span className="font-semibold text-[#111211]">
                        {assignedFormat}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#F4F4F1]">
                      <span className="text-[10px] uppercase tracking-wider text-[#70736F] font-bold block mb-0.5">
                        Action CTA
                      </span>
                      <span className="font-semibold text-[#0C3D2D] italic">
                        &ldquo;{report.call_to_action}&rdquo;
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-[#70736F] leading-relaxed pt-1">
                    Operational Note: Ensure message notifications are active during lunch and evening hours (12–2 PM and 6–9 PM) to respond within the 2-hour expectation window.
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 5. Progressive Disclosure Expandables (Guardrails) */}
      <div className="space-y-4">
        <Accordion
          title="Operational & Pricing Guardrails"
          subtitle="Strict parameters to protect your margins and fulfillment"
        >
          <div className="space-y-2 pt-2">
            {report.pricing_safeguards?.map((safeguard, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-[#FFFDF7] border border-[#FDE68A]/60 text-xs text-[#92400E] flex items-start gap-2.5"
              >
                <ShieldAlert className="w-4 h-4 text-[#EAA023] flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{safeguard}</span>
              </div>
            ))}
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
          href={`/market-strategy/report/${reportId}/evidence`}
          className="text-xs font-semibold text-[#0C3D2D] hover:underline flex items-center gap-1"
        >
          <span>Continue to Evidence</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
