import React, { useState } from "react";
import { OrderInfo } from "@/lib/features/orders/orderApi";

interface ReturnOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (isRefundToCoins: boolean) => void;
  onReject: (reason: string) => void;
  order: OrderInfo;
  processing: boolean;
}

export const ReturnOrderModal: React.FC<ReturnOrderModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onReject,
  order,
  processing,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
        <div className="bg-white w-[calc(100vw-2rem)] md:w-[600px] shrink-0 rounded-[8px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="p-6 flex items-center justify-between border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-orange-500">assignment_return</span>
              </div>
              <h2 className="text-xl font-bold text-slate-800">Xử lý yêu cầu hoàn trả</h2>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors"
            >
              <span className="material-symbols-outlined text-slate-400">close</span>
            </button>
          </div>
          
          {/* Body */}
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 text-sm">Thông tin yêu cầu:</h3>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm space-y-2 text-slate-700">
                <p><strong>Lý do:</strong> {order.returnReason || "Không rõ"}</p>
                <p><strong>Mô tả chi tiết:</strong> {order.returnDescription || "Không có"}</p>
                <p>
                  <strong>Khách yêu cầu hoàn vào:</strong>{" "}
                  {order.refundMethod === 2 ? (
                    <span className="text-amber-600 font-bold">Xu LazPe</span>
                  ) : (
                    <span className="text-blue-600 font-bold">Ví LazPe</span>
                  )}
                </p>
              </div>

              {order.returnImageUrls && (
                <div>
                  <p className="font-bold text-slate-800 text-sm mb-2">Hình ảnh minh chứng (Nhấn để xem lớn):</p>
                  <div className="flex flex-wrap gap-2">
                    {order.returnImageUrls.split(",").map((url: string, idx: number) => (
                      <img 
                        key={idx} 
                        src={url} 
                        alt={`Minh chứng ${idx+1}`} 
                        className="w-20 h-20 object-cover rounded-lg border border-slate-200 cursor-pointer hover:scale-105 transition-transform" 
                        onClick={() => setSelectedImage(url)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {isRejecting && (
                <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-100 animate-in fade-in zoom-in-95 duration-200">
                  <label className="block text-sm font-bold text-red-900 mb-2">
                    Lý do từ chối (bắt buộc):
                  </label>
                  <textarea
                    className="w-full p-3 rounded-lg border border-red-200 focus:outline-none focus:ring-2 focus:ring-red-400 bg-white"
                    rows={3}
                    placeholder="Nhập lý do chi tiết để thông báo cho khách hàng..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>
          
          {/* Footer */}
          <div className="p-6 bg-slate-50 flex justify-between items-center gap-4 border-t border-slate-100">
            <div>
              {!isRejecting ? (
                <button
                  type="button"
                  onClick={() => setIsRejecting(true)}
                  disabled={processing}
                  className="px-6 py-2.5 rounded-[8px] font-bold text-red-600 border border-red-200 bg-white hover:bg-red-50 transition-colors"
                >
                  Từ chối
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (!rejectReason.trim()) return;
                    onReject(rejectReason);
                  }}
                  disabled={processing || !rejectReason.trim()}
                  className="px-6 py-2.5 rounded-[8px] font-bold bg-red-600 text-white hover:bg-red-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Xác nhận Từ chối
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (isRejecting) {
                    setIsRejecting(false);
                    setRejectReason("");
                  } else {
                    onClose();
                  }
                }}
                className="px-6 py-2.5 rounded-[8px] font-bold text-slate-500 hover:bg-slate-200 transition-colors"
                disabled={processing}
              >
                Hủy bỏ
              </button>
              
              {!isRejecting && (
                <button
                  type="button"
                  onClick={() => onSubmit(order.refundMethod === 2)}
                  disabled={processing}
                  className="px-6 py-2.5 rounded-[8px] font-bold bg-orange-500 text-white hover:bg-orange-600 active:scale-95 shadow-md flex items-center gap-2"
                >
                  {processing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Đang xử lý...
                    </>
                  ) : (
                    "Duyệt (Chờ chuyển hoàn)"
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <button 
              className="absolute -top-12 right-0 text-white hover:text-slate-300 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 transition-colors"
              onClick={() => setSelectedImage(null)}
            >
              <span className="material-symbols-outlined text-3xl">close</span>
            </button>
            <img 
              src={selectedImage} 
              alt="Zoomed" 
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}
    </>
  );
};
