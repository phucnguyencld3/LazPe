"use client";

interface CategoryHeaderProps {
  onNewRootCategory: () => void;
  showAddButton?: boolean;
}

export default function CategoryHeader({ onNewRootCategory, showAddButton = true }: CategoryHeaderProps) {
  return (
    <header className="mb-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 className="font-headline-md text-headline-md text-primary font-bold">Quản lý danh mục</h1>
        <p className="font-body-md text-body-md text-on-surface-variant/70">Quản lý cấu trúc danh mục sản phẩm đa cấp và thứ tự hiển thị</p>
      </div>
      {showAddButton && (
        <button
          onClick={onNewRootCategory}
          className="bg-primary text-on-primary px-lg py-md rounded-full font-label-md text-label-md flex items-center gap-xs hover:scale-105 active:scale-95 transition-all shadow-md font-bold cursor-pointer"
        >
          <span className="material-symbols-outlined">add_circle</span>
          Thêm danh mục mới
        </button>
      )}
    </header>
  );
}
