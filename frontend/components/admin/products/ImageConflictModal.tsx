import React from "react";

interface ImageConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeepProductImages: () => void;
  onKeepVariantImages: () => void;
}

export function ImageConflictModal({
  isOpen,
  onClose,
  onKeepProductImages,
  onKeepVariantImages
}: ImageConflictModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-[420px] max-w-full p-8 border border-slate-100 shadow-2xl space-y-7 animate-in fade-in zoom-in-95 duration-200">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-3xl">warning</span>
          </div>
          <h3 className="text-lg font-extrabold text-slate-800">Xung đột ảnh sản phẩm</h3>
          <p className="text-sm text-slate-500 font-semibold leading-relaxed">
            Bạn đã tải lên cả Ảnh Sản phẩm chung và Ảnh Biến thể. Hệ thống chỉ ưu tiên 1 trong 2 để tránh gây rối. Bạn muốn ưu tiên giữ lại loại ảnh nào?
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); onKeepProductImages(); }}
            className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl border-2 border-indigo-100 hover:border-indigo-500 hover:bg-indigo-50 transition-colors text-left"
          >
            <div>
              <span className="block font-bold text-indigo-900 text-sm">Giữ Ảnh Sản phẩm</span>
              <span className="text-[11px] text-slate-500">Ảnh biến thể sẽ bị xóa</span>
            </div>
            <span className="material-symbols-outlined text-indigo-500">photo_library</span>
          </button>

          <button
            type="button"
            onClick={(e) => { e.preventDefault(); onKeepVariantImages(); }}
            className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl border-2 border-emerald-100 hover:border-emerald-500 hover:bg-emerald-50 transition-colors text-left"
          >
            <div>
              <span className="block font-bold text-emerald-900 text-sm">Giữ Ảnh Biến thể</span>
              <span className="text-[11px] text-slate-500">Ảnh sản phẩm sẽ bị xóa</span>
            </div>
            <span className="material-symbols-outlined text-emerald-500">style</span>
          </button>
        </div>

        <div className="flex pt-2">
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); onClose(); }}
            className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors"
          >
            Hủy thao tác
          </button>
        </div>
      </div>
    </div>
  );
}
