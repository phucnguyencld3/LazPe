import { Product, Category, ApiResponse, PaginatedResponse, Voucher } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5101/api";

export async function getProducts(
  page: number = 1,
  pageSize: number = 12,
  searchTerm: string = "",
  categoryId?: number,
  sortBy: string = "CreatedAt",
  sortDirection: string = "desc"
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
          image: item.imageUrl ?? item.image ?? "",
          categoryId: item.categoryID ?? item.categoryId,
          categoryName: item.categoryName,
          inStock: item.status !== false && (item.totalStock ?? item.stock ?? 0) > 0,
          quantity: item.totalStock ?? item.stock ?? 0,
          rating: item.rating,
          ratingCount: item.ratingCount,
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

      return {
        id: item.productID ?? item.productId ?? item.id,
        name: item.productName ?? item.name,
        description: item.description ?? "",
        price: item.price ?? 0,
        discountPrice: item.productDiscountPercent > 0 ? (item.price * (1 - item.productDiscountPercent / 100)) : undefined,
        image: finalImage,
        categoryId: item.categoryID ?? item.categoryId,
        categoryName: item.category?.categoryName,
        inStock: item.status !== false && finalStock > 0,
        quantity: finalStock,
        rating: item.rating,
        ratingCount: item.ratingCount,
        variants: variants,
        productOptions: item.productOptions ?? [],
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

// =============================================
// USER PROFILE APIs
// =============================================

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

// =============================================
// ADDRESS MANAGEMENT APIs
// =============================================

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

// =============================================
// CART APIs
// =============================================

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
}

export interface CartDetailInfo {
  cartDetailID: number;
  cartID: number;
  variantID?: number;
  bundleID?: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
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
  totalAmount: number;
  voucher?: VoucherCartInfo | null;
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

export async function removeVoucherFromCart(
  token: string
): Promise<{ success: boolean; message?: string; data?: CartInfo }> {
  try {
    const response = await fetch(`${API_BASE_URL}/Cart/remove-voucher`, {
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
  data: { variantID?: number; bundleID?: number; quantity: number }
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
  pointsToUse: number = 0
): Promise<{ success: boolean; message?: string; paymentUrl?: string; data?: any }> {
  try {
    const params = new URLSearchParams();
    if (payMethod !== null) {
      params.append("payMethod", payMethod.toString());
    }
    if (addressId !== null) {
      params.append("addressId", addressId.toString());
    }
    if (pointsToUse > 0) {
      params.append("pointsToUse", pointsToUse.toString());
    }

    const response = await fetch(`${API_BASE_URL}/Invoice/create-from-cart/${cartId}?${params.toString()}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        SelectedCartDetailIds: selectedCartDetailIds,
      }),
    });

    const result = await response.json();
    return {
      success: response.ok && (result.success ?? true),
      message: result.message || "Đặt hàng thành công",
      paymentUrl: result.paymentUrl,
      data: result.data,
    };
  } catch (error) {
    console.error("Error creating invoice:", error);
    return { success: false, message: "Lỗi kết nối mạng" };
  }
}

export async function getInvoiceDetail(token: string, invoiceId: number): Promise<any | null> {
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
  token: string
): Promise<any[] | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/Invoice/user/${userId}`, {
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
  token: string
): Promise<any[] | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/Review/pending/${userId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
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
): Promise<{ success: boolean; message: string }> {
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
    };
  } catch (error) {
    console.error("Error submitting review:", error);
    return { success: false, message: "Lỗi kết nối mạng." };
  }
}

// =============================================
// LOYALTY PROGRAM APIs
// =============================================

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


