"use client";

import { CategoryInfo } from "@/lib/features/categories/categoryApi";

interface CategoryDescriptionModalProps {
  category: CategoryInfo | null;
  onClose: () => void;
}

export default function CategoryDescriptionModal({
  category,
  onClose
}: CategoryDescriptionModalProps) {
  if (!category) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4 animate-in fade-in duration-200">
      <div className="bg-white w-[calc(100vw-2rem)] md:w-[520px] shrink-0 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-slate-500">info</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Mô tả danh mục</h3>
              <p className="text-xs text-slate-400">{category.categoryName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-slate-400 text-[20px]">close</span>
          </button>
        </div>
        <div className="p-6">
          <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">
            {category.description?.trim() || "Chưa có mô tả."}
          </p>
          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs cursor-pointer transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
