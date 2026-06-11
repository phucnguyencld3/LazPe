"use client";

interface ProductFormActionsProps {
  onCancel: () => void;
  saving: boolean;
  disabled: boolean;
}

export function ProductFormActions({
  onCancel,
  saving,
  disabled
}: ProductFormActionsProps) {
  return (
    <footer
      className="fixed bottom-0 right-0 w-full md:w-[calc(100%-18rem)] bg-white/95 backdrop-blur-md py-4 px-8 border-t border-slate-100 flex justify-end items-center gap-4 z-40 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.08)]"
      style={{ width: "100%", left: "0", position: "fixed", display: "flex", justifyContent: "flex-end" }}
    >
      <div className="flex gap-4 max-w-5xl w-full mx-auto justify-end px-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 font-bold text-xs transition-colors cursor-pointer active:scale-95"
          disabled={saving}
        >
          Hủy bỏ
        </button>
        <button
          type="submit"
          disabled={saving || disabled}
          className="px-8 py-2.5 rounded-full bg-primary text-on-primary font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-primary/20 hover:bg-primary/95 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none cursor-pointer"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div>
              <span>Đang lưu...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-sm font-bold">add_circle</span>
              <span>Tạo sản phẩm</span>
            </>
          )}
        </button>
      </div>
    </footer>
  );
}
