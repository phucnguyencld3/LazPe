// orderHelpers.ts

export interface OrderInfo {
  invoiceID: number;
  userID: string;
  userName: string | null;
  userFullName: string | null;
  userEmail: string | null;
  userPhone: string | null;
  subTotal: number;
  discountAmount: number;
  totalPrice: number;
  shippingFee: number;
  shippingAddress: string | null;
  payMethod: string;
  payMethodCode: number;
  status: string;
  statusCode: number;
  createdAt: string;
  hasVoucher: boolean;
  voucherCode: string | null;
  voucherName: string | null;
  itemCount: number;
  invoiceDetails?: any[];
}

import { formatCurrency, formatDateTime } from "@/lib/utils/formatters";

export { formatCurrency, formatDateTime };

export const getStatusBadgeColor = (statusCode: number) => {
  // 0: Pending, 1: Confirmed, 2: Shipping, 3: Delivered, 4: Cancelled (just guessing standard flow)
  // We map them based on the response structure
  switch (statusCode) {
    case 0:
      return 'bg-amber-50 text-amber-600 border border-amber-100'; // Pending
    case 1:
      return 'bg-blue-50 text-blue-600 border border-blue-100'; // Confirmed
    case 2:
      return 'bg-purple-50 text-purple-600 border border-purple-100'; // Shipping
    case 3:
      return 'bg-emerald-50 text-emerald-600 border border-emerald-100'; // Delivered / Received
    case 4:
      return 'bg-green-50 text-green-600 border border-green-100'; // Completed
    case 5:
      return 'bg-red-50 text-red-600 border border-red-100'; // Cancelled
    default:
      return 'bg-slate-50 text-slate-600 border border-slate-100';
  }
};

export const getStatusLabel = (statusCode: number) => {
  switch (statusCode) {
    case 0: return 'Chờ xử lý';
    case 1: return 'Đã xác nhận';
    case 2: return 'Đang giao';
    case 3: return 'Đã giao / Nhận';
    case 4: return 'Đã hoàn thành';
    case 5: return 'Đã hủy';
    default: return 'Không rõ';
  }
};

// API calls
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5101/api";

export const fetchOrders = async (token: string): Promise<OrderInfo[]> => {
  const res = await fetch(`${API_BASE_URL}/Invoice`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Failed to fetch orders");
  return res.json();
};

export const fetchOrderDetails = async (token: string, id: string): Promise<OrderInfo> => {
  const res = await fetch(`${API_BASE_URL}/Invoice/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
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
