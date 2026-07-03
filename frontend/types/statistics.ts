export interface DashboardSummary {
  totalRevenue: number;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalProductsSold: number;
  totalCustomers: number;
  averageOrderValue: number;
  revenueGrowthRate: number;
}

export interface ProductStat {
  productID: number;
  productCode: string;
  productName: string;
  categoryName: string;
  supplierName: string;
  stock: number;
  quantitySold: number;
  totalRevenue: number;
}

export interface CategoryStat {
  categoryID: number;
  categoryName: string;
  totalProducts: number;
  quantitySold: number;
  totalRevenue: number;
  revenueSharePercentage: number;
}

export interface BrandStat {
  supplierID: number;
  supplierName: string;
  quantitySold: number;
  totalRevenue: number;
  revenueSharePercentage: number;
  rank: number;
}

export interface TimeSeriesStat {
  timeLabel: string;
  revenue: number;
  ordersCount: number;
  productsSoldCount: number;
}

export interface TopProducts {
  bestSellers: ProductStat[];
  topRevenue: ProductStat[];
  highestStock: ProductStat[];
  lowestStock: ProductStat[];
}

export interface RevenueReportResponse {
  summary: DashboardSummary;
  topProducts: TopProducts;
  categoryStats: CategoryStat[];
  brandStats: BrandStat[];
  timeSeriesData: TimeSeriesStat[];
}

export interface AITimeSeriesStat {
  timeLabel: string;
  productsSoldCount: number;
  isForecast: boolean;
  lowerBoundProducts?: number;
  upperBoundProducts?: number;
}

export interface TrendingProduct {
  productID: number;
  productName: string;
  productCode: string;
  currentPeriodSales: number;
  previousPeriodSales: number;
  growthRate: number;
  trendScore: number;
}

export interface AITrendResponse {
  historicalData: AITimeSeriesStat[];
  forecastData: AITimeSeriesStat[];
  trendingProducts: TrendingProduct[];
}
