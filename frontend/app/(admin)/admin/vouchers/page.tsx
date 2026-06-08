"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import { Pagination } from "@/components/admin/shared/Pagination";
import VoucherFormModal from "@/components/admin/vouchers/VoucherFormModal";
import VoucherDetailModal from "@/components/admin/vouchers/VoucherDetailModal";
import {
  VoucherAdminInfo,
  fetchAllVouchers,
  deleteVoucher,
  toggleVoucherStatus
} from "@/lib/features/vouchers/voucherApi";

export default function AdminVouchersPage() {
  const router = useRouter();

  // Authentication
  const [token, setToken] = useState<string | null>(null);

  // Loaders
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // Data states
  const [vouchers, setVouchers] = useState<VoucherAdminInfo[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all, ongoing, upcoming, expired, suspended
  const [typeFilter, setTypeFilter] = useState("all"); // all, percent, fixed
  const [visibilityFilter, setVisibilityFilter] = useState("all"); // all, public, exclusive

  // Pagination (Client-side)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal control states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedVoucherForEdit, setSelectedVoucherForEdit] = useState<VoucherAdminInfo | null>(null);
  const [selectedVoucherForDetail, setSelectedVoucherForDetail] = useState<VoucherAdminInfo | null>(null);
  const [voucherToDelete, setVoucherToDelete] = useState<VoucherAdminInfo | null>(null);
  const [voucherToToggle, setVoucherToToggle] = useState<VoucherAdminInfo | null>(null);

  // Statistics summaries
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    totalUsages: 0,
    topVoucher: "N/A"
  });

  const loadTokenAndVouchers = async () => {
    const storedToken = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!storedToken) {
      toast.error("Vui lòng đăng nhập tài khoản quản trị.");
      router.push("/login");
      return;
    }
    setToken(storedToken);
    await loadVouchers(storedToken);
  };

  const loadVouchers = async (authToken: string) => {
    try {
      setLoading(true);
      const data = await fetchAllVouchers(authToken);
      
      // Calculate Stats
      const total = data.length;
      const now = new Date();
      
      const active = data.filter(v => 
        v.status && 
        new Date(v.startDate) <= now && 
        new Date(v.endDate) >= now
      ).length;

      const totalUsages = data.reduce((sum, v) => sum + v.usedQuantity, 0);

      // Top voucher by usage
      let topVoucher = "N/A";
      if (data.length > 0) {
        const sorted = [...data].sort((a, b) => b.usedQuantity - a.usedQuantity);
        if (sorted[0].usedQuantity > 0) {
          topVoucher = `${sorted[0].code} (${sorted[0].usedQuantity} lượt)`;
        }
      }

      setVouchers(data);
      setStats({ total, active, totalUsages, topVoucher });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Không thể tải danh sách voucher.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTokenAndVouchers();
  }, []);

  const handleRefresh = () => {
    if (token) {
      loadVouchers(token);
    }
  };

  const handleOpenCreateForm = () => {
    setSelectedVoucherForEdit(null);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (voucher: VoucherAdminInfo) => {
    setSelectedVoucherForEdit(voucher);
    setIsFormOpen(true);
  };

  const handleOpenDetailModal = (voucher: VoucherAdminInfo) => {
    setSelectedVoucherForDetail(voucher);
  };

  const handleDeleteClick = (voucher: VoucherAdminInfo) => {
    if (voucher.usedQuantity > 0) {
      toast.warning("Không thể xóa voucher đã được sử dụng. Vui lòng chuyển trạng thái khóa.");
      return;
    }
    setVoucherToDelete(voucher);
  };

  const confirmDelete = async () => {
    if (!voucherToDelete || !token) return;
    try {
      setDeletingId(voucherToDelete.voucherID);
      await deleteVoucher(token, voucherToDelete.voucherID);
      toast.success("Xóa voucher thành công!");
      setVoucherToDelete(null);
      
      // Load current page calculation
      const filteredCount = getFilteredVouchers().length - 1;
      const lastPage = Math.max(1, Math.ceil(filteredCount / itemsPerPage));
      if (currentPage > lastPage) {
        setCurrentPage(lastPage);
      }

      loadVouchers(token);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Có lỗi xảy ra khi xóa.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleStatusClick = (voucher: VoucherAdminInfo) => {
    setVoucherToToggle(voucher);
  };

  const confirmToggleStatus = async () => {
    if (!voucherToToggle || !token) return;
    try {
      setTogglingId(voucherToToggle.voucherID);
      const res = await toggleVoucherStatus(token, voucherToToggle.voucherID);
      toast.success(res.message);
      setVoucherToToggle(null);
      loadVouchers(token);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Thay đổi trạng thái thất bại.");
    } finally {
      setTogglingId(null);
    }
  };

  const handleSaveSuccess = (message: string) => {
    toast.success(message);
    setIsFormOpen(false);
    setSelectedVoucherForEdit(null);
    if (token) loadVouchers(token);
  };

  // Filter vouchers based on parameters
  const getFilteredVouchers = () => {
    return vouchers.filter(v => {
      // 1. Search Query
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch = !q || v.code.toLowerCase().includes(q) || v.name.toLowerCase().includes(q);

      // 2. Discount Type Filter
      const matchesType = typeFilter === "all" || v.discountType === Number(typeFilter);

      // 3. Visibility Filter
      const matchesVisibility = visibilityFilter === "all" || v.visibilityType === Number(visibilityFilter);

      // 4. Validity Status Filter
      const now = new Date();
      const start = new Date(v.startDate);
      const end = new Date(v.endDate);
      
      let matchesStatus = true;
      if (statusFilter === "suspended") {
        matchesStatus = !v.status;
      } else if (statusFilter === "ongoing") {
        matchesStatus = v.status && start <= now && end >= now;
      } else if (statusFilter === "upcoming") {
        matchesStatus = v.status && start > now;
      } else if (statusFilter === "expired") {
        matchesStatus = v.status && end < now;
      }

      return matchesSearch && matchesType && matchesVisibility && matchesStatus;
    });
  };

  // Perform client-side pagination
  const filteredData = getFilteredVouchers();
  const totalItems = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const displayedVouchers = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);
  };

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, typeFilter, visibilityFilter]);

  const getValidityBadge = (startDateStr: string, endDateStr: string, status: boolean) => {
    if (!status) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-550 border border-rose-100">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-450"></span>
          Tạm khóa
        </span>
      );
    }
    const now = new Date();
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);

    if (now < start) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-550"></span>
          Sắp diễn ra
        </span>
      );
    } else if (now > end) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-50 text-slate-500 border border-slate-100">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
          Hết hạn
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Đang hoạt động
        </span>
      );
    }
  };

  return (
    <main className="w-full pb-20 animate-in fade-in duration-300">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl">local_activity</span>
            Quản lý Voucher
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Thiết lập các chương trình khuyến mãi, phân phối voucher công khai hoặc chỉ định cho người dùng cụ thể.
          </p>
        </div>
        <button
          onClick={handleOpenCreateForm}
          className="px-5 py-3 rounded-full bg-primary text-on-primary font-bold text-xs flex items-center gap-2 shadow-lg shadow-primary/20 hover:bg-primary/95 active:scale-95 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Tạo Voucher Mới
        </button>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Vouchers */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col gap-4 hover:shadow-md transition-shadow duration-300">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-2xl bg-primary-container/20 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">local_activity</span>
            </div>
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Tổng số voucher</p>
            <h3 className="text-3xl font-bold text-slate-800 mt-1">{loading ? "..." : stats.total}</h3>
          </div>
        </div>

        {/* Active Vouchers */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col gap-4 hover:shadow-md transition-shadow duration-300">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <span className="material-symbols-outlined">alarm_on</span>
            </div>
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Đang chạy có hiệu lực</p>
            <h3 className="text-3xl font-bold text-slate-800 mt-1">{loading ? "..." : stats.active}</h3>
          </div>
        </div>

        {/* Total Usages */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col gap-4 hover:shadow-md transition-shadow duration-300">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-650">
              <span className="material-symbols-outlined">receipt_long</span>
            </div>
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Tổng số lượt đã dùng</p>
            <h3 className="text-3xl font-bold text-slate-800 mt-1">{loading ? "..." : stats.totalUsages}</h3>
          </div>
        </div>

        {/* Top Performer */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col gap-4 hover:shadow-md transition-shadow duration-300">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
              <span className="material-symbols-outlined">stars</span>
            </div>
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Sử dụng nhiều nhất</p>
            <h3 className="text-sm font-bold text-slate-800 mt-2 truncate" title={stats.topVoucher}>
              {loading ? "..." : stats.topVoucher}
            </h3>
          </div>
        </div>
      </div>

      {/* Main List Section */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        
        {/* Search, filters block */}
        <div className="p-6 border-b border-slate-50 flex flex-col xl:flex-row gap-4 items-center justify-between bg-slate-50/10">
          {/* Search input */}
          <div className="w-full xl:w-80 relative">
            <span className="material-symbols-outlined text-slate-400 text-lg absolute left-4.5 top-1/2 -translate-y-1/2">
              search
            </span>
            <input
              type="text"
              placeholder="Tìm theo mã code hoặc tên voucher..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-sm font-semibold text-slate-700"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            )}
          </div>

          {/* Filtering panels */}
          <div className="w-full xl:w-auto flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            
            {/* Validity filter */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase whitespace-nowrap">Hiệu lực:</span>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-xs font-bold text-slate-700"
              >
                <option value="all">Tất cả</option>
                <option value="ongoing">Đang hoạt động</option>
                <option value="upcoming">Sắp diễn ra</option>
                <option value="expired">Hết hạn</option>
                <option value="suspended">Đang tạm khóa</option>
              </select>
            </div>

            {/* Discount Type filter */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase whitespace-nowrap">Loại giảm:</span>
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-xs font-bold text-slate-700"
              >
                <option value="all">Tất cả</option>
                <option value="1">Theo phần trăm (%)</option>
                <option value="2">Tiền cố định (đ)</option>
              </select>
            </div>

            {/* Visibility filter */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase whitespace-nowrap">Hiển thị:</span>
              <select
                value={visibilityFilter}
                onChange={e => setVisibilityFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-xs font-bold text-slate-700"
              >
                <option value="all">Tất cả</option>
                <option value="1">Công khai (Public)</option>
                <option value="2">Riêng tư (Exclusive)</option>
              </select>
            </div>

          </div>
        </div>

        {/* Vouchers Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center py-24">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : displayedVouchers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400">
              <span className="material-symbols-outlined text-5xl mb-3 text-slate-200">
                search_off
              </span>
              <p className="text-sm font-bold">Không tìm thấy voucher nào</p>
              <p className="text-xs text-slate-400 mt-1">Hãy thử thay đổi điều kiện lọc hoặc tạo mới voucher</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-50 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                  <th className="px-6 py-4">Mã Voucher</th>
                  <th className="px-6 py-4">Tên chương trình</th>
                  <th className="px-6 py-4">Mức giảm</th>
                  <th className="px-6 py-4">Tỉ lệ sử dụng</th>
                  <th className="px-6 py-4">Loại phân phối</th>
                  <th className="px-6 py-4">Thời gian hiệu lực</th>
                  <th className="px-6 py-4 text-center">Trạng thái khóa</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {displayedVouchers.map(voucher => {
                  const usedPct = voucher.totalQuantity > 0 
                    ? Math.round((voucher.usedQuantity / voucher.totalQuantity) * 100)
                    : 0;

                  return (
                    <tr key={voucher.voucherID} className="hover:bg-slate-50/50 transition-colors">
                      {/* Code */}
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-800 text-sm tracking-wide bg-slate-100/80 px-3 py-1.5 rounded-lg border border-slate-150">
                          {voucher.code}
                        </span>
                      </td>

                      {/* Name */}
                      <td className="px-6 py-4">
                        <div className="max-w-[180px] truncate font-semibold text-slate-700 text-sm" title={voucher.name}>
                          {voucher.name}
                        </div>
                      </td>

                      {/* Discount Amount */}
                      <td className="px-6 py-4 text-sm font-bold text-slate-800">
                        {voucher.discountType === 1 
                          ? `${voucher.discountValue}%` 
                          : formatCurrency(voucher.discountValue)}
                      </td>

                      {/* Usage bar */}
                      <td className="px-6 py-4">
                        <div className="w-32">
                          <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold mb-1">
                            <span>{voucher.usedQuantity}/{voucher.totalQuantity}</span>
                            <span>{usedPct}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className="bg-primary h-full rounded-full" 
                              style={{ width: `${Math.min(100, usedPct)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>

                      {/* Visibility / Exclusive type */}
                      <td className="px-6 py-4">
                        {voucher.visibilityType === 1 ? (
                          <span className="text-[10px] font-bold text-emerald-650 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                            Public
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-150">
                            Exclusive
                          </span>
                        )}
                        <span className="text-[9px] font-semibold text-slate-400 block mt-1">
                          {voucher.exclusiveType === 0 ? "Không độc quyền" : 
                           voucher.exclusiveType === 1 ? "Nhập mã" : "Phát trực tiếp"}
                        </span>
                      </td>

                      {/* Dates */}
                      <td className="px-6 py-4 text-[10px] font-bold text-slate-450">
                        <div>
                          <p>BĐ: {new Date(voucher.startDate).toLocaleDateString("vi-VN")}</p>
                          <p className="mt-0.5">KT: {new Date(voucher.endDate).toLocaleDateString("vi-VN")}</p>
                        </div>
                      </td>

                      {/* Validity/Status */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          {getValidityBadge(voucher.startDate, voucher.endDate, voucher.status)}
                          
                          {/* Toggle active button */}
                          <button
                            onClick={() => handleToggleStatusClick(voucher)}
                            disabled={togglingId === voucher.voucherID}
                            className={`px-2 py-0.5 rounded text-[9px] font-bold border transition-colors cursor-pointer ${
                              voucher.status 
                                ? "bg-slate-50 hover:bg-slate-100 text-slate-500 border-slate-200" 
                                : "bg-primary-container/20 hover:bg-primary-container/30 text-primary border-primary/20"
                            }`}
                          >
                            {togglingId === voucher.voucherID ? "..." : (voucher.status ? "Tạm khóa" : "Mở khóa")}
                          </button>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenDetailModal(voucher)}
                            className="p-1.5 hover:bg-slate-100 rounded-full text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                            title="Xem chi tiết & lịch sử sử dụng"
                          >
                            <span className="material-symbols-outlined text-lg">visibility</span>
                          </button>
                          
                          <button
                            onClick={() => handleOpenEditForm(voucher)}
                            className="p-1.5 hover:bg-slate-100 rounded-full text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                            title="Sửa"
                          >
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                          
                          <button
                            onClick={() => handleDeleteClick(voucher)}
                            className={`p-1.5 rounded-full transition-colors ${
                              voucher.usedQuantity > 0 
                                ? "opacity-30 cursor-not-allowed text-slate-300" 
                                : "hover:bg-rose-50 text-rose-500 hover:text-rose-700 cursor-pointer"
                            }`}
                            disabled={voucher.usedQuantity > 0}
                            title={voucher.usedQuantity > 0 ? "Không thể xóa voucher đã dùng" : "Xóa"}
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination bar */}
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* Form Modal (Create / Edit) */}
      {isFormOpen && token && (
        <VoucherFormModal
          voucher={selectedVoucherForEdit}
          token={token}
          onClose={() => {
            setIsFormOpen(false);
            setSelectedVoucherForEdit(null);
          }}
          onSaveSuccess={handleSaveSuccess}
        />
      )}

      {/* Detail / History Modal */}
      {selectedVoucherForDetail && token && (
        <VoucherDetailModal
          voucher={selectedVoucherForDetail}
          token={token}
          onClose={() => setSelectedVoucherForDetail(null)}
          onRefreshVoucher={handleRefresh}
        />
      )}

      {/* Confirmation Modal: Delete */}
      {voucherToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full border border-slate-100 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-4 border border-rose-100">
                <span className="material-symbols-outlined text-3xl">warning</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">Xác nhận xóa Voucher?</h3>
              <p className="text-xs text-slate-400 mt-2 px-1 leading-relaxed">
                Bạn có chắc chắn muốn xóa vĩnh viễn voucher <span className="font-bold text-slate-800">"{voucherToDelete.code}"</span>?
                Hành động này sẽ xóa dữ liệu voucher khỏi hệ thống và không thể hoàn tác.
              </p>

              <div className="flex items-center gap-3 w-full mt-6">
                <button
                  onClick={() => setVoucherToDelete(null)}
                  disabled={deletingId !== null}
                  className="flex-1 py-2.5 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 font-bold text-xs cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deletingId !== null}
                  className="flex-1 py-2.5 rounded-full bg-rose-500 text-white font-bold text-xs flex items-center justify-center shadow-md shadow-rose-500/20 hover:bg-rose-600 active:scale-95 transition-all cursor-pointer"
                >
                  {deletingId !== null ? (
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div>
                  ) : (
                    "Xác nhận xóa"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Toggle Status */}
      {voucherToToggle && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full border border-slate-100 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-4 border border-amber-100">
                <span className="material-symbols-outlined text-3xl">info</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">
                {voucherToToggle.status ? "Khóa Voucher?" : "Mở khóa Voucher?"}
              </h3>
              <p className="text-xs text-slate-400 mt-2 px-1 leading-relaxed">
                Bạn có chắc chắn muốn {voucherToToggle.status ? "tạm thời khóa/vô hiệu hóa" : "kích hoạt mở khóa"} voucher 
                <span className="font-bold text-slate-800"> "{voucherToToggle.code}"</span>?
                {voucherToToggle.status 
                  ? " Khách hàng sẽ không thể áp dụng voucher này khi thanh toán đơn hàng nữa." 
                  : " Voucher sẽ tiếp tục có hiệu lực cho khách hàng mua sắm."}
              </p>

              <div className="flex items-center gap-3 w-full mt-6">
                <button
                  onClick={() => setVoucherToToggle(null)}
                  disabled={togglingId !== null}
                  className="flex-1 py-2.5 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 font-bold text-xs cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={confirmToggleStatus}
                  disabled={togglingId !== null}
                  className="flex-1 py-2.5 rounded-full bg-primary text-on-primary font-bold text-xs flex items-center justify-center shadow-md shadow-primary/20 hover:bg-primary/95 active:scale-95 transition-all cursor-pointer"
                >
                  {togglingId !== null ? (
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div>
                  ) : (
                    "Xác nhận"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
