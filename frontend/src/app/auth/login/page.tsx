"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authenticate } from "@/lib/api/client";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter(); const { } = useAuth();
  const [phone, setPhone] = useState(""); const [pin, setPin] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setError(""); setBusy(true);
    try { const result = await authenticate("/api/v1/auth/login", phone, pin); router.push(result.onboarding_complete ? "/market-strategy" : "/onboarding"); }
    catch { setError("Phone number or PIN is incorrect."); } finally { setBusy(false); }
  }
  return <AuthShell title="Welcome back" subtitle="Sign in to continue your market workflow."><form onSubmit={submit} className="space-y-4">
    <input required value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 phone number" className="w-full rounded-2xl border p-3" />
    <input required minLength={6} maxLength={12} pattern="\d*" type="password" value={pin} onChange={e => setPin(e.target.value)} placeholder="PIN" className="w-full rounded-2xl border p-3" />
    {error && <p className="text-sm text-red-700">{error}</p>}<button disabled={busy} className="w-full rounded-full bg-[#0C3D2D] p-3 font-bold text-[#70F0A6]">{busy ? "Signing in…" : "Sign in"}</button>
    <p className="text-center text-sm text-[#70736F]">New to TRNDO? <Link className="font-bold text-[#0C3D2D]" href="/auth/register">Create an account</Link></p>
  </form></AuthShell>;
}

function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return <main className="min-h-screen flex items-center justify-center bg-[#F5F5F2] p-6"><section className="w-full max-w-md rounded-[28px] bg-white p-8 shadow-sm"><div className="mb-8"><div className="mb-5 font-black tracking-tight">TRNDO<span className="text-[#0C3D2D]">.</span>AI</div><h1 className="text-3xl font-black">{title}</h1><p className="mt-2 text-sm text-[#70736F]">{subtitle}</p></div>{children}</section></main>;
}
