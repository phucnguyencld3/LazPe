"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { trackAffiliateClick } from "@/lib/api";

export function AffiliateRefTracker() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get("ref") || searchParams.get("affiliateCode");
    if (ref && typeof window !== "undefined") {
      // 1. Lưu mã giới thiệu vào localStorage và sessionStorage
      localStorage.setItem("lazpe_affiliate_ref", ref);
      sessionStorage.setItem("lazpe_affiliate_ref", ref);

      // 2. Ghi nhận lượt click ngầm trên Backend (Tránh đếm lặp trong cùng 1 phiên làm việc)
      const trackedKey = `tracked_aff_click_${ref}`;
      if (!sessionStorage.getItem(trackedKey)) {
        trackAffiliateClick(ref);
        sessionStorage.setItem(trackedKey, "true");
      }
    }
  }, [searchParams]);

  return null;
}
