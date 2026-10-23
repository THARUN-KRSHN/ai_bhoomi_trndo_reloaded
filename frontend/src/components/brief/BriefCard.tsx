import { LucideIcon, Pencil } from "lucide-react";

interface BriefCardProps {
  title: string;
  categoryTag: string;
  icon: LucideIcon;
  summary: string;
  details?: string[];
  onEdit: () => void;
  className?: string;
}

export function BriefCard({
  title,
  categoryTag,
  icon: Icon,
  summary,
  details,
  onEdit,
  className = "",
}: BriefCardProps) {
  return (
    <div
      className={`rounded-3xl bg-[#FFFFFF] border border-[#E4E6E1] p-6 hover:border-[#111211]/30 transition-all duration-300 flex flex-col justify-between ${className}`}
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-[#F5F5F2] flex items-center justify-center text-[#111211]">
              <Icon className="w-4 h-4" />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#70736F]">
              {categoryTag}
            </span>
          </div>

          <button
            type="button"
            onClick={onEdit}
            className="w-7 h-7 rounded-full bg-[#F5F5F2] hover:bg-[#E4E6E1] flex items-center justify-center text-[#111211] transition-colors"
            title="Edit configuration"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        </div>

        <h3 className="text-base font-bold tracking-tight text-[#111211] mb-2">
          {title}
        </h3>

        <p className="text-xs text-[#70736F] leading-relaxed mb-4">
          {summary}
        </p>

        {details && details.length > 0 && (
          <div className="space-y-1.5 pt-3 border-t border-[#F0F2EE]">
            {details.map((item, idx) => (
              <div
                key={idx}
                className="text-[11px] text-[#111211] flex items-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#70F0A6]" />
                <span className="truncate">{item}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-5 pt-3 border-t border-[#F0F2EE]">
        <button
          type="button"
          onClick={onEdit}
          className="text-xs font-semibold text-[#0C3D2D] hover:underline flex items-center gap-1"
        >
          <span>Modify {title}</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
}
