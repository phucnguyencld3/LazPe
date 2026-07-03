"use client";

import React from "react";
import dynamic from "next/dynamic";
import { formatCurrency } from "@/lib/utils/formatters";
import { TopProducts, ProductStat } from "@/types/statistics";
import { Pagination } from "@/components/admin/shared/Pagination";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface ProductsTabProps {
  topProducts: TopProducts;
  isChartReady: boolean;
  productBreakdown: ProductStat[];
  productPage: number;
  productPageSize: number;
  productTotalPages: number;
  productTotalItems: number;
  productSearch: string;
  setProductPage: (page: number) => void;
  setProductSearch: (search: string) => void;
  loadingTable: boolean;
}

export const ProductsTab: React.FC<ProductsTabProps> = ({
  topProducts,
  isChartReady,
  productBreakdown,
  productPage,
  productPageSize,
  productTotalPages,
  productTotalItems,
  productSearch,
  setProductPage,
  setProductSearch,
  loadingTable,
}) => {
  // Top Products Bar Chart Config
  const getProductChartConfig = () => {
    if (!topProducts || !topProducts.bestSellers) return null;

    const names = topProducts.bestSellers.map((p) => p.productName);
    const sold = topProducts.bestSellers.map((p) => p.quantitySold);

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

  const productChart = getProductChartConfig();

  return (
    <div className="space-y-6">
      {/* Top Sellers chart */}
      <div className="bg-white rounded border border-slate-100 shadow-sm p-6 print-card">
        <h3 className="font-bold text-slate-800 text-base mb-6">Top 5 Sản phẩm Bán chạy</h3>
        {isChartReady && productChart ? (
          <Chart
            options={productChart.options}
            series={productChart.series}
            type="bar"
            height={320}
          />
        ) : (
          <div className="h-[320px] flex items-center justify-center text-slate-400 text-sm font-semibold">
            {isChartReady ? "Không có dữ liệu" : "Đang tải biểu đồ..."}
          </div>
        )}
      </div>

      {/* Product Inventory Tops: Low vs High Stocks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Highest Stock products */}
        <div className="bg-white rounded border border-slate-100 shadow-sm p-6 print-card">
          <h3 className="font-bold text-slate-800 text-base mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-500">warehouse</span>
            Sản phẩm Tồn kho cao nhất
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-[11px] font-bold text-slate-400 tracking-widest uppercase">
                  <th className="px-6 py-4 text-center w-[80px]">STT</th>
                  <th className="px-6 py-4">MÃ SP</th>
                  <th className="px-6 py-4">TÊN SẢN PHẨM</th>
                  <th className="px-6 py-4 text-right">TỒN KHO HỆ THỐNG</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topProducts?.highestStock?.map((prod, idx) => (
                  <tr key={prod.productID} className="hover:bg-slate-100/70 transition-colors group">
                    <td className="px-6 py-4 text-center text-xs font-semibold text-slate-400">{idx + 1}</td>
                    <td className="px-6 py-4 font-mono text-primary font-bold text-xs">{prod.productCode}</td>
                    <td className="px-6 py-4 font-semibold text-slate-700 truncate max-w-[200px]" title={prod.productName}>
                      {prod.productName}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-indigo-600">{prod.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Lowest Stock products */}
        <div className="bg-white rounded border border-slate-100 shadow-sm p-6 print-card">
          <h3 className="font-bold text-rose-700 text-base mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-rose-500">warning</span>
            Sản phẩm Cảnh báo hết hàng
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-[11px] font-bold text-slate-400 tracking-widest uppercase">
                  <th className="px-6 py-4 text-center w-[80px]">STT</th>
                  <th className="px-6 py-4">MÃ SP</th>
                  <th className="px-6 py-4">TÊN SẢN PHẨM</th>
                  <th className="px-6 py-4 text-right">TỒN KHO HỆ THỐNG</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topProducts?.lowestStock?.map((prod, idx) => (
                  <tr key={prod.productID} className="hover:bg-slate-100/70 transition-colors group">
                    <td className="px-6 py-4 text-center text-xs font-semibold text-slate-400">{idx + 1}</td>
                    <td className="px-6 py-4 font-mono text-primary font-bold text-xs">{prod.productCode}</td>
                    <td className="px-6 py-4 font-semibold text-slate-700 truncate max-w-[200px]" title={prod.productName}>
                      {prod.productName}
                    </td>
                    <td className="px-6 py-4 text-right font-bold">
                      {prod.stock <= 5 ? (
                        <span className="bg-rose-50 text-rose-700 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                          {prod.stock} (Cực thấp)
                        </span>
                      ) : (
                        <span className="text-rose-600">{prod.stock}</span>
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
      <div className="bg-white rounded border border-slate-100 shadow-sm p-6 print-card">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h3 className="font-bold text-slate-800 text-base">Báo cáo Sản phẩm Bán ra Chi tiết</h3>
            <p className="text-slate-400 text-xs font-semibold mt-1">Bao gồm tất cả sản phẩm đang kinh doanh và hiệu suất trong khoảng lọc.</p>
          </div>
          <div className="relative w-full md:w-80 no-print">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              search
            </span>
            <input
              type="text"
              placeholder="Tìm theo mã hoặc tên sản phẩm..."
              value={productSearch}
              onChange={(e) => {
                setProductSearch(e.target.value);
                setProductPage(1);
              }}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded font-semibold text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-[11px] font-bold text-slate-400 tracking-widest uppercase">
                <th className="px-6 py-4 text-center w-[80px]">STT</th>
                <th className="px-6 py-4">MÃ SẢN PHẨM</th>
                <th className="px-6 py-4">TÊN SẢN PHẨM</th>
                <th className="px-6 py-4">DANH MỤC</th>
                <th className="px-6 py-4">THƯƠNG HIỆU</th>
                <th className="px-6 py-4 text-center">TỒN KHO HIỆN TẠI</th>
                <th className="px-6 py-4 text-center">LƯỢNG ĐÃ BÁN</th>
                <th className="px-6 py-4 text-right">TỔNG DOANH THU</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loadingTable ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={8} className="py-4 px-6">
                      <div className="h-4 bg-slate-100 rounded w-full"></div>
                    </td>
                  </tr>
                ))
              ) : productBreakdown.map((prod, idx) => (
                <tr key={prod.productID} className="hover:bg-slate-100/70 transition-colors group">
                  <td className="px-6 py-4 text-center text-xs font-semibold text-slate-400">
                    {(productPage - 1) * productPageSize + idx + 1}
                  </td>
                  <td className="px-6 py-4 font-mono text-primary font-bold text-xs">{prod.productCode}</td>
                  <td className="px-6 py-4 font-semibold text-slate-700 truncate max-w-xs" title={prod.productName}>
                    {prod.productName}
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium">{prod.categoryName}</td>
                  <td className="px-6 py-4 text-slate-600 font-medium">{prod.supplierName}</td>
                  <td className="px-6 py-4 text-center text-slate-700 font-medium">{prod.stock}</td>
                  <td className="px-6 py-4 text-center font-bold text-indigo-600">{prod.quantitySold}</td>
                  <td className="px-6 py-4 text-right font-bold text-green-600">
                    {formatCurrency(prod.totalRevenue)}
                  </td>
                </tr>
              ))}
              {productBreakdown.length === 0 && !loadingTable && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400 font-medium">
                    Không tìm thấy sản phẩm nào khớp với tìm kiếm.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {productTotalPages > 1 && (
          <div className="no-print mt-2 rounded-xl overflow-hidden">
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
    </div>
  );
};
