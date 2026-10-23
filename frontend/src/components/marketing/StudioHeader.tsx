"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Sparkles, X } from "lucide-react";
import { useState } from "react";

const links = [
  ["/marketing-studio", "Create"],
  ["/marketing-studio/creations", "My Creations"],
  ["/marketing-studio/inbox", "Inbox"],
  ["/marketing-studio/orders", "Orders"],
];

export function StudioHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-brand-border bg-brand-bg/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/marketing-studio" className="flex shrink-0 items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-forest text-xs font-black text-brand-mint">TR</span>
          <span className="hidden sm:block">
            <span className="block text-sm font-black tracking-tight">TRNDO<span className="font-light text-brand-forest">.AI</span></span>
            <span className="block text-[9px] font-bold uppercase tracking-[0.18em] text-brand-muted">Marketing Studio</span>
          </span>
        </Link>
        <nav className={`${open ? "absolute left-4 right-4 top-[4.5rem] flex" : "hidden"} flex-col gap-1 rounded-2xl border border-brand-border bg-white p-2 shadow-lg md:static md:flex md:flex-row md:border-0 md:bg-transparent md:p-0 md:shadow-none`}>
          {links.map(([href, label]) => {
            const active = href === "/marketing-studio" ? pathname === href || pathname === "/marketing-studio/create" : pathname.startsWith(href);
            return <Link key={href} href={href} onClick={() => setOpen(false)} className={`rounded-full px-4 py-2 text-xs font-bold transition ${active ? "bg-brand-text text-white" : "text-brand-muted hover:bg-white hover:text-brand-text"}`}>{label}</Link>;
          })}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/market-strategy" className="hidden rounded-full border border-brand-border bg-white px-3 py-2 text-xs font-bold text-brand-muted hover:text-brand-text sm:block">Strategy</Link>
          <span className="hidden items-center gap-1.5 rounded-full border border-brand-border bg-white px-3 py-2 text-[11px] font-semibold text-brand-forest lg:flex"><span className="h-2 w-2 rounded-full bg-brand-mint" /> Telegram ready</span>
          <button aria-label={open ? "Close navigation" : "Open navigation"} onClick={() => setOpen(!open)} className="rounded-full border border-brand-border bg-white p-2 md:hidden">{open ? <X size={16} /> : <Menu size={16} />}</button>
          <Sparkles className="hidden text-brand-forest sm:block" size={17} />
        </div>
      </div>
    </header>
  );
}
