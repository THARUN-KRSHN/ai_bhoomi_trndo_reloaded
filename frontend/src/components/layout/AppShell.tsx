"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  LineChart,
  Compass,
  Sparkles,
  ImagePlus,
  MessageCircle,
  ShoppingBag,
  Settings,
  LogOut,
  ChevronRight,
  Menu,
  X,
  Store,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getProfile } from "@/lib/api/client";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, loading } = useAuth();
  const [shopName, setShopName] = useState<string>("My Shop");
  const [shopCity, setShopCity] = useState<string>("Kerala");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  useEffect(() => {
    // If auth state resolved and no user, redirect to login
    if (!loading && !user && typeof window !== "undefined") {
      const token = sessionStorage.getItem("trndo_access_token");
      if (!token) {
        router.push("/auth/login");
        return;
      }
    }

    // Load shop profile context for the header
    getProfile()
      .then((res) => {
        if (res?.profile) {
          if (res.profile.shop_name) setShopName(String(res.profile.shop_name));
          if (res.profile.city) setShopCity(String(res.profile.city));
        }
      })
      .catch(() => {});
  }, [user, loading, router]);

  const navItems = [
    { label: "Home", href: "/app", icon: Home },
    { label: "Trend Finder", href: "/trends", icon: LineChart },
    { label: "Market Strategy", href: "/market-strategy", icon: Compass },
    { label: "Market Studio", href: "/marketing-studio", icon: Sparkles },
    { label: "My Creations", href: "/marketing-studio/creations", icon: ImagePlus },
    { label: "Telegram Inbox", href: "/marketing-studio/inbox", icon: MessageCircle },
    { label: "Orders", href: "/marketing-studio/orders", icon: ShoppingBag },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-[#F4F4F1] text-[#111211] flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#FFFFFF] border-b border-[#E4E6E1] px-4 sm:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-[#70736F] hover:text-[#111211]"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link href="/app" className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-[#0C3D2D] flex items-center justify-center text-[#70F0A6]">
              <span className="font-black text-xs tracking-tighter">TR</span>
            </div>
            <span className="font-black text-base tracking-tight text-[#111211]">
              TRNDO<span className="text-[#0C3D2D]">.AI</span>
            </span>
          </Link>

          <div className="hidden sm:flex items-center space-x-2 pl-4 border-l border-[#E4E6E1] text-xs font-semibold text-[#70736F]">
            <Store className="w-3.5 h-3.5 text-[#0C3D2D]" />
            <span className="text-[#111211] font-bold">{shopName}</span>
            <span>·</span>
            <span>{shopCity}</span>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center space-x-3">
          <Link
            href="/trends"
            className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#F4F4F1] hover:bg-[#E8EAE5] text-xs font-medium text-[#70736F] border border-[#E4E6E1] transition-colors"
          >
            <span>Quick Trend Search</span>
          </Link>

          {/* User profile dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F4F4F1] hover:bg-[#E8EAE5] border border-[#E4E6E1] transition-colors text-xs font-semibold"
            >
              <div className="w-6 h-6 rounded-full bg-[#0C3D2D] text-[#70F0A6] flex items-center justify-center font-bold text-[10px]">
                {shopName ? shopName.slice(0, 1).toUpperCase() : "U"}
              </div>
              <span className="hidden sm:inline text-[#111211]">
                {user?.phone_number || "Merchant"}
              </span>
            </button>

            {profileMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#FFFFFF] border border-[#E4E6E1] shadow-xl py-2 z-50 text-xs">
                <div className="px-4 py-2 border-b border-[#E4E6E1]">
                  <p className="font-bold text-[#111211] truncate">{shopName}</p>
                  <p className="text-[#70736F] truncate">{user?.phone_number || "Active Session"}</p>
                </div>

                <Link
                  href="/settings"
                  onClick={() => setProfileMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-[#111211] hover:bg-[#F4F4F1] transition-colors"
                >
                  <Settings className="w-3.5 h-3.5 text-[#70736F]" />
                  <span>Profile & Settings</span>
                </Link>

                <Link
                  href="/marketing-studio/inbox"
                  onClick={() => setProfileMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-[#111211] hover:bg-[#F4F4F1] transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-[#70736F]" />
                  <span>Telegram Enquiries</span>
                </Link>

                <div className="border-t border-[#E4E6E1] my-1" />

                <button
                  type="button"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors text-left font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Layout: Sidebar + Page Content */}
      <div className="flex-1 flex max-w-[1440px] w-full mx-auto">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 border-r border-[#E4E6E1] bg-[#FFFFFF] p-6 justify-between shrink-0">
          <div className="space-y-6">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#70736F] px-3 block mb-2">
                Workspace
              </span>
              {navItems.slice(0, 4).map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== "/app" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                      isActive
                        ? "bg-[#0C3D2D] text-[#70F0A6] shadow-xs"
                        : "text-[#70736F] hover:text-[#111211] hover:bg-[#F4F4F1]"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="space-y-1 pt-4 border-t border-[#E4E6E1]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#70736F] px-3 block mb-2">
                Assets & Orders
              </span>
              {navItems.slice(4).map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                      isActive
                        ? "bg-[#0C3D2D] text-[#70F0A6] shadow-xs"
                        : "text-[#70736F] hover:text-[#111211] hover:bg-[#F4F4F1]"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Sidebar Bottom Box */}
          <div className="p-4 rounded-2xl bg-[#E3FAEC] border border-[#70F0A6]/40 text-[#0C3D2D] space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider block">Connected Suite</span>
            <p className="text-[11px] leading-relaxed">
              Trends &rarr; Strategy &rarr; Studio &rarr; Telegram Orders
            </p>
          </div>
        </aside>

        {/* Mobile Flyout Menu */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-xs"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative w-72 max-w-xs bg-white h-full p-6 shadow-2xl flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-[#E4E6E1]">
                  <span className="font-black text-lg text-[#111211]">TRNDO AI</span>
                  <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-[#70736F]">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold ${
                          isActive
                            ? "bg-[#0C3D2D] text-[#70F0A6]"
                            : "text-[#70736F] hover:text-[#111211] hover:bg-[#F4F4F1]"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2 text-xs font-bold text-red-600 hover:underline pt-4 border-t border-[#E4E6E1]"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 p-4 sm:p-8 lg:p-10 pb-24 lg:pb-10">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (per Section 7) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E4E6E1] px-2 py-2 flex items-center justify-around text-[10px] font-bold text-[#70736F]">
        <Link
          href="/app"
          className={`flex flex-col items-center gap-1 p-2 ${
            pathname === "/app" ? "text-[#0C3D2D]" : "hover:text-[#111211]"
          }`}
        >
          <Home className="w-4 h-4" />
          <span>Home</span>
        </Link>
        <Link
          href="/trends"
          className={`flex flex-col items-center gap-1 p-2 ${
            pathname.startsWith("/trends") ? "text-[#0C3D2D]" : "hover:text-[#111211]"
          }`}
        >
          <LineChart className="w-4 h-4" />
          <span>Trends</span>
        </Link>
        <Link
          href="/market-strategy"
          className={`flex flex-col items-center gap-1 p-2 ${
            pathname.startsWith("/market-strategy") ? "text-[#0C3D2D]" : "hover:text-[#111211]"
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Strategy</span>
        </Link>
        <Link
          href="/marketing-studio"
          className={`flex flex-col items-center gap-1 p-2 ${
            pathname.startsWith("/marketing-studio") && !pathname.includes("orders")
              ? "text-[#0C3D2D]"
              : "hover:text-[#111211]"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Studio</span>
        </Link>
        <Link
          href="/marketing-studio/orders"
          className={`flex flex-col items-center gap-1 p-2 ${
            pathname.includes("orders") ? "text-[#0C3D2D]" : "hover:text-[#111211]"
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Orders</span>
        </Link>
      </nav>
    </div>
  );
}
