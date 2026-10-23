import Link from "next/link";
import { ArrowUpRight, LucideIcon } from "lucide-react";
import React from "react";

interface BentoCardProps {
  title: string;
  categoryTag?: string;
  summary: string;
  href: string;
  icon: LucideIcon;
  badgeText?: string;
  className?: string;
  accent?: "default" | "mint" | "forest" | "dark";
  children?: React.ReactNode;
}

export function BentoCard({
  title,
  categoryTag,
  summary,
  href,
  icon: Icon,
  badgeText,
  className = "",
  accent = "default",
  children,
}: BentoCardProps) {
  const getThemeClasses = () => {
    switch (accent) {
      case "mint":
        return "bg-[#E1FBEA] text-[#0C3D2D] border-[#70F0A6]/60 hover:border-[#70F0A6]";
      case "forest":
        return "bg-[#0C3D2D] text-[#FFFFFF] border-[#0C3D2D] hover:border-[#70F0A6]/60";
      case "dark":
        return "bg-[#111211] text-[#FFFFFF] border-[#222522] hover:border-[#70F0A6]/40";
      default:
        return "bg-[#FFFFFF] text-[#111211] border-[#E4E6E1] hover:border-[#111211]/30 hover:shadow-md";
    }
  };

  const isDark = accent === "dark" || accent === "forest";

  return (
    <Link
      href={href}
      className={`group relative rounded-3xl p-6 border transition-all duration-300 flex flex-col justify-between focus:outline-none focus:ring-2 focus:ring-[#70F0A6] ${getThemeClasses()} ${className}`}
    >
      <div>
        {/* Header row with Icon, category tag, and arrow */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div
              className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                accent === "mint"
                  ? "bg-[#70F0A6] text-[#0C3D2D]"
                  : accent === "forest"
                  ? "bg-[#14523E] text-[#70F0A6]"
                  : accent === "dark"
                  ? "bg-[#1E231E] text-[#70F0A6]"
                  : "bg-[#F5F5F2] text-[#111211]"
              }`}
            >
              <Icon className="w-4 h-4" />
            </div>

            {categoryTag && (
              <span
                className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
                  isDark
                    ? "bg-[#222622] text-[#A0A49F]"
                    : "bg-[#F5F5F2] text-[#70736F]"
                }`}
              >
                {categoryTag}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-1.5">
            {badgeText && (
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  accent === "mint"
                    ? "bg-[#0C3D2D] text-[#70F0A6]"
                    : isDark
                    ? "bg-[#70F0A6] text-[#0C3D2D]"
                    : "bg-[#E1FBEA] text-[#0C3D2D]"
                }`}
              >
                {badgeText}
              </span>
            )}

            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${
                isDark
                  ? "bg-[#1E231E] text-white group-hover:bg-[#70F0A6] group-hover:text-[#0C3D2D]"
                  : "bg-[#F5F5F2] text-[#111211] group-hover:bg-[#111211] group-hover:text-white"
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Card Title */}
        <h3
          className={`text-lg font-bold tracking-tight mb-2 transition-colors ${
            isDark
              ? "text-white group-hover:text-[#70F0A6]"
              : "text-[#111211] group-hover:text-[#0C3D2D]"
          }`}
        >
          {title}
        </h3>

        {/* Short Summary */}
        <p
          className={`text-xs leading-relaxed line-clamp-3 ${
            isDark ? "text-[#C4C7C0]" : "text-[#70736F]"
          }`}
        >
          {summary}
        </p>

        {children && <div className="mt-4">{children}</div>}
      </div>

      {/* Footer navigation prompt */}
      <div className="mt-5 pt-3 border-t border-dashed border-current/10 flex items-center justify-between text-[11px] font-semibold">
        <span
          className={
            accent === "mint"
              ? "text-[#0C3D2D]"
              : isDark
              ? "text-[#70F0A6]"
              : "text-[#0C3D2D]"
          }
        >
          View Detailed Plan →
        </span>
      </div>
    </Link>
  );
}
