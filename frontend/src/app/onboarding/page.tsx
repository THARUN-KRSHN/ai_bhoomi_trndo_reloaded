"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCategoryOptions, saveProfile, skipOnboarding } from "@/lib/api/client";
import { Logo } from "@/app/auth/login/page";
import { useAuth } from "@/context/AuthContext";

type Options = { products: string[]; audiences: string[]; brand_personalities: string[]; channels: string[] };
type ProfileForm = {
  shop_name: string; category: string; city: string; region: string; country: string;
  description: string; audience_description: string; primary_language: string;
  brand_personality: string[]; price_positioning: string; preferred_channels: string[];
  products: { name: string; description: string; price: number | null }[];
  objective: string; constraints: string[];
};
const initialForm: ProfileForm = { shop_name: "", category: "", city: "", region: "", country: "India", description: "", audience_description: "", primary_language: "English", brand_personality: [], price_positioning: "mid_range", preferred_channels: [], products: [{ name: "", description: "", price: null }], objective: "increase_qualified_inquiries", constraints: [] };
const categoryChoices = ["Fashion", "Food & bakery", "Beauty", "Fitness", "Home & decor", "Education", "Retail", "Other"];
const fallbackOptions = (category: string): Options => ({
  products: [`${category} essentials`, `${category} bestsellers`, `new ${category} arrivals`],
  audiences: ["Local families", "Young professionals", "Value-conscious shoppers"],
  brand_personalities: ["Trusted", "Modern", "Friendly", "Premium"],
  channels: ["Instagram", "Telegram", "WhatsApp", "Local search"],
});

export default function OnboardingPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [step, setStep] = useState(1); const [busy, setBusy] = useState(false); const [loadingOptions, setLoadingOptions] = useState(false); const [error, setError] = useState(""); const [form, setForm] = useState<ProfileForm>(initialForm);
  const [options, setOptions] = useState<Options>({ products: [], audiences: [], brand_personalities: [], channels: [] });
  const update = <K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) => setForm(current => ({ ...current, [key]: value }));
  const choose = (key: "brand_personality" | "preferred_channels", value: string) => update(key, form[key].includes(value) ? form[key].filter(item => item !== value) : [...form[key], value]);
  useEffect(() => {
    if (!form.category) return;
    setLoadingOptions(true);
    getCategoryOptions(form.category).then(result => setOptions(result.products.length ? result : fallbackOptions(form.category))).catch(() => setOptions(fallbackOptions(form.category))).finally(() => setLoadingOptions(false));
  }, [form.category]);
  const selectedProduct = form.products[0].name;
  const selectProduct = (product: string) => setForm(current => ({ ...current, products: [{ ...current.products[0], name: product, description: `${product} for ${current.audience_description || "local customers"}` }], description: current.description || `A ${current.category.toLowerCase()} shop offering ${product}.` }));
  const selectAudience = (audience: string) => update("audience_description", audience);
  async function finish() {
    setBusy(true); setError("");
    try { await saveProfile(form); router.push("/market-strategy"); } catch { setError("Could not save your profile. Select the required options and try again."); } finally { setBusy(false); }
  }
  async function next() {
    if (step < 3) { setStep(step + 1); return; }
    if (!form.shop_name || !form.category || !form.city || !form.region || !selectedProduct || !form.audience_description) { setError("Choose or complete the highlighted shop details before continuing."); return; }
    await finish();
  }
  async function skip() { setBusy(true); try { await skipOnboarding(); await refreshUser(); router.replace("/market-strategy"); } catch { setError("Could not skip onboarding right now."); } finally { setBusy(false); } }
  return <main className="min-h-screen bg-[#F5F5F2] p-0 sm:p-5 lg:p-8"><section className="mx-auto grid min-h-[calc(100vh-2.5rem)] max-w-[1440px] overflow-hidden rounded-none bg-white shadow-sm sm:rounded-[32px] lg:grid-cols-2">
    <div className="relative hidden overflow-hidden bg-[linear-gradient(145deg,#062e25_0%,#0c3d2d_48%,#1d7652_100%)] p-10 text-white lg:flex lg:flex-col lg:justify-between"><div className="absolute inset-0 opacity-25 [background-image:radial-gradient(rgba(255,255,255,.35)_1px,transparent_1px)] [background-size:7px_7px]" /><div className="relative"><Logo /><div className="mt-28 max-w-lg"><p className="mb-5 text-xs font-bold uppercase tracking-[0.22em] text-[#70F0A6]">Your context, your edge.</p><h2 className="text-6xl font-black leading-[0.98] tracking-[-0.06em]">Give your<br /><span className="text-[#70F0A6]">shop a signal.</span></h2><p className="mt-7 max-w-md text-base leading-relaxed text-white/70">Choose from guided signals instead of writing long forms. You can update everything later.</p></div></div><div className="relative text-xs text-white/55">Step {step} of 3 · Optional setup</div></div>
    <div className="flex items-center px-6 py-12 sm:px-12 lg:px-20"><div className="mx-auto w-full max-w-xl"><div className="mb-10 lg:hidden"><span className="text-xl font-black">TRNDO<span className="text-[#0C3D2D]">.</span>AI</span></div><div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0C3D2D]">Step {step} of 3</p><button type="button" onClick={skip} disabled={busy} className="text-sm font-bold text-[#70736F] underline-offset-4 hover:text-[#0C3D2D] hover:underline">Skip for now</button></div><h1 className="mt-4 text-4xl font-black tracking-tight">Set up your shop</h1><p className="mt-3 mb-10 text-base leading-relaxed text-[#70736F]">Select the signals that best describe your business.</p>
      {step === 1 && <div className="space-y-5"><Field label="Shop name"><input required value={form.shop_name} onChange={e => update("shop_name", e.target.value)} placeholder="e.g. Aria Menswear" className="auth-input" /></Field><Field label="Category"><select required value={form.category} onChange={e => update("category", e.target.value)} className="auth-input"><option value="">Choose your category</option>{categoryChoices.map(category => <option key={category}>{category}</option>)}</select></Field><div className="grid gap-5 sm:grid-cols-2"><Field label="City"><input required value={form.city} onChange={e => update("city", e.target.value)} placeholder="e.g. Kochi" className="auth-input" /></Field><Field label="Region"><input required value={form.region} onChange={e => update("region", e.target.value)} placeholder="e.g. Kerala" className="auth-input" /></Field></div></div>}
      {step === 2 && <div className="space-y-7"><Picker label="What do you offer?" values={options.products} selected={selectedProduct} onSelect={selectProduct} loading={loadingOptions} /><Picker label="Who do you serve?" values={options.audiences} selected={form.audience_description} onSelect={selectAudience} loading={loadingOptions} /><Picker label="Brand personality" values={options.brand_personalities} selected={form.brand_personality} onSelect={value => choose("brand_personality", value)} loading={loadingOptions} multi /></div>}
      {step === 3 && <div className="space-y-7"><Picker label="Where should TRNDO help you share?" values={options.channels} selected={form.preferred_channels} onSelect={value => choose("preferred_channels", value)} loading={loadingOptions} multi /><Field label="Primary objective"><select value={form.objective} onChange={e => update("objective", e.target.value)} className="auth-input"><option value="increase_qualified_inquiries">Increase qualified inquiries</option><option value="sales">Increase sales</option><option value="awareness">Build awareness</option></select></Field><Picker label="Price positioning" values={["Value", "Mid-range", "Premium"]} selected={form.price_positioning.replace("_", "-")} onSelect={value => update("price_positioning", value.toLowerCase().replace("-", "_"))} loading={false} /></div>}
      {error && <p className="mt-5 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}<button type="button" onClick={next} disabled={busy} className="auth-button mt-8">{busy ? "Saving…" : step < 3 ? "Continue" : "Finish setup"} <span>→</span></button>
    </div></div></section></main>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block space-y-2"><span className="text-xs font-bold uppercase tracking-[0.16em] text-[#70736F]">{label}</span>{children}</label>; }
function Picker({ label, values, selected, onSelect, loading, multi = false }: { label: string; values: string[]; selected: string | string[]; onSelect: (value: string) => void; loading: boolean; multi?: boolean }) {
  const selectedValues = Array.isArray(selected) ? selected : [selected];
  return <div><p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-[#70736F]">{label}</p>{loading ? <p className="text-sm text-[#70736F]">Generating relevant choices…</p> : <div className="flex flex-wrap gap-2">{values.map(value => <button type="button" key={value} onClick={() => onSelect(value)} className={`rounded-full border px-4 py-2 text-sm transition ${selectedValues.includes(value) ? "border-[#0C3D2D] bg-[#0C3D2D] text-[#70F0A6]" : "border-[#D9DDD7] bg-[#FAFBF9] text-[#111211] hover:border-[#0C3D2D]"}`}>{value}</button>)}</div>}{!multi && selectedValues[0] && <p className="mt-2 text-xs text-[#0C3D2D]">Selected: {selectedValues[0]}</p>}</div>;
}
