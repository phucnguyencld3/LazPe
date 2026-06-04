"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import {
  fetchAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus,
  CategoryInfo,
  CreateCategoryPayload,
  EditCategoryPayload
} from "@/lib/features/categories/categoryApi";
import { getProducts } from "@/lib/api";
import CategoryHeader from "@/components/admin/categories/CategoryHeader";
import CategoryStats from "@/components/admin/categories/CategoryStats";
import CategoryTree from "@/components/admin/categories/CategoryTree";
import CategoryForm from "@/components/admin/categories/CategoryForm";
import CategoryDeleteModal from "@/components/admin/categories/CategoryDeleteModal";
import SubCategoryModal from "@/components/admin/categories/SubCategoryModal";
import CategoryDescriptionModal from "@/components/admin/categories/CategoryDescriptionModal";

export default function AdminCategoriesPage() {
  const router = useRouter();

  // Loaders
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // Data states
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [expandedIds, setExpandedIds] = useState<Record<number, boolean>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [totalProducts, setTotalProducts] = useState(0);

  // Form states (Right column)
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const [categoryName, setCategoryName] = useState("");
  const [description, setDescription] = useState("");
  const [parentID, setParentID] = useState<number | "">("");
  const [sortOrder, setSortOrder] = useState("");
  const [status, setStatus] = useState(true);

  // Deletion Modal states
  const [categoryToDelete, setCategoryToDelete] = useState<{ id: number; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Description modal state
  const [descriptionCategory, setDescriptionCategory] = useState<CategoryInfo | null>(null);

  // Sub-category modal states
  const [subCreateParent, setSubCreateParent] = useState<CategoryInfo | null>(null);
  const [subCategoryName, setSubCategoryName] = useState("");
  const [subDescription, setSubDescription] = useState("");
  const [subSortOrder, setSubSortOrder] = useState("");
  const [subStatus, setSubStatus] = useState(true);
  const [submittingSub, setSubmittingSub] = useState(false);

  const loadCategories = async () => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      setLoading(true);
      const data = await fetchAllCategories(token);
      setCategories(data);

      const prodRes = await getProducts(1, 1);
      if (prodRes) {
        setTotalProducts(prodRes.totalItems);
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Không thể tải danh sách danh mục.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleExpandAll = () => {
    const nextExpanded: Record<number, boolean> = {};
    categories.forEach(c => {
      nextExpanded[c.categoryID] = true;
    });
    setExpandedIds(nextExpanded);
  };

  const handleCollapseAll = () => {
    setExpandedIds({});
  };

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleToggleStatus = async (id: number) => {
    if (togglingId !== null) return;
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return;

      setTogglingId(id);
      const res = await toggleCategoryStatus(token, id);
      if (res.success) {
        toast.success(res.message || "Đã cập nhật trạng thái danh mục.");
        setCategories(prev =>
          prev.map(c => (c.categoryID === id ? { ...c, status: !c.status } : c))
        );
      } else {
        toast.error(res.message || "Lỗi khi cập nhật trạng thái.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Không thể cập nhật trạng thái danh mục.");
    } finally {
      setTogglingId(null);
    }
  };

  const handleEditClick = (cat: CategoryInfo) => {
    setIsEditing(true);
    setEditId(cat.categoryID);
    setCategoryName(cat.categoryName);
    setDescription(cat.description || "");
    setParentID(cat.parentID || "");
    setSortOrder(cat.sortOrder || "");
    setStatus(cat.status);

    const input = document.getElementById("categoryNameInput");
    if (input) {
      input.focus();
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAddSubClick = (parentCat: CategoryInfo) => {
    if (getCategoryLevel(parentCat) >= 3) {
      toast.warning("Đã đạt cấp tối đa, không thể tạo thêm danh mục con.");
      return;
    }
    setSubCreateParent(parentCat);
    setSubCategoryName("");
    setSubDescription("");
    setSubSortOrder("");
    setSubStatus(true);
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditId(null);
    setCategoryName("");
    setDescription("");
    setParentID("");
    setSortOrder("");
    setStatus(true);
  };

  const handleNewRootCategory = () => {
    resetForm();
    const input = document.getElementById("categoryNameInput");
    if (input) {
      input.focus();
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFormSubmit = async (e: FormEvent) => {
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

      setSubmitting(true);

      if (isEditing && editId !== null) {
        const payload: EditCategoryPayload = {
          categoryID: editId,
          categoryName: categoryName.trim(),
          description: description.trim(),
          parentID: parentID === "" ? null : Number(parentID),
          sortOrder: sortOrder.trim() || undefined,
          status: status
        };

        const res = await updateCategory(token, editId, payload);
        if (res.success) {
          toast.success("Cập nhật danh mục thành công!");
          resetForm();
          loadCategories();
        } else {
          toast.error(res.message || "Không thể cập nhật danh mục.");
        }
      } else {
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
          resetForm();
          loadCategories();
        } else {
          toast.error(res.message || "Không thể tạo danh mục.");
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Đã xảy ra lỗi khi lưu danh mục.");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete || deleting) return;
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return;

      setDeleting(true);
      const res = await deleteCategory(token, categoryToDelete.id);
      if (res.success) {
        toast.success("Xóa danh mục thành công.");
        setCategoryToDelete(null);
        loadCategories();
      } else {
        toast.error(res.message || "Không thể xóa danh mục.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Không thể xóa danh mục này do có ràng buộc dữ liệu hoặc sản phẩm liên quan.", { duration: 5000 });
    } finally {
      setDeleting(false);
    }
  };

  const closeSubCreateModal = () => {
    setSubCreateParent(null);
    setSubCategoryName("");
    setSubDescription("");
    setSubSortOrder("");
    setSubStatus(true);
  };

  const handleSubCreateSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!subCreateParent) return;

    if (!subCategoryName.trim()) {
      toast.warning("Vui lòng nhập tên danh mục.");
      return;
    }

    if (!subDescription.trim()) {
      toast.warning("Vui lòng nhập mô tả danh mục.");
      return;
    }

    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return;

      setSubmittingSub(true);

      const payload: CreateCategoryPayload = {
        categoryName: subCategoryName.trim(),
        description: subDescription.trim(),
        parentID: subCreateParent.categoryID,
        sortOrder: subSortOrder.trim() || undefined,
        status: subStatus
      };

      const res = await createCategory(token, payload);
      if (res.success) {
        toast.success("Tạo danh mục con thành công!");
        closeSubCreateModal();
        loadCategories();
      } else {
        toast.error(res.message || "Không thể tạo danh mục.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Đã xảy ra lỗi khi lưu danh mục.");
    } finally {
      setSubmittingSub(false);
    }
  };

  const getCategoryLevel = (cat: CategoryInfo): number => {
    if (!cat.parentID) return 1;
    const parent = categories.find(c => c.categoryID === cat.parentID);
    if (!parent) return 1;
    if (!parent.parentID) return 2;
    return 3;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[500px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const rootCount = categories.filter(c => !c.parentID).length;

  return (
    <main className="w-full pb-20 animate-in fade-in duration-300">
      <CategoryHeader onNewRootCategory={handleNewRootCategory} />

      <CategoryStats
        totalCategories={categories.length}
        totalProducts={totalProducts}
        hiddenCount={categories.filter(c => !c.status).length}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <CategoryTree
          categories={categories}
          expandedIds={expandedIds}
          searchTerm={searchTerm}
          rootCount={rootCount}
          onSearchChange={setSearchTerm}
          onExpandAll={handleExpandAll}
          onCollapseAll={handleCollapseAll}
          onToggleExpand={toggleExpand}
          onAddSub={handleAddSubClick}
          onEdit={handleEditClick}
          onDelete={cat => setCategoryToDelete({ id: cat.categoryID, name: cat.categoryName })}
          onShowDescription={setDescriptionCategory}
        />

        <CategoryForm
          isEditing={isEditing}
          categoryName={categoryName}
          description={description}
          sortOrder={sortOrder}
          status={status}
          submitting={submitting}
          onCategoryNameChange={setCategoryName}
          onDescriptionChange={setDescription}
          onSortOrderChange={setSortOrder}
          onStatusChange={setStatus}
          onCancelEdit={resetForm}
          onSubmit={handleFormSubmit}
        />
      </div>

      <CategoryDeleteModal
        categoryToDelete={categoryToDelete}
        deleting={deleting}
        onCancel={() => setCategoryToDelete(null)}
        onConfirm={confirmDeleteCategory}
      />

      <SubCategoryModal
        parentCategory={subCreateParent}
        categoryName={subCategoryName}
        description={subDescription}
        sortOrder={subSortOrder}
        status={subStatus}
        submitting={submittingSub}
        onCategoryNameChange={setSubCategoryName}
        onDescriptionChange={setSubDescription}
        onSortOrderChange={setSubSortOrder}
        onStatusChange={setSubStatus}
        onClose={closeSubCreateModal}
        onSubmit={handleSubCreateSubmit}
      />

      <CategoryDescriptionModal
        category={descriptionCategory}
        onClose={() => setDescriptionCategory(null)}
      />
    </main>
  );
}
