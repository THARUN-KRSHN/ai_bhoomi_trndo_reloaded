"use client";

import Link from "next/link";
import { ArrowLeft, CircleAlert } from "lucide-react";

export default function OrderDetails() {
  return <div className="space-y-6"><Link href="/marketing-studio/orders" className="inline-flex items-center gap-2 text-xs font-bold text-brand-muted"><ArrowLeft size={15} /> Orders</Link><div className="rounded-[26px] border border-brand-border bg-white p-8"><span className="eyebrow">Order details</span><h1 className="mt-2 text-3xl font-black">Order detail view</h1><div className="mt-8 flex gap-3 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900"><CircleAlert size={18} className="shrink-0" /><p>The current backend exposes individual order lookup but not an order-list endpoint. Opened order records can be connected here once an order reference is supplied by the Telegram inbox.</p></div></div></div>;
}
