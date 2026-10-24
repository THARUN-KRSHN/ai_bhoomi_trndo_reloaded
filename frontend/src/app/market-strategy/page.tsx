"use client";

import { FormEvent, useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ShieldCheck, Info } from "lucide-react";
import { useStrategy } from "@/context/StrategyContext";
import { createOpportunityFromTrend } from "@/lib/demo/opportunities";
import { DemoOpportunity } from "@/lib/api/types";
import { OpportunityCard } from "@/components/studio/OpportunityCard";
import { WorkflowVisual } from "@/components/studio/WorkflowVisual";
import { StageOverview } from "@/components/studio/StageOverview";
import { Drawer } from "@/components/ui/Drawer";
import { getRecentTrends, searchTrends } from "@/lib/api/client";

export default function MarketStrategyStudioPage() {
  const router = useRouter();
  const { selectedOpportunity, selectOpportunity } = useStrategy();
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [trendQuery, setTrendQuery] = useState("");
  const [trendFilter, setTrendFilter] = useState("");
  const [recentTrends, setRecentTrends] = useState<Array<{ search_id: string; topic: string; result: Record<string, unknown> }>>([]);
  const [trendBusy, setTrendBusy] = useState(false);
  const [trendError, setTrendError] = useState("");

  const loadRecentTrends = async () => {
    try {
      const records = await getRecentTrends(5);
      setRecentTrends(records);
    } catch {
      setTrendError("Recent trend signals are unavailable until the Trend Finder is running.");
    }
  };
  useEffect(() => { loadRecentTrends(); }, []);

  // Derive opportunities dynamically from live trend suggestions
  const dynamicOpportunities = useMemo<DemoOpportunity[]>(() => {
    const list: DemoOpportunity[] = [];
    recentTrends.forEach((record) => {
      const analysis = (record.result?.analysis as { top_10?: Array<{ keyword: string; score: number }> } | undefined);
      const top = analysis?.top_10 || [];
      top.slice(0, 4).forEach((item) => {
        if (item.keyword && !list.some((o) => o.title.toLowerCase() === item.keyword.toLowerCase())) {
          list.push(
            createOpportunityFromTrend(
              item.keyword,
              item.score,
              record.topic || "Trending Category",
              "Kerala"
            )
          );
        }
      });
    });

    if (list.length > 0) {
      return list.slice(0, 6);
    }

    // Default dynamic trend suggestions reflecting active category trends
    return [
      createOpportunityFromTrend("Oversized Linen Shirt", 94, "Fashion & Apparel", "Kerala"),
      createOpportunityFromTrend("Vintage Band Graphic Tee", 89, "Streetwear & Apparel", "Kerala"),
      createOpportunityFromTrend("Coquette Aesthetic Dress", 85, "Women's Fashion", "Kerala"),
    ];
  }, [recentTrends]);

  useEffect(() => {
    if (dynamicOpportunities.length > 0) {
      if (!selectedOpportunity || selectedOpportunity.id.includes("minimal-cakes")) {
        selectOpportunity(dynamicOpportunities[0]);
      }
    }
  }, [dynamicOpportunities, selectedOpportunity, selectOpportunity]);

  async function runTrendHunt(event: FormEvent) {
    event.preventDefault();
    const topic = [trendQuery, trendFilter].filter(Boolean).join(" ");
    if (!topic) return;
    setTrendBusy(true); setTrendError("");
    try { await searchTrends(topic, trendFilter ? { filter: trendFilter } : {}); setTrendQuery(""); setTrendFilter(""); await loadRecentTrends(); }
    catch { setTrendError("Trend hunt failed. Check that Flask Trend Finder is running."); }
    finally { setTrendBusy(false); }
  }

  const handleContinue = () => {
    router.push("/market-strategy/brief");
  };

  return (
    <div className="space-y-12 sm:space-y-16">
      <section className="rounded-[28px] border border-[#E4E6E1] bg-white p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div><span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#0C3D2D]">Live discovery</span><h2 className="mt-2 text-2xl font-black tracking-tight">Recent trend signals</h2><p className="mt-1 text-sm text-[#70736F]">Scores come from the existing Flask Trend Finder and are stored to your account.</p></div>
          <a href="/trends" className="text-sm font-bold text-[#0C3D2D] hover:underline">Open Trend Finder →</a>
        </div>
        <form onSubmit={runTrendHunt} className="mt-6 grid gap-3 sm:grid-cols-[1fr_1fr_auto]"><input value={trendQuery} onChange={e => setTrendQuery(e.target.value)} placeholder="Search a product or topic" className="auth-input" /><input value={trendFilter} onChange={e => setTrendFilter(e.target.value)} placeholder="Optional filter, e.g. local premium" className="auth-input" /><button disabled={trendBusy} className="rounded-full bg-[#0C3D2D] px-5 py-3 text-sm font-bold text-[#70F0A6]">{trendBusy ? "Hunting…" : "Refresh trends"}</button></form>
        {trendError && <p className="mt-4 text-sm text-red-700">{trendError}</p>}
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{recentTrends.length === 0 ? <p className="text-sm text-[#70736F]">No saved trend hunt yet. Run one above.</p> : recentTrends.flatMap(record => { const top = (record.result.analysis as { top_10?: Array<{ keyword: string; score: number; reliability_score?: number }> } | undefined)?.top_10 || []; return top.slice(0, 6).map(item => <div key={`${record.search_id}-${item.keyword}`} className="rounded-2xl bg-[#F4F4F1] p-4"><div className="flex items-start justify-between gap-3"><p className="text-sm font-bold">{item.keyword}</p><span className="rounded-full bg-[#E3FAEC] px-2 py-1 text-xs font-bold text-[#0C3D2D]">{Math.round(item.score)}</span></div><p className="mt-2 text-xs text-[#70736F]">Reliability {Math.round(item.reliability_score || 0)} · {record.topic}</p></div>); })}</div>
      </section>
      {/* SECTION A: Editorial Hero Section (Reference A Inspired) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
        {/* Left Column */}
        <div className="lg:col-span-7 flex flex-col justify-between py-2 sm:py-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#E3FAEC] text-[#0C3D2D] text-xs font-bold tracking-wide uppercase mb-6">
              <span className="w-2 h-2 rounded-full bg-[#0C3D2D]" />
              <span>TRNDO Intelligence</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#111211] leading-[1.08] mb-6">
              Find your next marketing opportunity.
            </h1>

            <p className="text-base sm:text-lg text-[#70736F] leading-relaxed max-w-xl mb-8">
              Choose an opportunity and let TRNDO build a strategy tailored to your business.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-[#E4E6E1]">
            <a
              href="#opportunity-selector"
              className="px-8 py-3.5 rounded-full bg-[#111211] text-[#FFFFFF] text-sm font-bold hover:bg-[#252825] transition-all flex items-center gap-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#70F0A6]"
            >
              <span>Build My Strategy</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <button
              type="button"
              onClick={() => setIsHowItWorksOpen(true)}
              className="px-6 py-3.5 rounded-full bg-[#FFFFFF] text-[#111211] text-sm font-bold border border-[#E4E6E1] hover:border-[#111211] transition-all flex items-center gap-2"
            >
              <span>How It Works</span>
            </button>
          </div>
        </div>

        {/* Right Feature Panel (Reference A) */}
        <div className="lg:col-span-5 flex">
          <WorkflowVisual />
        </div>
      </section>

      {/* SECTION B: Opportunity Selection Section (Reference B Bento Grid) */}
      <section id="opportunity-selector" className="pt-8 border-t border-[#E4E6E1] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#E3FAEC] text-[#0C3D2D]">
                Step 01
              </span>
              <span className="text-[11px] font-semibold text-[#8E928D] uppercase tracking-wider">
                Opportunity Selection
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111211]">
              Choose an opportunity
            </h2>
            <p className="text-xs text-[#70736F] mt-1">
              Select a market opportunity to build a strategy around.
            </p>
          </div>

          <div className="text-xs text-[#70736F] flex items-center gap-1.5 bg-[#FFFFFF] px-3.5 py-1.5 rounded-full border border-[#E4E6E1] self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-[#EAA023]" />
            <span className="font-medium text-[11px]">Demo data · Not live market research</span>
          </div>
        </div>

        {/* Opportunity Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {dynamicOpportunities.map((opp) => (
            <OpportunityCard
              key={opp.id}
              opportunity={opp}
              isSelected={selectedOpportunity?.id === opp.id}
              onSelect={() => selectOpportunity(opp)}
            />
          ))}
        </div>

        {/* Single Primary Action Below Grid (Rule 1) */}
        <div className="p-6 rounded-[26px] bg-[#FFFFFF] border border-[#E4E6E1] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-[#111211]">
              Selected: <span className="text-[#0C3D2D]">{selectedOpportunity.title}</span>
            </span>
            <p className="text-xs text-[#70736F] mt-0.5">
              Ready to configure your campaign goal, audience, and constraints.
            </p>
          </div>

          <button
            type="button"
            onClick={handleContinue}
            className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#0C3D2D] text-[#70F0A6] text-sm font-bold hover:bg-[#14523E] transition-all flex items-center justify-center gap-2 shadow-xs group focus:outline-none focus:ring-2 focus:ring-[#70F0A6]"
          >
            <span>Continue to Brief</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* SECTION C: Strategy Workflow Overview (Reference C Pattern) */}
      <section className="pt-8 border-t border-[#E4E6E1] space-y-5">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#70736F] block mb-1">
            Engine Process
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#111211]">
            How TRNDO builds your strategy
          </h2>
        </div>

        <StageOverview />
      </section>

      {/* How It Works Drawer */}
      <Drawer
        isOpen={isHowItWorksOpen}
        onClose={() => setIsHowItWorksOpen(false)}
        title="How Strategy Generation Works"
        categoryTag="TRNDO Architecture"
      >
        <div className="space-y-5 text-xs text-[#111211] leading-relaxed">
          <p className="text-sm text-[#70736F]">
            TRNDO AI combines deterministic market analysis with structured narrative generation. Here is how the pipeline operates:
          </p>

          <div className="p-4 rounded-2xl bg-[#F4F4F1] space-y-1.5">
            <h4 className="font-bold text-[#111211]">1. Web Demand Discovery</h4>
            <p className="text-[#70736F]">
              Generates targeted search queries to observe current local demand, competitive substitutes, and price floors. All web evidence is treated as untrusted to defend against prompt injections.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#F4F4F1] space-y-1.5">
            <h4 className="font-bold text-[#111211]">2. Deterministic Scoring</h4>
            <p className="text-[#70736F]">
              Evaluates opportunity priority across 5 weighted dimensions (demand, shop fit, differentiation, commercial feasibility, execution feasibility). Scores are never fabricated by the LLM.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#F4F4F1] space-y-1.5">
            <h4 className="font-bold text-[#111211]">3. Guardrails & Measurement</h4>
            <p className="text-[#70736F]">
              Sets up a 14-day testable hypothesis with concrete stop and scale conditions, protecting your price floor and fulfilling capacity.
            </p>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
