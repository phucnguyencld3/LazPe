"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader } from "lucide-react";
import { NotificationsSection } from "@/components/client/profile/NotificationsSection";

function AdminNotificationInboxContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialNotifId, setInitialNotifId] = useState<number | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!savedToken) {
      router.push("/login");
      return;
    }
    setToken(savedToken);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    const idParam = searchParams.get("id");
    if (idParam) {
      const parsed = parseInt(idParam, 10);
      if (!isNaN(parsed)) {
        setInitialNotifId(parsed);
      }
    }
  }, [searchParams]);

  const handleClearInitialId = () => {
    setInitialNotifId(null);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("id");
      window.history.replaceState({}, "", url.pathname + url.search);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-[8px] border border-slate-100 min-h-[500px]">
        <Loader className="animate-spin text-primary mb-3" size={36} />
        <p className="text-sm font-semibold text-slate-500">Đang tải hộp thư thông báo...</p>
      </div>
    );
  }

  return (
    <div className="w-full flex-1 flex flex-col">
      {token && (
        <NotificationsSection 
          token={token} 
          initialSelectedId={initialNotifId}
          onClearInitialId={handleClearInitialId}
        />
      )}
    </div>
  );
}

export default function AdminNotificationInboxPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center"><Loader className="animate-spin mx-auto text-primary" /></div>}>
      <AdminNotificationInboxContent />
    </Suspense>
  );
}
