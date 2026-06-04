"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader } from "lucide-react";

export default function NotificationsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/profile?tab=notifications");
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 py-10 pt-28 flex flex-col items-center justify-center">
      <Loader className="animate-spin text-rose-500 mb-3" size={32} />
      <p className="text-xs text-slate-500 font-semibold">Đang chuyển hướng...</p>
    </div>
  );
}
