"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Copy, Download } from "lucide-react";
import { API_BASE_URL, getPromotion } from "@/lib/api/client";
import { PromotionResponse } from "@/lib/api/types";

export default function CreationDetails({ params }: { params: Promise<{ id: string }> }) {
  const [item, setItem] = useState<PromotionResponse | null>(null);
  const [message, setMessage] = useState("");
  useEffect(() => { params.then(({ id }) => { const local = localStorage.getItem(`trndo-promotion-${id}`); if (local) setItem(JSON.parse(local)); else getPromotion(id).then(setItem).catch(() => setItem(null)); }); }, [params]);
  if (!item) return <div className="py-24 text-center text-sm text-brand-muted">Loading creation or it is no longer available.</div>;
  const raw = item.asset_urls[0]; const src = raw ? (raw.startsWith("http") ? raw : `${API_BASE_URL}${raw}`) : null;
  return <div className="space-y-6"><Link href="/marketing-studio/creations" className="inline-flex items-center gap-2 text-xs font-bold text-brand-muted"><ArrowLeft size={15} /> My creations</Link><div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]"><div className="flex min-h-[650px] items-center justify-center rounded-[26px] bg-[#e8ebe4] p-8">{src ? <img src={src} alt={item.content.poster_headline} className="max-h-[650px] max-w-full object-contain shadow-xl" /> : <div className="flex aspect-[4/5] max-h-[600px] w-full max-w-[430px] flex-col justify-end rounded-2xl bg-[#f5eadb] p-8 text-4xl font-black leading-none">Make the moment<br />taste beautiful.</div>}</div><div className="rounded-[26px] border border-brand-border bg-white p-7"><span className="eyebrow">Saved creation</span><h1 className="mt-2 text-3xl font-black tracking-tight">{item.content.promotion_title}</h1><p className="mt-3 text-sm leading-6 text-brand-muted">{item.content.campaign_angle}</p><div className="mt-8"><span className="eyebrow">Caption</span><p className="mt-3 whitespace-pre-line text-sm leading-7">{item.content.primary_caption}</p><p className="mt-4 text-xs font-bold text-brand-forest">{item.content.hashtags.join(" ")}</p></div><div className="mt-8 flex flex-wrap gap-2"><button onClick={() => { navigator.clipboard.writeText(`${item.content.primary_caption}\n\n${item.content.hashtags.join(" ")}`); setMessage("Caption copied"); }} className="inline-flex items-center gap-2 rounded-full bg-brand-text px-4 py-3 text-xs font-bold text-white"><Copy size={14} /> Copy caption</button>{src && <a download href={src} className="inline-flex items-center gap-2 rounded-full border border-brand-border px-4 py-3 text-xs font-bold"><Download size={14} /> Download</a>}</div>{message && <p className="mt-4 text-xs font-bold text-brand-forest">{message}</p>}<Link href={`/market-strategy/report/${item.strategy_id}`} className="mt-8 block text-xs font-bold text-brand-forest underline">View source strategy</Link></div></div></div>;
}
