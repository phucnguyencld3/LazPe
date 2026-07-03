"use client";

import React, { useEffect, useState } from "react";
import VoucherForm from "@/components/admin/vouchers/VoucherForm";

export default function CreateVoucherPage() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("token") || sessionStorage.getItem("token");
    setToken(storedToken);
  }, []);

  if (!token) return null;

  return (
    <div className="w-full pb-20 animate-in fade-in duration-300">
      <VoucherForm voucher={null} token={token} />
    </div>
  );
}
