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
  stock?: number;
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

// Helper to parse response safely and return readable error message
async function parseApiResponse(response: Response, defaultErrorMsg: string): Promise<any> {
  if (response.status === 403) {
    return { success: false, message: "Bạn không có quyền thực hiện thao tác này (403 Forbidden)." };
  }
  if (response.status === 401) {
    return { success: false, message: "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại (401 Unauthorized)." };
  }
  const text = await response.text();
  if (!text) {
    return { success: response.ok, message: response.ok ? "Thành công" : `${defaultErrorMsg} (Mã HTTP: ${response.status})` };
  }
  try {
    const json = JSON.parse(text);
    if (!response.ok) {
      return { success: false, message: json.message || `${defaultErrorMsg} (Mã HTTP: ${response.status})` };
    }
    return json;
  } catch {
    return { success: response.ok, message: response.ok ? "Thành công" : `${defaultErrorMsg} (${response.status})` };
  }
}

// Fetch all bundles
export async function getBundles(token: string): Promise<BundleResponse[]> {
  const response = await fetch(`${API_BASE_URL}/Bundle`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (response.status === 403) throw new Error("Bạn không có quyền xem danh sách Combo (403 Forbidden).");
  if (response.status === 401) throw new Error("Phiên làm việc đã hết hạn, vui lòng đăng nhập lại.");
  if (!response.ok) {
    const text = await response.text();
    try {
      const errJson = JSON.parse(text);
      throw new Error(errJson.message || "Không thể tải danh sách Combo sản phẩm");
    } catch {
      throw new Error("Không thể tải danh sách Combo sản phẩm");
    }
  }
  const result = await response.json();
  return result.data || [];
}

// Fetch single bundle with items (Admin)
export async function getBundleDetail(id: number, token: string): Promise<BundleResponse> {
  const response = await fetch(`${API_BASE_URL}/Bundle/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (response.status === 403) throw new Error("Bạn không có quyền xem chi tiết Combo (403 Forbidden).");
  if (response.status === 401) throw new Error("Phiên làm việc đã hết hạn, vui lòng đăng nhập lại.");
  if (!response.ok) {
    const text = await response.text();
    try {
      const errJson = JSON.parse(text);
      throw new Error(errJson.message || "Không thể tải chi tiết Combo sản phẩm");
    } catch {
      throw new Error("Không thể tải chi tiết Combo sản phẩm");
    }
  }
  const result = await response.json();
  return result.data;
}

// Fetch single bundle with items (Public)
export async function getPublicBundleDetail(id: number): Promise<BundleResponse> {
  const response = await fetch(`${API_BASE_URL}/Bundle/public/${id}`);
  if (!response.ok) throw new Error("Failed to fetch public bundle detail");
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
  return await parseApiResponse(response, "Không thể tạo mới Combo");
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
  return await parseApiResponse(response, "Không thể cập nhật Combo");
}

// Delete bundle
export async function deleteBundle(id: number, token: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/Bundle/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  return await parseApiResponse(response, "Không thể xóa Combo");
}

// Toggle bundle status
export async function toggleBundleStatus(id: number, token: string): Promise<{ success: boolean; message: string; data?: any }> {
  const response = await fetch(`${API_BASE_URL}/Bundle/${id}/toggle-status`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  });
  return await parseApiResponse(response, "Không thể thay đổi trạng thái Combo");
}

// Upload bundle image
export async function uploadBundleImage(file: File, token: string, oldImageUrl?: string): Promise<{ success: boolean; data?: string; message?: string }> {
  const formData = new FormData();
  formData.append("file", file);
  if (oldImageUrl) {
    formData.append("oldImageUrl", oldImageUrl);
  }
  const response = await fetch(`${API_BASE_URL}/Bundle/upload-image`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  });
  return await parseApiResponse(response, "Không thể tải ảnh Combo lên");
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
  return await parseApiResponse(response, "Không thể thêm sản phẩm vào Combo");
}

// Delete item from bundle
export async function deleteBundleItem(bundleItemId: number, token: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/Bundle/items/${bundleItemId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  return await parseApiResponse(response, "Không thể xóa sản phẩm khỏi Combo");
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
  return await parseApiResponse(response, "Không thể cập nhật số lượng sản phẩm");
}

export async function exportCombosExcel(
  token: string,
  searchTerm: string = "",
  status: boolean | null = null
): Promise<Blob> {
  const params = new URLSearchParams({
    searchTerm: searchTerm
  });
  if (status !== null) {
    params.append("status", status.toString());
  }

  const res = await fetch(`${API_BASE_URL}/Bundle/export-excel?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (res.status === 403) throw new Error("Bạn không có quyền xuất danh sách Combo ra Excel (403 Forbidden).");
  if (!res.ok) throw new Error("Không thể xuất file Excel danh sách Combo");
  return res.blob();
}
