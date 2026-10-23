"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { AuthUser, getCurrentUser, logout as apiLogout } from "@/lib/api/client";

type AuthState = { user: AuthUser | null; loading: boolean; logout: () => Promise<void>; refreshUser: () => Promise<AuthUser | null> };
const AuthContext = createContext<AuthState>({ user: null, loading: true, logout: async () => {}, refreshUser: async () => null });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!sessionStorage.getItem("trndo_access_token")) {
      setLoading(false);
      return;
    }
    getCurrentUser().then(setUser).catch(() => setUser(null)).finally(() => setLoading(false));
    const expired = () => setUser(null);
    window.addEventListener("trndo-auth-expired", expired);
    return () => window.removeEventListener("trndo-auth-expired", expired);
  }, []);
  const logout = async () => { await apiLogout().catch(() => {}); setUser(null); };
  const refreshUser = async () => {
    try {
      const current = await getCurrentUser();
      setUser(current);
      return current;
    } catch {
      setUser(null);
      return null;
    }
  };
  return <AuthContext.Provider value={{ user, loading, logout, refreshUser }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
