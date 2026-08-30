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

async function handleCategoryResponse(res: Response, defaultErrorMsg: string) {
  if (res.status === 403) {
    throw new Error("Bạn không có quyền thực hiện thao tác này (403 Forbidden).");
  }
  if (res.status === 401) {
    throw new Error("Phiên làm việc đã hết hạn, vui lòng đăng nhập lại.");
  }
  if (!res.ok) {
    const text = await res.text();
    try {
      const json = JSON.parse(text);
      throw new Error(json.message || `${defaultErrorMsg} (Mã HTTP: ${res.status})`);
    } catch {
      throw new Error(text || `${defaultErrorMsg} (Mã HTTP: ${res.status})`);
    }
  }
  return res.json();
}

export const fetchAllCategories = async (token: string): Promise<CategoryInfo[]> => {
  const res = await fetch(`${API_BASE_URL}/Category`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await handleCategoryResponse(res, "Không thể tải danh sách danh mục");
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
  return await handleCategoryResponse(res, "Không thể tạo mới danh mục");
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
  return await handleCategoryResponse(res, "Không thể cập nhật danh mục");
};

export const deleteCategory = async (token: string, id: number): Promise<any> => {
  const res = await fetch(`${API_BASE_URL}/Category/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  return await handleCategoryResponse(res, "Không thể xóa danh mục");
};

export const toggleCategoryStatus = async (token: string, id: number): Promise<any> => {
  const res = await fetch(`${API_BASE_URL}/Category/${id}/toggle-status`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  });
  return await handleCategoryResponse(res, "Không thể cập nhật trạng thái danh mục");
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
  const result = await handleCategoryResponse(res, "Không thể tải thông tin chi tiết danh mục");
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
  if (res.status === 403) throw new Error("Bạn không có quyền xuất danh sách danh mục ra Excel (403 Forbidden).");
  if (!res.ok) throw new Error("Không thể xuất file Excel danh mục");
  return res.blob();
};

export const downloadCategoryTemplate = async (): Promise<Blob> => {
  const res = await fetch(`${API_BASE_URL}/CategoryImport/template`);
  if (!res.ok) throw new Error("Không thể tải mẫu file Excel danh mục");
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
  return await handleCategoryResponse(res, "Không thể kiểm tra file Excel nhập danh mục");
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
  return await handleCategoryResponse(res, "Không thể nhập danh mục từ file Excel");
};

