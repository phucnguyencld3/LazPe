"use client";

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
  if (!categoryToDelete) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4 animate-in fade-in duration-200">
      <div className="bg-white w-[calc(100vw-2rem)] md:w-[450px] shrink-0 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-error">warning</span>
            </div>
            <h3 className="text-lg font-bold text-slate-800">Xác nhận xóa danh mục</h3>
          </div>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
            disabled={deleting}
          >
            <span className="material-symbols-outlined text-slate-400 text-[20px]">close</span>
          </button>
        </div>

        <div className="p-6">
          <p className="text-slate-600 text-sm leading-relaxed mb-6">
            Bạn có chắc chắn muốn xóa danh mục <strong className="text-slate-800">"{categoryToDelete.name}"</strong> không? Hành động này sẽ không thể hoàn tác và chỉ có thể thực hiện nếu danh mục này không có danh mục con hoặc sản phẩm nào đang liên kết trực tiếp.
          </p>

          <div className="flex justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-5 py-2 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs cursor-pointer transition-colors"
              disabled={deleting}
            >
              Hủy bỏ
            </button>
            <button
              onClick={onConfirm}
              className="px-5 py-2 rounded-full bg-error text-white hover:bg-error/90 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-md active:scale-95 disabled:opacity-50"
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-t-2 border-b-2 border-white"></div>
                  <span>Đang xóa...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                  <span>Xác nhận xóa</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
