"use client";

import Modal from "@/components/admin/ui/Modal";
import Button from "@/components/admin/ui/Button";

interface CategoryDeleteModalProps {
  categoryToDelete: { id: number; name: string } | null;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function CategoryDeleteModal({
  categoryToDelete,
  deleting,
  onCancel,
  onConfirm
}: CategoryDeleteModalProps) {
  return (
    <Modal
      isOpen={!!categoryToDelete}
      onClose={onCancel}
      showCloseButton={!deleting}
      className="max-w-md font-outfit"
    >
      <div className="flex items-center gap-3 border-b border-gray-100 dark:border-gray-800 pb-4 mb-4">
        <div className="w-10 h-10 rounded-full bg-error-50 dark:bg-error-500/15 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-error-500">warning</span>
        </div>
        <h3 className="text-lg font-bold text-gray-800 dark:text-white/90">
          Xác nhận xóa danh mục
        </h3>
      </div>

      <div className="space-y-6">
        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
          Bạn có chắc chắn muốn xóa danh mục{" "}
          <strong className="text-gray-800 dark:text-white font-bold">
            "{categoryToDelete?.name}"
          </strong>{" "}
          không? Hành động này sẽ không thể hoàn tác và chỉ có thể thực hiện nếu danh mục này không có danh mục con hoặc sản phẩm nào đang liên kết trực tiếp.
        </p>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-850">
          <Button
            onClick={onCancel}
            variant="secondary"
            disabled={deleting}
            className="rounded-full text-xs font-bold py-2"
          >
            Hủy bỏ
          </Button>
          <Button
            onClick={onConfirm}
            variant="danger"
            isLoading={deleting}
            className="rounded-full text-xs font-bold py-2"
            startIcon={!deleting ? <span className="material-symbols-outlined text-sm">delete</span> : undefined}
          >
            Xác nhận xóa
          </Button>
        </div>
      </div>
    </Modal>
  );
}

