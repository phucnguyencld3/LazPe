"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import VoucherForm from "@/components/admin/vouchers/VoucherForm";
import { fetchVoucherById, VoucherAdminInfo } from "@/lib/features/vouchers/voucherApi";
import { toast } from "@/lib/toast";

export default function EditVoucherPage() {
  const params = useParams();
  const router = useRouter();
  
  const [token, setToken] = useState<string | null>(null);
  const [voucher, setVoucher] = useState<VoucherAdminInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!storedToken) {
      router.push("/login");
      return;
    }
    setToken(storedToken);
    
    if (params.id && storedToken) {
      loadVoucher(storedToken, Number(params.id));
    }
  }, [params.id, router]);

  const loadVoucher = async (authToken: string, voucherId: number) => {
    try {
      setLoading(true);
      const data = await fetchVoucherById(authToken, voucherId);
      setVoucher(data);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Không thể tải dữ liệu voucher.");
      router.push("/admin/vouchers");
    } finally {
      setLoading(false);
    }
  };

  if (!token) return null;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-full pb-20 animate-in fade-in duration-300">
      {voucher && <VoucherForm voucher={voucher} token={token} />}
    </div>
  );
}
