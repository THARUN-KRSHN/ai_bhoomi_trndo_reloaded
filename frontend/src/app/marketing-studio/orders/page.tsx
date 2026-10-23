"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, CircleAlert } from "lucide-react";
import { ENABLE_DEMO_DATA, getPaymentInstructions, transitionOrder } from "@/lib/api/client";
import { Order, OrderStatus } from "@/lib/api/types";

const demoOrders: Order[] = [
  { order_id: "demo-order-1042", merchant_id: "development-merchant", status: "pending_confirmation", product_name: "Minimal celebration cake", quantity: 1, unit_price: 1200, total_amount: 1200, currency: "INR", payment_status: "pending" },
  { order_id: "demo-order-1041", merchant_id: "development-merchant", status: "awaiting_payment", product_name: "Custom bento cake", quantity: 2, unit_price: 850, total_amount: 1700, currency: "INR", payment_status: "pending" },
];

const labels: Record<OrderStatus, string> = { inquiry: "Inquiry", pending_confirmation: "New request", confirmed: "Confirmed", awaiting_payment: "Payment pending", payment_reported: "Payment reported", paid: "Paid", ready: "Ready", fulfilled: "Completed", rejected: "Rejected", cancelled: "Cancelled" };

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>(ENABLE_DEMO_DATA ? demoOrders : []);
  const [notice, setNotice] = useState("");
  async function confirm(order: Order) {
    setNotice("");
    try {
      const next = ENABLE_DEMO_DATA ? { ...order, status: "confirmed" as OrderStatus } : await transitionOrder(order.order_id, "confirmed");
      setOrders((current) => current.map((item) => item.order_id === order.order_id ? next : item));
      setNotice("Order status updated.");
    } catch (err) { setNotice(err instanceof Error ? err.message : "Could not update this order."); }
  }
  async function payment(order: Order) {
    try {
      if (ENABLE_DEMO_DATA) { setNotice("Demo payment instructions are not connected to a real payment."); return; }
      const response = await getPaymentInstructions(order.order_id);
      setNotice(`Payment instructions ready: ${response.verification_note}`);
    } catch (err) { setNotice(err instanceof Error ? err.message : "Payment instructions unavailable."); }
  }
  return <div className="space-y-8"><div><span className="eyebrow">Marketing Studio</span><h1 className="mt-2 text-4xl font-black tracking-tight">Orders</h1><p className="mt-2 text-sm text-brand-muted">Keep enquiries moving without losing the payment boundary.</p></div>{ENABLE_DEMO_DATA && <div className="flex gap-2 rounded-2xl bg-amber-50 p-4 text-xs font-semibold text-amber-900"><CircleAlert size={16} /> Demo orders are clearly labelled and never mutate real backend records.</div>}{!ENABLE_DEMO_DATA && orders.length === 0 ? <div className="rounded-[26px] border border-dashed border-brand-border bg-white p-16 text-center text-sm text-brand-muted">Order listing is not available from the current backend contract. Open an order from a Telegram enquiry or use the API.</div> : <div className="overflow-hidden rounded-[26px] border border-brand-border bg-white"><div className="hidden grid-cols-[1.1fr_1.5fr_.6fr_.8fr_1fr_1fr] gap-4 border-b border-brand-border bg-brand-bg px-6 py-4 text-[10px] font-black uppercase tracking-wider text-brand-muted md:grid"><span>Reference</span><span>Product</span><span>Qty</span><span>Total</span><span>Status</span><span>Action</span></div>{orders.map((order) => <div key={order.order_id} className="grid gap-4 border-b border-brand-border px-6 py-5 last:border-0 md:grid-cols-[1.1fr_1.5fr_.6fr_.8fr_1fr_1fr] md:items-center"><div><span className="text-xs font-black">{order.order_id}</span><span className="mt-1 block text-[10px] text-brand-muted">Demo request</span></div><span className="text-sm font-semibold">{order.product_name}</span><span className="text-sm">{order.quantity}</span><span className="text-sm font-black">{order.total_amount ? `₹${order.total_amount}` : "To confirm"}</span><span className="w-fit rounded-full bg-brand-pale-mint px-3 py-1 text-[10px] font-bold text-brand-forest">{labels[order.status]}</span><div className="flex flex-wrap gap-2">{order.status === "pending_confirmation" && <button onClick={() => confirm(order)} className="rounded-full bg-brand-forest px-3 py-2 text-[10px] font-bold text-brand-mint">Confirm</button>}{(order.status === "confirmed" || order.status === "awaiting_payment") && <button onClick={() => payment(order)} className="rounded-full border border-brand-border px-3 py-2 text-[10px] font-bold">Payment QR</button>}<Link href={`/marketing-studio/orders/${order.order_id}`} className="rounded-full p-2 text-brand-forest"><ArrowRight size={14} /></Link></div></div>)}</div>}{notice && <p role="status" className="flex items-center gap-2 text-xs font-bold text-brand-forest"><CheckCircle2 size={15} /> {notice}</p>}</div>;
}
