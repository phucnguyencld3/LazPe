const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5101/api";

export enum FlashSaleItemType {
  Product = 1,
  Variant = 2,
  Bundle = 3
}

export enum FlashSaleStatus {
  Upcoming = 0,
  Active = 1,
  Ended = 2
}

export enum CampaignType {
  FlashSale = 0,
  BuyXGetY = 1,
  ComboDiscount = 2
}

export enum DiscountType {
  FixedPrice = 0,
  Percentage = 1,
  FreeGift = 2
}

export interface CreateFlashSaleItemDto {
  itemType: FlashSaleItemType;
  referenceId: number;
  discountPrice: number;
  discountType: DiscountType;
  requiredQuantity: number;
  giftVariantIds?: number[];
  totalQuantity: number;
  maxQuantityPerUser: number;
}

export interface CreateFlashSaleDto {
  name: string;
  startTime: string;
  endTime: string;
  type: CampaignType;
  bannerUrl?: string;
  description?: string;
  isActive: boolean;
  flashSaleItems: CreateFlashSaleItemDto[];
}

export interface UpdateFlashSaleDto {
  name: string;
  startTime: string;
  endTime: string;
  type: CampaignType;
  bannerUrl?: string;
  description?: string;
  isActive: boolean;
  flashSaleItems: CreateFlashSaleItemDto[];
}

export interface FlashSaleItemResponseDto {
  id: number;
  flashSaleId: number;
  itemType: FlashSaleItemType;
  referenceId: number;
  itemName: string;
  slug?: string;
  sku?: string;
  imageUrl?: string;
  originalPrice: number;
  discountPrice: number;
  discountType: DiscountType;
  requiredQuantity: number;
  giftVariantIds?: number[];
  giftNames?: string[];
  giftImageUrls?: string[];
  totalQuantity: number;
  soldQuantity: number;
  maxQuantityPerUser: number;
  userPurchasedQuantity?: number;
  productId?: number;
  rating?: number;
  reviewCount?: number;
}

export interface FlashSaleResponseDto {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  type: CampaignType;
  bannerUrl?: string;
  description?: string;
  status: FlashSaleStatus;
  isActive: boolean;
  createdAt: string;
  createdBy?: string;
  flashSaleItems: FlashSaleItemResponseDto[];
}

// Fetch all flash sales (Admin)
export async function getFlashSalesAdmin(token: string): Promise<FlashSaleResponseDto[]> {
  const response = await fetch(`${API_BASE_URL}/FlashSale/admin`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Failed to fetch flash sales");
  const data = await response.json();
  return data || [];
}

// Fetch single flash sale detail (Admin)
export async function getFlashSaleDetailAdmin(id: number, token: string): Promise<FlashSaleResponseDto> {
  const response = await fetch(`${API_BASE_URL}/FlashSale/admin/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Failed to fetch flash sale detail");
  const data = await response.json();
  return data;
}

// Create flash sale (Admin)
export async function createFlashSale(dto: CreateFlashSaleDto, token: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/FlashSale/admin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(dto)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to create flash sale");
  return data;
}

// Update flash sale (Admin)
export async function updateFlashSale(id: number, dto: UpdateFlashSaleDto, token: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/FlashSale/admin/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(dto)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to update flash sale");
  return data;
}

// Delete flash sale (Admin)
export async function deleteFlashSale(id: number, token: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/FlashSale/admin/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to delete flash sale");
  return data;
}

// Get current active flash sale (Client)
export async function getCurrentFlashSale(): Promise<FlashSaleResponseDto[]> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") || sessionStorage.getItem("token") : null;
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}/FlashSale/current`, {
    headers
  });
  if (!response.ok) return [];
  const text = await response.text();
  if (!text || text.trim() === "" || text === "null") return [];
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse flash sale JSON:", e);
    return [];
  }
}
