"use client";
import { CategorySelectOption } from "@/lib/features/products/productApi";

interface CategorySelectorProps {
  categories: CategorySelectOption[];
  selectedCategoryId: number | null;
  selectedPath: number[];
  onCategoryChange: (catId: number | null, pathIds: number[]) => void;
}

export function CategorySelector({
  categories,
  selectedCategoryId,
  selectedPath,
  onCategoryChange
}: CategorySelectorProps) {

  // Get active columns/levels to render
  const getLevels = (): CategorySelectOption[][] => {
    const levels: CategorySelectOption[][] = [];
    
    // Level 1: Root categories (parentID is null or 0)
    const roots = categories.filter(c => !c.parentID && c.status);
    levels.push(roots);

    // Subsequent levels
    for (let i = 0; i < selectedPath.length; i++) {
      const activeParentId = selectedPath[i];
      const children = categories.filter(c => c.parentID === activeParentId && c.status);
      if (children.length > 0) {
        levels.push(children);
      }
    }

    return levels;
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>, levelIndex: number) => {
    const val = e.target.value;
    
    if (val === "") {
      // User selected "Chọn danh mục..." -> revert to parent
      const newPath = selectedPath.slice(0, levelIndex);
      const newSelectedId = newPath.length > 0 ? newPath[newPath.length - 1] : null;
      onCategoryChange(newSelectedId, newPath);
    } else {
      // User selected a valid category
      const catId = Number(val);
      const newPath = selectedPath.slice(0, levelIndex);
      newPath.push(catId);
      onCategoryChange(catId, newPath);
    }
  };

  const levels = getLevels();

  // Utility to find category name by id
  const getCategoryName = (id: number) => {
    return categories.find(c => c.categoryID === id)?.categoryName || "Đang tải...";
  };

  return (
    <section className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
      <div className="flex items-center gap-2 mb-6 border-b border-slate-50 pb-4">
        <span className="material-symbols-outlined text-primary">category</span>
        <h3 className="text-lg font-bold text-slate-800">Phân loại danh mục</h3>
      </div>
      
      <p className="text-xs text-slate-500 mb-6 font-medium">
        Vui lòng chọn lần lượt từ danh mục cha đến danh mục con cuối cùng để đảm bảo sản phẩm được phân loại chính xác.
      </p>

      {/* Cascading Selects Container */}
      <div className="space-y-4">
        {levels.map((levelOptions, index) => {
          const selectedValue = selectedPath[index] || "";
          
          return (
            <div key={index}>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                Danh mục cấp {index + 1} {index === levels.length - 1 && levelOptions.length > 0 ? <span className="text-rose-500">*</span> : ""}
              </label>
              <div className="relative">
                <select
                  value={selectedValue}
                  onChange={(e) => handleSelectChange(e, index)}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-semibold appearance-none cursor-pointer transition-colors
                    ${selectedValue 
                      ? "bg-primary-container/10 border-primary/20 text-primary" 
                      : "bg-slate-50 border-slate-200 text-slate-700"
                    }
                  `}
                >
                  <option value="">-- Chọn danh mục cấp {index + 1} --</option>
                  {levelOptions.map((cat) => (
                    <option key={cat.categoryID} value={cat.categoryID}>
                      {cat.categoryName}
                    </option>
                  ))}
                </select>
                <span className={`material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors
                  ${selectedValue ? "text-primary" : "text-slate-400"}
                `}>
                  unfold_more
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Path Indicator */}
      <div className="mt-8 p-4 bg-slate-50 rounded-2xl flex items-center gap-3 border border-slate-100">
        <span className="material-symbols-outlined text-secondary text-[20px] shrink-0">
          done_all
        </span>
        <div className="text-xs font-medium text-slate-600 leading-normal min-w-0">
          <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Danh mục đang chọn</p>
          {selectedPath.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              {selectedPath.map((id, idx) => (
                <div key={id} className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 bg-white px-2 py-1 rounded-md border border-slate-200 shadow-sm">
                    {getCategoryName(id)}
                  </span>
                  {idx < selectedPath.length - 1 && (
                    <span className="material-symbols-outlined text-slate-300 text-[14px]">
                      chevron_right
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="font-semibold text-slate-500 italic">Chưa có lựa chọn nào.</p>
          )}
        </div>
      </div>
    </section>
  );
}
