"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CircleAlert,
  CheckCircle2,
  Loader2,
  QrCode,
  Copy,
  Clock,
  Package,
} from "lucide-react";
import {
  getOrder,
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

function OrderDetailsContent() {
  const params = useParams();
  const orderId = String(params?.id || "");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [errorNotice, setErrorNotice] = useState("");
  const [paymentInstructions, setPaymentInstructions] = useState<{
    order_id: string;
    upi_uri: string;
    qr_url: string;
    verification_note: string;
  } | null>(null);
  const [loadingPayment, setLoadingPayment] = useState(false);

  useEffect(() => {
    async function loadOrder() {
      if (!orderId) return;
      setLoading(true);
      try {
        const data = await getOrder(orderId);
        setOrder(data);
      } catch {
        if (ENABLE_DEMO_DATA) {
          setOrder({
            order_id: orderId,
            merchant_id: "development-merchant",
            status: "confirmed",
            product_name: "Minimalist Korean Bento Cake",
            quantity: 1,
            unit_price: 1200,
            total_amount: 1200,
            currency: "INR",
            payment_status: "pending",
            fulfillment_notes: "Saturday delivery requested with green ribbon",
          });
        } else {
          setErrorNotice("Could not load order details.");
        }
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
  }, [orderId]);

  const handleTransition = async (nextStatus: OrderStatus) => {
    if (!order) return;
    setNotice("");
    setErrorNotice("");
    try {
      const updated = await transitionOrder(order.order_id, nextStatus);
      setOrder(updated);
      setNotice(`Order updated to ${STATUS_LABELS[nextStatus]}.`);
    } catch (err: unknown) {
      if (ENABLE_DEMO_DATA) {
        setOrder({ ...order, status: nextStatus });
        setNotice(`Order updated to ${STATUS_LABELS[nextStatus]} (Demo).`);
      } else {
        setErrorNotice(err instanceof Error ? err.message : "Status update failed.");
      }
    }
  };

  const handleLoadPaymentInstructions = async () => {
    if (!order) return;
    setLoadingPayment(true);
    try {
      const instructions = await getPaymentInstructions(order.order_id);
      setPaymentInstructions(instructions);
    } catch {
      if (ENABLE_DEMO_DATA) {
        setPaymentInstructions({
          order_id: order.order_id,
          upi_uri: `upi://pay?pa=trndo.merchant@upi&pn=Merchant&am=${order.total_amount || 1200}&cu=INR&tn=${order.order_id}`,
          qr_url: "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=" + encodeURIComponent(`upi://pay?pa=trndo.merchant@upi&pn=Merchant&am=${order.total_amount || 1200}&cu=INR&tn=${order.order_id}`),
          verification_note: "Verify receipt with your merchant banking application before fulfillment.",
        });
      }
    } finally {
      setLoadingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-72 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0C3D2D]" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-6">
        <Link
          href="/marketing-studio/orders"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#70736F] hover:text-[#111211]"
        >
          <ArrowLeft size={14} /> Back to Orders
        </Link>
        <div className="rounded-[26px] border border-[#E4E6E1] bg-white p-8 text-center">
          <CircleAlert className="mx-auto text-red-500 mb-2" size={28} />
          <h2 className="text-base font-bold text-[#111211]">Order Not Found</h2>
          <p className="text-xs text-[#70736F] mt-1">Order reference &ldquo;{orderId}&rdquo; does not exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <Link
        href="/marketing-studio/orders"
        className="inline-flex items-center gap-2 text-xs font-bold text-[#70736F] hover:text-[#111211]"
      >
        <ArrowLeft size={14} /> Back to Orders
      </Link>

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

      {/* Main Order Card */}
      <div className="rounded-[28px] border border-[#E4E6E1] bg-white p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#E4E6E1] gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#70736F] block">
              Order Detail
            </span>
            <h1 className="mt-1 text-2xl font-black text-[#111211]">
              Order #{order.order_id}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3.5 py-1.5 rounded-full bg-[#E3FAEC] text-[#0C3D2D] text-xs font-bold">
              {STATUS_LABELS[order.status] || order.status}
            </span>
          </div>
        </div>

        {/* Order Info Bento */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-[#F4F4F1] border border-[#E4E6E1] space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#70736F] block">
              Product &amp; Quantity
            </span>
            <span className="text-sm font-bold text-[#111211] block">{order.product_name}</span>
            <span className="text-xs text-[#70736F]">Quantity: {order.quantity} item(s)</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#F4F4F1] border border-[#E4E6E1] space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#70736F] block">
              Billing &amp; Total
            </span>
            <span className="text-lg font-black text-[#0C3D2D] block">
              ₹{order.total_amount ? order.total_amount.toLocaleString() : "To quote"}
            </span>
            <span className="text-xs text-[#70736F]">
              Payment Status: {order.payment_status || "Pending"}
            </span>
          </div>
        </div>

        {order.fulfillment_notes && (
          <div className="p-4 rounded-2xl bg-[#FAFAF8] border border-[#E4E6E1] text-xs space-y-1">
            <span className="font-bold text-[#111211] block">Customer / Fulfillment Notes:</span>
            <p className="text-[#70736F]">{order.fulfillment_notes}</p>
          </div>
        )}

        {/* Actions & Lifecycle Transitions */}
        <div className="pt-4 border-t border-[#E4E6E1] space-y-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#70736F] block">
            Status Transition Actions
          </span>
          <div className="flex flex-wrap gap-2">
            {order.status === "pending_confirmation" && (
              <button
                onClick={() => handleTransition("confirmed")}
                className="px-4 py-2 rounded-full bg-[#0C3D2D] text-[#70F0A6] text-xs font-bold hover:bg-[#124d3a]"
              >
                Confirm Order
              </button>
            )}

            {order.status === "confirmed" && (
              <button
                onClick={() => handleTransition("awaiting_payment")}
                className="px-4 py-2 rounded-full bg-[#0C3D2D] text-[#70F0A6] text-xs font-bold hover:bg-[#124d3a]"
              >
                Request Payment
              </button>
            )}

            {order.status === "awaiting_payment" && (
              <button
                onClick={() => handleTransition("paid")}
                className="px-4 py-2 rounded-full bg-[#0C3D2D] text-[#70F0A6] text-xs font-bold hover:bg-[#124d3a]"
              >
                Mark Payment Received
              </button>
            )}

            {order.status === "paid" && (
              <button
                onClick={() => handleTransition("ready")}
                className="px-4 py-2 rounded-full bg-[#0C3D2D] text-[#70F0A6] text-xs font-bold hover:bg-[#124d3a]"
              >
                Mark Ready for Pickup/Dispatch
              </button>
            )}

            {order.status === "ready" && (
              <button
                onClick={() => handleTransition("fulfilled")}
                className="px-4 py-2 rounded-full bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800"
              >
                Complete Delivery
              </button>
            )}

            <button
              onClick={handleLoadPaymentInstructions}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#0C3D2D] bg-[#E3FAEC] text-[#0C3D2D] text-xs font-bold hover:bg-[#70F0A6]/30"
            >
              <QrCode size={13} />
              <span>Show UPI QR Code</span>
            </button>
          </div>
        </div>

        {/* Payment QR Section if triggered */}
        {paymentInstructions && (
          <div className="p-6 rounded-2xl bg-[#F4F4F1] border border-[#E4E6E1] space-y-4">
            <h3 className="text-sm font-black text-[#111211]">UPI Payment Instructions</h3>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-44 h-44 bg-white p-2 rounded-xl border border-[#E4E6E1] shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={paymentInstructions.qr_url}
                  alt="UPI QR"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="space-y-2 flex-1 text-xs">
                <span className="font-bold text-[#111211] block">UPI URI:</span>
                <p className="font-mono text-[11px] text-[#70736F] break-all select-all p-2 rounded-lg bg-white border border-[#E4E6E1]">
                  {paymentInstructions.upi_uri}
                </p>
                <div className="p-3 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 text-[11px]">
                  <strong>Notice:</strong> This QR provides payment routing instructions. Verify payment receipt through your banking app before marking as paid.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrderDetailsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-72 items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#0C3D2D]" />
        </div>
      }
    >
      <OrderDetailsContent />
    </Suspense>
  );
}
