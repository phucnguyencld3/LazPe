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
  slug?: string;
  name: string;
  description: string;
  specifications?: string;
  price: number;
  discountPrice?: number;
  minPrice?: number;
  maxPrice?: number;
  minEffectivePrice?: number;
  maxEffectivePrice?: number;
  limitExceeded?: boolean;
  variantCount?: number;
  image?: string;
  imageUrls?: string[];
  rating?: number;
  ratingCount?: number;
  categoryId: number;
  categoryName?: string;
  inStock: boolean;
  quantity?: number;
  isBundle?: boolean;
  variants?: Variant[];
  productOptions?: ProductOption[];
  quantityNeeded?: number;
  quantityPurchased?: number;
  note?: string | null;
  priority?: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  image?: string;
  parentId?: number | null;
  level?: number;
  productCount?: number;
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
  voucherType?: number;
  isFreeShipping?: boolean;
  maxShippingDiscount?: number | null;
}

export interface FlashSaleItem {
  flashSaleItemId: number;
  campaignId: number;
  itemType: number;
  referenceId: number;
  productId?: number;
  itemName?: string;
  imageUrl?: string;
  originalPrice: number;
  discountPrice: number;
  totalQuantity: number;
  soldQuantity: number;
  status: number;
  maxQuantityPerUser?: number;
  userPurchasedQuantity?: number;
}

export interface FlashSaleCampaign {
  campaignId: number;
  name: string;
  description?: string;
  startTime: string;
  endTime: string;
  status: number;
  flashSaleItems: FlashSaleItem[];
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

export enum AlertType {
  PriceDrop = 0,
  BackInStock = 1
}

export interface CreateProductAlertDto {
  productId: number;
  variantId?: number;
  alertType: AlertType;
  targetPrice?: number;
}

export interface ProductAlert {
  id: number;
  userId: string;
  productId: number;
  variantId?: number;
  productName: string;
  imageUrl?: string;
  alertType: AlertType;
  targetPrice?: number;
  isTriggered: boolean;
  createdAt: string;
}

