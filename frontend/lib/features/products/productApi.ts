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

export const fetchProductOptions = async (token: string, productId: number): Promise<AdminProductOption[]> => {
  const res = await fetch(`${API_BASE_URL}/ProductOption/product/${productId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Failed to fetch product options");
  const data = await res.json();
  return data.data;
};

export const createProductOption = async (token: string, productId: number, name: string, displayOrder: number): Promise<any> => {
  const res = await fetch(`${API_BASE_URL}/ProductOption/product/${productId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ productID: productId, name, displayOrder })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to create product option");
  }
  return res.json();
};

export const updateProductOption = async (token: string, optionId: number, name: string, displayOrder: number): Promise<any> => {
  const res = await fetch(`${API_BASE_URL}/ProductOption/${optionId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ name, displayOrder })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to update product option");
  }
  return res.json();
};

export const deleteProductOption = async (token: string, optionId: number): Promise<any> => {
  const res = await fetch(`${API_BASE_URL}/ProductOption/${optionId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to delete product option");
  }
  return res.json();
};

export const createProductOptionValue = async (token: string, optionId: number, value: string, price: number, displayOrder: number): Promise<any> => {
  const res = await fetch(`${API_BASE_URL}/ProductOption/${optionId}/values`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ productOptionID: optionId, value, price, displayOrder })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to create option value");
  }
  return res.json();
};

export const updateProductOptionValue = async (token: string, valueId: number, value: string, price: number, displayOrder: number): Promise<any> => {
  const res = await fetch(`${API_BASE_URL}/ProductOption/values/${valueId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ value, price, displayOrder })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to update option value");
  }
  return res.json();
};

export const deleteProductOptionValue = async (token: string, valueId: number): Promise<any> => {
  const res = await fetch(`${API_BASE_URL}/ProductOption/values/${valueId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to delete option value");
  }
  return res.json();
};

export interface AdminVariantPagination {
  totalCount: number;
  pageCount: number;
  currentPage: number;
  pageSize: number;
  data: AdminVariantInfo[];
}

export const fetchProductVariants = async (
  token: string,
  productId: number,
  page: number = 1,
  pageSize: number = 10,
  searchTerm: string = ""
): Promise<AdminVariantPagination> => {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
    searchTerm: searchTerm
  });

  const res = await fetch(`${API_BASE_URL}/Variant/product/${productId}?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) throw new Error("Failed to fetch product variants");
  return res.json();
};

export const updateProductVariant = async (
  token: string,
  variantId: number,
  data: {
    name?: string;
    price: number;
    variantDiscountPercent: number;
    stock: number;
    description?: string;
    status: boolean;
  }
): Promise<any> => {
  const res = await fetch(`${API_BASE_URL}/Variant/${variantId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to update product variant");
  }
  return res.json();
};

export const toggleVariantStatus = async (
  token: string,
  variantId: number,
  status: boolean
): Promise<any> => {
  const res = await fetch(`${API_BASE_URL}/Variant/${variantId}/toggle-status`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ status })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to toggle variant status");
  }
  return res.json();
};

export const deleteProductVariant = async (token: string, variantId: number): Promise<any> => {
  const res = await fetch(`${API_BASE_URL}/Variant/${variantId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to delete variant");
  }
  return res.json();
};

export const uploadVariantImage = async (token: string, variantId: number, file: File): Promise<{ message: string, imageUrl: string }> => {
  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch(`${API_BASE_URL}/Variant/${variantId}/upload-image`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to upload variant image");
  }
  return res.json();
};

export const deleteVariantImage = async (token: string, variantId: number): Promise<any> => {
  const res = await fetch(`${API_BASE_URL}/Variant/${variantId}/image`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to delete variant image");
  }
  return res.json();
};

export interface VariantCombinationInfo {
  variantName: string;
  unitPrice: number;
  optionCombination: Record<string, string>;
  optionValueIds: number[];
  alreadyExists: boolean;
}

export interface GenerateCombinationsResponse {
  productId: number;
  productName: string;
  productCode: string;
  totalCombinations: number;
  combinations: VariantCombinationInfo[];
}

export const generateVariantCombinations = async (
  token: string,
  productId: number
): Promise<GenerateCombinationsResponse> => {
  const res = await fetch(`${API_BASE_URL}/Variant/generate-combinations/${productId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to generate combinations");
  }
  return res.json();
};

export const createMultipleVariants = async (
  token: string,
  productId: number,
  variants: {
    productID: number;
    name: string;
    unitPrice: number;
    variantDiscountPercent: number;
    stock: number;
    sku: string;
    description?: string;
    imageUrl?: string;
    optionValueIds: number[];
  }[]
): Promise<any> => {
  const res = await fetch(`${API_BASE_URL}/Variant/product/${productId}/multiple`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(variants)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to create multiple variants");
  }
  return res.json();
};

export interface SupplierSelectOption {
  supplierID: number;
  supplierName: string;
  status: boolean;
}

export interface CreateProductPayload {
  code?: string;
  productName: string;
  description?: string;
  price?: number;
  productDiscountPercent?: number;
  stock?: number;
  categoryID: number;
  supplierID?: number | null;
}

export const fetchSuppliersForSelect = async (token: string): Promise<SupplierSelectOption[]> => {
  const res = await fetch(`${API_BASE_URL}/Product/suppliers`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) throw new Error("Failed to fetch select suppliers");
  const data = await res.json();
  return data.data;
};

export const createProduct = async (token: string, payload: CreateProductPayload): Promise<any> => {
  const res = await fetch(`${API_BASE_URL}/Product`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to create product");
  }
  return res.json();
};

export interface UpdateProductPayload {
  code?: string;
  productName: string;
  description?: string;
  price?: number;
  productDiscountPercent?: number;
  stock?: number;
  categoryID: number;
  supplierID?: number | null;
  status: boolean;
}

export const updateProduct = async (token: string, id: number, payload: UpdateProductPayload): Promise<any> => {
  const res = await fetch(`${API_BASE_URL}/Product/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to update product");
  }
  return res.json();
};



