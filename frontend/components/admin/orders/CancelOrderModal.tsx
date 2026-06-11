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
      <div className="bg-white w-[calc(100vw-2rem)] md:w-[500px] shrink-0 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
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
          <form id="cancelForm" onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="cancelSelect" className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Vui lòng chọn lý do hủy đơn
                </label>
                <div className="relative">
                  <select
                    id="cancelSelect"
                    value={cancelReason}
                    onChange={(e) => {
                      setCancelReason(e.target.value);
                      if (e.target.value !== "other") {
                        setOtherReason("");
                      }
                    }}
                    className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-primary focus:ring-0 text-sm font-bold text-slate-700 outline-none appearance-none cursor-pointer pr-10"
                  >
                    <option value="Sản phẩm hết hàng">Sản phẩm hết hàng</option>
                    <option value="Khách hàng đổi ý / yêu cầu hủy">Khách hàng đổi ý / yêu cầu hủy</option>
                    <option value="Sai thông tin đơn hàng / giao nhận">Sai thông tin đơn hàng / giao nhận</option>
                    <option value="Đơn hàng trùng lặp">Đơn hàng trùng lặp</option>
                    <option value="Nghi ngờ giao dịch gian lận">Nghi ngờ giao dịch gian lận</option>
                    <option value="other">Lý do khác (Tự nhập)</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                    <span className="material-symbols-outlined">arrow_drop_down</span>
                  </div>
                </div>
              </div>
              
              {cancelReason === "other" && (
                <div className="animate-in slide-in-from-top-2 mt-4 space-y-2">
                  <label htmlFor="customReason" className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Nhập lý do chi tiết
                  </label>
                  <textarea
                    id="customReason"
                    value={otherReason}
                    onChange={(e) => setOtherReason(e.target.value)}
                    className="w-full h-32 p-4 bg-slate-50 rounded-xl border-2 border-slate-200 focus:border-primary focus:ring-0 text-sm font-semibold resize-none outline-none"
                    placeholder="Vui lòng nhập lý do cụ thể..."
                    required
                  ></textarea>
                </div>
              )}
            </div>
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
