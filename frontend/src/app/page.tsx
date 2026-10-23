"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/market-strategy");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F4F1]">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-full bg-[#0C3D2D] flex items-center justify-center text-[#70F0A6] animate-pulse">
          <span className="font-bold text-xs tracking-tighter">TR</span>
        </div>
        <span className="text-xs font-semibold text-[#70736F]">
          Redirecting to Market Strategy Studio...
        </span>
      </div>
    </div>
  );
}
