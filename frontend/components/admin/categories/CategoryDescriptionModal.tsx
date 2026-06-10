"use client";

import { CategoryInfo } from "@/lib/features/categories/categoryApi";
import Modal from "@/components/admin/ui/Modal";
import Button from "@/components/admin/ui/Button";

interface CategoryDescriptionModalProps {
  category: CategoryInfo | null;
  onClose: () => void;
}

export default function CategoryDescriptionModal({
  category,
  onClose
}: CategoryDescriptionModalProps) {
  return (
    <Modal
      isOpen={!!category}
      onClose={onClose}
      className="max-w-md font-outfit"
    >
      <div className="flex items-center gap-3 border-b border-gray-100 dark:border-gray-800 pb-4 mb-4">
        <div className="w-10 h-10 rounded-full bg-brand-50 dark:bg-brand-500/15 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-brand-500">info</span>
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white/90">
            Mô tả danh mục
          </h3>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {category?.categoryName}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-gray-800 p-4 rounded-2xl">
          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-line">
            {category?.description?.trim() || "Chưa có mô tả."}
          </p>
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-850">
          <Button
            onClick={onClose}
            variant="secondary"
            className="rounded-full text-xs font-bold py-2"
          >
            Đóng
          </Button>
        </div>
      </div>
    </Modal>
  );
}

