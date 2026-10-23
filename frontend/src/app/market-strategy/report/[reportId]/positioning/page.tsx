"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Target,
  Users,
  Compass,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useStrategy } from "@/context/StrategyContext";
import { getStrategyReport } from "@/lib/api/client";
import { StrategyReport } from "@/lib/api/types";
import { Accordion } from "@/components/ui/Accordion";

export default function PositioningDetailPage() {
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
        Loading Positioning Strategy...
      </div>
    );
  }

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
            Strategic Positioning
          </span>
        </div>
        <h2 className="text-3xl font-black tracking-tight text-[#111211]">
          Customer Insights & Positioning
        </h2>
        <p className="text-xs text-[#70736F] mt-1 max-w-2xl leading-relaxed">
          How to articulate your value proposition and stand out to your ideal local customer cohort.
        </p>
      </div>

      {/* 3. Executive Summary Card (Positioning Statement) */}
      <div className="p-7 rounded-[26px] bg-[#0C3D2D] text-white border border-[#0C3D2D] space-y-3 shadow-xs">
        <span className="text-[10px] uppercase font-bold tracking-widest text-[#70F0A6] block">
          Positioning Statement
        </span>
        <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-snug">
          &ldquo;{report.primary_positioning}&rdquo;
        </h3>
        <p className="text-xs text-[#E3FAEC] leading-relaxed">
          Value Proposition: {report.value_proposition}
        </p>
      </div>

      {/* 4. Four Clear Rounded Cards (First Layer) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Card 1: Target Audience */}
        <div className="p-6 rounded-[24px] bg-[#FFFFFF] border border-[#E4E6E1] space-y-2">
          <div className="flex items-center space-x-2 text-[#0C3D2D]">
            <Users className="w-4 h-4" />
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#70736F]">
              Target Customer Segment
            </span>
          </div>
          <h4 className="text-base font-bold text-[#111211]">
            {report.target_segment}
          </h4>
          <p className="text-xs text-[#70736F] leading-relaxed">
            Prioritizes aesthetic bespoke quality, natural ingredients, and transparent booking over heavy commercial discounting.
          </p>
        </div>

        {/* Card 2: Customer Need */}
        <div className="p-6 rounded-[24px] bg-[#FFFFFF] border border-[#E4E6E1] space-y-2">
          <div className="flex items-center space-x-2 text-[#0C3D2D]">
            <Target className="w-4 h-4" />
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#70736F]">
              Core Customer Need
            </span>
          </div>
          <h4 className="text-base font-bold text-[#111211]">
            {report.customer_need}
          </h4>
          <p className="text-xs text-[#70736F] leading-relaxed">
            Customers need a dependable, stress-free celebration option that looks photogenic and tastes authentic.
          </p>
        </div>

        {/* Card 3: Offer Recommendation */}
        <div className="p-6 rounded-[24px] bg-[#FFFFFF] border border-[#E4E6E1] space-y-2">
          <div className="flex items-center space-x-2 text-[#0C3D2D]">
            <Sparkles className="w-4 h-4" />
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#70736F]">
              Recommended Offer Structure
            </span>
          </div>
          <h4 className="text-base font-bold text-[#111211]">
            {report.offer_recommendation}
          </h4>
          <p className="text-xs text-[#70736F] leading-relaxed">
            Creates clear ordering momentum with a single, transparent CTA without lowering your price floor.
          </p>
        </div>

        {/* Card 4: Tone & Direction */}
        <div className="p-6 rounded-[24px] bg-[#FFFFFF] border border-[#E4E6E1] space-y-2">
          <div className="flex items-center space-x-2 text-[#0C3D2D]">
            <Compass className="w-4 h-4" />
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#70736F]">
              Communication Tone
            </span>
          </div>
          <h4 className="text-base font-bold text-[#111211]">
            {report.creative_direction}
          </h4>
          <p className="text-xs text-[#70736F] leading-relaxed">
            Primary Language: <strong className="text-[#111211]">{report.language}</strong>. Clear, helpful, and locally resonant.
          </p>
        </div>
      </div>

      {/* 5. Progressive Disclosure Expandables (Second Layer) */}
      <div className="space-y-4">
        <Accordion
          title="Jobs To Be Done (JTBD)"
          subtitle="Specific problems and emotional relief customers seek"
        >
          <div className="space-y-2 pt-2">
            {report.jobs_to_be_done.map((job, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-[#F4F4F1] text-xs text-[#111211] flex items-start gap-2.5"
              >
                <span className="font-mono font-bold text-[#0C3D2D] text-[11px] mt-0.5">
                  0{idx + 1}
                </span>
                <span className="leading-relaxed">{job}</span>
              </div>
            ))}
          </div>
        </Accordion>

        <Accordion
          title="Buying Objections & Friction Points"
          subtitle="What prevents potential customers from enquiring or buying"
        >
          <div className="space-y-2 pt-2">
            {report.barriers.map((barrier, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-[#FFFDF7] border border-[#FDE68A]/60 text-xs text-[#111211] flex items-start gap-2.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#EAA023] mt-1.5 flex-shrink-0" />
                <span className="leading-relaxed">{barrier}</span>
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
          href={`/market-strategy/report/${reportId}/channels`}
          className="text-xs font-semibold text-[#0C3D2D] hover:underline flex items-center gap-1"
        >
          <span>Continue to Channels</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
