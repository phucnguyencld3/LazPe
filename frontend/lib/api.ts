import { Product, Category, ApiResponse, PaginatedResponse, Voucher, FlashSaleCampaign } from "@/types";

let apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5101/api";
if (process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.endsWith('/api')) {
  apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api`;
}
export const API_BASE_URL = apiUrl;

// Patch global fetch to handle 429 globally and safely return JSON to prevent crashes
if (typeof globalThis !== 'undefined' && !(globalThis as any).__fetchPatched) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    try {
      const response = await originalFetch(input, init);
      if (response.status === 429) {
        if (typeof window !== 'undefined') {
          import('@/lib/toast').then(({ toast }) => {
            toast.error('Hệ thống đang xử lý quá nhiều yêu cầu. Vui lòng thao tác chậm lại!');
          });
        }
        return new Response(JSON.stringify({
          success: false,
          message: 'Hệ thống đang xử lý quá nhiều yêu cầu. Vui lòng thao tác chậm lại!',
          data: null
        }), {
          status: 429,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return response;
    } catch (error) {
      throw error;
    }
  };
  (globalThis as any).__fetchPatched = true;
}

export async function getRecommendations(limit: number = 24): Promise<Product[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/Recommendation/for-you?limit=${limit}`, { cache: 'no-store' });
    if (!response.ok) return [];
    const json = await response.json();
    if (json.success && json.data) {
      return json.data.map((item: any) => ({
        id: item.productId,
        name: item.productName,
        price: item.price,
        discountPrice: item.discountPrice,
        image: item.imageUrl,
        categoryId: 0,
        inStock: true,
        rating: item.rating,
        ratingCount: item.reviewsCount
      }));
    }
    return [];
  } catch (error) {
    console.error("Failed to fetch recommendations:", error);
    return [];
  }
}

export async function getBundlesAsProducts(): Promise<Product[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/Bundle/public`, { cache: 'no-store' });
    if (!response.ok) return [];
    const json = await response.json();
    if (json.success && json.data) {
      return json.data.map((item: any) => ({
        id: item.bundleID,
        name: "[Combo] " + item.name,
        description: item.description ?? "",
        price: item.originalPrice > 0 ? item.originalPrice : item.price,
        discountPrice: item.originalPrice > 0 ? item.price : undefined,
        image: item.imageUrl,
        categoryId: 0,
        inStock: true,
        quantity: item.stock ?? 10,
        isBundle: true,
      }));
    }
    return [];
  } catch (error) {
    console.error("Failed to fetch bundles:", error);
    return [];
  }
}

export async function getProducts(
  page: number = 1,
  pageSize: number = 12,
  searchTerm: string = "",
  categoryId?: number,
  sortBy: string = "CreatedAt",
  sortDirection: string = "desc",
  hasDiscount?: boolean
): Promise<PaginatedResponse<Product> | null> {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      searchTerm,
      sortBy,
      sortDirection,
    });

    if (categoryId) {
      params.append("categoryId", categoryId.toString());
    }
    
    if (hasDiscount) {
      params.append("hasDiscount", "true");
    }

    const response = await fetch(`${API_BASE_URL}/product/shop?${params.toString()}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch products:", response.statusText);
      return null;
    }

    const result: ApiResponse<any> = await response.json();
    if (result.success && result.data) {
      const data = result.data;
      const productsList = data.products || data.items || [];
      return {
        items: productsList.map((item: any) => ({
          id: item.productID ?? item.productId ?? item.id,
          name: item.productName ?? item.name,
          description: item.description ?? "",
          price: item.price ?? 0,
          discountPrice: item.minEffectivePrice ?? (item.productDiscountPercent > 0 ? (item.price * (1 - item.productDiscountPercent / 100)) : undefined),
          minPrice: item.minPrice,
          maxPrice: item.maxPrice,
          minEffectivePrice: item.minEffectivePrice,
          maxEffectivePrice: item.maxEffectivePrice,
          variantCount: item.variantCount,
          image: item.imageUrl ?? item.image ?? "",
          categoryId: item.categoryID ?? item.categoryId,
          categoryName: item.categoryName,
          inStock: item.status !== false && (item.totalStock ?? item.stock ?? 0) > 0,
          quantity: item.totalStock ?? item.stock ?? 0,
          rating: item.rating,
          ratingCount: item.ratingCount,
          specifications: item.specifications,
        })),
        totalItems: data.totalItems ?? 0,
        totalPages: data.totalPages ?? 0,
        currentPage: data.currentPage ?? 1,
        pageSize: data.pageSize ?? 12,
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching products:", error);
    return null;
  }
}

export async function getCurrentFlashSales(): Promise<FlashSaleCampaign[] | null> {
  try {
    const token = typeof window !== "undefined" ? (localStorage.getItem("token") || sessionStorage.getItem("token")) : null;
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/FlashSale/current`, {
      method: "GET",
      headers,
      next: { revalidate: 0 } // Cache for 0 seconds because it depends on the user
    });

    if (!response.ok) {
      console.error("Failed to fetch flash sales:", response.statusText);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching flash sales:", error);
    return null;
  }
}


export async function getProductDetail(id: number): Promise<Product | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/product/shop/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch product detail:", response.statusText);
      return null;
    }

    const result: ApiResponse<any> = await response.json();
    if (result.success && result.data) {
      const item = result.data;
      const variants = item.variants ?? [];

      // Calculate total stock from variants if variants exist, otherwise use parent stock
      const totalStock = variants.reduce((sum: number, v: any) => sum + (v.stock ?? 0), 0);
      const parentStock = item.stock ?? 0;
      const finalStock = variants.length > 0 ? totalStock : parentStock;

      // Fallback to first variant image if parent image is empty
      const firstVariantImage = variants.find((v: any) => v.imageUrl)?.imageUrl;
      const finalImage = item.imageUrl ?? item.image ?? firstVariantImage ?? "";

      const activeVariants = variants.filter((v: any) => v.status !== false);
      const minPrice = activeVariants.length > 0 ? Math.min(...activeVariants.map((v: any) => v.unitPrice ?? 0)) : (item.price ?? 0);
      const maxPrice = activeVariants.length > 0 ? Math.max(...activeVariants.map((v: any) => v.unitPrice ?? 0)) : (item.price ?? 0);
      const minEffectivePrice = activeVariants.length > 0
        ? Math.min(...activeVariants.map((v: any) => v.finalPrice ?? v.unitPrice ?? 0))
        : (item.productDiscountPercent > 0 ? (item.price * (1 - item.productDiscountPercent / 100)) : undefined);
      const maxEffectivePrice = activeVariants.length > 0
        ? Math.max(...activeVariants.map((v: any) => v.finalPrice ?? v.unitPrice ?? 0))
        : (item.productDiscountPercent > 0 ? (item.price * (1 - item.productDiscountPercent / 100)) : undefined);
      const variantCount = variants.length;

      return {
        id: item.productID ?? item.productId ?? item.id,
        name: item.productName ?? item.name,
        description: item.description ?? "",
        price: item.price ?? 0,
        discountPrice: item.productDiscountPercent > 0 ? (item.price * (1 - item.productDiscountPercent / 100)) : undefined,
        minPrice,
        maxPrice,
        minEffectivePrice,
        maxEffectivePrice,
        variantCount,
        image: finalImage,
        imageUrls: item.imageUrls,
        categoryId: item.categoryID ?? item.categoryId,
        categoryName: item.category?.categoryName,
        inStock: item.status !== false && finalStock > 0,
        quantity: finalStock,
        rating: item.rating,
        ratingCount: item.ratingCount,
        variants: variants,
        productOptions: item.productOptions ?? [],
        specifications: item.specifications,
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching product detail:", error);
    return null;
  }
}

export async function getCategories(): Promise<Category[] | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/product/shop/categories`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch categories:", response.statusText);
      return null;
    }

    const result: ApiResponse<any[]> = await response.json();
    if (result.success && result.data) {
      return result.data.map((item: any) => ({
        id: item.categoryID ?? item.categoryId ?? item.id,
        name: item.categoryName ?? item.name,
        description: item.description ?? "",
        image: item.image ?? "",
        parentId: item.parentID ?? item.parentId ?? null,
        level: item.level ?? 0,
        productCount: item.productCount ?? 0,
      }));
    }
    return null;
  } catch (error) {
    console.error("Error fetching categories:", error);
    return null;
  }
}

export async function getPublicVouchers(): Promise<Voucher[] | null> {
  try {
    const token = typeof window !== "undefined" ? (localStorage.getItem("token") || sessionStorage.getItem("token")) : null;
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/vouchers/public`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      console.error("Failed to fetch public vouchers:", response.statusText);
      return null;
    }

    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error("Error fetching public vouchers:", error);
    return null;
  }
}

// Lấy danh sách Voucher của người dùng
export async function getCheckoutAvailableVouchers(token: string): Promise<UserWalletVoucher[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/Vouchers/wallet/checkout-available`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
    });

    if (!response.ok) {
      console.warn("Failed to fetch checkout available vouchers:", response.statusText);
      return [];
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching checkout available vouchers:", error);
    return [];
  }
}

// ==========================================
// WITHDRAW & BALANCE APIs
// ==========================================

export interface WithdrawRequest {
  requestID: number;
  userID: string;
  amount: number;
  bankName: string;
  bankAccount: string;
  bankOwnerName: string;
  status: string;
  adminNote?: string;
  createdAt: string;
  processedAt?: string;
  user?: {
    fullName: string;
    email: string;
  };
}

export interface BalanceTransaction {
  transactionID: number;
  userID: string;
  invoiceID?: number;
  amount: number;
  direction: number; // 1 = Credit (Cộng), 2 = Debit (Trừ)
  sourceType: number; // 1 = SystemWallet, 2 = LazPeCoins
  reason?: string;
  idempotencyKey?: string;
  createdAt: string;
}

export async function createWithdrawRequest(
  data: { amount: number; bankName: string; bankAccount: string; bankOwnerName: string },
  token: string
) {
  const response = await fetch(`${API_BASE_URL}/Withdraw`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Không thể tạo yêu cầu rút tiền.");
  }
  return await response.json();
}

export async function getMyWithdrawRequests(token: string): Promise<WithdrawRequest[]> {
  const response = await fetch(`${API_BASE_URL}/Withdraw`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!response.ok) return [];
  return await response.json();
}

export async function getBalanceHistory(token: string): Promise<BalanceTransaction[]> {
  const response = await fetch(`${API_BASE_URL}/Withdraw/balance-history`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!response.ok) return [];
  return await response.json();
}

export async function getAllWithdrawRequests(token: string, status?: string): Promise<WithdrawRequest[]> {
  let url = `${API_BASE_URL}/Withdraw/admin/all`;
  if (status) {
    url += `?status=${status}`;
  }
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!response.ok) return [];
  return await response.json();
}

export async function processWithdrawRequest(
  id: number,
  data: { isApproved: boolean; adminNote: string },
  token: string
) {
  const response = await fetch(`${API_BASE_URL}/Withdraw/admin/process/${id}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Lỗi xử lý rút tiền");
  }
  return await response.json();
}

export async function collectVoucher(id: number): Promise<{ success: boolean; message: string }> {
  try {
    const token = typeof window !== "undefined" ? (localStorage.getItem("token") || sessionStorage.getItem("token")) : null;
    if (!token) {
      return { success: false, message: "Vui lòng đăng nhập để lưu voucher." };
    }

    const response = await fetch(`${API_BASE_URL}/vouchers/${id}/collect`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    const result = await response.json();
    if (response.ok) {
      return { success: true, message: result.message || "Lưu voucher thành công." };
    }
    return { success: false, message: result.message || "Lưu voucher thất bại." };
  } catch (error) {
    console.error("Error collecting voucher:", error);
    return { success: false, message: "Đã xảy ra lỗi kết nối." };
  }
}

// USER PROFILE APIs

export interface UserProfile {
  userId: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  avatar?: string;
  registerDate: string;
  emailConfirmed: boolean;
  status: boolean;
  isOnboarded?: boolean;
  babyProfiles?: BabyProfileDto[];
}

export async function getUserProfile(userId: string, token: string): Promise<UserProfile | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/ProfileApi/${userId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch user profile:", response.statusText);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}

export async function updateUserProfile(
  userId: string,
  token: string,
  profileData: {
    fullName: string;
    email: string;
    phoneNumber?: string;
    dateOfBirth?: string | null;
    avatar?: string;
    isOnboarded?: boolean;
  }
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/ProfileApi/update?userId=${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    });

    const result = await response.json();
    return {
      success: response.ok && result.success,
      message: result.message,
    };
  } catch (error) {
    console.error("Error updating user profile:", error);
    return { success: false, message: "Lỗi kết nối đến server" };
  }
}

export async function checkHasPassword(userId: string, token: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/ProfileApi/has-password?userId=${userId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });
    const text = await response.text();
    if (!text) return true;
    
    const result = JSON.parse(text);
    if (response.ok && result.success) {
      return result.hasPassword;
    }
    return true; // Default to true to prevent accidentally showing set password
  } catch (error) {
    console.error("Error checking password status:", error);
    return true;
  }
}

export async function setPassword(
  userId: string,
  token: string,
  passwordData: any
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/ProfileApi/set-password?userId=${userId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(passwordData),
    });

    const text = await response.text();
    if (!text) return { success: false, message: "Lỗi phản hồi từ server" };

    const result = JSON.parse(text);
    if (response.ok && result.success) {
      return { success: true };
    }
    return { success: false, message: result.message || "Thiết lập mật khẩu thất bại" };
  } catch (error) {
    console.error("Error setting password:", error);
    return { success: false, message: "Lỗi kết nối đến server" };
  }
}

export async function changePassword(
  userId: string,
  token: string,
  passwordData: any
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/ProfileApi/change-password?userId=${userId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(passwordData),
    });

    const result = await response.json();
    return {
      success: response.ok && result.success,
      message: result.message,
    };
  } catch (error) {
    console.error("Error changing password:", error);
    return { success: false, message: "Lỗi kết nối đến server" };
  }
}

export async function uploadAvatar(
  userId: string,
  token: string,
  file: File
): Promise<{ success: boolean; message?: string; data?: string }> {
  try {
    const formData = new FormData();
    formData.append("UserId", userId);
    formData.append("Avatar", file);

    const response = await fetch(`${API_BASE_URL}/ProfileApi/upload-avatar`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
      body: formData,
    });

    const result = await response.json();
    return {
      success: response.ok && result.success,
      message: result.message,
      data: result.data,
    };
  } catch (error) {
    console.error("Error uploading avatar:", error);
    return { success: false, message: "Lỗi kết nối đến server" };
  }
}

// 2FA (TWO-FACTOR AUTHENTICATION) APIs

export interface TwoFaStatusResponse {
  success: boolean;
  isEnabled: boolean;
  providers: string[];
  message?: string;
}

export async function get2FaStatus(token: string): Promise<TwoFaStatusResponse | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/Authentication/2fa-status`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error("Error getting 2FA status:", error);
    return null;
  }
}

export async function setupAuthenticator(token: string): Promise<{ success: boolean; sharedKey?: string; qrCodeUri?: string; message?: string } | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/Authentication/2fa-setup-authenticator`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error("Error setting up authenticator:", error);
    return null;
  }
}

export async function enableAuthenticator(token: string, code: string): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/Authentication/2fa-enable-authenticator`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ code }),
    });
    const result = await response.json();
    return {
      success: response.ok && result.success,
      message: result.message,
    };
  } catch (error) {
    console.error("Error enabling authenticator:", error);
    return { success: false, message: "Lỗi kết nối đến server" };
  }
}

export async function setupEmail2Fa(token: string): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/Authentication/2fa-setup-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });
    const result = await response.json();
    return {
      success: response.ok && result.success,
      message: result.message,
    };
  } catch (error) {
    console.error("Error setting up email 2FA:", error);
    return { success: false, message: "Lỗi kết nối đến server" };
  }
}

export async function enableEmail2Fa(token: string, code: string): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/Authentication/2fa-enable-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ code }),
    });
    const result = await response.json();
    return {
      success: response.ok && result.success,
      message: result.message,
    };
  } catch (error) {
    console.error("Error enabling email 2FA:", error);
    return { success: false, message: "Lỗi kết nối đến server" };
  }
}

export async function disable2Fa(token: string): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/Authentication/2fa-disable`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });
    const result = await response.json();
    return {
      success: response.ok && result.success,
      message: result.message,
    };
  } catch (error) {
    console.error("Error disabling 2FA:", error);
    return { success: false, message: "Lỗi kết nối đến server" };
  }
}

export async function send2FaLoginEmailOtp(userId: string): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/Authentication/2fa-send-email-login-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId }),
    });
    const result = await response.json();
    return {
      success: response.ok && result.success,
      message: result.message,
    };
  } catch (error) {
    console.error("Error sending 2FA login email OTP:", error);
    return { success: false, message: "Lỗi kết nối đến server" };
  }
}

export async function verify2FaLogin(
  userId: string,
  code: string,
  provider: string
): Promise<{ success: boolean; token?: string; user?: any; message?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/Authentication/2fa-verify-login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId, code, provider }),
    });
    const result = await response.json();
    return {
      success: response.ok && result.success,
      token: result.token,
      user: result.user,
      message: result.message,
    };
  } catch (error) {
    console.error("Error verifying 2FA login:", error);
    return { success: false, message: "Lỗi kết nối đến server" };
  }
}
// ADDRESS MANAGEMENT APIs

export interface AddressItem {
  addressID: number;
  recipientName: string;
  phoneNumber: string;
  province: string;
  provinceCode?: string;
  district: string;
  districtCode?: string;
  ward: string;
  wardCode?: string;
  detailAddress: string;
  isDefault: boolean;
  createdAt: string;
  apiVersion?: string;
}

export function normalizeName(name: string): string {
  if (!name) return "";
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/^(thanh pho|tinh|quan|huyen|thi xa|thi tran|phuong|xa)\s+/i, "")
    .replace(/\s+(thanh pho|tinh|quan|huyen|thi xa|thi tran|phuong|xa)$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function getUserAddresses(userId: string, token: string): Promise<AddressItem[] | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/Address/user/${userId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch user addresses:", response.statusText);
      return null;
    }

    const result = await response.json();
    if (result.success) {
      return result.data || [];
    }
    return null;
  } catch (error) {
    console.error("Error fetching user addresses:", error);
    return null;
  }
}

export async function getProvinces(version: string = "v2"): Promise<any[] | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/Address/provinces?version=${version}`, {
      method: "GET",
    });

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    if (result.success) {
      return result.data || [];
    }
    return null;
  } catch (error) {
    console.error("Error fetching provinces:", error);
    return null;
  }
}

export async function getDistricts(provinceCode: string | number, version: string = "v2"): Promise<any | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/Address/districts/${provinceCode}?version=${version}`, {
      method: "GET",
    });

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    if (result.success) {
      return result.data || null;
    }
    return null;
  } catch (error) {
    console.error("Error fetching districts:", error);
    return null;
  }
}

export async function getWards(districtCode: string | number, version: string = "v2"): Promise<any | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/Address/wards/${districtCode}?version=${version}`, {
      method: "GET",
    });

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    if (result.success) {
      return result.data || null;
    }
    return null;
  } catch (error) {
    console.error("Error fetching wards:", error);
    return null;
  }
}

export async function createAddress(token: string, addressData: any): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/Address/create-vietnam`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(addressData),
    });

    const result = await response.json();
    return {
      success: response.ok && result.success,
      message: result.message,
    };
  } catch (error) {
    console.error("Error creating address:", error);
    return { success: false, message: "Lỗi kết nối" };
  }
}

export async function updateAddress(
  addressId: number,
  token: string,
  addressData: any
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/Address/update/${addressId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(addressData),
    });

    const result = await response.json();
    return {
      success: response.ok && result.success,
      message: result.message,
    };
  } catch (error) {
    console.error("Error updating address:", error);
    return { success: false, message: "Lỗi kết nối" };
  }
}

export async function setDefaultAddress(addressId: number, token: string): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/Address/set-default/${addressId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    const result = await response.json();
    return {
      success: response.ok && result.success,
      message: result.message,
    };
  } catch (error) {
    console.error("Error setting default address:", error);
    return { success: false, message: "Lỗi kết nối" };
  }
}

export async function deleteAddress(addressId: number, token: string): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/Address/delete/${addressId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    const result = await response.json();
    return {
      success: response.ok && result.success,
      message: result.message,
    };
  } catch (error) {
    console.error("Error deleting address:", error);
    return { success: false, message: "Lỗi kết nối" };
  }
}

// CART APIs

export interface ProductCartInfo {
  productID: number;
  name: string;
  imageUrl?: string;
  slug?: string;
}

export interface VariantCartInfo {
  variantID: number;
  size?: string;
  color?: string;
  unitPrice: number;
  stock: number;
  imageUrl?: string;
}

export interface BundleCartInfo {
  bundleID: number;
  name: string;
  price: number;
  stock: number;
  imageUrl?: string;
}

export interface VoucherCartInfo {
  voucherID: number;
  code: string;
  name: string;
  description?: string;
  discountAmount: number;
  discountPercent: number;
  minOrderValue: number;
  maxDiscount: number;
  startDate: string;
  endDate: string;
  isPercentage: boolean;
  voucherType?: number;
  isFreeShipping?: boolean;
  maxShippingDiscount?: number | null;
}

export interface CartDetailInfo {
  cartDetailID: number;
  cartID: number;
  variantID?: number;
  bundleID?: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  isGift?: boolean;
  product?: ProductCartInfo | null;
  variant?: VariantCartInfo | null;
  bundle?: BundleCartInfo | null;
}

export interface CartInfo {
  cartID: number;
  userID: string;
  createdDate: string;
  subTotal: number;
  discountAmount: number;
  shippingDiscountAmount: number;
  totalAmount: number;
  voucher?: VoucherCartInfo | null;
  shippingVoucher?: VoucherCartInfo | null;
  cartDetails: CartDetailInfo[];
  totalItems: number;
}

export async function getCart(token: string): Promise<CartInfo | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/Cart`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch cart:", response.statusText);
      return null;
    }

    const result = await response.json();
    if (result.success) {
      return result.data;
    }
    return null;
  } catch (error) {
    console.error("Error fetching cart:", error);
    return null;
  }
}

export async function updateCartItem(
  token: string,
  data: { cartDetailID: number; quantity: number }
): Promise<{ success: boolean; message?: string; data?: CartInfo }> {
  try {
    const response = await fetch(`${API_BASE_URL}/Cart/update`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    return {
      success: response.ok && result.success,
      message: result.message,
      data: result.data,
    };
  } catch (error) {
    console.error("Error updating cart item:", error);
    return { success: false, message: "Lỗi kết nối" };
  }
}

export async function removeFromCart(
  token: string,
  cartDetailId: number
): Promise<{ success: boolean; message?: string; data?: CartInfo }> {
  try {
    const response = await fetch(`${API_BASE_URL}/Cart/remove/${cartDetailId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    const result = await response.json();
    return {
      success: response.ok && result.success,
      message: result.message,
      data: result.data,
    };
  } catch (error) {
    console.error("Error removing item from cart:", error);
    return { success: false, message: "Lỗi kết nối" };
  }
}

export async function clearCart(token: string): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/Cart/clear`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    const result = await response.json();
    return {
      success: response.ok && result.success,
      message: result.message,
    };
  } catch (error) {
    console.error("Error clearing cart:", error);
    return { success: false, message: "Lỗi kết nối" };
  }
}

export async function applyVoucherToCart(
  token: string,
  voucherCode: string
): Promise<{ success: boolean; message?: string; data?: CartInfo }> {
  try {
    const response = await fetch(`${API_BASE_URL}/Cart/apply-voucher`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ voucherCode }),
    });

    const result = await response.json();
    return {
      success: response.ok && result.success,
      message: result.message,
      data: result.data,
    };
  } catch (error) {
    console.error("Error applying voucher to cart:", error);
    return { success: false, message: "Lỗi kết nối" };
  }
}

export async function autoApplyVouchersToCart(
  token: string
): Promise<{ success: boolean; message?: string; data?: CartInfo; appliedCodes?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/Cart/auto-apply-vouchers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    const result = await response.json();
    return {
      success: response.ok && result.success,
      message: result.message,
      data: result.data,
      appliedCodes: result.appliedCodes,
    };
  } catch (error) {
    console.error("Error auto applying vouchers to cart:", error);
    return { success: false, message: "Lỗi kết nối" };
  }
}

export async function removeVoucherFromCart(
  token: string,
  type?: number
): Promise<{ success: boolean; message?: string; data?: CartInfo }> {
  try {
    const url = type 
      ? `${API_BASE_URL}/Cart/remove-voucher?type=${type}` 
      : `${API_BASE_URL}/Cart/remove-voucher`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    const result = await response.json();
    return {
      success: response.ok && result.success,
      message: result.message,
      data: result.data,
    };
  } catch (error) {
    console.error("Error removing voucher from cart:", error);
    return { success: false, message: "Lỗi kết nối" };
  }
}

export async function addToCart(
  token: string,
  data: { variantID?: number; bundleID?: number; quantity: number; selectedGiftVariantId?: number }
): Promise<{ success: boolean; message?: string; data?: CartInfo }> {
  try {
    const response = await fetch(`${API_BASE_URL}/Cart/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        variantID: data.variantID || null,
        bundleID: data.bundleID || null,
        quantity: data.quantity,
        selectedGiftVariantId: data.selectedGiftVariantId || null,
      }),
    });

    const result = await response.json();
    return {
      success: response.ok && result.success,
      message: result.message,
      data: result.data,
    };
  } catch (error) {
    console.error("Error adding to cart:", error);
    return { success: false, message: "Lỗi kết nối" };
  }
}

export async function createInvoiceFromCart(
  token: string,
  cartId: number,
  payMethod: number | null,
  addressId: number | null,
  selectedCartDetailIds: number[],
  pointsToUse: number = 0,
  useCoins: boolean = false,
  coinsToUse: number = 0,
  useWallet: boolean = false,
  walletToUse: number = 0
): Promise<{ success: boolean; message?: string; paymentUrl?: string; data?: any }> {
  try {
    const params = new URLSearchParams();
    if (payMethod !== null) {
      params.append("payMethod", payMethod.toString());
    }
    if (addressId !== null) {
      params.append("addressId", addressId.toString());
    }

    const getDeviceId = () => {
      if (typeof window === 'undefined') return 'server-side';
      let deviceId = localStorage.getItem('X-Device-Id');
      if (!deviceId) {
        deviceId = btoa(navigator.userAgent + window.screen.width + window.screen.height + navigator.language).substring(0, 32);
        localStorage.setItem('X-Device-Id', deviceId);
      }
      return deviceId;
    };

    const response = await fetch(`${API_BASE_URL}/Invoice/create-from-cart/${cartId}?${params.toString()}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "X-Device-Id": getDeviceId(),
      },
      body: JSON.stringify({
        SelectedCartDetailIds: selectedCartDetailIds,
        UsePoints: pointsToUse > 0,
        PointsToUse: pointsToUse,
        UseCoins: useCoins,
        CoinsToUse: coinsToUse,
        UseWallet: useWallet,
        WalletToUse: walletToUse
      }),
    });

    const result = await response.json();
    return {
      success: response.ok && (result.success ?? true),
      message: result.error ? `${result.message || "Lỗi tạo hóa đơn"} (${result.error})` : (result.message || "Đặt hàng thành công"),
      paymentUrl: result.paymentUrl,
      data: result.data,
    };
  } catch (error) {
    console.error("Error creating invoice:", error);
    return { success: false, message: "Lỗi kết nối mạng" };
  }
}

export async function getInvoiceDetail(token: string, invoiceId: string | number): Promise<any | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/Invoice/${invoiceId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch invoice detail:", response.statusText);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching invoice detail:", error);
    return null;
  }
}

export async function getWishlist(token: string): Promise<Product[] | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/Wishlist`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch wishlist:", response.statusText);
      return null;
    }

    const result = await response.json();
    if (result.success && result.data) {
      return result.data.map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        discountPrice: item.discountPrice ?? undefined,
        image: item.image ?? "",
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        inStock: item.inStock,
        quantity: item.quantity,
      }));
    }
    return null;
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    return null;
  }
}

export async function toggleWishlistApi(
  token: string,
  productId: number
): Promise<{ success: boolean; isWishlisted: boolean; message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/Wishlist/toggle/${productId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    const result = await response.json();
    return {
      success: response.ok && result.success,
      isWishlisted: result.isWishlisted ?? false,
      message: result.message || "",
    };
  } catch (error) {
    console.error("Error toggling wishlist api:", error);
    return { success: false, isWishlisted: false, message: "Lỗi kết nối" };
  }
}

export async function syncWishlistApi(
  token: string,
  productIds: number[]
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/Wishlist/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(productIds),
    });

    const result = await response.json();
    return {
      success: response.ok && result.success,
      message: result.message || "",
    };
  } catch (error) {
    console.error("Error syncing wishlist api:", error);
    return { success: false, message: "Lỗi kết nối" };
  }
}

export async function getUserOrders(
  userId: string,
  token: string,
  status?: string,
  search?: string,
  page: number = 1,
  pageSize: number = 10
): Promise<{ items: any[]; totalCount: number; page: number; pageSize: number } | null> {
  try {
    const url = new URL(`${API_BASE_URL}/Invoice/user/${userId}`);
    if (status && status !== "all") {
      url.searchParams.append("status", status);
    }
    if (search && search.trim() !== "") {
      url.searchParams.append("search", search.trim());
    }
    url.searchParams.append("page", page.toString());
    url.searchParams.append("pageSize", pageSize.toString());

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch user orders:", response.statusText);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching user orders:", error);
    return null;
  }
}

export async function getOrderDetails(
  id: number,
  token: string
): Promise<any | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/Invoice/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch order details:", response.statusText);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching order details:", error);
    return null;
  }
}

export async function requestCancelOrder(
  id: number,
  token: string,
  reason: string
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/Invoice/${id}/request-cancel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ reason }),
    });

    const result = await response.json();
    return {
      success: response.ok,
      message: result.message || (response.ok ? "Gửi yêu cầu hủy thành công." : "Không thể hủy đơn hàng."),
    };
  } catch (error) {
    console.error("Error request cancel order:", error);
    return { success: false, message: "Lỗi kết nối mạng." };
  }
}

export async function markOrderCompleted(
  id: number,
  token: string
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/Invoice/${id}/mark-completed`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    const result = await response.json();
    return {
      success: response.ok,
      message: result.message || (response.ok ? "Xác nhận nhận hàng thành công." : "Không thể xác nhận nhận hàng."),
    };
  } catch (error) {
    console.error("Error marking order completed:", error);
    return { success: false, message: "Lỗi kết nối mạng." };
  }
}

export async function retryVnPayPayment(
  id: number,
  token: string
): Promise<{ success: boolean; paymentUrl?: string; message?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/Invoice/${id}/retry-vnpay`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    const result = await response.json();
    if (response.ok && result.success) {
      return { success: true, paymentUrl: result.paymentUrl };
    }
    return {
      success: false,
      message: result.message || "Tạo lại liên kết thanh toán VNPay thất bại.",
    };
  } catch (error) {
    console.error("Error retrying VNPay payment:", error);
    return { success: false, message: "Lỗi kết nối mạng." };
  }
}

// ===== Return / Refund Workflow =====

export async function requestReturn(
  orderId: number,
  token: string,
  reason: string,
  description: string,
  refundMethod: 1 | 2, // 1 = SystemWallet, 2 = LazPeCoins
  imageUrls?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/Invoice/${orderId}/request-return`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ reason, description, refundMethod, imageUrls: imageUrls || "" }),
    });
    const result = await response.json();
    return {
      success: response.ok,
      message: result.message || (response.ok ? "Gửi yêu cầu hoàn hàng thành công." : "Không thể gửi yêu cầu hoàn hàng."),
    };
  } catch (error) {
    console.error("Error requesting return:", error);
    return { success: false, message: "Lỗi kết nối mạng." };
  }
}

export async function cancelReturnRequest(
  id: number,
  token: string
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/Invoice/${id}/cancel-return-request`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });
    const result = await response.json();
    return {
      success: response.ok,
      message: result.message || (response.ok ? "Hủy yêu cầu hoàn hàng thành công." : "Không thể hủy yêu cầu hoàn hàng."),
    };
  } catch (error) {
    console.error("Error canceling return request:", error);
    return { success: false, message: "Lỗi kết nối mạng." };
  }
}

export async function uploadReturnImage(
  file: File,
  token: string
): Promise<{ success: boolean; url?: string; message?: string }> {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/Invoice/upload-return-image`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
      body: formData,
    });
    
    const result = await response.json();
    if (response.ok && result.success) {
      return { success: true, url: result.url };
    }
    return { success: false, message: result.message || "Upload ảnh thất bại." };
  } catch (error) {
    console.error("Error uploading return image:", error);
    return { success: false, message: "Lỗi kết nối mạng." };
  }
}

export async function approveReturn(
  id: number,
  token: string,
  isRefundToCoins: boolean
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/Invoice/${id}/approve-return`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ isRefundToCoins }),
    });
    const result = await response.json();
    return {
      success: response.ok,
      message: result.message || (response.ok ? "Duyệt hoàn trả thành công." : "Không thể duyệt hoàn trả."),
    };
  } catch (error) {
    console.error("Error approving return:", error);
    return { success: false, message: "Lỗi kết nối mạng." };
  }
}

export async function confirmReturnReceived(
  id: number,
  token: string
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/Invoice/${id}/confirm-return-received`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });
    const result = await response.json();
    return {
      success: response.ok,
      message: result.message || (response.ok ? "Xác nhận nhận hàng hoàn thành công." : "Không thể xác nhận."),
    };
  } catch (error) {
    console.error("Error confirming return received:", error);
    return { success: false, message: "Lỗi kết nối mạng." };
  }
}

export async function getReturnOrders(token: string): Promise<any[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/Invoice/admin/return-requests`, {
      headers: { "Authorization": `Bearer ${token}` },
    });
    if (!response.ok) return [];
    return await response.json();
  } catch {
    return [];
  }
}

export async function getUserVouchers(token: string): Promise<any[] | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/vouchers/wallet`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch user vouchers:", response.statusText);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching user vouchers:", error);
    return null;
  }
}

export async function activateVoucherCode(
  token: string,
  code: string
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/vouchers/activate-code`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ code }),
    });

    const result = await response.json();
    return {
      success: response.ok,
      message: result.message || (response.ok ? "Kích hoạt voucher thành công." : "Kích hoạt voucher thất bại."),
    };
  } catch (error) {
    console.error("Error activating voucher code:", error);
    return { success: false, message: "Lỗi kết nối mạng." };
  }
}

export async function getUserReviews(
  userId: string,
  token: string,
  page: number = 1,
  pageSize: number = 10
): Promise<any | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/Review/user/${userId}?page=${page}&pageSize=${pageSize}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch user reviews:", response.statusText);
      return null;
    }

    const result = await response.json();
    if (result.success && result.data) {
      return result.data;
    }
    return null;
  } catch (error) {
    console.error("Error fetching user reviews:", error);
    return null;
  }
}

export async function getPendingReviews(
  userId: string,
  token?: string
): Promise<any[] | null> {
  try {
    const activeToken = token || (typeof window !== "undefined" ? (localStorage.getItem("token") || sessionStorage.getItem("token")) : null);
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (activeToken) {
      headers["Authorization"] = `Bearer ${activeToken}`;
    }

    const response = await fetch(`${API_BASE_URL}/Review/pending/${userId}`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      console.error("Failed to fetch pending reviews:", response.statusText);
      return null;
    }

    const result = await response.json();
    if (result.success && result.data) {
      return result.data;
    }
    return null;
  } catch (error) {
    console.error("Error fetching pending reviews:", error);
    return null;
  }
}

export async function submitProductReview(
  token: string,
  reviewData: {
    invoiceID: number;
    invoiceDetailID: number;
    rating: number;
    content: string;
  }
): Promise<{ success: boolean; message: string; data?: any }> {
  try {
    const response = await fetch(`${API_BASE_URL}/Review/from-invoice`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(reviewData),
    });

    const result = await response.json();
    return {
      success: response.ok && result.success,
      message: result.message || (response.ok ? "Đánh giá thành công!" : "Có lỗi xảy ra."),
      data: result.data,
    };
  } catch (error) {
    console.error("Error submitting review:", error);
    return { success: false, message: "Lỗi kết nối mạng." };
  }
}

// LOYALTY PROGRAM APIs

export interface LoyaltyProfileResponse {
  userID: string;
  fullName: string;
  availablePoints: number;
  totalPoints: number;
  pointsToNextTier: number;
  currentTierID: number;
  currentTierName: string;
  currentTierDescription: string;
  progressPercentage: number;
  rankAdjustmentOffset: number;
  lastUpdated: string;
}

export interface LoyaltyPointHistoryItem {
  historyID: number;
  transactionType: string;
  amount: number;
  invoiceID?: number;
  invoiceCode?: string;
  description: string;
  createdAt: string;
}

export async function getLoyaltyProfile(token: string): Promise<LoyaltyProfileResponse | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/Loyalty/profile`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) return null;

    const result = await response.json();
    if (result.success) {
      return result.data;
    }
    return null;
  } catch (error) {
    console.error("Error fetching loyalty profile:", error);
    return null;
  }
}

export interface ClientPrivilege {
  privilegeID: number;
  name: string;
  privilegeType: string;
  value?: string;
}

export interface LoyaltyTierClientResponse {
  tierID: number;
  tierName: string;
  minPoints: number;
  colorHex: string;
  badgeIcon: string;
  isActive: boolean;
  privileges: ClientPrivilege[];
}

export interface LoyaltyEarnPolicySummary {
  policyID: number;
  name: string;
  vndAmount: number;
  pointsEarned: number;
  multiplier: number;
  isCampaign: boolean;
  startDate?: string | null;
  endDate?: string | null;
  isFallback: boolean;
}

export interface LoyaltyRedeemPolicySummary {
  policyID: number;
  name: string;
  pointsToRedeem: number;
  discountVnd: number;
  tierID?: number | null;
  tierName: string;
  startDate?: string | null;
  endDate?: string | null;
  isFallback: boolean;
}

export interface LoyaltyPolicySummaryResponse {
  earnPolicy: LoyaltyEarnPolicySummary;
  redeemPolicy: LoyaltyRedeemPolicySummary;
}

export async function getLoyaltyTiers(token: string): Promise<LoyaltyTierClientResponse[] | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/Loyalty/tiers`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) return null;

    const result = await response.json();
    if (result.success) {
      return result.data;
    }
    return null;
  } catch (error) {
    console.error("Error fetching loyalty tiers:", error);
    return null;
  }
}

export async function getLoyaltyPolicySummary(token: string): Promise<LoyaltyPolicySummaryResponse | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/Loyalty/policies/summary`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) return null;

    const result = await response.json();
    if (result.success) {
      return result.data;
    }
    return null;
  } catch (error) {
    console.error("Error fetching loyalty policy summary:", error);
    return null;
  }
}

export async function getLoyaltyHistory(
  token: string,
  type: string = "ALL",
  period: string = "All",
  page: number = 1,
  pageSize: number = 10
): Promise<{ data: LoyaltyPointHistoryItem[]; pagination: any } | null> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/Loyalty/history?type=${type}&period=${period}&page=${page}&pageSize=${pageSize}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) return null;

    const result = await response.json();
    if (result.success) {
      return {
        data: result.data || [],
        pagination: result.pagination
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching loyalty history:", error);
    return null;
  }
}

export async function validateLoyaltyRedemption(
  token: string,
  pointsToUse: number,
  cartSubtotal: number
): Promise<{ success: boolean; isApplied: boolean; pointsUsed: number; discountAmount: number; message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/Loyalty/redemption/validate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ pointsToUse, cartSubtotal }),
    });

    const result = await response.json();
    return {
      success: response.ok && (result.isApplied ?? false),
      isApplied: result.isApplied ?? false,
      pointsUsed: result.pointsUsed ?? 0,
      discountAmount: result.discountAmount ?? 0,
      message: result.message || "",
    };
  } catch (error) {
    console.error("Error validating loyalty redemption:", error);
    return { success: false, isApplied: false, pointsUsed: 0, discountAmount: 0, message: "Lỗi kết nối mạng" };
  }
}

export interface LoyaltySettings {
  id?: number;
  enableReviewReward: boolean;
  reviewRewardPoints: number;
  minimumReviewWords: number;
  requiredRatingForReward: number;
  allowMultipleRewardsPerProduct: boolean;
  updatedAt?: string;
}

export async function getLoyaltySettings(token: string): Promise<LoyaltySettings | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/Loyalty/settings`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });
    if (!response.ok) return null;
    const result = await response.json();
    return result.success ? result.data : null;
  } catch (error) {
    console.error("Error fetching loyalty settings:", error);
    return null;
  }
}

export async function updateLoyaltySettings(
  token: string,
  settings: LoyaltySettings
): Promise<{ success: boolean; message?: string; data?: LoyaltySettings }> {
  try {
    const response = await fetch(`${API_BASE_URL}/Loyalty/settings`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(settings),
    });
    const result = await response.json();
    return {
      success: response.ok && result.success,
      message: result.message,
      data: result.data,
    };
  } catch (error) {
    console.error("Error updating loyalty settings:", error);
    return { success: false, message: "Lỗi kết nối mạng" };
  }
}

// NOTIFICATION CENTER APIs

export interface UserNotificationItem {
  id: number;
  userId: string;
  notificationId: number;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  code: string;
  title: string;
  shortDescription: string;
  content: string;
  thumbnailImage?: string;
  bannerImage?: string;
  type: string;
  priority: string;
  actionType: string;
  actionUrl?: string;
  isPinned: boolean;
}

export async function getNotifications(
  token: string,
  type?: string,
  isRead?: boolean,
  page: number = 1,
  pageSize: number = 20
): Promise<UserNotificationItem[] | null> {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });
    if (type) params.append("type", type);
    if (isRead !== undefined) params.append("isRead", isRead.toString());

    const response = await fetch(`${API_BASE_URL}/Notification?${params.toString()}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) return null;
    const result = await response.json();
    return result.success ? result.data : null;
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return null;
  }
}

export async function getUnreadNotificationCount(token: string): Promise<number> {
  try {
    const response = await fetch(`${API_BASE_URL}/Notification/unread-count`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });
    if (!response.ok) return 0;
    const result = await response.json();
    return result.success ? result.data : 0;
  } catch (error) {
    console.error("Error fetching unread count:", error);
    return 0;
  }
}

export async function markNotificationRead(token: string, id: number): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/Notification/read/${id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });
    const result = await response.json();
    return { success: response.ok && result.success, message: result.message };
  } catch (error) {
    console.error("Error marking read:", error);
    return { success: false, message: "Lỗi kết nối" };
  }
}

export async function markAllNotificationsRead(token: string): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/Notification/read-all`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });
    const result = await response.json();
    return { success: response.ok && result.success, message: result.message };
  } catch (error) {
    console.error("Error marking all read:", error);
    return { success: false, message: "Lỗi kết nối" };
  }
}

export async function deleteNotification(token: string, id: number): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/Notification/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });
    const result = await response.json();
    return { success: response.ok && result.success, message: result.message };
  } catch (error) {
    console.error("Error deleting notification:", error);
    return { success: false, message: "Lỗi kết nối" };
  }
}

export async function updateNotificationSettings(
  userId: string,
  token: string,
  settings: {
    emailNotifications: boolean;
    orderUpdates: boolean;
    promotions: boolean;
  }
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/ProfileApi/notification-settings?userId=${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        receiveEmailNotifications: settings.emailNotifications,
        receiveOrderUpdates: settings.orderUpdates,
        receivePromotions: settings.promotions,
      }),
    });
    const result = await response.json();
    return { success: response.ok && result.success, message: result.message };
  } catch (error) {
    console.error("Error updating notification settings:", error);
    return { success: false, message: "Lỗi kết nối" };
  }
}

// Admin APIs

export async function adminGetNotifications(token: string, searchTerm?: string): Promise<any[] | null> {
  try {
    const url = searchTerm
      ? `${API_BASE_URL}/admin/AdminNotification/campaigns?searchTerm=${encodeURIComponent(searchTerm)}`
      : `${API_BASE_URL}/admin/AdminNotification/campaigns`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });
    if (!response.ok) return null;
    const result = await response.json();
    return result.success ? result.data : null;
  } catch (error) {
    console.error("Error listing admin campaigns:", error);
    return null;
  }
}

export async function adminCreateNotification(token: string, data: any): Promise<{ success: boolean; data?: any; message?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/AdminNotification/campaigns`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    return { success: response.ok && result.success, data: result.data, message: result.message };
  } catch (error) {
    console.error("Error creating campaign:", error);
    return { success: false, message: "Lỗi kết nối" };
  }
}

export async function adminUpdateNotification(token: string, id: number, data: any): Promise<{ success: boolean; data?: any; message?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/AdminNotification/campaigns/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    return { success: response.ok && result.success, data: result.data, message: result.message };
  } catch (error) {
    console.error("Error updating campaign:", error);
    return { success: false, message: "Lỗi kết nối" };
  }
}

export async function adminDeleteNotification(token: string, id: number): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/AdminNotification/campaigns/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });
    const result = await response.json();
    return { success: response.ok && result.success, message: result.message };
  } catch (error) {
    console.error("Error deleting campaign:", error);
    return { success: false, message: "Lỗi kết nối" };
  }
}

export async function adminSendNotificationNow(token: string, id: number): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/AdminNotification/campaigns/${id}/send-now`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });
    const result = await response.json();
    return { success: response.ok && result.success, message: result.message };
  } catch (error) {
    console.error("Error triggering send now:", error);
    return { success: false, message: "Lỗi kết nối" };
  }
}

export async function adminCancelNotificationSchedule(token: string, id: number): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/AdminNotification/campaigns/${id}/cancel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });
    const result = await response.json();
    return { success: response.ok && result.success, message: result.message };
  } catch (error) {
    console.error("Error cancelling schedule:", error);
    return { success: false, message: "Lỗi kết nối" };
  }
}

export async function adminGetNotificationStats(token: string): Promise<any | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/AdminNotification/statistics`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });
    if (!response.ok) return null;
    const result = await response.json();
    return result.success ? result.data : null;
  } catch (error) {
    console.error("Error getting stats:", error);
    return null;
  }
}

// Templates APIs

export async function adminGetTemplates(token: string): Promise<any[] | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/AdminNotification/templates`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });
    if (!response.ok) return null;
    const result = await response.json();
    return result.success ? result.data : null;
  } catch (error) {
    console.error("Error getting templates:", error);
    return null;
  }
}

export async function adminCreateTemplate(token: string, data: any): Promise<{ success: boolean; data?: any; message?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/AdminNotification/templates`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    return { success: response.ok && result.success, data: result.data, message: result.message };
  } catch (error) {
    console.error("Error creating template:", error);
    return { success: false, message: "Lỗi kết nối" };
  }
}

export async function adminUpdateTemplate(token: string, id: number, data: any): Promise<{ success: boolean; data?: any; message?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/AdminNotification/templates/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    return { success: response.ok && result.success, data: result.data, message: result.message };
  } catch (error) {
    console.error("Error updating template:", error);
    return { success: false, message: "Lỗi kết nối" };
  }
}

export async function adminDeleteTemplate(token: string, id: number): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/AdminNotification/templates/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });
    const result = await response.json();
    return { success: response.ok && result.success, message: result.message };
  } catch (error) {
    console.error("Error deleting template:", error);
    return { success: false, message: "Lỗi kết nối" };
  }
}

// PRODUCT REVIEW APIs

export interface ReviewMedia {
  mediaID: number;
  reviewID: number;
  url: string;
  mediaType: 'IMAGE' | 'VIDEO';
  createdAt: string;
}

export interface ReviewCensorshipLog {
  logID: number;
  reviewID: number;
  actorID: string;
  actorName: string;
  action: 'HIDE' | 'RESTORE';
  reason: string;
  timestamp: string;
}

export interface ReviewUser {
  userID: string;
  fullName: string;
  avatar?: string;
}

export interface ReviewComment {
  commentID: number;
  reviewID: number;
  userID: string;
  parentCommentID?: number | null;
  content: string;
  createdAt: string;
  isHidden: boolean;
  user?: ReviewUser;
  childComments: ReviewComment[];
}

export interface ReviewItem {
  reviewID: number;
  userID: string;
  variantID?: number | null;
  bundleID?: number | null;
  rating: number;
  content: string;
  createdAt: string;
  isHidden: boolean;
  hasEarnedRewardPoints: boolean;
  loyaltyPointsEarned: number;
  updatedAt?: string | null;
  censorshipReason?: string | null;
  user?: ReviewUser;
  likeCount: number;
  commentCount: number;
  isLikedByCurrentUser: boolean;
  comments: ReviewComment[];
  reviewMedia: ReviewMedia[];
  censorshipLogs: ReviewCensorshipLog[];
  productName?: string;
  variantName?: string;
  bundleName?: string;
  imageUrl?: string;
  autoModerationStatus?: string;
  flaggedReason?: string;
  violationScore?: number;
}

export interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: Record<number, number>;
}

export interface ReviewListResponse {
  reviews: ReviewItem[];
  stats: ReviewStats | null;
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const getHeaders = (token?: string | null) => {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  const activeToken = token || (typeof window !== "undefined" ? (localStorage.getItem("token") || sessionStorage.getItem("token")) : null);
  if (activeToken) {
    headers["Authorization"] = `Bearer ${activeToken}`;
  }
  return headers;
};

export async function getProductReviews(
  productId: number,
  page: number = 1,
  pageSize: number = 10
): Promise<ReviewListResponse | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/review/product/${productId}?page=${page}&pageSize=${pageSize}`, {
      method: "GET",
      headers: getHeaders(),
    });
    if (!response.ok) return null;
    const result = await response.json();
    return result.success ? result.data : null;
  } catch (error) {
    console.error("Error fetching product reviews:", error);
    return null;
  }
}

export async function getReviewableItems(invoiceId: number): Promise<any[] | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/review/reviewable-items/${invoiceId}`, {
      method: "GET",
      headers: getHeaders(),
    });
    if (!response.ok) return null;
    const result = await response.json();
    return result.success ? result.data : null;
  } catch (error) {
    console.error("Error fetching reviewable items:", error);
    return null;
  }
}

export async function createReviewFromInvoice(data: {
  invoiceID: number;
  invoiceDetailID: number;
  rating: number;
  content?: string;
  media?: { url: string; mediaType: string }[];
}): Promise<{ success: boolean; message: string; data?: ReviewItem }> {
  try {
    const response = await fetch(`${API_BASE_URL}/review/from-invoice`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    const result = await response.json();
    return {
      success: response.ok && result.success,
      message: result.message || (response.ok ? "Đánh giá thành công" : "Đánh giá thất bại"),
      data: result.data,
    };
  } catch (error) {
    console.error("Error submitting review:", error);
    return { success: false, message: "Lỗi kết nối" };
  }
}

export async function updateReview(
  reviewId: number,
  data: {
    reviewID: number;
    rating: number;
    content?: string;
    media?: { url: string; mediaType: string }[];
  }
): Promise<{ success: boolean; message: string; data?: ReviewItem }> {
  try {
    const response = await fetch(`${API_BASE_URL}/review/${reviewId}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    const result = await response.json();
    return {
      success: response.ok && result.success,
      message: result.message || (response.ok ? "Cập nhật thành công" : "Cập nhật thất bại"),
      data: result.data,
    };
  } catch (error) {
    console.error("Error updating review:", error);
    return { success: false, message: "Lỗi kết nối" };
  }
}

export async function deleteReview(reviewId: number): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/review/${reviewId}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    const result = await response.json();
    return {
      success: response.ok && result.success,
      message: result.message || (response.ok ? "Xóa thành công" : "Xóa thất bại"),
    };
  } catch (error) {
    console.error("Error deleting review:", error);
    return { success: false, message: "Lỗi kết nối" };
  }
}

export async function searchReviews(params: {
  variantID?: number;
  bundleID?: number;
  rating?: number;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  pageSize?: number;
  isHidden?: boolean;
  hasMedia?: boolean;
}): Promise<ReviewListResponse | null> {
  try {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await fetch(`${API_BASE_URL}/review?${queryParams.toString()}`, {
      method: "GET",
      headers: getHeaders(),
    });
    if (!response.ok) return null;
    const result = await response.json();
    return result.success ? result.data : null;
  } catch (error) {
    console.error("Error searching reviews:", error);
    return null;
  }
}

export async function toggleReviewLike(reviewId: number): Promise<{ success: boolean; isLiked: boolean; likeCount: number }> {
  try {
    const response = await fetch(`${API_BASE_URL}/review/${reviewId}/like`, {
      method: "POST",
      headers: getHeaders(),
    });
    const result = await response.json();
    return {
      success: response.ok && result.success,
      isLiked: result.data?.isLiked ?? false,
      likeCount: result.data?.likeCount ?? 0,
    };
  } catch (error) {
    console.error("Error toggling like:", error);
    return { success: false, isLiked: false, likeCount: 0 };
  }
}

export async function createReviewComment(data: {
  reviewID: number;
  parentCommentID?: number | null;
  content: string;
}): Promise<{ success: boolean; message: string; data?: ReviewComment }> {
  try {
    const response = await fetch(`${API_BASE_URL}/review/${data.reviewID}/comments`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    const result = await response.json();
    return {
      success: response.ok && result.success,
      message: result.message || "Bình luận thành công",
      data: result.data,
    };
  } catch (error) {
    console.error("Error creating comment:", error);
    return { success: false, message: "Lỗi kết nối" };
  }
}

export async function deleteReviewComment(commentId: number): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/review/comments/${commentId}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    const result = await response.json();
    return {
      success: response.ok && result.success,
      message: result.message || "Xóa bình luận thành công",
    };
  } catch (error) {
    console.error("Error deleting comment:", error);
    return { success: false, message: "Lỗi kết nối" };
  }
}

// ADMIN APIS
export async function getReviewLoyaltySettings(): Promise<any | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/review/settings`, {
      method: "GET",
      headers: getHeaders(),
    });
    if (!response.ok) return null;
    const result = await response.json();
    return result.success ? result.data : null;
  } catch (error) {
    console.error("Error fetching loyalty settings:", error);
    return null;
  }
}

export async function updateReviewLoyaltySettings(settings: any): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/review/settings`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(settings),
    });
    const result = await response.json();
    return {
      success: response.ok && result.success,
      message: result.message || "Cập nhật thành công",
    };
  } catch (error) {
    console.error("Error updating loyalty settings:", error);
    return { success: false, message: "Lỗi kết nối" };
  }
}

export async function getReviewAdminStats(): Promise<any | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/review/admin/stats`, {
      method: "GET",
      headers: getHeaders(),
    });
    if (!response.ok) return null;
    const result = await response.json();
    return result.success ? result.data : null;
  } catch (error) {
    console.error("Error fetching review admin stats:", error);
    return null;
  }
}

export async function censorReview(data: {
  reviewID: number;
  action: 'HIDE' | 'RESTORE';
  reason: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/review/censor`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    const result = await response.json();
    return {
      success: response.ok && result.success,
      message: result.message || "Kiểm duyệt thành công",
    };
  } catch (error) {
    console.error("Error censoring review:", error);
    return { success: false, message: "Lỗi kết nối" };
  }
}

export async function getReviewCensorshipLogs(reviewId: number): Promise<ReviewCensorshipLog[] | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/review/${reviewId}/logs`, {
      method: "GET",
      headers: getHeaders(),
    });
    if (!response.ok) return null;
    const result = await response.json();
    return result.success ? result.data : null;
  } catch (error) {
    console.error("Error fetching censorship logs:", error);
    return null;
  }
}

// SENSITIVE KEYWORDS & MODERATION DASHBOARD APIS
export interface ReviewSensitiveKeyword {
  keywordID: number;
  word: string;
  severity: string;
  category: string;
  createdAt: string;
}

export interface ModerationDashboard {
  totalNeedsReview: number;
  totalFlagged: number;
  totalAutoHidden: number;
  topKeywords: { keyword: string; count: number }[];
  topProducts: { productName: string; count: number }[];
  topUsers: { userFullName: string; count: number }[];
}

export async function getReviewSensitiveKeywords(): Promise<ReviewSensitiveKeyword[] | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/review/keywords`, {
      method: "GET",
      headers: getHeaders(),
    });
    if (!response.ok) return null;
    const result = await response.json();
    return result.success ? result.data : null;
  } catch (error) {
    console.error("Error fetching sensitive keywords:", error);
    return null;
  }
}

export async function createReviewSensitiveKeyword(data: {
  word: string;
  severity: string;
  category: string;
}): Promise<{ success: boolean; message: string; data?: ReviewSensitiveKeyword }> {
  try {
    const response = await fetch(`${API_BASE_URL}/review/keywords`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    const result = await response.json();
    return {
      success: response.ok && result.success,
      message: result.message || "Thêm từ khóa thành công",
      data: result.data,
    };
  } catch (error) {
    console.error("Error creating sensitive keyword:", error);
    return { success: false, message: "Lỗi kết nối" };
  }
}

export async function updateReviewSensitiveKeyword(
  id: number,
  data: {
    word: string;
    severity: string;
    category: string;
  }
): Promise<{ success: boolean; message: string; data?: ReviewSensitiveKeyword }> {
  try {
    const response = await fetch(`${API_BASE_URL}/review/keywords/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    const result = await response.json();
    return {
      success: response.ok && result.success,
      message: result.message || "Cập nhật từ khóa thành công",
      data: result.data,
    };
  } catch (error) {
    console.error("Error updating sensitive keyword:", error);
    return { success: false, message: "Lỗi kết nối" };
  }
}

export async function deleteReviewSensitiveKeyword(id: number): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/review/keywords/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    const result = await response.json();
    return {
      success: response.ok && result.success,
      message: result.message || "Xóa từ khóa thành công",
    };
  } catch (error) {
    console.error("Error deleting sensitive keyword:", error);
    return { success: false, message: "Lỗi kết nối" };
  }
}

export async function importReviewSensitiveKeywords(file: File): Promise<{ success: boolean; message: string }> {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const token = typeof window !== "undefined" ? (localStorage.getItem("token") || sessionStorage.getItem("token")) : null;
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/review/keywords/import`, {
      method: "POST",
      headers: headers,
      body: formData,
    });
    const result = await response.json();
    return {
      success: response.ok && result.success,
      message: result.message || "Import từ khóa thành công",
    };
  } catch (error) {
    console.error("Error importing sensitive keywords:", error);
    return { success: false, message: "Lỗi kết nối" };
  }
}

export async function getModerationDashboard(): Promise<ModerationDashboard | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/review/moderation/dashboard`, {
      method: "GET",
      headers: getHeaders(),
    });
    if (!response.ok) return null;
    const result = await response.json();
    return result.success ? result.data : null;
  } catch (error) {
    console.error("Error fetching moderation dashboard:", error);
    return null;
  }
}

export async function downloadSampleKeywordsExcel(): Promise<Blob | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/review/keywords/sample`, {
      method: "GET",
      headers: getHeaders(),
    });
    if (!response.ok) return null;
    return await response.blob();
  } catch (error) {
    console.error("Error downloading sample keywords excel:", error);
    return null;
  }
}

// GOOGLE LOGIN API
export async function googleLogin(idToken: string): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/Authentication/google-login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idToken }),
    });
    return await response.json();
  } catch (error) {
    console.error("Error during Google login:", error);
    return { success: false, message: "Lỗi kết nối đến server" };
  }
}

// VOUCHER APIS
export interface UserWalletVoucher {
  userVoucherID: number;
  voucherID: number;
  voucherCode: string;
  voucherName: string;
  discountType: number;
  discountValue: number;
  minOrderValue: number;
  maxDiscount: number;
  startDate: string;
  endDate: string;
  voucherType: string;
  sourceType: string;
  status: string;
  collectedAt: string;
  usedAt: string | null;
}

export async function getWalletVouchers(token: string): Promise<UserWalletVoucher[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/vouchers/wallet`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error("Error fetching wallet vouchers:", error);
    return [];
  }
}

export async function activateExclusiveVoucher(token: string, code: string): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/vouchers/activate-code`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({ code }),
    });
    const result = await response.json().catch(() => ({}));
    return { success: response.ok, message: result.message || (response.ok ? "Kích hoạt voucher thành công." : "Mã voucher không hợp lệ.") };
  } catch (error) {
    console.error("Error activating exclusive voucher:", error);
    return { success: false, message: "Lỗi kết nối server." };
  }
}

// LOYALTY CHECK-IN APIS
export interface DailyCheckInStatus {
  hasCheckedInToday: boolean;
  currentStreak: number;
  pointsForNextCheckIn: number;
  rewardSequence: number[];
}

export interface DailyCheckInResult {
  success: boolean;
  message: string;
  pointsEarned: number;
  newStreak: number;
  totalPoints: number;
}

export async function getCheckInStatus(token: string): Promise<{ success: boolean; data?: DailyCheckInStatus; message?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/Loyalty/checkin/status`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return { success: false, message: "Lỗi kết nối server." };
    return await response.json();
  } catch (error) {
    console.error("Error fetching check-in status:", error);
    return { success: false, message: "Lỗi mạng." };
  }
}

export async function performCheckIn(token: string): Promise<DailyCheckInResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/Loyalty/checkin`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const result = await response.json();
    return {
      success: response.ok && result.success,
      message: result.data?.message || result.message || "Lỗi xử lý",
      pointsEarned: result.data?.pointsEarned || 0,
      newStreak: result.data?.newStreak || 0,
      totalPoints: result.data?.totalPoints || 0
    };
  } catch (error) {
    console.error("Error performing check-in:", error);
    return { success: false, message: "Lỗi mạng", pointsEarned: 0, newStreak: 0, totalPoints: 0 };
  }
}

export async function getSpendingDashboard(token: string): Promise<ApiResponse<any> | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/Invoice/spending-dashboard`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch spending dashboard:", response.statusText);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching spending dashboard:", error);
    return null;
  }
}

// BABY PROFILE interfaces & APIs
export interface BabyProfileDto {
  babyProfileID: number;
  userID: string;
  name: string;
  relationship?: string;
  gender?: string;
  dateOfBirth: string;
  weightKg?: number;
  heightCm?: number;
  favoriteColors?: string;
  createdAt: string;
}

export interface CreateBabyProfileDto {
  name: string;
  relationship?: string;
  gender?: string;
  dateOfBirth: string;
  weightKg?: number;
  heightCm?: number;
  favoriteColors?: string;
}

export interface UpdateBabyProfileDto {
  name: string;
  relationship?: string;
  gender?: string;
  dateOfBirth: string;
  weightKg?: number;
  heightCm?: number;
  favoriteColors?: string;
}

export async function getBabyProfiles(token: string): Promise<ApiResponse<BabyProfileDto[]>> {
  try {
    const response = await fetch(`${API_BASE_URL}/BabyProfile`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      return { success: false, data: [], message: response.statusText };
    }
    return await response.json();
  } catch (error) {
    console.error("Error getting baby profiles:", error);
    return { success: false, data: [], message: "Lỗi kết nối server." };
  }
}

export async function addBabyProfile(token: string, data: CreateBabyProfileDto): Promise<ApiResponse<BabyProfileDto>> {
  try {
    const response = await fetch(`${API_BASE_URL}/BabyProfile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      return { success: false, data: {} as BabyProfileDto, message: response.statusText };
    }
    return await response.json();
  } catch (error) {
    console.error("Error adding baby profile:", error);
    return { success: false, data: {} as BabyProfileDto, message: "Lỗi kết nối server." };
  }
}

export async function updateBabyProfile(token: string, id: number, data: UpdateBabyProfileDto): Promise<ApiResponse<any>> {
  try {
    const response = await fetch(`${API_BASE_URL}/BabyProfile/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      return { success: false, data: null, message: response.statusText };
    }
    return await response.json();
  } catch (error) {
    console.error("Error updating baby profile:", error);
    return { success: false, data: null, message: "Lỗi kết nối server." };
  }
}

export async function deleteBabyProfile(token: string, id: number): Promise<ApiResponse<any>> {
  try {
    const response = await fetch(`${API_BASE_URL}/BabyProfile/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      return { success: false, data: null, message: response.statusText };
    }
    return await response.json();
  } catch (error) {
    console.error("Error deleting baby profile:", error);
    return { success: false, data: null, message: "Lỗi kết nối server." };
  }
}

