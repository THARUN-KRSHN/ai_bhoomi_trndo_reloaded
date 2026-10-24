"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/context/AuthContext";
import {
  getProfile,
  saveProfile,
  uploadShopLogo,
  changePin,
  getTelegramLinkToken,
  ENABLE_DEMO_DATA,
} from "@/lib/api/client";
import {
  Store,
  Sparkles,
  Package,
  Image as ImageIcon,
  ShieldCheck,
  Send,
  BarChart2,
  CheckCircle2,
  CircleAlert,
  Loader2,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";

interface ProductItem {
  name: string;
  description?: string;
  price?: number;
  cost?: number;
  stock?: number;
}

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "business" | "brand" | "products" | "logo" | "security" | "integrations" | "usage"
  >("business");

  // Profile Form States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successNotice, setSuccessNotice] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [shopName, setShopName] = useState("");
  const [category, setCategory] = useState("Bakery & Confectionery");
  const [subcategory, setSubcategory] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [country, setCountry] = useState("India");
  const [serviceArea, setServiceArea] = useState("");
  const [description, setDescription] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");

  // Customer & Brand
  const [targetAudience, setTargetAudience] = useState("");
  const [buyingOccasions, setBuyingOccasions] = useState("");
  const [primaryLanguage, setPrimaryLanguage] = useState("English");
  const [additionalLanguages, setAdditionalLanguages] = useState("");
  const [brandPersonality, setBrandPersonality] = useState("Artisanal & Warm");
  const [pricePositioning, setPricePositioning] = useState("Premium Accessible");
  const [productBenefits, setProductBenefits] = useState("");
  const [marketingChannels, setMarketingChannels] = useState("Instagram, Telegram");

  // Products
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [newProdName, setNewProdName] = useState("");
  const [newProdPrice, setNewProdPrice] = useState("");
  const [newProdDesc, setNewProdDesc] = useState("");

  // Logo
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Security (PIN change)
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmNewPin, setConfirmNewPin] = useState("");
  const [pinNotice, setPinNotice] = useState("");
  const [pinError, setPinError] = useState("");
  const [changingPin, setChangingPin] = useState(false);

  // Telegram Integration
  const [telegramToken, setTelegramToken] = useState("");
  const [telegramDeepLink, setTelegramDeepLink] = useState("");
  const [loadingTelegramToken, setLoadingTelegramToken] = useState(false);

  useEffect(() => {
    async function loadShopProfile() {
      try {
        setLoading(true);
        const res = await getProfile();
        if (res?.profile) {
          const p = res.profile;
          setShopName(String(p.shop_name || ""));
          setCategory(String(p.business_category || p.category || "Bakery & Confectionery"));
          setSubcategory(String(p.business_subcategory || ""));
          setCity(String(p.city || ""));
          setRegion(String(p.region || ""));
          setCountry(String(p.country || "India"));
          setServiceArea(String(p.service_area || ""));
          setDescription(String(p.short_description || p.description || ""));
          setWebsiteUrl(String(p.website_url || ""));

          setTargetAudience(String(p.target_audience || ""));
          setBuyingOccasions(String(p.buying_occasions || ""));
          setPrimaryLanguage(String(p.primary_language || "English"));
          setAdditionalLanguages(
            Array.isArray(p.additional_languages)
              ? p.additional_languages.join(", ")
              : String(p.additional_languages || "")
          );
          setBrandPersonality(String(p.brand_personality || "Artisanal & Warm"));
          setPricePositioning(String(p.price_positioning || "Premium Accessible"));
          setProductBenefits(
            Array.isArray(p.key_product_benefits)
              ? p.key_product_benefits.join(", ")
              : String(p.key_product_benefits || "")
          );
          setMarketingChannels(
            Array.isArray(p.preferred_channels)
              ? p.preferred_channels.join(", ")
              : String(p.preferred_channels || "Instagram, Telegram")
          );

          if (Array.isArray(p.products_services)) {
            setProducts(
              p.products_services.map((item) => {
                if (typeof item === "string") return { name: item };
                const prodObj = item as Record<string, unknown>;
                return {
                  name: String(prodObj.name || "Item"),
                  price: prodObj.price ? Number(prodObj.price) : undefined,
                  description: prodObj.description ? String(prodObj.description) : undefined,
                  cost: prodObj.cost ? Number(prodObj.cost) : undefined,
                  stock: prodObj.stock ? Number(prodObj.stock) : undefined,
                };
              })
            );
          }
          if (p.logo_url) {
            setLogoUrl(String(p.logo_url));
          }
        }
      } catch {
        // Fallback gracefully
      } finally {
        setLoading(false);
      }
    }
    loadShopProfile();
  }, []);

  const handleSaveProfile = async () => {
    setSaving(true);
    setSuccessNotice("");
    setErrorMessage("");

    try {
      const payload: Record<string, unknown> = {
        shop_name: shopName,
        business_category: category,
        business_subcategory: subcategory,
        city,
        region,
        country,
        service_area: serviceArea,
        short_description: description,
        website_url: websiteUrl,
        target_audience: targetAudience,
        buying_occasions: buyingOccasions,
        primary_language: primaryLanguage,
        additional_languages: additionalLanguages
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        brand_personality: brandPersonality,
        price_positioning: pricePositioning,
        key_product_benefits: productBenefits
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        preferred_channels: marketingChannels
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        products_services: products,
        logo_url: logoUrl,
      };

      await saveProfile(payload);
      setSuccessNotice("Shop profile saved successfully. All modules will use these updated details.");
      setTimeout(() => setSuccessNotice(""), 4000);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleAddProduct = () => {
    if (!newProdName.trim()) return;
    const priceNum = newProdPrice ? parseFloat(newProdPrice) : undefined;
    const item: ProductItem = {
      name: newProdName.trim(),
      price: priceNum && !isNaN(priceNum) ? priceNum : undefined,
      description: newProdDesc.trim() || undefined,
    };
    setProducts((prev) => [...prev, item]);
    setNewProdName("");
    setNewProdPrice("");
    setNewProdDesc("");
  };

  const handleRemoveProduct = (index: number) => {
    setProducts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    setErrorMessage("");
    try {
      const res = await uploadShopLogo(file);
      setLogoUrl(res.logo_url);
      setSuccessNotice("Logo uploaded and updated successfully.");
      setTimeout(() => setSuccessNotice(""), 4000);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Could not upload logo.");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    setLogoUrl(null);
    setSuccessNotice("Logo removed. You can upload a new logo anytime.");
  };

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinNotice("");
    setPinError("");

    if (newPin !== confirmNewPin) {
      setPinError("New PIN and confirmation PIN do not match.");
      return;
    }
    if (newPin.length < 4 || newPin.length > 8) {
      setPinError("PIN must be between 4 and 8 digits.");
      return;
    }

    setChangingPin(true);
    try {
      await changePin(currentPin, newPin);
      setPinNotice("Your account PIN has been updated successfully.");
      setCurrentPin("");
      setNewPin("");
      setConfirmNewPin("");
    } catch (err: unknown) {
      setPinError(err instanceof Error ? err.message : "Failed to update PIN. Verify your current PIN.");
    } finally {
      setChangingPin(false);
    }
  };

  const handleGenerateTelegramLink = async () => {
    setLoadingTelegramToken(true);
    try {
      const res = await getTelegramLinkToken(user?.user_id || "merchant");
      setTelegramToken(res.token);
      setTelegramDeepLink(res.deep_link);
    } catch {
      setTelegramToken("TRNDO-DEMO-LINK");
      setTelegramDeepLink("https://t.me/trndo_bot?start=merchant_demo");
    } finally {
      setLoadingTelegramToken(false);
    }
  };

  const tabs = [
    { id: "business", label: "Business Details", icon: Store },
    { id: "brand", label: "Customer & Brand", icon: Sparkles },
    { id: "products", label: "Products & Offerings", icon: Package },
    { id: "logo", label: "Shop Logo", icon: ImageIcon },
    { id: "security", label: "Security & PIN", icon: ShieldCheck },
    { id: "integrations", label: "Telegram Bot", icon: Send },
    { id: "usage", label: "Usage & Plan", icon: BarChart2 },
  ];

  if (loading) {
    return (
      <AppShell>
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#0C3D2D]" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#70736F] block">
              Workspace Configuration
            </span>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-[#111211]">
              Profile &amp; Settings
            </h1>
            <p className="mt-1 text-xs text-[#70736F]">
              Configure your persistent business profile. Changes automatically power your trends, strategies, and promotions.
            </p>
          </div>

          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0C3D2D] hover:bg-[#124d3a] text-[#70F0A6] text-xs font-bold transition-all shadow-xs disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Save All Changes</span>
              </>
            )}
          </button>
        </div>

        {/* Success / Error Alerts */}
        {successNotice && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#E3FAEC] border border-[#70F0A6]/40 text-[#0C3D2D] text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}
        {errorMessage && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold">
            <CircleAlert className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Tab Navigation Pill Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#E4E6E1]">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-[#0C3D2D] text-[#70F0A6]"
                    : "bg-[#FFFFFF] text-[#70736F] hover:text-[#111211] hover:bg-[#F4F4F1] border border-[#E4E6E1]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Business Details */}
        {activeTab === "business" && (
          <div className="rounded-[28px] border border-[#E4E6E1] bg-white p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-lg font-black text-[#111211]">Shop &amp; Location Information</h2>
              <p className="text-xs text-[#70736F]">
                Used by the Trend Finder to identify localized market signals in your geographic area.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#111211] mb-1.5">Shop Name *</label>
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E4E6E1] bg-[#F4F4F1] text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0C3D2D]"
                  placeholder="e.g. Malabar Artisanal Bakers"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111211] mb-1.5">Business Category *</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E4E6E1] bg-[#F4F4F1] text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0C3D2D]"
                  placeholder="e.g. Bakery & Confectionery, Fashion, Electronics"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111211] mb-1.5">Subcategory</label>
                <input
                  type="text"
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E4E6E1] bg-[#F4F4F1] text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0C3D2D]"
                  placeholder="e.g. Bento & Custom Celebration Cakes"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111211] mb-1.5">City *</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E4E6E1] bg-[#F4F4F1] text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0C3D2D]"
                  placeholder="e.g. Kochi"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111211] mb-1.5">Region / State</label>
                <input
                  type="text"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E4E6E1] bg-[#F4F4F1] text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0C3D2D]"
                  placeholder="e.g. Kerala"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111211] mb-1.5">Country</label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E4E6E1] bg-[#F4F4F1] text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0C3D2D]"
                  placeholder="e.g. India"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111211] mb-1.5">Service Area</label>
              <input
                type="text"
                value={serviceArea}
                onChange={(e) => setServiceArea(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#E4E6E1] bg-[#F4F4F1] text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0C3D2D]"
                placeholder="e.g. Greater Kochi & 15km delivery radius"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111211] mb-1.5">Short Shop Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#E4E6E1] bg-[#F4F4F1] text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0C3D2D]"
                placeholder="Briefly describe what your shop stands for, your specialties, and your customer promise..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111211] mb-1.5">Website or Public Shop URL (Optional)</label>
              <input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#E4E6E1] bg-[#F4F4F1] text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0C3D2D]"
                placeholder="https://..."
              />
            </div>
          </div>
        )}

        {/* Tab 2: Customer & Brand */}
        {activeTab === "brand" && (
          <div className="rounded-[28px] border border-[#E4E6E1] bg-white p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-lg font-black text-[#111211]">Customer Demographics &amp; Brand Tone</h2>
              <p className="text-xs text-[#70736F]">
                Powers the Market Strategy positioning and Market Studio caption generation tone.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#111211] mb-1.5">Target Audience Segment</label>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E4E6E1] bg-[#F4F4F1] text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0C3D2D]"
                  placeholder="e.g. Young families, urban working professionals"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111211] mb-1.5">Buying Occasions</label>
                <input
                  type="text"
                  value={buyingOccasions}
                  onChange={(e) => setBuyingOccasions(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E4E6E1] bg-[#F4F4F1] text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0C3D2D]"
                  placeholder="e.g. Birthdays, anniversaries, weekend gatherings"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111211] mb-1.5">Primary Language</label>
                <input
                  type="text"
                  value={primaryLanguage}
                  onChange={(e) => setPrimaryLanguage(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E4E6E1] bg-[#F4F4F1] text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0C3D2D]"
                  placeholder="e.g. English, Malayalam, Hindi, Tamil"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111211] mb-1.5">Additional Languages (comma-separated)</label>
                <input
                  type="text"
                  value={additionalLanguages}
                  onChange={(e) => setAdditionalLanguages(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E4E6E1] bg-[#F4F4F1] text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0C3D2D]"
                  placeholder="e.g. Malayalam, Hindi"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111211] mb-1.5">Brand Personality</label>
                <input
                  type="text"
                  value={brandPersonality}
                  onChange={(e) => setBrandPersonality(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E4E6E1] bg-[#F4F4F1] text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0C3D2D]"
                  placeholder="e.g. Warm & Artisanal, Bold & Energetic, Minimalist"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111211] mb-1.5">Price Positioning</label>
                <input
                  type="text"
                  value={pricePositioning}
                  onChange={(e) => setPricePositioning(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E4E6E1] bg-[#F4F4F1] text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0C3D2D]"
                  placeholder="e.g. Premium Accessible, Budget Friendly, Luxury"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111211] mb-1.5">Key Product Benefits (comma-separated)</label>
              <input
                type="text"
                value={productBenefits}
                onChange={(e) => setProductBenefits(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#E4E6E1] bg-[#F4F4F1] text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0C3D2D]"
                placeholder="e.g. 100% organic, custom hand-piped lettering, same-day delivery"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111211] mb-1.5">Preferred Marketing Channels</label>
              <input
                type="text"
                value={marketingChannels}
                onChange={(e) => setMarketingChannels(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#E4E6E1] bg-[#F4F4F1] text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0C3D2D]"
                placeholder="e.g. Instagram Reels, WhatsApp Stories, Telegram"
              />
            </div>
          </div>
        )}

        {/* Tab 3: Products */}
        {activeTab === "products" && (
          <div className="rounded-[28px] border border-[#E4E6E1] bg-white p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-lg font-black text-[#111211]">Product &amp; Service Catalog</h2>
              <p className="text-xs text-[#70736F]">
                Manage verified items that can be selected in Trend Matching, Strategy Briefs, and Promotional Posters.
              </p>
            </div>

            {/* Existing Products List */}
            <div className="space-y-3">
              {products.length === 0 ? (
                <p className="text-xs text-[#70736F] italic py-4">No products registered yet. Add one below.</p>
              ) : (
                products.map((p, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 rounded-2xl bg-[#F4F4F1] border border-[#E4E6E1]"
                  >
                    <div>
                      <span className="font-bold text-xs text-[#111211] block">{p.name}</span>
                      {p.price && <span className="text-[11px] font-semibold text-[#0C3D2D]">₹{p.price}</span>}
                      {p.description && <span className="text-[11px] text-[#70736F] block">{p.description}</span>}
                    </div>
                    <button
                      onClick={() => handleRemoveProduct(idx)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove product"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add New Product Box */}
            <div className="p-4 rounded-2xl border border-dashed border-[#E4E6E1] bg-[#FAFAF8] space-y-4">
              <span className="text-xs font-bold text-[#111211] flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-[#0C3D2D]" />
                Add Product to Catalog
              </span>
              <div className="grid sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Product name *"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  className="px-3.5 py-2 rounded-xl border border-[#E4E6E1] bg-white text-xs"
                />
                <input
                  type="number"
                  placeholder="Verified Price (₹)"
                  value={newProdPrice}
                  onChange={(e) => setNewProdPrice(e.target.value)}
                  className="px-3.5 py-2 rounded-xl border border-[#E4E6E1] bg-white text-xs"
                />
                <input
                  type="text"
                  placeholder="Short description"
                  value={newProdDesc}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                  className="px-3.5 py-2 rounded-xl border border-[#E4E6E1] bg-white text-xs"
                />
              </div>
              <button
                type="button"
                onClick={handleAddProduct}
                disabled={!newProdName.trim()}
                className="px-4 py-2 rounded-full bg-[#0C3D2D] text-[#70F0A6] text-xs font-bold hover:bg-[#124d3a] transition-all disabled:opacity-50"
              >
                Add Item
              </button>
            </div>
          </div>
        )}

        {/* Tab 4: Logo */}
        {activeTab === "logo" && (
          <div className="rounded-[28px] border border-[#E4E6E1] bg-white p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-lg font-black text-[#111211]">Shop Logo Management</h2>
              <p className="text-xs text-[#70736F]">
                Your logo is automatically placed onto promotional posters in the Market Studio. Logo upload is optional and can be updated anytime.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl bg-[#F4F4F1] border border-[#E4E6E1]">
              <div className="w-24 h-24 rounded-2xl bg-white border border-[#E4E6E1] flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt="Shop Logo" className="w-full h-full object-contain p-2" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-[#70736F]" />
                )}
              </div>

              <div className="space-y-3 flex-1 text-center sm:text-left">
                <span className="text-xs font-bold text-[#111211] block">
                  {logoUrl ? "Current Shop Logo" : "No Logo Uploaded Yet"}
                </span>
                <p className="text-[11px] text-[#70736F]">
                  Supported formats: PNG, JPG, WebP or SVG. Maximum file size: 5MB.
                </p>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0C3D2D] text-[#70F0A6] text-xs font-bold hover:bg-[#124d3a] transition-all">
                    {uploadingLogo ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>{logoUrl ? "Replace Logo" : "Upload Logo"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={uploadingLogo}
                      className="hidden"
                    />
                  </label>

                  {logoUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="px-4 py-2 rounded-full border border-red-200 text-red-600 text-xs font-bold hover:bg-red-50 transition-all"
                    >
                      Remove Logo
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Security */}
        {activeTab === "security" && (
          <div className="rounded-[28px] border border-[#E4E6E1] bg-white p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-lg font-black text-[#111211]">Security &amp; PIN Authentication</h2>
              <p className="text-xs text-[#70736F]">
                Your account is protected with Argon2id PIN hashing and rate-limited authentication.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#F4F4F1] border border-[#E4E6E1] text-xs space-y-1">
              <span className="font-bold text-[#111211] block">Account Identifier:</span>
              <span className="text-[#70736F]">{user?.phone_number || "Active Session"}</span>
            </div>

            <form onSubmit={handleChangePin} className="space-y-4 max-w-md">
              <h3 className="text-sm font-bold text-[#111211]">Change Account PIN</h3>

              {pinNotice && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-[#E3FAEC] text-[#0C3D2D] text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{pinNotice}</span>
                </div>
              )}
              {pinError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-800 text-xs font-semibold">
                  <CircleAlert className="w-4 h-4 shrink-0" />
                  <span>{pinError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#111211] mb-1">Current PIN</label>
                <input
                  type="password"
                  required
                  value={currentPin}
                  onChange={(e) => setCurrentPin(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E4E6E1] bg-[#F4F4F1] text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0C3D2D]"
                  placeholder="Enter current PIN"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111211] mb-1">New PIN (4-8 digits)</label>
                <input
                  type="password"
                  required
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E4E6E1] bg-[#F4F4F1] text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0C3D2D]"
                  placeholder="Enter new PIN"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111211] mb-1">Confirm New PIN</label>
                <input
                  type="password"
                  required
                  value={confirmNewPin}
                  onChange={(e) => setConfirmNewPin(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E4E6E1] bg-[#F4F4F1] text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0C3D2D]"
                  placeholder="Re-enter new PIN"
                />
              </div>

              <button
                type="submit"
                disabled={changingPin || !currentPin || !newPin}
                className="px-5 py-2.5 rounded-full bg-[#0C3D2D] text-[#70F0A6] text-xs font-bold hover:bg-[#124d3a] transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {changingPin && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Update PIN</span>
              </button>
            </form>

            <div className="pt-6 border-t border-[#E4E6E1]">
              <button
                onClick={logout}
                className="px-4 py-2 rounded-full border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition-colors"
              >
                Sign Out of Workspace
              </button>
            </div>
          </div>
        )}

        {/* Tab 6: Telegram Integration */}
        {activeTab === "integrations" && (
          <div className="rounded-[28px] border border-[#E4E6E1] bg-white p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-lg font-black text-[#111211]">Telegram Integration</h2>
              <p className="text-xs text-[#70736F]">
                Link your shop&apos;s Telegram bot to automatically receive customer enquiries and send verified order payment requests.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#F4F4F1] border border-[#E4E6E1] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#111211] block">Bot Connection Status</span>
                  <span className="text-[11px] text-[#70736F]">
                    Secure merchant token linking with zero password exposure.
                  </span>
                </div>
                <span className="px-3 py-1 rounded-full bg-[#E3FAEC] text-[#0C3D2D] text-[10px] font-bold">
                  Ready to link
                </span>
              </div>

              <button
                onClick={handleGenerateTelegramLink}
                disabled={loadingTelegramToken}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0C3D2D] text-[#70F0A6] text-xs font-bold hover:bg-[#124d3a] transition-all disabled:opacity-50"
              >
                {loadingTelegramToken ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Generate Bot Link Token</span>
              </button>

              {telegramToken && (
                <div className="p-4 rounded-xl bg-white border border-[#E4E6E1] space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#70736F] block">
                    One-time Verification Token
                  </span>
                  <div className="p-2.5 rounded-lg bg-[#F4F4F1] font-mono text-xs text-[#0C3D2D] font-bold select-all">
                    {telegramToken}
                  </div>
                  <p className="text-[11px] text-[#70736F]">
                    Open Telegram and send this code to your bot, or click:{" "}
                    <a
                      href={telegramDeepLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#0C3D2D] font-bold underline"
                    >
                      Connect via Telegram Bot
                    </a>
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 7: Usage & Plan */}
        {activeTab === "usage" && (
          <div className="rounded-[28px] border border-[#E4E6E1] bg-white p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-lg font-black text-[#111211]">Usage &amp; Workspace Quotas</h2>
              <p className="text-xs text-[#70736F]">
                Your subscription status and service connection provenance.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-[#F4F4F1] border border-[#E4E6E1]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#70736F] block">Active Plan</span>
                <span className="text-base font-black text-[#111211] mt-1 block">Merchant Pro</span>
                <span className="text-[11px] text-[#0C3D2D] font-bold mt-2 block">Standard Workspace Active</span>
              </div>

              <div className="p-5 rounded-2xl bg-[#F4F4F1] border border-[#E4E6E1]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#70736F] block">Trend Searches</span>
                <span className="text-base font-black text-[#111211] mt-1 block">Unlimited</span>
                <span className="text-[11px] text-[#70736F] mt-2 block">SerpApi &amp; Local Category</span>
              </div>

              <div className="p-5 rounded-2xl bg-[#F4F4F1] border border-[#E4E6E1]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#70736F] block">Data Provenance</span>
                <span className="text-base font-black text-[#111211] mt-1 block">
                  {ENABLE_DEMO_DATA ? "Demo Fallback" : "Live Backend"}
                </span>
                <span className="text-[11px] text-[#70736F] mt-2 block">
                  {ENABLE_DEMO_DATA ? "Fallback permitted if offline" : "Enforcing live service"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
