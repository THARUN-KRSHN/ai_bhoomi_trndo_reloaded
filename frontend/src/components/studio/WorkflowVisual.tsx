import { Sparkles, ArrowDown } from "lucide-react";

export function WorkflowVisual() {
  return (
    <div className="w-full h-full min-h-[320px] rounded-[28px] bg-[#111211] text-[#FFFFFF] p-7 sm:p-8 border border-[#222522] overflow-hidden flex flex-col justify-between relative shadow-xl">
      {/* Editorial Decorative glow */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-[#0C3D2D]/30 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#70F0A6] animate-pulse" />
          <span className="text-[11px] uppercase tracking-wider text-[#70F0A6] font-bold">
            TRNDO Engine
          </span>
        </div>

        {/* Circular indicator inspired by Reference A */}
        <div className="w-8 h-8 rounded-full bg-[#0C3D2D] border border-[#70F0A6]/40 flex items-center justify-center text-[#70F0A6]">
          <ArrowDown className="w-4 h-4" />
        </div>
      </div>

      {/* Center abstract vertical graphic inspired by Reference A/C */}
      <div className="relative z-10 my-4 flex items-center justify-center gap-3">
        {/* Panel 1 */}
        <div className="w-16 h-36 rounded-2xl bg-gradient-to-b from-[#2A2F2A] to-[#161816] border border-[#3A403A]/40 flex flex-col justify-end p-2.5">
          <span className="text-[9px] font-mono text-[#70F0A6] font-bold">01</span>
          <span className="text-[10px] text-[#A0A49F] font-medium leading-none mt-1">Signals</span>
        </div>

        {/* Panel 2 (Highlighted with subtle gradient) */}
        <div className="w-20 h-44 rounded-2xl bg-gradient-to-b from-[#0C3D2D] via-[#14523E] to-[#0A261C] border border-[#70F0A6]/40 flex flex-col justify-end p-3 shadow-lg">
          <div className="w-2 h-2 rounded-full bg-[#70F0A6] mb-auto" />
          <span className="text-[10px] font-mono text-[#70F0A6] font-bold">02</span>
          <span className="text-xs text-white font-bold leading-none mt-1">Evaluate</span>
        </div>

        {/* Panel 3 */}
        <div className="w-16 h-36 rounded-2xl bg-gradient-to-b from-[#2A2F2A] to-[#161816] border border-[#3A403A]/40 flex flex-col justify-end p-2.5">
          <span className="text-[9px] font-mono text-[#70F0A6] font-bold">03</span>
          <span className="text-[10px] text-[#A0A49F] font-medium leading-none mt-1">Strategy</span>
        </div>
      </div>

      {/* Bottom Summary Pill */}
      <div className="relative z-10 p-3.5 rounded-2xl bg-[#181B18] border border-[#262A26] flex items-center justify-between">
        <span className="text-xs text-[#D1D5CE] font-medium">
          Research → Score → Execute
        </span>
        <span className="text-[10px] text-[#70F0A6] font-semibold bg-[#0C3D2D] px-2 py-0.5 rounded-full">
          Grounded
        </span>
      </div>
    </div>
  );
}
