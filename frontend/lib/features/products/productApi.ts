// productApi.ts

export interface AdminProductInfo {
  productID: number;
  code: string;
  productName: string;
  description: string;
  price: number;
  productDiscountPercent: number;
  stock: number;
  status: boolean;
  categoryID: number;
  categoryName: string;
  supplierID: number;
  supplierName: string;
  createdAt: string;
  imageUrl: string | null;
  totalStock: number;
  minPrice: number;
  maxPrice: number;
  minEffectivePrice: number;
  maxEffectivePrice: number;
  variantCount: number;
}

export interface AdminProductPagination {
  products: AdminProductInfo[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  searchTerm?: string;
  categoryId?: number | null;
  status?: boolean | null;
}

export interface ProductStats {
  totalProducts: number;
  activeProducts: number;
  outOfStockProducts: number;
  newProducts: number;
}

export interface CategorySelectOption {
  categoryID: number;
  categoryName: string;
  parentID: number | null;
  level: number;
  status: boolean;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5101/api";

export const fetchAdminProducts = async (
  token: string,
  page: number = 1,
  pageSize: number = 12,
  searchTerm: string = "",
  categoryId: number | null = null,
  status: boolean | null = null
): Promise<AdminProductPagination> => {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
    searchTerm: searchTerm,
  });

  if (categoryId !== null) {
    params.append("categoryId", categoryId.toString());
  }

  if (status !== null) {
    params.append("status", status.toString());
  }

  const res = await fetch(`${API_BASE_URL}/Product?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) throw new Error("Failed to fetch admin products");
  const data = await res.json();
  return data.data;
};

export const fetchProductStats = async (token: string): Promise<ProductStats> => {
  const res = await fetch(`${API_BASE_URL}/Product/admin-stats`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) throw new Error("Failed to fetch product stats");
  const data = await res.json();
  return data.data;
};

export const toggleProductStatus = async (token: string, id: number): Promise<any> => {
  const res = await fetch(`${API_BASE_URL}/Product/${id}/toggle-status`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) throw new Error("Failed to toggle product status");
  return res.json();
};

export const deleteProduct = async (token: string, id: number): Promise<any> => {
  const res = await fetch(`${API_BASE_URL}/Product/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to delete product");
  }
  return res.json();
};

export const fetchCategoriesForSelect = async (token: string): Promise<CategorySelectOption[]> => {
  const res = await fetch(`${API_BASE_URL}/Product/categories`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) throw new Error("Failed to fetch select categories");
  const data = await res.json();
  return data.data;
};

// Detailed definitions
export interface AdminVariantInfo {
  variantID: number;
  productID: number;
  variantName: string;
  unitPrice: number;
  variantDiscountPercent: number;
  effectiveDiscountPercent: number;
  finalPrice: number;
  stock: number;
  sku: string;
  imageUrl?: string | null;
  description?: string | null;
  status: boolean;
  createdAt?: string;
}

export interface AdminProductOptionValue {
  productOptionValueID: number;
  productOptionID: number;
  value: string;
  price: number;
  displayOrder: number;
}

export interface AdminProductOption {
  productOptionID: number;
  productID: number;
  name: string;
  displayOrder: number;
  productOptionValues: AdminProductOptionValue[];
}

export interface AdminProductDetailInfo {
  productID: number;
  code: string;
  productName: string;
  description: string;
  price: number;
  productDiscountPercent: number;
  stock: number;
  status: boolean;
  categoryID: number;
  supplierID: number;
  createdAt: string;
  createdBy?: string | null;
  category?: {
    categoryID: number;
    categoryName: string;
  } | null;
  supplier?: {
    supplierID: number;
    supplierName: string;
  } | null;
  variants: AdminVariantInfo[];
  productOptions: AdminProductOption[];
}

export const fetchAdminProductDetail = async (token: string, id: string): Promise<AdminProductDetailInfo> => {
  const res = await fetch(`${API_BASE_URL}/Product/${id}/detail`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) throw new Error("Failed to fetch admin product details");
  const data = await res.json();
  return data.data;
};
