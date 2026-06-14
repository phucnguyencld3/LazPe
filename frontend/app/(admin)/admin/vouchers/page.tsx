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
  const [voucherTypeFilter, setVoucherTypeFilter] = useState("all"); // all, product (1), shipping (2)
  const [visibilityFilter, setVisibilityFilter] = useState("all"); // all, public, exclusive

  // Pagination (Client-side)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

      // 2b. Voucher Type Filter
      const matchesVoucherType = voucherTypeFilter === "all" || v.voucherType === Number(voucherTypeFilter);

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

      return matchesSearch && matchesType && matchesVoucherType && matchesVisibility && matchesStatus;
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
  }, [searchTerm, statusFilter, typeFilter, voucherTypeFilter, visibilityFilter]);

  const getValidityBadge = (startDateStr: string, endDateStr: string, status: boolean) => {
    if (!status) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-550">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
          Tạm khóa
        </span>
      );
    }
    const now = new Date();
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);

    if (now < start) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-550"></span>
          Sắp diễn ra
        </span>
      );
    } else if (now > end) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
          Hết hạn
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600">
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Total Vouchers */}
        <div className="bg-white px-5 py-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-container/20 flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-[20px]">local_activity</span>
            </div>
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Tổng voucher</span>
          </div>
          <span className="text-2xl font-extrabold text-slate-800">{loading ? "..." : stats.total}</span>
        </div>

        {/* Active Vouchers */}
        <div className="bg-white px-5 py-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
              <span className="material-symbols-outlined text-[20px]">alarm_on</span>
            </div>
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Đang hoạt động</span>
          </div>
          <span className="text-2xl font-extrabold text-slate-800">{loading ? "..." : stats.active}</span>
        </div>

        {/* Total Usages */}
        <div className="bg-white px-5 py-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-650 shrink-0">
              <span className="material-symbols-outlined text-[20px]">receipt_long</span>
            </div>
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Lượt đã dùng</span>
          </div>
          <span className="text-2xl font-extrabold text-slate-800">{loading ? "..." : stats.totalUsages}</span>
        </div>

        {/* Top Performer */}
        <div className="bg-white px-5 py-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-all duration-300">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
              <span className="material-symbols-outlined text-[20px]">stars</span>
            </div>
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider truncate">Sử dụng nhiều nhất</span>
          </div>
          <span className="text-sm font-extrabold text-slate-800 truncate max-w-[120px] ml-2" title={stats.topVoucher}>
            {loading ? "..." : stats.topVoucher}
          </span>
        </div>
      </div>

      {/* Main List Section */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        
        {/* Search, filters block */}
        <div className="p-6 border-b border-slate-100 flex flex-wrap items-center gap-4 bg-slate-50/50">
          {/* Search box */}
          <div className="flex-1 min-w-[260px] relative">
            <span className="material-symbols-outlined text-slate-400 text-lg absolute left-4.5 top-1/2 -translate-y-1/2">
              search
            </span>
            <input
              type="text"
              placeholder="Tìm theo mã code hoặc tên voucher..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl font-semibold text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          {/* Validity filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all min-w-[150px] cursor-pointer"
          >
            <option value="all">Tất cả hiệu lực</option>
            <option value="ongoing">Đang hoạt động</option>
            <option value="upcoming">Sắp diễn ra</option>
            <option value="expired">Hết hạn</option>
            <option value="suspended">Đang tạm khóa</option>
          </select>

          {/* Voucher Type filter */}
          <select
            value={voucherTypeFilter}
            onChange={e => setVoucherTypeFilter(e.target.value)}
            className="px-4 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all min-w-[155px] cursor-pointer"
          >
            <option value="all">Tất cả loại voucher</option>
            <option value="1">Giảm giá sản phẩm</option>
            <option value="2">Giảm phí ship</option>
          </select>

          {/* Discount Type filter */}
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-4 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all min-w-[150px] cursor-pointer"
          >
            <option value="all">Tất cả loại giảm</option>
            <option value="1">Theo phần trăm (%)</option>
            <option value="2">Tiền cố định (đ)</option>
          </select>

          {/* Visibility filter */}
          <select
            value={visibilityFilter}
            onChange={e => setVisibilityFilter(e.target.value)}
            className="px-4 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all min-w-[150px] cursor-pointer"
          >
            <option value="all">Tất cả hiển thị</option>
            <option value="1">Công khai (Public)</option>
            <option value="2">Riêng tư (Exclusive)</option>
          </select>

          {/* Reset Filters button */}
          {(searchTerm || statusFilter !== "all" || voucherTypeFilter !== "all" || typeFilter !== "all" || visibilityFilter !== "all") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setVoucherTypeFilter("all");
                setTypeFilter("all");
                setVisibilityFilter("all");
              }}
              className="px-6 py-3 text-slate-500 font-bold text-sm rounded-2xl hover:bg-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">clear</span>
              Xóa bộ lọc
            </button>
          )}
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
                <tr className="bg-slate-50/50 border-b border-slate-100 text-[11px] font-bold text-slate-400 tracking-widest uppercase">
                  <th className="px-6 py-4 text-center w-[80px]">STT</th>
                  <th className="px-6 py-4">Mã Voucher</th>
                  <th className="px-6 py-4">Loại Voucher</th>
                  <th className="px-6 py-4">Mức giảm</th>
                  <th className="px-6 py-4">Tỉ lệ sử dụng</th>
                  <th className="px-6 py-4">Loại phân phối</th>
                  <th className="px-6 py-4 text-center">Trạng thái khóa</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {displayedVouchers.map((voucher, index) => {
                  const usedPct = voucher.totalQuantity > 0 
                    ? Math.round((voucher.usedQuantity / voucher.totalQuantity) * 100)
                    : 0;

                  return (
                    <tr key={voucher.voucherID} className="hover:bg-slate-100/70 transition-all duration-200 group">
                      {/* STT */}
                      <td className="px-6 py-4 text-center text-xs font-semibold text-slate-400">
                        {index + 1}
                      </td>
                      {/* Code */}
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-primary tracking-wider font-mono">
                          {voucher.code}
                        </span>
                      </td>

                      {/* Voucher Type */}
                      <td className="px-6 py-4 text-xs font-bold">
                        {voucher.voucherType === 2 ? (
                          <span className="inline-flex items-center gap-1.5 text-sky-600 text-xs font-bold">
                            <span className="material-symbols-outlined text-[14px]">local_shipping</span>
                            Giảm phí ship
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-primary text-xs font-bold">
                            <span className="material-symbols-outlined text-[14px]">local_mall</span>
                            Giảm sản phẩm
                          </span>
                        )}
                      </td>

                      {/* Discount Amount */}
                      <td className="px-6 py-4 text-sm font-bold text-slate-800">
                        {voucher.voucherType === 2 && voucher.isFreeShipping ? (
                          <span className="text-sky-600 font-extrabold">Free Shipping</span>
                        ) : voucher.discountType === 1 
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
                          voucher.exclusiveType === 2 ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-teal-650">
                              <span className="material-symbols-outlined text-[14px]">send</span>
                              Công khai - Phát tự động
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-650">
                              <span className="material-symbols-outlined text-[14px]">public</span>
                              Công khai
                            </span>
                          )
                        ) : (
                          voucher.exclusiveType === 1 ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600">
                              <span className="material-symbols-outlined text-[14px]">vpn_key</span>
                              Độc quyền - Nhập mã
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-violet-600">
                              <span className="material-symbols-outlined text-[14px]">lock</span>
                              Độc quyền - Phát trực tiếp
                            </span>
                          )
                        )}
                      </td>

                      {/* Validity/Status */}
                      <td className="px-6 py-4 text-center">
                        {getValidityBadge(voucher.startDate, voucher.endDate, voucher.status)}
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
                            onClick={() => handleToggleStatusClick(voucher)}
                            disabled={togglingId === voucher.voucherID}
                            className={`p-1.5 rounded-full transition-all duration-200 ${
                              voucher.status
                                ? "hover:bg-amber-50 text-amber-550 hover:text-amber-700 cursor-pointer"
                                : "hover:bg-emerald-50 text-emerald-650 hover:text-emerald-850 cursor-pointer"
                            }`}
                            title={voucher.status ? "Tạm khóa voucher" : "Mở khóa voucher"}
                          >
                            {togglingId === voucher.voucherID ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                            ) : (
                              <span className="material-symbols-outlined text-lg">
                                {voucher.status ? "lock" : "lock_open"}
                              </span>
                            )}
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
          <div className="bg-white rounded-3xl p-8 w-[380px] max-w-full border border-slate-100 shadow-2xl animate-in zoom-in-95 duration-200">
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
          <div className="bg-white rounded-3xl p-8 w-[380px] max-w-full border border-slate-100 shadow-2xl animate-in zoom-in-95 duration-200">
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
