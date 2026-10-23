"use client";

import { useState } from "react";
import { Search, Compass, BarChart3, ChevronRight, ShieldCheck, Info } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";

const THREE_STAGES = [
  {
    number: "01",
    title: "Research the Market",
    sentence: "Analyzes current local consumer queries and discussions via Tavily search.",
    icon: Search,
    detail:
      "Gathers real-time search trends and local competitor discussions. Retrieved web content is verified and tagged with geographic scope boundaries.",
    safeguard: "Web results are strictly labeled untrusted to prevent prompt injections.",
  },
  {
    number: "02",
    title: "Plan the Strategy",
    sentence: "Calculates fit deterministically and builds structured narrative positioning.",
    icon: Compass,
    detail:
      "Scores demand, business fit, differentiation, and execution feasibility using heuristic-v1. OpenAI Structured Outputs refine positioning without altering factual sources.",
    safeguard: "The LLM cannot modify opportunity scores or invent source URLs.",
  },
  {
    number: "03",
    title: "Measure the Results",
    sentence: "Defines a 14-day testable hypothesis, attribution KPIs, and stop/scale guardrails.",
    icon: BarChart3,
    detail:
      "Focuses on attributable inquiries and confirmed orders, protecting approved price floors and merchant capacity.",
    safeguard: "Likes and views are never equated with customer purchasing demand.",
  },
];

export function StageOverview() {
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [activeStage, setActiveStage] = useState<(typeof THREE_STAGES)[0] | null>(null);

  return (
    <>
      <div className="space-y-4">
        {/* 3 Compact Rounded Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {THREE_STAGES.map((stage) => {
            const Icon = stage.icon;
            return (
              <div
                key={stage.number}
                className="p-6 rounded-[24px] bg-[#FFFFFF] border border-[#E4E6E1] hover:border-[#111211]/30 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#F4F4F1] text-[#111211]">
                      {stage.number}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-[#E3FAEC] text-[#0C3D2D] flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <h4 className="text-base font-bold tracking-tight text-[#111211] mb-1.5">
                    {stage.title}
                  </h4>

                  <p className="text-xs text-[#70736F] leading-relaxed">
                    {stage.sentence}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#F0F2EE]">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveStage(stage);
                      setIsHowItWorksOpen(true);
                    }}
                    className="text-xs font-semibold text-[#0C3D2D] hover:underline flex items-center gap-1 focus:outline-none"
                  >
                    <span>Inspect details</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Global How It Works Accordion Trigger */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-[#70736F]">
            Want to see how scoring weights and LLM safeguards work?
          </span>
          <button
            type="button"
            onClick={() => {
              setActiveStage(null);
              setIsHowItWorksOpen(true);
            }}
            className="text-xs font-semibold text-[#111211] hover:text-[#0C3D2D] underline underline-offset-4 flex items-center gap-1"
          >
            <Info className="w-3.5 h-3.5 text-[#70736F]" />
            <span>How TRNDO Works</span>
          </button>
        </div>
      </div>

      {/* Progressive Disclosure Drawer */}
      <Drawer
        isOpen={isHowItWorksOpen}
        onClose={() => setIsHowItWorksOpen(false)}
        title={activeStage ? activeStage.title : "How TRNDO Works"}
        categoryTag="Engine Architecture"
      >
        <div className="space-y-6 text-xs text-[#111211]">
          {activeStage ? (
            <div className="space-y-4">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#70736F] block mb-1">
                  Stage Specification
                </span>
                <p className="text-sm leading-relaxed">{activeStage.detail}</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#E3FAEC] border border-[#70F0A6]/40 flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 text-[#0C3D2D] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#0C3D2D] block mb-0.5">
                    Engine Safeguard
                  </span>
                  <p className="text-[#0C3D2D] leading-snug">
                    {activeStage.safeguard}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <p className="text-sm text-[#70736F] leading-relaxed">
                TRNDO AI pairs real-time market search queries with deterministic opportunity scoring. The LLM refines narrative positioning without altering verified evidence.
              </p>

              <div className="space-y-3">
                {THREE_STAGES.map((s) => (
                  <div key={s.number} className="p-4 rounded-2xl bg-[#F4F4F1] space-y-1">
                    <span className="text-[10px] font-mono font-bold text-[#0C3D2D]">
                      STAGE {s.number}
                    </span>
                    <h5 className="font-bold text-sm text-[#111211]">{s.title}</h5>
                    <p className="text-xs text-[#70736F]">{s.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Drawer>
    </>
  );
}
