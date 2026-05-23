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
      return {
        id: item.productID ?? item.productId ?? item.id,
        name: item.productName ?? item.name,
        description: item.description ?? "",
        price: item.price ?? 0,
        discountPrice: item.productDiscountPercent > 0 ? (item.price * (1 - item.productDiscountPercent / 100)) : undefined,
        image: item.imageUrl ?? item.image ?? "",
        categoryId: item.categoryID ?? item.categoryId,
        categoryName: item.category?.categoryName,
        inStock: item.status !== false && (item.stock ?? 0) > 0,
        quantity: item.stock ?? 0,
        rating: item.rating,
        ratingCount: item.ratingCount,
        variants: item.variants ?? [],
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
  district: string;
  ward: string;
  detailAddress: string;
  isDefault: boolean;
  createdAt: string;
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

export async function getProvinces(): Promise<any[] | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/Address/provinces`, {
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

export async function getDistricts(provinceCode: string | number): Promise<any | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/Address/districts/${provinceCode}`, {
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

export async function getWards(districtCode: string | number): Promise<any | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/Address/wards/${districtCode}`, {
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
