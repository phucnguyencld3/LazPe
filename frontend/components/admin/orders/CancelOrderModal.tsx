import React from "react";

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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-8 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-red-500">report</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Hủy đơn hàng</h2>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-slate-400">close</span>
          </button>
        </div>
        
        {/* Body */}
        <div className="p-8">
          <p className="text-slate-600 mb-6">Vui lòng chọn lý do hủy đơn hàng này</p>
          <form id="cancelForm" onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-3">
              <label className="group flex items-center p-4 bg-slate-50 rounded-xl border-2 border-transparent hover:border-indigo-100 hover:bg-white transition-all cursor-pointer has-[:checked]:border-indigo-500 has-[:checked]:bg-white">
                <input
                  type="radio"
                  name="cancel_reason"
                  value="Sản phẩm hết hàng"
                  checked={cancelReason === "Sản phẩm hết hàng"}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-5 h-5 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                />
                <span className="ml-4 font-bold text-slate-700">Sản phẩm hết hàng</span>
              </label>
              
              <label className="group flex items-center p-4 bg-slate-50 rounded-xl border-2 border-transparent hover:border-indigo-100 hover:bg-white transition-all cursor-pointer has-[:checked]:border-indigo-500 has-[:checked]:bg-white">
                <input
                  type="radio"
                  name="cancel_reason"
                  value="Khách hàng đổi ý"
                  checked={cancelReason === "Khách hàng đổi ý"}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-5 h-5 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                />
                <span className="ml-4 font-bold text-slate-700">Khách hàng đổi ý</span>
              </label>

              <label className="group flex items-center p-4 bg-slate-50 rounded-xl border-2 border-transparent hover:border-indigo-100 hover:bg-white transition-all cursor-pointer has-[:checked]:border-indigo-500 has-[:checked]:bg-white">
                <input
                  type="radio"
                  name="cancel_reason"
                  value="other"
                  checked={cancelReason === "other"}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-5 h-5 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                />
                <span className="ml-4 font-bold text-slate-700">Lý do khác</span>
              </label>
            </div>
            
            {/* Other Reason Textarea */}
            {cancelReason === "other" && (
              <div className="animate-in slide-in-from-top-2 mt-4">
                <textarea
                  value={otherReason}
                  onChange={(e) => setOtherReason(e.target.value)}
                  className="w-full h-32 p-4 bg-slate-50 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-0 text-sm resize-none outline-none"
                  placeholder="Nhập lý do cụ thể..."
                  required
                ></textarea>
              </div>
            )}
          </form>
        </div>
        
        {/* Footer */}
        <div className="p-8 bg-slate-50 flex justify-end gap-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-8 py-3 rounded-full font-bold text-slate-500 hover:bg-slate-200 transition-colors"
            disabled={canceling}
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            form="cancelForm"
            disabled={canceling}
            className="px-8 py-3 rounded-full font-bold bg-red-600 text-white hover:bg-red-700 active:scale-95 shadow-md flex items-center gap-2"
          >
            {canceling ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Đang hủy...
              </>
            ) : (
              "Xác nhận hủy"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
