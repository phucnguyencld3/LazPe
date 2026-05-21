export interface ProductOptionValue {
  productOptionValueID: number;
  productOptionID: number;
  value: string;
  price: number;
  displayOrder: number;
}

export interface ProductOption {
  productOptionID: number;
  productID: number;
  name: string;
  displayOrder: number;
  productOptionValues: ProductOptionValue[];
}

export interface VariantOptionValue {
  variantOptionValueID: number;
  variantID: number;
  productOptionValueID: number;
  productOptionValue?: ProductOptionValue;
}

export interface Variant {
  variantID: number;
  productID: number;
  variantName: string;
  unitPrice: number;
  variantDiscountPercent: number;
  effectiveDiscountPercent: number;
  finalPrice: number;
  stock: number;
  sku: string;
  imageUrl?: string;
  description?: string;
  status: boolean;
  variantOptionValues: VariantOptionValue[];
}

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
  variants?: Variant[];
  productOptions?: ProductOption[];
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  image?: string;
  parentId?: number | null;
  level?: number;
}

export interface Voucher {
  voucherID: number;
  code: string;
  name: string;
  discountType: number; // 1: Percentage, 2: Fixed amount
  discountValue: number;
  minOrderValue: number;
  maxDiscount: number;
  totalQuantity: number;
  usedQuantity: number;
  startDate: string;
  endDate: string;
  remainingQuantity: number;
  visibilityType: string;
  isCollected: boolean;
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
