"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, ImageOff, Plus, Download, Copy, Check } from "lucide-react";
import { PromotionResponse } from "@/lib/api/types";
import { API_BASE_URL, listPromotions } from "@/lib/api/client";

export default function CreationsPage() {
  const [items, setItems] = useState<PromotionResponse[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    listPromotions(30)
      .then((serverItems) => {
        if (Array.isArray(serverItems) && serverItems.length > 0) {
          setItems(serverItems);
        } else {
          // Check localStorage as fallback
          const local: PromotionResponse[] = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith("trndo-promotion-")) {
              try {
                local.push(JSON.parse(localStorage.getItem(key) || ""));
              } catch {}
            }
          }
          setItems(local.reverse());
        }
      })
      .catch(() => {
        const local: PromotionResponse[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith("trndo-promotion-")) {
            try {
              local.push(JSON.parse(localStorage.getItem(key) || ""));
            } catch {}
          }
        }
        setItems(local.reverse());
      });
  }, []);

  const copyCaption = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow">Marketing Studio</span>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-[#111211]">
            My Creations
          </h1>
          <p className="mt-2 text-sm text-[#70736F]">
            Your strategy-led posters, captions, and campaign assets.
          </p>
        </div>
        <Link
          href="/marketing-studio/create"
          className="inline-flex items-center gap-2 rounded-full bg-[#0C3D2D] px-5 py-3 text-xs font-bold text-[#70F0A6] hover:bg-[#14523E] transition-colors shadow-xs"
        >
          <Plus size={15} /> Create Promotion
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-[#E4E6E1] bg-white p-16 text-center shadow-xs">
          <ImageOff className="mx-auto text-[#70736F]" size={32} />
          <h2 className="mt-4 text-xl font-black text-[#111211]">No creations yet.</h2>
          <p className="mt-2 text-sm text-[#70736F]">
            Generate your first campaign poster from an approved strategy.
          </p>
          <Link
            href="/marketing-studio/create"
            className="mt-6 inline-flex rounded-full bg-[#111211] px-6 py-3 text-xs font-bold text-white hover:bg-[#252825] transition-colors"
          >
            Create Promotion
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const raw = item.asset_urls?.[0];
            const src = raw ? (raw.startsWith("http") ? raw : `${API_BASE_URL}${raw}`) : null;
            return (
              <div
                key={item.promotion_id}
                className="overflow-hidden rounded-[26px] border border-[#E4E6E1] bg-white flex flex-col justify-between shadow-xs hover:border-[#0C3D2D]/40 transition-colors"
              >
                <div className="flex aspect-[4/3] items-center justify-center bg-[#F4F4F1] p-4 relative overflow-hidden">
                  {src ? (
                    <img
                      src={src}
                      alt={item.content?.promotion_title || "Poster"}
                      className="max-h-full max-w-full rounded-xl object-contain shadow-md"
                    />
                  ) : (
                    <div className="flex h-full w-full items-end rounded-xl bg-[#f5eadb] p-5 text-xl font-black leading-tight text-[#111211]">
                      {item.content?.poster_headline || "Make the moment\ntaste beautiful."}
                    </div>
                  )}
                  {item.demo && (
                    <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] text-[10px] font-bold uppercase tracking-wider">
                      Demo
                    </span>
                  )}
                </div>

                <div className="p-5 space-y-3">
                  <div>
                    <h2 className="line-clamp-1 text-sm font-bold text-[#111211]">
                      {item.content?.promotion_title || "Promotional Poster"}
                    </h2>
                    <p className="mt-1 text-[11px] text-[#70736F]">
                      Created {new Date(item.created_at).toLocaleDateString()} · {item.content?.language || "English"}
                    </p>
                  </div>

                  <p className="text-xs text-[#70736F] line-clamp-2 leading-relaxed">
                    {item.content?.primary_caption}
                  </p>

                  <div className="pt-3 border-t border-[#E4E6E1] flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => copyCaption(item.promotion_id, item.content?.primary_caption || "")}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0C3D2D] hover:underline"
                    >
                      {copiedId === item.promotion_id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#0C3D2D]" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Caption</span>
                        </>
                      )}
                    </button>

                    {src && (
                      <a
                        href={src}
                        download={`trndo-${item.promotion_id}.png`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-full bg-[#F4F4F1] hover:bg-[#E8EAE5] text-[#111211] transition-colors"
                        title="Download Asset"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

