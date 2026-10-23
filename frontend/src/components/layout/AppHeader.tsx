"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Store, ChevronDown, ArrowLeft, ShieldCheck, Sparkles, X } from "lucide-react";

export function AppHeader() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isStudio = pathname === "/market-strategy";
  const isBrief = pathname === "/market-strategy/brief";
  const isGenerating = pathname === "/market-strategy/generating";
  const isReport = pathname.includes("/market-strategy/report");

  return (
    <header className="sticky top-0 z-40 bg-[#FFFFFF] border-b border-[#E4E6E1]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between">
        {/* Left: Brand Monogram & Wordmark */}
        <div className="flex items-center space-x-3">
          <Link
            href="/market-strategy"
            className="flex items-center space-x-2.5 group focus:outline-none"
          >
            <div className="w-8 h-8 rounded-full bg-[#0C3D2D] flex items-center justify-center text-[#70F0A6] shadow-xs group-hover:scale-105 transition-transform flex-shrink-0">
              <span className="font-bold text-xs tracking-tighter">TR</span>
            </div>
            <div className="flex flex-col">
              <span className="font-black tracking-tight text-base text-[#111211] leading-none">
                TRNDO<span className="text-[#0C3D2D] font-light">.AI</span>
              </span>
              <span className="text-[9px] uppercase tracking-widest text-[#70736F] font-semibold mt-0.5">
                Market Strategy Studio
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Compact Pill Stepper */}
        <nav className="flex items-center space-x-1.5 overflow-x-auto py-1 scrollbar-none text-xs font-semibold">
          <Link
            href="/market-strategy"
            className={`px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap ${
              isStudio
                ? "bg-[#111211] text-[#FFFFFF] shadow-xs"
                : "text-[#70736F] hover:text-[#111211] hover:bg-[#F4F4F1]"
            }`}
          >
            01 Opportunity
          </Link>

          <Link
            href="/market-strategy/brief"
            className={`px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap ${
              isBrief
                ? "bg-[#111211] text-[#FFFFFF] shadow-xs"
                : "text-[#70736F] hover:text-[#111211] hover:bg-[#F4F4F1]"
            }`}
          >
            02 Strategy Brief
          </Link>

          <span
            className={`px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap ${
              isReport || isGenerating
                ? "bg-[#111211] text-[#FFFFFF] shadow-xs"
                : "text-[#A0A49F] cursor-not-allowed bg-transparent"
            }`}
          >
            03 Strategy Report
          </span>
        </nav>

        {/* Right: Minimal Workspace Pill & Secondary Menu */}
        <div className="relative flex items-center space-x-2">
          <Link
            href="/marketing-studio"
            className="hidden rounded-full bg-[#E3FAEC] px-3 py-1.5 text-xs font-bold text-[#0C3D2D] hover:bg-[#70F0A6] sm:block"
          >
            Marketing Studio
          </Link>
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-full border border-[#E4E6E1] bg-[#FAFBF9] hover:bg-[#F4F4F1] transition-colors text-xs text-[#111211] font-medium focus:outline-none"
          >
            <span className="w-2 h-2 rounded-full bg-[#70F0A6]" />
            <span className="hidden sm:inline">Kochi Studio</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#70736F]" />
          </button>

          {/* Secondary Overflow Dropdown */}
          {isMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsMenuOpen(false)}
              />
              <div className="absolute right-0 top-11 w-64 rounded-2xl bg-[#FFFFFF] border border-[#E4E6E1] shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 text-xs space-y-2">
                <div className="p-2 border-b border-[#F0F2EE]">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#70736F] block mb-0.5">
                    Workspace Context
                  </span>
                  <span className="font-bold text-[#111211] block">Artisan Studio Kochi</span>
                  <span className="text-[11px] text-[#70736F]">Kerala, India</span>
                </div>

                <div className="p-2 bg-[#E3FAEC] rounded-xl text-[11px] text-[#0C3D2D] font-medium flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#0C3D2D]" />
                  <span>FastAPI Backend Connected</span>
                </div>

                <div className="pt-1">
                  <span
                    className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[#70736F] hover:bg-[#F4F4F1] cursor-pointer"
                    title="Trend Discovery module upstream integration point"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 text-[#70736F]" />
                    <span>Return to Trend Insights</span>
                  </span>

                  <span className="flex items-center justify-between px-2 py-1.5 rounded-lg text-[#A0A49F]">
                    <span>Content Studio</span>
                    <span className="text-[9px] uppercase font-bold tracking-wider text-[#8E928D] bg-[#F4F4F1] px-1.5 py-0.5 rounded">
                      Soon
                    </span>
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
