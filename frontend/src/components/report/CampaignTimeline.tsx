import { Clock, Share2, FileText, CheckCircle2, AlertCircle } from "lucide-react";

interface CampaignTimelineProps {
  steps: string[];
  formats: string[];
  cta: string;
  channels: Record<string, string>;
  className?: string;
}

export function CampaignTimeline({
  steps,
  formats,
  cta,
  channels,
  className = "",
}: CampaignTimelineProps) {
  const channelNames = Object.keys(channels);

  return (
    <div className={`space-y-4 ${className}`}>
      {steps.map((step, index) => {
        const stepNum = index + 1;
        const assignedChannel =
          channelNames[index % channelNames.length]?.replace("_", " ") || "Instagram & WhatsApp";
        const assignedFormat =
          formats[index % formats.length] || "Short video & direct menu link";

        return (
          <div
            key={index}
            className="p-6 rounded-3xl bg-[#FFFFFF] border border-[#E4E6E1] hover:border-[#111211]/30 transition-all flex flex-col md:flex-row md:items-start justify-between gap-6"
          >
            {/* Step Sequence badge and detail */}
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 rounded-2xl bg-[#0C3D2D] text-[#70F0A6] flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-xs">
                0{stepNum}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#E1FBEA] text-[#0C3D2D]">
                    Stage {stepNum} Action
                  </span>
                  <span className="text-[10px] font-semibold text-[#70736F] flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#A0A49F]" />
                    Test Window: Days {stepNum * 3 - 2}–{stepNum * 3 + 1}
                  </span>
                </div>

                <h4 className="text-base font-bold text-[#111211] mb-2 leading-snug">
                  {step}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mt-3">
                  <div className="p-3 rounded-xl bg-[#F5F5F2] border border-[#E4E6E1]/60">
                    <span className="text-[10px] uppercase tracking-wider text-[#70736F] font-bold block mb-1 flex items-center gap-1">
                      <Share2 className="w-3 h-3 text-[#0C3D2D]" />
                      Primary Touchpoint
                    </span>
                    <span className="font-semibold text-[#111211] capitalize">
                      {assignedChannel}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#F5F5F2] border border-[#E4E6E1]/60">
                    <span className="text-[10px] uppercase tracking-wider text-[#70736F] font-bold block mb-1 flex items-center gap-1">
                      <FileText className="w-3 h-3 text-[#0C3D2D]" />
                      Content Format
                    </span>
                    <span className="font-semibold text-[#111211]">
                      {assignedFormat}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Direct CTA & Guardrail Note */}
            <div className="md:w-64 flex-shrink-0 bg-[#FAFBF9] p-4 rounded-2xl border border-[#E4E6E1] flex flex-col justify-between text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#70736F] block mb-1.5">
                  Actionable Call To Action
                </span>
                <p className="text-[11px] font-medium text-[#0C3D2D] leading-snug italic mb-3">
                  &ldquo;{cta}&rdquo;
                </p>
              </div>

              <div className="pt-2 border-t border-[#E4E6E1] flex items-center gap-1 text-[10px] text-[#8E928D]">
                <AlertCircle className="w-3 h-3 text-[#EAA023]" />
                <span>Test window proposed; adjust per daily responses</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
