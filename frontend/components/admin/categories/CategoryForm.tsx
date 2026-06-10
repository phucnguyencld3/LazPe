"use client";

import type { FormEvent } from "react";
import Button from "@/components/admin/ui/Button";
import Input from "@/components/admin/ui/Input";
import TextArea from "@/components/admin/ui/TextArea";

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
    <div className="lg:col-span-4 font-outfit">
      <div className="bg-white dark:bg-gray-950 rounded-[2rem] p-8 border border-gray-150 dark:border-white/[0.05] shadow-theme-xs sticky top-28">
        <div className="flex items-center gap-2 mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
          <span className="material-symbols-outlined text-brand-500">
            {isEditing ? "edit_note" : "add_circle"}
          </span>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white/90">
            {isEditing ? "Chỉnh sửa danh mục" : "Tạo danh mục mới"}
          </h3>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
              Tên danh mục <span className="text-rose-500">*</span>
            </label>
            <Input
              id="categoryNameInput"
              type="text"
              required
              value={categoryName}
              onChange={e => onCategoryNameChange(e.target.value)}
              placeholder="Nhập tên danh mục..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
              Mô tả chi tiết <span className="text-rose-500">*</span>
            </label>
            <TextArea
              rows={4}
              required
              value={description}
              onChange={e => onDescriptionChange(e.target.value)}
              placeholder="Mô tả tóm tắt..."
              className="resize-none"
            />

          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
              Thứ tự hiển thị
            </label>
            <Input
              type="text"
              value={sortOrder}
              onChange={e => onSortOrderChange(e.target.value)}
              placeholder="Ví dụ: 1, 2, A, B..."
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gray-800 rounded-2xl">
            <div>
              <p className="text-xs font-bold text-gray-800 dark:text-white/90">Trạng thái hiển thị</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Cho phép hiển thị trên thanh tìm kiếm/sản phẩm</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={status}
                onChange={e => onStatusChange(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5.5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-brand-500"></div>
            </label>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            {isEditing && (
              <Button
                type="button"
                onClick={onCancelEdit}
                variant="secondary"
                disabled={submitting}
                className="flex-1 rounded-full text-xs font-bold py-2.5"
              >
                Hủy sửa
              </Button>
            )}
            <Button
              type="submit"
              disabled={submitting}
              variant="primary"
              isLoading={submitting}
              className="flex-1 rounded-full text-xs font-bold py-2.5"
              startIcon={!submitting ? <span className="material-symbols-outlined text-sm">save</span> : undefined}
            >
              {isEditing ? "Cập nhật" : "Tạo danh mục"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

