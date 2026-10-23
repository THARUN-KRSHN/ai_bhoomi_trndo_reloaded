 "use client";
import { StudioHeader } from "@/components/marketing/StudioHeader";
import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function MarketingStudioLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => { if (!loading && !user) router.replace("/auth/login"); else if (!loading && user && !user.onboarding_complete) router.replace("/onboarding"); }, [loading, user, router]);
  if (loading || !user || !user.onboarding_complete) return <div className="min-h-screen flex items-center justify-center text-sm text-[#70736F]">Loading your TRNDO workspace…</div>;
  return <div className="min-h-screen bg-brand-bg text-brand-text"><Suspense fallback={<div className="h-16 border-b border-brand-border bg-brand-bg" />}><StudioHeader /></Suspense><main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">{children}</main></div>;
}
