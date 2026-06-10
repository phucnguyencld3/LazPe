import React from "react";
import Modal from "@/components/admin/ui/Modal";
import TextArea from "@/components/admin/ui/TextArea";
import Button from "@/components/admin/ui/Button";

interface CancelOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  cancelReason: string;
  setCancelReason: (reason: string) => void;
  otherReason: string;
  setOtherReason: (reason: string) => void;
  canceling: boolean;
}

export const CancelOrderModal: React.FC<CancelOrderModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  cancelReason,
  setCancelReason,
  otherReason,
  setOtherReason,
  canceling,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton={true} className="!max-w-md">
      <div className="font-outfit p-1">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-error-50 dark:bg-error-500/10 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-error-500">report</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">Hủy đơn hàng</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Vui lòng chọn lý do hủy đơn hàng này</p>
          </div>
        </div>

        {/* Body */}
        <form id="cancelForm" onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-3">
            <label className="group flex items-center p-3.5 bg-gray-50 dark:bg-white/[0.02] rounded-xl border border-gray-100 dark:border-white/5 hover:border-brand-300 dark:hover:border-brand-800 hover:bg-white dark:hover:bg-transparent transition-all cursor-pointer has-[:checked]:border-brand-500 has-[:checked]:bg-white dark:has-[:checked]:bg-transparent">
              <input
                type="radio"
                name="cancel_reason"
                value="Sản phẩm hết hàng"
                checked={cancelReason === "Sản phẩm hết hàng"}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-4 h-4 text-brand-500 border-gray-300 dark:border-gray-700 focus:ring-brand-500 focus:ring-offset-0"
              />
              <span className="ml-3 font-semibold text-sm text-gray-700 dark:text-gray-300">Sản phẩm hết hàng</span>
            </label>

            <label className="group flex items-center p-3.5 bg-gray-50 dark:bg-white/[0.02] rounded-xl border border-gray-100 dark:border-white/5 hover:border-brand-300 dark:hover:border-brand-800 hover:bg-white dark:hover:bg-transparent transition-all cursor-pointer has-[:checked]:border-brand-500 has-[:checked]:bg-white dark:has-[:checked]:bg-transparent">
              <input
                type="radio"
                name="cancel_reason"
                value="Khách hàng đổi ý"
                checked={cancelReason === "Khách hàng đổi ý"}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-4 h-4 text-brand-500 border-gray-300 dark:border-gray-700 focus:ring-brand-500 focus:ring-offset-0"
              />
              <span className="ml-3 font-semibold text-sm text-gray-700 dark:text-gray-300">Khách hàng đổi ý</span>
            </label>

            <label className="group flex items-center p-3.5 bg-gray-50 dark:bg-white/[0.02] rounded-xl border border-gray-100 dark:border-white/5 hover:border-brand-300 dark:hover:border-brand-800 hover:bg-white dark:hover:bg-transparent transition-all cursor-pointer has-[:checked]:border-brand-500 has-[:checked]:bg-white dark:has-[:checked]:bg-transparent">
              <input
                type="radio"
                name="cancel_reason"
                value="other"
                checked={cancelReason === "other"}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-4 h-4 text-brand-500 border-gray-300 dark:border-gray-700 focus:ring-brand-500 focus:ring-offset-0"
              />
              <span className="ml-3 font-semibold text-sm text-gray-700 dark:text-gray-300">Lý do khác</span>
            </label>
          </div>

          {/* Other Reason Textarea */}
          {cancelReason === "other" && (
            <div className="animate-in slide-in-from-top-2 duration-200">
              <TextArea
                value={otherReason}
                onChange={(e) => setOtherReason(e.target.value)}
                placeholder="Nhập lý do cụ thể..."
                rows={3}
                required
              />
            </div>
          )}

          {/* Footer actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-white/[0.05] mt-6">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={canceling}
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              variant="danger"
              isLoading={canceling}
            >
              Xác nhận hủy
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
