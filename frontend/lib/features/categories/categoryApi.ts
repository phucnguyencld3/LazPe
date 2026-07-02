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

export const exportCategoriesExcel = async (
  token: string,
  searchTerm: string = "",
  status: boolean | null = null
): Promise<Blob> => {
  const params = new URLSearchParams({
    searchTerm: searchTerm
  });
  if (status !== null) {
    params.append("status", status.toString());
  }

  const res = await fetch(`${API_BASE_URL}/Category/export-excel?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Failed to export categories Excel");
  return res.blob();
};

export const downloadCategoryTemplate = async (): Promise<Blob> => {
  const res = await fetch(`${API_BASE_URL}/CategoryImport/template`);
  if (!res.ok) throw new Error("Failed to download category template");
  return res.blob();
};

export const validateCategoryImport = async (token: string, file: File): Promise<any> => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE_URL}/CategoryImport/validate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to validate categories excel file");
  }
  return res.json();
};

export const commitCategoryImport = async (token: string, payload: any): Promise<any> => {
  const res = await fetch(`${API_BASE_URL}/CategoryImport/commit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to commit categories import");
  }
  return res.json();
};

