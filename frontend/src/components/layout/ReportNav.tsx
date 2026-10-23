"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  TrendingUp,
  Target,
  Share2,
  CalendarCheck,
  FileCheck2,
  BarChart3,
  AlertTriangle,
} from "lucide-react";

interface ReportNavProps {
  reportId: string;
}

export function ReportNav({ reportId }: ReportNavProps) {
  const pathname = usePathname();
  const base = `/market-strategy/report/${reportId}`;

  const navItems = [
    { label: "Overview", href: base, icon: Compass, exact: true },
    { label: "Market", href: `${base}/market-analysis`, icon: TrendingUp },
    { label: "Positioning", href: `${base}/positioning`, icon: Target },
    { label: "Channels", href: `${base}/channels`, icon: Share2 },
    { label: "Action Plan", href: `${base}/execution`, icon: CalendarCheck },
    { label: "Evidence", href: `${base}/evidence`, icon: FileCheck2 },
    { label: "Measurement", href: `${base}/measurement`, icon: BarChart3 },
    { label: "Risks", href: `${base}/risks`, icon: AlertTriangle },
  ];

  return (
    <div className="w-full bg-[#FFFFFF] border-b border-[#E4E6E1] sticky top-15 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-1.5 overflow-x-auto py-2.5 scrollbar-none">
          {navItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? "bg-[#111211] text-[#FFFFFF] shadow-xs"
                    : "text-[#70736F] hover:text-[#111211] hover:bg-[#F4F4F1]"
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 ${
                    isActive ? "text-[#70F0A6]" : "text-[#8E928D]"
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
