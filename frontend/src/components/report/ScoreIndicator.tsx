import { Info } from "lucide-react";

interface ScoreIndicatorProps {
  label: string;
  score: number | null | undefined;
  explanation?: string;
  isPriority?: boolean;
  scoreVersion?: string;
}

export function ScoreIndicator({
  label,
  score,
  explanation,
  isPriority = false,
  scoreVersion,
}: ScoreIndicatorProps) {
  const isAvailable = score !== null && score !== undefined && !isNaN(score);
  const normalizedScore = isAvailable ? Math.min(Math.max(score, 0), 100) : 0;

  return (
    <div
      className={`p-4 rounded-2xl border transition-all ${
        isPriority
          ? "bg-[#111211] text-[#FFFFFF] border-[#111211]"
          : "bg-[#FFFFFF] text-[#111211] border-[#E4E6E1]"
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span
          className={`text-xs uppercase tracking-wider font-semibold ${
            isPriority ? "text-[#70F0A6]" : "text-[#70736F]"
          }`}
        >
          {label}
        </span>
        {scoreVersion && (
          <span
            className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
              isPriority
                ? "bg-[#1E231E] text-[#A0A49F]"
                : "bg-[#F5F5F2] text-[#70736F]"
            }`}
          >
            {scoreVersion}
          </span>
        )}
      </div>

      <div className="flex items-baseline justify-between mb-2">
        <div className="flex items-baseline gap-1">
          {isAvailable ? (
            <>
              <span className="text-2xl font-bold tracking-tight">
                {Math.round(score)}
              </span>
              <span
                className={`text-xs ${
                  isPriority ? "text-[#A0A49F]" : "text-[#70736F]"
                }`}
              >
                / 100
              </span>
            </>
          ) : (
            <span
              className={`text-sm font-semibold italic ${
                isPriority ? "text-[#A0A49F]" : "text-[#70736F]"
              }`}
            >
              Insufficient data
            </span>
          )}
        </div>

        {isPriority && (
          <span className="text-[10px] text-[#A0A49F] font-medium tracking-tight">
            Heuristic Score (Not a probability)
          </span>
        )}
      </div>

      {/* Score Progress Bar */}
      <div
        className={`w-full h-2 rounded-full overflow-hidden ${
          isPriority ? "bg-[#232723]" : "bg-[#F0F2EE]"
        }`}
      >
        {isAvailable ? (
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${
              isPriority
                ? "bg-[#70F0A6]"
                : normalizedScore >= 75
                ? "bg-[#0C3D2D]"
                : normalizedScore >= 55
                ? "bg-[#2D6A4F]"
                : "bg-[#70736F]"
            }`}
            style={{ width: `${normalizedScore}%` }}
          />
        ) : (
          <div className="h-full w-full bg-repeating-linear-stripes opacity-40" />
        )}
      </div>

      {explanation && (
        <div className="mt-2.5 flex items-start gap-1.5 text-[11px] leading-tight text-[#70736F]">
          <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-[#A0A49F]" />
          <span>{explanation}</span>
        </div>
      )}
    </div>
  );
}
