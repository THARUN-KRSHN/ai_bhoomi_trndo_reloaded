"use client";

import { FormEvent, Suspense, useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Download,
  LoaderCircle,
  Sparkles,
  Store,
  Copy,
  Send,
  Share2,
  MessageCircle,
  CheckCircle2,
  Upload,
  X,
  Image as ImageIcon,
  Sparkle,
  Layers,
} from "lucide-react";
import { useStrategy } from "@/context/StrategyContext";
import {
  generatePromotion,
  getStrategyReport,
  getProfile,
  uploadPromotionAsset,
  API_BASE_URL,
  ENABLE_DEMO_DATA,
} from "@/lib/api/client";
import { PromotionFormat, PromotionResponse, StrategyReport } from "@/lib/api/types";

function buildDemoPromotion(
  report: StrategyReport | null,
  name: string,
  description: string,
  language: string,
  format: PromotionFormat
): PromotionResponse {
  const headline = `${name.toUpperCase()}\nCRAFTED FOR YOU.`;
  const subheadline = description || "Exclusive local collection matching current demand.";
  return {
    promotion_id: `demo-promotion-${Date.now()}`,
    strategy_id: report?.strategy_id || `strategy-${Date.now()}`,
    merchant_id: "development-merchant",
    demo: true,
    content: {
      promotion_title: name,
      campaign_angle: report?.primary_positioning || "Trend-aligned regional release",
      strategic_rationale: "Creative aligned with high-velocity local demand signals.",
      primary_caption: `Discover ${name}.\n\n${description}\n\nAvailable now for verified local orders. Message us directly to reserve yours today.`,
      short_caption: `${name} — Available now in limited quantity.`,
      instagram_caption: null,
      whatsapp_share_text: null,
      telegram_customer_message: null,
      hashtags: [`#${name.replace(/\s+/g, "")}`, "#VerifiedRetail", "#LocalShop", "#NewArrival"],
      call_to_action: report?.call_to_action || "Order on WhatsApp",
      poster_headline: headline,
      poster_subheadline: subheadline,
      approved_product_details: [name],
      design_direction: "Minimalist editorial luxury with dark emerald backdrop and mint typography",
      language,
      assumptions: ["Demonstration creative generated from strategy signals."],
      content_warnings: [],
    },
    poster_asset_ids: [],
    asset_urls: [],
    created_at: new Date().toISOString(),
    quota_remaining: 4,
    quota_reset_date: new Date().toISOString().slice(0, 10),
  };
}

function CreatePromotionContent() {
  const searchParams = useSearchParams();
  const { currentReport } = useStrategy();

  const [report, setReport] = useState<StrategyReport | null>(currentReport || null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState("English");
  const [format, setFormat] = useState<PromotionFormat>("portrait");
  const [notes, setNotes] = useState("");
  const [productImageUrl, setProductImageUrl] = useState<string>("");

  // Logo upload state
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [logoAssetId, setLogoAssetId] = useState<string>("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [result, setResult] = useState<PromotionResponse | null>(null);
  const [status, setStatus] = useState<"idle" | "generating" | "error">("idle");
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState("");
  const [shareNotice, setShareNotice] = useState("");
  const [savedProducts, setSavedProducts] = useState<Array<{ name: string; description?: string; price?: number }>>([]);

  // Read URL query params on mount
  useEffect(() => {
    const strategyParam = searchParams.get("strategy");
    const productParam = searchParams.get("product");
    const imageParam = searchParams.get("image");
    const descParam = searchParams.get("description");

    if (productParam) {
      setName(productParam);
    }
    if (imageParam) {
      setProductImageUrl(imageParam);
    }
    if (descParam) {
      setDescription(descParam);
    }

    if (strategyParam && (!report || report.strategy_id !== strategyParam)) {
      getStrategyReport(strategyParam)
        .then((r) => {
          setReport(r);
          if (!productParam && r.opportunities?.[0]?.title) {
            const cleanTitle = r.opportunities[0].title.replace(/need-led local test/gi, "").trim() || "Featured Collection";
            setName(cleanTitle);
          }
          if (!descParam) {
            const raw = r.value_proposition || r.primary_positioning || "";
            if (raw.toLowerCase().includes("cake") && !(productParam || "").toLowerCase().includes("cake")) {
              setDescription(`Curated ${productParam || "collection"} crafted for verified regional demand.`);
            } else {
              setDescription(raw);
            }
          }
        })
        .catch(() => {});
    } else if (report && !name && !productParam) {
      if (report.opportunities?.[0]?.title) {
        const cleanTitle = report.opportunities[0].title.replace(/need-led local test/gi, "").trim() || "Featured Collection";
        setName(cleanTitle);
      }
      if (!descParam) {
        const raw = report.value_proposition || report.primary_positioning || "";
        if (raw.toLowerCase().includes("cake")) {
          setDescription("Curated collection crafted for verified regional demand.");
        } else {
          setDescription(raw);
        }
      }
    }

    // Load saved shop profile to offer catalog autofill
    getProfile()
      .then((res) => {
        if (res?.profile?.products_services && Array.isArray(res.profile.products_services)) {
          const prods = res.profile.products_services.map((item) => {
            if (typeof item === "string") return { name: item };
            const pObj = item as Record<string, unknown>;
            return {
              name: String(pObj.name || ""),
              description: pObj.description ? String(pObj.description) : undefined,
              price: pObj.price ? Number(pObj.price) : undefined,
            };
          });
          setSavedProducts(prods);
          if (prods.length > 0 && !name && !productParam) {
            setName(prods[0].name);
            if (prods[0].description && !description) {
              setDescription(prods[0].description);
            }
          }
        }
      })
      .catch(() => {});
  }, [searchParams, report]);

  // Loading animation step timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === "generating") {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % 3);
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [status]);

  const imageUrl = useMemo(() => {
    const raw = result?.asset_urls[0];
    return raw ? (raw.startsWith("http") ? raw : `${API_BASE_URL}${raw}`) : null;
  }, [result]);

  const handleLogoUpload = async (file: File) => {
    setLogoFile(file);
    const previewUrl = URL.createObjectURL(file);
    setLogoPreview(previewUrl);
    setUploadingLogo(true);
    try {
      const res = await uploadPromotionAsset(file, "logo");
      setLogoAssetId(res.asset_id);
    } catch (err) {
      console.warn("Logo upload to server failed, using local preview", err);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview("");
    setLogoAssetId("");
    if (logoInputRef.current) logoInputRef.current.value = "";
  };

  const handleSelectSavedProduct = (productName: string) => {
    const found = savedProducts.find((p) => p.name === productName);
    if (found) {
      setName(found.name);
      if (found.description) setDescription(found.description);
    }
  };

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || !description.trim()) {
      setError("Add a product name and description before generating.");
      return;
    }
    setStatus("generating");
    setError("");

    const input = {
      strategy_id: report?.strategy_id || undefined,
      merchant_id: "development-merchant",
      product_snapshot: { name, description, verified_attributes: [] },
      logo_asset_id: logoAssetId || undefined,
      brand_asset_id: logoAssetId || undefined,
      product_image_url: productImageUrl || undefined,
      language,
      channels: ["instagram", "telegram", "whatsapp"],
      formats: [format],
      campaign_notes: notes || undefined,
      approved_price: null,
      include_telegram_order_link: true,
      demo_mode: ENABLE_DEMO_DATA,
    };

    try {
      const generated = await generatePromotion(input);
      setResult(generated);
      localStorage.setItem(`trndo-promotion-${generated.promotion_id}`, JSON.stringify(generated));
    } catch (err) {
      if (ENABLE_DEMO_DATA) {
        const demo = buildDemoPromotion(report, name, description, language, format);
        setResult(demo);
        localStorage.setItem(`trndo-promotion-${demo.promotion_id}`, JSON.stringify(demo));
      } else {
        setError(err instanceof Error ? err.message : "Promotion generation failed. Please try again.");
      }
    } finally {
      setStatus("idle");
    }
  }

  const handleDownload = () => {
    if (!imageUrl) return;
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `trndo-poster-${name.toLowerCase().replace(/\s+/g, "-")}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const trackSocialShare = (channel: "whatsapp" | "instagram" | "telegram") => {
    try {
      const raw = localStorage.getItem("trndo_social_shares");
      const current = raw ? JSON.parse(raw) : { totalCampaigns: 2, whatsappShares: 14, instagramReach: 32, telegramInquiries: 5 };
      if (channel === "whatsapp") current.whatsappShares = (current.whatsappShares || 0) + 1;
      if (channel === "instagram") current.instagramReach = (current.instagramReach || 0) + 12;
      if (channel === "telegram") current.telegramInquiries = (current.telegramInquiries || 0) + 1;
      localStorage.setItem("trndo_social_shares", JSON.stringify(current));
    } catch {
      // ignore
    }
  };

  const handleShareWhatsApp = () => {
    if (!result) return;
    trackSocialShare("whatsapp");
    const text = `*${result.content.poster_headline.replace(/\n/g, " ")}*\n\n${result.content.primary_caption}\n\n${result.content.hashtags.join(" ")}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
    setShareNotice("WhatsApp opened! Campaign shared to your chat/story.");
    setTimeout(() => setShareNotice(""), 4000);
  };

  const handleShareTelegram = () => {
    if (!result) return;
    trackSocialShare("telegram");
    const text = `${result.content.poster_headline}\n\n${result.content.primary_caption}\n\n${result.content.hashtags.join(" ")}`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(imageUrl || window.location.href)}&text=${encodeURIComponent(text)}`, "_blank");
    setShareNotice("Telegram opened! Content ready to broadcast.");
    setTimeout(() => setShareNotice(""), 4000);
  };

  const handleCopyInstagram = () => {
    if (!result) return;
    trackSocialShare("instagram");
    const text = `${result.content.poster_headline}\n\n${result.content.primary_caption}\n\n${result.content.hashtags.join(" ")}`;
    navigator.clipboard.writeText(text);
    setShareNotice("Instagram caption & hashtags copied! Paste directly into your Instagram post or reel.");
    setTimeout(() => setShareNotice(""), 4000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/marketing-studio"
          className="inline-flex items-center gap-2 text-xs font-bold text-brand-muted hover:text-brand-text transition-colors"
        >
          <ArrowLeft size={15} /> Back to Marketing Studio
        </Link>
        {report && (
          <span className="rounded-full bg-[#E3FAEC] px-3 py-1 text-[11px] font-bold text-[#0C3D2D] flex items-center gap-1.5">
            <Sparkle size={12} className="text-[#0C3D2D]" />
            Strategy Linked: {report.opportunities?.[0]?.title || "Active Brief"}
          </span>
        )}
      </div>

      {/* 2-HALF SPLIT LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* LEFT HALF: DETAILS FILL FORM */}
        <div className="space-y-5 rounded-[28px] border border-brand-border bg-white p-6 sm:p-8 shadow-xs">
          <div>
            <span className="eyebrow">Campaign Generator</span>
            <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-[#111211]">
              Shape the creative.
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-brand-muted">
              Configure your product, upload your logo, and craft a high-impact advertising poster for your shop.
            </p>
          </div>

          {/* Strategy Context Card */}
          {report && (
            <div className="rounded-2xl bg-[#F8FAF7] border border-[#E4E6E1] p-4">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#0C3D2D] block">
                Target Opportunity Strategy
              </span>
              <p className="mt-1 text-sm font-black text-[#111211]">
                {report.opportunities?.[0]?.title || "Market Strategy Blueprint"}
              </p>
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#70736F]">
                {(() => {
                  const raw = report.primary_positioning || report.value_proposition || "";
                  if (raw.toLowerCase().includes("cake") && !name.toLowerCase().includes("cake")) {
                    return `Evidence-backed retail strategy aligned with verified local demand for ${name || "your product"}.`;
                  }
                  return raw;
                })()}
              </p>
            </div>
          )}

          <form onSubmit={submit} className="space-y-5">
            {/* Catalog Selector */}
            {savedProducts.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-[#E3FAEC]/70 border border-[#70F0A6]/40 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0C3D2D] flex items-center gap-1.5">
                  <Store size={12} />
                  Select from your saved shop catalog
                </span>
                <select
                  onChange={(e) => handleSelectSavedProduct(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-brand-border bg-white text-xs font-bold text-[#111211] focus:outline-hidden focus:border-[#0C3D2D]"
                >
                  <option value="">Choose a catalog item to prefill...</option>
                  {savedProducts.map((p, idx) => (
                    <option key={idx} value={p.name}>
                      {p.name} {p.price ? `(₹${p.price})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Product Name */}
            <label className="block text-xs font-bold text-[#111211]">
              Product name
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Vintage Oversized Graphic Tee, Linen Summer Shirt..."
                className="studio-input mt-1.5 text-xs sm:text-sm font-semibold"
              />
            </label>

            {/* Verified Description */}
            <label className="block text-xs font-bold text-[#111211]">
              Product description &amp; value angle
              <textarea
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your product's appeal, craft, materials, or local relevance..."
                rows={3}
                className="studio-input mt-1.5 text-xs sm:text-sm resize-none leading-relaxed"
              />
            </label>

            {/* LOGO UPLOAD COMPONENT */}
            <div className="space-y-2">
              <span className="block text-xs font-bold text-[#111211]">
                Shop logo <span className="font-normal text-brand-muted">(optional, placed on poster)</span>
              </span>

              {logoPreview ? (
                <div className="flex items-center justify-between p-3 rounded-2xl border border-[#70F0A6]/60 bg-[#E3FAEC]/40">
                  <div className="flex items-center gap-3">
                    <img
                      src={logoPreview}
                      alt="Shop Logo Preview"
                      className="w-12 h-12 rounded-xl object-contain bg-white border border-[#E4E6E1] p-1 shrink-0"
                    />
                    <div>
                      <p className="text-xs font-bold text-[#0C3D2D]">
                        {logoFile?.name || "Uploaded Logo"}
                      </p>
                      <p className="text-[10px] text-[#70736F]">
                        {uploadingLogo ? "Uploading to poster engine..." : "Ready for compositing"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="p-1.5 rounded-full hover:bg-white text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X size={15} />
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2.5 p-4 rounded-2xl border-2 border-dashed border-[#E4E6E1] hover:border-[#0C3D2D] bg-[#F8FAF7] cursor-pointer transition-colors group">
                  <Upload size={16} className="text-[#70736F] group-hover:text-[#0C3D2D] transition-colors" />
                  <span className="text-xs font-bold text-[#70736F] group-hover:text-[#0C3D2D] transition-colors">
                    Upload PNG or JPG Shop Logo
                  </span>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleLogoUpload(file);
                    }}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* PRODUCT IMAGE PREVIEW (IF PASSED FROM TREND) */}
            {productImageUrl && (
              <div className="flex items-center justify-between p-3 rounded-2xl border border-brand-border bg-[#F8FAF7]">
                <div className="flex items-center gap-3">
                  <img
                    src={productImageUrl}
                    alt="Trend Visual"
                    className="w-12 h-12 rounded-xl object-cover border border-[#E4E6E1] shrink-0"
                  />
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#0C3D2D] block">
                      Trend Visual Attached
                    </span>
                    <p className="text-xs text-[#70736F] line-clamp-1">
                      Will be composited into poster hero
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setProductImageUrl("")}
                  className="p-1.5 rounded-full hover:bg-white text-gray-400 hover:text-red-500 transition-colors"
                  title="Remove image"
                >
                  <X size={15} />
                </button>
              </div>
            )}

            {/* Language & Format Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block text-xs font-bold text-[#111211]">
                Language
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="studio-input mt-1.5 text-xs font-semibold"
                >
                  <option>English</option>
                  <option>Malayalam</option>
                  <option>English with Malayalam context</option>
                </select>
              </label>

              <div>
                <span className="text-xs font-bold text-[#111211]">Poster aspect ratio</span>
                <div className="mt-1.5 grid grid-cols-3 gap-2">
                  {(["portrait", "square", "story"] as PromotionFormat[]).map((item) => (
                    <button
                      type="button"
                      key={item}
                      onClick={() => setFormat(item)}
                      className={`rounded-xl border px-2 py-2 text-center text-xs font-bold capitalize transition-all ${
                        format === item
                          ? "border-[#0C3D2D] bg-[#E3FAEC] text-[#0C3D2D] shadow-xs"
                          : "border-brand-border text-[#70736F] hover:bg-gray-50"
                      }`}
                    >
                      <span className="block text-[11px] font-black">
                        {item === "portrait" ? "4:5" : item === "square" ? "1:1" : "9:16"}
                      </span>
                      <span className="text-[9px] font-medium text-[#70736F]">{item}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Campaign Notes */}
            <label className="block text-xs font-bold text-[#111211]">
              Creative tone / Callout <span className="font-normal text-brand-muted">(optional)</span>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Minimalist luxury, highlight 20% launch pricing, include WhatsApp CTA..."
                className="studio-input mt-1.5 text-xs font-semibold"
              />
            </label>

            {error && (
              <p role="alert" className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700">
                {error}
              </p>
            )}

            {/* GENERATE POSTER BUTTON */}
            <button
              type="submit"
              disabled={status === "generating"}
              className="flex w-full items-center justify-center gap-2.5 rounded-full bg-[#0C3D2D] hover:bg-[#14523E] px-6 py-4 text-sm font-black text-[#70F0A6] shadow-md hover:shadow-lg transition-all disabled:opacity-60 cursor-pointer"
            >
              {status === "generating" ? (
                <>
                  <LoaderCircle className="animate-spin" size={18} />
                  <span>Generating Commercial Campaign...</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} className="text-[#70F0A6]" />
                  <span>Generate Campaign Poster</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* RIGHT HALF: POSTER CANVAS & LIVE GRADIENT LOADING PREVIEW */}
        <div className="flex flex-col rounded-[28px] bg-[#F4F4F1] border border-[#E4E6E1] p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="eyebrow">Creative Preview</span>
              <h2 className="mt-1 text-xl font-black text-[#111211]">Live Poster Canvas</h2>
            </div>
            <span className="text-xs font-bold text-[#70736F] uppercase tracking-wider px-3 py-1 rounded-full bg-white border border-[#E4E6E1]">
              Format: {format === "portrait" ? "4:5 Portrait" : format === "square" ? "1:1 Square" : "9:16 Story"}
            </span>
          </div>

          {/* Ratio Canvas Container */}
          <div className="flex flex-1 items-center justify-center p-2 sm:p-4">
            <div
              className={`w-full transition-all duration-300 relative rounded-2xl overflow-hidden shadow-2xl flex flex-col justify-between ${
                format === "story"
                  ? "aspect-[9/16] max-w-[370px]"
                  : format === "square"
                  ? "aspect-square max-w-[460px]"
                  : "aspect-[4/5] max-w-[440px]"
              }`}
            >
              {/* STATE A: GENERATING WITH ANIMATED GRADIENT LOADING */}
              {status === "generating" ? (
                <div className="w-full h-full relative overflow-hidden bg-gradient-to-br from-[#061812] via-[#0C3D2D] to-[#124233] p-8 flex flex-col justify-between text-white">
                  {/* Pulsing Gradient Shimmer Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#70F0A6]/15 to-transparent animate-pulse" />

                  {/* Header Skeleton */}
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="h-6 w-24 rounded-full bg-white/20 animate-pulse" />
                    <div className="h-6 w-28 rounded-full bg-[#70F0A6]/20 animate-pulse" />
                  </div>

                  {/* Center Visual Generator State */}
                  <div className="relative z-10 text-center space-y-4 my-auto">
                    <div className="w-20 h-20 mx-auto rounded-3xl bg-[#70F0A6]/10 border border-[#70F0A6]/30 flex items-center justify-center shadow-lg">
                      <Sparkles className="w-10 h-10 text-[#70F0A6] animate-spin" style={{ animationDuration: "6s" }} />
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-black text-white tracking-wide">
                        {loadingStep === 0 && "Synthesizing strategic angle & visual layout..."}
                        {loadingStep === 1 && "Generating commercial studio visual with OpenAI..."}
                        {loadingStep === 2 && "Compositing typography, logo branding & CTA..."}
                      </p>
                      <p className="text-[11px] text-[#70F0A6] font-medium">
                        Crafting professional advertising quality for {name || "your product"}
                      </p>
                    </div>

                    <div className="w-48 h-1.5 mx-auto bg-white/10 rounded-full overflow-hidden">
                      <div className="w-full h-full bg-[#70F0A6] rounded-full animate-pulse" />
                    </div>
                  </div>

                  {/* Footer Skeleton */}
                  <div className="relative z-10 space-y-3">
                    <div className="h-8 w-3/4 rounded-xl bg-white/20 animate-pulse" />
                    <div className="h-4 w-1/2 rounded-lg bg-white/10 animate-pulse" />
                    <div className="h-10 w-44 rounded-full bg-[#70F0A6]/30 animate-pulse mt-4" />
                  </div>
                </div>
              ) : imageUrl ? (
                /* STATE B: POSTER GENERATED */
                <img
                  src={imageUrl}
                  alt={result?.content.poster_headline || "Generated Poster"}
                  className="w-full h-full object-cover rounded-2xl"
                />
              ) : (
                /* STATE C: IDLE SKELETON PREVIEW */
                <div className="w-full h-full relative overflow-hidden bg-gradient-to-br from-[#071712] to-[#0e2a20] p-7 text-white flex flex-col justify-between border border-[#70F0A6]/20">
                  {/* Top Header Mockup */}
                  <div className="flex items-center justify-between">
                    {logoPreview ? (
                      <div className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/20 flex items-center gap-2">
                        <img src={logoPreview} alt="Logo" className="w-6 h-6 object-contain" />
                        <span className="text-[10px] font-bold text-white">Your Logo</span>
                      </div>
                    ) : (
                      <div className="px-3 py-1 rounded-xl bg-white/10 text-[10px] font-bold text-white/80">
                        Shop Logo
                      </div>
                    )}
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#70F0A6] px-2.5 py-1 rounded-full bg-[#70F0A6]/10 border border-[#70F0A6]/30">
                      Trend-Aligned
                    </span>
                  </div>

                  {/* Center Hero Spotlight Mockup */}
                  <div className="my-auto text-center space-y-3 p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                    {productImageUrl ? (
                      <img
                        src={productImageUrl}
                        alt="Product"
                        className="w-24 h-24 mx-auto rounded-2xl object-cover border border-[#70F0A6]/40 shadow-lg"
                      />
                    ) : (
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-[#70F0A6]/10 border border-[#70F0A6]/30 flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-[#70F0A6]" />
                      </div>
                    )}
                    <div>
                      <p className="text-base font-black text-white uppercase tracking-tight">
                        {name || "Your Product Name"}
                      </p>
                      <p className="text-xs text-[#C2D6CC] mt-1 line-clamp-2">
                        {description || "High-impact visual advertising campaign rendered by OpenAI."}
                      </p>
                    </div>
                  </div>

                  {/* Bottom Headline & CTA Mockup */}
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-[#70F0A6] uppercase tracking-wider">
                      Verified Campaign Creative
                    </p>
                    <div className="inline-block px-5 py-2.5 rounded-full bg-[#70F0A6] text-[#071712] text-xs font-black">
                      &rarr; {report?.call_to_action || "Order on WhatsApp"}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* POSTER ACTION BAR (WHEN GENERATED) */}
          {result && (
            <div className="rounded-2xl bg-white p-5 space-y-4 border border-[#E4E6E1]">
              {shareNotice && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-[#E3FAEC] border border-[#70F0A6]/60 text-[#0C3D2D] text-xs font-bold animate-in fade-in">
                  <CheckCircle2 size={15} className="shrink-0" />
                  <span>{shareNotice}</span>
                </div>
              )}

              {/* Caption & Hashtags */}
              <div>
                <span className="eyebrow">Strategy Caption</span>
                <p className="mt-1.5 whitespace-pre-line text-xs sm:text-sm leading-relaxed text-[#111211]">
                  {result.content.primary_caption}
                </p>
                <p className="mt-2 text-xs font-bold text-[#0C3D2D]">
                  {result.content.hashtags.join(" ")}
                </p>
              </div>

              {/* Social Toolbar */}
              <div className="pt-3 border-t border-[#E4E6E1] flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#075E54] text-xs font-bold border border-[#25D366]/30 transition-all cursor-pointer"
                >
                  <MessageCircle size={13} />
                  <span>Share WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={handleShareTelegram}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#0088cc]/10 hover:bg-[#0088cc]/20 text-[#0088cc] text-xs font-bold border border-[#0088cc]/30 transition-all cursor-pointer"
                >
                  <Send size={13} />
                  <span>Share Telegram</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyInstagram}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#F4F4F1] hover:bg-[#E4E6E1] text-[#111211] text-xs font-bold border border-[#E4E6E1] transition-all cursor-pointer"
                >
                  <Copy size={13} />
                  <span>Copy Caption</span>
                </button>

                {imageUrl && (
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0C3D2D] hover:bg-[#14523E] text-[#70F0A6] text-xs font-bold transition-all ml-auto cursor-pointer"
                  >
                    <Download size={13} />
                    <span>Download Poster</span>
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-brand-border pt-3">
                <span className="text-[11px] font-bold text-[#0C3D2D] flex items-center gap-1.5">
                  <Check size={14} /> Campaign created with AI studio
                </span>
                <Link
                  href="/marketing-studio/creations"
                  className="text-[11px] font-bold text-[#0C3D2D] hover:underline"
                >
                  View in My Creations &rarr;
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CreatePromotionPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#0C3D2D] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#70736F]">Loading marketing studio canvas...</p>
        </div>
      }
    >
      <CreatePromotionContent />
    </Suspense>
  );
}
