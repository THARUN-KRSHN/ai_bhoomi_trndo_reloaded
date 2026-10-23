"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  FileCheck2,
  ExternalLink,
  Video,
  ShieldCheck,
  MapPin,
  Calendar,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
} from "lucide-react";
import { useStrategy } from "@/context/StrategyContext";
import { getStrategyReport } from "@/lib/api/client";
import { StrategyReport, SourceRegisterItem } from "@/lib/api/types";
import { formatDate } from "@/lib/utils";
import { Accordion } from "@/components/ui/Accordion";

export default function EvidenceSourcesPage() {
  const routeParams = useParams();
  const reportId = (routeParams?.reportId as string) || "current";
  const { currentReport, setCurrentReport, getReportById } = useStrategy();
  const [report, setReport] = useState<StrategyReport | null>(currentReport);
  const [showAllSources, setShowAllSources] = useState(false);
  const [expandedSourceIndex, setExpandedSourceIndex] = useState<number | null>(null);

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
        Loading Evidence & Sources...
      </div>
    );
  }

  const allSources = report.source_register || [];
  const initialSources = showAllSources ? allSources : allSources.slice(0, 3);
  const youtubeResources = report.research_resources || [];

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
            Source Audit
          </span>
        </div>
        <h2 className="text-3xl font-black tracking-tight text-[#111211]">
          Research Evidence & Sources
        </h2>
        <p className="text-xs text-[#70736F] mt-1 max-w-2xl leading-relaxed">
          Verifiable web citations gathered by Tavily. Every recommendation is traceable to external market signals.
        </p>
      </div>

      {/* 3. Executive Summary Card */}
      <div className="p-7 rounded-[26px] bg-[#FFFFFF] border border-[#E4E6E1] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#70736F] block mb-1">
            Evidence Status
          </span>
          <h3 className="text-xl font-bold tracking-tight text-[#111211]">
            {allSources.length} Verified Web Citations
          </h3>
          <p className="text-xs text-[#70736F] mt-0.5">
            Research Status: <strong className="capitalize text-[#0C3D2D]">{report.research_status}</strong>. Untrusted web content was sanitized against prompt injections.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-[#0C3D2D] bg-[#E3FAEC] px-3.5 py-2 rounded-full border border-[#70F0A6]/40 self-start sm:self-auto flex-shrink-0">
          <ShieldCheck className="w-4 h-4 text-[#0C3D2D]" />
          <span>Zero Fabricated Trends</span>
        </div>
      </div>

      {/* 4. Strongest Supporting Sources (Initial 3 with Show All toggle) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-[#111211]">
            Supporting Web Citations
          </h3>
          {allSources.length > 3 && (
            <button
              type="button"
              onClick={() => setShowAllSources(!showAllSources)}
              className="text-xs font-semibold text-[#0C3D2D] hover:underline"
            >
              {showAllSources ? "Show Top 3 Only" : `Show All Sources (${allSources.length})`}
            </button>
          )}
        </div>

        <div className="space-y-3">
          {initialSources.map((src, idx) => {
            const isExpanded = expandedSourceIndex === idx;

            return (
              <div
                key={`${src.evidence_id || "src"}-${idx}`}
                className="rounded-[22px] bg-[#FFFFFF] border border-[#E4E6E1] p-5 hover:border-[#111211]/30 transition-all space-y-3"
              >
                {/* Header row */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#F4F4F1] text-[#111211]">
                      {src.publisher || "Web Source"}
                    </span>
                    <span className="text-[10px] font-medium text-[#70736F] flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#A0A49F]" />
                      <span className="capitalize">{src.geographic_scope}</span>
                    </span>
                    {src.published_at && (
                      <span className="text-[10px] text-[#8E928D] flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[#A0A49F]" />
                        {formatDate(src.published_at)}
                      </span>
                    )}
                  </div>

                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-[#0C3D2D] hover:underline flex items-center gap-1 flex-shrink-0"
                  >
                    <span>Visit Source</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Supporting Claim */}
                <p className="text-xs font-semibold text-[#111211] leading-relaxed">
                  {src.supporting_claim}
                </p>

                {/* Progressive disclosure toggle */}
                <div className="pt-2 border-t border-[#F0F2EE] flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setExpandedSourceIndex(isExpanded ? null : idx)}
                    className="text-[11px] font-semibold text-[#70736F] hover:text-[#111211] flex items-center gap-1 focus:outline-none"
                  >
                    <span>{isExpanded ? "Hide Excerpt & Limitations" : "View Excerpt & Scope Limitations"}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </button>
                  <span className="text-[10px] text-[#8E928D]">
                    Retrieved {formatDate(src.retrieved_at)}
                  </span>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="pt-2 space-y-2 text-xs animate-in fade-in duration-200">
                    {src.limitations && src.limitations.length > 0 && (
                      <div className="p-3 rounded-xl bg-[#FFFDF7] border border-[#FDE68A] text-[#92400E] text-[11px]">
                        <span className="font-bold block mb-0.5">Observed Limitation:</span>
                        <ul className="list-disc list-inside space-y-0.5">
                          {src.limitations.map((lim, i) => (
                            <li key={i}>{lim}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Separated YouTube Attention Section */}
      <div className="p-6 rounded-[24px] bg-[#FFFFFF] border border-[#E4E6E1] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-[#DF3E3E]">
            <Video className="w-4 h-4" />
            <h3 className="text-sm font-bold text-[#111211]">
              Creative Reference Resources (YouTube)
            </h3>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#FFFDF7] text-[#92400E] border border-[#FDE68A]">
            Attention Signal Only
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#FFFDF7] border border-[#FDE68A] text-[11px] text-[#92400E] flex items-start gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-[#EAA023] flex-shrink-0 mt-0.5" />
          <p>
            Video tutorials and view counts represent aesthetic references. They are <strong>never</strong> treated as proof of local customer purchase intent.
          </p>
        </div>

        {youtubeResources.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
            {youtubeResources.map((videoUrl, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-[#F4F4F1] flex items-center justify-between gap-2"
              >
                <span className="truncate font-medium text-[#111211]">
                  Creative Video Reference #{idx + 1}
                </span>
                <a
                  href={videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-[#0C3D2D] hover:underline flex items-center gap-1 flex-shrink-0"
                >
                  <span>Open</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#70736F] italic">No video resources attached.</p>
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
          href={`/market-strategy/report/${reportId}/measurement`}
          className="text-xs font-semibold text-[#0C3D2D] hover:underline flex items-center gap-1"
        >
          <span>Continue to Measurement</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
