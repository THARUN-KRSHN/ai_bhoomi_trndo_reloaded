"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  RotateCcw,
  ArrowLeft,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { useStrategy } from "@/context/StrategyContext";
import { generateStrategyReport, ApiError } from "@/lib/api/client";
import { StrategyReport } from "@/lib/api/types";

const ROTATING_STATUSES = [
  "Analyzing available market evidence...",
  "Evaluating opportunity fit and pricing safeguards...",
  "Synthesizing positioning and channel direction...",
  "Structuring 14-day measurement guardrails...",
];

export default function StrategyGeneratingPage() {
  const router = useRouter();
  const { brief, selectedOpportunity, saveReportToHistory } = useStrategy();

  const [statusIndex, setStatusIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [insufficientEvidenceReport, setInsufficientEvidenceReport] =
    useState<StrategyReport | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const isExecutingRef = useRef(false);

  const executeGeneration = async () => {
    if (isExecutingRef.current) return;
    isExecutingRef.current = true;
    setError(null);
    setInsufficientEvidenceReport(null);

    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % ROTATING_STATUSES.length);
    }, 3200);

    try {
      const report: StrategyReport = await generateStrategyReport(brief);
      clearInterval(interval);
      saveReportToHistory(report);

      // Check if backend reported insufficient evidence
      if (report.recommended_decision === "insufficient_evidence") {
        setInsufficientEvidenceReport(report);
        isExecutingRef.current = false;
        return;
      }

      // Smooth transition to report
      setTimeout(() => {
        router.push(`/market-strategy/report/${report.strategy_id}`);
      }, 600);
    } catch (err: unknown) {
      clearInterval(interval);
      isExecutingRef.current = false;
      if (err instanceof ApiError) {
        setError(err.message || `Server responded with error status ${err.status}`);
      } else if (err instanceof Error) {
        setError(err.message || "Failed to generate market strategy.");
      } else {
        setError("An unexpected error occurred while communicating with the strategy engine.");
      }
    }
  };

  useEffect(() => {
    executeGeneration();
    return () => {
      isExecutingRef.current = false;
    };
  }, []);

  const handleRetry = () => {
    setIsRetrying(true);
    setStatusIndex(0);
    setTimeout(() => {
      setIsRetrying(false);
      executeGeneration();
    }, 300);
  };

  return (
    <div className="max-w-xl mx-auto py-16 sm:py-24 text-center space-y-8">
      {/* Insufficient Evidence State (Explicitly handled per prompt) */}
      {insufficientEvidenceReport ? (
        <div className="p-8 sm:p-10 rounded-[32px] bg-[#FFFFFF] border border-[#FDE68A] shadow-xl text-left space-y-6 animate-in fade-in zoom-in-95">
          <div className="flex items-center space-x-3 text-[#B45309]">
            <div className="w-10 h-10 rounded-2xl bg-[#FFFBEB] flex items-center justify-center flex-shrink-0 border border-[#FCD34D]">
              <AlertCircle className="w-5 h-5 text-[#B45309]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#111211]">
                Insufficient Evidence Identified
              </h2>
              <p className="text-xs text-[#70736F]">
                The engine observed limited verified local demand in {brief.city}.
              </p>
            </div>
          </div>

          <p className="text-xs text-[#70736F] leading-relaxed">
            Rather than fabricating a confident strategy, TRNDO recommends a cautious exploratory posture or adjusting your audience and region parameters.
          </p>

          <div className="flex items-center justify-between pt-4 border-t border-[#F0F2EE]">
            <button
              type="button"
              onClick={() => router.push("/market-strategy/brief")}
              className="px-5 py-2.5 rounded-full text-xs font-semibold text-[#70736F] hover:bg-[#F4F4F1] transition-colors"
            >
              ← Refine Strategy Brief
            </button>

            <button
              type="button"
              onClick={() =>
                router.push(`/market-strategy/report/${insufficientEvidenceReport.strategy_id}`)
              }
              className="px-6 py-2.5 rounded-full bg-[#111211] text-white text-xs font-bold hover:bg-[#252825] transition-colors"
            >
              Explore Available Findings →
            </button>
          </div>
        </div>
      ) : error ? (
        /* Error State */
        <div className="p-8 sm:p-10 rounded-[32px] bg-[#FFFFFF] border border-[#DF3E3E]/30 text-left shadow-xl space-y-6 animate-in fade-in zoom-in-95">
          <div className="flex items-center space-x-3 text-[#DF3E3E]">
            <div className="w-10 h-10 rounded-2xl bg-[#FEE2E2] flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-[#DF3E3E]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#111211]">
                Strategy Generation Paused
              </h2>
              <p className="text-xs text-[#70736F]">
                {error}
              </p>
            </div>
          </div>

          <p className="text-xs text-[#70736F]">
            Your brief parameters have been preserved. You can retry the request or return to the brief.
          </p>

          <div className="flex items-center justify-between pt-4 border-t border-[#F0F2EE]">
            <button
              type="button"
              onClick={() => router.push("/market-strategy/brief")}
              className="px-5 py-2.5 rounded-full text-xs font-semibold text-[#70736F] hover:bg-[#F4F4F1] flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Brief</span>
            </button>

            <button
              type="button"
              onClick={handleRetry}
              disabled={isRetrying}
              className="px-6 py-2.5 rounded-full bg-[#111211] text-white text-xs font-bold hover:bg-[#252825] flex items-center gap-2 shadow-xs transition-all"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isRetrying ? "animate-spin" : ""}`} />
              <span>Retry</span>
            </button>
          </div>
        </div>
      ) : (
        /* Minimal, Calm Generation Card */
        <div className="p-10 sm:p-12 rounded-[32px] bg-[#FFFFFF] border border-[#E4E6E1] shadow-xl text-center space-y-8">
          {/* Restrained Ring Animation */}
          <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-[#E4E6E1]" />
            <div className="absolute inset-0 rounded-full border-2 border-[#0C3D2D] border-t-transparent animate-spin" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#70F0A6]" />
          </div>

          {/* Heading & Supporting Copy */}
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111211]">
              Building your strategy
            </h1>
            <p className="text-xs sm:text-sm text-[#70736F] max-w-sm mx-auto leading-relaxed">
              Analyzing the available evidence and preparing your recommendations.
            </p>
          </div>

          {/* Selected Opportunity & Objective Pill Row */}
          <div className="inline-flex items-center gap-2 p-1.5 px-3.5 rounded-full bg-[#F4F4F1] text-xs text-[#111211]">
            <span className="font-semibold">{selectedOpportunity.title}</span>
            <span className="text-[#C4C7C0]">·</span>
            <span className="capitalize text-[#70736F]">
              {brief.objective.replace(/_/g, " ")}
            </span>
          </div>

          {/* Rotating Calm Status */}
          <div className="h-6 flex items-center justify-center">
            <p className="text-xs font-medium text-[#0C3D2D] transition-opacity duration-300">
              {ROTATING_STATUSES[statusIndex]}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
