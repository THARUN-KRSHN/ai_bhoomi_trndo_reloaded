import { StudioHeader } from "@/components/marketing/StudioHeader";
import { Suspense } from "react";

export default function MarketingStudioLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-brand-bg text-brand-text"><Suspense fallback={<div className="h-16 border-b border-brand-border bg-brand-bg" />}><StudioHeader /></Suspense><main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">{children}</main></div>;
}
