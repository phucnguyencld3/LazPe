"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "@/lib/toast";
import {
  getAllWithdrawRequests,
  processWithdrawRequest,
  WithdrawRequest,
} from "@/lib/api";

const formatVND = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function AdminWithdrawalsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<WithdrawRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  // Modal
  const [selectedRequest, setSelectedRequest] = useState<WithdrawRequest | null>(null);
  const [modalAction, setModalAction] = useState<"approve" | "reject" | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [processing, setProcessing] = useState(false);

  const token = typeof window !== "undefined" ? (localStorage.getItem("token") || sessionStorage.getItem("token") || "") : "";

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getAllWithdrawRequests(token);
      setRequests(data);
    } catch {
      toast.error("Lỗi khi tải danh sách yêu cầu rút tiền");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadData();
  }, [token]);

  // Stats
  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === "Pending").length,
    approved: requests.filter(r => r.status === "Approved").length,
    totalAmount: requests.filter(r => r.status === "Approved").reduce((s, r) => s + r.amount, 0),
  };

  const filtered = requests
    .filter((r) => {
      // Status filter
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      // Search
      const q = search.toLowerCase();
      const matchSearch = !q || (
        r.bankName?.toLowerCase().includes(q) ||
        r.bankAccount?.toLowerCase().includes(q) ||
        r.bankOwnerName?.toLowerCase().includes(q) ||
        r.user?.fullName?.toLowerCase().includes(q) ||
        r.user?.email?.toLowerCase().includes(q) ||
        r.requestID.toString().includes(q)
      );
      // Date filter
      const createdDate = new Date(r.createdAt);
      const matchDateFrom = !dateFrom || createdDate >= new Date(dateFrom + "T00:00:00");
      const matchDateTo = !dateTo || createdDate <= new Date(dateTo + "T23:59:59");
      return matchSearch && matchDateFrom && matchDateTo;
    })
    .sort((a, b) => {
      const da = new Date(a.createdAt).getTime();
      const db = new Date(b.createdAt).getTime();
      return sortOrder === "newest" ? db - da : da - db;
    });

  const handleProcess = async () => {
    if (!selectedRequest || !modalAction) return;
    setProcessing(true);
    try {
      await processWithdrawRequest(
        selectedRequest.requestID,
        { isApproved: modalAction === "approve", adminNote },
        token
      );
      toast.success(modalAction === "approve" ? "Đã duyệt yêu cầu rút tiền thành công!" : "Đã từ chối yêu cầu rút tiền.");
      setSelectedRequest(null);
      setModalAction(null);
      setAdminNote("");
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Lỗi xử lý yêu cầu");
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Chờ duyệt
          </span>
        );
      case "Approved":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Đã duyệt
          </span>
        );
      case "Rejected":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Từ chối
          </span>
        );
      default:
        return <span className="text-xs font-bold text-slate-500">{status}</span>;
    }
  };

  return (
    <main className="w-full pb-20 animate-in fade-in duration-300">

      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl">account_balance</span>
            Quản lý Rút tiền
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Duyệt và quản lý yêu cầu rút tiền từ người bán / người dùng.
          </p>
        </div>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white px-5 py-4 rounded-[8px] shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[8px] bg-primary-container/20 flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-[20px]">receipt_long</span>
            </div>
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Tổng yêu cầu</span>
          </div>
          <span className="text-2xl font-extrabold text-slate-800">{loading ? "..." : stats.total}</span>
        </div>

        <div className="bg-white px-5 py-4 rounded-[8px] shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[8px] bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
              <span className="material-symbols-outlined text-[20px]">schedule</span>
            </div>
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Chờ duyệt</span>
          </div>
          <span className="text-2xl font-extrabold text-slate-800">{loading ? "..." : stats.pending}</span>
        </div>

        <div className="bg-white px-5 py-4 rounded-[8px] shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[8px] bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
              <span className="material-symbols-outlined text-[20px]">check_circle</span>
            </div>
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Đã duyệt</span>
          </div>
          <span className="text-2xl font-extrabold text-slate-800">{loading ? "..." : stats.approved}</span>
        </div>

        <div className="bg-white px-5 py-4 rounded-[8px] shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[8px] bg-teal-50 flex items-center justify-center text-teal-600 shrink-0">
              <span className="material-symbols-outlined text-[20px]">payments</span>
            </div>
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Đã chi trả</span>
          </div>
          <span className="text-lg font-extrabold text-slate-800">{loading ? "..." : formatVND(stats.totalAmount)}</span>
        </div>
      </div>

      {/* Main List Section */}
      <div className="bg-white rounded-[8px] border border-slate-100 shadow-sm overflow-hidden">
        
        {/* Search, filters block */}
        <div className="p-6 border-b border-slate-100 flex flex-wrap items-center gap-4 bg-slate-50/50">
          {/* Search box */}
          <div className="flex-1 min-w-[260px] relative">
            <span className="material-symbols-outlined text-slate-400 text-lg absolute left-4.5 top-1/2 -translate-y-1/2">
              search
            </span>
            <input
              type="text"
              placeholder="Tìm theo tên, email, ngân hàng, STK..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-[8px] font-semibold text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-3 bg-white border border-slate-200 rounded-[8px] font-bold text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all min-w-[150px] cursor-pointer"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="Pending">Chờ duyệt</option>
            <option value="Approved">Đã duyệt</option>
            <option value="Rejected">Từ chối</option>
          </select>

          {/* Sort */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")}
            className="px-4 py-3 bg-white border border-slate-200 rounded-[8px] font-bold text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all min-w-[130px] cursor-pointer"
          >
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
          </select>

          {/* Date From */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Từ:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2.5 bg-white border border-slate-200 rounded-[8px] text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
            />
          </div>

          {/* Date To */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Đến:</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2.5 bg-white border border-slate-200 rounded-[8px] text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
            />
          </div>

          {/* Reset Filters */}
          {(search || statusFilter !== "all" || dateFrom || dateTo) && (
            <button
              onClick={() => { setSearch(""); setStatusFilter("all"); setDateFrom(""); setDateTo(""); }}
              className="px-6 py-3 text-slate-500 font-bold text-sm rounded-[8px] hover:bg-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">clear</span>
              Xóa lọc
            </button>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader className="animate-spin h-8 w-8 text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <span className="material-symbols-outlined text-5xl text-slate-300 mb-3 block">account_balance_wallet</span>
              <p className="font-semibold">Không có yêu cầu rút tiền nào</p>
              <p className="text-xs mt-1">Hãy thử thay đổi bộ lọc hoặc tìm kiếm</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/80">
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">STT</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Mã YC</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Người yêu cầu</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Số tiền</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Thông tin NH</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Ngày tạo</th>
                  <th className="px-5 py-3.5 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((req, index) => (
                  <tr key={req.requestID} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4 text-slate-500 font-semibold">{index + 1}</td>
                    <td className="px-5 py-4 font-bold text-primary">#{req.requestID}</td>
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-800">{req.user?.fullName || "—"}</div>
                      <div className="text-[11px] text-slate-500">{req.user?.email || req.userID}</div>
                    </td>
                    <td className="px-5 py-4 font-extrabold text-emerald-600 whitespace-nowrap">{formatVND(req.amount)}</td>
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-800">{req.bankName}</div>
                      <div className="text-[11px] text-slate-500">STK: {req.bankAccount}</div>
                      <div className="text-[11px] text-slate-500">CTK: {req.bankOwnerName}</div>
                    </td>
                    <td className="px-5 py-4">
                      {getStatusBadge(req.status)}
                      {req.adminNote && (
                        <p className="text-[10px] text-slate-400 mt-1 italic max-w-[180px] truncate" title={req.adminNote}>
                          Ghi chú: {req.adminNote}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-slate-600 text-xs whitespace-nowrap">
                      <div>{formatDate(req.createdAt)}</div>
                      {req.processedAt && (
                        <div className="text-emerald-600 mt-0.5">Xử lý: {formatDate(req.processedAt)}</div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      {req.status === "Pending" ? (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => { setSelectedRequest(req); setModalAction("approve"); setAdminNote(""); }}
                            className="p-2 rounded-[6px] bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                            title="Duyệt"
                          >
                            <span className="material-symbols-outlined text-[18px]">check_circle</span>
                          </button>
                          <button
                            onClick={() => { setSelectedRequest(req); setModalAction("reject"); setAdminNote(""); }}
                            className="p-2 rounded-[6px] bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                            title="Từ chối"
                          >
                            <span className="material-symbols-outlined text-[18px]">cancel</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">Đã xử lý</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Process Modal */}
      {selectedRequest && modalAction && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-[12px] shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
            <div className={`p-5 border-b flex justify-between items-center ${modalAction === "approve" ? "bg-emerald-50 border-emerald-100" : "bg-rose-50 border-rose-100"}`}>
              <h3 className={`font-bold text-lg ${modalAction === "approve" ? "text-emerald-800" : "text-rose-800"}`}>
                {modalAction === "approve" ? "✅ Duyệt yêu cầu rút tiền" : "❌ Từ chối yêu cầu rút tiền"}
              </h3>
              <button
                onClick={() => { setSelectedRequest(null); setModalAction(null); }}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Info Card */}
              <div className="bg-slate-50 rounded-lg p-4 space-y-2 border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500 font-medium">Mã yêu cầu</span>
                  <span className="text-sm font-bold text-primary">#{selectedRequest.requestID}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500 font-medium">Người yêu cầu</span>
                  <span className="text-sm font-bold text-slate-800">{selectedRequest.user?.fullName || selectedRequest.userID}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500 font-medium">Số tiền</span>
                  <span className="text-sm font-black text-emerald-600">{formatVND(selectedRequest.amount)}</span>
                </div>
                <div className="border-t border-slate-200 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-500 font-medium">Ngân hàng</span>
                    <span className="text-sm font-bold">{selectedRequest.bankName}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-slate-500 font-medium">Số tài khoản</span>
                    <span className="text-sm font-bold font-mono">{selectedRequest.bankAccount}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-slate-500 font-medium">Chủ tài khoản</span>
                    <span className="text-sm font-bold uppercase">{selectedRequest.bankOwnerName}</span>
                  </div>
                </div>
              </div>

              {/* Admin Note */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ghi chú của Admin {modalAction === "reject" && <span className="text-rose-500">*</span>}
                </label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder={modalAction === "approve" ? "Ghi chú (tùy chọn)..." : "Lý do từ chối..."}
                  rows={3}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm resize-none"
                  required={modalAction === "reject"}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setSelectedRequest(null); setModalAction(null); }}
                  className="flex-1 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-[8px] transition-colors"
                  disabled={processing}
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleProcess}
                  disabled={processing || (modalAction === "reject" && !adminNote.trim())}
                  className={`flex-1 py-2.5 text-sm font-bold text-white rounded-[8px] transition-colors shadow-md flex items-center justify-center gap-2 disabled:opacity-50 ${
                    modalAction === "approve"
                      ? "bg-emerald-500 hover:bg-emerald-600"
                      : "bg-rose-500 hover:bg-rose-600"
                  }`}
                >
                  {processing ? <Loader className="animate-spin h-4 w-4" /> : null}
                  {modalAction === "approve" ? "Xác nhận Duyệt" : "Xác nhận Từ chối"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
