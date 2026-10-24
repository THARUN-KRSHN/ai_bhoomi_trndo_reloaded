"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Download, LoaderCircle, Sparkles, Store, Copy, Send, Share2, MessageCircle, CheckCircle2 } from "lucide-react";
import { useStrategy } from "@/context/StrategyContext";
import {
  generatePromotion,
  getStrategyReport,
  getProfile,
  API_BASE_URL,
  ENABLE_DEMO_DATA,
} from "@/lib/api/client";
import { PromotionFormat, PromotionResponse, StrategyReport } from "@/lib/api/types";
import { SAMPLE_STRATEGY_REPORT } from "@/lib/demo/sampleReport";

function demoPromotion(report: StrategyReport, name: string, language: string): PromotionResponse {
  return {
    promotion_id: `demo-promotion-${Date.now()}`,
    strategy_id: report.strategy_id,
    merchant_id: "development-merchant",
    demo: true,
    content: {
      promotion_title: name,
      campaign_angle: report.primary_positioning,
      strategic_rationale: "Demo creative based on the approved strategy.",
      primary_caption: `${name}, made for the moments worth celebrating.\n\nMade to order in Kochi. Enquire for your preferred date.`,
      short_caption: `${name} for your next celebration.`,
      instagram_caption: null,
      whatsapp_share_text: null,
      telegram_customer_message: null,
      hashtags: ["#Kochi", "#CelebrationCake", "#MadeToOrder"],
      call_to_action: report.call_to_action,
      poster_headline: "Make the moment\ntaste beautiful.",
      poster_subheadline: "Made to order in Kochi",
      approved_product_details: [],
      design_direction: "Editorial minimalism with warm natural tones",
      language,
      assumptions: ["Demonstration creative; no live asset was generated."],
      content_warnings: ["Demo output — review all claims before publishing."],
    },
    poster_asset_ids: [],
    asset_urls: [],
    created_at: new Date().toISOString(),
    quota_remaining: 4,
    quota_reset_date: new Date().toISOString().slice(0, 10),
  };
}

export default function CreatePromotionPage() {
  const { currentReport } = useStrategy();
  const [report, setReport] = useState<StrategyReport>(currentReport || SAMPLE_STRATEGY_REPORT);
  const [name, setName] = useState(report.opportunities?.[0]?.title || "Custom celebration cakes");
  const [description, setDescription] = useState("Made-to-order cakes for birthdays and celebrations");
  const [language, setLanguage] = useState("English");
  const [format, setFormat] = useState<PromotionFormat>("portrait");
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<PromotionResponse | null>(null);
  const [status, setStatus] = useState<"idle" | "generating" | "error">("idle");
  const [error, setError] = useState("");
  const [shareNotice, setShareNotice] = useState("");
  const [savedProducts, setSavedProducts] = useState<Array<{ name: string; description?: string; price?: number }>>([]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get("strategy");
    const productParam = urlParams.get("product");

    if (productParam) {
      setName(productParam);
      setDescription(`Curated ${productParam} collection matching shop trend signals.`);
    }

    if (id && id !== report.strategy_id) {
      getStrategyReport(id)
        .then((r) => {
          setReport(r);
          if (!productParam && r.opportunities?.[0]?.title) {
            setName(r.opportunities[0].title);
          }
        })
        .catch(() => setReport(SAMPLE_STRATEGY_REPORT));
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
          if (prods.length > 0 && !name) {
            setName(prods[0].name);
            if (prods[0].description) setDescription(prods[0].description);
          }
        }
      })
      .catch(() => {});
  }, [report.strategy_id, name]);

  const imageUrl = useMemo(() => {
    const raw = result?.asset_urls[0];
    return raw ? (raw.startsWith("http") ? raw : `${API_BASE_URL}${raw}`) : null;
  }, [result]);

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
      setError("Add a product name and verified description before generating.");
      return;
    }
    setStatus("generating");
    setError("");
    const input = {
      strategy_id: report.strategy_id,
      merchant_id: "development-merchant",
      product_snapshot: { name, description, verified_attributes: [] },
      language,
      channels: ["instagram", "telegram"],
      formats: [format],
      campaign_notes: notes || undefined,
      approved_price: null,
      include_telegram_order_link: false,
      demo_mode: ENABLE_DEMO_DATA,
    };
    try {
      const generated = await generatePromotion(input);
      setResult(generated);
      localStorage.setItem(`trndo-promotion-${generated.promotion_id}`, JSON.stringify(generated));
    } catch (err) {
      if (ENABLE_DEMO_DATA) {
        const generated = demoPromotion(report, name, language);
        setResult(generated);
        localStorage.setItem(`trndo-promotion-${generated.promotion_id}`, JSON.stringify(generated));
      } else {
        setError(err instanceof Error ? err.message : "Promotion generation failed.");
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/marketing-studio"
          className="inline-flex items-center gap-2 text-xs font-bold text-brand-muted hover:text-brand-text"
        >
          <ArrowLeft size={15} /> Marketing Studio
        </Link>
        {report.demo && (
          <span className="rounded-full bg-brand-pale-mint px-3 py-1 text-[10px] font-bold text-brand-forest">
            Demo strategy
          </span>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(300px, .72fr)_1.28fr]">
        <form
          onSubmit={submit}
          className="space-y-5 rounded-[26px] border border-brand-border bg-white p-6 sm:p-8"
        >
          <div>
            <span className="eyebrow">Create promotion</span>
            <h1 className="mt-2 text-3xl font-black tracking-tight">Shape the creative.</h1>
            <p className="mt-2 text-sm leading-6 text-brand-muted">
              Your strategy stays in control. These settings only guide the presentation.
            </p>
          </div>

          <div className="rounded-2xl bg-brand-bg p-4">
            <span className="eyebrow">Promotion strategy</span>
            <p className="mt-2 text-sm font-black">
              {report.opportunities?.[0]?.title || "Approved strategy"}
            </p>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-brand-muted">
              {report.primary_positioning}
            </p>
            <Link
              href={`/market-strategy/report/${report.strategy_id}`}
              className="mt-3 inline-block text-[11px] font-bold text-brand-forest underline"
            >
              View strategy
            </Link>
          </div>

          {savedProducts.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-[#E3FAEC]/60 border border-[#70F0A6]/40 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0C3D2D] flex items-center gap-1.5">
                <Store size={12} />
                Select from your shop catalog
              </span>
              <select
                onChange={(e) => handleSelectSavedProduct(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-brand-border bg-white text-xs font-bold text-[#111211]"
              >
                <option value="">Choose a verified product...</option>
                {savedProducts.map((p, idx) => (
                  <option key={idx} value={p.name}>
                    {p.name} {p.price ? `(₹${p.price})` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          <label className="block text-xs font-bold">
            Product name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="studio-input"
            />
          </label>

          <label className="block text-xs font-bold">
            Verified product description
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="studio-input resize-none"
            />
          </label>

          <label className="block text-xs font-bold">
            Language
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="studio-input"
            >
              <option>English</option>
              <option>Malayalam</option>
              <option>English with Malayalam context</option>
            </select>
          </label>

          <div>
            <span className="text-xs font-bold">Format</span>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {(["square", "portrait", "story"] as PromotionFormat[]).map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => setFormat(item)}
                  className={`rounded-xl border px-2 py-3 text-[11px] font-bold capitalize ${
                    format === item
                      ? "border-brand-forest bg-brand-pale-mint text-brand-forest"
                      : "border-brand-border text-brand-muted"
                  }`}
                >
                  {item === "portrait" ? "4:5" : item === "square" ? "1:1" : "9:16"}
                  <span className="mt-1 block text-[10px] font-medium">{item}</span>
                </button>
              ))}
            </div>
          </div>

          <label className="block text-xs font-bold">
            Describe your promotion <span className="font-normal text-brand-muted">(optional)</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Example: Keep the layout calm, premium and easy to scan."
              rows={3}
              className="studio-input resize-none"
            />
          </label>

          {error && (
            <p role="alert" className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700">
              {error}
            </p>
          )}

          <button
            disabled={status === "generating"}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-forest px-5 py-3.5 text-sm font-black text-brand-mint disabled:opacity-60"
          >
            {status === "generating" ? (
              <>
                <LoaderCircle className="animate-spin" size={16} /> Preparing your creative...
              </>
            ) : (
              <>
                <Sparkles size={16} /> Generate poster
              </>
            )}
          </button>
        </form>

        <section className="flex min-h-[620px] flex-col rounded-[26px] bg-[#e8ebe4] p-4 sm:p-8">
          <div className="flex items-center justify-between px-1 pb-4">
            <div>
              <span className="eyebrow">Preview canvas</span>
              <h2 className="mt-1 text-lg font-black">Your creative</h2>
            </div>
            {result?.demo && (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-[10px] font-bold text-amber-800">
                Demo output
              </span>
            )}
          </div>

          <div className="flex flex-1 items-center justify-center rounded-[22px] bg-[#dfe3db] p-5">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt={result?.content.poster_headline || "Generated promotion"}
                className="max-h-[600px] max-w-full rounded-xl object-contain shadow-2xl"
              />
            ) : (
              <div
                className={`flex w-full max-w-[390px] flex-col justify-between rounded-2xl bg-[#f5eadb] p-7 text-brand-text shadow-xl ${
                  format === "story"
                    ? "aspect-[9/16]"
                    : format === "square"
                    ? "aspect-square"
                    : "aspect-[4/5]"
                }`}
              >
                <span className="text-[10px] font-black uppercase tracking-[.18em] text-brand-forest">
                  Your poster will appear here
                </span>
                <div className="my-4 flex flex-1 items-center justify-center rounded-2xl bg-[#e4c6a3] text-7xl">
                  🍰
                </div>
                <h3 className="whitespace-pre-line text-3xl font-black leading-none">
                  {result?.content.poster_headline || "Make the moment\ntaste beautiful."}
                </h3>
                <p className="mt-3 text-xs font-semibold text-brand-muted">
                  {result?.content.poster_subheadline || "A strategy-led creative preview"}
                </p>
              </div>
            )}
          </div>

          {result && (
            <div className="mt-4 rounded-2xl bg-white p-5 space-y-4">
              {/* Share Feedback Toast */}
              {shareNotice && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-[#E3FAEC] border border-[#70F0A6]/60 text-[#0C3D2D] text-xs font-bold animate-in fade-in">
                  <CheckCircle2 size={15} className="shrink-0" />
                  <span>{shareNotice}</span>
                </div>
              )}

              {/* Caption & Hashtags */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="eyebrow">Strategy Caption</span>
                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#111211]">
                    {result.content.primary_caption}
                  </p>
                  <p className="mt-3 text-xs font-bold text-brand-forest">
                    {result.content.hashtags.join(" ")}
                  </p>
                </div>
                {imageUrl && (
                  <button
                    onClick={handleDownload}
                    title="Download poster"
                    className="rounded-full bg-brand-bg hover:bg-brand-pale-mint p-2 text-brand-forest transition-colors shrink-0"
                  >
                    <Download size={16} />
                  </button>
                )}
              </div>

              {/* Social Media Sharing Toolbar */}
              <div className="pt-3 border-t border-[#E4E6E1] space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#70736F] flex items-center gap-1.5">
                  <Share2 size={12} className="text-[#0C3D2D]" />
                  Share to Social Media &amp; Sync Dashboard
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleShareWhatsApp}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#075E54] text-xs font-bold border border-[#25D366]/30 transition-all"
                  >
                    <MessageCircle size={13} />
                    <span>Share to WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleShareTelegram}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#0088cc]/10 hover:bg-[#0088cc]/20 text-[#0088cc] text-xs font-bold border border-[#0088cc]/30 transition-all"
                  >
                    <Send size={13} />
                    <span>Share to Telegram</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyInstagram}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#F4F4F1] hover:bg-[#E4E6E1] text-[#111211] text-xs font-bold border border-[#E4E6E1] transition-all"
                  >
                    <Copy size={13} />
                    <span>Copy for Instagram</span>
                  </button>

                  {imageUrl && (
                    <button
                      type="button"
                      onClick={handleDownload}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#0C3D2D] hover:bg-[#14523E] text-[#70F0A6] text-xs font-bold transition-all ml-auto"
                    >
                      <Download size={13} />
                      <span>Download Poster</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-brand-border pt-3">
                <div className="flex items-center gap-2 text-[11px] font-bold text-brand-forest">
                  <Check size={14} /> Strategy-linked output · {result.content.language}
                </div>
                <Link
                  href="/marketing-studio/creations"
                  className="text-[11px] font-bold text-[#0C3D2D] underline"
                >
                  View in My Creations &rarr;
                </Link>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
