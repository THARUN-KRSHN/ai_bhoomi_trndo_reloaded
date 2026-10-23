"use client";

import { useState } from "react";
import { X, Check } from "lucide-react";
import { BusinessRequest, Objective } from "@/lib/api/types";

export type SectionType =
  | "goal"
  | "audience"
  | "market"
  | "positioning"
  | "channels"
  | "constraints";

interface EditSectionModalProps {
  section: SectionType;
  brief: BusinessRequest;
  onSave: (updated: Partial<BusinessRequest>) => void;
  onClose: () => void;
}

export function EditSectionModal({
  section,
  brief,
  onSave,
  onClose,
}: EditSectionModalProps) {
  // Local form state
  const [formData, setFormData] = useState<Partial<BusinessRequest>>({
    objective: brief.objective,
    campaign_time_horizon: brief.campaign_time_horizon,
    target_audience: brief.target_audience,
    city: brief.city,
    region: brief.region,
    country: brief.country,
    primary_language: brief.primary_language,
    secondary_languages: brief.secondary_languages || [],
    brand_personality: brief.brand_personality || "",
    product_positioning: brief.product_positioning || "",
    desired_tone: brief.desired_tone || "",
    preferred_channels: brief.preferred_channels || [],
    budget_type: brief.budget_type || "organic",
    budget_amount: brief.budget_amount || null,
    approved_price_floor: brief.approved_price_floor || null,
    fulfilment_capacity: brief.fulfilment_capacity || null,
    constraints: brief.constraints || [],
  });

  const [newConstraint, setNewConstraint] = useState("");

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  const getTitle = () => {
    switch (section) {
      case "goal":
        return "Configure Campaign Goal & Time Horizon";
      case "audience":
        return "Refine Target Audience & Buying Occasion";
      case "market":
        return "Market Context & Language Preferences";
      case "positioning":
        return "Brand Personality & Positioning Tone";
      case "channels":
        return "Channel Selection & Media Formats";
      case "constraints":
        return "Safeguards, Capacity & Price Floors";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111211]/50 backdrop-blur-xs p-4">
      <div className="bg-[#FFFFFF] rounded-3xl max-w-xl w-full p-6 sm:p-8 border border-[#E4E6E1] shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#F0F2EE] mb-6">
          <h3 className="text-xl font-bold tracking-tight text-[#111211]">
            {getTitle()}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F5F5F2] hover:bg-[#E4E6E1] flex items-center justify-center text-[#111211] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section specific fields */}
        <div className="space-y-4 text-xs">
          {section === "goal" && (
            <>
              <div>
                <label className="block font-bold text-[#111211] mb-1">
                  Primary Objective
                </label>
                <select
                  value={formData.objective}
                  onChange={(e) =>
                    setFormData({ ...formData, objective: e.target.value as Objective })
                  }
                  className="w-full p-3 rounded-xl border border-[#E4E6E1] bg-[#FAFBF9] text-xs font-medium focus:ring-2 focus:ring-[#70F0A6] outline-none"
                >
                  <option value="qualified_inquiries">Qualified Inquiries</option>
                  <option value="sales">Direct Sales</option>
                  <option value="awareness">Brand Awareness</option>
                  <option value="new_product_launch">New Product Launch</option>
                  <option value="repeat_purchase">Repeat Purchase</option>
                  <option value="seasonal_promotion">Seasonal Promotion</option>
                  <option value="inventory_reduction">Inventory Reduction</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#111211] mb-1">
                  Campaign Duration / Time Horizon
                </label>
                <input
                  type="text"
                  value={formData.campaign_time_horizon}
                  onChange={(e) =>
                    setFormData({ ...formData, campaign_time_horizon: e.target.value })
                  }
                  placeholder="e.g. 14 days, 30 days"
                  className="w-full p-3 rounded-xl border border-[#E4E6E1] bg-[#FAFBF9] text-xs font-medium focus:ring-2 focus:ring-[#70F0A6] outline-none"
                />
              </div>
            </>
          )}

          {section === "audience" && (
            <>
              <div>
                <label className="block font-bold text-[#111211] mb-1">
                  Target Customer Segment & Occasion
                </label>
                <textarea
                  rows={4}
                  value={formData.target_audience}
                  onChange={(e) =>
                    setFormData({ ...formData, target_audience: e.target.value })
                  }
                  placeholder="Describe your ideal customers, buying occasion, and known pain points..."
                  className="w-full p-3 rounded-xl border border-[#E4E6E1] bg-[#FAFBF9] text-xs font-medium focus:ring-2 focus:ring-[#70F0A6] outline-none leading-relaxed"
                />
              </div>
            </>
          )}

          {section === "market" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#111211] mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full p-3 rounded-xl border border-[#E4E6E1] bg-[#FAFBF9] text-xs font-medium outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#111211] mb-1">Region / State</label>
                  <input
                    type="text"
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    className="w-full p-3 rounded-xl border border-[#E4E6E1] bg-[#FAFBF9] text-xs font-medium outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#111211] mb-1">
                  Primary Messaging Language
                </label>
                <input
                  type="text"
                  value={formData.primary_language}
                  onChange={(e) =>
                    setFormData({ ...formData, primary_language: e.target.value })
                  }
                  placeholder="e.g. English, Malayalam"
                  className="w-full p-3 rounded-xl border border-[#E4E6E1] bg-[#FAFBF9] text-xs font-medium outline-none"
                />
              </div>
            </>
          )}

          {section === "positioning" && (
            <>
              <div>
                <label className="block font-bold text-[#111211] mb-1">
                  Brand Personality
                </label>
                <input
                  type="text"
                  value={formData.brand_personality || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, brand_personality: e.target.value })
                  }
                  placeholder="e.g. minimal, aesthetic, warm, artisan"
                  className="w-full p-3 rounded-xl border border-[#E4E6E1] bg-[#FAFBF9] text-xs font-medium outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-[#111211] mb-1">
                  Primary Product Positioning Statement
                </label>
                <textarea
                  rows={3}
                  value={formData.product_positioning || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, product_positioning: e.target.value })
                  }
                  placeholder="How should this offering stand out from alternatives?"
                  className="w-full p-3 rounded-xl border border-[#E4E6E1] bg-[#FAFBF9] text-xs font-medium outline-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block font-bold text-[#111211] mb-1">
                  Desired Communication Tone
                </label>
                <input
                  type="text"
                  value={formData.desired_tone || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, desired_tone: e.target.value })
                  }
                  placeholder="e.g. friendly, refined, helpful"
                  className="w-full p-3 rounded-xl border border-[#E4E6E1] bg-[#FAFBF9] text-xs font-medium outline-none"
                />
              </div>
            </>
          )}

          {section === "channels" && (
            <div>
              <label className="block font-bold text-[#111211] mb-2">
                Supported Marketing Channels
              </label>
              <div className="space-y-2">
                {["instagram", "whatsapp", "local_search"].map((channel) => {
                  const isChecked = formData.preferred_channels?.includes(channel);
                  return (
                    <label
                      key={channel}
                      className="flex items-center space-x-2.5 p-3 rounded-xl border border-[#E4E6E1] bg-[#FAFBF9] cursor-pointer hover:bg-[#F5F5F2]"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          const current = formData.preferred_channels || [];
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              preferred_channels: [...current, channel],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              preferred_channels: current.filter((c) => c !== channel),
                            });
                          }
                        }}
                        className="rounded text-[#0C3D2D] focus:ring-[#70F0A6]"
                      />
                      <span className="font-semibold text-xs capitalize text-[#111211]">
                        {channel.replace("_", " ")}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {section === "constraints" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#111211] mb-1">
                    Approved Price Floor (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.approved_price_floor || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        approved_price_floor: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    placeholder="e.g. 850"
                    className="w-full p-3 rounded-xl border border-[#E4E6E1] bg-[#FAFBF9] text-xs font-medium outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#111211] mb-1">
                    Weekly Capacity Limit
                  </label>
                  <input
                    type="number"
                    value={formData.fulfilment_capacity || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        fulfilment_capacity: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    placeholder="e.g. 15 orders/week"
                    className="w-full p-3 rounded-xl border border-[#E4E6E1] bg-[#FAFBF9] text-xs font-medium outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#111211] mb-1">
                  Constraints & Claims to Avoid
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newConstraint}
                    onChange={(e) => setNewConstraint(e.target.value)}
                    placeholder="e.g. Do not recommend discounts without approval"
                    className="flex-1 p-2.5 rounded-xl border border-[#E4E6E1] bg-[#FAFBF9] text-xs font-medium outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newConstraint.trim()) {
                        setFormData({
                          ...formData,
                          constraints: [...(formData.constraints || []), newConstraint.trim()],
                        });
                        setNewConstraint("");
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-[#111211] text-white text-xs font-semibold"
                  >
                    Add
                  </button>
                </div>
                <ul className="space-y-1">
                  {(formData.constraints || []).map((c, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between p-2 rounded-lg bg-[#F5F5F2] text-[11px] text-[#111211]"
                    >
                      <span>• {c}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            constraints: (formData.constraints || []).filter((_, idx) => idx !== i),
                          })
                        }
                        className="text-[#DF3E3E] hover:underline text-[10px]"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>

        {/* Footer actions */}
        <div className="mt-6 pt-4 border-t border-[#F0F2EE] flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full text-xs font-semibold text-[#70736F] hover:bg-[#F5F5F2]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 rounded-full bg-[#0C3D2D] text-[#70F0A6] text-xs font-semibold hover:bg-[#14523E] flex items-center gap-1.5 transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
}
