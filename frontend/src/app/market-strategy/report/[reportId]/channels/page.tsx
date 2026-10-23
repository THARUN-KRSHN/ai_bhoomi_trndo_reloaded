"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Share2,
  Camera,
  MessageSquare,
  Search,
  ArrowLeft,
  ArrowRight,
  FileText,
  Volume2,
} from "lucide-react";
import { useStrategy } from "@/context/StrategyContext";
import { getStrategyReport } from "@/lib/api/client";
import { StrategyReport } from "@/lib/api/types";
import { Accordion } from "@/components/ui/Accordion";

export default function ChannelStrategyPage() {
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
        Loading Channel Strategy...
      </div>
    );
  }

  const channels = Object.entries(report.channel_strategy || {});

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
            Distribution Plan
          </span>
        </div>
        <h2 className="text-3xl font-black tracking-tight text-[#111211]">
          Channel Strategy
        </h2>
        <p className="text-xs text-[#70736F] mt-1 max-w-2xl leading-relaxed">
          Focused channels to reach local customers without high media spend or automated posting risks.
        </p>
      </div>

      {/* 3. Executive Summary Card */}
      <div className="p-7 rounded-[26px] bg-[#FFFFFF] border border-[#E4E6E1] space-y-3 shadow-xs">
        <span className="text-[10px] uppercase font-bold tracking-wider text-[#70736F] block">
          Primary Call to Action (CTA)
        </span>
        <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0C3D2D]">
          &ldquo;{report.call_to_action}&rdquo;
        </h3>
        <p className="text-xs text-[#70736F] leading-relaxed">
          Creative Tone: <strong className="text-[#111211]">{report.creative_direction}</strong>. Recommended for organic posting and direct inquiry response.
        </p>
      </div>

      {/* 4. Recommended Channels (Initially Display Only Recommended Channels) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {channels.map(([channelKey, roleDescription], idx) => {
          const isInstagram = channelKey.includes("instagram");
          const isWhatsapp = channelKey.includes("whatsapp");

          return (
            <div
              key={channelKey}
              className="p-6 rounded-[24px] bg-[#FFFFFF] border border-[#E4E6E1] flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-[#F4F4F1] flex items-center justify-center text-[#111211]">
                    {isInstagram ? (
                      <Camera className="w-4 h-4 text-[#E1306C]" />
                    ) : isWhatsapp ? (
                      <MessageSquare className="w-4 h-4 text-[#25D366]" />
                    ) : (
                      <Search className="w-4 h-4 text-[#0C3D2D]" />
                    )}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#E3FAEC] text-[#0C3D2D]">
                    Touchpoint 0{idx + 1}
                  </span>
                </div>

                <h4 className="text-base font-bold text-[#111211] capitalize mb-1">
                  {channelKey.replace(/_/g, " ")}
                </h4>

                <p className="text-xs text-[#70736F] leading-relaxed mb-4">
                  {roleDescription}
                </p>

                <div className="p-3 rounded-xl bg-[#FAFBF9] border border-[#E4E6E1] text-xs">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#70736F] block mb-0.5">
                    Recommended Content Format
                  </span>
                  <span className="font-semibold text-[#111211]">
                    {report.content_formats?.[idx % (report.content_formats?.length || 1)] || "Short video & direct menu"}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-[#F0F2EE] text-[11px] text-[#8E928D]">
                Manual execution by merchant · No automated tools required
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. Progressive Disclosure Expandables (Second Layer) */}
      <div className="space-y-4">
        <Accordion
          title="All Content Formats & Creative Direction"
          subtitle="Media styles suited to your target celebration audience"
        >
          <div className="space-y-2 pt-2">
            {report.content_formats.map((fmt, i) => (
              <div
                key={i}
                className="p-3.5 rounded-xl bg-[#F4F4F1] text-xs font-semibold text-[#111211] flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-[#70F0A6]" />
                <span>{fmt}</span>
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
          href={`/market-strategy/report/${reportId}/execution`}
          className="text-xs font-semibold text-[#0C3D2D] hover:underline flex items-center gap-1"
        >
          <span>Continue to Action Plan</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
