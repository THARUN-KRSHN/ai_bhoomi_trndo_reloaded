"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function InboxRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/marketing-studio/inbox");
  }, [router]);
  return null;
}
