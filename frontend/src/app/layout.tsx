import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { StrategyProvider } from "@/context/StrategyContext";
import { AuthProvider } from "@/context/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TRNDO AI — Market Strategy Studio",
  description:
    "Evidence-backed market strategy generation for local businesses. Powered by Tavily market discovery, deterministic scoring, and structured intelligence.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#F5F5F2] text-[#111211]">
        <AuthProvider><StrategyProvider>{children}</StrategyProvider></AuthProvider>
      </body>
    </html>
  );
}
