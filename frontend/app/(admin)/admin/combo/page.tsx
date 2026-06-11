"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader } from "lucide-react";
import { toast } from "@/lib/toast";
import { ComboList } from "@/components/admin/combo/ComboList";
import { ComboForm } from "@/components/admin/combo/ComboForm";

export default function AdminComboPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [loadingToken, setLoadingToken] = useState(true);

  // Navigation state: "list" | "create" | "edit"
  const [view, setView] = useState<"list" | "create" | "edit">("list");
  // Selected combo ID for edit mode
  const [activeBundleId, setActiveBundleId] = useState<number | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!storedToken) {
      toast.error("Vui lòng đăng nhập tài khoản quản trị.");
      router.push("/login");
    } else {
      setToken(storedToken);
    }
    setLoadingToken(false);
  }, [router]);

  if (loadingToken || !token) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center text-slate-450">
        <Loader className="animate-spin text-primary h-10 w-10 mb-4" />
        <p className="font-bold text-sm uppercase tracking-wider">Đang xác thực quyền Admin...</p>
      </div>
    );
  }

  return (
    <main className="w-full pb-20">
      {view === "list" ? (
        <ComboList
          token={token}
          onCreateClick={() => {
            setActiveBundleId(null);
            setView("create");
          }}
          onEditClick={(id) => {
            setActiveBundleId(id);
            setView("edit");
          }}
        />
      ) : (
        <ComboForm
          bundleId={activeBundleId}
          token={token}
          onCancel={() => {
            setView("list");
            setActiveBundleId(null);
          }}
          onSaveSuccess={() => {
            setView("list");
            setActiveBundleId(null);
          }}
        />
      )}
    </main>
  );
}
