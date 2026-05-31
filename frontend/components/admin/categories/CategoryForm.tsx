"use client";

import type { FormEvent } from "react";

interface CategoryFormProps {
  isEditing: boolean;
  categoryName: string;
  description: string;
  sortOrder: string;
  status: boolean;
  submitting: boolean;
  onCategoryNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onSortOrderChange: (value: string) => void;
  onStatusChange: (value: boolean) => void;
  onCancelEdit: () => void;
  onSubmit: (event: FormEvent) => void;
}

export default function CategoryForm({
  isEditing,
  categoryName,
  description,
  sortOrder,
  status,
  submitting,
  onCategoryNameChange,
  onDescriptionChange,
  onSortOrderChange,
  onStatusChange,
  onCancelEdit,
  onSubmit
}: CategoryFormProps) {
  return (
    <div className="lg:col-span-4">
      <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm sticky top-28">
        <div className="flex items-center gap-2 mb-6 border-b border-slate-50 pb-4">
          <span className="material-symbols-outlined text-primary">
            {isEditing ? "edit_note" : "add_circle"}
          </span>
          <h3 className="text-lg font-bold text-slate-800">
            {isEditing ? "Chỉnh sửa danh mục" : "Tạo danh mục mới"}
          </h3>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
              Tên danh mục <span className="text-rose-500">*</span>
            </label>
            <input
              id="categoryNameInput"
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

          <div className="flex items-center gap-3 pt-4 border-t border-slate-50">
            {isEditing && (
              <button
                type="button"
                onClick={onCancelEdit}
                className="flex-1 py-2.5 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 font-bold text-xs cursor-pointer text-center"
                disabled={submitting}
              >
                Hủy sửa
              </button>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 rounded-full bg-primary text-on-primary font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-primary/20 hover:bg-primary/95 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div>
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  <span>{isEditing ? "Cập nhật" : "Tạo danh mục"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
