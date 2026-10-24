"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  MessageCircle,
  ArrowRight,
  Send,
  Loader2,
  CheckCircle2,
  CircleAlert,
  ShoppingBag,
  Clock,
  Sparkles,
} from "lucide-react";
import {
  getTelegramConversations,
  replyTelegramConversation,
  getTelegramLinkToken,
  ENABLE_DEMO_DATA,
} from "@/lib/api/client";

interface Conversation {
  conversation_id: string;
  order_id: string;
  chat_id: string;
  customer_name: string;
  product_name: string;
  last_message: string;
  updated_at: string;
  status: string;
  messages?: Array<{
    sender: "customer" | "merchant";
    text: string;
    timestamp: string;
  }>;
}

const DEMO_CONVERSATIONS: Conversation[] = [
  {
    conversation_id: "demo-conv-101",
    order_id: "demo-order-1042",
    chat_id: "chat-9871",
    customer_name: "Ananya Nair",
    product_name: "Minimalist Korean Bento Cake",
    last_message: "Hi! Can you do pastel green frosting with custom lettering for Saturday?",
    updated_at: "Just now",
    status: "active",
    messages: [
      {
        sender: "customer",
        text: "Hi! Saw your promotional poster on Instagram.",
        timestamp: "10:14 AM",
      },
      {
        sender: "customer",
        text: "Can you do pastel green frosting with custom lettering for Saturday?",
        timestamp: "10:15 AM",
      },
    ],
  },
  {
    conversation_id: "demo-conv-102",
    order_id: "demo-order-1041",
    chat_id: "chat-9872",
    customer_name: "Rahul Verma",
    product_name: "Artisanal Celebration Sourdough Hamper",
    last_message: "Is delivery available to Kakkanad on Friday morning?",
    updated_at: "2h ago",
    status: "active",
    messages: [
      {
        sender: "customer",
        text: "Is delivery available to Kakkanad on Friday morning?",
        timestamp: "08:30 AM",
      },
    ],
  },
];

export default function InboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");
  const [errorNotice, setErrorNotice] = useState("");
  const [isLinked, setIsLinked] = useState(false);
  const [linkToken, setLinkToken] = useState("");
  const [deepLink, setDeepLink] = useState("");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const res = await getTelegramConversations();
        setIsLinked(res.linked);
        if (res.conversations && res.conversations.length > 0) {
          setConversations(res.conversations);
          setSelectedConv(res.conversations[0]);
        } else if (ENABLE_DEMO_DATA) {
          setConversations(DEMO_CONVERSATIONS);
          setSelectedConv(DEMO_CONVERSATIONS[0]);
        } else {
          setConversations([]);
        }
      } catch {
        if (ENABLE_DEMO_DATA) {
          setConversations(DEMO_CONVERSATIONS);
          setSelectedConv(DEMO_CONVERSATIONS[0]);
        }
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedConv) return;

    setSending(true);
    setNotice("");
    setErrorNotice("");

    try {
      if (selectedConv.conversation_id.startsWith("demo-")) {
        // Local demo update
        const newMsg = {
          sender: "merchant" as const,
          text: replyText.trim(),
          timestamp: "Just now",
        };
        const updatedList = conversations.map((c) => {
          if (c.conversation_id === selectedConv.conversation_id) {
            return {
              ...c,
              last_message: replyText.trim(),
              messages: [...(c.messages || []), newMsg],
            };
          }
          return c;
        });
        setConversations(updatedList);
        setSelectedConv({
          ...selectedConv,
          last_message: replyText.trim(),
          messages: [...(selectedConv.messages || []), newMsg],
        });
        setNotice("Reply recorded (Demo Mode).");
      } else {
        await replyTelegramConversation(selectedConv.conversation_id, selectedConv.chat_id, replyText.trim());
        const newMsg = {
          sender: "merchant" as const,
          text: replyText.trim(),
          timestamp: "Just now",
        };
        setSelectedConv({
          ...selectedConv,
          messages: [...(selectedConv.messages || []), newMsg],
        });
        setNotice("Message dispatched to customer's Telegram.");
      }
      setReplyText("");
    } catch (err: unknown) {
      setErrorNotice(err instanceof Error ? err.message : "Failed to dispatch reply.");
    } finally {
      setSending(false);
    }
  };

  const handleGenerateLink = async () => {
    try {
      const res = await getTelegramLinkToken("merchant");
      setLinkToken(res.token);
      setDeepLink(res.deep_link);
    } catch {
      setLinkToken("TRNDO-DEMO-LINK");
      setDeepLink("https://t.me/trndo_bot?start=merchant_demo");
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#70736F] block">
            Customer Enquiries &amp; Telegram Orders
          </span>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-[#111211]">
            Telegram Inbox
          </h1>
          <p className="mt-1 text-xs text-[#70736F]">
            Direct customer conversations originating from your promotional campaigns and posters.
          </p>
        </div>

        {!isLinked && (
          <button
            onClick={handleGenerateLink}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#E4E6E1] bg-white hover:bg-[#F4F4F1] text-xs font-bold text-[#111211] transition-all"
          >
            <Send className="w-3.5 h-3.5 text-[#0C3D2D]" />
            <span>Link Telegram Bot</span>
          </button>
        )}
      </div>

      {/* Telegram Link Banner if token generated */}
      {linkToken && (
        <div className="p-4 rounded-2xl bg-[#E3FAEC] border border-[#70F0A6]/50 text-[#0C3D2D] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="font-bold block">One-time Bot Linking Code: {linkToken}</span>
            <span className="text-[11px] text-[#0C3D2D]/80">
              Open Telegram and send this code to connect your live chat.
            </span>
          </div>
          <a
            href={deepLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0C3D2D] text-[#70F0A6] text-xs font-bold shrink-0"
          >
            Open Bot in Telegram <ArrowRight size={12} />
          </a>
        </div>
      )}

      {ENABLE_DEMO_DATA && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold">
          <CircleAlert size={14} className="shrink-0" />
          <span>
            Demonstration conversations active. Incoming Telegram inquiries will automatically appear here.
          </span>
        </div>
      )}

      {/* Main Inbox Interface: Left Conversations List, Right Active Chat */}
      {loading ? (
        <div className="flex h-72 items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#0C3D2D]" />
        </div>
      ) : conversations.length === 0 ? (
        <div className="rounded-[26px] border border-dashed border-[#E4E6E1] bg-white p-12 text-center">
          <MessageCircle className="mx-auto text-[#70736F]" size={32} />
          <h2 className="mt-4 text-base font-black text-[#111211]">No enquiries received yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-xs text-[#70736F]">
            When customers discover your posters and message your Telegram bot, their enquiries and order requests will appear here.
          </p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[340px_1fr] gap-6 items-start">
          {/* Conversation List */}
          <div className="rounded-[26px] border border-[#E4E6E1] bg-white p-3 space-y-2">
            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#70736F] border-b border-[#E4E6E1]">
              Recent Conversations ({conversations.length})
            </div>

            <div className="space-y-1.5">
              {conversations.map((c) => {
                const isSelected = selectedConv?.conversation_id === c.conversation_id;
                return (
                  <button
                    key={c.conversation_id}
                    onClick={() => setSelectedConv(c)}
                    className={`w-full text-left p-3 rounded-2xl transition-all ${
                      isSelected
                        ? "bg-[#0C3D2D] text-white shadow-xs"
                        : "hover:bg-[#F4F4F1] text-[#111211]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs truncate">{c.customer_name}</span>
                      <span
                        className={`text-[10px] flex items-center gap-1 ${
                          isSelected ? "text-[#70F0A6]" : "text-[#70736F]"
                        }`}
                      >
                        <Clock size={10} />
                        {c.updated_at}
                      </span>
                    </div>

                    <span
                      className={`block text-[11px] font-medium truncate mt-0.5 ${
                        isSelected ? "text-[#70F0A6]" : "text-[#0C3D2D]"
                      }`}
                    >
                      {c.product_name}
                    </span>

                    <p
                      className={`mt-1 text-[11px] line-clamp-1 ${
                        isSelected ? "text-white/80" : "text-[#70736F]"
                      }`}
                    >
                      {c.last_message}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Chat Detail */}
          {selectedConv && (
            <div className="rounded-[26px] border border-[#E4E6E1] bg-white flex flex-col h-[520px] overflow-hidden shadow-xs">
              {/* Chat Header */}
              <div className="p-4 sm:p-5 border-b border-[#E4E6E1] flex items-center justify-between bg-[#FAFAF8]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#0C3D2D] text-[#70F0A6] flex items-center justify-center font-bold text-xs">
                    {selectedConv.customer_name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xs font-black text-[#111211]">
                      {selectedConv.customer_name}
                    </h2>
                    <span className="text-[11px] font-semibold text-[#0C3D2D] block">
                      Interested in: {selectedConv.product_name}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/marketing-studio/orders`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F4F4F1] hover:bg-[#E8EAE5] text-[#111211] text-[11px] font-bold border border-[#E4E6E1] transition-colors"
                  >
                    <ShoppingBag size={12} className="text-[#0C3D2D]" />
                    <span>View Orders</span>
                  </Link>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 p-5 overflow-y-auto space-y-3 bg-[#F4F4F1]/30">
                <div className="text-center my-2">
                  <span className="px-3 py-1 rounded-full bg-white border border-[#E4E6E1] text-[10px] text-[#70736F] font-semibold">
                    Enquiry initiated via Telegram
                  </span>
                </div>

                {selectedConv.messages?.map((msg, i) => {
                  const isMerchant = msg.sender === "merchant";
                  return (
                    <div
                      key={i}
                      className={`flex flex-col ${isMerchant ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed ${
                          isMerchant
                            ? "bg-[#0C3D2D] text-white rounded-br-xs"
                            : "bg-white border border-[#E4E6E1] text-[#111211] rounded-bl-xs shadow-xs"
                        }`}
                      >
                        {msg.text}
                      </div>
                      <span className="text-[10px] text-[#70736F] mt-1 px-1">{msg.timestamp}</span>
                    </div>
                  );
                })}

                {notice && (
                  <div className="flex items-center gap-1.5 text-[11px] text-[#0C3D2D] font-bold mt-2">
                    <CheckCircle2 size={12} />
                    <span>{notice}</span>
                  </div>
                )}
                {errorNotice && (
                  <div className="flex items-center gap-1.5 text-[11px] text-red-600 font-bold mt-2">
                    <CircleAlert size={12} />
                    <span>{errorNotice}</span>
                  </div>
                )}
              </div>

              {/* Chat Reply Form */}
              <form onSubmit={handleSendReply} className="p-3 border-t border-[#E4E6E1] bg-white flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type a reply to send to the customer on Telegram..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-full border border-[#E4E6E1] bg-[#F4F4F1] text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0C3D2D]"
                />
                <button
                  type="submit"
                  disabled={sending || !replyText.trim()}
                  className="px-4 py-2.5 rounded-full bg-[#0C3D2D] hover:bg-[#124d3a] text-[#70F0A6] text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                >
                  {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  <span>Reply</span>
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
