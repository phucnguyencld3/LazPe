"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "@/lib/toast";
import {
  fetchAllCategories,
  createCategory,
  CategoryInfo,
  CreateCategoryPayload
} from "@/lib/features/categories/categoryApi";

function CreateCategoryForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const parentIdParam = searchParams.get("parentId");

  // Loaders
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [categoryName, setCategoryName] = useState("");
  const [description, setDescription] = useState("");
  const [parentID, setParentID] = useState<number | "">("");
  const [sortOrder, setSortOrder] = useState("");
  const [status, setStatus] = useState(true);

  // All categories for parent selection
  const [allCategories, setAllCategories] = useState<CategoryInfo[]>([]);

  const parentName = parentIdParam
    ? allCategories.find(c => c.categoryID === Number(parentIdParam))?.categoryName || "Đang tải..."
    : "Không có (Danh mục gốc)";

  const loadCategories = async () => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      setLoading(true);
      const data = await fetchAllCategories(token);
      setAllCategories(data);

      // Pre-select parent ID from URL if valid
      const targetParentId = parentIdParam ? Number(parentIdParam) : null;
      if (parentIdParam) {
        setParentID(Number(parentIdParam));
      } else {
        setParentID("");
      }

      // Calculate auto-incremented sort order among siblings
      const siblings = data.filter(c => c.parentID === targetParentId);
      let maxSort = 0;
      siblings.forEach(s => {
        const num = parseInt(s.sortOrder || "", 10);
        if (!isNaN(num) && num > maxSort) {
          maxSort = num;
        }
      });
      setSortOrder(String(maxSort + 1));
    } catch (err: any) {
      console.error(err);
      toast.error("Không thể tải danh sách danh mục để lựa chọn.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, [parentIdParam]);

  // Helper: Get category level to restrict parents (max 3 levels total)
  const getCategoryLevel = (cat: CategoryInfo): number => {
    if (!cat.parentID) return 1;
    const parent = allCategories.find(c => c.categoryID === cat.parentID);
    if (!parent) return 1;
    if (!parent.parentID) return 2;
    return 3;
  };

  // Filter list of valid parents (only allow level 1 and level 2 to be parents)
  const validParents = allCategories.filter(c => getCategoryLevel(c) < 3);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!categoryName.trim()) {
      toast.warning("Vui lòng nhập tên danh mục.");
      return;
    }

    if (!description.trim()) {
      toast.warning("Vui lòng nhập mô tả danh mục.");
      return;
    }

    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return;

      setSaving(true);

      const payload: CreateCategoryPayload = {
        categoryName: categoryName.trim(),
        description: description.trim(),
        parentID: parentID === "" ? null : Number(parentID),
        sortOrder: sortOrder.trim() || undefined,
        status: status
      };

      const res = await createCategory(token, payload);
      if (res.success) {
        toast.success("Tạo danh mục mới thành công!");
        router.push("/admin/categories");
      } else {
        toast.error(res.message || "Không thể tạo danh mục.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Đã xảy ra lỗi khi tạo danh mục.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[500px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-full pb-32 animate-in fade-in duration-300">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-slate-400 mb-6 font-bold text-xs">
        <span
          className="hover:text-primary transition-colors cursor-pointer"
          onClick={() => router.push("/admin/categories")}
        >
          Danh mục
        </span>
        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        <span className="text-primary">Thêm mới</span>
      </nav>

      {/* Header */}
      <header className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.push("/admin/categories")}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all shadow-sm cursor-pointer active:scale-95"
          title="Quay lại danh sách danh mục"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
        </button>
        <div>
          <h2 className="font-headline-md text-headline-md text-primary font-bold">Thêm danh mục mới</h2>
          <p className="text-slate-500 text-xs mt-1">Tạo một danh mục sản phẩm mới trong hệ thống phân cấp.</p>
        </div>
      </header>

      {/* Form Container */}
      <div className="w-full bg-white rounded-[8px] p-8 border border-slate-100 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                Tên danh mục <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={categoryName}
                onChange={e => setCategoryName(e.target.value)}
                placeholder="Nhập tên danh mục..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-semibold text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                Danh mục cha
              </label>
              <input
                type="text"
                readOnly
                disabled
                value={parentName}
                className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-[8px] text-sm font-semibold text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                Thứ tự hiển thị
              </label>
              <input
                type="text"
                value={sortOrder}
                onChange={e => setSortOrder(e.target.value)}
                placeholder="Ví dụ: 1, 2, A, B..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-semibold text-slate-800"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-[8px]">
              <div>
                <p className="text-xs font-bold text-slate-800">Trạng thái hiển thị</p>
                <p className="text-[9px] text-slate-400 mt-0.5">Cho phép hiển thị trên cửa hàng và thanh lọc</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={status}
                  onChange={e => setStatus(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5.5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
              Mô tả chi tiết <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={5}
              required
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Nhập mô tả tóm tắt cho danh mục..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-semibold text-slate-800 resize-none"
            />
          </div>

          <div className="flex items-center gap-3 pt-6 border-t border-slate-50">
            <button
              type="button"
              onClick={() => router.push("/admin/categories")}
              className="flex-1 py-3 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 font-bold text-xs cursor-pointer text-center"
              disabled={saving}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 rounded-full bg-primary text-on-primary font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-primary/20 hover:bg-primary/95 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div>
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  <span>Tạo danh mục</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CreateCategoryPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-[500px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    }>
      <CreateCategoryForm />
    </Suspense>
  );
}
