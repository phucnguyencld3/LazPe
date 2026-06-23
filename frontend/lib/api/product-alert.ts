import { API_BASE_URL } from "../api";

export interface CreateProductAlertDto {
  productId: number;
  variantId?: number;
  alertType: number; // 0: PriceDrop, 1: BackInStock
  targetPrice?: number;
}

export interface ProductAlertDto {
  id: number;
  userId: string;
  productId: number;
  productName: string;
  productImage?: string;
  variantId?: number;
  variantName?: string;
  alertType: number;
  targetPrice?: number;
  isActive: boolean;
  createdAt: string;
  lastNotifiedAt?: string;
  isConditionMet: boolean;
}

export async function subscribeAlert(dto: CreateProductAlertDto): Promise<{ success: boolean; message: string }> {
  try {
    const token = typeof window !== "undefined" ? (localStorage.getItem("token") || sessionStorage.getItem("token")) : null;
    if (!token) {
      return { success: false, message: "Vui lòng đăng nhập để đăng ký thông báo." };
    }

    const response = await fetch(`${API_BASE_URL}/ProductAlert/subscribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(dto),
    });

    const result = await response.json();
    if (!response.ok) {
      return { success: false, message: result.message || "Đăng ký thông báo thất bại." };
    }

    return { success: true, message: result.message || "Đăng ký nhận thông báo thành công." };
  } catch (error) {
    console.error("Error subscribing to alert:", error);
    return { success: false, message: "Đã xảy ra lỗi kết nối." };
  }
}

export async function unsubscribeAlert(id: number): Promise<{ success: boolean; message: string }> {
  try {
    const token = typeof window !== "undefined" ? (localStorage.getItem("token") || sessionStorage.getItem("token")) : null;
    if (!token) {
      return { success: false, message: "Vui lòng đăng nhập để thao tác." };
    }

    const response = await fetch(`${API_BASE_URL}/ProductAlert/unsubscribe/${id}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      },
    });

    const result = await response.json();
    if (!response.ok) {
      return { success: false, message: result.message || "Hủy đăng ký thất bại." };
    }

    return { success: true, message: result.message || "Hủy đăng ký thành công." };
  } catch (error) {
    console.error("Error unsubscribing to alert:", error);
    return { success: false, message: "Đã xảy ra lỗi kết nối." };
  }
}

export async function getMyAlerts(): Promise<ProductAlertDto[] | null> {
  try {
    const token = typeof window !== "undefined" ? (localStorage.getItem("token") || sessionStorage.getItem("token")) : null;
    if (!token) return null;

    const response = await fetch(`${API_BASE_URL}/ProductAlert/my-alerts`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      },
    });

    if (!response.ok) return null;

    return await response.json();
  } catch (error) {
    console.error("Error fetching my alerts:", error);
    return null;
  }
}
