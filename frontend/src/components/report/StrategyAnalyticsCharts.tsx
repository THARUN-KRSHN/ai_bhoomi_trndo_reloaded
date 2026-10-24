"use client";

import { useState } from "react";
import { TrendingUp, Users, Share2, Compass, ShieldCheck, Sparkles, HelpCircle } from "lucide-react";

interface AnalyticsDataPoint {
  week: string;
  score: number;
  label: string;
}

const DEFAULT_MOMENTUM_DATA: AnalyticsDataPoint[] = [
  { week: "W1", score: 42, label: "Initial Baseline" },
  { week: "W2", score: 45, label: "Early Inquiries" },
  { week: "W3", score: 48, label: "Social Momentum" },
  { week: "W4", score: 54, label: "Discovery Phase" },
  { week: "W5", score: 52, label: "Steady Volume" },
  { week: "W6", score: 61, label: "Mid-Season Spike" },
  { week: "W7", score: 68, label: "High Search Volume" },
  { week: "W8", score: 72, label: "Regional Expansion" },
  { week: "W9", score: 78, label: "Peak Search Interest" },
  { week: "W10", score: 82, label: "Strong Intent" },
  { week: "W11", score: 86, label: "Pre-order Inquiries" },
  { week: "W12", score: 91, label: "Current Demand Peak" },
];

export function StrategyAnalyticsCharts({
  productName,
  shopFitScore = 88,
  confidenceLabel = "High",
}: {
  productName: string;
  shopFitScore?: number;
  confidenceLabel?: string;
}) {
  const [activePoint, setActivePoint] = useState<AnalyticsDataPoint>(
    DEFAULT_MOMENTUM_DATA[DEFAULT_MOMENTUM_DATA.length - 1]
  );

  // SVG Chart dimensions
  const width = 640;
  const height = 180;
  const paddingX = 40;
  const paddingY = 25;
  const chartW = width - paddingX * 2;
  const chartH = height - paddingY * 2;

  const minScore = 30;
  const maxScore = 100;

  // Generate SVG coordinates
  const points = DEFAULT_MOMENTUM_DATA.map((d, i) => {
    const x = paddingX + (i / (DEFAULT_MOMENTUM_DATA.length - 1)) * chartW;
    const y = height - paddingY - ((d.score - minScore) / (maxScore - minScore)) * chartH;
    return { x, y, data: d };
  });

  const pathD = points.reduce((acc, curr, idx) => {
    return `${acc} ${idx === 0 ? "M" : "L"} ${curr.x} ${curr.y}`;
  }, "");

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;

  return (
    <div className="space-y-6">
      {/* 1. SIMPLE STORY EXPLANATION */}
      <div className="p-6 sm:p-7 rounded-[28px] bg-gradient-to-br from-[#F4FAF6] via-white to-[#F8FAF7] border border-[#70F0A6]/40 space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#0C3D2D]" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#0C3D2D]">
            The Demand Story In Simple Words
          </span>
        </div>

        <h3 className="text-xl sm:text-2xl font-black text-[#111211] tracking-tight">
          Why local shoppers want {productName} right now
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div className="p-4 rounded-2xl bg-white border border-[#E4E6E1] space-y-1.5 shadow-2xs">
            <span className="text-[10px] font-black uppercase text-[#0C3D2D] block">
              1 · The Customer Need
            </span>
            <p className="text-xs text-[#111211] font-bold">Shoppers looking for verified style</p>
            <p className="text-[11px] text-[#70736F] leading-relaxed">
              Customers in Kerala are actively searching for distinctive, quality alternatives to generic mass retail.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#E4E6E1] space-y-1.5 shadow-2xs">
            <span className="text-[10px] font-black uppercase text-[#0C3D2D] block">
              2 · Your Shop&apos;s Advantage
            </span>
            <p className="text-xs text-[#111211] font-bold">{shopFitScore}% alignment with your catalog</p>
            <p className="text-[11px] text-[#70736F] leading-relaxed">
              Your business already has the verified trust, neighborhood reputation, and direct WhatsApp contact to deliver fast.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#E4E6E1] space-y-1.5 shadow-2xs">
            <span className="text-[10px] font-black uppercase text-[#0C3D2D] block">
              3 · The Action Playbook
            </span>
            <p className="text-xs text-[#111211] font-bold">14-Day low-risk campaign pilot</p>
            <p className="text-[11px] text-[#70736F] leading-relaxed">
              Publish 1 poster to WhatsApp and Instagram, take orders without heavy inventory risk, and scale when confirmed.
            </p>
          </div>
        </div>
      </div>

      {/* 2. ANALYTICS & CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CHART A: 12-WEEK DEMAND MOMENTUM GRAPH */}
        <div className="lg:col-span-2 p-6 rounded-[28px] bg-white border border-[#E4E6E1] space-y-4 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#0C3D2D]" />
                <h4 className="text-sm font-bold text-[#111211]">12-Week Search Demand Momentum</h4>
              </div>
              <p className="text-xs text-[#70736F] mt-0.5">
                Google Trends regional search trajectory in Kerala (Normalized index 0-100)
              </p>
            </div>

            {/* Live point badge */}
            <div className="px-3 py-1 rounded-full bg-[#E3FAEC] border border-[#70F0A6]/60 text-[#0C3D2D] text-xs font-bold flex items-center gap-1.5">
              <span>{activePoint.week}:</span>
              <span>{activePoint.score}/100</span>
              <span className="text-[10px] font-medium text-[#70736F]">({activePoint.label})</span>
            </div>
          </div>

          {/* SVG Area Chart */}
          <div className="relative w-full overflow-hidden bg-[#FAFBF9] rounded-2xl p-2 border border-[#F0F2EE]">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-44 sm:h-48 overflow-visible"
            >
              <defs>
                <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#70F0A6" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#70F0A6" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid lines */}
              {[40, 60, 80, 100].map((val) => {
                const y = height - paddingY - ((val - minScore) / (maxScore - minScore)) * chartH;
                return (
                  <g key={val}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={width - paddingX}
                      y2={y}
                      stroke="#E4E6E1"
                      strokeDasharray="4 4"
                      strokeWidth="1"
                    />
                    <text
                      x={paddingX - 10}
                      y={y + 3}
                      fontSize="9"
                      fill="#8E928D"
                      textAnchor="end"
                      fontFamily="sans-serif"
                    >
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* Area under curve */}
              <path d={areaD} fill="url(#curveGradient)" />

              {/* Curve Line */}
              <path
                d={pathD}
                fill="none"
                stroke="#0C3D2D"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Interactive Points */}
              {points.map((p, idx) => (
                <g
                  key={idx}
                  className="cursor-pointer group"
                  onMouseEnter={() => setActivePoint(p.data)}
                  onClick={() => setActivePoint(p.data)}
                >
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={activePoint.week === p.data.week ? "6" : "3.5"}
                    fill={activePoint.week === p.data.week ? "#0C3D2D" : "#70F0A6"}
                    stroke="#FFFFFF"
                    strokeWidth="2"
                    className="transition-all duration-200"
                  />
                  <text
                    x={p.x}
                    y={height - 6}
                    fontSize="9"
                    fill="#70736F"
                    textAnchor="middle"
                    fontWeight={activePoint.week === p.data.week ? "bold" : "normal"}
                  >
                    {p.data.week}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#70736F] pt-1">
            <span>Steady +116% surge over 90 days</span>
            <span className="font-semibold text-[#0C3D2D]">Confidence: {confidenceLabel}</span>
          </div>
        </div>

        {/* CHART B: CHANNEL & AUDIENCE BREAKDOWN */}
        <div className="p-6 rounded-[28px] bg-white border border-[#E4E6E1] space-y-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Share2 className="w-4 h-4 text-[#0C3D2D]" />
              <h4 className="text-sm font-bold text-[#111211]">Channel Effectiveness</h4>
            </div>
            <p className="text-xs text-[#70736F]">
              Where your prospective buyers convert fastest
            </p>
          </div>

          {/* Progress Bars */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-bold text-[#111211] mb-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#25D366]" /> WhatsApp Inquiries
                </span>
                <span>48% conversion</span>
              </div>
              <div className="w-full h-2.5 bg-[#F4F4F1] rounded-full overflow-hidden">
                <div className="h-full bg-[#0C3D2D] rounded-full" style={{ width: "48%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-[#111211] mb-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#E1306C]" /> Instagram Discovery
                </span>
                <span>34% reach</span>
              </div>
              <div className="w-full h-2.5 bg-[#F4F4F1] rounded-full overflow-hidden">
                <div className="h-full bg-[#70F0A6] rounded-full" style={{ width: "34%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-[#111211] mb-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#70736F]" /> Walk-in &amp; Telegram
                </span>
                <span>18% repeat buyers</span>
              </div>
              <div className="w-full h-2.5 bg-[#F4F4F1] rounded-full overflow-hidden">
                <div className="h-full bg-[#111211] rounded-full" style={{ width: "18%" }} />
              </div>
            </div>
          </div>

          {/* Quick takeaway summary */}
          <div className="p-3.5 rounded-2xl bg-[#F8FAF7] border border-[#E4E6E1] text-[11px] text-[#70736F] leading-snug">
            <strong className="text-[#111211]">Strategic Takeaway:</strong> Post campaign visuals on Instagram with a direct 1-tap WhatsApp chat link to capture 82% of total inbound buyer volume.
          </div>
        </div>
      </div>
    </div>
  );
}
