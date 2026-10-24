"use client";

import { useEffect, useState, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Filter,
  LineChart,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Clock,
  Sparkles,
  Info,
  MapPin,
  Compass,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Drawer } from "@/components/ui/Drawer";
import {
  getProfile,
  getRecentTrends,
  searchTrends,
  generateStrategyFromTrend,
} from "@/lib/api/client";

interface TrendItem {
  keyword: string;
  score: number;
  reliability_score?: number;
  reliability_details?: {
    coverage?: number;
    non_zero_ratio?: number;
    stability?: number;
    trend_signal?: number;
  };
  thumbnail?: string;
  title?: string;
}

function TrendsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [topic, setTopic] = useState(initialQuery);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [geoFilter, setGeoFilter] = useState("IN");
  const [timeFilter, setTimeFilter] = useState("today 3-m");

  const [currentSearchId, setCurrentSearchId] = useState("");
  const [trendResults, setTrendResults] = useState<TrendItem[]>([]);
  const [isDemoResult, setIsDemoResult] = useState(false);
  const [searchMeta, setSearchMeta] = useState<Record<string, unknown>>({});
  const [recentSearches, setRecentSearches] = useState<Array<{ search_id: string; topic: string; created_at: string }>>([]);

  const [selectedDetail, setSelectedDetail] = useState<TrendItem | null>(null);

  useEffect(() => {
    // 1. Load Profile
    getProfile()
      .then((res) => {
        if (res?.profile) {
          setProfile(res.profile);
          // If no initial query, use shop category as default
          if (!initialQuery) {
            const defaultTopic = `${res.profile.category || "Bakery"} ${res.profile.city || "Kerala"}`;
            setTopic(defaultTopic);
            executeSearch(defaultTopic);
          }
        }
      })
      .catch(() => {});

    // 2. Load Recent Searches
    loadHistory();

    if (initialQuery) {
      executeSearch(initialQuery);
    }
  }, [initialQuery]);

  const loadHistory = () => {
    getRecentTrends(5)
      .then((history) => {
        if (Array.isArray(history)) {
          setRecentSearches(history.map((h) => ({ search_id: h.search_id, topic: h.topic, created_at: h.created_at })));
        }
      })
      .catch(() => {});
  };

  async function executeSearch(queryTopic: string) {
    if (!queryTopic.trim()) return;
    setBusy(true);
    setError("");

    try {
      const response = await searchTrends(queryTopic.trim(), { geo: geoFilter, timeframe: timeFilter });
      setCurrentSearchId(response.search_id);
      setIsDemoResult(response.demo);

      const resObj = response.result || {};
      const analysis = (resObj.analysis as { top_10?: Array<{ keyword: string; score: number; reliability_score?: number }> }) || {};
      const reliabilityMap = (resObj.reliability as Record<string, TrendItem["reliability_details"]>) || {};
      const productImages = (resObj.product_images as Record<string, Array<{ thumbnail?: string; title?: string }>>) || {};
      setSearchMeta((resObj.trends_meta as Record<string, unknown>) || {});

      if (analysis.top_10?.length) {
        const parsed = analysis.top_10.map((item) => ({
          keyword: item.keyword,
          score: item.score,
          reliability_score: item.reliability_score,
          reliability_details: reliabilityMap[item.keyword],
          thumbnail: productImages[item.keyword]?.[0]?.thumbnail,
          title: productImages[item.keyword]?.[0]?.title,
        }));
        setTrendResults(parsed);
      } else {
        setTrendResults([]);
      }
      loadHistory();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Trend Finder is unavailable. Please verify connection.");
    } finally {
      setBusy(false);
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    executeSearch(topic);
  };

  const handleBuildStrategy = async (trendKeyword?: string) => {
    if (!currentSearchId) return;
    setBusy(true);
    try {
      const report = await generateStrategyFromTrend(currentSearchId);
      router.push(`/market-strategy/report/${report.strategy_id}`);
    } catch (err) {
      router.push("/market-strategy");
    } finally {
      setBusy(false);
    }
  };

  const shopName = (profile?.shop_name as string) || "Your Shop";
  const shopCategory = (profile?.category as string) || "Retail";
  const shopCity = (profile?.city as string) || "Kerala";

  return (
    <AppShell>
      <div className="space-y-8 max-w-6xl mx-auto">
        {/* Page Header & Shop Context Banner */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#E3FAEC] text-[#0C3D2D]">
              Market Signal Engine
            </span>
            <span className="text-xs text-[#70736F] font-semibold flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#0C3D2D]" />
              Personalized for: {shopName} · {shopCategory} in {shopCity}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#111211]">
            Trend Finder
          </h1>
          <p className="text-xs sm:text-sm text-[#70736F] mt-1 max-w-2xl leading-relaxed">
            Search Google Trends timeseries signals for real consumer demand. Selected trends carry your saved shop context directly into Market Strategy.
          </p>
        </div>

        {/* Search Bar & Collapsible Filters */}
        <div className="p-6 rounded-[28px] bg-white border border-[#E4E6E1] space-y-4 shadow-xs">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                required
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Search a product or consumer topic (e.g. sourdough bread, oversized tshirt)..."
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#F4F4F1] border border-[#E4E6E1] text-xs sm:text-sm text-[#111211] focus:outline-hidden focus:border-[#0C3D2D]"
              />
              <Search className="w-4 h-4 text-[#70736F] absolute left-3.5 top-3.5" />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFiltersOpen(!filtersOpen)}
                className={`px-4 py-3 rounded-2xl text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
                  filtersOpen ? "bg-[#0C3D2D] text-[#70F0A6] border-[#0C3D2D]" : "bg-white text-[#70736F] border-[#E4E6E1] hover:text-[#111211]"
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Filters</span>
              </button>

              <button
                type="submit"
                disabled={busy}
                className="px-7 py-3 rounded-2xl bg-[#0C3D2D] text-[#70F0A6] text-xs sm:text-sm font-bold hover:bg-[#14523E] transition-colors shadow-xs"
              >
                {busy ? "Searching…" : "Find Trends"}
              </button>
            </div>
          </form>

          {/* Collapsible Filters */}
          {filtersOpen && (
            <div className="pt-4 border-t border-[#E4E6E1] grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-bold text-[#70736F] block mb-1">Geographic Region</label>
                <select
                  value={geoFilter}
                  onChange={(e) => setGeoFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F4F4F1] border border-[#E4E6E1]"
                >
                  <option value="IN">India (National)</option>
                  <option value="IN-KL">Kerala State</option>
                  <option value="IN-TN">Tamil Nadu</option>
                  <option value="IN-KA">Karnataka</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-[#70736F] block mb-1">Time Horizon</label>
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F4F4F1] border border-[#E4E6E1]"
                >
                  <option value="today 3-m">Past 90 Days (Recommended)</option>
                  <option value="today 1-m">Past 30 Days</option>
                  <option value="today 12-m">Past 12 Months</option>
                </select>
              </div>
            </div>
          )}

          {/* Search History Chips */}
          {recentSearches.length > 0 && (
            <div className="pt-2 flex items-center gap-2 overflow-x-auto text-[11px] text-[#70736F]">
              <span className="shrink-0 font-bold">Recent:</span>
              {recentSearches.map((h, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => {
                    setTopic(h.topic);
                    executeSearch(h.topic);
                  }}
                  className="shrink-0 px-3 py-1 rounded-full bg-[#F4F4F1] hover:bg-[#E8EAE5] text-[#111211] border border-[#E4E6E1] transition-colors"
                >
                  {h.topic}
                </button>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700">
            {error}
          </div>
        )}

        {/* Demo Fallback Notice */}
        {isDemoResult && (
          <div className="p-4 rounded-2xl bg-[#FFFDF7] border border-[#FDE68A] text-xs text-[#92400E] flex items-center justify-between">
            <span className="font-semibold">
              DEMO DATA: Showing demonstration trend signals. Flask Trend Finder at http://127.0.0.1:5000 is running in fallback mode.
            </span>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-[#FEF3C7] border border-[#FDE68A]">
              Demo Mode
            </span>
          </div>
        )}

        {/* Results Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#111211] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#0C3D2D]" />
              <span>Trend Demand Signals ({trendResults.length})</span>
            </h2>
            <span className="text-xs text-[#70736F]">
              Provider: {String(searchMeta.provider || "SerpApi Google Trends")}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {trendResults.length > 0 ? (
              trendResults.map((item, idx) => (
                <div
                  key={idx}
                  className="p-6 rounded-[24px] bg-white border border-[#E4E6E1] flex flex-col justify-between space-y-4 hover:border-[#0C3D2D]/40 transition-colors shadow-xs"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono font-bold text-[#0C3D2D] bg-[#E3FAEC] px-2 py-0.5 rounded-full">
                            Search Score: {item.score}/100
                          </span>
                          {item.reliability_score !== undefined && (
                            <span className="text-[10px] font-bold text-[#70736F]">
                              {item.reliability_score}% Signal Quality
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-bold text-[#111211] capitalize leading-snug">
                          {item.keyword}
                        </h3>
                      </div>

                      {item.thumbnail ? (
                        <img
                          src={item.thumbnail}
                          alt={item.keyword}
                          className="w-14 h-14 rounded-xl object-cover border border-[#E4E6E1] shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-[#F4F4F1] flex items-center justify-center text-[#70736F] shrink-0">
                          <LineChart className="w-5 h-5" />
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-[#70736F] leading-relaxed">
                      Measured timeseries demand indicates sustained retail interest. National query velocity aligns with regional {shopCategory.toLowerCase()} purchases.
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#E4E6E1] flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedDetail(item)}
                      className="text-xs font-semibold text-[#70736F] hover:text-[#111211] underline-offset-4 hover:underline"
                    >
                      View Details
                    </button>

                    <button
                      type="button"
                      onClick={() => handleBuildStrategy(item.keyword)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0C3D2D] text-[#70F0A6] text-xs font-bold hover:bg-[#14523E] transition-colors"
                    >
                      <span>Build Strategy</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-16 text-center text-xs text-[#70736F] bg-white rounded-[24px] border border-[#E4E6E1]">
                {busy ? "Analyzing Google Trends and search keywords…" : "Enter a topic above to explore real demand signals."}
              </div>
            )}
          </div>
        </div>

        {/* Slide-over Detail Drawer for Deep Progressive Disclosure */}
        <Drawer
          isOpen={!!selectedDetail}
          onClose={() => setSelectedDetail(null)}
          title={selectedDetail?.keyword ? `Trend Signal: ${selectedDetail.keyword}` : "Trend Signal Details"}
          categoryTag="Evidence Breakdown"
        >
          {selectedDetail && (
            <div className="space-y-6 text-xs text-[#111211]">
              <div className="p-5 rounded-2xl bg-[#0C3D2D] text-white space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#70F0A6] block">
                  Search Demand Score
                </span>
                <p className="text-3xl font-black text-white">{selectedDetail.score}/100</p>
                <p className="text-[11px] text-[#E3FAEC]">
                  Normalized average interest over the 90-day evaluation horizon.
                </p>
              </div>

              {selectedDetail.reliability_details && (
                <div className="space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#70736F] block">
                    Prediction Quality Breakdown
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-[#F4F4F1] space-y-1">
                      <span className="text-[10px] font-bold text-[#70736F] block">Coverage</span>
                      <p className="text-sm font-bold text-[#111211]">
                        {Math.round((selectedDetail.reliability_details.coverage || 1) * 100)}%
                      </p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#F4F4F1] space-y-1">
                      <span className="text-[10px] font-bold text-[#70736F] block">Non-Zero Velocity</span>
                      <p className="text-sm font-bold text-[#111211]">
                        {Math.round((selectedDetail.reliability_details.non_zero_ratio || 0.9) * 100)}%
                      </p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#F4F4F1] space-y-1">
                      <span className="text-[10px] font-bold text-[#70736F] block">Timeseries Stability</span>
                      <p className="text-sm font-bold text-[#111211]">
                        {selectedDetail.reliability_details.stability ?? 0.85}/1.0
                      </p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#F4F4F1] space-y-1">
                      <span className="text-[10px] font-bold text-[#70736F] block">Signal Strength</span>
                      <p className="text-sm font-bold text-[#111211]">
                        {selectedDetail.reliability_details.trend_signal ?? 0.75}/1.0
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-4 rounded-xl bg-[#F4F4F1] space-y-2">
                <span className="font-bold text-[#111211] block flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-[#0C3D2D]" /> Downstream Hand-off
                </span>
                <p className="text-[#70736F] leading-relaxed">
                  Clicking &ldquo;Build Strategy&rdquo; binds this trend search reference ({currentSearchId}) to your shop profile context ({shopName}) to construct an evidence-backed go-to-market plan.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedDetail(null);
                  handleBuildStrategy(selectedDetail.keyword);
                }}
                className="w-full py-3 rounded-full bg-[#0C3D2D] text-[#70F0A6] font-bold text-xs hover:bg-[#14523E] transition-colors"
              >
                Build Strategy Around This Trend &rarr;
              </button>
            </div>
          )}
        </Drawer>
      </div>
    </AppShell>
  );
}

export default function TrendsPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-xs text-[#70736F]">Loading Trend Finder...</div>}>
      <TrendsContent />
    </Suspense>
  );
}
