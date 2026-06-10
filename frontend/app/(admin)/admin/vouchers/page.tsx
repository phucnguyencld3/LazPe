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
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/admin/ui/Table";
import Badge from "@/components/admin/ui/Badge";
import Button from "@/components/admin/ui/Button";
import Input from "@/components/admin/ui/Input";
import { StatsCard } from "@/components/admin/ui/Card";
import Modal from "@/components/admin/ui/Modal";

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
        <Badge color="error" variant="light" size="sm" startIcon={<span className="w-1.5 h-1.5 rounded-full bg-current"></span>}>
          Tạm khóa
        </Badge>
      );
    }
    const now = new Date();
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);

    if (now < start) {
      return (
        <Badge color="warning" variant="light" size="sm" startIcon={<span className="w-1.5 h-1.5 rounded-full bg-current"></span>}>
          Sắp diễn ra
        </Badge>
      );
    } else if (now > end) {
      return (
        <Badge color="light" variant="light" size="sm" startIcon={<span className="w-1.5 h-1.5 rounded-full bg-current"></span>}>
          Hết hạn
        </Badge>
      );
    } else {
      return (
        <Badge color="success" variant="light" size="sm" startIcon={<span className="w-1.5 h-1.5 rounded-full bg-current"></span>}>
          Đang hoạt động
        </Badge>
      );
    }
  };

  return (
    <main className="w-full pb-20 animate-in fade-in duration-300 font-outfit space-y-6">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 pt-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white/90 tracking-tight flex items-center gap-2">
            <span className="material-symbols-outlined text-brand-500 text-3xl">local_activity</span>
            Quản lý Voucher
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Thiết lập các chương trình khuyến mãi, phân phối voucher công khai hoặc chỉ định cho người dùng cụ thể.
          </p>
        </div>
        <Button
          onClick={handleOpenCreateForm}
          variant="primary"
          className="font-bold"
          startIcon={<span className="material-symbols-outlined text-[18px]">add</span>}
        >
          Tạo Voucher Mới
        </Button>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 font-outfit">
        <StatsCard
          title="Tổng số voucher"
          value={loading ? "..." : stats.total}
          icon={<span className="material-symbols-outlined text-[24px]">local_activity</span>}
          iconBgColor="bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400"
        />
        <StatsCard
          title="Đang chạy có hiệu lực"
          value={loading ? "..." : stats.active}
          icon={<span className="material-symbols-outlined text-[24px]">alarm_on</span>}
          iconBgColor="bg-success-50 text-success-500 dark:bg-success-500/10 dark:text-success-400"
        />
        <StatsCard
          title="Tổng số lượt đã dùng"
          value={loading ? "..." : stats.totalUsages}
          icon={<span className="material-symbols-outlined text-[24px]">receipt_long</span>}
          iconBgColor="bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400"
        />
        <StatsCard
          title="Sử dụng nhiều nhất"
          value={loading ? "..." : stats.topVoucher}
          icon={<span className="material-symbols-outlined text-[24px]">stars</span>}
          iconBgColor="bg-warning-50 text-warning-500 dark:bg-warning-500/10 dark:text-orange-400"
        />
      </div>

      {/* Main List Section */}
      <div className="bg-white dark:bg-white/[0.03] rounded-[2rem] border border-gray-100 dark:border-white/[0.05] shadow-theme-xs overflow-hidden">
        
        {/* Search, filters block */}
        <div className="p-6 border-b border-gray-100 dark:border-white/[0.05] flex flex-col xl:flex-row gap-4 items-center justify-between bg-gray-50/30 dark:bg-gray-900/10">
          {/* Search input */}
          <div className="w-full xl:w-80 relative group">
            <Input
              placeholder="Tìm theo mã code hoặc tên voucher..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-11"
            />
            <span className="material-symbols-outlined text-gray-400 dark:text-gray-500 text-[18px] absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-brand-500 transition-colors pointer-events-none">
              search
            </span>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-650"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>

          {/* Filtering panels */}
          <div className="w-full xl:w-auto flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
            
            {/* Validity filter */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase whitespace-nowrap">Hiệu lực:</span>
              <Input
                options={[
                  { value: "all", label: "Tất cả" },
                  { value: "ongoing", label: "Đang hoạt động" },
                  { value: "upcoming", label: "Sắp diễn ra" },
                  { value: "expired", label: "Hết hạn" },
                  { value: "suspended", label: "Đang tạm khóa" },
                ]}
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="!py-1.5 !h-9 text-xs"
              />
            </div>

            {/* Discount Type filter */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase whitespace-nowrap">Loại giảm:</span>
              <Input
                options={[
                  { value: "all", label: "Tất cả" },
                  { value: "1", label: "Theo phần trăm (%)" },
                  { value: "2", label: "Tiền cố định (đ)" },
                ]}
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                className="!py-1.5 !h-9 text-xs"
              />
            </div>

            {/* Visibility filter */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase whitespace-nowrap">Hiển thị:</span>
              <Input
                options={[
                  { value: "all", label: "Tất cả" },
                  { value: "1", label: "Công khai (Public)" },
                  { value: "2", label: "Riêng tư (Exclusive)" },
                ]}
                value={visibilityFilter}
                onChange={e => setVisibilityFilter(e.target.value)}
                className="!py-1.5 !h-9 text-xs"
              />
            </div>

          </div>
        </div>

        {/* Vouchers Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center py-24">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-500"></div>
            </div>
          ) : displayedVouchers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400 dark:text-gray-500">
              <span className="material-symbols-outlined text-5xl mb-3 text-gray-200 dark:text-gray-800">
                search_off
              </span>
              <p className="text-sm font-bold">Không tìm thấy voucher nào</p>
              <p className="text-xs text-gray-450 mt-1">Hãy thử thay đổi điều kiện lọc hoặc tạo mới voucher</p>
            </div>
          ) : (
            <Table className="!rounded-none border-0 shadow-none bg-transparent">
              <TableHeader>
                <TableRow>
                  <TableCell isHeader>Mã Voucher</TableCell>
                  <TableCell isHeader>Mức giảm</TableCell>
                  <TableCell isHeader>Tỉ lệ sử dụng</TableCell>
                  <TableCell isHeader>Loại phân phối</TableCell>
                  <TableCell isHeader className="text-center">Trạng thái khóa</TableCell>
                  <TableCell isHeader className="text-right">Thao tác</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedVouchers.map(voucher => {
                  const usedPct = voucher.totalQuantity > 0 
                    ? Math.round((voucher.usedQuantity / voucher.totalQuantity) * 100)
                    : 0;

                  return (
                    <TableRow key={voucher.voucherID}>
                      {/* Code */}
                      <TableCell>
                        <span className="inline-flex items-center px-3 py-1.5 bg-brand-50/50 border border-dashed border-brand-500/30 dark:bg-brand-500/5 dark:border-brand-500/20 rounded-xl text-xs font-bold text-brand-500 tracking-wider font-mono">
                          {voucher.code}
                        </span>
                      </TableCell>

                      {/* Discount Amount */}
                      <TableCell className="text-sm font-bold text-gray-800 dark:text-white/95">
                        {voucher.discountType === 1 
                          ? `${voucher.discountValue}%` 
                          : formatCurrency(voucher.discountValue)}
                      </TableCell>

                      {/* Usage bar */}
                      <TableCell>
                        <div className="w-32">
                          <div className="flex justify-between items-center text-[10px] text-gray-400 dark:text-gray-500 font-bold mb-1">
                            <span>{voucher.usedQuantity}/{voucher.totalQuantity}</span>
                            <span>{usedPct}%</span>
                          </div>
                          <div className="w-full bg-gray-100 dark:bg-white/10 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className="bg-brand-500 h-full rounded-full" 
                              style={{ width: `${Math.min(100, usedPct)}%` }}
                            ></div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Visibility / Exclusive type */}
                      <TableCell>
                        {voucher.visibilityType === 1 ? (
                          voucher.exclusiveType === 2 ? (
                            <Badge color="info" variant="light" size="sm" startIcon={<span className="material-symbols-outlined text-[14px]">send</span>}>
                              Công khai - Phát tự động
                            </Badge>
                          ) : (
                            <Badge color="success" variant="light" size="sm" startIcon={<span className="material-symbols-outlined text-[14px]">public</span>}>
                              Công khai
                            </Badge>
                          )
                        ) : (
                          voucher.exclusiveType === 1 ? (
                            <Badge color="primary" variant="light" size="sm" startIcon={<span className="material-symbols-outlined text-[14px]">vpn_key</span>}>
                              Độc quyền - Nhập mã
                            </Badge>
                          ) : (
                            <Badge color="primary" variant="light" size="sm" startIcon={<span className="material-symbols-outlined text-[14px]">lock</span>}>
                              Độc quyền - Phát trực tiếp
                            </Badge>
                          )
                        )}
                      </TableCell>

                      {/* Validity/Status */}
                      <TableCell className="text-center">
                        {getValidityBadge(voucher.startDate, voucher.endDate, voucher.status)}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenDetailModal(voucher)}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5 transition-colors"
                            title="Xem chi tiết & lịch sử sử dụng"
                          >
                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                          </button>

                          <button
                            onClick={() => handleToggleStatusClick(voucher)}
                            disabled={togglingId === voucher.voucherID}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                              voucher.status
                                ? "text-warning-600 hover:bg-warning-50 dark:hover:bg-warning-500/10"
                                : "text-success-600 hover:bg-success-50 dark:hover:bg-success-500/10"
                            }`}
                            title={voucher.status ? "Tạm khóa voucher" : "Mở khóa voucher"}
                          >
                            {togglingId === voucher.voucherID ? (
                              <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-current border-t-transparent"></div>
                            ) : (
                              <span className="material-symbols-outlined text-[18px]">
                                {voucher.status ? "lock" : "lock_open"}
                              </span>
                            )}
                          </button>
                          
                          <button
                            onClick={() => handleOpenEditForm(voucher)}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5 transition-colors"
                            title="Sửa"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          
                          <button
                            onClick={() => handleDeleteClick(voucher)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                              voucher.usedQuantity > 0 
                                ? "opacity-30 cursor-not-allowed text-gray-300 dark:text-gray-700" 
                                : "text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10"
                            }`}
                            disabled={voucher.usedQuantity > 0}
                            title={voucher.usedQuantity > 0 ? "Không thể xóa voucher đã dùng" : "Xóa"}
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Pagination bar */}
        {
          totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          )
        }
      </div >

      {/* Form Modal (Create / Edit) */}
      {
        isFormOpen && token && (
          <VoucherFormModal
            voucher={selectedVoucherForEdit}
            token={token}
            onClose={() => {
              setIsFormOpen(false);
              setSelectedVoucherForEdit(null);
            }}
            onSaveSuccess={handleSaveSuccess}
          />
        )
      }

      {/* Detail / History Modal */}
      {
        selectedVoucherForDetail && token && (
          <VoucherDetailModal
            voucher={selectedVoucherForDetail}
            token={token}
            onClose={() => setSelectedVoucherForDetail(null)}
            onRefreshVoucher={handleRefresh}
          />
        )
      }

      {/* Confirmation Modal: Delete */}
      <Modal isOpen={voucherToDelete !== null} onClose={() => setVoucherToDelete(null)} showCloseButton={true} className="!max-w-sm">
        {voucherToDelete && (
          <div className="font-outfit p-1 text-center flex flex-col items-center">
            <div className="w-14 h-14 bg-error-50 dark:bg-error-500/10 text-error-500 rounded-full flex items-center justify-center mb-4 border border-error-100 dark:border-error-500/20">
              <span className="material-symbols-outlined text-2xl">warning</span>
            </div>
            <h3 className="text-base font-bold text-gray-800 dark:text-white/90">Xác nhận xóa Voucher?</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 px-1 leading-relaxed">
              Bạn có chắc chắn muốn xóa vĩnh viễn voucher <span className="font-bold text-gray-800 dark:text-white">"{voucherToDelete.code}"</span>?
              Hành động này sẽ xóa dữ liệu voucher khỏi hệ thống và không thể hoàn tác.
            </p>

            <div className="flex items-center gap-3 w-full mt-6">
              <Button
                onClick={() => setVoucherToDelete(null)}
                disabled={deletingId !== null}
                variant="secondary"
                className="flex-1"
              >
                Hủy bỏ
              </Button>
              <Button
                onClick={confirmDelete}
                disabled={deletingId !== null}
                isLoading={deletingId !== null}
                variant="danger"
                className="flex-1"
              >
                Xác nhận xóa
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirmation Modal: Toggle Status */}
      <Modal isOpen={voucherToToggle !== null} onClose={() => setVoucherToToggle(null)} showCloseButton={true} className="!max-w-sm">
        {voucherToToggle && (
          <div className="font-outfit p-1 text-center flex flex-col items-center">
            <div className="w-14 h-14 bg-warning-50 dark:bg-warning-500/10 text-warning-500 rounded-full flex items-center justify-center mb-4 border border-warning-100 dark:border-warning-500/20">
              <span className="material-symbols-outlined text-2xl">info</span>
            </div>
            <h3 className="text-base font-bold text-gray-800 dark:text-white/90">
              {voucherToToggle.status ? "Khóa Voucher?" : "Mở khóa Voucher?"}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 px-1 leading-relaxed">
              Bạn có chắc chắn muốn {voucherToToggle.status ? "tạm thời khóa/vô hiệu hóa" : "kích hoạt mở khóa"} voucher 
              <span className="font-bold text-gray-800 dark:text-white"> "{voucherToToggle.code}"</span>?
              {voucherToToggle.status 
                ? " Khách hàng sẽ không thể áp dụng voucher này khi thanh toán đơn hàng nữa." 
                : " Voucher sẽ tiếp tục có hiệu lực cho khách hàng mua sắm."}
            </p>

            <div className="flex items-center gap-3 w-full mt-6">
              <Button
                onClick={() => setVoucherToToggle(null)}
                disabled={togglingId !== null}
                variant="secondary"
                className="flex-1"
              >
                Hủy bỏ
              </Button>
              <Button
                onClick={confirmToggleStatus}
                disabled={togglingId !== null}
                isLoading={togglingId !== null}
                variant="primary"
                className="flex-1"
              >
                Xác nhận
              </Button>
            </div>
          </div>
        )}
      </Modal>

    </main>
  );
}
