"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Upload, Image as ImageIcon, Check } from "lucide-react";
import { getCategoryOptions, saveProfile, skipOnboarding, uploadShopLogo } from "@/lib/api/client";
import { useAuth } from "@/context/AuthContext";

type Options = { products: string[]; audiences: string[]; brand_personalities: string[]; channels: string[] };
type ProfileForm = {
  shop_name: string;
  category: string;
  subcategory?: string;
  city: string;
  region: string;
  country: string;
  description: string;
  audience_description: string;
  primary_language: string;
  brand_personality: string[];
  price_positioning: string;
  preferred_channels: string[];
  products: { name: string; description: string; price: number | null }[];
  objective: string;
  constraints: string[];
  logo_url?: string;
  logo_asset_id?: string;
};

const initialForm: ProfileForm = {
  shop_name: "",
  category: "",
  subcategory: "",
  city: "",
  region: "",
  country: "India",
  description: "",
  audience_description: "",
  primary_language: "English",
  brand_personality: [],
  price_positioning: "mid_range",
  preferred_channels: [],
  products: [{ name: "", description: "", price: null }],
  objective: "increase_qualified_inquiries",
  constraints: [],
};

const categoryChoices = [
  "Fashion",
  "Food & bakery",
  "Beauty",
  "Fitness",
  "Home & decor",
  "Education",
  "Retail",
  "Other",
];

const fallbackOptions = (category: string): Options => ({
  products: [`${category} essentials`, `${category} bestsellers`, `new ${category} arrivals`],
  audiences: ["Local families", "Young professionals", "Value-conscious shoppers"],
  brand_personalities: ["Trusted", "Modern", "Friendly", "Premium"],
  channels: ["Instagram", "Telegram", "WhatsApp", "Local search"],
});

export default function OnboardingPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<ProfileForm>(initialForm);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [options, setOptions] = useState<Options>({
    products: [],
    audiences: [],
    brand_personalities: [],
    channels: [],
  });

  const update = <K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const choose = (key: "brand_personality" | "preferred_channels", value: string) =>
    update(
      key,
      form[key].includes(value)
        ? form[key].filter((item) => item !== value)
        : [...form[key], value]
    );

  useEffect(() => {
    if (!form.category) return;
    setLoadingOptions(true);
    getCategoryOptions(form.category)
      .then((result) =>
        setOptions(result.products.length ? result : fallbackOptions(form.category))
      )
      .catch(() => setOptions(fallbackOptions(form.category)))
      .finally(() => setLoadingOptions(false));
  }, [form.category]);

  const selectedProduct = form.products[0]?.name || "";
  const selectProduct = (product: string) =>
    setForm((current) => ({
      ...current,
      products: [
        {
          ...current.products[0],
          name: product,
          description: `${product} for ${current.audience_description || "local customers"}`,
        },
      ],
      description: current.description || `A ${current.category.toLowerCase()} shop offering ${product}.`,
    }));

  const selectAudience = (audience: string) => update("audience_description", audience);

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  async function finish() {
    setBusy(true);
    setError("");
    try {
      let finalForm = { ...form };
      if (logoFile) {
        try {
          const logoRes = await uploadShopLogo(logoFile);
          finalForm.logo_url = logoRes.logo_url;
          finalForm.logo_asset_id = logoRes.asset_id;
        } catch (uploadErr) {
          console.warn("Logo upload failed, continuing with profile save:", uploadErr);
        }
      }
      await saveProfile(finalForm);
      await refreshUser();
      router.push("/app");
    } catch {
      setError("Could not save your profile. Review the required options and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function next() {
    setError("");
    if (step === 1) {
      if (!form.shop_name.trim() || !form.category || !form.city.trim() || !form.region.trim()) {
        setError("Please complete all required shop details (name, category, city, region).");
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!selectedProduct || !form.audience_description) {
        setError("Please select at least one primary offering and target audience.");
        return;
      }
      setStep(3);
      return;
    }
    await finish();
  }

  async function skip() {
    setBusy(true);
    try {
      await skipOnboarding();
      await refreshUser();
      router.replace("/app");
    } catch {
      setError("Could not skip onboarding right now.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F4F4F1] p-0 sm:p-5 lg:p-8 font-sans">
      <section className="mx-auto grid min-h-[calc(100vh-2.5rem)] max-w-[1440px] overflow-hidden rounded-none bg-white shadow-sm sm:rounded-[32px] lg:grid-cols-2">
        {/* Left Editorial Brand Panel */}
        <div className="relative hidden overflow-hidden bg-[#0C3D2D] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="relative z-10">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-[#14523E] flex items-center justify-center text-[#70F0A6]">
                <span className="font-black text-xs tracking-tighter">TR</span>
              </div>
              <span className="font-black text-lg tracking-tight text-white">
                TRNDO<span className="text-[#70F0A6]">.AI</span>
              </span>
            </div>

            <div className="mt-28 max-w-lg">
              <p className="mb-5 text-xs font-bold uppercase tracking-[0.22em] text-[#70F0A6]">
                Your context, your edge.
              </p>
              <h2 className="text-5xl lg:text-6xl font-black leading-[1.02] tracking-tight">
                Give your
                <br />
                <span className="text-[#70F0A6]">shop a signal.</span>
              </h2>
              <p className="mt-6 max-w-md text-sm leading-relaxed text-white/70">
                Your shop profile supplies the persistent context for trend discovery, strategy generation, poster creation, and customer orders.
              </p>
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between text-xs text-white/60 pt-8 border-t border-white/10">
            <span>Step {step} of 3 · Shop Onboarding</span>
            <span>All fields can be updated anytime in Settings</span>
          </div>
        </div>

        {/* Right Form Wizard Panel */}
        <div className="flex items-center px-6 py-10 sm:px-12 lg:px-16 overflow-y-auto max-h-[100vh]">
          <div className="mx-auto w-full max-w-xl py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0C3D2D] bg-[#E3FAEC] px-3 py-1 rounded-full">
                Step {step} of 3
              </span>
              <button
                type="button"
                onClick={skip}
                disabled={busy}
                className="text-xs font-semibold text-[#70736F] hover:text-[#111211] underline-offset-4 hover:underline"
              >
                Skip for now
              </button>
            </div>

            <h1 className="mt-4 text-3xl sm:text-4xl font-black tracking-tight text-[#111211]">
              {step === 1 && "Shop Details"}
              {step === 2 && "Customers & Brand"}
              {step === 3 && "Products, Goals & Logo"}
            </h1>
            <p className="mt-2 mb-8 text-sm text-[#70736F]">
              {step === 1 && "Confirm where you operate and what category best matches your business."}
              {step === 2 && "Define the audience you serve and your brand personality."}
              {step === 3 && "Verify your core product offerings, campaign goal, and optional shop logo."}
            </p>

            {/* Step 1: Shop details */}
            {step === 1 && (
              <div className="space-y-5">
                <Field label="Shop / Business Name *">
                  <input
                    required
                    value={form.shop_name}
                    onChange={(e) => update("shop_name", e.target.value)}
                    placeholder="e.g. Aria Bakery & Cafe"
                    className="w-full px-4 py-3 rounded-2xl bg-[#F4F4F1] border border-[#E4E6E1] text-sm text-[#111211] focus:outline-hidden focus:border-[#0C3D2D]"
                  />
                </Field>

                <Field label="Business Category *">
                  <select
                    required
                    value={form.category}
                    onChange={(e) => update("category", e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-[#F4F4F1] border border-[#E4E6E1] text-sm text-[#111211] focus:outline-hidden focus:border-[#0C3D2D]"
                  >
                    <option value="">Choose category</option>
                    {categoryChoices.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="City *">
                    <input
                      required
                      value={form.city}
                      onChange={(e) => update("city", e.target.value)}
                      placeholder="e.g. Kochi"
                      className="w-full px-4 py-3 rounded-2xl bg-[#F4F4F1] border border-[#E4E6E1] text-sm text-[#111211] focus:outline-hidden focus:border-[#0C3D2D]"
                    />
                  </Field>
                  <Field label="Region / State *">
                    <input
                      required
                      value={form.region}
                      onChange={(e) => update("region", e.target.value)}
                      placeholder="e.g. Kerala"
                      className="w-full px-4 py-3 rounded-2xl bg-[#F4F4F1] border border-[#E4E6E1] text-sm text-[#111211] focus:outline-hidden focus:border-[#0C3D2D]"
                    />
                  </Field>
                </div>

                <Field label="Short Description (Optional)">
                  <textarea
                    rows={2}
                    value={form.description}
                    onChange={(e) => update("description", e.target.value)}
                    placeholder="e.g. Specialty neighborhood bakery crafting sourdough and custom bento celebration cakes."
                    className="w-full px-4 py-3 rounded-2xl bg-[#F4F4F1] border border-[#E4E6E1] text-sm text-[#111211] focus:outline-hidden focus:border-[#0C3D2D]"
                  />
                </Field>
              </div>
            )}

            {/* Step 2: Customers and brand */}
            {step === 2 && (
              <div className="space-y-6">
                <Picker
                  label="What do you offer? *"
                  values={options.products}
                  selected={selectedProduct}
                  onSelect={selectProduct}
                  loading={loadingOptions}
                />

                <Picker
                  label="Who do you serve? *"
                  values={options.audiences}
                  selected={form.audience_description}
                  onSelect={selectAudience}
                  loading={loadingOptions}
                />

                <Picker
                  label="Brand Personality"
                  values={options.brand_personalities}
                  selected={form.brand_personality}
                  onSelect={(v) => choose("brand_personality", v)}
                  loading={loadingOptions}
                  multi
                />

                <Field label="Primary Language">
                  <select
                    value={form.primary_language}
                    onChange={(e) => update("primary_language", e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-[#F4F4F1] border border-[#E4E6E1] text-sm text-[#111211] focus:outline-hidden focus:border-[#0C3D2D]"
                  >
                    <option value="English">English</option>
                    <option value="Malayalam">Malayalam</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Tamil">Tamil</option>
                    <option value="Kannada">Kannada</option>
                  </select>
                </Field>
              </div>
            )}

            {/* Step 3: Products, goals and logo */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="p-5 rounded-2xl bg-[#F4F4F1] border border-[#E4E6E1] space-y-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#111211] block">
                    Core Product
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-bold text-[#70736F] block mb-1">Product Name</label>
                      <input
                        value={form.products[0]?.name || ""}
                        onChange={(e) =>
                          setForm((c) => ({
                            ...c,
                            products: [{ ...c.products[0], name: e.target.value }],
                          }))
                        }
                        placeholder="e.g. Bento Celebration Cake"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#E4E6E1] text-xs text-[#111211]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-[#70736F] block mb-1">Price (₹, Optional)</label>
                      <input
                        type="number"
                        value={form.products[0]?.price ?? ""}
                        onChange={(e) =>
                          setForm((c) => ({
                            ...c,
                            products: [
                              {
                                ...c.products[0],
                                price: e.target.value ? parseFloat(e.target.value) : null,
                              },
                            ],
                          }))
                        }
                        placeholder="450"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#E4E6E1] text-xs text-[#111211]"
                      />
                    </div>
                  </div>
                </div>

                <Field label="Primary Business Objective">
                  <select
                    value={form.objective}
                    onChange={(e) => update("objective", e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-[#F4F4F1] border border-[#E4E6E1] text-sm text-[#111211] focus:outline-hidden focus:border-[#0C3D2D]"
                  >
                    <option value="increase_qualified_inquiries">Increase qualified inquiries</option>
                    <option value="sales">Increase direct orders</option>
                    <option value="awareness">Build local neighborhood awareness</option>
                  </select>
                </Field>

                {/* Optional Shop Logo Panel (per Section 6) */}
                <div className="p-5 rounded-2xl bg-[#FFFFFF] border-2 border-dashed border-[#E4E6E1] space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-[#111211]">Add your shop logo</h4>
                      <p className="text-xs text-[#70736F] mt-0.5">
                        You can upload it later from Profile.
                      </p>
                    </div>
                    {logoPreview && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-[#0C3D2D] bg-[#E3FAEC] px-2.5 py-0.5 rounded-full">
                        <Check className="w-3.5 h-3.5" /> Logo Added
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 pt-1">
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="Shop Logo Preview"
                        className="w-14 h-14 rounded-2xl object-cover border border-[#E4E6E1]"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-[#F4F4F1] border border-[#E4E6E1] flex items-center justify-center text-[#70736F]">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                    )}

                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#F4F4F1] hover:bg-[#E8EAE5] text-xs font-semibold text-[#111211] transition-colors border border-[#E4E6E1]">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{logoFile ? "Change Logo" : "Choose File"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoSelect}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <p className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                {error}
              </p>
            )}

            {/* Wizard Navigation Actions */}
            <div className="mt-8 pt-4 border-t border-[#E4E6E1] flex items-center justify-between">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-semibold text-[#70736F] hover:text-[#111211] transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
              ) : (
                <div />
              )}

              <button
                type="button"
                onClick={next}
                disabled={busy}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-[#0C3D2D] text-[#70F0A6] text-sm font-bold hover:bg-[#14523E] transition-colors shadow-xs"
              >
                <span>{busy ? "Saving…" : step < 3 ? "Continue" : "Finish Setup"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-bold uppercase tracking-wider text-[#70736F]">
        {label}
      </span>
      {children}
    </label>
  );
}

function Picker({
  label,
  values,
  selected,
  onSelect,
  loading,
  multi = false,
}: {
  label: string;
  values: string[];
  selected: string | string[];
  onSelect: (value: string) => void;
  loading: boolean;
  multi?: boolean;
}) {
  const selectedValues = Array.isArray(selected) ? selected : [selected];
  return (
    <div className="space-y-2">
      <span className="text-xs font-bold uppercase tracking-wider text-[#70736F] block">
        {label}
      </span>
      {loading ? (
        <p className="text-xs text-[#70736F]">Generating tailored suggestions…</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {values.map((v) => (
            <button
              type="button"
              key={v}
              onClick={() => onSelect(v)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                selectedValues.includes(v)
                  ? "bg-[#0C3D2D] text-[#70F0A6] font-bold shadow-xs"
                  : "bg-[#F4F4F1] text-[#111211] hover:bg-[#E8EAE5] border border-[#E4E6E1]"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

