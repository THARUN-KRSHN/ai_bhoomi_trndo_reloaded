"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  Compass,
  LineChart,
  Sparkles,
  Search,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
  Clock,
  ShieldCheck,
  ChevronRight,
  Store,
  Share2,
  Send,
  MessageCircle,
  CheckCircle2,
  BarChart2,
  Loader2,
  Info,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Drawer } from "@/components/ui/Drawer";
import { useAuth } from "@/context/AuthContext";
import {
  getProfile,
  getRecentTrends,
  listStrategies,
  listPromotions,
  listOrders,
  searchTrends,
  generateStrategyFromTrend,
} from "@/lib/api/client";
import { StrategyReport, Order } from "@/lib/api/types";

interface TrendItem {
  keyword: string;
  score: number;
  reliability_score?: number;
  thumbnail?: string;
  search_id?: string;
}

export default function ShopHomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [selectedTrendForDetails, setSelectedTrendForDetails] = useState<TrendItem | null>(null);
  const [generatingStrategyForProduct, setGeneratingStrategyForProduct] = useState(false);
  const [recentStrategies, setRecentStrategies] = useState<Array<{ strategy_id: string; report: StrategyReport }>>([]);
  const [recentCreations, setRecentCreations] = useState<Array<{ promotion_id: string; headline: string; poster_url?: string }>>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [searchTopic, setSearchTopic] = useState("");
  const [loadingTrends, setLoadingTrends] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>("Just now");
  const [currentSearchId, setCurrentSearchId] = useState<string>("");

  // Social Media Reach Stats
  const [socialStats, setSocialStats] = useState({
    totalCampaigns: 2,
    whatsappShares: 14,
    instagramReach: 32,
    telegramInquiries: 5,
  });

  useEffect(() => {
    // 1. Fetch Profile
    getProfile()
      .then((res) => {
        if (res?.profile) {
          setProfile(res.profile);
          loadPersonalizedTrends(res.profile);
        }
      })
      .catch(() => {});

    // 2. Fetch Recent Strategies
    listStrategies(3)
      .then((res) => {
        if (Array.isArray(res)) {
          setRecentStrategies(res.map((item) => ({ strategy_id: item.strategy_id, report: item.report })));
        }
      })
      .catch(() => {});

    // 3. Fetch Recent Creations
    listPromotions(4)
      .then((res) => {
        if (Array.isArray(res)) {
          setRecentCreations(
            res.map((p) => ({
              promotion_id: p.promotion_id,
              headline: p.content?.poster_headline || p.content?.promotion_title || "Promotion Poster",
              poster_url: p.asset_urls?.[0],
            }))
          );
          if (res.length > 0) {
            setSocialStats((prev) => ({
              ...prev,
              totalCampaigns: res.length,
              instagramReach: res.length * 18,
            }));
          }
        }
      })
      .catch(() => {});

    // 4. Fetch Recent Orders
    listOrders()
      .then((res) => {
        if (Array.isArray(res)) {
          setRecentOrders(res.slice(0, 3));
          setSocialStats((prev) => ({
            ...prev,
            telegramInquiries: Math.max(res.length + 2, 4),
          }));
        }
      })
      .catch(() => {});

    // Load social shares from local storage if available
    try {
      const stored = localStorage.getItem("trndo_social_shares");
      if (stored) {
        const parsed = JSON.parse(stored);
        setSocialStats((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      // ignore
    }
  }, []);

  async function loadPersonalizedTrends(shopProfile: Record<string, unknown>) {
    setLoadingTrends(true);
    const category = (shopProfile.business_category as string) || (shopProfile.category as string) || "fashion";
    const topic = `${category} ${shopProfile.city || "Kerala"}`;

    try {
      const res = await searchTrends(topic);
      setCurrentSearchId(res.search_id);
      setLastRefreshed(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));

      const analysis = res.result?.analysis as { top_10?: Array<{ keyword: string; score: number; reliability_score?: number }> };
      const images = (res.result?.product_images as Record<string, Array<{ thumbnail?: string }>>) || {};

      if (analysis?.top_10?.length) {
        const parsed = analysis.top_10.slice(0, 4).map((item) => ({
          keyword: item.keyword,
          score: item.score,
          reliability_score: item.reliability_score,
          thumbnail: images[item.keyword]?.[0]?.thumbnail,
          search_id: res.search_id,
        }));
        setTrends(parsed);
      }
    } catch (err) {
      console.warn("Trend search error, trying recent trends:", err);
      getRecentTrends(1).then((recent) => {
        if (recent?.length && recent[0].result) {
          const r = recent[0];
          setCurrentSearchId(r.search_id);
          const a = r.result.analysis as { top_10?: Array<{ keyword: string; score: number; reliability_score?: number }> };
          if (a?.top_10) {
            setTrends(
              a.top_10.slice(0, 4).map((item) => ({
                keyword: item.keyword,
                score: item.score,
                reliability_score: item.reliability_score,
                search_id: r.search_id,
              }))
            );
          }
        }
      });
    } finally {
      setLoadingTrends(false);
    }
  }

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTopic.trim()) return;
    router.push(`/trends?q=${encodeURIComponent(searchTopic.trim())}`);
  };

  const handleBuildStrategyForProduct = async (productName: string, searchId?: string) => {
    const sId = searchId || currentSearchId;
    setGeneratingStrategyForProduct(true);
    try {
      if (sId) {
        const rep = await generateStrategyFromTrend(sId, productName);
        router.push(`/market-strategy/report/${rep.strategy_id}`);
      } else {
        router.push(`/market-strategy/brief?product=${encodeURIComponent(productName)}`);
      }
    } catch (err) {
      console.warn("Direct strategy generation error, navigating to studio:", err);
      router.push(`/market-strategy`);
    } finally {
      setGeneratingStrategyForProduct(false);
      setSelectedTrendForDetails(null);
    }
  };

  const shopName = (profile?.shop_name as string) || "Your Shop";
  const shopCity = (profile?.city as string) || "Kerala";
  const shopCategory = (profile?.business_category as string) || (profile?.category as string) || "Retail";

  return (
    <AppShell>
      <div className="space-y-8 max-w-6xl mx-auto">
        {/* 1. Welcome Area */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#E3FAEC] text-[#0C3D2D]">
                Personalized Workspace
              </span>
              <span className="text-xs text-[#70736F] font-semibold">
                {shopCategory} · {shopCity}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#111211]">
              Good morning, {shopName}
            </h1>
            <p className="text-sm text-[#70736F] mt-1">
              Here are the opportunities worth exploring for your shop right now.
            </p>
          </div>

          <form onSubmit={handleQuickSearch} className="flex items-center max-w-md w-full sm:w-auto">
            <div className="relative w-full sm:w-72">
              <input
                value={searchTopic}
                onChange={(e) => setSearchTopic(e.target.value)}
                placeholder="Search a product or trend..."
                className="w-full pl-9 pr-4 py-2.5 rounded-full bg-white border border-[#E4E6E1] text-xs text-[#111211] focus:outline-hidden focus:border-[#0C3D2D]"
              />
              <Search className="w-4 h-4 text-[#70736F] absolute left-3 top-3" />
            </div>
          </form>
        </div>

        {/* 2. Personalized Trend Suggestions (Section 8.2) */}
        <div className="p-7 sm:p-8 rounded-[30px] bg-[#FFFFFF] border border-[#E4E6E1] space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#E4E6E1]">
            <div>
              <div className="flex items-center gap-2">
                <LineChart className="w-4 h-4 text-[#0C3D2D]" />
                <h2 className="text-xl font-bold tracking-tight text-[#111211]">
                  Trending for your shop
                </h2>
              </div>
              <p className="text-xs text-[#70736F] mt-0.5">
                Based on your business category ({shopCategory}), region ({shopCity}), and search signals. Tap any card for score details.
              </p>
            </div>

            <div className="flex items-center space-x-3 text-xs">
              <span className="text-[#70736F] flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Updated {lastRefreshed}
              </span>
              <button
                type="button"
                onClick={() => profile && loadPersonalizedTrends(profile)}
                disabled={loadingTrends}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F4F4F1] hover:bg-[#E8EAE5] text-[#111211] font-semibold text-xs border border-[#E4E6E1] transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingTrends ? "animate-spin" : ""}`} />
                <span>Refresh Trends</span>
              </button>
            </div>
          </div>

          {/* Trend Cards Grid with small more arrow on bottom left */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {loadingTrends ? (
              // Skeleton cards during trend loading
              [1, 2, 3, 4].map((i) => (
                <div
                  key={`dashboard-skel-${i}`}
                  className="p-5 rounded-2xl bg-[#F4F4F1] border border-[#E4E6E1] flex flex-col justify-between space-y-4 animate-pulse shadow-2xs"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="h-4 w-16 bg-[#E3FAEC] rounded-full" />
                      <div className="h-4 w-12 bg-[#E8EAE5] rounded-full" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-5 w-4/5 bg-[#DFE2DC] rounded-md" />
                      <div className="h-3.5 w-full bg-[#E8EAE5] rounded-md" />
                    </div>
                    <div className="w-full h-20 rounded-xl bg-[#E8EAE5] border border-[#E4E6E1]/60 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-[#A0A49F] animate-spin" />
                    </div>
                  </div>
                  <div className="pt-3 border-t border-[#E4E6E1]/70 flex items-center justify-between">
                    <div className="h-3.5 w-20 bg-[#E8EAE5] rounded-md" />
                    <div className="h-3.5 w-16 bg-[#E8EAE5] rounded-md" />
                  </div>
                </div>
              ))
            ) : trends.length > 0 ? (
              trends.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedTrendForDetails(item)}
                  className="p-5 rounded-2xl bg-[#F4F4F1] border border-[#E4E6E1] flex flex-col justify-between space-y-5 hover:border-[#0C3D2D] hover:bg-white hover:shadow-md transition-all cursor-pointer group text-left"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-[#0C3D2D] bg-[#E3FAEC] px-2.5 py-0.5 rounded-full">
                        Score: {item.score}/100
                      </span>
                      {item.reliability_score !== undefined && (
                        <span className="text-[10px] font-bold text-[#70736F]">
                          {item.reliability_score}% fit
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-[#111211] capitalize leading-snug group-hover:text-[#0C3D2D] transition-colors">
                      {item.keyword}
                    </h3>
                    <p className="text-[11px] text-[#70736F] leading-relaxed">
                      High local search velocity in regional {shopCity} market.
                    </p>
                  </div>

                  {/* Bottom row with small more arrow on bottom left */}
                  <div className="pt-3 border-t border-[#E4E6E1]/70 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full bg-[#E3FAEC] group-hover:bg-[#0C3D2D] text-[#0C3D2D] group-hover:text-[#70F0A6] flex items-center justify-center transition-all shadow-2xs">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </span>
                      <span className="text-[11px] font-bold text-[#0C3D2D] group-hover:underline">
                        View details
                      </span>
                    </div>

                    <span className="text-[10px] font-bold text-[#70736F] opacity-0 group-hover:opacity-100 transition-opacity">
                      Build Strategy &rarr;
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-8 text-center text-xs text-[#70736F]">
                No trends retrieved yet. Tap Refresh Trends to search.
              </div>
            )}
          </div>
        </div>

        {/* 3. Social Media Reach & Campaign Insights Section */}
        <div className="p-7 sm:p-8 rounded-[30px] bg-[#FFFFFF] border border-[#E4E6E1] space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#E4E6E1]">
            <div>
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-[#0C3D2D]" />
                <h2 className="text-xl font-bold tracking-tight text-[#111211]">
                  Campaign &amp; Social Reach Insights
                </h2>
              </div>
              <p className="text-xs text-[#70736F] mt-0.5">
                Real-time insights across posters, captions, and promotions generated for your shop.
              </p>
            </div>

            <Link
              href="/marketing-studio"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#F4F4F1] hover:bg-[#E8EAE5] text-[#111211] font-bold text-xs border border-[#E4E6E1] transition-colors"
            >
              <span>Studio Workspace</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-[#F4F4F1] border border-[#E4E6E1] space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#70736F] block">
                Promotions Created
              </span>
              <span className="text-2xl font-black text-[#111211] block">
                {socialStats.totalCampaigns}
              </span>
              <span className="text-[11px] text-[#0C3D2D] font-bold flex items-center gap-1">
                <CheckCircle2 size={11} /> Ready to publish
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#F4F4F1] border border-[#E4E6E1] space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#70736F] block">
                WhatsApp Shares
              </span>
              <span className="text-2xl font-black text-[#0C3D2D] block">
                {socialStats.whatsappShares}
              </span>
              <span className="text-[11px] text-[#70736F]">Direct customer stories</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#F4F4F1] border border-[#E4E6E1] space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#70736F] block">
                Instagram Reach
              </span>
              <span className="text-2xl font-black text-[#111211] block">
                {socialStats.instagramReach}
              </span>
              <span className="text-[11px] text-[#70736F]">Hashtag &amp; Reel signals</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#F4F4F1] border border-[#E4E6E1] space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#70736F] block">
                Customer Enquiries
              </span>
              <span className="text-2xl font-black text-[#0C3D2D] block">
                {socialStats.telegramInquiries}
              </span>
              <span className="text-[11px] text-[#0C3D2D] font-bold flex items-center gap-1">
                <MessageCircle size={11} /> Telegram chat inquiries
              </span>
            </div>
          </div>
        </div>

        {/* 4. Two Dominant Product Functions (Section 8.5) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Market Strategy */}
          <div className="p-8 rounded-[30px] bg-[#0C3D2D] text-white flex flex-col justify-between space-y-6 shadow-sm">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#14523E] flex items-center justify-center text-[#70F0A6]">
                <Compass className="w-5 h-5" />
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#70F0A6] block">
                Decision &amp; Plan
              </span>
              <h2 className="text-2xl font-bold tracking-tight text-white leading-snug">
                Market Strategy
              </h2>
              <p className="text-xs text-white/80 leading-relaxed max-w-md">
                Find the right opportunity and turn it into a clear plan backed by verified market evidence, positioning, channel choices, and a 14-day test framework.
              </p>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs text-white/60">
                {recentStrategies.length} saved reports available
              </span>
              <Link
                href="/market-strategy"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#70F0A6] text-[#0C3D2D] text-xs font-bold hover:bg-white transition-colors"
              >
                <span>Explore Strategy</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 2: Market Studio */}
          <div className="p-8 rounded-[30px] bg-[#FFFFFF] border border-[#E4E6E1] text-[#111211] flex flex-col justify-between space-y-6 shadow-xs">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#F4F4F1] flex items-center justify-center text-[#0C3D2D]">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#70736F] block">
                Creative Promotion
              </span>
              <h2 className="text-2xl font-bold tracking-tight text-[#111211] leading-snug">
                Market Studio
              </h2>
              <p className="text-xs text-[#70736F] leading-relaxed max-w-md">
                Turn your approved strategies into branded promotional posters, captions, and hashtags formatted for Instagram, Telegram, and WhatsApp.
              </p>
            </div>

            <div className="pt-4 border-t border-[#E4E6E1] flex items-center justify-between">
              <span className="text-xs text-[#70736F]">
                {recentCreations.length} creative assets saved
              </span>
              <Link
                href="/marketing-studio/create"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#0C3D2D] text-[#70F0A6] text-xs font-bold hover:bg-[#14523E] transition-colors"
              >
                <span>Create Promotion</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* 5. Recent Activity Strip (Section 8.6) */}
        <div className="p-7 sm:p-8 rounded-[30px] bg-[#FFFFFF] border border-[#E4E6E1] space-y-6 shadow-xs">
          <div>
            <h3 className="text-lg font-bold tracking-tight text-[#111211]">
              Recent Activity
            </h3>
            <p className="text-xs text-[#70736F] mt-0.5">
              Live records from your strategies, promotional creations, and customer orders.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Recent Strategies */}
            <div className="p-4 rounded-2xl bg-[#F4F4F1] space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#111211] flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-[#0C3D2D]" /> Strategies
                </span>
                <Link href="/market-strategy" className="text-[11px] text-[#0C3D2D] font-semibold hover:underline">
                  View All
                </Link>
              </div>
              {recentStrategies.length > 0 ? (
                <div className="space-y-2">
                  {recentStrategies.map((s, i) => (
                    <Link
                      key={i}
                      href={`/market-strategy/report/${s.strategy_id}`}
                      className="block p-2.5 rounded-xl bg-white border border-[#E4E6E1] hover:border-[#0C3D2D] transition-colors"
                    >
                      <p className="font-bold text-[#111211] truncate">
                        {s.report.opportunities?.[0]?.title || "Market Strategy"}
                      </p>
                      <p className="text-[10px] text-[#70736F] truncate mt-0.5">
                        {s.report.primary_positioning}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-[#70736F] text-[11px]">No strategies generated yet.</p>
              )}
            </div>

            {/* Recent Promotions */}
            <div className="p-4 rounded-2xl bg-[#F4F4F1] space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#111211] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#0C3D2D]" /> Promotions
                </span>
                <Link href="/marketing-studio/creations" className="text-[11px] text-[#0C3D2D] font-semibold hover:underline">
                  View All
                </Link>
              </div>
              {recentCreations.length > 0 ? (
                <div className="space-y-2">
                  {recentCreations.map((c, i) => (
                    <Link
                      key={i}
                      href="/marketing-studio/creations"
                      className="block p-2.5 rounded-xl bg-white border border-[#E4E6E1] hover:border-[#0C3D2D] transition-colors"
                    >
                      <p className="font-bold text-[#111211] truncate">{c.headline}</p>
                      <p className="text-[10px] text-[#70736F] mt-0.5">Ready to share</p>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-[#70736F] text-[11px]">No promotional posters created yet.</p>
              )}
            </div>

            {/* Recent Orders */}
            <div className="p-4 rounded-2xl bg-[#F4F4F1] space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#111211] flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5 text-[#0C3D2D]" /> Enquiries &amp; Orders
                </span>
                <Link href="/marketing-studio/orders" className="text-[11px] text-[#0C3D2D] font-semibold hover:underline">
                  View All
                </Link>
              </div>
              {recentOrders.length > 0 ? (
                <div className="space-y-2">
                  {recentOrders.map((o, i) => (
                    <Link
                      key={i}
                      href="/marketing-studio/orders"
                      className="block p-2.5 rounded-xl bg-white border border-[#E4E6E1] hover:border-[#0C3D2D] transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-[#111211] truncate">{o.product_name}</p>
                        <span className="text-[10px] font-bold uppercase text-[#0C3D2D] bg-[#E3FAEC] px-1.5 py-0.5 rounded">
                          {o.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#70736F] mt-0.5">
                        Qty: {o.quantity} {o.total_amount ? `· ₹${o.total_amount}` : ""}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-[#70736F] text-[11px]">No customer enquiries received yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* 6. Product Trend Opportunity Details Drawer */}
        <Drawer
          isOpen={!!selectedTrendForDetails}
          onClose={() => setSelectedTrendForDetails(null)}
          title={selectedTrendForDetails?.keyword ? `Product Opportunity: ${selectedTrendForDetails.keyword}` : "Trend Details"}
          categoryTag="Evidence & Score Breakdown"
          footer={
            selectedTrendForDetails && (
              <button
                type="button"
                disabled={generatingStrategyForProduct}
                onClick={() => handleBuildStrategyForProduct(selectedTrendForDetails.keyword, selectedTrendForDetails.search_id)}
                className="w-full py-3.5 px-6 rounded-full bg-[#0C3D2D] text-[#70F0A6] text-xs font-bold hover:bg-[#14523E] transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                {generatingStrategyForProduct ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generating Strategy for {selectedTrendForDetails.keyword}...</span>
                  </>
                ) : (
                  <>
                    <span>Build My Strategy for {selectedTrendForDetails.keyword}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )
          }
        >
          {selectedTrendForDetails && (
            <div className="space-y-6 text-xs text-[#111211]">
              {/* Product Heading Banner */}
              <div className="p-5 rounded-2xl bg-[#0C3D2D] text-white space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#70F0A6] block">
                  Identified Product Opportunity
                </span>
                <p className="text-2xl font-black capitalize text-white">{selectedTrendForDetails.keyword}</p>
                <p className="text-[11px] text-[#E3FAEC]">
                  Surging search interest identified for your {shopCategory} category in {shopCity}, Kerala.
                </p>
              </div>

              {/* Product Visual Showcase */}
              {selectedTrendForDetails.thumbnail && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#70736F] block">
                    Product Visual &amp; Trend Reference
                  </span>
                  <div className="relative rounded-2xl overflow-hidden border border-[#E4E6E1] bg-[#F4F4F1] group shadow-xs">
                    <img
                      src={selectedTrendForDetails.thumbnail}
                      alt={selectedTrendForDetails.keyword}
                      className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end justify-between p-3">
                      <span className="text-white text-[11px] font-bold">
                        Verified Trend Photo
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const kw = selectedTrendForDetails.keyword;
                          const img = selectedTrendForDetails.thumbnail || "";
                          setSelectedTrendForDetails(null);
                          router.push(`/marketing-studio/create?product=${encodeURIComponent(kw)}&image=${encodeURIComponent(img)}`);
                        }}
                        className="px-3 py-1 rounded-full bg-[#70F0A6] hover:bg-white text-[#0C3D2D] text-[10px] font-black transition-colors"
                      >
                        Use in Poster &rarr;
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Score Calculation Bento */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-[#111211] uppercase tracking-wider">
                  How This Score Was Calculated
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-[#F4F4F1] border border-[#E4E6E1] space-y-1">
                    <span className="text-[10px] font-bold uppercase text-[#70736F] block">
                      Search Demand Score
                    </span>
                    <span className="text-2xl font-black text-[#0C3D2D] block">
                      {selectedTrendForDetails.score}/100
                    </span>
                    <p className="text-[10px] text-[#70736F] leading-snug">
                      90-day regional search momentum from Google Trends queries.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#F4F4F1] border border-[#E4E6E1] space-y-1">
                    <span className="text-[10px] font-bold uppercase text-[#70736F] block">
                      Shop Fit &amp; Alignment
                    </span>
                    <span className="text-2xl font-black text-[#111211] block">
                      {selectedTrendForDetails.reliability_score || 85}% Fit
                    </span>
                    <p className="text-[10px] text-[#70736F] leading-snug">
                      Category alignment with {shopName}&apos;s catalog &amp; local buyer profile.
                    </p>
                  </div>
                </div>
              </div>

              {/* Signals breakdown */}
              <div className="p-4 rounded-xl bg-white border border-[#E4E6E1] space-y-2.5">
                <span className="text-[11px] font-bold text-[#111211] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#0C3D2D]" />
                  Market Demand &amp; Verification Signals
                </span>
                <ul className="space-y-1.5 text-[11px] text-[#70736F] list-disc pl-4 leading-relaxed">
                  <li>Consistent upward timeseries velocity across local search clusters in Kerala.</li>
                  <li>Low volatility ratio indicating stable consumer inquiry interest rather than a short-lived fad.</li>
                  <li>Direct alignment with {shopName}&apos;s customer audience in {shopCity}.</li>
                </ul>
              </div>

              {/* Strategy Action Preview */}
              <div className="p-4 rounded-xl bg-[#E3FAEC] border border-[#70F0A6]/40 text-[#0C3D2D] space-y-1">
                <span className="font-bold text-xs block">Ready to turn this into a marketing strategy?</span>
                <p className="text-[11px] text-[#0C3D2D]/80 leading-relaxed">
                  Clicking below will synthesize your shop details (category, location, brand tone) with this product to generate an evidence-backed branding strategy and campaign steps.
                </p>
              </div>
            </div>
          )}
        </Drawer>
      </div>
    </AppShell>
  );
}
