"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OrdersRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/marketing-studio/orders");
  }, [router]);
  return null;
}
