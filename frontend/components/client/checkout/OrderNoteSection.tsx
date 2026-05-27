import React from "react";

interface OrderNoteSectionProps {
  note: string;
  setNote: (note: string) => void;
}

export const OrderNoteSection: React.FC<OrderNoteSectionProps> = ({ note, setNote }) => {
  return (
    <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 transition-all duration-300 hover:shadow-md">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-sm">
          3
        </div>
        <h2 className="text-lg font-bold text-slate-800">Ghi chú đơn hàng <span className="text-xs text-slate-400 font-normal">(tùy chọn)</span></h2>
      </div>
      <div className="space-y-3">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          VÍ DỤ: Giao giờ hành chính, gọi trước khi giao, hoặc đặt ở hòm thư...
        </p>
        <div className="relative">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 500))}
            className="w-full h-28 rounded-xl border border-slate-200 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20 p-4 font-sans text-sm bg-slate-50/50 resize-none transition-all outline-none"
            placeholder="Nhập ghi chú hoặc yêu cầu đặc biệt của bạn..."
          />
          <span className="absolute bottom-3 right-3 text-[10px] text-slate-400 font-bold">
            {note.length}/500 ký tự
          </span>
        </div>
      </div>
    </section>
  );
};
