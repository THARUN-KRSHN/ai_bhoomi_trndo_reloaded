"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

interface AccordionProps {
  title: string;
  subtitle?: string;
  badge?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function Accordion({
  title,
  subtitle,
  badge,
  defaultOpen = false,
  children,
  className = "",
}: AccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      className={`rounded-2xl border border-[#E4E6E1] bg-[#FFFFFF] transition-all overflow-hidden ${className}`}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-[#FAFBF9] transition-colors focus:outline-none"
      >
        <div className="flex items-center space-x-3 pr-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-bold text-[#111211]">
                {title}
              </span>
              {badge && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#F4F4F1] text-[#70736F]">
                  {badge}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-[#70736F] mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>

        <div
          className={`w-7 h-7 rounded-full bg-[#F4F4F1] flex items-center justify-center text-[#70736F] transition-transform duration-200 flex-shrink-0 ${
            isOpen ? "rotate-180 bg-[#111211] text-white" : ""
          }`}
        >
          <ChevronDown className="w-4 h-4" />
        </div>
      </button>

      {isOpen && (
        <div className="p-4 sm:p-5 pt-0 border-t border-[#F0F2EE] mt-1 space-y-4 animate-in fade-in duration-200">
          {children}
        </div>
      )}
    </div>
  );
}
