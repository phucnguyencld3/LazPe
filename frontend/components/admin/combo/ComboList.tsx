import React, { useState, useEffect } from "react";
import { 
  Search, 
  Plus, 
  Grid, 
  List, 
  RotateCcw, 
  Edit, 
  Trash2, 
  Loader, 
  TrendingDown, 
  Tag, 
  AlertTriangle
} from "lucide-react";
import { toast } from "@/lib/toast";
import { formatCurrency } from "@/lib/utils/formatters";
import { 
  getBundles, 
  deleteBundle, 
  toggleBundleStatus, 
  BundleResponse 
} from "@/lib/features/combo/comboApi";
import Button from "@/components/admin/ui/Button";
import Input from "@/components/admin/ui/Input";
import Badge from "@/components/admin/ui/Badge";
import Modal from "@/components/admin/ui/Modal";
import { StatsCard } from "@/components/admin/ui/Card";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/admin/ui/Table";

interface ComboListProps {
  token: string;
  onCreateClick: () => void;
  onEditClick: (bundleId: number) => void;
}

export const ComboList: React.FC<ComboListProps> = ({
  token,
  onCreateClick,
  onEditClick,
}) => {
  const [bundles, setBundles] = useState<BundleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  
  // View mode: grid or table
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "price-asc" | "price-desc" | "discount-desc">("newest");

  // Deletion Modal
  const [bundleToDelete, setBundleToDelete] = useState<BundleResponse | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Status Toggling State (to disable double-clicks)
  const [togglingId, setTogglingId] = useState<number | null>(null);

  useEffect(() => {
    loadBundles();
  }, []);

  const loadBundles = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await getBundles(token);
      setBundles(data);
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải danh sách combo sản phẩm.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    if (!token || togglingId !== null) return;
    setTogglingId(id);
    try {
      const res = await toggleBundleStatus(id, token);
      if (res.success) {
        toast.success(
          currentStatus 
            ? "Đã tạm dừng hoạt động combo." 
            : "Đã kích hoạt hoạt động combo."
        );
        // Optimistic UI update
        setBundles((prev) =>
          prev.map((b) => (b.bundleID === id ? { ...b, status: !currentStatus } : b))
        );
      } else {
        toast.error(res.message || "Không thể cập nhật trạng thái.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Có lỗi xảy ra khi thay đổi trạng thái.");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteClick = (bundle: BundleResponse) => {
    setBundleToDelete(bundle);
  };

  const confirmDelete = async () => {
    if (!bundleToDelete || !token) return;
    setDeleting(true);
    try {
      const res = await deleteBundle(bundleToDelete.bundleID, token);
      if (res.success) {
        toast.success("Xóa combo sản phẩm thành công!");
        setBundles((prev) => prev.filter((b) => b.bundleID !== bundleToDelete.bundleID));
        setBundleToDelete(null);
      } else {
        toast.error(res.message || "Lỗi khi xóa combo.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Không thể kết nối đến máy chủ.");
    } finally {
      setDeleting(false);
    }
  };

  // Filter and sort bundles locally
  const filteredBundles = bundles
    .filter((bundle) => {
      const matchesSearch = 
        bundle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (bundle.description && bundle.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (bundle.code && bundle.code.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = 
        statusFilter === "all" ||
        (statusFilter === "active" && bundle.status) ||
        (statusFilter === "inactive" && !bundle.status);

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.createdDate || "").getTime() - new Date(a.createdDate || "").getTime();
      }
      if (sortBy === "oldest") {
        return new Date(a.createdDate || "").getTime() - new Date(b.createdDate || "").getTime();
      }
      if (sortBy === "price-asc") {
        return a.price - b.price;
      }
      if (sortBy === "price-desc") {
        return b.price - a.price;
      }
      if (sortBy === "discount-desc") {
        return b.discountPercent - a.discountPercent;
      }
      return 0;
    });

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setSortBy("newest");
  };

  // Calculate statistics
  const totalCombos = bundles.length;
  const activeCombos = bundles.filter(b => b.status).length;
  const inactiveCombos = totalCombos - activeCombos;
  const avgDiscount = totalCombos > 0 
    ? Math.round(bundles.reduce((sum, b) => sum + b.discountPercent, 0) / totalCombos) 
    : 0;

  return (
    <div className="space-y-8 font-outfit">
      {/* Header Bar */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-800 dark:text-white/90">
            Quản lý Combo sản phẩm
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Tạo và cấu hình các gói sản phẩm đi kèm với giá ưu đãi để tăng doanh thu
          </p>
        </div>
        <Button
          onClick={onCreateClick}
          variant="primary"
          className="rounded-full shadow-theme-xs font-bold text-xs"
          startIcon={<Plus size={16} />}
        >
          Tạo Combo mới
        </Button>
      </header>

      {/* Stats Cards Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Tổng số Combo"
          value={loading ? "..." : totalCombos}
          icon={<Tag size={24} />}
          iconBgColor="bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400"
        />
        <StatsCard
          title="Đang hoạt động"
          value={loading ? "..." : activeCombos}
          icon={<span className="material-symbols-outlined text-[24px]">check_circle</span>}
          iconBgColor="bg-success-50 text-success-500 dark:bg-success-500/10 dark:text-success-400"
        />
        <StatsCard
          title="Tạm dừng hoạt động"
          value={loading ? "..." : inactiveCombos}
          icon={<span className="material-symbols-outlined text-[24px]">pause_circle</span>}
          iconBgColor="bg-warning-50 text-warning-500 dark:bg-warning-500/10 dark:text-orange-400"
        />
        <StatsCard
          title="Giảm giá trung bình"
          value={loading ? "..." : `${avgDiscount}%`}
          icon={<TrendingDown size={24} />}
          iconBgColor="bg-error-50 text-error-500 dark:bg-error-500/10 dark:text-error-400"
          className="[&_h3]:text-error-500 dark:[&_h3]:text-error-400"
        />
      </div>

      {/* Filter and Content Card */}
      <div className="bg-white dark:bg-gray-950 rounded-[2rem] border border-gray-150 dark:border-white/[0.05] shadow-theme-xs overflow-hidden">
        {/* Tool Filter Bar */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-4 bg-gray-50/30 dark:bg-white/[0.01]">
          <div className="flex flex-wrap items-center gap-4 flex-1">
            {/* Search Box */}
            <div className="relative min-w-[260px] flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm combo theo tên, mã..."
                className="w-full pl-11 pr-4 py-2.5 bg-transparent border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:border-brand-500 focus:ring-3 focus:ring-brand-500/10 text-sm font-semibold text-gray-800 dark:text-white/90 placeholder:text-gray-400 dark:placeholder:text-white/30 transition-all"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2.5 bg-transparent border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:border-brand-500 focus:ring-3 focus:ring-brand-500/10 text-sm font-bold text-gray-850 dark:text-white/95 dark:bg-gray-900 cursor-pointer transition-all"
            >
              <option value="all">Trạng thái (Tất cả)</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Tạm ngưng</option>
            </select>

            {/* Sort Filter */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2.5 bg-transparent border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:border-brand-500 focus:ring-3 focus:ring-brand-500/10 text-sm font-bold text-gray-850 dark:text-white/95 dark:bg-gray-900 cursor-pointer transition-all"
            >
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
              <option value="price-asc">Giá: Thấp đến Cao</option>
              <option value="price-desc">Giá: Cao đến Thấp</option>
              <option value="discount-desc">% Giảm: Nhiều nhất</option>
            </select>

            {/* Reset Filters */}
            {(searchTerm || statusFilter !== "all" || sortBy !== "newest") && (
              <button
                onClick={resetFilters}
                className="px-4 py-2 text-gray-500 hover:text-brand-500 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-all flex items-center gap-1.5 font-bold text-xs cursor-pointer"
              >
                <RotateCcw size={14} />
                <span>Đặt lại bộ lọc</span>
              </button>
            )}
          </div>

          {/* View Mode Toggles */}
          <div className="flex items-center gap-1 border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-white/5 p-1 rounded-xl shrink-0">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "grid" 
                  ? "bg-white dark:bg-gray-800 text-brand-500 shadow-xs" 
                  : "text-gray-400 hover:text-gray-655"
              }`}
              title="Xem dạng lưới"
            >
              <Grid size={16} />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "table" 
                  ? "bg-white dark:bg-gray-800 text-brand-500 shadow-xs" 
                  : "text-gray-400 hover:text-gray-655"
              }`}
              title="Xem dạng bảng"
            >
              <List size={16} />
            </button>
          </div>
        </div>

        {/* Content List Area */}
        {loading ? (
          <div className="py-24 text-center text-gray-400 flex flex-col items-center justify-center">
            <Loader className="animate-spin text-brand-500 h-9 w-9 mb-4" />
            <p className="text-sm font-bold uppercase tracking-wider">Đang tải danh sách combo...</p>
          </div>
        ) : filteredBundles.length === 0 ? (
          <div className="py-24 text-center text-gray-400 dark:text-gray-500 flex flex-col items-center justify-center">
            <span className="material-symbols-outlined text-5xl text-gray-200 dark:text-gray-800 mb-3">inventory_2</span>
            <p className="text-base font-bold">Không tìm thấy combo sản phẩm nào</p>
            <p className="text-xs text-gray-450 dark:text-gray-500 mt-1">Vui lòng điều chỉnh tiêu chí tìm kiếm hoặc tạo mới combo</p>
          </div>
        ) : viewMode === "grid" ? (
          /* Grid Layout */
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredBundles.map((bundle) => (
              <div 
                key={bundle.bundleID}
                className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-150 dark:border-gray-800 shadow-theme-xs hover:shadow-theme-md hover:border-brand-500/20 transition-all duration-300 flex flex-col overflow-hidden group"
              >
                {/* Thumbnail Image Container */}
                <div className="relative aspect-video w-full bg-gray-50 dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 flex items-center justify-center overflow-hidden">
                  {bundle.imageUrl ? (
                    <img 
                      src={bundle.imageUrl} 
                      alt={bundle.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-750">inventory_2</span>
                  )}

                  {/* Discount Badge */}
                  {bundle.discountPercent > 0 && (
                    <div className="absolute top-4 left-4 bg-error-500 text-white font-extrabold text-xs px-2.5 py-1 rounded-full shadow-sm flex items-center gap-0.5">
                      <TrendingDown size={12} />
                      <span>-{bundle.discountPercent}%</span>
                    </div>
                  )}

                  {/* Quick Edit Overlay */}
                  <div className="absolute inset-0 bg-slate-950/20 dark:bg-black/40 backdrop-blur-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 gap-3">
                    <button
                      onClick={() => onEditClick(bundle.bundleID)}
                      className="p-2.5 bg-white text-slate-800 hover:text-brand-500 rounded-full shadow-md hover:scale-110 active:scale-95 transition-all font-bold cursor-pointer"
                      title="Sửa Combo"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(bundle)}
                      className="p-2.5 bg-white text-slate-800 hover:text-error-500 rounded-full shadow-md hover:scale-110 active:scale-95 transition-all font-bold cursor-pointer"
                      title="Xóa Combo"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Card Text Content */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-bold text-gray-800 dark:text-white/90 text-sm leading-snug line-clamp-1 group-hover:text-brand-500 transition-colors">
                        {bundle.name}
                      </h4>
                      <span className="text-[10px] font-bold text-gray-400 dark:text-gray-550 uppercase shrink-0">
                        {bundle.code || `ID: ${bundle.bundleID}`}
                      </span>
                    </div>

                    <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-2 min-h-[32px]">
                      {bundle.description || "Không có mô tả chi tiết cho combo này."}
                    </p>

                    {/* Mini Item Indicators */}
                    {bundle.items && bundle.items.length > 0 && (
                      <div className="pt-2 flex items-center gap-1.5 overflow-hidden">
                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mr-1">
                          Sản phẩm:
                        </span>
                        <div className="flex -space-x-2 overflow-hidden">
                          {bundle.items.slice(0, 4).map((item, index) => (
                            <div 
                              key={item.bundleItemID || index}
                              className="w-6 h-6 rounded-full border border-white dark:border-gray-900 bg-gray-100 dark:bg-gray-800 overflow-hidden flex items-center justify-center shrink-0"
                              title={`${item.productName} (${item.quantity} chiếc)`}
                            >
                              {item.imageUrl ? (
                                <img src={item.imageUrl} alt={item.variantName} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-[8px] font-bold text-gray-400 dark:text-gray-555">P</span>
                              )}
                            </div>
                          ))}
                        </div>
                        {bundle.items.length > 4 && (
                          <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/5 px-1.5 py-0.5 rounded-full">
                            +{bundle.items.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Pricing and Switch Status footer */}
                  <div className="border-t border-gray-100 dark:border-gray-800 pt-4 mt-4 flex items-center justify-between">
                    <div>
                      {bundle.discountPercent > 0 && (
                        <span className="text-xs text-gray-400 dark:text-gray-500 line-through block font-medium">
                          {formatCurrency(bundle.originalPrice)}
                        </span>
                      )}
                      <span className="font-extrabold text-brand-500 dark:text-brand-400 text-base">
                        {formatCurrency(bundle.price)}
                      </span>
                    </div>

                    {/* Status switch */}
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase ${bundle.status ? "text-success-500" : "text-gray-400 dark:text-gray-550"}`}>
                        {bundle.status ? "Đang bán" : "Tạm dừng"}
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={bundle.status}
                          disabled={togglingId === bundle.bundleID}
                          onChange={() => handleToggleStatus(bundle.bundleID, bundle.status)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-200 dark:bg-gray-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-500"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Table Layout */
          <div className="overflow-x-auto">
            <Table className="border-none shadow-none rounded-none">
              <TableHeader className="bg-gray-50/50 dark:bg-white/[0.02] border-b border-gray-100 dark:border-gray-800">
                <TableRow>
                  <TableCell isHeader>Combo</TableCell>
                  <TableCell isHeader>Mã</TableCell>
                  <TableCell isHeader>Giá gốc</TableCell>
                  <TableCell isHeader>Giá Combo</TableCell>
                  <TableCell isHeader className="text-center">Giảm giá</TableCell>
                  <TableCell isHeader className="text-center">Trạng thái</TableCell>
                  <TableCell isHeader className="text-right">Hành động</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredBundles.map((bundle) => (
                  <TableRow key={bundle.bundleID}>
                    {/* Item Detail */}
                    <TableCell>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-900 flex-shrink-0 border border-gray-100 dark:border-gray-800 flex items-center justify-center">
                          {bundle.imageUrl ? (
                            <img src={bundle.imageUrl} alt={bundle.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="material-symbols-outlined text-gray-400 dark:text-gray-600">inventory_2</span>
                          )}
                        </div>
                        <div>
                          <h5 className="font-bold text-gray-800 dark:text-white/90 text-sm group-hover:text-brand-500 transition-colors">
                            {bundle.name}
                          </h5>
                          {bundle.items && bundle.items.length > 0 ? (
                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mt-0.5">
                              {bundle.items.length} sản phẩm trong gói
                            </p>
                          ) : (
                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mt-0.5">
                              Chưa có sản phẩm
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Code */}
                    <TableCell>
                      <span className="text-xs font-bold text-gray-600 dark:text-gray-400 font-mono">
                        {bundle.code || `ID: ${bundle.bundleID}`}
                      </span>
                    </TableCell>

                    {/* Original Price */}
                    <TableCell>
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                        {formatCurrency(bundle.originalPrice)}
                      </span>
                    </TableCell>

                    {/* Final Price */}
                    <TableCell>
                      <span className="text-sm font-extrabold text-brand-500 dark:text-brand-400">
                        {formatCurrency(bundle.price)}
                      </span>
                    </TableCell>

                    {/* Discount */}
                    <TableCell className="text-center">
                      {bundle.discountPercent > 0 ? (
                        <Badge color="error" variant="light" size="sm">
                          -{bundle.discountPercent}%
                        </Badge>
                      ) : (
                        <span className="text-xs font-semibold text-gray-400">-</span>
                      )}
                    </TableCell>

                    {/* Status Switch */}
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className={`text-[10px] font-bold uppercase min-w-[50px] text-right ${bundle.status ? "text-success-500" : "text-gray-400 dark:text-gray-550"}`}>
                          {bundle.status ? "Đang bán" : "Tạm ẩn"}
                        </span>
                        <label className="relative inline-flex items-center cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={bundle.status}
                            disabled={togglingId === bundle.bundleID}
                            onChange={() => handleToggleStatus(bundle.bundleID, bundle.status)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-gray-200 dark:bg-gray-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-500"></div>
                        </label>
                      </div>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="icon"
                          onClick={() => onEditClick(bundle.bundleID)}
                          title="Sửa"
                        >
                          <Edit size={15} />
                        </Button>
                        <Button
                          variant="icon"
                          onClick={() => handleDeleteClick(bundle)}
                          title="Xóa"
                          className="hover:text-error-500 dark:hover:text-error-400"
                        >
                          <Trash2 size={15} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Custom Delete Confirmation Modal */}
      <Modal
        isOpen={!!bundleToDelete}
        onClose={() => setBundleToDelete(null)}
        showCloseButton={!deleting}
        className="max-w-md"
      >
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-error-50 dark:bg-error-500/15 flex items-center justify-center text-error-500">
            <AlertTriangle size={24} />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white/90">Xác nhận xóa Combo</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 font-semibold leading-relaxed">
              Bạn có chắc chắn muốn xóa combo sản phẩm <span className="text-gray-800 dark:text-white font-bold">"{bundleToDelete?.name}"</span>?
              Hành động này không thể hoàn tác và sẽ xóa bỏ vĩnh viễn gói combo này khỏi hệ thống.
            </p>
          </div>
        </div>
        
        <div className="pt-6 mt-6 border-t border-gray-100 dark:border-gray-850 flex items-center justify-end gap-3">
          <Button
            type="button"
            onClick={() => setBundleToDelete(null)}
            variant="secondary"
            className="rounded-full text-xs font-bold py-2"
            disabled={deleting}
          >
            Hủy bỏ
          </Button>
          <Button
            type="button"
            onClick={confirmDelete}
            variant="danger"
            isLoading={deleting}
            className="rounded-full text-xs font-bold py-2"
          >
            Xác nhận xóa
          </Button>
        </div>
      </Modal>
    </div>
  );
};
