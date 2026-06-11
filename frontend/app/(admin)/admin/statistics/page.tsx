"use client";

import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { toast } from "@/lib/toast";
import { Pagination } from "@/components/admin/shared/Pagination";
import { formatCurrency } from "@/lib/utils/formatters";

// Dynamically import ApexCharts to prevent SSR Hydration Errors in Next.js
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5101/api";

interface DashboardSummary {
  totalRevenue: number;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalProductsSold: number;
  totalCustomers: number;
  averageOrderValue: number;
  revenueGrowthRate: number;
}

interface ProductStat {
  productID: number;
  productCode: string;
  productName: string;
  categoryName: string;
  supplierName: string;
  stock: number;
  quantitySold: number;
  totalRevenue: number;
}

interface CategoryStat {
  categoryID: number;
  categoryName: string;
  totalProducts: number;
  quantitySold: number;
  totalRevenue: number;
  revenueSharePercentage: number;
}

interface BrandStat {
  supplierID: number;
  supplierName: string;
  quantitySold: number;
  totalRevenue: number;
  revenueSharePercentage: number;
  rank: number;
}

interface TimeSeriesStat {
  timeLabel: string;
  revenue: number;
  ordersCount: number;
  productsSoldCount: number;
}

interface TopProducts {
  bestSellers: ProductStat[];
  topRevenue: ProductStat[];
  highestStock: ProductStat[];
  lowestStock: ProductStat[];
}

interface RevenueReportResponse {
  summary: DashboardSummary;
  topProducts: TopProducts;
  categoryStats: CategoryStat[];
  brandStats: BrandStat[];
  timeSeriesData: TimeSeriesStat[];
}

export default function AdminStatisticsPage() {
  // Date states default to last 30 days
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [toDate, setToDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  // Filter dropdown selections
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [groupType, setGroupType] = useState(""); // empty means auto

  // Dropdown lists
  const [productsList, setProductsList] = useState<any[]>([]);
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [brandsList, setBrandsList] = useState<any[]>([]);

  // Main statistics data state
  const [data, setData] = useState<RevenueReportResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Paginated Product Breakdown states
  const [productBreakdown, setProductBreakdown] = useState<ProductStat[]>([]);
  const [productPage, setProductPage] = useState(1);
  const [productPageSize] = useState(10);
  const [productTotalPages, setProductTotalPages] = useState(1);
  const [productTotalItems, setProductTotalItems] = useState(0);
  const [productSearch, setProductSearch] = useState("");
  const [loadingTable, setLoadingTable] = useState(false);
  const [isChartReady, setIsChartReady] = useState(false);

  // Helper for auth headers
  const getHeaders = useCallback(() => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }, []);

  // Fetch filter options
  const fetchFilterOptions = useCallback(async () => {
    try {
      const headers = getHeaders();
      
      // Fetch Categories
      const resCat = await fetch(`${API_BASE_URL}/Product/categories`, { headers });
      if (resCat.ok) {
        const result = await resCat.json();
        if (result.success) setCategoriesList(result.data);
      }

      // Fetch Suppliers/Brands
      const resBrand = await fetch(`${API_BASE_URL}/Product/suppliers`, { headers });
      if (resBrand.ok) {
        const result = await resBrand.json();
        if (result.success) setBrandsList(result.data);
      }

      // Fetch Top Products for quick selection
      const resProd = await fetch(`${API_BASE_URL}/Product?pageSize=100`, { headers });
      if (resProd.ok) {
        const result = await resProd.json();
        if (result.success && result.data && result.data.products) {
          setProductsList(result.data.products);
        }
      }
    } catch (error) {
      console.error("Error fetching filter options:", error);
    }
  }, [getHeaders]);

  // Main fetch function for dashboard report
  const fetchReportData = useCallback(async () => {
    // Validate range is <= 6 months
    const start = new Date(fromDate);
    const end = new Date(toDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 186) {
      toast.error("Chỉ được thống kê trong phạm vi tối đa 6 tháng.");
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        fromDate,
        toDate,
      });
      if (selectedProduct) params.append("productID", selectedProduct);
      if (selectedCategory) params.append("categoryID", selectedCategory);
      if (selectedBrand) params.append("supplierID", selectedBrand);
      if (groupType) params.append("groupType", groupType);

      const res = await fetch(`${API_BASE_URL}/Statistics/summary?${params.toString()}`, {
        headers: getHeaders(),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setData(result.data);
      } else {
        toast.error(result.message || "Lỗi tải số liệu thống kê.");
      }
    } catch (error) {
      console.error("Error fetching report data:", error);
      toast.error("Không thể kết nối đến máy chủ.");
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, selectedProduct, selectedCategory, selectedBrand, groupType, getHeaders]);

  // Fetch paginated products breakdown
  const fetchProductBreakdown = useCallback(async () => {
    // Validate range is <= 6 months
    const start = new Date(fromDate);
    const end = new Date(toDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 186) return;

    setLoadingTable(true);
    try {
      const params = new URLSearchParams({
        fromDate,
        toDate,
        page: productPage.toString(),
        pageSize: productPageSize.toString(),
        searchTerm: productSearch,
      });
      if (selectedProduct) params.append("productID", selectedProduct);
      if (selectedCategory) params.append("categoryID", selectedCategory);
      if (selectedBrand) params.append("supplierID", selectedBrand);

      const res = await fetch(`${API_BASE_URL}/Statistics/products-paginated?${params.toString()}`, {
        headers: getHeaders(),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setProductBreakdown(result.data.items);
        setProductTotalPages(result.data.totalPages);
        setProductTotalItems(result.data.totalItems);
      }
    } catch (error) {
      console.error("Error fetching product breakdown:", error);
    } finally {
      setLoadingTable(false);
    }
  }, [fromDate, toDate, selectedProduct, selectedCategory, selectedBrand, productPage, productPageSize, productSearch, getHeaders]);

  // Export to Excel
  const handleExportExcel = async () => {
    try {
      const params = new URLSearchParams({
        fromDate,
        toDate,
      });
      if (selectedProduct) params.append("productID", selectedProduct);
      if (selectedCategory) params.append("categoryID", selectedCategory);
      if (selectedBrand) params.append("supplierID", selectedBrand);
      if (groupType) params.append("groupType", groupType);

      toast.info("Đang khởi tạo file Excel...");
      const res = await fetch(`${API_BASE_URL}/Statistics/export-excel?${params.toString()}`, {
        headers: {
          Authorization: getHeaders().Authorization || "",
        },
      });

      if (!res.ok) {
        const text = await res.json();
        toast.error(text.message || "Lỗi xuất Excel.");
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      
      const fromStr = fromDate.replace(/-/g, "");
      const toStr = toDate.replace(/-/g, "");
      a.download = `BaoCaoDoanhThu_${fromStr}_to_${toStr}.xlsx`;
      
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Tải xuống file Excel thành công!");
    } catch (error) {
      console.error("Error exporting excel:", error);
      toast.error("Không thể xuất file Excel.");
    }
  };

  // Trigger report reload when filters change
  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  useEffect(() => {
    fetchProductBreakdown();
  }, [fetchProductBreakdown]);

  // Patch all prototype methods of ApexCharts globally on client mount to prevent any lifecycle/unmount crashes
  useEffect(() => {
    if (typeof window !== "undefined") {
      import("apexcharts").then((module) => {
        const Apex = module.default as any;
        if (Apex && Apex.prototype && !Apex.prototype.patched) {
          Apex.prototype.patched = true;

          for (const key in Apex.prototype) {
            try {
              const originalMethod = Apex.prototype[key];
              if (typeof originalMethod === "function" && key !== "constructor") {
                Apex.prototype[key] = function (this: any, ...args: any[]) {
                  // Safety check: if there is no element reference, return safely
                  if (!this.el) {
                    if (key === "render" || key === "updateOptions" || key === "updateSeries") {
                      return Promise.resolve();
                    }
                    return;
                  }
                  try {
                    return originalMethod.apply(this, args);
                  } catch (e) {
                    console.warn(`ApexCharts safe ${key} caught error:`, e);
                    if (key === "render" || key === "updateOptions" || key === "updateSeries") {
                      return Promise.resolve();
                    }
                    return;
                  }
                };
              }
            } catch (err) {
              // Ignore any properties that we can't patch
            }
          }
        }
      }).catch((err) => {
        console.error("Error loading apexcharts dynamic patch:", err);
      });
    }
  }, []);

  // Delay chart display to ensure DOM containers are mounted and stable
  useEffect(() => {
    if (!loading && data) {
      const timer = setTimeout(() => {
        setIsChartReady(true);
      }, 150);
      return () => clearTimeout(timer);
    } else {
      setIsChartReady(false);
    }
  }, [loading, data]);

  // Refresh helper
  const handleRefresh = () => {
    fetchReportData();
    fetchProductBreakdown();
    toast.success("Đã làm mới dữ liệu thống kê!");
  };

  // Format percent formatting
  const formatPercent = (val: number) => {
    return `${val > 0 ? "+" : ""}${val}%`;
  };

  // Check date limit for UI validation styling
  const isDateLimitExceeded = () => {
    const start = new Date(fromDate);
    const end = new Date(toDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 186;
  };

  // Mixed Time Series Chart Config
  const getTimeSeriesChartConfig = () => {
    if (!data || !data.timeSeriesData) return null;

    const categories = data.timeSeriesData.map((d) => d.timeLabel);
    const revenueSeries = data.timeSeriesData.map((d) => d.revenue);
    const ordersSeries = data.timeSeriesData.map((d) => d.ordersCount);

    return {
      series: [
        {
          name: "Doanh thu (₫)",
          type: "area" as const,
          data: revenueSeries,
        },
        {
          name: "Số đơn hàng",
          type: "column" as const,
          data: ordersSeries,
        },
      ],
      options: {
        chart: {
          height: 350,
          type: "line" as const,
          toolbar: {
            show: false,
          },
          fontFamily: "inherit",
        },
        stroke: {
          width: [3, 0],
          curve: "smooth" as const,
        },
        fill: {
          opacity: [0.25, 0.85],
          gradient: {
            inverseColors: false,
            shade: "light",
            type: "vertical",
            opacityFrom: 0.5,
            opacityTo: 0.1,
            stops: [0, 100],
          },
        },
        colors: ["#6366f1", "#fb923c"],
        labels: categories,
        markers: {
          size: 4,
        },
        xaxis: {
          type: "category" as const,
        },
        yaxis: [
          {
            title: {
              text: "Doanh thu (₫)",
              style: { color: "#6366f1", fontWeight: 600 },
            },
            labels: {
              formatter: (val: number) => formatCurrency(val),
              style: { colors: "#6366f1" },
            },
          },
          {
            opposite: true,
            title: {
              text: "Số đơn hàng",
              style: { color: "#fb923c", fontWeight: 600 },
            },
            labels: {
              formatter: (val: number) => Math.round(val).toString(),
              style: { colors: "#fb923c" },
            },
          },
        ],
        tooltip: {
          shared: true,
          intersect: false,
          y: {
            formatter: function (y: number, { seriesIndex }: any) {
              if (typeof y !== "undefined") {
                return seriesIndex === 0 ? formatCurrency(y) : `${y} đơn hàng`;
              }
              return y;
            },
          },
        },
      },
    };
  };

  // Top Products Bar Chart Config
  const getProductChartConfig = () => {
    if (!data || !data.topProducts || !data.topProducts.bestSellers) return null;

    const names = data.topProducts.bestSellers.map((p) => p.productName);
    const sold = data.topProducts.bestSellers.map((p) => p.quantitySold);

    return {
      series: [
        {
          name: "Số lượng đã bán",
          data: sold,
        },
      ],
      options: {
        chart: {
          type: "bar" as const,
          height: 350,
          toolbar: { show: false },
          fontFamily: "inherit",
        },
        plotOptions: {
          bar: {
            borderRadius: 6,
            horizontal: true,
            barHeight: "50%",
          },
        },
        colors: ["#3b82f6"],
        dataLabels: {
          enabled: true,
          formatter: (val: number) => `${val} SP`,
        },
        xaxis: {
          categories: names,
        },
        grid: {
          xaxis: { lines: { show: true } },
        },
      },
    };
  };

  // Category Pie Chart Config
  const getCategoryChartConfig = () => {
    if (!data || !data.categoryStats) return null;

    // Filter categories with revenue > 0
    const activeCats = data.categoryStats.filter((c) => c.totalRevenue > 0);
    const labels = activeCats.map((c) => c.categoryName);
    const series = activeCats.map((c) => c.totalRevenue);

    return {
      series: series,
      options: {
        chart: {
          type: "donut" as const,
          fontFamily: "inherit",
        },
        labels: labels,
        colors: ["#2563eb", "#ec4899", "#8b5cf6", "#f59e0b", "#10b981", "#64748b"],
        responsive: [
          {
            breakpoint: 480,
            options: {
              chart: {
                width: 200,
              },
              legend: {
                position: "bottom" as const,
              },
            },
          },
        ],
        tooltip: {
          y: {
            formatter: (val: number) => formatCurrency(val),
          },
        },
        legend: {
          position: "bottom" as const,
        },
      },
    };
  };

  // Supplier Pie Chart Config
  const getSupplierChartConfig = () => {
    if (!data || !data.brandStats) return null;

    const activeBrands = data.brandStats.filter((b) => b.totalRevenue > 0);
    const labels = activeBrands.map((b) => b.supplierName);
    const series = activeBrands.map((b) => b.totalRevenue);

    return {
      series: series,
      options: {
        chart: {
          type: "donut" as const,
          fontFamily: "inherit",
        },
        labels: labels,
        colors: ["#ec4899", "#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#64748b"],
        tooltip: {
          y: {
            formatter: (val: number) => formatCurrency(val),
          },
        },
        legend: {
          position: "bottom" as const,
        },
      },
    };
  };

  const mixedChart = getTimeSeriesChartConfig();
  const productChart = getProductChartConfig();
  const categoryChart = getCategoryChartConfig();
  const supplierChart = getSupplierChartConfig();

  return (
    <div className="space-y-lg min-h-screen pb-xl">
      {/* Dynamic print-style overrides to format printed page perfectly */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          aside, header, footer, .no-print, .filters-section {
            display: none !important;
          }
          main, .ml-72 {
            margin-left: 0 !important;
            padding: 0 !important;
            width: 100% !important;
          }
          .print-grid {
            display: block !important;
          }
          .print-card {
            border: 1px solid #ddd !important;
            box-shadow: none !important;
            page-break-inside: avoid;
            margin-bottom: 20px;
          }
          .kpi-print {
            grid-template-cols: repeat(3, 1fr) !important;
          }
        }
      `}} />

      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-md no-print">
        <div>
          <h1 className="font-display-lg text-headline-lg text-on-surface">Báo cáo & Thống kê Doanh thu</h1>
          <p className="text-on-surface-variant font-label-sm">
            Phân tích chuyên sâu về hiệu suất kinh doanh, tồn kho và các mặt hàng bán chạy.
          </p>
        </div>
        <div className="flex flex-wrap gap-sm">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 border border-outline-variant bg-surface hover:bg-surface-container-low text-on-surface px-md py-sm rounded-lg font-label-md transition-colors"
          >
            <span className="material-symbols-outlined text-md">refresh</span>
            Làm mới
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 bg-[#10b981] hover:bg-[#059669] text-white px-md py-sm rounded-lg font-label-md transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-md">table_view</span>
            Xuất Excel
          </button>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-surface-container-lowest rounded-xl soft-shadow p-md border border-surface-container-high/40 filters-section no-print">
        <div className="flex items-center gap-sm mb-md border-b border-outline-variant pb-xs">
          <span className="material-symbols-outlined text-primary">filter_alt</span>
          <h2 className="font-headline-sm text-on-surface">Bộ lọc tìm kiếm</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-md">
          {/* Date range inputs */}
          <div>
            <label className="block text-on-surface-variant font-label-sm mb-xs">Từ ngày</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className={`w-full p-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary ${
                isDateLimitExceeded() ? "border-rose-500 bg-rose-50/50" : "border-outline-variant"
              }`}
            />
          </div>

          <div>
            <label className="block text-on-surface-variant font-label-sm mb-xs">Đến ngày</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className={`w-full p-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary ${
                isDateLimitExceeded() ? "border-rose-500 bg-rose-50/50" : "border-outline-variant"
              }`}
            />
          </div>

          {/* Category drop down */}
          <div>
            <label className="block text-on-surface-variant font-label-sm mb-xs">Danh mục</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2 text-sm border border-outline-variant rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-surface"
            >
              <option value="">Tất cả danh mục</option>
              {categoriesList.map((c) => (
                <option key={c.categoryID} value={c.categoryID}>
                  {c.categoryName}
                </option>
              ))}
            </select>
          </div>

          {/* Supplier drop down */}
          <div>
            <label className="block text-on-surface-variant font-label-sm mb-xs">Thương hiệu</label>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full p-2 text-sm border border-outline-variant rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-surface"
            >
              <option value="">Tất cả thương hiệu</option>
              {brandsList.map((b) => (
                <option key={b.supplierID} value={b.supplierID}>
                  {b.supplierName}
                </option>
              ))}
            </select>
          </div>

          {/* Product drop down */}
          <div>
            <label className="block text-on-surface-variant font-label-sm mb-xs">Sản phẩm</label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full p-2 text-sm border border-outline-variant rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-surface"
            >
              <option value="">Tất cả sản phẩm</option>
              {productsList.map((p) => (
                <option key={p.productID} value={p.productID}>
                  [{p.code}] {p.productName}
                </option>
              ))}
            </select>
          </div>

          {/* Time Series Grouping drop down */}
          <div>
            <label className="block text-on-surface-variant font-label-sm mb-xs">Nhóm theo</label>
            <select
              value={groupType}
              onChange={(e) => setGroupType(e.target.value)}
              className="w-full p-2 text-sm border border-outline-variant rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-surface"
            >
              <option value="">Tự động (Ngày/Tháng)</option>
              <option value="Day">Theo ngày</option>
              <option value="Month">Theo tháng</option>
              <option value="Quarter">Theo quý</option>
              <option value="Year">Theo năm</option>
            </select>
          </div>
        </div>

        {/* Date warning message */}
        {isDateLimitExceeded() && (
          <div className="mt-md p-sm bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">warning</span>
            <span>Khoảng thời gian chọn không được vượt quá 6 tháng (186 ngày). Hãy rút ngắn phạm vi lọc để thực hiện truy vấn.</span>
          </div>
        )}
      </div>

      {loading ? (
        // Loading skeletons matching dashboard grids
        <div className="space-y-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-md">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-surface-container-lowest p-md rounded-lg soft-shadow border border-outline-variant animate-pulse h-28"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
            <div className="lg:col-span-2 bg-surface-container-lowest p-md rounded-xl soft-shadow h-96 animate-pulse"></div>
            <div className="bg-surface-container-lowest p-md rounded-xl soft-shadow h-96 animate-pulse"></div>
          </div>
        </div>
      ) : data ? (
        <>
          {/* KPI Dashboard Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-md kpi-print">
            {/* Revenue card */}
            <div className="bg-surface-container-lowest p-md rounded-lg soft-shadow border border-surface-container-high/40 flex flex-col justify-between group hover:-translate-y-1 transition-transform duration-300 print-card">
              <div className="flex justify-between items-start">
                <div className="bg-green-50 p-sm rounded-lg text-green-600">
                  <span className="material-symbols-outlined text-md" style={{ fontVariationSettings: "'FILL' 1" }}>
                    payments
                  </span>
                </div>
                <span className={`text-xs font-bold px-xs py-0.5 rounded-full flex items-center gap-0.5 ${
                  data.summary.revenueGrowthRate >= 0 ? "text-green-600 bg-green-50" : "text-rose-600 bg-rose-50"
                }`}>
                  <span className="material-symbols-outlined text-[10px] font-bold">
                    {data.summary.revenueGrowthRate >= 0 ? "arrow_upward" : "arrow_downward"}
                  </span>
                  {formatPercent(data.summary.revenueGrowthRate)}
                </span>
              </div>
              <div className="mt-md">
                <p className="text-on-surface-variant font-label-sm">Doanh thu thuần</p>
                <h3 className="font-display-lg text-headline-sm text-on-surface font-bold mt-1">
                  {formatCurrency(data.summary.totalRevenue)}
                </h3>
              </div>
              <p className="text-[10px] text-on-surface-variant mt-2">So với kỳ trước</p>
            </div>

            {/* Orders count card */}
            <div className="bg-surface-container-lowest p-md rounded-lg soft-shadow border border-surface-container-high/40 flex flex-col justify-between group hover:-translate-y-1 transition-transform duration-300 print-card">
              <div className="flex justify-between items-start">
                <div className="bg-orange-50 p-sm rounded-lg text-orange-600">
                  <span className="material-symbols-outlined text-md" style={{ fontVariationSettings: "'FILL' 1" }}>
                    shopping_bag
                  </span>
                </div>
              </div>
              <div className="mt-md">
                <p className="text-on-surface-variant font-label-sm">Đơn hàng</p>
                <h3 className="font-display-lg text-headline-sm text-on-surface font-bold mt-1">
                  {data.summary.totalOrders}
                </h3>
              </div>
              <div className="flex justify-between text-[10px] text-on-surface-variant mt-2 border-t border-outline-variant/40 pt-1">
                <span className="text-green-600">{data.summary.completedOrders} hoàn thành</span>
                <span className="text-rose-600">{data.summary.cancelledOrders} đã hủy</span>
              </div>
            </div>

            {/* Products sold card */}
            <div className="bg-surface-container-lowest p-md rounded-lg soft-shadow border border-surface-container-high/40 flex flex-col justify-between group hover:-translate-y-1 transition-transform duration-300 print-card">
              <div className="flex justify-between items-start">
                <div className="bg-indigo-50 p-sm rounded-lg text-indigo-600">
                  <span className="material-symbols-outlined text-md" style={{ fontVariationSettings: "'FILL' 1" }}>
                    inventory
                  </span>
                </div>
              </div>
              <div className="mt-md">
                <p className="text-on-surface-variant font-label-sm">Sản phẩm đã bán</p>
                <h3 className="font-display-lg text-headline-sm text-on-surface font-bold mt-1">
                  {data.summary.totalProductsSold.toLocaleString()}
                </h3>
              </div>
              <p className="text-[10px] text-on-surface-variant mt-2">Khối lượng sản phẩm xuất kho</p>
            </div>

            {/* Total customers card */}
            <div className="bg-surface-container-lowest p-md rounded-lg soft-shadow border border-surface-container-high/40 flex flex-col justify-between group hover:-translate-y-1 transition-transform duration-300 print-card">
              <div className="flex justify-between items-start">
                <div className="bg-blue-50 p-sm rounded-lg text-blue-600">
                  <span className="material-symbols-outlined text-md" style={{ fontVariationSettings: "'FILL' 1" }}>
                    group
                  </span>
                </div>
              </div>
              <div className="mt-md">
                <p className="text-on-surface-variant font-label-sm">Số khách hàng</p>
                <h3 className="font-display-lg text-headline-sm text-on-surface font-bold mt-1">
                  {data.summary.totalCustomers}
                </h3>
              </div>
              <p className="text-[10px] text-on-surface-variant mt-2">Khách hàng duy nhất đã thanh toán</p>
            </div>

            {/* Average order value card */}
            <div className="bg-surface-container-lowest p-md rounded-lg soft-shadow border border-surface-container-high/40 flex flex-col justify-between group hover:-translate-y-1 transition-transform duration-300 print-card">
              <div className="flex justify-between items-start">
                <div className="bg-purple-50 p-sm rounded-lg text-purple-600">
                  <span className="material-symbols-outlined text-md" style={{ fontVariationSettings: "'FILL' 1" }}>
                    price_check
                  </span>
                </div>
              </div>
              <div className="mt-md">
                <p className="text-on-surface-variant font-label-sm">Đơn hàng trung bình</p>
                <h3 className="font-display-lg text-headline-sm text-on-surface font-bold mt-1">
                  {formatCurrency(data.summary.averageOrderValue)}
                </h3>
              </div>
              <p className="text-[10px] text-on-surface-variant mt-2">Giá trị bình quân đơn thành công</p>
            </div>
          </div>

          {/* Time Series Trend & Top Sellers charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
            {/* Mixed Trend Chart */}
            <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl soft-shadow p-md border border-surface-container-high/40 print-card">
              <h3 className="font-headline-sm text-on-surface mb-md">Xu hướng Doanh thu & Đơn hàng</h3>
              {isChartReady && mixedChart ? (
                <Chart
                  options={mixedChart.options}
                  series={mixedChart.series}
                  type="line"
                  height={320}
                />
              ) : (
                <div className="h-[320px] flex items-center justify-center text-on-surface-variant text-sm">
                  Đang tải biểu đồ...
                </div>
              )}
            </div>

            {/* Product bar chart */}
            <div className="bg-surface-container-lowest rounded-xl soft-shadow p-md border border-surface-container-high/40 print-card">
              <h3 className="font-headline-sm text-on-surface mb-md">Top 5 Sản phẩm Bán chạy</h3>
              {isChartReady && productChart ? (
                <Chart
                  options={productChart.options}
                  series={productChart.series}
                  type="bar"
                  height={320}
                />
              ) : (
                <div className="h-[320px] flex items-center justify-center text-on-surface-variant text-sm">
                  {isChartReady ? "Không có dữ liệu" : "Đang tải biểu đồ..."}
                </div>
              )}
            </div>
          </div>

          {/* Category & Supplier share distributions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
            {/* Category Pie Chart */}
            <div className="bg-surface-container-lowest rounded-xl soft-shadow p-md border border-surface-container-high/40 print-card">
              <h3 className="font-headline-sm text-on-surface mb-md">Doanh thu theo Danh mục</h3>
              {isChartReady && categoryChart && categoryChart.series.length > 0 ? (
                <Chart
                  options={categoryChart.options}
                  series={categoryChart.series}
                  type="donut"
                  height={320}
                />
              ) : (
                <div className="h-[320px] flex items-center justify-center text-on-surface-variant text-sm">
                  {isChartReady ? "Không có dữ liệu doanh thu" : "Đang tải biểu đồ..."}
                </div>
              )}
            </div>

            {/* Brand Pie Chart */}
            <div className="bg-surface-container-lowest rounded-xl soft-shadow p-md border border-surface-container-high/40 print-card">
              <h3 className="font-headline-sm text-on-surface mb-md">Doanh thu theo Thương hiệu</h3>
              {isChartReady && supplierChart && supplierChart.series.length > 0 ? (
                <Chart
                  options={supplierChart.options}
                  series={supplierChart.series}
                  type="donut"
                  height={320}
                />
              ) : (
                <div className="h-[320px] flex items-center justify-center text-on-surface-variant text-sm">
                  {isChartReady ? "Không có dữ liệu doanh thu" : "Đang tải biểu đồ..."}
                </div>
              )}
            </div>
          </div>

          {/* Category list table & Supplier ranking table */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-lg">
            {/* Categories list */}
            <div className="lg:col-span-3 bg-surface-container-lowest rounded-xl soft-shadow p-md border border-surface-container-high/40 print-card">
              <h3 className="font-headline-sm text-on-surface mb-md">Chi tiết Danh mục</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-surface-container font-label-sm text-on-surface-variant">
                    <tr>
                      <th className="px-md py-sm rounded-l-lg">TÊN DANH MỤC</th>
                      <th className="px-md py-sm text-center">SỐ SẢN PHẨM</th>
                      <th className="px-md py-sm text-center">ĐÃ BÁN</th>
                      <th className="px-md py-sm text-right">TỔNG DOANH THU</th>
                      <th className="px-md py-sm text-right rounded-r-lg">TỶ TRỌNG</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {data.categoryStats.map((cat) => (
                      <tr key={cat.categoryID} className="hover:bg-surface-container-low transition-colors">
                        <td className="px-md py-md font-medium">{cat.categoryName}</td>
                        <td className="px-md py-md text-center">{cat.totalProducts}</td>
                        <td className="px-md py-md text-center font-semibold text-slate-700">{cat.quantitySold}</td>
                        <td className="px-md py-md text-right font-bold text-green-600">
                          {formatCurrency(cat.totalRevenue)}
                        </td>
                        <td className="px-md py-md text-right font-medium text-slate-500">
                          {cat.revenueSharePercentage}%
                        </td>
                      </tr>
                    ))}
                    {data.categoryStats.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-lg text-on-surface-variant">
                          Không tìm thấy danh mục nào.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Supplier list */}
            <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl soft-shadow p-md border border-surface-container-high/40 print-card">
              <h3 className="font-headline-sm text-on-surface mb-md">Bảng xếp hạng Thương hiệu</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-surface-container font-label-sm text-on-surface-variant">
                    <tr>
                      <th className="px-md py-sm rounded-l-lg text-center w-12">HẠNG</th>
                      <th className="px-md py-sm">THƯƠNG HIỆU</th>
                      <th className="px-md py-sm text-center">ĐÃ BÁN</th>
                      <th className="px-md py-sm text-right rounded-r-lg">DOANH THU</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {data.brandStats.map((brand, idx) => (
                      <tr key={brand.supplierID} className="hover:bg-surface-container-low transition-colors">
                        <td className="px-md py-md text-center font-bold">
                          {idx === 0 ? (
                            <span className="text-yellow-500 flex items-center justify-center">🏆</span>
                          ) : idx === 1 ? (
                            <span className="text-slate-400 flex items-center justify-center">🥈</span>
                          ) : idx === 2 ? (
                            <span className="text-amber-600 flex items-center justify-center">🥉</span>
                          ) : (
                            brand.rank
                          )}
                        </td>
                        <td className="px-md py-md font-medium">{brand.supplierName}</td>
                        <td className="px-md py-md text-center">{brand.quantitySold}</td>
                        <td className="px-md py-md text-right font-bold text-green-600">
                          {formatCurrency(brand.totalRevenue)}
                        </td>
                      </tr>
                    ))}
                    {data.brandStats.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center py-lg text-on-surface-variant">
                          Không tìm thấy thương hiệu nào.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Product Inventory Tops: Low vs High Stocks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
            {/* Highest Stock products */}
            <div className="bg-surface-container-lowest rounded-xl soft-shadow p-md border border-surface-container-high/40 print-card">
              <h3 className="font-headline-sm text-on-surface mb-md text-slate-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-500">warehouse</span>
                Sản phẩm Tồn kho cao nhất
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-surface-container font-label-sm text-on-surface-variant">
                    <tr>
                      <th className="px-md py-sm rounded-l-lg">MÃ SP</th>
                      <th className="px-md py-sm">TÊN SẢN PHẨM</th>
                      <th className="px-md py-sm text-right rounded-r-lg">TỒN KHO HỆ THỐNG</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {data.topProducts.highestStock.map((prod) => (
                      <tr key={prod.productID} className="hover:bg-surface-container-low transition-colors">
                        <td className="px-md py-md font-medium text-primary">{prod.productCode}</td>
                        <td className="px-md py-md font-medium truncate max-w-[200px]" title={prod.productName}>
                          {prod.productName}
                        </td>
                        <td className="px-md py-md text-right font-bold text-indigo-600">{prod.stock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Lowest Stock products */}
            <div className="bg-surface-container-lowest rounded-xl soft-shadow p-md border border-surface-container-high/40 print-card">
              <h3 className="font-headline-sm text-on-surface mb-md text-rose-700 flex items-center gap-2">
                <span className="material-symbols-outlined text-rose-500">warning</span>
                Sản phẩm Cảnh báo hết hàng (Tồn kho thấp nhất)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-surface-container font-label-sm text-on-surface-variant">
                    <tr>
                      <th className="px-md py-sm rounded-l-lg">MÃ SP</th>
                      <th className="px-md py-sm">TÊN SẢN PHẨM</th>
                      <th className="px-md py-sm text-right rounded-r-lg">TỒN KHO HỆ THỐNG</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {data.topProducts.lowestStock.map((prod) => (
                      <tr key={prod.productID} className="hover:bg-surface-container-low transition-colors">
                        <td className="px-md py-md font-medium text-primary">{prod.productCode}</td>
                        <td className="px-md py-md font-medium truncate max-w-[200px]" title={prod.productName}>
                          {prod.productName}
                        </td>
                        <td className="px-md py-md text-right font-bold text-rose-600">
                          {prod.stock <= 5 ? (
                            <span className="bg-rose-50 text-rose-700 px-sm py-0.5 rounded-full text-xs font-semibold">
                              {prod.stock} (Cực thấp)
                            </span>
                          ) : (
                            prod.stock
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Paginated Product Sales breakdown Table */}
          <div className="bg-surface-container-lowest rounded-xl soft-shadow p-md border border-surface-container-high/40 print-card">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-md mb-md">
              <div>
                <h3 className="font-headline-sm text-on-surface">Báo cáo Sản phẩm Bán ra Chi tiết</h3>
                <p className="text-on-surface-variant font-label-sm">Bao gồm tất cả sản phẩm đang kinh doanh và hiệu suất trong khoảng lọc.</p>
              </div>
              <div className="relative w-full md:w-80 no-print">
                <input
                  type="text"
                  placeholder="Tìm theo mã hoặc tên sản phẩm..."
                  value={productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    setProductPage(1);
                  }}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-outline-variant rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-surface"
                />
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-md">
                  search
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-surface-container font-label-sm text-on-surface-variant">
                  <tr>
                    <th className="px-md py-sm rounded-l-lg">MÃ SẢN PHẨM</th>
                    <th className="px-md py-sm">TÊN SẢN PHẨM</th>
                    <th className="px-md py-sm">DANH MỤC</th>
                    <th className="px-md py-sm">THƯƠNG HIỆU</th>
                    <th className="px-md py-sm text-center">TỒN KHO HIỆN TẠI</th>
                    <th className="px-md py-sm text-center">LƯỢNG ĐÃ BÁN</th>
                    <th className="px-md py-sm text-right rounded-r-lg">TỔNG DOANH THU</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {loadingTable ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={7} className="py-md px-md">
                          <div className="h-4 bg-outline-variant/30 rounded w-full"></div>
                        </td>
                      </tr>
                    ))
                  ) : productBreakdown.map((prod) => (
                    <tr key={prod.productID} className="hover:bg-surface-container-low transition-colors">
                      <td className="px-md py-md font-mono text-primary font-bold">{prod.productCode}</td>
                      <td className="px-md py-md font-semibold text-slate-800 truncate max-w-xs" title={prod.productName}>
                        {prod.productName}
                      </td>
                      <td className="px-md py-md text-slate-600">{prod.categoryName}</td>
                      <td className="px-md py-md text-slate-600">{prod.supplierName}</td>
                      <td className="px-md py-md text-center font-medium">{prod.stock}</td>
                      <td className="px-md py-md text-center font-bold text-indigo-700">{prod.quantitySold}</td>
                      <td className="px-md py-md text-right font-bold text-green-600">
                        {formatCurrency(prod.totalRevenue)}
                      </td>
                    </tr>
                  ))}
                  {productBreakdown.length === 0 && !loadingTable && (
                    <tr>
                      <td colSpan={7} className="text-center py-lg text-on-surface-variant font-medium">
                        Không tìm thấy sản phẩm nào khớp với tìm kiếm.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {productTotalPages > 1 && (
              <div className="mt-md flex justify-between items-center no-print">
                <p className="text-xs text-on-surface-variant">
                  Hiển thị {(productPage - 1) * productPageSize + 1} - {Math.min(productPage * productPageSize, productTotalItems)} của {productTotalItems} sản phẩm
                </p>
                <Pagination
                  currentPage={productPage}
                  totalPages={productTotalPages}
                  totalItems={productTotalItems}
                  itemsPerPage={productPageSize}
                  onPageChange={(page) => setProductPage(page)}
                />
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="bg-surface-container-lowest p-xl rounded-xl soft-shadow text-center border border-outline-variant text-on-surface-variant">
          <span className="material-symbols-outlined text-4xl text-slate-400 mb-sm">bar_chart</span>
          <p className="font-label-md">Không có dữ liệu trong khoảng thời gian đã chọn.</p>
        </div>
      )}
    </div>
  );
}
