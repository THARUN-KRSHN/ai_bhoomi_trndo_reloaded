"use client";

import { Suspense, useEffect } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function MarketStrategyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && !user) router.replace("/auth/login");
    else if (!loading && user && !user.onboarding_complete) router.replace("/onboarding");
  }, [loading, user, router]);
  if (loading || !user || !user.onboarding_complete) return <div className="min-h-screen flex items-center justify-center text-sm text-[#70736F]">Loading your TRNDO workspace…</div>;
  return (
    <div className="min-h-screen flex flex-col bg-[#F4F4F1] text-[#111211]">
      <Suspense fallback={<div className="h-16 bg-[#FFFFFF]/90 border-b border-[#E4E6E1]" />}>
        <AppHeader />
      </Suspense>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <Suspense fallback={<div className="py-20 text-center text-xs text-[#70736F]">Loading...</div>}>
          {children}
        </Suspense>
      </main>
      <footer className="border-t border-[#E4E6E1] bg-[#FFFFFF] py-6 text-xs text-[#70736F]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-[#111211]">TRNDO Intelligence</span>
            <span>•</span>
            <span>Deterministic Scoring Model heuristic-v1</span>
          </div>

          <div className="flex items-center space-x-4 text-[11px]">
            <span className="flex items-center gap-1 text-[#0C3D2D]">
              <ShieldCheck className="w-3.5 h-3.5" />
              Untrusted Content Sanitized
            </span>
            <span>Zero Hallucinated Metrics</span>
            <span>FastAPI Backend Ready</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
