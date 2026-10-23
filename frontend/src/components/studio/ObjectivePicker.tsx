"use client";

import { Objective } from "@/lib/api/types";
import {
  MessageSquare,
  ShoppingBag,
  Eye,
  Sparkles,
  Repeat,
  Calendar,
  PackageMinus,
  Check,
} from "lucide-react";

interface ObjectivePickerProps {
  selectedObjective: Objective;
  onChange: (obj: Objective) => void;
}

const OBJECTIVES_LIST: {
  id: Objective;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    id: "qualified_inquiries",
    label: "Increase Qualified Inquiries",
    desc: "Generate high-intent WhatsApp and direct inquiries with upfront menu details.",
    icon: MessageSquare,
  },
  {
    id: "sales",
    label: "Direct Sales & Orders",
    desc: "Drive direct online and storefront transactions for ready-to-order items.",
    icon: ShoppingBag,
  },
  {
    id: "awareness",
    label: "Build Brand Awareness",
    desc: "Maximize local reach and aesthetic recognition in nearby neighborhoods.",
    icon: Eye,
  },
  {
    id: "new_product_launch",
    label: "Introduce a New Product",
    desc: "Build anticipation and initial customer proof for a recently introduced item.",
    icon: Sparkles,
  },
  {
    id: "repeat_purchase",
    label: "Encourage Repeat Purchases",
    desc: "Retain past celebration customers for upcoming milestone dates.",
    icon: Repeat,
  },
  {
    id: "seasonal_promotion",
    label: "Promote Seasonal Offer",
    desc: "Leverage upcoming regional festivals, holiday gifting, and celebration seasons.",
    icon: Calendar,
  },
  {
    id: "inventory_reduction",
    label: "Improve Product Demand",
    desc: "Targeted campaigns to accelerate orders without aggressive price discounting.",
    icon: PackageMinus,
  },
];

export function ObjectivePicker({
  selectedObjective,
  onChange,
}: ObjectivePickerProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {OBJECTIVES_LIST.map((item) => {
        const isSelected = selectedObjective === item.id;
        const Icon = item.icon;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={`p-4 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between focus:outline-none focus:ring-2 focus:ring-[#70F0A6] ${
              isSelected
                ? "bg-[#0C3D2D] text-[#FFFFFF] border-[#0C3D2D] shadow-md ring-2 ring-[#70F0A6]"
                : "bg-[#FFFFFF] text-[#111211] border-[#E4E6E1] hover:border-[#111211]/30 hover:bg-[#FAFBF9]"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    isSelected
                      ? "bg-[#14523E] text-[#70F0A6]"
                      : "bg-[#F5F5F2] text-[#111211]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-[#70F0A6] text-[#0C3D2D] flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
              </div>

              <h4
                className={`text-sm font-bold tracking-tight mb-1 ${
                  isSelected ? "text-white" : "text-[#111211]"
                }`}
              >
                {item.label}
              </h4>

              <p
                className={`text-xs leading-relaxed ${
                  isSelected ? "text-[#C4C7C0]" : "text-[#70736F]"
                }`}
              >
                {item.desc}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
