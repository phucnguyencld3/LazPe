export interface BrandInfo {
  supplierID: number;
  supplierName: string;
  logo?: string | null;
  description?: string | null;
  status: boolean;
  createdAt: string;
  createdBy?: string | null;
  productCount: number;
}

export interface CreateBrandPayload {
  supplierName: string;
  logo?: string | null;
  description?: string | null;
  status: boolean;
}

export interface EditBrandPayload {
  supplierName: string;
  logo?: string | null;
  description?: string | null;
  status: boolean;
}

export interface PaginatedBrandsResponse {
  suppliers: BrandInfo[];
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  searchTerm: string;
  status: boolean | null;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5101/api";

export const fetchAllBrands = async (token: string): Promise<BrandInfo[]> => {
  const res = await fetch(`${API_BASE_URL}/Suppliers`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Failed to fetch all brands");
  const result = await res.json();
  return (result.data || []).map((item: any) => ({
    supplierID: item.supplierID,
    supplierName: item.supplierName,
    logo: item.logo,
    description: item.description,
    status: item.status,
    createdAt: item.createdAt,
    createdBy: item.createdBy,
    productCount: item.products ? item.products.length : 0
  }));
};

export const fetchBrandsPaginated = async (
  token: string,
  page: number = 1,
  pageSize: number = 10,
  searchTerm: string = "",
  status: boolean | null = null
): Promise<PaginatedBrandsResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
    searchTerm: searchTerm
  });
  if (status !== null) {
    params.append("status", status.toString());
  }

  const res = await fetch(`${API_BASE_URL}/Suppliers/paginated?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Failed to fetch brands");
  const result = await res.json();
  return result.data;
};

export const fetchBrandById = async (token: string, id: number): Promise<BrandInfo> => {
  const res = await fetch(`${API_BASE_URL}/Suppliers/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Failed to fetch brand details");
  const result = await res.json();
  return result.data;
};

export const createBrand = async (token: string, payload: CreateBrandPayload): Promise<any> => {
  const res = await fetch(`${API_BASE_URL}/Suppliers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to create brand");
  }
  return res.json();
};

export const updateBrand = async (token: string, id: number, payload: EditBrandPayload): Promise<any> => {
  const res = await fetch(`${API_BASE_URL}/Suppliers/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to update brand");
  }
  return res.json();
};

export const deleteBrand = async (token: string, id: number): Promise<any> => {
  const res = await fetch(`${API_BASE_URL}/Suppliers/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to delete brand");
  }
  return res.json();
};

export const exportBrandsExcel = async (
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

  const res = await fetch(`${API_BASE_URL}/Suppliers/export-excel?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Failed to export brands Excel");
  return res.blob();
};
