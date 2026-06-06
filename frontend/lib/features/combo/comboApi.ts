// comboApi.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5101/api";

export interface BundleItemResponse {
  bundleItemID: number;
  variantID: number;
  quantity: number;
  variantName: string;
  unitPrice: number;
  stock: number;
  imageUrl: string;
  productName: string;
  sku: string;
}

export interface BundleResponse {
  bundleID: number;
  name: string;
  code: string;
  description: string;
  price: number;
  originalPrice: number;
  discountPercent: number;
  status: boolean;
  imageUrl: string;
  createdDate: string;
  items?: BundleItemResponse[];
}

export interface AddBundleItemDto {
  variantID: number;
  quantity: number;
  sortOrder?: number;
}

export interface CreateBundleDto {
  name: string;
  description?: string;
  imageUrl?: string;
  discountPercent: number;
  status: boolean;
  bundleItems: AddBundleItemDto[];
}

export interface UpdateBundleDto {
  bundleID: number;
  name: string;
  description?: string;
  imageUrl?: string;
  discountPercent: number;
  status: boolean;
}

// Fetch all bundles
export async function getBundles(token: string): Promise<BundleResponse[]> {
  const response = await fetch(`${API_BASE_URL}/Bundle`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Failed to fetch bundles");
  const result = await response.json();
  return result.data || [];
}

// Fetch single bundle with items
export async function getBundleDetail(id: number, token: string): Promise<BundleResponse> {
  const response = await fetch(`${API_BASE_URL}/Bundle/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Failed to fetch bundle detail");
  const result = await response.json();
  return result.data;
}

// Create bundle
export async function createBundle(dto: CreateBundleDto, token: string): Promise<{ success: boolean; message: string; data?: any }> {
  const response = await fetch(`${API_BASE_URL}/Bundle`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(dto)
  });
  const result = await response.json();
  return result;
}

// Update bundle
export async function updateBundle(id: number, dto: UpdateBundleDto, token: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/Bundle/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(dto)
  });
  const result = await response.json();
  return result;
}

// Delete bundle
export async function deleteBundle(id: number, token: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/Bundle/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  const result = await response.json();
  return result;
}

// Toggle bundle status
export async function toggleBundleStatus(id: number, token: string): Promise<{ success: boolean; message: string; data?: any }> {
  const response = await fetch(`${API_BASE_URL}/Bundle/${id}/toggle-status`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  });
  const result = await response.json();
  return result;
}

// Upload bundle image
export async function uploadBundleImage(file: File, token: string): Promise<{ success: boolean; data?: string; message?: string }> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(`${API_BASE_URL}/Bundle/upload-image`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  });
  const result = await response.json();
  return result;
}

// Add item to bundle (for existing bundle edit)
export async function addBundleItem(bundleId: number, itemDto: AddBundleItemDto, token: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/Bundle/${bundleId}/items`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(itemDto)
  });
  const result = await response.json();
  return result;
}

// Delete item from bundle
export async function deleteBundleItem(bundleItemId: number, token: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/Bundle/items/${bundleItemId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  const result = await response.json();
  return result;
}

// Update item quantity in bundle
export async function updateBundleItemQuantity(bundleItemId: number, quantity: number, token: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/Bundle/items/${bundleItemId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ quantity })
  });
  const result = await response.json();
  return result;
}
