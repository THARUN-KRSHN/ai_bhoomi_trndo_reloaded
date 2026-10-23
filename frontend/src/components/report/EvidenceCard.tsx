import { ExternalLink, Globe, MapPin, Calendar, AlertCircle } from "lucide-react";
import { SourceRegisterItem } from "@/lib/api/types";
import { formatDate } from "@/lib/utils";

interface EvidenceCardProps {
  source: SourceRegisterItem;
  className?: string;
}

export function EvidenceCard({ source, className = "" }: EvidenceCardProps) {
  const isYoutube = source.url.includes("youtube.com") || source.url.includes("youtu.be");

  return (
    <div
      className={`p-5 rounded-2xl bg-[#FFFFFF] border border-[#E4E6E1] hover:border-[#111211]/30 transition-all flex flex-col justify-between ${className}`}
    >
      <div>
        {/* Source metadata header */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#F5F5F2] text-[#111211] border border-[#E4E6E1]">
              {source.publisher || "Web Domain"}
            </span>

            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                source.geographic_scope === "local"
                  ? "bg-[#E1FBEA] text-[#0C3D2D]"
                  : source.geographic_scope === "regional"
                  ? "bg-[#EFF6FF] text-[#1E40AF]"
                  : "bg-[#F5F5F2] text-[#70736F]"
              }`}
            >
              <MapPin className="w-2.5 h-2.5" />
              <span className="capitalize">{source.geographic_scope} Scope</span>
            </span>
          </div>

          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            title="Inspect external source"
            className="text-[#70736F] hover:text-[#0C3D2D] p-1 rounded-lg hover:bg-[#F5F5F2] transition-colors flex items-center gap-1 text-[11px] font-medium"
          >
            <span>Visit</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Claim supported */}
        <div className="mb-3">
          <span className="text-[10px] uppercase tracking-wider text-[#70736F] font-bold block mb-1">
            Supporting Evidence Claim
          </span>
          <p className="text-xs font-medium text-[#111211] leading-relaxed">
            {source.supporting_claim}
          </p>
        </div>

        {/* Limitations if provided */}
        {source.limitations && source.limitations.length > 0 && (
          <div className="mt-2.5 p-2.5 rounded-xl bg-[#F9F9F8] border border-[#E4E6E1]/60 text-[11px] text-[#70736F]">
            <div className="flex items-center gap-1 font-semibold text-[#8E928D] mb-1">
              <AlertCircle className="w-3 h-3 text-[#EAA023]" />
              <span>Observed Scope Limitation</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-[10px]">
              {source.limitations.map((lim, i) => (
                <li key={i}>{lim}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Footer timestamps */}
      <div className="mt-4 pt-3 border-t border-[#F0F2EE] flex items-center justify-between text-[10px] text-[#8E928D]">
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          Published: {formatDate(source.published_at)}
        </span>
        <span>Retrieved: {formatDate(source.retrieved_at)}</span>
      </div>
    </div>
  );
}
