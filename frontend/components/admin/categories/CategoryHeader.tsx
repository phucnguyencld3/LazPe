"use client";

interface CategoryHeaderProps {
  onNewRootCategory: () => void;
}

export default function CategoryHeader({ onNewRootCategory }: CategoryHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
      <div>
        <h1 className="font-headline-lg text-headline-lg text-on-surface text-3xl font-bold tracking-tight">Quản lý danh mục</h1>
      </div>
      <button
        onClick={onNewRootCategory}
        className="flex items-center gap-sm px-6 py-3 rounded-full bg-primary text-on-primary font-headline-md text-headline-md bouncy-hover shadow-lg cursor-pointer"
      >
        <span className="material-symbols-outlined">add_circle</span>
        Thêm danh mục mới
      </button>
    </div>
  );
}
