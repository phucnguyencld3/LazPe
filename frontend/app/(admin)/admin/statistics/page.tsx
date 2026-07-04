"use client";

import React, { useState, useEffect, useCallback } from "react";
import { toast } from "@/lib/toast";
import { RevenueReportResponse, ProductStat } from "@/types/statistics";

import { OverviewTab } from "@/components/admin/statistics/OverviewTab";
import { RevenueTab } from "@/components/admin/statistics/RevenueTab";
import { ProductsTab } from "@/components/admin/statistics/ProductsTab";
import { TrendsTab } from "@/components/admin/statistics/TrendsTab";
import { SearchableSelect } from "@/components/admin/shared/SearchableSelect";
import { AITrendResponse } from "@/types/statistics";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5101/api";

type TabType = "overview" | "revenue" | "products" | "trends";

export default function AdminStatisticsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("overview");

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

  // AI Trend state
  const [trendData, setTrendData] = useState<AITrendResponse | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);

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
    const token = typeof window !== "undefined" ? (localStorage.getItem("token") || sessionStorage.getItem("token")) : null;
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

  // Fetch AI Trends Data
  const fetchTrendData = useCallback(async () => {
    // Validate range is <= 6 months
    const start = new Date(fromDate);
    const end = new Date(toDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 186) return;

    setLoadingAI(true);
    try {
      const params = new URLSearchParams({
        fromDate,
        toDate,
      });
      if (selectedProduct) params.append("productID", selectedProduct);
      if (selectedCategory) params.append("categoryID", selectedCategory);
      if (selectedBrand) params.append("supplierID", selectedBrand);

      const res = await fetch(`${API_BASE_URL}/Statistics/ai-trends?${params.toString()}`, {
        headers: getHeaders(),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setTrendData(result.data);
      }
    } catch (error) {
      console.error("Error fetching AI trend data:", error);
    } finally {
      setLoadingAI(false);
    }
  }, [fromDate, toDate, selectedProduct, selectedCategory, selectedBrand, getHeaders]);

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

  useEffect(() => {
    if (activeTab === "trends") {
      fetchTrendData();
    }
  }, [activeTab, fetchTrendData]);

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
    if (activeTab === "trends") {
      fetchTrendData();
    }
    toast.success("Đã làm mới dữ liệu thống kê!");
  };

  // Check date limit for UI validation styling
  const isDateLimitExceeded = () => {
    const start = new Date(fromDate);
    const end = new Date(toDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 186;
  };

  // Filter Section UI (can be passed to tabs)
  const filterSection = (
    <div className="p-6 border-b border-slate-100 no-print">
      <div className="flex items-center gap-2 mb-6 pb-3 border-b border-slate-100">
        <span className="material-symbols-outlined text-primary">filter_alt</span>
        <h2 className="font-bold text-slate-800 text-sm">Bộ lọc tìm kiếm</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div>
          <label className="block text-slate-500 font-bold text-xs uppercase tracking-wider mb-2">Từ ngày</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className={`w-full px-4 py-3 bg-white border rounded font-semibold text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer ${
              isDateLimitExceeded() ? "border-rose-500 bg-rose-50/50" : "border-slate-200"
            }`}
          />
        </div>
        <div>
          <label className="block text-slate-500 font-bold text-xs uppercase tracking-wider mb-2">Đến ngày</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className={`w-full px-4 py-3 bg-white border rounded font-semibold text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer ${
              isDateLimitExceeded() ? "border-rose-500 bg-rose-50/50" : "border-slate-200"
            }`}
          />
        </div>
        <div>
          <label className="block text-slate-500 font-bold text-xs uppercase tracking-wider mb-2">Danh mục</label>
          <SearchableSelect
            options={[{ value: "", label: "Tất cả danh mục" }, ...categoriesList.map(c => ({ value: c.categoryID, label: c.categoryName }))]}
            value={selectedCategory}
            onChange={(val) => setSelectedCategory(val)}
            placeholder="Tất cả danh mục"
            searchPlaceholder="Tìm kiếm danh mục..."
          />
        </div>
        <div>
          <label className="block text-slate-500 font-bold text-xs uppercase tracking-wider mb-2">Thương hiệu</label>
          <SearchableSelect
            options={[{ value: "", label: "Tất cả thương hiệu" }, ...brandsList.map(b => ({ value: b.supplierID, label: b.supplierName }))]}
            value={selectedBrand}
            onChange={(val) => setSelectedBrand(val)}
            placeholder="Tất cả thương hiệu"
            searchPlaceholder="Tìm kiếm thương hiệu..."
          />
        </div>
        <div>
          <label className="block text-slate-500 font-bold text-xs uppercase tracking-wider mb-2">Sản phẩm</label>
          <SearchableSelect
            options={[{ value: "", label: "Tất cả sản phẩm" }, ...productsList.map(p => ({ value: p.productID, label: `[${p.code}] ${p.productName}` }))]}
            value={selectedProduct}
            onChange={(val) => setSelectedProduct(val)}
            placeholder="Tất cả sản phẩm"
            searchPlaceholder="Tìm kiếm sản phẩm..."
          />
        </div>
        <div>
          <label className="block text-slate-500 font-bold text-xs uppercase tracking-wider mb-2">Nhóm theo</label>
          <SearchableSelect
            options={[
              { value: "", label: "Tự động (Ngày/Tháng)" },
              { value: "Day", label: "Theo ngày" },
              { value: "Month", label: "Theo tháng" },
              { value: "Quarter", label: "Theo quý" },
              { value: "Year", label: "Theo năm" },
            ]}
            value={groupType}
            onChange={(val) => setGroupType(val)}
            placeholder="Nhóm theo..."
            searchPlaceholder="Tìm cách nhóm..."
          />
        </div>
      </div>
      
      {/* Date limit error message */}
      {isDateLimitExceeded() && (
        <div className="mt-4 p-4 bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold rounded flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">error</span>
          <span>Khoảng thời gian không được vượt quá 6 tháng (186 ngày). Vui lòng chọn lại.</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 min-h-screen pb-12">
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print mb-8">
        <div>
          <h1 className="font-headline-md text-headline-md text-primary font-bold">Báo cáo & Thống kê Doanh thu</h1>
          <p className="font-body-md text-body-md text-on-surface-variant/70">
            Phân tích chuyên sâu về hiệu suất kinh doanh, tồn kho và các mặt hàng bán chạy.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 shrink-0">
          <button
            onClick={handleRefresh}
            className="border border-primary/20 text-primary bg-white hover:bg-primary/5 px-5 py-2.5 rounded-[8px] font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            Làm mới
          </button>
          <button
            onClick={handleExportExcel}
            className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-[8px] font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">file_export</span>
            Xuất Excel
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 mb-6 no-print overflow-x-auto hide-scrollbar">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-6 py-3 font-bold text-sm whitespace-nowrap transition-colors border-b-2 ${
            activeTab === "overview" ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">dashboard</span>
            Tổng quan
          </div>
        </button>
        <button
          onClick={() => setActiveTab("revenue")}
          className={`px-6 py-3 font-bold text-sm whitespace-nowrap transition-colors border-b-2 ${
            activeTab === "revenue" ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">pie_chart</span>
            Cơ cấu doanh thu
          </div>
        </button>
        <button
          onClick={() => setActiveTab("products")}
          className={`px-6 py-3 font-bold text-sm whitespace-nowrap transition-colors border-b-2 ${
            activeTab === "products" ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">inventory_2</span>
            Sản phẩm & Tồn kho
          </div>
        </button>
        <button
          onClick={() => setActiveTab("trends")}
          className={`px-6 py-3 font-bold text-sm whitespace-nowrap transition-colors border-b-2 ${
            activeTab === "trends" ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">auto_graph</span>
            Xu hướng & Dự báo AI
          </div>
        </button>
      </div>



      {/* Filter and Tab Content wrapped in ONE Master Card */}
      <section className="bg-white rounded-[8px] shadow-sm border border-slate-100 mb-8 overflow-hidden animate-in fade-in duration-300">
        
        {/* Filter is passed down or rendered before tabs based on active tab */}
        {activeTab !== "overview" && filterSection}

        {loading ? (
        <div className="space-y-6">
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded shadow-sm border border-slate-100 animate-pulse h-28"></div>
              ))}
            </div>
          )}
          {activeTab === "overview" && filterSection}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-6 rounded border border-slate-100 shadow-sm h-96 animate-pulse"></div>
            <div className="bg-white p-6 rounded border border-slate-100 shadow-sm h-96 animate-pulse"></div>
          </div>
        </div>
      ) : data ? (
        <>
          {activeTab === "overview" && (
            <OverviewTab 
              summary={data.summary} 
              timeSeriesData={data.timeSeriesData} 
              isChartReady={isChartReady} 
              filterSection={filterSection}
            />
          )}

          {activeTab === "revenue" && (
            <RevenueTab 
              categoryStats={data.categoryStats} 
              brandStats={data.brandStats} 
              isChartReady={isChartReady} 
            />
          )}

          {activeTab === "products" && (
            <ProductsTab 
              topProducts={data.topProducts}
              isChartReady={isChartReady}
              productBreakdown={productBreakdown}
              productPage={productPage}
              productPageSize={productPageSize}
              productTotalPages={productTotalPages}
              productTotalItems={productTotalItems}
              productSearch={productSearch}
              setProductPage={setProductPage}
              setProductSearch={setProductSearch}
              loadingTable={loadingTable}
            />
          )}

          {activeTab === "trends" && (
            <TrendsTab 
              trendData={trendData}
              isChartReady={isChartReady}
              loadingAI={loadingAI}
            />
          )}
        </>
      ) : (
        <div className="mt-6 p-12 rounded border border-slate-100 bg-slate-50 text-center text-slate-400">
          <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">bar_chart</span>
          <p className="font-semibold text-sm">Không có dữ liệu trong khoảng thời gian đã chọn.</p>
        </div>
      )}
      </section>
    </div>
  );
}
