import { Product, Category, ApiResponse, PaginatedResponse } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

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

    const result: ApiResponse<PaginatedResponse<Product>> = await response.json();
    return result.success ? result.data : null;
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

    const result: ApiResponse<Product> = await response.json();
    return result.success ? result.data : null;
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

    const result: ApiResponse<Category[]> = await response.json();
    return result.success ? result.data : null;
  } catch (error) {
    console.error("Error fetching categories:", error);
    return null;
  }
}
