"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import { Pagination } from "@/components/admin/shared/Pagination";
import {
  VoucherAdminInfo,
  VoucherUsageInfo,
  SearchUserResult,
  DirectAssignmentInfo,
  fetchVoucherUsages,
  searchUsers,
  assignVoucherDirect,
  fetchDirectAssignments,
  revokeDirectAssignment
} from "@/lib/features/vouchers/voucherApi";

interface VoucherDetailProps {
  voucher: VoucherAdminInfo;
  token: string;
  onRefreshVoucher: () => void; // Triggered when assignment changes and we need to refresh quantities
}

export default function VoucherDetail({
  voucher,
  token,
  onRefreshVoucher
}: VoucherDetailProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"details" | "history" | "assign">("details");

  // Tab 2: History states
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [usages, setUsages] = useState<VoucherUsageInfo[]>([]);
  const [totalDiscountGiven, setTotalDiscountGiven] = useState(0);
  const [historySearch, setHistorySearch] = useState("");
  const [historyPage, setHistoryPage] = useState(1);
  const historyPerPage = 5;

  // Tab 3: Assignment states
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [assignments, setAssignments] = useState<DirectAssignmentInfo[]>([]);
  const [assignmentsPage, setAssignmentsPage] = useState(1);
  const assignmentsPerPage = 5;
  const [assignSearch, setAssignSearch] = useState("");

  const [remainingQuota, setRemainingQuota] = useState(0);
  const [userSearchKeyword, setUserSearchKeyword] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<SearchUserResult[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<SearchUserResult[]>([]);
  const [submittingAssign, setSubmittingAssign] = useState(false);

  // Revoke confirmation modal state
  const [revokeItem, setRevokeItem] = useState<DirectAssignmentInfo | null>(null);
  const [revoking, setRevoking] = useState(false);

  // Load history and statistics
  const loadHistory = async () => {
    try {
      setLoadingHistory(true);
      const data = await fetchVoucherUsages(token, voucher.voucherID);
      setUsages(data.usages || []);
      setTotalDiscountGiven(data.totalDiscountGiven || 0);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Không thể tải lịch sử sử dụng.");
    } finally {
      setLoadingHistory(false);
    }
  };

  // Load direct assignments
  const loadAssignments = async () => {
    try {
      setLoadingAssignments(true);
      const data = await fetchDirectAssignments(token, voucher.voucherID);
      setAssignments(data.data || []);
      setRemainingQuota(data.remainingQuota);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Không thể tải danh sách phân phối.");
    } finally {
      setLoadingAssignments(false);
    }
  };

  // React to tab switching
  useEffect(() => {
    if (activeTab === "history") {
      loadHistory();
    } else if (activeTab === "assign") {
      loadAssignments();
      setAssignmentsPage(1);
    }
  }, [activeTab, voucher.voucherID]);

  // Handle user search in direct assignment tab
  useEffect(() => {
    if (userSearchKeyword.trim().length < 3) {
      setUserSearchResults([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      try {
        setSearchingUsers(true);
        const results = await searchUsers(token, userSearchKeyword.trim());
        // Filter out already selected users
        setUserSearchResults(results);
      } catch (e) {
        console.error(e);
      } finally {
        setSearchingUsers(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [userSearchKeyword]);

  // Add user to draft list
  const handleSelectUser = (user: SearchUserResult) => {
    setSelectedUsers(prev => [...prev, user]);
  };

  // Remove user from draft list
  const handleRemoveUserFromDraft = (userId: string) => {
    setSelectedUsers(prev => prev.filter(u => u.id !== userId));
  };

  // Execute assignment
  const handleAssignVouchers = async () => {
    if (selectedUsers.length === 0) {
      toast.warning("Vui lòng chọn ít nhất một người dùng.");
      return;
    }
    try {
      setSubmittingAssign(true);
      const userIDs = selectedUsers.map(u => u.id);
      const res = await assignVoucherDirect(token, {
        voucherID: voucher.voucherID,
        userIDs
      });

      toast.success(res.message);
      setSelectedUsers([]);
      loadAssignments();
      onRefreshVoucher(); // update used quantities in main list
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Phân phối voucher thất bại.");
    } finally {
      setSubmittingAssign(false);
    }
  };

  // Execute revoking
  const handleConfirmRevoke = async () => {
    if (!revokeItem) return;
    try {
      setRevoking(true);
      const res = await revokeDirectAssignment(token, revokeItem.userVoucherID);
      toast.success(res.message || "Đã thu hồi voucher thành công.");
      setRevokeItem(null);
      loadAssignments();
      onRefreshVoucher();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Thu hồi voucher thất bại.");
    } finally {
      setRevoking(false);
    }
  };

  // Formatting utilities
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);
  };

  const getVisibilityBadge = (visType: number, exclType: number) => {
    if (visType === 1) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
          <span className="material-symbols-outlined text-[12px]">public</span>
          Công khai
          {exclType === 2 && " (Phát tự động)"}
        </span>
      );
    } else {
      let typeText = "Nhập mã";
      if (exclType === 2) typeText = "Chỉ định trực tiếp";
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-600 border border-indigo-100">
          <span className="material-symbols-outlined text-[12px]">lock</span>
          Độc quyền ({typeText})
        </span>
      );
    }
  };

  const getValidityStatusBadge = (startDateStr: string, endDateStr: string, status: boolean) => {
    if (!status) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-500 border border-rose-100">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
          Tạm ngưng
        </span>
      );
    }
    const now = new Date();
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);

    if (now < start) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-100">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          Sắp diễn ra
        </span>
      );
    } else if (now > end) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-50 text-slate-500 border border-slate-100">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
          Hết hạn
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Đang diễn ra
        </span>
      );
    }
  };

  // Client-side search and page calculation for History logs
  const filteredHistory = usages.filter(item => {
    const q = historySearch.toLowerCase().trim();
    if (!q) return true;
    return (
      item.userFullName.toLowerCase().includes(q) ||
      item.userEmail.toLowerCase().includes(q) ||
      item.invoiceID.toString().includes(q)
    );
  });

  const totalHistoryItems = filteredHistory.length;
  const totalHistoryPages = Math.max(1, Math.ceil(totalHistoryItems / historyPerPage));
  const displayedHistory = filteredHistory.slice(
    (historyPage - 1) * historyPerPage,
    historyPage * historyPerPage
  );
  const filteredAssignments = assignments.filter(item => {
    const q = assignSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      (item.userFullName && item.userFullName.toLowerCase().includes(q)) ||
      (item.userEmail && item.userEmail.toLowerCase().includes(q))
    );
  });

  const totalAssignmentsItems = filteredAssignments.length;
  const totalAssignmentsPages = Math.max(1, Math.ceil(totalAssignmentsItems / assignmentsPerPage));
  const displayedAssignments = filteredAssignments.slice(
    (assignmentsPage - 1) * assignmentsPerPage,
    assignmentsPage * assignmentsPerPage
  );

  // Remaining and usage progress metrics
  const usedRatio = voucher.totalQuantity > 0 
    ? Math.min(100, Math.round((voucher.usedQuantity / voucher.totalQuantity) * 100))
    : 0;

  // Render direct assigns if the voucher is eligible for direct distribution
  const isDirectAssignVoucher = voucher.exclusiveType === 2;

  return (
    <div className="bg-white rounded-[8px] border border-slate-100 shadow-sm w-full flex flex-col overflow-hidden animate-in fade-in duration-300 min-h-[500px]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-container/20 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-lg">local_activity</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <span>Voucher: {voucher.code}</span>
                {getValidityStatusBadge(voucher.startDate, voucher.endDate, voucher.status)}
              </h3>
              <p className="text-sm text-slate-500 mt-0.5">{voucher.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => router.push("/admin/vouchers")}
            className="pr-4 pl-3 py-2 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            title="Quay lại"
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span> Quay lại
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex px-8 border-b border-slate-100 bg-white">
          <button
            onClick={() => setActiveTab("details")}
            className={`px-5 py-3.5 text-sm font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === "details" ? "border-primary text-primary" : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <span className="material-symbols-outlined text-lg">info</span>
            Thông tin chi tiết
          </button>
          
          <button
            onClick={() => {
              setActiveTab("history");
              setHistoryPage(1);
            }}
            className={`px-5 py-3.5 text-sm font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === "history" ? "border-primary text-primary" : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <span className="material-symbols-outlined text-lg">history_toggle_off</span>
            Lịch sử sử dụng
          </button>

          {isDirectAssignVoucher && (
            <button
              onClick={() => setActiveTab("assign")}
              className={`px-5 py-3.5 text-sm font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === "assign" ? "border-primary text-primary" : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              <span className="material-symbols-outlined text-lg">person_add</span>
              Phân phối trực tiếp
            </button>
          )}
        </div>

        {/* Tab Content Panels */}
        <div className="flex-1 overflow-y-auto p-8 bg-white" style={{ scrollbarWidth: "thin" }}>
          
          {/* TAB 1: General Details */}
          {activeTab === "details" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Stats highlights */}
              <div className="border-b border-slate-100 pb-4 mb-2">
                <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                  <div className="py-2 pr-5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary-container/20 flex items-center justify-center text-primary shrink-0">
                      <span className="material-symbols-outlined text-base">
                        {voucher.voucherType === 2 ? "local_shipping" : "percent"}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Mức giảm giá</p>
                      <p className="text-lg font-bold text-slate-800 mt-0.5">
                        {voucher.voucherType === 2 && voucher.isFreeShipping 
                          ? "Free Shipping" 
                          : voucher.discountType === 1 
                            ? `${voucher.discountValue}%` 
                            : formatCurrency(voucher.discountValue)}
                      </p>
                    </div>
                  </div>

                  <div className="py-2 px-5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                      <span className="material-symbols-outlined text-base">shopping_bag</span>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Đã sử dụng</p>
                      <p className="text-lg font-bold text-slate-800 mt-0.5">
                        {voucher.usedQuantity} / {voucher.totalQuantity} <span className="text-xs font-bold text-slate-400">({usedRatio}%)</span>
                      </p>
                    </div>
                  </div>

                  <div className="py-2 pl-5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                      <span className="material-symbols-outlined text-base">sell</span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Hình thức phân phối</p>
                    <div className="mt-0.5">{getVisibilityBadge(voucher.visibilityType, voucher.exclusiveType)}</div>
                  </div>
                </div>
              </div>
              </div>

            {/* Basic config info */}
              <div className="pt-6 space-y-4">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide border-b border-slate-50 pb-2">
                  Chi tiết cấu hình áp dụng
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="font-semibold text-slate-500">Loại Voucher:</span>
                    <span className="font-bold text-slate-800">
                      {voucher.voucherType === 2 ? "Giảm phí vận chuyển" : "Giảm giá sản phẩm"}
                    </span>
                  </div>
                  {voucher.voucherType === 2 && (
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="font-semibold text-slate-500">Miễn phí ship:</span>
                      <span className="font-bold text-slate-800">{voucher.isFreeShipping ? "Có" : "Không"}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="font-semibold text-slate-500">Mã code:</span>
                    <span className="font-bold text-slate-800">{voucher.code}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="font-semibold text-slate-500">Tên chương trình:</span>
                    <span className="font-semibold text-slate-800">{voucher.name}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="font-semibold text-slate-500">Đơn tối thiểu:</span>
                    <span className="font-semibold text-slate-800">{formatCurrency(voucher.minOrderValue)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="font-semibold text-slate-500">Giảm tối đa:</span>
                    <span className="font-semibold text-slate-800">
                      {voucher.voucherType === 2 
                        ? (voucher.maxShippingDiscount !== null && voucher.maxShippingDiscount > 0 ? formatCurrency(voucher.maxShippingDiscount) : "Không giới hạn")
                        : (voucher.discountType === 1 
                          ? (voucher.maxDiscount > 0 ? formatCurrency(voucher.maxDiscount) : "Không giới hạn") 
                          : "Không áp dụng")}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="font-semibold text-slate-500">Tổng số lượng phát hành:</span>
                    <span className="font-semibold text-slate-800">{voucher.totalQuantity} voucher</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="font-semibold text-slate-500">Số lượng còn lại:</span>
                    <span className="font-bold text-slate-900">
                      {voucher.totalQuantity - voucher.usedQuantity} voucher
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="font-semibold text-slate-500">Hiệu lực từ ngày:</span>
                    <span className="font-semibold text-slate-900">
                      {new Date(voucher.startDate).toLocaleString("vi-VN")}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="font-semibold text-slate-500">Ngày kết thúc hiệu lực:</span>
                    <span className="font-semibold text-slate-900">
                      {new Date(voucher.endDate).toLocaleString("vi-VN")}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="pt-4 border-t border-slate-50">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-500 mb-2">
                    <span>Tiến trình sử dụng voucher</span>
                    <span>{voucher.usedQuantity} / {voucher.totalQuantity} đã dùng ({usedRatio}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-primary h-full rounded-full transition-all duration-500" 
                      style={{ width: `${usedRatio}%` }}
                    ></div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: Usage Logs */}
          {activeTab === "history" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Stats summary inside usages */}
              <div className="border-b border-slate-100 pb-4 mb-2">
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                  <div className="py-2 pr-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary-container/20 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-base">receipt_long</span>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Tổng số lượt áp dụng</p>
                      <p className="text-xl font-bold text-slate-800 mt-0.5">{usages.length} lượt</p>
                    </div>
                    </div>
                  </div>
                  <div className="py-2 pl-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                      <span className="material-symbols-outlined text-base">savings</span>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Tổng giá trị đã giảm giá</p>
                      <p className="text-xl font-bold text-emerald-600 mt-0.5">{formatCurrency(totalDiscountGiven)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

              {/* Usages list table */}
              <div className="pt-6 overflow-hidden">
                <div className="pb-4 border-b border-slate-50 flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                    Danh sách khách hàng sử dụng
                  </h4>
                  {/* Local Search input */}
                  <div className="w-full sm:w-64 relative">
                    <span className="material-symbols-outlined text-slate-400 text-[18px] absolute left-3.5 top-1/2 -translate-y-1/2">
                      search
                    </span>
                    <input
                      type="text"
                      placeholder="Tìm theo tên, email, đơn hàng..."
                      value={historySearch}
                      onChange={e => {
                        setHistorySearch(e.target.value);
                        setHistoryPage(1);
                      }}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-xs font-semibold text-slate-700"
                    />
                  </div>
                </div>

                {loadingHistory ? (
                  <div className="flex justify-center items-center py-16">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : displayedHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                    <span className="material-symbols-outlined text-4xl mb-2 text-slate-200">query_stats</span>
                    <p className="text-xs font-bold">Chưa có lịch sử sử dụng</p>
                    <p className="text-xs text-slate-400 mt-0.5">Không tìm thấy bản ghi sử dụng nào phù hợp</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead>
                          <tr className="bg-slate-50/50 border-b border-slate-50 text-xs font-bold text-slate-400 tracking-wider uppercase">
                            <th className="px-6 py-3">Khách hàng</th>
                            <th className="px-6 py-3">Mã đơn hàng</th>
                            <th className="px-6 py-3 text-right">Trị giá đơn</th>
                            <th className="px-6 py-3 text-right">Số tiền giảm</th>
                            <th className="px-6 py-3">Thời gian</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-xs text-slate-700">
                          {displayedHistory.map((usage, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                              <td className="px-6 py-3">
                                <div>
                                  <p className="font-bold text-slate-800">{usage.userFullName}</p>
                                  <p className="text-xs text-slate-400 font-semibold">{usage.userEmail}</p>
                                </div>
                              </td>
                              <td className="px-6 py-3">
                                <span className="font-bold text-slate-600">#{usage.invoiceID}</span>
                              </td>
                              <td className="px-6 py-3 text-right font-semibold">
                                {formatCurrency(usage.orderValue)}
                              </td>
                              <td className="px-6 py-3 text-right font-bold text-rose-500">
                                -{formatCurrency(usage.discountAmount)}
                              </td>
                              <td className="px-6 py-3 text-xs font-bold text-slate-400">
                                {new Date(usage.usedAt).toLocaleString("vi-VN")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Local Pagination */}
                    {totalHistoryPages > 1 && (
                      <Pagination
                        currentPage={historyPage}
                        totalPages={totalHistoryPages}
                        totalItems={totalHistoryItems}
                        itemsPerPage={historyPerPage}
                        onPageChange={setHistoryPage}
                        size="sm"
                      />
                    )}
                  </>
                )}
              </div>

            </div>
          )}

          {/* TAB 3: Direct Assignments */}
          {activeTab === "assign" && isDirectAssignVoucher && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Active Tab: Direct Assign */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-200">
                {/* Left block - Search & Select */}
                <div className="lg:col-span-5 flex flex-col gap-5">
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide border-b border-slate-50 pb-2">
                    Cấp phát voucher mới
                  </h4>

                  <div className="space-y-1.5">
                    <p className="text-xs font-bold text-slate-400 uppercase">Hạn ngạch còn lại:</p>
                    <p className="text-sm font-bold text-slate-900">
                      {remainingQuota} voucher có thể phát phát hành thêm
                    </p>
                  </div>

                  {/* Search users input */}
                  <div className="relative">
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">
                      Tìm kiếm người dùng (Tên, SĐT, Email)
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined text-slate-400 text-[18px] absolute left-3 top-1/2 -translate-y-1/2">
                        search
                      </span>
                      <input
                        type="text"
                        placeholder="Nhập tối thiểu 3 ký tự..."
                        value={userSearchKeyword}
                        onChange={e => setUserSearchKeyword(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-semibold text-slate-800"
                      />
                      {searchingUsers && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-primary border-t-transparent"></div>
                        </div>
                      )}
                    </div>

                    {/* Search results dropdown overlay */}
                    {userSearchResults.length > 0 && (
                      <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-slate-300/40 z-30 max-h-60 overflow-y-auto divide-y divide-slate-50 py-2 text-xs">
                        {userSearchResults.filter(u => !selectedUsers.some(su => su.id === u.id)).map(u => (
                          <div
                            key={u.id}
                            onClick={() => handleSelectUser(u)}
                            className="p-3 hover:bg-slate-50 transition-colors cursor-pointer flex justify-between items-center"
                          >
                            <div>
                              <p className="font-bold text-slate-900">{u.fullName || "N/A"}</p>
                              <p className="text-xs text-slate-400 mt-0.5">{u.email} {u.phoneNumber && `| ${u.phoneNumber}`}</p>
                            </div>
                            <span className="material-symbols-outlined text-slate-400 text-sm">add_circle</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Selected draft users */}
                  <div className="flex flex-col flex-1 min-h-[280px] bg-slate-50/50 rounded-xl p-3 border border-slate-100">
                    <p className="text-sm font-bold text-slate-500 uppercase mb-3">
                      Danh sách chọn cấp ({selectedUsers.length} người)
                    </p>
                    
                    {selectedUsers.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-center py-4">
                        <span className="material-symbols-outlined text-2xl text-slate-400">person_search</span>
                        <p className="text-xs mt-1">Chưa chọn người dùng nào</p>
                      </div>
                    ) : (
                      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1" style={{ scrollbarWidth: "thin" }}>
                        {selectedUsers.map(u => (
                          <div 
                            key={u.id} 
                            className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-100 text-sm"
                          >
                            <div className="min-w-0 pr-2">
                              <p className="font-bold text-slate-800 truncate">{u.fullName || "N/A"}</p>
                              <p className="text-xs text-slate-400 truncate">{u.email}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveUserFromDraft(u.id)}
                              className="text-slate-400 hover:text-rose-500 cursor-pointer transition-colors p-0.5"
                            >
                              <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Assign triggers */}
                  <button
                    type="button"
                    onClick={handleAssignVouchers}
                    disabled={selectedUsers.length === 0 || submittingAssign || remainingQuota <= 0}
                    className="w-full py-2 bg-primary text-on-primary font-bold text-sm rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-primary/25 hover:bg-primary/95 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {submittingAssign ? (
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-lg">send</span>
                        <span>
                          {remainingQuota <= 0 ? "Hết hạn ngạch phát" : `Phát voucher cho ${selectedUsers.length} user`}
                        </span>
                      </>
                    )}
                  </button>
                </div>

                {/* Right block - List assignments */}
                <div className="lg:col-span-7 flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row gap-4 items-center justify-between border-b border-slate-50 pb-2">
                    <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                      Lịch sử phân phối trực tiếp
                    </h4>
                    {/* Search Input for Assignments */}
                    {assignments.length > 0 && (
                      <div className="w-full sm:w-48 relative">
                        <span className="material-symbols-outlined text-slate-400 text-lg absolute left-2.5 top-1/2 -translate-y-1/2">
                          search
                        </span>
                        <input
                          type="text"
                          placeholder="Tìm người nhận..."
                          value={assignSearch}
                          onChange={e => {
                            setAssignSearch(e.target.value);
                            setAssignmentsPage(1);
                          }}
                          className="w-full pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-sm font-semibold text-slate-700"
                        />
                      </div>
                    )}
                  </div>

                  {loadingAssignments ? (
                    <div className="flex justify-center items-center py-20">
                      <div className="animate-spin rounded-full h-7 w-7 border-t-2 border-b-2 border-primary"></div>
                    </div>
                  ) : assignments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-500 text-center">
                      <span className="material-symbols-outlined text-4xl text-slate-200">contact_mail</span>
                      <p className="text-xs font-bold mt-2">Chưa phân phối cho ai</p>
                      <p className="text-xs text-slate-400 mt-0.5">Tìm kiếm user ở panel bên trái để phân phối</p>
                    </div>
                  ) : filteredAssignments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-500 text-center">
                      <span className="material-symbols-outlined text-4xl text-slate-200">search_off</span>
                      <p className="text-xs font-bold mt-2">Không tìm thấy kết quả</p>
                      <p className="text-xs text-slate-400 mt-0.5">Không tìm thấy người nhận nào khớp với từ khóa</p>
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse whitespace-nowrap text-xs">
                          <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-50 text-xs font-bold text-slate-400 tracking-wider uppercase sticky top-0 bg-white">
                              <th className="px-4 py-2">Khách hàng</th>
                              <th className="px-4 py-2 text-center">Trạng thái ví</th>
                              <th className="px-4 py-2">Ngày phát</th>
                              <th className="px-4 py-2 text-right">Hành động</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50 text-slate-700">
                            {displayedAssignments.map(ass => (
                              <tr key={ass.userVoucherID} className="hover:bg-slate-50/30 transition-colors">
                                <td className="px-4 py-2">
                                  <div>
                                    <p className="font-bold text-slate-800">{ass.userFullName || "N/A"}</p>
                                    <p className="text-xs text-slate-400 font-semibold">{ass.userEmail}</p>
                                  </div>
                                </td>
                                <td className="px-4 py-2 text-center">
                                  {ass.status === "Unused" ? (
                                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-100">Chưa dùng</span>
                                  ) : ass.status === "Used" ? (
                                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">Đã sử dụng</span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-50 text-slate-500 border border-slate-100">Hết hạn</span>
                                  )}
                                </td>
                                <td className="px-4 py-2 text-xs font-bold text-slate-400">
                                  {new Date(ass.collectedAt).toLocaleDateString("vi-VN")}
                                </td>
                                <td className="px-4 py-2 text-right">
                                  {ass.status === "Unused" && (
                                    <button
                                      onClick={() => setRevokeItem(ass)}
                                      className="px-2 py-1 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer border border-rose-100"
                                      title="Thu hồi voucher khỏi ví"
                                    >
                                      Thu hồi
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Assignments Pagination */}
                      {totalAssignmentsPages > 1 && (
                        <div className="mt-auto">
                          <Pagination
                            currentPage={assignmentsPage}
                            totalPages={totalAssignmentsPages}
                            totalItems={totalAssignmentsItems}
                            itemsPerPage={assignmentsPerPage}
                            onPageChange={setAssignmentsPage}
                            size="sm"
                          />
                        </div>
                      )}
                    </>
                  )}

                </div>
              </div>

            </div>
          )}

        </div>

      {/* Revocation Confirmation Modal */}
      {revokeItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-3xl p-6 w-[360px] max-w-full border border-slate-100 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-3 border border-rose-100">
                <span className="material-symbols-outlined text-2xl">warning</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900">Xác nhận thu hồi voucher?</h3>
              <p className="text-sm text-slate-500 mt-2 px-1 leading-relaxed">
                Bạn có chắc chắn muốn thu hồi voucher này khỏi tài khoản của 
                <span className="font-bold text-slate-800"> "{revokeItem.userFullName}"</span>?
                Ví của khách hàng sẽ không còn voucher này. Hành động không thể hoàn tác.
              </p>

              <div className="flex items-center gap-3 w-full mt-5">
                <button
                  onClick={() => setRevokeItem(null)}
                  disabled={revoking}
                  className="flex-1 py-2 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 font-bold text-sm cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleConfirmRevoke}
                  disabled={revoking}
                  className="flex-1 py-2 rounded-full bg-rose-500 text-white font-bold text-sm flex items-center justify-center shadow-md shadow-rose-500/20 hover:bg-rose-600 active:scale-95 transition-all cursor-pointer"
                >
                  {revoking ? (
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div>
                  ) : (
                    "Thu hồi"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
