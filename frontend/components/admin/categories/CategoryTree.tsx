"use client";

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
  onShowDescription
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
                <div className="group/level1 flex items-center gap-4 p-4 rounded-xl tree-node-content cursor-pointer border border-transparent hover:border-brand-500/20 hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-all duration-200">
                  {hasChildren ? (
                    <button
                      type="button"
                      onClick={() => onToggleExpand(cat.categoryID)}
                      className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 flex items-center justify-center shrink-0 text-gray-400 dark:text-gray-500 transition-colors cursor-pointer"
                    >
                      <span className={`material-symbols-outlined text-brand-500 expand-icon transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}>
                        chevron_right
                      </span>
                    </button>
                  ) : (
                    <div className="w-8 h-8 flex items-center justify-center shrink-0">
                      <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-700"></span>
                    </div>
                  )}

                  <div className={`w-10 h-10 rounded-full ${iconColors} flex items-center justify-center shrink-0`}>
                    <span className="material-symbols-outlined">{icon}</span>
                  </div>

                  <div className="flex-1 min-w-0" onClick={() => hasChildren && onToggleExpand(cat.categoryID)}>
                    <h4 className="text-base text-brand-500 dark:text-brand-400 font-bold truncate flex items-center gap-2">
                      {cat.categoryName}
                      {!cat.status && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400 font-sans">
                          Đã ẩn
                        </span>
                      )}
                    </h4>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {childrenCount} danh mục con
                    </span>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover/level1:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => onAddSub(cat)}
                      className="p-2 rounded-full hover:bg-brand-50 dark:hover:bg-brand-500/15 text-brand-500 transition-colors cursor-pointer"
                      title="Thêm danh mục con"
                    >
                      <span className="material-symbols-outlined text-lg">add_box</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onShowDescription(cat)}
                      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-white transition-colors cursor-pointer"
                      title="Xem mô tả"
                    >
                      <span className="material-symbols-outlined text-lg">info</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onEdit(cat)}
                      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-white transition-colors cursor-pointer"
                      title="Chỉnh sửa"
                    >
                      <span className="material-symbols-outlined text-lg">edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(cat)}
                      className="p-2 rounded-full hover:bg-error-50 dark:hover:bg-error-500/15 text-error-500 transition-colors cursor-pointer"
                      title="Xóa danh mục"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                </div>

                {hasChildren && isExpanded && (
                  <div className="ml-[60px] mt-2 space-y-2 relative">
                    <div className="absolute left-[-30px] top-0 bottom-4 w-[1px] bg-gray-200 dark:bg-gray-800"></div>
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
                <div className="group/level2 flex items-center gap-4 p-2 rounded-lg tree-node-content cursor-pointer border border-transparent hover:border-brand-500/20 hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-all duration-200">
                  {hasChildren ? (
                    <button
                      type="button"
                      onClick={() => onToggleExpand(cat.categoryID)}
                      className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 flex items-center justify-center shrink-0 text-gray-400 dark:text-gray-500 transition-colors cursor-pointer"
                    >
                      <span className={`material-symbols-outlined text-brand-500 expand-icon transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}>
                        chevron_right
                      </span>
                    </button>
                  ) : (
                    <div className="w-8 h-8 flex items-center justify-center shrink-0">
                      <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-700"></span>
                    </div>
                  )}

                  <div className="flex-1 min-w-0" onClick={() => hasChildren && onToggleExpand(cat.categoryID)}>
                    <h5 className="text-sm font-bold text-gray-800 dark:text-white/90 truncate flex items-center gap-2">
                      {cat.categoryName}
                      {!cat.status && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400 font-sans">
                          Đã ẩn
                        </span>
                      )}
                    </h5>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {grandchildrenCount} dòng sản phẩm
                    </span>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover/level2:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => onAddSub(cat)}
                      className="p-2 rounded-full hover:bg-brand-50 dark:hover:bg-brand-500/15 text-brand-500 transition-colors cursor-pointer"
                      title="Thêm danh mục con"
                    >
                      <span className="material-symbols-outlined text-lg">add_box</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onShowDescription(cat)}
                      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-white transition-colors cursor-pointer"
                      title="Xem mô tả"
                    >
                      <span className="material-symbols-outlined text-lg">info</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onEdit(cat)}
                      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-white transition-colors cursor-pointer"
                      title="Chỉnh sửa"
                    >
                      <span className="material-symbols-outlined text-lg">edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(cat)}
                      className="p-2 rounded-full hover:bg-error-50 dark:hover:bg-error-500/15 text-error-500 transition-colors cursor-pointer"
                      title="Xóa danh mục"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                </div>

                {hasChildren && isExpanded && (
                  <div className="ml-[40px] mt-2 space-y-2 relative">
                    <div className="absolute left-[-20px] top-0 bottom-4 w-[1px] bg-gray-200 dark:bg-gray-800"></div>
                    {renderTree(cat.categoryID, depth + 1)}
                  </div>
                )}
              </div>
            );
          }

          return (
            <div
              key={cat.categoryID}
              className="group/level3 flex items-center gap-4 p-2 rounded-lg tree-node-content border border-transparent hover:border-brand-500/20 hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-all duration-200"
            >
              <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-900 shadow-sm flex items-center justify-center border border-gray-200 dark:border-gray-800 shrink-0">
                <span className="material-symbols-outlined text-gray-400 text-sm">local_mall</span>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 truncate flex items-center gap-2">
                  {cat.categoryName}
                  {!cat.status && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400 font-sans">
                      Đã ẩn
                    </span>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover/level3:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => onShowDescription(cat)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-white transition-colors cursor-pointer"
                  title="Xem mô tả"
                >
                  <span className="material-symbols-outlined text-lg">info</span>
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(cat)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-white transition-colors cursor-pointer"
                  title="Chỉnh sửa"
                >
                  <span className="material-symbols-outlined text-lg">edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(cat)}
                  className="p-2 rounded-full hover:bg-error-50 dark:hover:bg-error-500/15 text-error-500 transition-colors cursor-pointer"
                  title="Xóa danh mục"
                >
                  <span className="material-symbols-outlined text-lg">delete</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

    );
  };

  return (
    <div className="lg:col-span-8 bg-white dark:bg-gray-950 rounded-[2rem] p-8 border border-gray-150 dark:border-white/[0.05] shadow-theme-xs flex flex-col min-h-[600px] font-outfit">
      <div className="p-4 border-b border-gray-100 dark:border-white/[0.05] bg-gray-50/50 dark:bg-white/[0.02] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 rounded-t-2xl mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
          <span className="text-lg font-bold text-gray-800 dark:text-white/90">
            Cấu trúc danh mục
          </span>
          <div className="flex gap-2">
            <button
              onClick={onExpandAll}
              className="px-3 py-1 rounded-full border border-brand-200 dark:border-brand-800 text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors text-xs font-bold cursor-pointer"
            >
              Mở rộng tất cả
            </button>
            <button
              onClick={onCollapseAll}
              className="px-3 py-1 rounded-full border border-gray-200 dark:border-gray-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-xs font-bold cursor-pointer"
            >
              Thu gọn tất cả
            </button>
          </div>
        </div>
        <span className="bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400 px-3 py-1 rounded-full text-xs font-bold self-start sm:self-auto">
          {rootCount} Cấp I • {categories.length} Tổng
        </span>
      </div>

      <div className="mb-6">
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            search
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Tìm kiếm danh mục..."
            className="w-full pl-11 pr-4 py-2.5 bg-transparent border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:border-brand-500 focus:ring-3 focus:ring-brand-500/10 text-sm font-semibold text-gray-800 dark:text-white/90 placeholder:text-gray-400 dark:placeholder:text-white/30 transition-all"
          />
        </div>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-20 bg-gray-50/50 dark:bg-white/[0.01] rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
          <span className="material-symbols-outlined text-gray-300 dark:text-gray-700 text-5xl mb-2">
            category
          </span>
          <p className="text-gray-400 dark:text-gray-500 font-bold text-sm">
            Chưa có danh mục nào được khởi tạo.
          </p>
        </div>
      ) : (
        <div className="flex-1 category-tree-container overflow-y-auto pr-2">
          <div className="flex flex-col w-full">{renderTree(null)}</div>
        </div>
      )}
    </div>
  );
}

