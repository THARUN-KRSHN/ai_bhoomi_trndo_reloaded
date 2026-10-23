"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { generateStrategyFromTrend, searchTrends } from "@/lib/api/client";

export default function TrendsPage() {
  const router = useRouter(); const [topic, setTopic] = useState(""); const [result, setResult] = useState<Record<string, unknown> | null>(null); const [searchId, setSearchId] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) { event.preventDefault(); setBusy(true); setError(""); try { const response = await searchTrends(topic); setSearchId(response.search_id); setResult(response.result); } catch { setError("Trend Finder is unavailable. Start the Flask service and try again."); } finally { setBusy(false); } }
  async function useTrend() { if (!searchId) return; setBusy(true); try { const report = await generateStrategyFromTrend(searchId); router.push(`/market-strategy/report/${report.strategy_id}`); } catch { setError("Could not create a strategy from this trend."); } finally { setBusy(false); } }
  return <main className="min-h-screen bg-[#F5F5F2] p-6 sm:p-12"><div className="mx-auto max-w-4xl"><p className="text-xs font-bold uppercase tracking-wider text-[#0C3D2D]">TRNDO Trend Finder</p><h1 className="mt-3 text-4xl font-black">Discover a market signal</h1><p className="mt-3 text-[#70736F]">Search the existing Flask Trend Finder, then pass the selected result to the unchanged strategy engine.</p><form onSubmit={submit} className="mt-8 flex gap-3"><input required value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. sourdough bakery" className="min-w-0 flex-1 rounded-full border bg-white px-5 py-3" /><button disabled={busy} className="rounded-full bg-[#0C3D2D] px-6 font-bold text-[#70F0A6]">{busy ? "Searching…" : "Search"}</button></form>{error && <p className="mt-4 text-sm text-red-700">{error}</p>}{result && <section className="mt-8 rounded-[26px] bg-white p-6"><h2 className="text-xl font-bold">Search result</h2><pre className="mt-4 max-h-96 overflow-auto rounded-2xl bg-[#F4F4F1] p-4 text-xs">{JSON.stringify(result, null, 2)}</pre><button onClick={useTrend} disabled={busy} className="mt-5 rounded-full bg-[#111211] px-6 py-3 text-sm font-bold text-white">Build strategy from this result</button></section>}</div></main>;
}
