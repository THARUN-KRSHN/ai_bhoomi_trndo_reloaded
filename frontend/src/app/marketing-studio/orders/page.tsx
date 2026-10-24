"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Loader2,
  QrCode,
  ShoppingBag,
  Plus,
  RefreshCw,
  X,
  CreditCard,
  Copy,
  ExternalLink,
} from "lucide-react";
import {
  listOrders,
  createOrder,
  transitionOrder,
  getPaymentInstructions,
  ENABLE_DEMO_DATA,
} from "@/lib/api/client";
import { Order, OrderStatus } from "@/lib/api/types";

const STATUS_LABELS: Record<OrderStatus, string> = {
  inquiry: "Inquiry",
  pending_confirmation: "Pending Confirmation",
  confirmed: "Confirmed",
  awaiting_payment: "Awaiting Payment",
  payment_reported: "Payment Reported",
  paid: "Paid",
  ready: "Ready for Delivery",
  fulfilled: "Fulfilled",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [errorNotice, setErrorNotice] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Payment QR Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [activePaymentOrder, setActivePaymentOrder] = useState<Order | null>(null);
  const [paymentInstructions, setPaymentInstructions] = useState<{
    order_id: string;
    upi_uri: string;
    qr_url: string;
    verification_note: string;
  } | null>(null);
  const [loadingPayment, setLoadingPayment] = useState(false);

  // New Order Creation Form State
  const [newOrderModalOpen, setNewOrderModalOpen] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [newQuantity, setNewQuantity] = useState("1");
  const [newUnitPrice, setNewUnitPrice] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await listOrders();
      setOrders(data);
    } catch {
      // Fallback
      if (ENABLE_DEMO_DATA) {
        setOrders([
          {
            order_id: "ORD-1042",
            merchant_id: "development-merchant",
            status: "pending_confirmation",
            product_name: "Minimalist Korean Bento Cake",
            quantity: 1,
            unit_price: 1200,
            total_amount: 1200,
            currency: "INR",
            payment_status: "pending",
          },
          {
            order_id: "ORD-1041",
            merchant_id: "development-merchant",
            status: "confirmed",
            product_name: "Artisanal Celebration Sourdough Hamper",
            quantity: 2,
            unit_price: 850,
            total_amount: 1700,
            currency: "INR",
            payment_status: "pending",
          },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleTransition = async (order: Order, nextStatus: OrderStatus) => {
    setNotice("");
    setErrorNotice("");
    try {
      const updated = await transitionOrder(order.order_id, nextStatus);
      setOrders((prev) => prev.map((o) => (o.order_id === order.order_id ? updated : o)));
      setNotice(`Order ${order.order_id} moved to ${STATUS_LABELS[nextStatus]}.`);
    } catch (err: unknown) {
      // In demo mode if transition fails, update locally
      if (ENABLE_DEMO_DATA) {
        setOrders((prev) =>
          prev.map((o) => (o.order_id === order.order_id ? { ...o, status: nextStatus } : o))
        );
        setNotice(`Order ${order.order_id} moved to ${STATUS_LABELS[nextStatus]} (Demo).`);
      } else {
        setErrorNotice(err instanceof Error ? err.message : "Failed to transition order.");
      }
    }
  };

  const handleShowPaymentQR = async (order: Order) => {
    setActivePaymentOrder(order);
    setPaymentModalOpen(true);
    setLoadingPayment(true);
    setPaymentInstructions(null);
    setErrorNotice("");

    try {
      const instructions = await getPaymentInstructions(order.order_id);
      setPaymentInstructions(instructions);
    } catch (err: unknown) {
      if (ENABLE_DEMO_DATA) {
        setPaymentInstructions({
          order_id: order.order_id,
          upi_uri: `upi://pay?pa=trndo.merchant@upi&pn=Merchant&am=${order.total_amount || 1200}&cu=INR&tn=${order.order_id}`,
          qr_url: "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=" + encodeURIComponent(`upi://pay?pa=trndo.merchant@upi&pn=Merchant&am=${order.total_amount || 1200}&cu=INR&tn=${order.order_id}`),
          verification_note: "Verify receipt with your merchant banking application before fulfillment.",
        });
      } else {
        setErrorNotice(err instanceof Error ? err.message : "Could not retrieve UPI instructions.");
      }
    } finally {
      setLoadingPayment(false);
    }
  };

  const handleCreateNewOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim()) return;

    setCreating(true);
    try {
      const created = await createOrder({
        product_name: newProductName.trim(),
        quantity: parseInt(newQuantity) || 1,
        unit_price: newUnitPrice ? parseFloat(newUnitPrice) : undefined,
        fulfillment_notes: newNotes.trim() || undefined,
      });
      setOrders((prev) => [created, ...prev]);
      setNotice(`New order ${created.order_id} created successfully.`);
      setNewOrderModalOpen(false);
      setNewProductName("");
      setNewQuantity("1");
      setNewUnitPrice("");
      setNewNotes("");
    } catch (err: unknown) {
      setErrorNotice(err instanceof Error ? err.message : "Failed to create order.");
    } finally {
      setCreating(false);
    }
  };

  const filteredOrders =
    statusFilter === "all" ? orders : orders.filter((o) => o.status === statusFilter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#70736F] block">
            Order Fulfillment &amp; Payment Verification
          </span>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-[#111211]">
            Customer Orders
          </h1>
          <p className="mt-1 text-xs text-[#70736F]">
            Track Telegram enquiries from initial quote to confirmed UPI payment and delivery.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchOrders}
            className="p-2.5 rounded-full border border-[#E4E6E1] bg-white hover:bg-[#F4F4F1] text-[#70736F] transition-all"
            title="Refresh Orders"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>

          <button
            onClick={() => setNewOrderModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#0C3D2D] hover:bg-[#124d3a] text-[#70F0A6] text-xs font-bold transition-all shadow-xs"
          >
            <Plus size={14} />
            <span>Create Order</span>
          </button>
        </div>
      </div>

      {/* Notices */}
      {notice && (
        <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-[#E3FAEC] border border-[#70F0A6]/40 text-[#0C3D2D] text-xs font-semibold">
          <CheckCircle2 size={15} />
          <span>{notice}</span>
        </div>
      )}
      {errorNotice && (
        <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold">
          <CircleAlert size={15} />
          <span>{errorNotice}</span>
        </div>
      )}

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#E4E6E1]">
        {["all", "pending_confirmation", "confirmed", "awaiting_payment", "paid", "fulfilled"].map(
          (statusKey) => {
            const isActive = statusFilter === statusKey;
            const label = statusKey === "all" ? "All Orders" : STATUS_LABELS[statusKey as OrderStatus] || statusKey;
            return (
              <button
                key={statusKey}
                onClick={() => setStatusFilter(statusKey)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-[#0C3D2D] text-[#70F0A6]"
                    : "bg-white text-[#70736F] hover:text-[#111211] border border-[#E4E6E1]"
                }`}
              >
                {label}
              </button>
            );
          }
        )}
      </div>

      {/* Orders Table / List */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#0C3D2D]" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="rounded-[26px] border border-dashed border-[#E4E6E1] bg-white p-12 text-center">
          <ShoppingBag className="mx-auto text-[#70736F]" size={32} />
          <h2 className="mt-4 text-base font-black text-[#111211]">No orders found</h2>
          <p className="mx-auto mt-2 max-w-sm text-xs text-[#70736F]">
            {statusFilter === "all"
              ? "Create your first order manually or receive one through customer enquiries on Telegram."
              : `No orders currently in "${statusFilter}" state.`}
          </p>
          <button
            onClick={() => setNewOrderModalOpen(true)}
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0C3D2D] text-[#70F0A6] text-xs font-bold"
          >
            <Plus size={14} />
            <span>Create Test Order</span>
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[26px] border border-[#E4E6E1] bg-white shadow-xs">
          {/* Table Header */}
          <div className="hidden lg:grid grid-cols-[1.2fr_1.8fr_.6fr_.8fr_1fr_1.4fr] gap-4 border-b border-[#E4E6E1] bg-[#FAFAF8] px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-[#70736F]">
            <span>Order Reference</span>
            <span>Product</span>
            <span>Qty</span>
            <span>Total</span>
            <span>Current Status</span>
            <span>Actions &amp; Payment</span>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-[#E4E6E1]">
            {filteredOrders.map((order) => {
              return (
                <div
                  key={order.order_id}
                  className="grid gap-3 p-5 sm:px-6 lg:grid-cols-[1.2fr_1.8fr_.6fr_.8fr_1fr_1.4fr] lg:items-center hover:bg-[#F4F4F1]/40 transition-colors"
                >
                  {/* Reference */}
                  <div>
                    <span className="font-mono text-xs font-bold text-[#111211] block">
                      {order.order_id}
                    </span>
                    <span className="text-[10px] text-[#70736F]">
                      Payment: {order.payment_status || "pending"}
                    </span>
                  </div>

                  {/* Product */}
                  <div>
                    <span className="text-xs font-bold text-[#111211] block">
                      {order.product_name}
                    </span>
                    {order.unit_price && (
                      <span className="text-[10px] text-[#70736F]">
                        ₹{order.unit_price} each
                      </span>
                    )}
                  </div>

                  {/* Quantity */}
                  <div className="text-xs font-semibold text-[#111211]">
                    <span className="lg:hidden text-[#70736F] font-normal mr-1">Qty:</span>
                    {order.quantity}
                  </div>

                  {/* Total */}
                  <div className="text-xs font-black text-[#0C3D2D]">
                    <span className="lg:hidden text-[#70736F] font-normal mr-1">Total:</span>
                    ₹{order.total_amount ? order.total_amount.toLocaleString() : "To quote"}
                  </div>

                  {/* Status */}
                  <div>
                    <span className="inline-block px-3 py-1 rounded-full bg-[#E3FAEC] text-[#0C3D2D] text-[10px] font-bold">
                      {STATUS_LABELS[order.status] || order.status}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0">
                    {order.status === "pending_confirmation" && (
                      <button
                        onClick={() => handleTransition(order, "confirmed")}
                        className="px-3 py-1.5 rounded-full bg-[#0C3D2D] text-[#70F0A6] text-[11px] font-bold hover:bg-[#124d3a] transition-all"
                      >
                        Confirm
                      </button>
                    )}

                    {order.status === "confirmed" && (
                      <button
                        onClick={() => handleTransition(order, "awaiting_payment")}
                        className="px-3 py-1.5 rounded-full bg-[#0C3D2D] text-[#70F0A6] text-[11px] font-bold hover:bg-[#124d3a] transition-all"
                      >
                        Request Payment
                      </button>
                    )}

                    {(order.status === "confirmed" || order.status === "awaiting_payment") && (
                      <button
                        onClick={() => handleShowPaymentQR(order)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#0C3D2D] text-[#0C3D2D] bg-[#E3FAEC] text-[11px] font-bold hover:bg-[#70F0A6]/30 transition-all"
                      >
                        <QrCode size={12} />
                        <span>UPI QR</span>
                      </button>
                    )}

                    {order.status === "awaiting_payment" && (
                      <button
                        onClick={() => handleTransition(order, "paid")}
                        className="px-3 py-1.5 rounded-full border border-[#E4E6E1] text-[#111211] hover:bg-[#F4F4F1] text-[11px] font-bold transition-all"
                      >
                        Mark Paid
                      </button>
                    )}

                    {order.status === "paid" && (
                      <button
                        onClick={() => handleTransition(order, "ready")}
                        className="px-3 py-1.5 rounded-full bg-[#0C3D2D] text-[#70F0A6] text-[11px] font-bold hover:bg-[#124d3a] transition-all"
                      >
                        Mark Ready
                      </button>
                    )}

                    {order.status === "ready" && (
                      <button
                        onClick={() => handleTransition(order, "fulfilled")}
                        className="px-3 py-1.5 rounded-full bg-emerald-700 text-white text-[11px] font-bold hover:bg-emerald-800 transition-all"
                      >
                        Complete Delivery
                      </button>
                    )}

                    <Link
                      href={`/marketing-studio/orders/${order.order_id}`}
                      className="p-1.5 text-[#70736F] hover:text-[#111211] rounded-full hover:bg-[#F4F4F1] transition-colors"
                      title="View Details"
                    >
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* UPI Payment Instructions Modal */}
      {paymentModalOpen && activePaymentOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-[28px] border border-[#E4E6E1] bg-white p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#70736F] block">
                  Payment Instructions
                </span>
                <h2 className="text-xl font-black text-[#111211]">
                  Order {activePaymentOrder.order_id}
                </h2>
              </div>
              <button
                onClick={() => setPaymentModalOpen(false)}
                className="p-1.5 rounded-full text-[#70736F] hover:bg-[#F4F4F1]"
              >
                <X size={18} />
              </button>
            </div>

            {loadingPayment ? (
              <div className="flex h-56 items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#0C3D2D]" />
              </div>
            ) : paymentInstructions ? (
              <div className="space-y-4 text-center">
                {/* QR Code Container */}
                <div className="mx-auto w-52 h-52 p-3 rounded-2xl bg-white border border-[#E4E6E1] shadow-sm flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={paymentInstructions.qr_url}
                    alt="UPI Payment QR Code"
                    className="w-full h-full object-contain"
                  />
                </div>

                <div>
                  <span className="text-2xl font-black text-[#0C3D2D] block">
                    ₹{activePaymentOrder.total_amount?.toLocaleString() || "0"}
                  </span>
                  <span className="text-xs font-semibold text-[#111211]">
                    For: {activePaymentOrder.product_name}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#F4F4F1] text-left space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#70736F] block">
                    UPI Intent URI
                  </span>
                  <p className="font-mono text-[11px] text-[#111211] break-all select-all">
                    {paymentInstructions.upi_uri}
                  </p>
                </div>

                {/* Honest Verification Notice per Section 12 & 17 */}
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-left text-[11px] leading-relaxed font-medium">
                  <strong>Important:</strong> Generating payment instructions does not mark the order as paid. Verify payment in your merchant bank account or UPI app before fulfilling this order.
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(paymentInstructions.upi_uri);
                      setNotice("UPI URI copied to clipboard.");
                      setPaymentModalOpen(false);
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full border border-[#E4E6E1] text-xs font-bold hover:bg-[#F4F4F1]"
                  >
                    <Copy size={13} />
                    <span>Copy UPI URI</span>
                  </button>

                  <button
                    onClick={() => setPaymentModalOpen(false)}
                    className="flex-1 px-4 py-2.5 rounded-full bg-[#0C3D2D] text-[#70F0A6] text-xs font-bold hover:bg-[#124d3a]"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-red-600">Failed to load payment instructions.</p>
            )}
          </div>
        </div>
      )}

      {/* Create Order Modal */}
      {newOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-[28px] border border-[#E4E6E1] bg-white p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#70736F] block">
                  New Order Record
                </span>
                <h2 className="text-xl font-black text-[#111211]">Create Order</h2>
              </div>
              <button
                onClick={() => setNewOrderModalOpen(false)}
                className="p-1.5 rounded-full text-[#70736F] hover:bg-[#F4F4F1]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateNewOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#111211] mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Minimalist Bento Cake"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E4E6E1] bg-[#F4F4F1] text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0C3D2D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#111211] mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E4E6E1] bg-[#F4F4F1] text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0C3D2D]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#111211] mb-1">Unit Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 1200"
                    value={newUnitPrice}
                    onChange={(e) => setNewUnitPrice(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E4E6E1] bg-[#F4F4F1] text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0C3D2D]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111211] mb-1">Fulfillment Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Customer requested Saturday pickup at 11 AM"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E4E6E1] bg-[#F4F4F1] text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0C3D2D]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewOrderModalOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-full border border-[#E4E6E1] text-xs font-bold hover:bg-[#F4F4F1]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newProductName.trim()}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-[#0C3D2D] text-[#70F0A6] text-xs font-bold hover:bg-[#124d3a] disabled:opacity-50"
                >
                  {creating && <Loader2 size={13} className="animate-spin" />}
                  <span>Save Order</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
