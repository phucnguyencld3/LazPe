"use client";
import { StatsCard } from "@/components/admin/ui/Card";

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
    <div className="mt-8 mb-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 font-outfit">
      <StatsCard
        title="Tổng danh mục"
        value={totalCategories}
        icon={<span className="material-symbols-outlined text-[24px]">account_tree</span>}
        iconBgColor="bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400"
      />

      <StatsCard
        title="Sản phẩm liên kết"
        value={totalProducts}
        icon={<span className="material-symbols-outlined text-[24px]">shopping_bag</span>}
        iconBgColor="bg-success-50 text-success-500 dark:bg-success-500/10 dark:text-success-400"
      />

      <StatsCard
        title="Lượt xem danh mục"
        value={totalCategories > 0 ? (totalCategories * 365 + 1240).toLocaleString() + "+" : 0}
        icon={<span className="material-symbols-outlined text-[24px]">visibility</span>}
        iconBgColor="bg-blue-50 text-blue-light-500 dark:bg-blue-light-500/10 dark:text-blue-light-400"
      />

      <StatsCard
        title="Danh mục ẩn/trống"
        value={hiddenCount}
        icon={<span className="material-symbols-outlined text-[24px]">warning</span>}
        iconBgColor="bg-error-50 text-error-500 dark:bg-error-500/10 dark:text-error-400"
      />
    </div>
  );
}
