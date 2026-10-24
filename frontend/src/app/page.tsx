"use client";

import Link from "next/link";
import { ArrowRight, Compass, LineChart, Sparkles, ShieldCheck, ChevronRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#F4F4F1] text-[#111211] flex flex-col font-sans">
      {/* 1. Header */}
      <header className="sticky top-0 z-50 bg-[#F4F4F1]/90 backdrop-blur-md border-b border-[#E4E6E1]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-[#0C3D2D] flex items-center justify-center text-[#70F0A6]">
              <span className="font-black text-xs tracking-tighter">TR</span>
            </div>
            <span className="font-black text-lg tracking-tight text-[#111211]">
              TRNDO<span className="text-[#0C3D2D]">.AI</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-xs font-semibold text-[#70736F]">
            <a href="#features" className="hover:text-[#111211] transition-colors">
              Capabilities
            </a>
            <a href="#how-it-works" className="hover:text-[#111211] transition-colors">
              How It Works
            </a>
          </nav>

          <div className="flex items-center space-x-3">
            {user ? (
              <Link
                href="/app"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0C3D2D] text-[#70F0A6] text-xs font-bold hover:bg-[#14523E] transition-colors"
              >
                <span>Go to Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-xs font-bold text-[#111211] hover:text-[#0C3D2D] transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#111211] text-white text-xs font-bold hover:bg-[#252825] transition-colors"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="px-4 sm:px-8 pt-10 sm:pt-16 pb-14 max-w-[1440px] mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Hero Left: Text & CTA */}
          <div className="lg:col-span-7 rounded-[32px] bg-[#FFFFFF] border border-[#E4E6E1] p-8 sm:p-14 flex flex-col justify-between shadow-xs">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E3FAEC] text-[#0C3D2D] text-[10px] font-bold uppercase tracking-wider mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0C3D2D]" />
                AI Marketing for Small Businesses
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05] text-[#111211]">
                Understand the trend. Plan the strategy. Create the promotion.
              </h1>

              <p className="mt-6 text-base sm:text-lg text-[#70736F] max-w-xl leading-relaxed">
                TRNDO helps your shop discover relevant market opportunities and turn them into evidence-backed strategies and branded marketing content.
              </p>
            </div>

            <div className="pt-8 sm:pt-12 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-[#0C3D2D] text-[#70F0A6] text-sm font-bold hover:bg-[#14523E] transition-all shadow-sm"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center px-6 py-3.5 rounded-full bg-[#F4F4F1] text-[#111211] text-sm font-semibold hover:bg-[#E8EAE5] transition-colors"
              >
                See How It Works
              </a>
            </div>
          </div>

          {/* Hero Right: Abstract Editorial Composition */}
          <div className="lg:col-span-5 rounded-[32px] bg-[#111211] text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
            <div className="space-y-4 relative z-10">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#70F0A6] block">
                Workflow Rhythm
              </span>
              <h3 className="text-2xl font-bold tracking-tight text-white leading-snug">
                From real customer demand to published campaign.
              </h3>
            </div>

            {/* Visual Panel Stack */}
            <div className="my-6 space-y-3 relative z-10">
              <div className="p-4 rounded-2xl bg-[#1C201C] border border-[#2E332E] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#0C3D2D] flex items-center justify-center text-[#70F0A6]">
                    <LineChart className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Google Trends Demand</span>
                    <span className="text-[10px] text-[#8E928D]">Timeseries & Reliability Score</span>
                  </div>
                </div>
                <span className="text-[11px] font-mono font-bold text-[#70F0A6]">86/100</span>
              </div>

              <div className="p-4 rounded-2xl bg-[#1C201C] border border-[#2E332E] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#0C3D2D] flex items-center justify-center text-[#70F0A6]">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Evidence-Backed Strategy</span>
                    <span className="text-[10px] text-[#8E928D]">Target Positioning & 14-Day Test</span>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#0C3D2D] text-[#70F0A6] font-bold">Approved</span>
              </div>

              <div className="p-4 rounded-2xl bg-[#1C201C] border border-[#2E332E] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#0C3D2D] flex items-center justify-center text-[#70F0A6]">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Market Studio Posters</span>
                    <span className="text-[10px] text-[#8E928D]">Social Post, Stories & Telegram</span>
                  </div>
                </div>
                <span className="text-[10px] text-[#A0A49F]">Ready to Share</span>
              </div>
            </div>

            <div className="pt-4 border-t border-[#262A26] flex items-center justify-between text-[11px] text-[#8E928D] relative z-10">
              <span>Personalized Shop Profile Context</span>
              <span className="text-[#70F0A6] font-semibold">Zero Hallucinations</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Feature Cards Section */}
      <section id="features" className="px-4 sm:px-8 py-16 max-w-[1440px] mx-auto w-full">
        <div className="mb-10 text-center sm:text-left">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#0C3D2D] bg-[#E3FAEC] px-3 py-1 rounded-full">
            Core Capabilities
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-black tracking-tight text-[#111211]">
            Three connected pillars for your shop.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Trend Finder */}
          <div className="p-8 rounded-[28px] bg-[#FFFFFF] border border-[#E4E6E1] flex flex-col justify-between hover:border-[#0C3D2D]/40 transition-colors shadow-xs">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#E3FAEC] text-[#0C3D2D] flex items-center justify-center mb-6">
                <LineChart className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold tracking-tight text-[#111211] mb-2">
                Trend Finder
              </h3>
              <p className="text-sm text-[#70736F] leading-relaxed">
                Discover product and market trends relevant to your business using Google Trends timeseries signals and predictive reliability scoring.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-[#E4E6E1] flex items-center justify-between text-xs font-semibold text-[#0C3D2D]">
              <span>Real Search Demand</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          {/* Card 2: Market Strategy */}
          <div className="p-8 rounded-[28px] bg-[#FFFFFF] border border-[#E4E6E1] flex flex-col justify-between hover:border-[#0C3D2D]/40 transition-colors shadow-xs">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#0C3D2D] text-[#70F0A6] flex items-center justify-center mb-6">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold tracking-tight text-[#111211] mb-2">
                Market Strategy
              </h3>
              <p className="text-sm text-[#70736F] leading-relaxed">
                Turn a promising opportunity into a clear marketing plan with verified web research, customer positioning, channel selection, and measurable KPIs.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-[#E4E6E1] flex items-center justify-between text-xs font-semibold text-[#0C3D2D]">
              <span>Evidence-Backed Roadmaps</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          {/* Card 3: Market Studio */}
          <div className="p-8 rounded-[28px] bg-[#FFFFFF] border border-[#E4E6E1] flex flex-col justify-between hover:border-[#0C3D2D]/40 transition-colors shadow-xs">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#E3FAEC] text-[#0C3D2D] flex items-center justify-center mb-6">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold tracking-tight text-[#111211] mb-2">
                Market Studio
              </h3>
              <p className="text-sm text-[#70736F] leading-relaxed">
                Create branded promotional posters and captions from your strategy, ready for WhatsApp, Instagram, and Telegram customer enquiries.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-[#E4E6E1] flex items-center justify-between text-xs font-semibold text-[#0C3D2D]">
              <span>One-Click Creative Assets</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </section>

      {/* 4. How It Works Section */}
      <section id="how-it-works" className="px-4 sm:px-8 py-16 max-w-[1440px] mx-auto w-full">
        <div className="p-8 sm:p-14 rounded-[32px] bg-[#0C3D2D] text-white">
          <div className="max-w-2xl mb-12">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#70F0A6] block mb-2">
              Simple 4-Step Process
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
              From business context to customer enquiries.
            </h2>
            <p className="mt-3 text-sm text-white/70">
              Configure your shop once. TRNDO connects your brand profile to all trend analysis and promotional outputs.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-[#14523E] border border-[#1F6B52] space-y-3">
              <span className="text-xs font-mono font-bold text-[#70F0A6]">01</span>
              <h4 className="text-base font-bold text-white">Tell us about your shop</h4>
              <p className="text-xs text-white/70 leading-relaxed">
                Add your business name, category, region, customer audience, and optional logo.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#14523E] border border-[#1F6B52] space-y-3">
              <span className="text-xs font-mono font-bold text-[#70F0A6]">02</span>
              <h4 className="text-base font-bold text-white">Discover relevant trends</h4>
              <p className="text-xs text-white/70 leading-relaxed">
                Review personalized trend suggestions filtered by your city and product catalog.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#14523E] border border-[#1F6B52] space-y-3">
              <span className="text-xs font-mono font-bold text-[#70F0A6]">03</span>
              <h4 className="text-base font-bold text-white">Build your marketing strategy</h4>
              <p className="text-xs text-white/70 leading-relaxed">
                Generate an evidence-backed roadmap with pricing tiers, channels, and test hypotheses.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#14523E] border border-[#1F6B52] space-y-3">
              <span className="text-xs font-mono font-bold text-[#70F0A6]">04</span>
              <h4 className="text-base font-bold text-white">Create and share promotions</h4>
              <p className="text-xs text-white/70 leading-relaxed">
                Produce posters, dispatch to Telegram, take customer orders, and generate UPI payment QRs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Final CTA Section */}
      <section className="px-4 sm:px-8 py-16 max-w-[1440px] mx-auto w-full text-center">
        <div className="p-10 sm:p-16 rounded-[32px] bg-[#FFFFFF] border border-[#E4E6E1] space-y-6 shadow-xs max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-[#111211]">
            Make your next marketing move with confidence.
          </h2>
          <p className="text-base text-[#70736F] max-w-xl mx-auto">
            Join local shops turning consumer demand signals into verified marketing campaigns.
          </p>
          <div className="pt-2">
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#111211] text-white text-sm font-bold hover:bg-[#252825] transition-all shadow-md"
            >
              <span>Create Your Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 6. Footer */}
      <footer className="mt-auto border-t border-[#E4E6E1] bg-[#FFFFFF] py-10 text-xs text-[#70736F]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3">
            <span className="font-bold text-[#111211]">TRNDO AI</span>
            <span>•</span>
            <span>Personalized Marketing SaaS for Small Businesses</span>
          </div>

          <div className="flex items-center space-x-6 text-[11px]">
            <Link href="/auth/login" className="hover:text-[#111211]">
              Sign In
            </Link>
            <Link href="/auth/register" className="hover:text-[#111211]">
              Register
            </Link>
            <span>Deterministic Scoring Model heuristic-v1</span>
            <span className="text-[#0C3D2D] font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Architecture
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
