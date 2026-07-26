"use client";

interface CategoryStatsProps {
  totalCategories: number;
  totalProducts: number;
  hiddenCount: number;
}

export default function CategoryStats({
  totalCategories,
  totalProducts,
  hiddenCount
}: CategoryStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100 border-b border-slate-100 bg-white">
      {/* Card 1: Total Categories */}
      <div className="px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <span className="material-symbols-outlined text-[20px]">account_tree</span>
          </div>
          <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Tổng danh mục</span>
        </div>
        <span className="text-2xl font-extrabold text-slate-800">{totalCategories}</span>
      </div>

      {/* Card 2: Linked Products */}
      <div className="px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
            <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
          </div>
          <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Sản phẩm liên kết</span>
        </div>
        <span className="text-2xl font-extrabold text-slate-800">{totalProducts.toLocaleString()}</span>
      </div>

      {/* Card 3: Hidden/Empty Categories */}
      <div className={`px-5 py-4 flex items-center justify-between transition-all duration-300 ${
        hiddenCount > 0 
          ? 'bg-rose-50/50 hover:bg-rose-50' 
          : 'hover:bg-slate-50'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            hiddenCount > 0 
              ? 'bg-rose-100 text-error' 
              : 'bg-slate-100 text-slate-500'
          }`}>
            <span className="material-symbols-outlined text-[20px]">warning</span>
          </div>
          <span className={`text-xs font-bold uppercase tracking-wider ${hiddenCount > 0 ? 'text-rose-950/60' : 'text-slate-500'}`}>
            Danh mục ẩn/trống
          </span>
        </div>
        <div className="flex items-center gap-2">
          {hiddenCount > 0 && (
            <span className="px-2 py-0.5 bg-error text-white text-[9px] font-bold rounded-full">
              Lưu ý
            </span>
          )}
          <span className={`text-2xl font-extrabold ${hiddenCount > 0 ? 'text-error' : 'text-slate-800'}`}>{hiddenCount}</span>
        </div>
      </div>
    </div>
  );
}
