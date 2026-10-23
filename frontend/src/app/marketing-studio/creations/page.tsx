"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, ImageOff, Plus } from "lucide-react";
import { PromotionResponse } from "@/lib/api/types";
import { API_BASE_URL } from "@/lib/api/client";

export default function CreationsPage() {
  const [items, setItems] = useState<PromotionResponse[]>([]);
  useEffect(() => {
    const found: PromotionResponse[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("trndo-promotion-")) {
        try { found.push(JSON.parse(localStorage.getItem(key) || "")); } catch { /* Ignore stale local records. */ }
      }
    }
    const timer = window.setTimeout(() => setItems(found.reverse()), 0);
    return () => window.clearTimeout(timer);
  }, []);
  return <div className="space-y-8"><div className="flex flex-wrap items-end justify-between gap-4"><div><span className="eyebrow">Marketing Studio</span><h1 className="mt-2 text-4xl font-black tracking-tight">My creations</h1><p className="mt-2 text-sm text-brand-muted">Your strategy-led posters and captions, in one place.</p></div><Link href="/marketing-studio/create" className="inline-flex items-center gap-2 rounded-full bg-brand-forest px-4 py-3 text-xs font-black text-brand-mint"><Plus size={15} /> Create promotion</Link></div>{items.length === 0 ? <div className="rounded-[26px] border border-dashed border-brand-border bg-white p-16 text-center"><ImageOff className="mx-auto text-brand-muted" size={28} /><h2 className="mt-4 text-xl font-black">No creations yet.</h2><p className="mt-2 text-sm text-brand-muted">Your promotional posters will appear here.</p><Link href="/marketing-studio/create" className="mt-6 inline-flex rounded-full bg-brand-text px-5 py-3 text-xs font-bold text-white">Create promotion</Link></div> : <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{items.map((item) => { const raw = item.asset_urls[0]; const src = raw ? (raw.startsWith("http") ? raw : `${API_BASE_URL}${raw}`) : null; return <Link href={`/marketing-studio/creations/${item.promotion_id}`} key={item.promotion_id} className="group overflow-hidden rounded-[24px] border border-brand-border bg-white"><div className="flex aspect-[4/3] items-center justify-center bg-brand-bg p-5">{src ? <img src={src} alt="" className="max-h-full max-w-full rounded-lg object-contain shadow-lg" /> : <div className="flex h-full w-full items-end rounded-xl bg-[#f5eadb] p-5 text-2xl font-black leading-none">Make the moment<br />taste beautiful.</div>}</div><div className="flex items-center justify-between p-5"><div><h2 className="line-clamp-1 text-sm font-black">{item.content.promotion_title}</h2><p className="mt-1 text-[11px] text-brand-muted">{new Date(item.created_at).toLocaleDateString()}</p></div><ArrowRight size={16} className="text-brand-forest transition group-hover:translate-x-1" /></div></Link>; })}</div>}</div>;
}
