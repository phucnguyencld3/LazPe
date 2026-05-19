export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  image?: string;
  rating?: number;
  ratingCount?: number;
  categoryId: number;
  categoryName?: string;
  inStock: boolean;
  quantity?: number;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  image?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}
