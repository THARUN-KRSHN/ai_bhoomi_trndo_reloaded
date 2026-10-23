"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Download,
  ShieldCheck,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { useStrategy } from "@/context/StrategyContext";
import { getStrategyReport } from "@/lib/api/client";
import { StrategyReport } from "@/lib/api/types";
import { ReportNav } from "@/components/layout/ReportNav";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

export default function ReportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const reportId = (params?.reportId as string) || "current";
  const { currentReport, setCurrentReport, getReportById } = useStrategy();
  const [report, setReport] = useState<StrategyReport | null>(currentReport);
  const [isLoading, setIsLoading] = useState(!currentReport);

  useEffect(() => {
    async function loadReport() {
      if (!reportId || reportId === "current") return;

      // First check context cache
      const cached = getReportById(reportId);
      if (cached) {
        setReport(cached);
        setCurrentReport(cached);
        setIsLoading(false);
        return;
      }

      // Fetch from API / demo fallback
      try {
        const fetched = await getStrategyReport(reportId);
        setReport(fetched);
        setCurrentReport(fetched);
      } catch (err) {
        console.error("Failed to load report", err);
      } finally {
        setIsLoading(false);
      }
    }

    if (!report || report.strategy_id !== reportId) {
      loadReport();
    }
  }, [reportId, report, getReportById, setCurrentReport]);

  const handleExportJson = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trndo-strategy-${report.strategy_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Meta Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E4E6E1]">
        <div>
          <Breadcrumbs
            items={[
              { label: "Report Overview", href: `/market-strategy/report/${reportId}` },
            ]}
          />
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#111211]">
              Market Strategy Report
            </h1>

            {report?.demo && (
              <span className="px-3 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] text-xs font-bold uppercase tracking-wider">
                DEMO REPORT
              </span>
            )}

            <span className="text-xs font-mono text-[#70736F] bg-[#FFFFFF] px-2.5 py-1 rounded-md border border-[#E4E6E1]">
              ID: {reportId.slice(0, 16)}...
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-2.5 self-start md:self-auto">
          <Link
            href="/market-strategy"
            className="px-4 py-2 rounded-full text-xs font-semibold bg-[#FFFFFF] text-[#111211] border border-[#E4E6E1] hover:border-[#111211] transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Studio</span>
          </Link>

          <button
            type="button"
            onClick={handleExportJson}
            className="px-4 py-2 rounded-full text-xs font-semibold bg-[#FFFFFF] text-[#111211] border border-[#E4E6E1] hover:border-[#111211] transition-colors flex items-center gap-1.5"
            title="Download full verified report JSON"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Persistent Navigation Bar across all detail subroutes */}
      <Suspense fallback={<div className="h-10 bg-white border-b border-[#E4E6E1]" />}>
        <ReportNav reportId={reportId} />
      </Suspense>

      {/* Main Content Area */}
      <div>{children}</div>
    </div>
  );
}
