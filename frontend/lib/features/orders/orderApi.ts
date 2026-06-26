// orderHelpers.ts

export interface OrderInfo {
  invoiceID: number;
  invoiceCode?: string;
  trackingCode?: string;
  userID: string;
  userName: string | null;
  userFullName: string | null;
  userEmail: string | null;
  userPhone: string | null;
  subTotal: number;
  discountAmount: number;
  voucherDiscountAmount?: number;
  pointsDiscountAmount?: number;
  coinsDiscountAmount?: number;
  walletDiscountAmount?: number;
  totalPrice: number;
  shippingFee: number;
  shippingAddress: string | null;
  payMethod: string;
  payMethodCode: number;
  status: string;
  statusCode: number;
  createdAt: string;
  completedAt?: string;
  cancelReason?: string;
  cancelledAt?: string;
  returnReason?: string;
  returnDescription?: string;
  returnImageUrls?: string;
  refundMethod?: number;
  hasVoucher: boolean;
  voucherCode: string | null;
  voucherName: string | null;
  itemCount: number;
  userAvatar?: string | null;
  paymentTransactions?: any[];
  invoiceDetails?: any[];
  shippingDiscountAmount?: number;
  hasShippingVoucher?: boolean;
  shippingVoucherCode?: string | null;
  shippingVoucherName?: string | null;
  printTicketUrl?: string | null;
}

import { formatCurrency, formatDateTime } from "@/lib/utils/formatters";

export { formatCurrency, formatDateTime };

export const getStatusBadgeColor = (statusCode: number) => {
  switch (statusCode) {
    case 0:
      return 'bg-amber-50 text-amber-600 border border-amber-100'; // Pending
    case 1:
      return 'bg-blue-50 text-blue-600 border border-blue-100'; // Confirmed
    case 2:
      return 'bg-purple-50 text-purple-600 border border-purple-100'; // Shipping
    case 3:
      return 'bg-emerald-50 text-emerald-600 border border-emerald-100'; // Completed
    case 4:
      return 'bg-rose-50 text-rose-600 border border-rose-100'; // Chờ duyệt hủy
    case 5:
      return 'bg-red-50 text-red-600 border border-red-100'; // Cancelled
    case 6:
      return 'bg-orange-50 text-orange-600 border border-orange-100'; // ReturnRequested
    case 7:
      return 'bg-pink-50 text-pink-600 border border-pink-100'; // Returned
    case 8:
      return 'bg-red-50 text-red-700 border border-red-200'; // CancelledRefunded
    default:
      return 'bg-slate-50 text-slate-600 border border-slate-100';
  }
};

export const getStatusLabel = (statusCode: number) => {
  switch (statusCode) {
    case 0: return 'Chờ xử lý';
    case 1: return 'Đã xác nhận';
    case 2: return 'Đang giao';
    case 3: return 'Hoàn tất';
    case 4: return 'Chờ duyệt hủy';
    case 5: return 'Đã hủy';
    case 6: return 'Yêu cầu trả hàng';
    case 7: return 'Đã hoàn tiền';
    case 8: return 'Đã hủy & hoàn tiền';
    default: return 'Không rõ';
  }
};

// API calls
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5101/api";

export const resolveApiUrl = (url: string | null | undefined) => {
  if (!url) return "#";
  if (url.startsWith("http")) return url;
  // Xóa chữ "/api" ở cuối API_BASE_URL để có domain gốc
  const baseDomain = API_BASE_URL.replace(/\/api\/?$/, "");
  return `${baseDomain}${url.startsWith("/") ? "" : "/"}${url}`;
};

export const fetchOrdersPaginated = async (
  token: string,
  page: number = 1,
  pageSize: number = 10,
  search?: string,
  status?: number | null,
  sortBy: string = 'created',
  desc: boolean = true,
  minPrice?: number | null,
  maxPrice?: number | null,
  dateRange?: string
): Promise<{ items: OrderInfo[]; totalCount: number }> => {
  let url = `${API_BASE_URL}/Invoice/search?page=${page}&pageSize=${pageSize}&sortBy=${sortBy}&desc=${desc}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  if (status !== undefined && status !== null) url += `&status=${status}`;
  if (minPrice !== undefined && minPrice !== null) url += `&minPrice=${minPrice}`;
  if (maxPrice !== undefined && maxPrice !== null) url += `&maxPrice=${maxPrice}`;
  if (dateRange) url += `&dateRange=${encodeURIComponent(dateRange)}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  });
  if (!res.ok) throw new Error("Failed to fetch paginated orders");
  const data = await res.json();
  return {
    items: data.items,
    totalCount: data.totalCount
  };
};

export const fetchOrderMetrics = async (token: string): Promise<any> => {
  const res = await fetch(`${API_BASE_URL}/Invoice/metrics`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  });
  if (!res.ok) throw new Error("Failed to fetch order metrics");
  return res.json();
};

export const fetchOrders = async (token: string): Promise<OrderInfo[]> => {
  const res = await fetch(`${API_BASE_URL}/Invoice`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  });
  if (!res.ok) throw new Error("Failed to fetch orders");
  return res.json();
};

export const fetchOrderDetails = async (token: string, id: string): Promise<OrderInfo> => {
  const res = await fetch(`${API_BASE_URL}/Invoice/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  });
  if (!res.ok) throw new Error("Failed to fetch order details");
  const data = await res.json();
  return data.data || data; // Assuming it might wrap in { success: true, data: ... }
};

export const cancelOrder = async (token: string, id: string, reason: string): Promise<any> => {
  const res = await fetch(`${API_BASE_URL}/Invoice/${id}/admin-cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ reason })
  });
  return res.json();
};

export const requestCancelOrder = async (token: string, id: string, reason: string): Promise<any> => {
  const res = await fetch(`${API_BASE_URL}/Invoice/${id}/request-cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ reason })
  });
  return res.json();
};

export const uploadPrintTicketPdf = async (token: string, id: string, file: File): Promise<any> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const res = await fetch(`${API_BASE_URL}/Invoice/${id}/upload-pdf`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData
  });
  
  if (!res.ok) {
    let errorText = "";
    try {
      const errJson = await res.json();
      errorText = errJson.message || JSON.stringify(errJson);
    } catch {
      errorText = await res.text();
    }
    throw new Error(`Lỗi server (${res.status}): ${errorText}`);
  }
  
  return res.json();
};

export const updateOrderStatus = async (token: string, id: string, actionUrl: string): Promise<any> => {
  // actionUrl e.g. "confirm", "mark-shipped", "mark-completed"
  const res = await fetch(`${API_BASE_URL}/Invoice/${id}/${actionUrl}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return res.json();
};

export const bulkConfirmOrders = async (token: string, invoiceIds: number[]): Promise<any> => {
  const res = await fetch(`${API_BASE_URL}/Invoice/bulk-confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ invoiceIds })
  });
  return res.json();
};

export const bulkMarkShippedOrders = async (token: string, invoiceIds: number[]): Promise<any> => {
  const res = await fetch(`${API_BASE_URL}/Invoice/bulk-mark-shipped`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ invoiceIds })
  });
  return res.json();
};

export const exportOrdersToExcel = async (
  token: string,
  search?: string,
  status?: number | null,
  sortBy?: string,
  desc?: boolean,
  minPrice?: number | null,
  maxPrice?: number | null,
  dateRange?: any
): Promise<Blob> => {
  const queryParams = new URLSearchParams();
  if (search) queryParams.append('search', search);
  if (status !== undefined && status !== null) queryParams.append('status', status.toString());
  if (sortBy) queryParams.append('sortBy', sortBy);
  if (desc !== undefined) queryParams.append('desc', desc.toString());
  if (minPrice !== undefined && minPrice !== null) queryParams.append('minPrice', minPrice.toString());
  if (maxPrice !== undefined && maxPrice !== null) queryParams.append('maxPrice', maxPrice.toString());
  if (dateRange?.from) queryParams.append('startDate', dateRange.from.toISOString());
  if (dateRange?.to) queryParams.append('endDate', dateRange.to.toISOString());

  const response = await fetch(`${API_BASE_URL}/AdminInvoice/export?${queryParams.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to export orders');
  }

  return await response.blob();
};

export const requestReturnOrder = async (token: string, id: string, reason: string, imageUrls: string, refundMethod: number): Promise<any> => {
  const res = await fetch(`${API_BASE_URL}/Invoice/${id}/request-return`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ reason, imageUrls, refundMethod })
  });
  return res.json();
};

export const approveReturnOrder = async (token: string, id: string, isRefundToCoins: boolean): Promise<any> => {
  const res = await fetch(`${API_BASE_URL}/Invoice/${id}/approve-return`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ isRefundToCoins })
  });
  return res.json();
};

export const confirmReturnReceived = async (token: string, id: string): Promise<any> => {
  const res = await fetch(`${API_BASE_URL}/Invoice/${id}/confirm-return-received`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return res.json();
};
