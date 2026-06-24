"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "@/lib/toast";
import {
  fetchAllCategories,
  deleteCategory,
  toggleCategoryStatus,
  CategoryInfo,
  exportCategoriesExcel
} from "@/lib/features/categories/categoryApi";
import { getProducts } from "@/lib/api";
import CategoryStats from "@/components/admin/categories/CategoryStats";
import CategoryDeleteModal from "@/components/admin/categories/CategoryDeleteModal";

export default function AdminCategoriesPage() {
  const router = useRouter();

  // Loaders
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);

  const handleExportExcel = async () => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return;

      setExporting(true);
      const statusVal = selectedStatus === "active" ? true : selectedStatus === "inactive" ? false : null;
      const blob = await exportCategoriesExcel(token, searchTerm, statusVal);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `DanhSachDanhMuc_${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success("Xuất file Excel thành công!");
    } catch (err: any) {
      console.error(err);
      toast.error("Không thể xuất file Excel.");
    } finally {
      setExporting(false);
    }
  };

  // Data states
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [expandedIds, setExpandedIds] = useState<Record<number, boolean>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<"all" | "active" | "inactive">("all");
  const [totalProducts, setTotalProducts] = useState(0);

  // Deletion Modal states
  const [categoryToDelete, setCategoryToDelete] = useState<{ id: number; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadCategories = async () => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      setLoading(true);
      const data = await fetchAllCategories(token);
      setCategories(data);

      const prodRes = await getProducts(1, 1);
      if (prodRes) {
        setTotalProducts(prodRes.totalItems);
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Không thể tải danh sách danh mục.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleExpandAll = () => {
    const nextExpanded: Record<number, boolean> = {};
    categories.forEach(c => {
      nextExpanded[c.categoryID] = true;
    });
    setExpandedIds(nextExpanded);
  };

  const handleCollapseAll = () => {
    setExpandedIds({});
  };

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleToggleStatus = async (id: number) => {
    if (togglingId !== null) return;
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return;

      setTogglingId(id);
      const res = await toggleCategoryStatus(token, id);
      if (res.success) {
        toast.success(res.message || "Đã cập nhật trạng thái danh mục.");
        setCategories(prev =>
          prev.map(c => (c.categoryID === id ? { ...c, status: !c.status } : c))
        );
      } else {
        toast.error(res.message || "Lỗi khi cập nhật trạng thái.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Không thể cập nhật trạng thái danh mục.");
    } finally {
      setTogglingId(null);
    }
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete || deleting) return;
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return;

      setDeleting(true);
      const res = await deleteCategory(token, categoryToDelete.id);
      if (res.success) {
        toast.success("Xóa danh mục thành công.");
        setCategoryToDelete(null);
        loadCategories();
      } else {
        toast.error(res.message || "Không thể xóa danh mục này do có ràng buộc dữ liệu hoặc sản phẩm liên quan.", { duration: 5000 });
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Không thể xóa danh mục này do có ràng buộc dữ liệu hoặc sản phẩm liên quan.", { duration: 5000 });
    } finally {
      setDeleting(false);
    }
  };

  // Helper: Get category level (0, 1, 2)
  const getCategoryLevel = (cat: CategoryInfo): number => {
    if (!cat.parentID) return 0;
    const parent = categories.find(c => c.categoryID === cat.parentID);
    if (!parent) return 0;
    if (!parent.parentID) return 1;
    return 2;
  };

  // Helper: Get Icon based on name
  const getCategoryIcon = (name: string): string => {
    const lower = name.toLowerCase();
    if (lower.includes("sữa")) return "child_friendly";
    if (lower.includes("đồ chơi") || lower.includes("chơi")) return "toys";
    if (lower.includes("thời trang") || lower.includes("áo") || lower.includes("quần") || lower.includes("váy") || lower.includes("bé")) return "checkroom";
    if (lower.includes("tã") || lower.includes("bỉm")) return "baby_changing_station";
    if (lower.includes("dụng cụ") || lower.includes("ăn dặm")) return "flatware";
    if (lower.includes("sách") || lower.includes("vở")) return "menu_book";
    if (lower.includes("giày") || lower.includes("dép")) return "steps";
    if (lower.includes("ăn") || lower.includes("uống") || lower.includes("dinh dưỡng")) return "local_cafe";
    return "folder";
  };

  // Generate flat rows recursively based on expansion
  const generateFlatRows = (parentId: number | null): CategoryInfo[] => {
    const items = categories.filter(c => c.parentID === parentId);
    const sorted = [...items].sort((a, b) => {
      const orderA = Number(a.sortOrder) || 999;
      const orderB = Number(b.sortOrder) || 999;
      return orderA - orderB;
    });

    const rows: CategoryInfo[] = [];
    sorted.forEach(cat => {
      rows.push(cat);
      const isExpanded = expandedIds[cat.categoryID];
      if (isExpanded) {
        rows.push(...generateFlatRows(cat.categoryID));
      }
    });
    return rows;
  };

  // Filter & Search rows
  const getVisibleRows = (): CategoryInfo[] => {
    let filteredList = categories;

    // Apply search filter if active
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filteredList = categories.filter(c => {
        const matchSelf = c.categoryName.toLowerCase().includes(term) ||
          (c.description && c.description.toLowerCase().includes(term));

        const matchChildren = (catId: number): boolean => {
          const subCats = categories.filter(sub => sub.parentID === catId);
          return subCats.some(sub =>
            sub.categoryName.toLowerCase().includes(term) ||
            (sub.description && sub.description.toLowerCase().includes(term)) ||
            matchChildren(sub.categoryID)
          );
        };

        const isChildOfMatch = (catId: number): boolean => {
          const cat = categories.find(x => x.categoryID === catId);
          if (!cat || cat.parentID === null) return false;
          const parent = categories.find(p => p.categoryID === cat.parentID);
          if (!parent) return false;
          const matchParent = parent.categoryName.toLowerCase().includes(term) ||
            (parent.description && parent.description.toLowerCase().includes(term));
          return matchParent || isChildOfMatch(parent.categoryID);
        };

        return matchSelf || matchChildren(c.categoryID) || isChildOfMatch(c.categoryID);
      });
    }

    // Apply status filter if not "all"
    if (selectedStatus !== "all") {
      const targetStatus = selectedStatus === "active";
      filteredList = filteredList.filter(c => c.status === targetStatus);
    }

    // If search or status filter is active, display them as a flat list.
    if (searchTerm.trim() || selectedStatus !== "all") {
      return filteredList;
    }

    // Otherwise, generate flat rows recursively based on tree structure.
    return generateFlatRows(null);
  };

  const visibleRows = getVisibleRows();
  const rootCount = categories.filter(c => !c.parentID).length;

  return (
    <main className="w-full pb-20 animate-in fade-in duration-300">
      {/* Header */}
      <header className="mb-lg flex items-center justify-between">
        <div>
          <h1 className="font-headline-md text-headline-md text-primary font-bold">Quản lý danh mục</h1>
          <p className="font-body-md text-body-md text-on-surface-variant/70">Quản lý phân cấp phân loại sản phẩm trong hệ thống</p>
        </div>
        <div className="flex items-center gap-sm shrink-0">
          <button
            onClick={handleExportExcel}
            disabled={exporting}
            className="bg-emerald-600 text-white px-5 py-2.5 rounded-[8px] font-bold text-xs flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer disabled:opacity-50"
          >
            {exporting ? (
              <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div>
            ) : (
              <span className="material-symbols-outlined text-[18px]">download</span>
            )}
            Xuất Excel
          </button>
          <button
            onClick={() => router.push("/admin/categories/import")}
            className="border border-primary text-primary bg-white px-5 py-2.5 rounded-[8px] font-bold text-xs flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">upload_file</span>
            Import Excel
          </button>
          <button
            onClick={() => router.push("/admin/categories/new")}
            className="bg-primary text-on-primary px-5 py-2.5 rounded-[8px] font-bold text-xs flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            Thêm danh mục mới
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      <CategoryStats
        totalCategories={categories.length}
        totalProducts={totalProducts}
        hiddenCount={categories.filter(c => !c.status).length}
      />

      {/* Table grid area */}
      <div className="bg-white rounded-[8px] shadow-sm border border-slate-100 overflow-hidden">
        
        {/* Search & Filter Bar */}
        <div className="p-6 border-b border-slate-100 flex flex-wrap items-center gap-4 bg-slate-50/50">
          {/* Search box */}
          <div className="flex-1 min-w-[260px] relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              search
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm danh mục theo tên hoặc mô tả..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-[8px] font-semibold text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          {/* Status Dropdown */}
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value as any)}
            className="px-4 py-3 bg-white border border-slate-200 rounded-[8px] font-bold text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all min-w-[180px] cursor-pointer"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Đã ẩn</option>
          </select>

          {/* Expand/Collapse buttons */}
          {!searchTerm.trim() && selectedStatus === "all" && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExpandAll}
                className="border border-slate-200 bg-white text-slate-700 px-4 py-3 rounded-[8px] font-bold text-xs flex items-center gap-1.5 hover:bg-slate-50 transition-all cursor-pointer shadow-sm"
                title="Mở rộng tất cả danh mục"
              >
                <span className="material-symbols-outlined text-[18px]">unfold_more</span>
                Mở rộng
              </button>
              <button
                type="button"
                onClick={handleCollapseAll}
                className="border border-slate-200 bg-white text-slate-700 px-4 py-3 rounded-[8px] font-bold text-xs flex items-center gap-1.5 hover:bg-slate-50 transition-all cursor-pointer shadow-sm"
                title="Thu gọn tất cả danh mục"
              >
                <span className="material-symbols-outlined text-[18px]">unfold_less</span>
                Thu gọn
              </button>
            </div>
          )}

          {/* Reset Filters button */}
          {(searchTerm.trim() || selectedStatus !== "all") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedStatus("all");
              }}
              className="px-5 py-3 text-slate-500 font-bold text-sm rounded-[8px] hover:bg-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">clear</span>
              Xóa bộ lọc
            </button>
          )}
        </div>

        {/* Tree Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50/55 border-b border-slate-100 text-[11px] font-bold text-slate-400 tracking-widest uppercase">
                <th className="px-6 py-4 text-center w-[80px]">STT</th>
                <th className="px-8 py-4 w-[50%]">Tên danh mục</th>
                <th className="px-6 py-4 text-center">Thống kê sản phẩm</th>
                <th className="px-6 py-4 text-center">Trạng thái</th>
                <th className="px-8 py-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mx-auto"></div>
                    <p className="text-slate-400 mt-4 font-semibold text-sm">Đang tải dữ liệu danh mục...</p>
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-20">
                    <span className="material-symbols-outlined text-slate-300 text-5xl mb-2">category</span>
                    <p className="text-slate-400 font-bold text-sm">Chưa có danh mục nào được tạo.</p>
                  </td>
                </tr>
              ) : visibleRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-20">
                    <span className="material-symbols-outlined text-slate-300 text-5xl mb-2">search_off</span>
                    <p className="text-slate-400 font-bold text-sm">Không tìm thấy danh mục khớp với từ khóa.</p>
                  </td>
                </tr>
              ) : (
                visibleRows.map((cat, index) => {
                  const level = getCategoryLevel(cat);
                  const hasChildren = categories.some(child => child.parentID === cat.categoryID);
                  const isExpanded = !!expandedIds[cat.categoryID];
                  const icon = getCategoryIcon(cat.categoryName);

                  return (
                    <tr key={cat.categoryID} className="hover:bg-slate-100/70 transition-all duration-200 group">
                      {/* STT */}
                      <td className="px-6 py-4 text-center text-xs font-semibold text-slate-400">
                        {index + 1}
                      </td>
                      {/* Name with indentation & expand button */}
                      <td className="px-8 py-4">
                        <div
                          className="flex items-center gap-2"
                          style={{ paddingLeft: `${(searchTerm.trim() || selectedStatus !== "all" ? 0 : level) * 32}px` }}
                        >
                          {hasChildren && !searchTerm.trim() && selectedStatus === "all" ? (
                            <button
                              onClick={() => toggleExpand(cat.categoryID)}
                              className="w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center shrink-0 text-slate-500 transition-colors cursor-pointer"
                            >
                              <span className={`material-symbols-outlined text-[18px] transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}>
                                chevron_right
                              </span>
                            </button>
                          ) : (
                            <div className="w-7 h-7 flex items-center justify-center shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                            </div>
                          )}

                          <div className={`w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 shrink-0 border border-slate-100`}>
                            <span className="material-symbols-outlined text-base">{icon}</span>
                          </div>

                          <div className="min-w-0 ml-1">
                            <span className="font-bold text-slate-800 text-sm flex items-center gap-2">
                              {cat.categoryName}
                              {!cat.status && (
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-[8px] bg-slate-100 text-slate-400">
                                  Đã ẩn
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      </td>



                      {/* Statistics */}
                      <td className="px-6 py-4 text-center">
                        <span className="text-primary font-extrabold text-sm">
                          {cat.productCount ?? 0} sản phẩm
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className={`text-[10px] font-bold uppercase min-w-[55px] text-right ${cat.status ? "text-secondary" : "text-slate-400"}`}>
                            {cat.status ? "Hoạt động" : "Đã ẩn"}
                          </span>
                          <label className="relative inline-flex items-center cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={cat.status}
                              disabled={togglingId === cat.categoryID}
                              onChange={() => handleToggleStatus(cat.categoryID)}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                          </label>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-8 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Create Subcategory button (level < 2) */}
                          {level < 2 && (
                            <button
                              onClick={() => router.push(`/admin/categories/new?parentId=${cat.categoryID}`)}
                              className="w-8 h-8 rounded-full flex items-center justify-center text-secondary hover:bg-secondary-container/20 transition-all cursor-pointer"
                              title="Thêm danh mục con"
                            >
                              <span className="material-symbols-outlined text-[18px]">add_box</span>
                            </button>
                          )}
                          <Link
                            href={`/admin/categories/${cat.categoryID}`}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-primary hover:bg-primary-container/20 transition-all cursor-pointer"
                            title="Xem chi tiết"
                          >
                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                          </Link>
                          <button
                            onClick={() => router.push(`/admin/categories/edit/${cat.categoryID}`)}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-all cursor-pointer"
                            title="Chỉnh sửa"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button
                            onClick={() => setCategoryToDelete({ id: cat.categoryID, name: cat.categoryName })}
                            disabled={(cat.productCount ?? 0) > 0}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                              (cat.productCount ?? 0) > 0
                                ? "opacity-30 cursor-not-allowed text-slate-300"
                                : "text-error hover:bg-error-container/20 cursor-pointer"
                            }`}
                            title={(cat.productCount ?? 0) > 0 ? "Không thể xóa danh mục có liên kết sản phẩm" : "Xóa danh mục"}
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <CategoryDeleteModal
        categoryToDelete={categoryToDelete}
        deleting={deleting}
        onCancel={() => setCategoryToDelete(null)}
        onConfirm={confirmDeleteCategory}
      />
    </main>
  );
}
