import { Decision } from "@/lib/api/types";
import { AlertCircle, CheckCircle2, Clock, HelpCircle, XCircle } from "lucide-react";

interface DecisionBadgeProps {
  decision: Decision | string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function DecisionBadge({
  decision,
  size = "md",
  className = "",
}: DecisionBadgeProps) {
  let label = "Under Evaluation";
  let colorClasses = "bg-[#F5F5F2] text-[#111211] border-[#E4E6E1]";
  let Icon = HelpCircle;

  switch (decision) {
    case "pursue":
      label = "Recommended: Pursue";
      colorClasses = "bg-[#70F0A6] text-[#0C3D2D] border-[#70F0A6] shadow-sm";
      Icon = CheckCircle2;
      break;
    case "run_test":
      label = "Recommended: Run a Limited Test";
      colorClasses = "bg-[#0C3D2D] text-[#70F0A6] border-[#0C3D2D]";
      Icon = Clock;
      break;
    case "monitor":
      label = "Recommended: Monitor Market";
      colorClasses = "bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]";
      Icon = AlertCircle;
      break;
    case "no_action":
      label = "Decision: No Action";
      colorClasses = "bg-[#F3F4F6] text-[#4B5563] border-[#E5E7EB]";
      Icon = XCircle;
      break;
    case "insufficient_evidence":
    default:
      label = "Caution: Insufficient Evidence";
      colorClasses = "bg-[#FFFBEB] text-[#B45309] border-[#FCD34D]";
      Icon = AlertCircle;
      break;
  }

  const sizeClasses = {
    sm: "px-2.5 py-0.5 text-[11px] gap-1",
    md: "px-3.5 py-1 text-xs gap-1.5",
    lg: "px-4 py-1.5 text-sm font-semibold gap-2",
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold border transition-all ${sizeClasses} ${colorClasses} ${className}`}
    >
      <Icon className={size === "lg" ? "w-4 h-4" : "w-3.5 h-3.5"} />
      <span>{label}</span>
    </span>
  );
}
