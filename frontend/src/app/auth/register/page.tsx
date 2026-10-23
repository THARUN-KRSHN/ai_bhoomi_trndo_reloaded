"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authenticate } from "@/lib/api/client";

export default function RegisterPage() {
  const router = useRouter(); const [phone, setPhone] = useState(""); const [pin, setPin] = useState(""); const [confirm, setConfirm] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) { event.preventDefault(); if (pin !== confirm) { setError("PINs do not match."); return; } setBusy(true); setError(""); try { await authenticate("/api/v1/auth/register", phone, pin); router.push("/onboarding"); } catch (err) { setError(err instanceof Error ? err.message : "Registration failed."); } finally { setBusy(false); } }
  return <main className="min-h-screen flex items-center justify-center bg-[#F5F5F2] p-6"><section className="w-full max-w-md rounded-[28px] bg-white p-8"><div className="mb-8 font-black">TRNDO<span className="text-[#0C3D2D]">.</span>AI</div><h1 className="text-3xl font-black">Create your account</h1><p className="mt-2 mb-8 text-sm text-[#70736F]">Use a phone number and secure numeric PIN.</p><form onSubmit={submit} className="space-y-4"><input required value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 phone number" className="w-full rounded-2xl border p-3" /><input required minLength={6} maxLength={12} pattern="\d*" type="password" value={pin} onChange={e => setPin(e.target.value)} placeholder="PIN" className="w-full rounded-2xl border p-3" /><input required minLength={6} maxLength={12} pattern="\d*" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Confirm PIN" className="w-full rounded-2xl border p-3" />{error && <p className="text-sm text-red-700">{error}</p>}<button disabled={busy} className="w-full rounded-full bg-[#0C3D2D] p-3 font-bold text-[#70F0A6]">{busy ? "Creating…" : "Create account"}</button><p className="text-center text-sm text-[#70736F]">Already registered? <Link className="font-bold text-[#0C3D2D]" href="/auth/login">Sign in</Link></p></form></section></main>;
}
