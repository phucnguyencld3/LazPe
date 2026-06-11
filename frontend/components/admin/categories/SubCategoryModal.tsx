"use client";

import type { FormEvent } from "react";
import { CategoryInfo } from "@/lib/features/categories/categoryApi";

interface SubCategoryModalProps {
  parentCategory: CategoryInfo | null;
  categoryName: string;
  description: string;
  sortOrder: string;
  status: boolean;
  submitting: boolean;
  onCategoryNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onSortOrderChange: (value: string) => void;
  onStatusChange: (value: boolean) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
}

export default function SubCategoryModal({
  parentCategory,
  categoryName,
  description,
  sortOrder,
  status,
  submitting,
  onCategoryNameChange,
  onDescriptionChange,
  onSortOrderChange,
  onStatusChange,
  onClose,
  onSubmit
}: SubCategoryModalProps) {
  if (!parentCategory) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4 animate-in fade-in duration-200">
      <div className="bg-white w-[calc(100vw-2rem)] md:w-[520px] shrink-0 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-primary">add</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Tạo danh mục con</h3>
              <p className="text-xs text-slate-400">Thuộc: {parentCategory.categoryName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
            disabled={submitting}
          >
            <span className="material-symbols-outlined text-slate-400 text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
              Tên danh mục <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={categoryName}
              onChange={e => onCategoryNameChange(e.target.value)}
              placeholder="Nhập tên danh mục..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-semibold text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
              Mô tả chi tiết <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={e => onDescriptionChange(e.target.value)}
              placeholder="Mô tả tóm tắt..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-semibold text-slate-800 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
              Thứ tự hiển thị
            </label>
            <input
              type="text"
              value={sortOrder}
              onChange={e => onSortOrderChange(e.target.value)}
              placeholder="Ví dụ: 1, 2, A, B..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-semibold text-slate-800"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
            <div>
              <p className="text-xs font-bold text-slate-800">Trạng thái hiển thị</p>
              <p className="text-[9px] text-slate-400 mt-0.5">Cho phép hiển thị trên thanh tìm kiếm/sản phẩm</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={status}
                onChange={e => onStatusChange(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5.5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs cursor-pointer transition-colors"
              disabled={submitting}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-full bg-primary text-on-primary font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-md active:scale-95 disabled:opacity-50"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div>
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  <span>Tạo danh mục</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
