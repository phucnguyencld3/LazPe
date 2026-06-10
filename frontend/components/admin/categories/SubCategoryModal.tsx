"use client";

import type { FormEvent } from "react";
import { CategoryInfo } from "@/lib/features/categories/categoryApi";
import Modal from "@/components/admin/ui/Modal";
import Button from "@/components/admin/ui/Button";
import Input from "@/components/admin/ui/Input";
import TextArea from "@/components/admin/ui/TextArea";

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
  return (
    <Modal
      isOpen={!!parentCategory}
      onClose={onClose}
      showCloseButton={!submitting}
      className="max-w-lg font-outfit"
    >
      <div className="flex items-center gap-3 border-b border-gray-100 dark:border-gray-800 pb-4 mb-4">
        <div className="w-10 h-10 rounded-full bg-brand-50 dark:bg-brand-500/15 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-brand-500">add</span>
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white/90">
            Tạo danh mục con
          </h3>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Thuộc: {parentCategory?.categoryName}
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
            Tên danh mục <span className="text-rose-500">*</span>
          </label>
          <Input
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

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-850">
          <Button
            type="button"
            onClick={onClose}
            variant="secondary"
            className="rounded-full text-xs font-bold py-2"
            disabled={submitting}
          >
            Hủy bỏ
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={submitting}
            className="rounded-full text-xs font-bold py-2"
            startIcon={!submitting ? <span className="material-symbols-outlined text-sm">save</span> : undefined}
          >
            Tạo danh mục
          </Button>
        </div>
      </form>
    </Modal>
  );
}

