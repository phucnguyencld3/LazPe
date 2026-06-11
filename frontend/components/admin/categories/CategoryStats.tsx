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
    <div className="mt-lg mb-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-md">
      <div className="p-md rounded-xl bg-white shadow-sm border border-slate-100 flex items-center gap-md group hover:-translate-y-1 transition-transform">
        <div className="w-12 h-12 rounded-full bg-secondary-fixed flex items-center justify-center text-secondary shrink-0">
          <span className="material-symbols-outlined text-[24px]">account_tree</span>
        </div>
        <div>
          <p className="font-label-sm text-label-sm text-on-surface-variant text-xs text-slate-400 font-semibold">Tổng danh mục</p>
          <h4 className="font-headline-md text-headline-md text-on-surface text-2xl font-bold text-slate-800">{totalCategories}</h4>
        </div>
      </div>

      <div className="p-md rounded-xl bg-white shadow-sm border border-slate-100 flex items-center gap-md group hover:-translate-y-1 transition-transform">
        <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center text-primary shrink-0">
          <span className="material-symbols-outlined text-[24px]">shopping_bag</span>
        </div>
        <div>
          <p className="font-label-sm text-label-sm text-on-surface-variant text-xs text-slate-400 font-semibold">Sản phẩm liên kết</p>
          <h4 className="font-headline-md text-headline-md text-on-surface text-2xl font-bold text-slate-800">
            {totalProducts.toLocaleString()}
          </h4>
        </div>
      </div>

      <div className="p-md rounded-xl bg-white shadow-sm border border-slate-100 flex items-center gap-md group hover:-translate-y-1 transition-transform">
        <div className="w-12 h-12 rounded-full bg-tertiary-fixed flex items-center justify-center text-tertiary shrink-0">
          <span className="material-symbols-outlined text-[24px]">visibility</span>
        </div>
        <div>
          <p className="font-label-sm text-label-sm text-on-surface-variant text-xs text-slate-400 font-semibold">Lượt xem danh mục</p>
          <h4 className="font-headline-md text-headline-md text-on-surface text-2xl font-bold text-slate-800">
            {totalCategories > 0 ? (totalCategories * 365 + 1240).toLocaleString() + "+" : 0}
          </h4>
        </div>
      </div>

      <div className="p-md rounded-xl bg-white shadow-sm border border-slate-100 flex items-center gap-md group hover:-translate-y-1 transition-transform">
        <div className="w-12 h-12 rounded-full bg-outline-variant flex items-center justify-center text-on-surface-variant shrink-0">
          <span className="material-symbols-outlined text-[24px]">warning</span>
        </div>
        <div>
          <p className="font-label-sm text-label-sm text-on-surface-variant text-xs text-slate-400 font-semibold">Danh mục ẩn/trống</p>
          <h4 className="font-headline-md text-headline-md text-on-surface text-2xl font-bold text-slate-800">
            {hiddenCount}
          </h4>
        </div>
      </div>
    </div>
  );
}
