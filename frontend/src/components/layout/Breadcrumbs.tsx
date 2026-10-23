"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className = "" }: BreadcrumbsProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center space-x-1.5 text-xs text-[#70736F] font-medium py-2.5 overflow-x-auto whitespace-nowrap scrollbar-none ${className}`}
    >
      <Link
        href="/market-strategy"
        className="flex items-center text-[#70736F] hover:text-[#111211] transition-colors"
      >
        <Home className="w-3.5 h-3.5 mr-1" />
        <span>TRNDO AI</span>
      </Link>

      <ChevronRight className="w-3.5 h-3.5 text-[#C4C7C0] flex-shrink-0" />
      <Link
        href="/market-strategy"
        className="hover:text-[#111211] transition-colors"
      >
        Market Strategy
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <div key={index} className="flex items-center space-x-1.5">
            <ChevronRight className="w-3.5 h-3.5 text-[#C4C7C0] flex-shrink-0" />
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="hover:text-[#111211] transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className={`truncate max-w-[220px] sm:max-w-none ${isLast ? "text-[#111211] font-semibold" : ""}`}>
                {item.label}
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
}
