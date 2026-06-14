export interface CategoryInfo {
  categoryID: number;
  categoryName: string;
  description?: string;
  parentID: number | null;
  parentCategoryName?: string | null;
  level: number;
  sortOrder?: string | null;
  status: boolean;
  createdAt: string;
  createdBy?: string | null;
  productCount?: number;
}

export interface CreateCategoryPayload {
  categoryName: string;
  description: string;
  parentID?: number | null;
  sortOrder?: string;
  status?: boolean;
}

export interface EditCategoryPayload {
  categoryID: number;
  categoryName: string;
  description: string;
  parentID?: number | null;
  sortOrder?: string;
  status?: boolean;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5101/api";

export const fetchAllCategories = async (token: string): Promise<CategoryInfo[]> => {
  const res = await fetch(`${API_BASE_URL}/Category`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Failed to fetch categories");
  const data = await res.json();
  return (data.data || []).map((item: CategoryInfo) => ({
    ...item,
    parentID: item.parentID ?? null
  }));
};

export const createCategory = async (token: string, payload: CreateCategoryPayload): Promise<any> => {
  const res = await fetch(`${API_BASE_URL}/Category`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to create category");
  }
  return res.json();
};

export const updateCategory = async (token: string, id: number, payload: EditCategoryPayload): Promise<any> => {
  const res = await fetch(`${API_BASE_URL}/Category/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to update category");
  }
  return res.json();
};

export const deleteCategory = async (token: string, id: number): Promise<any> => {
  const res = await fetch(`${API_BASE_URL}/Category/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to delete category");
  }
  return res.json();
};

export const toggleCategoryStatus = async (token: string, id: number): Promise<any> => {
  const res = await fetch(`${API_BASE_URL}/Category/${id}/toggle-status`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to toggle category status");
  }
  return res.json();
};

export interface CategoryDetailInfo {
  categoryID: number;
  categoryName: string;
  description?: string;
  parentID: number | null;
  parentCategoryName?: string | null;
  level: number;
  sortOrder?: string | null;
  status: boolean;
  createdAt: string;
  createdBy?: string | null;
  productCount: number;
  subCategories: any[];
  products: any[];
}

export const fetchCategoryById = async (token: string, id: number): Promise<CategoryDetailInfo> => {
  const res = await fetch(`${API_BASE_URL}/Category/${id}/detail`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Failed to fetch category details");
  const result = await res.json();
  return result.data;
};
