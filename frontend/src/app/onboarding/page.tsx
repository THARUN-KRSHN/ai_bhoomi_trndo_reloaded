"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { saveProfile } from "@/lib/api/client";
import { Logo } from "@/app/auth/login/page";

type ProfileForm = {
  shop_name: string;
  category: string;
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
};

const initialForm: ProfileForm = {
  shop_name: "", category: "", city: "", region: "", country: "India",
  description: "", audience_description: "", primary_language: "English",
  brand_personality: [], price_positioning: "mid_range", preferred_channels: ["telegram"],
  products: [{ name: "", description: "", price: null }],
  objective: "increase_qualified_inquiries", constraints: [],
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<ProfileForm>(initialForm);

  const update = <K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) =>
    setForm((current) => ({ ...current, [key]: value }));
  const updateProduct = (key: "name" | "description", value: string) =>
    setForm((current) => ({ ...current, products: [{ ...current.products[0], [key]: value }] }));

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (step < 3) {
      setStep(step + 1);
      return;
    }
    setBusy(true);
    try {
      await saveProfile(form);
      router.push("/market-strategy");
    } catch {
      setError("Could not save your shop profile. Check every required field and try again.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="min-h-screen bg-[#F5F5F2] p-0 sm:p-5 lg:p-8">
    <section className="mx-auto grid min-h-[calc(100vh-2.5rem)] max-w-[1440px] overflow-hidden rounded-none bg-white shadow-sm sm:rounded-[32px] lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-[linear-gradient(145deg,#062e25_0%,#0c3d2d_48%,#1d7652_100%)] p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(rgba(255,255,255,.35)_1px,transparent_1px)] [background-size:7px_7px]" />
        <div className="relative"><Logo /><div className="mt-28 max-w-lg"><p className="mb-5 text-xs font-bold uppercase tracking-[0.22em] text-[#70F0A6]">Your context, your edge.</p><h2 className="text-6xl font-black leading-[0.98] tracking-[-0.06em]">Give your<br /><span className="text-[#70F0A6]">shop a signal.</span></h2><p className="mt-7 max-w-md text-base leading-relaxed text-white/70">A few details help TRNDO find opportunities that actually fit the way you work.</p></div></div>
        <div className="relative text-xs text-white/55">Step {step} of 3 · You can update this later.</div>
      </div>
      <div className="flex items-center px-6 py-12 sm:px-12 lg:px-20"><form onSubmit={submit} className="mx-auto w-full max-w-xl">
        <div className="mb-10 lg:hidden"><span className="text-xl font-black">TRNDO<span className="text-[#0C3D2D]">.</span>AI</span></div>
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-[#0C3D2D]">Step {step} of 3</p>
        <h1 className="text-4xl font-black tracking-tight">Set up your shop</h1>
        <p className="mt-3 mb-10 text-base leading-relaxed text-[#70736F]">This context personalizes trend research and strategy generation.</p>
        {step === 1 && <div className="grid gap-5 sm:grid-cols-2"><Field label="Shop name"><input required value={form.shop_name} onChange={e => update("shop_name", e.target.value)} placeholder="e.g. Aria Menswear" className="auth-input" /></Field><Field label="Category"><input required value={form.category} onChange={e => update("category", e.target.value)} placeholder="e.g. Fashion" className="auth-input" /></Field><Field label="City"><input required value={form.city} onChange={e => update("city", e.target.value)} placeholder="e.g. Kochi" className="auth-input" /></Field><Field label="Region"><input required value={form.region} onChange={e => update("region", e.target.value)} placeholder="e.g. Kerala" className="auth-input" /></Field></div>}
        {step === 2 && <div className="space-y-5"><Field label="What does your shop offer?"><textarea required value={form.description} onChange={e => update("description", e.target.value)} placeholder="Describe your products or services." className="auth-input min-h-28 resize-y" /></Field><Field label="Who do you serve?"><textarea required value={form.audience_description} onChange={e => update("audience_description", e.target.value)} placeholder="Describe your ideal customer." className="auth-input min-h-28 resize-y" /></Field><Field label="Main product name"><input required value={form.products[0].name} onChange={e => updateProduct("name", e.target.value)} placeholder="e.g. Linen shirt" className="auth-input" /></Field><Field label="Main product description"><textarea required value={form.products[0].description} onChange={e => updateProduct("description", e.target.value)} placeholder="What makes this product useful or distinctive?" className="auth-input min-h-24 resize-y" /></Field></div>}
        {step === 3 && <div className="space-y-5"><Field label="Primary objective"><select value={form.objective} onChange={e => update("objective", e.target.value)} className="auth-input"><option value="increase_qualified_inquiries">Increase qualified inquiries</option><option value="sales">Increase sales</option><option value="awareness">Build awareness</option></select></Field><Field label="Price positioning"><select value={form.price_positioning} onChange={e => update("price_positioning", e.target.value)} className="auth-input"><option value="value">Value</option><option value="mid_range">Mid-range</option><option value="premium">Premium</option></select></Field></div>}
        {error && <p className="mt-5 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <button disabled={busy} className="auth-button mt-8">{busy ? "Saving…" : step < 3 ? "Continue" : "Finish setup"} <span>→</span></button>
      </form></div>
    </section>
  </main>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-2"><span className="text-xs font-bold uppercase tracking-[0.16em] text-[#70736F]">{label}</span>{children}</label>;
}
