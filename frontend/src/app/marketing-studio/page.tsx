"use client";

import Link from "next/link";
import { ArrowRight, ImagePlus, MessageCircle, Sparkles } from "lucide-react";
import { useStrategy } from "@/context/StrategyContext";
import { SAMPLE_STRATEGY_REPORT } from "@/lib/demo/sampleReport";

export default function MarketingStudioPage() {
  const { currentReport, reportHistory } = useStrategy();
  const strategies = Object.values(reportHistory);
  const report = currentReport || strategies[0] || SAMPLE_STRATEGY_REPORT;
  const opportunity = report.opportunities?.[0];
  return (
    <div className="space-y-10">
      <section className="grid overflow-hidden rounded-[30px] bg-brand-forest text-white lg:grid-cols-[1.05fr_.95fr]">
        <div className="flex flex-col justify-between p-7 sm:p-10 lg:p-14">
          <div>
            <span className="mb-5 inline-flex rounded-full bg-brand-mint px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-brand-forest">TRNDO Intelligence</span>
            <h1 className="max-w-xl text-4xl font-black leading-[1.03] tracking-tight sm:text-6xl">Turn your strategy into a promotion.</h1>
            <p className="mt-5 max-w-md text-sm leading-6 text-white/70">Create branded posters and ready-to-share captions from the strategy you already trust.</p>
          </div>
          <Link href={`/marketing-studio/create?strategy=${report.strategy_id}`} className="mt-10 inline-flex w-fit items-center gap-2 rounded-full bg-brand-mint px-5 py-3 text-sm font-black text-brand-forest hover:bg-white">Create promotion <ArrowRight size={16} /></Link>
        </div>
        <div className="relative min-h-[300px] overflow-hidden bg-[#174d3b] p-7 sm:p-10">
          <div className="absolute -right-16 -top-20 h-72 w-72 rounded-full border-[34px] border-brand-mint/20" />
          <div className="relative mx-auto mt-4 max-w-xs rotate-2 rounded-[22px] bg-[#f5eadb] p-5 text-brand-text shadow-2xl sm:mt-8">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-brand-forest">New collection · Kochi</span>
            <div className="my-5 flex aspect-[4/3] items-center justify-center rounded-2xl bg-[#e4c6a3] text-6xl">🍰</div>
            <p className="text-2xl font-black leading-none">Make the moment<br />taste beautiful.</p>
            <div className="mt-5 flex items-center justify-between text-[10px] font-bold"><span>Custom celebration cakes</span><span className="rounded-full bg-brand-forest px-2 py-1 text-brand-mint">Enquire</span></div>
          </div>
        </div>
      </section>
      <section className="grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
        <div className="rounded-[26px] border border-brand-border bg-white p-6 sm:p-8">
          <div className="mb-6 flex items-end justify-between gap-4"><div><span className="eyebrow">Available strategy</span><h2 className="mt-2 text-2xl font-black tracking-tight">Start with a direction</h2></div><span className="rounded-full bg-brand-pale-mint px-3 py-1 text-[10px] font-bold text-brand-forest">{report.demo ? "Demo strategy" : "Saved strategy"}</span></div>
          <div className="rounded-2xl border border-brand-border bg-brand-bg p-5">
            <div className="flex items-start justify-between gap-4"><div><h3 className="font-black">{opportunity?.title || "Your approved strategy"}</h3><p className="mt-2 max-w-xl text-sm leading-6 text-brand-muted">{report.primary_positioning}</p></div><Sparkles className="shrink-0 text-brand-forest" size={20} /></div>
            <div className="mt-5 flex flex-wrap gap-2 text-[11px] font-bold text-brand-muted"><span className="rounded-full bg-white px-3 py-1.5">Goal: {report.business_objective.replaceAll("_", " ")}</span><span className="rounded-full bg-white px-3 py-1.5">Audience: {report.target_segment.split(".")[0]}</span></div>
            <Link href={`/marketing-studio/create?strategy=${report.strategy_id}`} className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand-text px-4 py-2.5 text-xs font-bold text-white">Create from this strategy <ArrowRight size={14} /></Link>
          </div>
        </div>
        <div className="rounded-[26px] bg-brand-mint p-6 sm:p-8"><span className="eyebrow text-brand-forest">Your workflow</span><h2 className="mt-2 text-2xl font-black tracking-tight text-brand-forest">From insight to action.</h2><div className="mt-8 space-y-4 text-sm font-bold text-brand-forest"><p className="flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-forest text-xs text-brand-mint">01</span>Choose a strategy</p><p className="flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-forest text-xs text-brand-mint">02</span>Generate your creative</p><p className="flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-forest text-xs text-brand-mint">03</span>Share and collect enquiries</p></div></div>
      </section>
      <section className="grid gap-4 sm:grid-cols-3">
        <Link href="/marketing-studio/creations" className="studio-link-card"><ImagePlus size={19} /><span><b>My creations</b><small>Open saved posters and captions</small></span><ArrowRight size={15} /></Link>
        <Link href="/marketing-studio/inbox" className="studio-link-card"><MessageCircle size={19} /><span><b>Telegram inbox</b><small>Review customer enquiries</small></span><ArrowRight size={15} /></Link>
        <Link href="/marketing-studio/orders" className="studio-link-card"><span className="text-lg">₹</span><span><b>Orders</b><small>Confirm fulfilment and payment</small></span><ArrowRight size={15} /></Link>
      </section>
    </div>
  );
}
