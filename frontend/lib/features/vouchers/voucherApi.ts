export interface VoucherAdminInfo {
  voucherID: number;
  code: string;
  name: string;
  discountType: number; // 1: %, 2: Tiền cố định
  discountValue: number;
  minOrderValue: number;
  maxDiscount: number;
  startDate: string;
  endDate: string;
  totalQuantity: number;
  usedQuantity: number;
  status: boolean;
  visibilityType: number; // 1: Public, 2: Exclusive
  exclusiveType: number; // 0: None, 1: ManualCode, 2: DirectAssign
}

export interface CreateVoucherPayload {
  code: string;
  name: string;
  discountType: number;
  discountValue: number;
  minOrderValue: number;
  maxDiscount: number;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  totalQuantity: number;
  status: boolean;
  visibilityType: number;
  exclusiveType: number;
}

export interface UpdateVoucherPayload {
  name: string;
  discountType: number;
  discountValue: number;
  minOrderValue: number;
  maxDiscount: number;
  startDate: string;
  endDate: string;
  totalQuantity: number;
  status: boolean;
  visibilityType: number;
  exclusiveType: number;
}

export interface VoucherUsageInfo {
  voucherID: number;
  userID: string;
  userFullName: string;
  userEmail: string;
  invoiceID: number;
  invoiceStatus: string | null;
  discountAmount: number;
  orderValue: number;
  usedAt: string;
}

export interface VoucherUsagesResponse {
  voucher: {
    voucherID: number;
    code: string;
    name: string;
    discountType: number;
    discountValue: number;
    minOrderValue: number;
    maxDiscount: number;
    totalQuantity: number;
    usedQuantity: number;
    status: boolean;
    startDate: string;
    endDate: string;
  };
  usages: VoucherUsageInfo[];
  totalUsages: number;
  totalDiscountGiven: number;
}

export interface SearchUserResult {
  id: string;
  fullName: string | null;
  email: string | null;
  phoneNumber: string | null;
}

export interface DirectAssignmentInfo {
  userVoucherID: number;
  userID: string;
  userFullName: string;
  userEmail: string;
  userPhone: string;
  status: string; // e.g. "Unused", "Used", "Expired"
  collectedAt: string;
  usedAt: string | null;
}

export interface DirectAssignmentsResponse {
  data: DirectAssignmentInfo[];
  remainingQuota: number;
  totalAssigned: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5101/api";

// Fetch all vouchers
export const fetchAllVouchers = async (token: string): Promise<VoucherAdminInfo[]> => {
  const res = await fetch(`${API_BASE_URL}/Vouchers`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Không thể tải danh sách voucher.");
  return res.json();
};

// Fetch single voucher details
export const fetchVoucherById = async (token: string, id: number): Promise<VoucherAdminInfo> => {
  const res = await fetch(`${API_BASE_URL}/Vouchers/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Không thể tải thông tin chi tiết voucher.");
  return res.json();
};

// Create a new voucher
export const createVoucher = async (token: string, payload: CreateVoucherPayload): Promise<{ voucher: VoucherAdminInfo; autoAssignedCount: number; message: string }> => {
  const res = await fetch(`${API_BASE_URL}/Vouchers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Tạo voucher thất bại.");
  }
  return res.json();
};

// Update an existing voucher
export const updateVoucher = async (token: string, id: number, payload: UpdateVoucherPayload): Promise<{ voucher: VoucherAdminInfo; autoAssignedCount: number; message: string }> => {
  const res = await fetch(`${API_BASE_URL}/Vouchers/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Cập nhật voucher thất bại.");
  }
  return res.json();
};

// Delete a voucher (only succeeds if usedQuantity === 0)
export const deleteVoucher = async (token: string, id: number): Promise<boolean> => {
  const res = await fetch(`${API_BASE_URL}/Vouchers/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Xóa voucher thất bại.");
  }
  return true;
};

// Toggle status of a voucher
export const toggleVoucherStatus = async (token: string, id: number): Promise<{ voucherID: number; status: boolean; message: string }> => {
  const res = await fetch(`${API_BASE_URL}/Vouchers/${id}/toggle-status`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Thay đổi trạng thái voucher thất bại.");
  }
  return res.json();
};

// Auto generate a unique voucher code
export const generateVoucherCode = async (token: string): Promise<{ code: string }> => {
  const res = await fetch(`${API_BASE_URL}/Vouchers/generate-code`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Không thể sinh mã voucher tự động.");
  return res.json();
};

// Get voucher usage history
export const fetchVoucherUsages = async (token: string, id: number): Promise<VoucherUsagesResponse> => {
  const res = await fetch(`${API_BASE_URL}/Vouchers/${id}/usages`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Không thể tải lịch sử sử dụng của voucher.");
  return res.json();
};

// Search users by keyword (fullname, email, phone, id) for assignments
export const searchUsers = async (token: string, keyword: string): Promise<SearchUserResult[]> => {
  const res = await fetch(`${API_BASE_URL}/Vouchers/search-users?keyword=${encodeURIComponent(keyword)}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Tìm kiếm người dùng thất bại.");
  return res.json();
};

// Direct distribution of exclusive direct assignment vouchers
export const assignVoucherDirect = async (
  token: string,
  payload: { voucherID: number; userIDs: string[] }
): Promise<{
  message: string;
  assignedCount: number;
  assignedUserIds: string[];
  skippedCount: number;
  invalidCount: number;
  remainingQuota: number;
}> => {
  const res = await fetch(`${API_BASE_URL}/Vouchers/assign-direct`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Phân phối voucher thất bại.");
  }
  return res.json();
};

// Fetch direct assignment records for a voucher
export const fetchDirectAssignments = async (token: string, id: number): Promise<DirectAssignmentsResponse> => {
  const res = await fetch(`${API_BASE_URL}/Vouchers/${id}/direct-assignments`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Không thể tải danh sách phân phối trực tiếp.");
  return res.json();
};

// Revoke a direct assignment from a user's wallet
export const revokeDirectAssignment = async (
  token: string,
  userVoucherId: number
): Promise<{ message: string; voucherId: number; remainingQuota: number }> => {
  const res = await fetch(`${API_BASE_URL}/Vouchers/direct-assignments/${userVoucherId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Thu hồi voucher thất bại.");
  }
  return res.json();
};
