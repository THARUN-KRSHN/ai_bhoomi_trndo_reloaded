"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

function OrderIdRedirectContent() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id ? String(params.id) : "";

  useEffect(() => {
    if (id) {
      router.replace(`/marketing-studio/orders/${id}`);
    } else {
      router.replace("/marketing-studio/orders");
    }
  }, [router, id]);

  return null;
}

export default function OrderIdRedirect() {
  return (
    <Suspense fallback={null}>
      <OrderIdRedirectContent />
    </Suspense>
  );
}
