"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authenticate } from "@/lib/api/client";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "../login/page";

export default function RegisterPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (pin !== confirm) {
      setError("PINs do not match.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await authenticate("/api/v1/auth/register", phone, pin);
      await refreshUser();
      router.push("/onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setBusy(false);
    }
  }
  return <main className="min-h-screen bg-[#F5F5F2] p-0 sm:p-5 lg:p-8"><section className="mx-auto grid min-h-[calc(100vh-2.5rem)] max-w-[1440px] overflow-hidden rounded-none bg-white shadow-sm sm:rounded-[32px] lg:grid-cols-2"><div className="relative hidden overflow-hidden bg-[linear-gradient(145deg,#062e25_0%,#0c3d2d_48%,#1d7652_100%)] p-10 text-white lg:flex lg:flex-col lg:justify-between"><div className="absolute inset-0 opacity-25 [background-image:radial-gradient(rgba(255,255,255,.35)_1px,transparent_1px)] [background-size:7px_7px]" /><div className="relative"><Logo /><div className="mt-28 max-w-lg"><p className="mb-5 text-xs font-bold uppercase tracking-[0.22em] text-[#70F0A6]">Build from signal.</p><h2 className="text-6xl font-black leading-[0.98] tracking-[-0.06em]">Make your<br /><span className="text-[#70F0A6]">next move.</span></h2><p className="mt-7 max-w-md text-base leading-relaxed text-white/70">Create a focused workspace for your shop, your customers, and your next opportunity.</p></div></div><span className="relative text-xs text-white/55">Market intelligence for the real world.</span></div><div className="flex items-center px-6 py-12 sm:px-12 lg:px-20"><div className="mx-auto w-full max-w-md"><div className="mb-10 lg:hidden"><span className="text-xl font-black">TRNDO<span className="text-[#0C3D2D]">.</span>AI</span></div><p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-[#0C3D2D]">Start with clarity.</p><h1 className="text-4xl font-black tracking-tight">Create your account</h1><p className="mt-3 mb-10 text-base text-[#70736F]">Use a phone number and secure numeric PIN.</p><form onSubmit={submit} className="space-y-5"><label className="block space-y-2"><span className="text-xs font-bold uppercase tracking-[0.16em] text-[#70736F]">Phone number</span><input required value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" className="auth-input" /></label><label className="block space-y-2"><span className="text-xs font-bold uppercase tracking-[0.16em] text-[#70736F]">Create PIN</span><input required minLength={6} maxLength={12} pattern="\d*" type="password" value={pin} onChange={e => setPin(e.target.value)} placeholder="6–12 digits" className="auth-input" /></label><label className="block space-y-2"><span className="text-xs font-bold uppercase tracking-[0.16em] text-[#70736F]">Confirm PIN</span><input required minLength={6} maxLength={12} pattern="\d*" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repeat your PIN" className="auth-input" /></label>{error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}<button disabled={busy} className="auth-button">{busy ? "Creating…" : "Create account"} <span>→</span></button><p className="text-center text-sm text-[#70736F]">Already registered? <Link className="font-bold text-[#0C3D2D] hover:underline" href="/auth/login">Sign in</Link></p></form></div></div></section></main>;
}
