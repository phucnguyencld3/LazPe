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
