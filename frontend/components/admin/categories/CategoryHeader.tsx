"use client";

import Button from "@/components/admin/ui/Button";

interface CategoryHeaderProps {
  onNewRootCategory: () => void;
}

export default function CategoryHeader({ onNewRootCategory }: CategoryHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 font-outfit">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-800 dark:text-white/90">
          Quản lý danh mục
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Cấu trúc phân cấp danh mục sản phẩm của hệ thống
        </p>
      </div>
      <Button
        onClick={onNewRootCategory}
        variant="primary"
        className="rounded-full shadow-theme-xs font-bold text-xs"
        startIcon={<span className="material-symbols-outlined text-sm">add_circle</span>}
      >
        Thêm danh mục mới
      </Button>
    </div>
  );
}

