"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "@/lib/toast";
import {
  fetchAllCategories,
  fetchCategoryById,
  updateCategory,
  CategoryInfo,
  EditCategoryPayload
} from "@/lib/features/categories/categoryApi";

function EditCategoryForm() {
  const router = useRouter();
  const params = useParams();
  const categoryId = Number(params.id);

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

  const parentName = parentID
    ? allCategories.find(c => c.categoryID === parentID)?.categoryName || "Đang tải..."
    : "Không có (Danh mục gốc)";

  // Load category and other list
  const loadData = async () => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      setLoading(true);

      const [catData, listData] = await Promise.all([
        fetchCategoryById(token, categoryId),
        fetchAllCategories(token)
      ]);

      setCategoryName(catData.categoryName);
      setDescription(catData.description || "");
      setParentID(catData.parentID || "");
      setSortOrder(catData.sortOrder || "");
      setStatus(catData.status);

      setAllCategories(listData);
    } catch (err: any) {
      console.error(err);
      toast.error("Không thể tải thông tin danh mục.");
      router.push("/admin/categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (categoryId) {
      loadData();
    }
  }, [categoryId]);

  // Helper: Get category level to restrict parents (max 3 levels total)
  const getCategoryLevel = (cat: CategoryInfo): number => {
    if (!cat.parentID) return 1;
    const parent = allCategories.find(c => c.categoryID === cat.parentID);
    if (!parent) return 1;
    if (!parent.parentID) return 2;
    return 3;
  };

  // Helper: Check circular reference (is potential parent a descendant of this category?)
  const isDescendantOf = (catId: number, ancestorId: number): boolean => {
    const cat = allCategories.find(c => c.categoryID === catId);
    if (!cat || cat.parentID === null) return false;
    if (cat.parentID === ancestorId) return true;
    return isDescendantOf(cat.parentID, ancestorId);
  };

  // Filter list of valid parents:
  // 1. Level < 3 (must not be a leaf level 3)
  // 2. Must not be the current category itself
  // 3. Must not be a descendant of the current category (to avoid circular reference)
  const validParents = allCategories.filter(cat => {
    if (cat.categoryID === categoryId) return false;
    if (getCategoryLevel(cat) >= 3) return false;
    if (isDescendantOf(cat.categoryID, categoryId)) return false;
    return true;
  });

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

      const payload: EditCategoryPayload = {
        categoryID: categoryId,
        categoryName: categoryName.trim(),
        description: description.trim(),
        parentID: parentID === "" ? null : Number(parentID),
        sortOrder: sortOrder.trim() || undefined,
        status: status
      };

      const res = await updateCategory(token, categoryId, payload);
      if (res.success) {
        toast.success("Cập nhật danh mục thành công!");
        router.push("/admin/categories");
      } else {
        toast.error(res.message || "Không thể cập nhật danh mục.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Đã xảy ra lỗi khi lưu danh mục.");
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
        <span className="text-primary">Chỉnh sửa</span>
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
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Chỉnh sửa danh mục</h2>
          <p className="text-slate-500 text-xs mt-1">Cập nhật thông tin chi tiết và vị trí danh mục trong hệ thống.</p>
        </div>
      </header>

      {/* Form Container */}
      <div className="w-full bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
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
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-semibold text-slate-800"
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
                className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-semibold text-slate-500 cursor-not-allowed"
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
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-semibold text-slate-800"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
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
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-semibold text-slate-800 resize-none"
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
                  <span>Cập nhật</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EditCategoryPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-[500px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    }>
      <EditCategoryForm />
    </Suspense>
  );
}
