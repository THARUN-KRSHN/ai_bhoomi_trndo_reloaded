"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authenticate } from "@/lib/api/client";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter(); const { refreshUser } = useAuth();
  const [phone, setPhone] = useState(""); const [pin, setPin] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setError(""); setBusy(true);
    try {
      const result = await authenticate("/api/v1/auth/login", phone, pin);
      await refreshUser();
      router.push(result.onboarding_complete ? "/app" : "/onboarding");
    }
    catch { setError("Phone number or PIN is incorrect."); } finally { setBusy(false); }
  }
  return <AuthShell eyebrow="Your next move starts here." title="Welcome back" subtitle="Sign in to continue your market workflow."><form onSubmit={submit} className="space-y-5">
    <Field label="Phone number"><input required value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" className="auth-input" /></Field>
    <Field label="PIN"><input required minLength={6} maxLength={12} pattern="\d*" type="password" value={pin} onChange={e => setPin(e.target.value)} placeholder="Enter your PIN" className="auth-input" /></Field>
    {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}<button disabled={busy} className="auth-button">{busy ? "Signing in…" : "Sign in"} <span>→</span></button>
    <p className="text-center text-sm text-[#70736F]">New to TRNDO? <Link className="font-bold text-[#0C3D2D] hover:underline" href="/auth/register">Create an account</Link></p>
  </form></AuthShell>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-2"><span className="text-xs font-bold uppercase tracking-[0.16em] text-[#70736F]">{label}</span>{children}</label>;
}

function AuthShell({ eyebrow, title, subtitle, children }: { eyebrow: string; title: string; subtitle: string; children: React.ReactNode }) {
  return <main className="min-h-screen bg-[#F5F5F2] p-0 sm:p-5 lg:p-8"><section className="mx-auto grid min-h-[calc(100vh-2.5rem)] max-w-[1440px] overflow-hidden rounded-none bg-white shadow-sm sm:rounded-[32px] lg:grid-cols-2">
    <BrandPanel eyebrow={eyebrow} />
    <div className="flex items-center px-6 py-12 sm:px-12 lg:px-20"><div className="mx-auto w-full max-w-md"><div className="mb-10 lg:hidden"><Logo /></div><p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-[#0C3D2D]">{eyebrow}</p><h1 className="text-4xl font-black tracking-tight text-[#111211] sm:text-5xl">{title}</h1><p className="mt-3 mb-10 text-base leading-relaxed text-[#70736F]">{subtitle}</p>{children}</div></div>
  </section></main>;
}

export function Logo() {
  return <div className="text-xl font-black tracking-[-0.06em] text-white">TRNDO<span className="text-[#70F0A6]">.</span>AI</div>;
}

function BrandPanel({ eyebrow }: { eyebrow: string }) {
  return <div className="relative hidden overflow-hidden bg-[linear-gradient(145deg,#062e25_0%,#0c3d2d_48%,#1d7652_100%)] p-10 text-white lg:flex lg:flex-col lg:justify-between"><div className="absolute inset-0 opacity-25 [background-image:radial-gradient(rgba(255,255,255,.35)_1px,transparent_1px)] [background-size:7px_7px]" /><div className="absolute -right-32 top-24 h-96 w-96 rounded-full bg-[#70F0A6]/20 blur-3xl" /><div className="relative"><Logo /><div className="mt-28 max-w-lg"><p className="mb-5 text-xs font-bold uppercase tracking-[0.22em] text-[#70F0A6]">{eyebrow}</p><h2 className="text-6xl font-black leading-[0.98] tracking-[-0.06em]">Turn signals<br />into <span className="text-[#70F0A6]">momentum.</span></h2><p className="mt-7 max-w-md text-base leading-relaxed text-white/70">TRNDO helps local businesses discover what matters, decide what to do next, and move with confidence.</p></div></div><div className="relative flex items-center justify-between text-xs text-white/55"><span>Market intelligence for the real world.</span><span className="rounded-full border border-white/20 px-3 py-1">TRNDO AI</span></div></div>;
}
