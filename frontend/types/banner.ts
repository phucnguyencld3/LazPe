export interface BannerRedirectConfig {
  enabled: boolean;
  type: 'none' | 'page' | 'product' | 'custom';
  value?: string | number;
  resolved_url?: string;
}

export interface BannerItem {
  imageUrl: string;
  altText?: string;
  redirectUrl?: string; // Keep for backward compatibility
  redirect?: BannerRedirectConfig;
  order: number;
}

export interface BannerResponsiveConfig {
  mobileContainerStyle?: string;
  desktopContainerStyle?: string;
  mobileGridColumns?: number;
}

export interface BannerFloatingPosition {
  anchor: 'top-left' | 'top-right' | 'center' | 'bottom-left' | 'bottom-right' | 'custom';
  offsetX?: number;
  offsetY?: number;
}

export interface BannerFloatingConfig {
  // Tương thích ngược với dữ liệu cũ
  anchor?: 'top-left' | 'top-right' | 'center' | 'bottom-left' | 'bottom-right' | 'custom';
  offsetX?: number;
  offsetY?: number;
  
  // Cấu hình định vị riêng cho từng thiết bị
  desktopPosition?: BannerFloatingPosition;
  tabletPosition?: BannerFloatingPosition;
  mobilePosition?: BannerFloatingPosition;

  closeable?: boolean;
  closeSession?: boolean;
  zIndex?: number;
  shadow?: string;
}

export interface BannerLayoutConfig {
  containerStyle?: string;
  animation?: string;
  items: BannerItem[];
  popupDelay?: number;
  showCloseButton?: boolean;
  gridColumns?: number;
  gridGap?: number;
  responsive?: BannerResponsiveConfig;
  floatingConfig?: BannerFloatingConfig;
}

export interface Banner {
  id: number;
  name: string;
  position: string;
  type: 'slideshow' | 'popup' | 'sidebar' | 'grid' | 'floating' | string;
  page?: string;
  status: 'Draft' | 'Published';
  version: string;
  layoutConfig: BannerLayoutConfig;
  draftConfig?: BannerLayoutConfig;
  hasUnpublishedChanges?: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrUpdateBannerRequest {
  name: string;
  position: string;
  type: string;
  layoutConfig: BannerLayoutConfig;
}

export interface BannerVersion {
  id: number;
  bannerId: number;
  version: string;
  layoutConfig: BannerLayoutConfig;
  createdAt: string;
  createdBy?: string;
}
