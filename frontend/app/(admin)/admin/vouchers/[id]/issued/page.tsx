"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "@/lib/toast";
import { fetchDirectAssignments, fetchVoucherById, DirectAssignmentInfo, VoucherAdminInfo } from "@/lib/features/vouchers/voucherApi";

export default function IssuedVouchersPage() {
  const params = useParams();
  const router = useRouter();
  const voucherId = parseInt(params.id as string, 10);

  const [loading, setLoading] = useState(true);
  const [voucher, setVoucher] = useState<VoucherAdminInfo | null>(null);
  const [assignments, setAssignments] = useState<DirectAssignmentInfo[]>([]);

  useEffect(() => {
    if (!voucherId || isNaN(voucherId)) {
      router.push("/admin/vouchers");
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        if (!token) {
          router.push("/auth/login");
          return;
        }

        const [voucherData, assignmentsData] = await Promise.all([
          fetchVoucherById(token, voucherId),
          fetchDirectAssignments(token, voucherId)
        ]);

        setVoucher(voucherData);
        setAssignments(assignmentsData.data || []);
      } catch (error: any) {
        toast.error(error.message || "Không thể tải dữ liệu.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [voucherId, router]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Đã sao chép mã voucher!");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Unused":
        return <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-[8px] text-[10px] font-bold tracking-wider uppercase">Chưa dùng</span>;
      case "Used":
        return <span className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-[8px] text-[10px] font-bold tracking-wider uppercase">Đã dùng</span>;
      case "Expired":
        return <span className="px-2.5 py-1 bg-rose-50 text-rose-500 rounded-[8px] text-[10px] font-bold tracking-wider uppercase">Đã hết hạn</span>;
      default:
        return <span className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-[8px] text-[10px] font-bold tracking-wider uppercase">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Danh Sách Mã Đã Phát Hành</h1>
          <p className="text-sm text-slate-500 mt-1">Quản lý các mã voucher bảo mật được cấp phát trực tiếp cho người dùng</p>
        </div>
        <Link 
          href="/admin/vouchers"
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-[8px] font-bold text-sm transition-colors flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Quay lại danh sách
        </Link>
      </div>

      <div className="bg-white rounded-[8px] border border-slate-100 shadow-sm overflow-hidden p-6">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <div className="mb-6 p-4 bg-indigo-50/50 rounded-[8px] border border-indigo-100/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Chi tiết Voucher Gốc</h3>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-black text-indigo-700">{voucher?.code}</span>
                  <span className="text-slate-300">|</span>
                  <span className="text-sm font-bold text-slate-700">{voucher?.name}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-slate-500">Tổng mã đã phát hành</div>
                <div className="text-2xl font-black text-indigo-600">{assignments.length}</div>
              </div>
            </div>

            <div className="overflow-x-auto rounded-[8px] border border-slate-100">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-400 tracking-widest uppercase">
                    <th className="px-5 py-4 w-16 text-center">STT</th>
                    <th className="px-5 py-4">Người nhận</th>
                    <th className="px-5 py-4">Mã bảo mật (Issued Code)</th>
                    <th className="px-5 py-4">Trạng thái</th>
                    <th className="px-5 py-4">Ngày nhận</th>
                    <th className="px-5 py-4">Ngày sử dụng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {assignments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center">
                        <div className="flex flex-col items-center justify-center text-slate-400">
                          <span className="material-symbols-outlined text-4xl mb-2 text-slate-200">receipt_long</span>
                          <span className="text-sm font-bold">Chưa có mã nào được phát hành</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    assignments.map((item, index) => (
                      <tr key={item.userVoucherID} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-4 text-center text-xs font-bold text-slate-400">{index + 1}</td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-800">{item.userFullName || "N/A"}</span>
                            <span className="text-xs text-slate-500">{item.userEmail || item.userPhone}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          {item.issuedCode ? (
                            <div className="flex items-center gap-2">
                              <span className="px-3 py-1.5 bg-slate-100 text-slate-700 font-mono text-sm font-bold rounded-lg border border-slate-200">
                                {item.issuedCode}
                              </span>
                              <button 
                                onClick={() => copyToClipboard(item.issuedCode!)}
                                className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                title="Copy mã"
                              >
                                <span className="material-symbols-outlined text-sm">content_copy</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs italic text-slate-400">Dùng mã chung</span>
                          )}
                        </td>
                        <td className="px-5 py-4">{getStatusBadge(item.status)}</td>
                        <td className="px-5 py-4 text-xs font-medium text-slate-600">
                          {new Date(item.collectedAt).toLocaleString("vi-VN")}
                        </td>
                        <td className="px-5 py-4 text-xs font-medium text-slate-600">
                          {item.usedAt ? new Date(item.usedAt).toLocaleString("vi-VN") : "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
