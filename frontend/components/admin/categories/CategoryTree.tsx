"use client";

import Link from "next/link";
import { CategoryInfo } from "@/lib/features/categories/categoryApi";

interface CategoryTreeProps {
  categories: CategoryInfo[];
  expandedIds: Record<number, boolean>;
  searchTerm: string;
  rootCount: number;
  onSearchChange: (value: string) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onToggleExpand: (id: number) => void;
  onAddSub: (category: CategoryInfo) => void;
  onEdit: (category: CategoryInfo) => void;
  onDelete: (category: CategoryInfo) => void;
  onShowDescription: (category: CategoryInfo) => void;
  className?: string;
}

export default function CategoryTree({
  categories,
  expandedIds,
  searchTerm,
  rootCount,
  onSearchChange,
  onExpandAll,
  onCollapseAll,
  onToggleExpand,
  onAddSub,
  onEdit,
  onDelete,
  onShowDescription,
  className = "lg:col-span-8"
}: CategoryTreeProps) {
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

  const getCategoryIconColors = (icon: string): string => {
    switch (icon) {
      case "child_friendly":
      case "baby_changing_station":
        return "bg-primary-container/30 text-primary";
      case "toys":
        return "bg-secondary-container/30 text-secondary";
      case "checkroom":
        return "bg-tertiary-container/30 text-tertiary";
      case "flatware":
        return "bg-indigo-100 text-indigo-700";
      case "menu_book":
        return "bg-amber-100 text-amber-700";
      default:
        return "bg-slate-100 text-slate-500";
    }
  };

  const renderTree = (parentId: number | null, depth = 0) => {
    const items = categories.filter(c => c.parentID === parentId);

    const sortedItems = [...items].sort((a, b) => {
      const orderA = Number(a.sortOrder) || 999;
      const orderB = Number(b.sortOrder) || 999;
      return orderA - orderB;
    });

    const filteredItems = sortedItems.filter(c => {
      if (!searchTerm.trim()) return true;

      const matchSelf = c.categoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchChildren = (catId: number): boolean => {
        const subCats = categories.filter(sub => sub.parentID === catId);
        return subCats.some(sub =>
          sub.categoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (sub.description && sub.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
          matchChildren(sub.categoryID)
        );
      };

      return matchSelf || matchChildren(c.categoryID);
    });

    if (filteredItems.length === 0) return null;

    return (
      <div className="space-y-3 w-full">
        {filteredItems.map(cat => {
          const hasChildren = categories.some(child => child.parentID === cat.categoryID);
          const isExpanded = !!expandedIds[cat.categoryID] || searchTerm.trim() !== "";

          if (depth === 0) {
            const icon = getCategoryIcon(cat.categoryName);
            const iconColors = getCategoryIconColors(icon);
            const childrenCount = categories.filter(c => c.parentID === cat.categoryID).length;

            return (
              <div key={cat.categoryID} className="w-full">
                <div className="group/level1 flex items-center gap-md p-md rounded-lg tree-node-content cursor-pointer border border-transparent hover:border-primary/20">
                  {hasChildren ? (
                    <button
                      type="button"
                      onClick={() => onToggleExpand(cat.categoryID)}
                      className="w-8 h-8 rounded-full hover:bg-slate-200/50 flex items-center justify-center shrink-0 text-slate-500 transition-colors cursor-pointer"
                    >
                      <span className={`material-symbols-outlined text-primary expand-icon transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}>
                        chevron_right
                      </span>
                    </button>
                  ) : (
                    <div className="w-8 h-8 flex items-center justify-center shrink-0">
                      <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                    </div>
                  )}

                  <div className={`w-10 h-10 rounded-full ${iconColors} flex items-center justify-center shrink-0`}>
                    <span className="material-symbols-outlined">{icon}</span>
                  </div>

                  <div className="flex-1 min-w-0" onClick={() => hasChildren && onToggleExpand(cat.categoryID)}>
                    <h4 className="font-headline-md text-headline-md text-primary font-bold truncate flex items-center gap-2">
                      {cat.categoryName}
                      {!cat.status && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-sans">
                          Đã ẩn
                        </span>
                      )}
                    </h4>
                    <span className="font-label-sm text-on-surface-variant text-xs">
                      {childrenCount} danh mục con
                    </span>
                  </div>

                  <div className="flex items-center gap-xs opacity-0 group-hover/level1:opacity-100 transition-opacity">
                    <Link
                      href={`/admin/categories/${cat.categoryID}`}
                      className="p-2 hover:bg-slate-100 rounded-full text-slate-600 hover:text-slate-800 transition-colors flex items-center justify-center cursor-pointer"
                      title="Xem chi tiết & sản phẩm liên kết"
                    >
                      <span className="material-symbols-outlined text-lg">visibility</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => onAddSub(cat)}
                      className="p-2 rounded-full hover:bg-primary/10 text-primary transition-colors cursor-pointer"
                      title="Thêm danh mục con"
                    >
                      <span className="material-symbols-outlined">add_box</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onShowDescription(cat)}
                      className="p-2 rounded-full hover:bg-slate-100 text-on-surface-variant transition-colors cursor-pointer"
                      title="Xem mô tả"
                    >
                      <span className="material-symbols-outlined">info</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onEdit(cat)}
                      className="p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant transition-colors cursor-pointer"
                      title="Chỉnh sửa"
                    >
                      <span className="material-symbols-outlined">edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(cat)}
                      className="p-2 rounded-full hover:bg-error/10 text-error transition-colors cursor-pointer"
                      title="Xóa danh mục"
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                </div>

                {hasChildren && isExpanded && (
                  <div className="ml-[60px] mt-sm space-y-sm relative">
                    <div className="tree-line"></div>
                    {renderTree(cat.categoryID, depth + 1)}
                  </div>
                )}
              </div>
            );
          }

          if (depth === 1) {
            const grandchildrenCount = categories.filter(c => c.parentID === cat.categoryID).length;

            return (
              <div key={cat.categoryID} className="w-full">
                <div className="group/level2 flex items-center gap-md p-sm rounded-lg tree-node-content cursor-pointer border border-transparent hover:border-primary/20">
                  {hasChildren ? (
                    <button
                      type="button"
                      onClick={() => onToggleExpand(cat.categoryID)}
                      className="w-8 h-8 rounded-full hover:bg-slate-200/50 flex items-center justify-center shrink-0 text-slate-500 transition-colors cursor-pointer"
                    >
                      <span className={`material-symbols-outlined text-primary expand-icon transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}>
                        chevron_right
                      </span>
                    </button>
                  ) : (
                    <div className="w-8 h-8 flex items-center justify-center shrink-0">
                      <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                    </div>
                  )}

                  <div className="flex-1 min-w-0" onClick={() => hasChildren && onToggleExpand(cat.categoryID)}>
                    <h5 className="font-label-md text-label-md font-bold text-on-surface truncate flex items-center gap-2">
                      {cat.categoryName}
                      {!cat.status && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-sans">
                          Đã ẩn
                        </span>
                      )}
                    </h5>
                    <span className="font-label-sm text-on-surface-variant text-xs">
                      {grandchildrenCount} dòng sản phẩm
                    </span>
                  </div>

                  <div className="flex items-center gap-xs opacity-0 group-hover/level2:opacity-100 transition-opacity">
                    <Link
                      href={`/admin/categories/${cat.categoryID}`}
                      className="p-2 hover:bg-slate-100 rounded-full text-slate-600 hover:text-slate-800 transition-colors flex items-center justify-center cursor-pointer"
                      title="Xem chi tiết & sản phẩm liên kết"
                    >
                      <span className="material-symbols-outlined text-lg">visibility</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => onAddSub(cat)}
                      className="p-2 rounded-full hover:bg-primary/10 text-primary transition-colors cursor-pointer"
                      title="Thêm danh mục con"
                    >
                      <span className="material-symbols-outlined">add_box</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onShowDescription(cat)}
                      className="p-2 rounded-full hover:bg-slate-100 text-on-surface-variant transition-colors cursor-pointer"
                      title="Xem mô tả"
                    >
                      <span className="material-symbols-outlined">info</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onEdit(cat)}
                      className="p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant transition-colors cursor-pointer"
                      title="Chỉnh sửa"
                    >
                      <span className="material-symbols-outlined">edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(cat)}
                      className="p-2 rounded-full hover:bg-error/10 text-error transition-colors cursor-pointer"
                      title="Xóa danh mục"
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                </div>

                {hasChildren && isExpanded && (
                  <div className="ml-[40px] mt-sm space-y-sm relative">
                    <div className="tree-line"></div>
                    {renderTree(cat.categoryID, depth + 1)}
                  </div>
                )}
              </div>
            );
          }

          return (
            <div
              key={cat.categoryID}
              className="group/level3 flex items-center gap-md p-sm rounded-lg tree-node-content border border-transparent hover:border-primary/20"
            >
              <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center border border-outline-variant/30 shrink-0">
                <span className="material-symbols-outlined text-outline text-sm">local_mall</span>
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-body-md font-semibold text-on-surface truncate flex items-center gap-2">
                  {cat.categoryName}
                  {!cat.status && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-sans">
                      Đã ẩn
                    </span>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-xs opacity-0 group-hover/level3:opacity-100 transition-opacity">
                <Link
                  href={`/admin/categories/${cat.categoryID}`}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-600 hover:text-slate-800 transition-colors flex items-center justify-center cursor-pointer"
                  title="Xem chi tiết & sản phẩm liên kết"
                >
                  <span className="material-symbols-outlined text-lg">visibility</span>
                </Link>
                <button
                  type="button"
                  onClick={() => onShowDescription(cat)}
                  className="p-2 rounded-full hover:bg-slate-100 text-on-surface-variant transition-colors cursor-pointer"
                  title="Xem mô tả"
                >
                  <span className="material-symbols-outlined">info</span>
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(cat)}
                  className="p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant transition-colors cursor-pointer"
                  title="Chỉnh sửa"
                >
                  <span className="material-symbols-outlined">edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(cat)}
                  className="p-2 rounded-full hover:bg-error/10 text-error transition-colors cursor-pointer"
                  title="Xóa danh mục"
                >
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`${className} bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm flex flex-col min-h-[600px]`}>
      <div className="p-4 border-b border-outline-variant/30 bg-surface-container-low flex justify-between items-center rounded-t-2xl mb-6">
        <div className="flex items-center gap-md">
          <span className="font-headline-md text-headline-md text-primary font-semibold text-lg">Cấu trúc danh mục</span>
          <div className="flex gap-xs">
            <button
              onClick={onExpandAll}
              className="px-3 py-1 rounded-full border border-primary/20 text-primary font-label-sm hover:bg-primary/5 transition-colors text-xs font-bold cursor-pointer"
            >
              Mở rộng tất cả
            </button>
            <button
              onClick={onCollapseAll}
              className="px-3 py-1 rounded-full border border-outline-variant/50 text-outline font-label-sm hover:bg-surface-variant transition-colors text-xs font-bold cursor-pointer"
            >
              Thu gọn tất cả
            </button>
          </div>
        </div>
        <span className="bg-primary-container text-on-primary-container px-3 py-1 rounded-full font-label-sm text-xs font-bold">
          {rootCount} Cấp I • {categories.length} Tổng
        </span>
      </div>

      <div className="mb-6">
        <div className="relative w-full max-w-none min-w-[320px]">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
          <input
            type="text"
            value={searchTerm}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Tìm kiếm danh mục..."
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-semibold text-slate-800"
          />
        </div>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-20 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
          <span className="material-symbols-outlined text-slate-300 text-5xl mb-2">category</span>
          <p className="text-slate-400 font-bold text-sm">Chưa có danh mục nào được khởi tạo.</p>
        </div>
      ) : (
        <div className="flex-1 category-tree-container overflow-y-auto pr-2">
          <div className="flex flex-col w-full">{renderTree(null)}</div>
        </div>
      )}
    </div>
  );
}
