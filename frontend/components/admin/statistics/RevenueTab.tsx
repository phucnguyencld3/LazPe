"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { formatCurrency } from "@/lib/utils/formatters";
import { CategoryStat, BrandStat } from "@/types/statistics";
import { Pagination } from "@/components/admin/shared/Pagination";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface RevenueTabProps {
  categoryStats: CategoryStat[];
  brandStats: BrandStat[];
  isChartReady: boolean;
}

export const RevenueTab: React.FC<RevenueTabProps> = ({ categoryStats, brandStats, isChartReady }) => {
  // Pagination State
  const [categoryPage, setCategoryPage] = useState(1);
  const [brandPage, setBrandPage] = useState(1);
  const pageSize = 10;

  const categoryTotalPages = Math.ceil((categoryStats?.length || 0) / pageSize);
  const brandTotalPages = Math.ceil((brandStats?.length || 0) / pageSize);

  const paginatedCategories = (categoryStats || []).slice((categoryPage - 1) * pageSize, categoryPage * pageSize);
  const paginatedBrands = (brandStats || []).slice((brandPage - 1) * pageSize, brandPage * pageSize);

  // Category Pie Chart Config
  const getCategoryChartConfig = () => {
    if (!categoryStats) return null;

    const activeCats = categoryStats.filter((c) => c.totalRevenue > 0);
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
              chart: { width: 200 },
              legend: { position: "bottom" as const },
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
    if (!brandStats) return null;

    const activeBrands = brandStats.filter((b) => b.totalRevenue > 0);
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

  const categoryChart = getCategoryChartConfig();
  const supplierChart = getSupplierChartConfig();

  return (
    <div className="space-y-6">
      {/* Category & Supplier share distributions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Pie Chart */}
        <div className="bg-white rounded border border-slate-100 shadow-sm p-6 print-card">
          <h3 className="font-bold text-slate-800 text-base mb-6">Doanh thu theo Danh mục</h3>
          {isChartReady && categoryChart && categoryChart.series.length > 0 ? (
            <Chart
              options={categoryChart.options}
              series={categoryChart.series}
              type="donut"
              height={320}
            />
          ) : (
            <div className="h-[320px] flex items-center justify-center text-slate-400 text-sm font-semibold">
              {isChartReady ? "Không có dữ liệu doanh thu" : "Đang tải biểu đồ..."}
            </div>
          )}
        </div>

        {/* Brand Pie Chart */}
        <div className="bg-white rounded border border-slate-100 shadow-sm p-6 print-card">
          <h3 className="font-bold text-slate-800 text-base mb-6">Doanh thu theo Thương hiệu</h3>
          {isChartReady && supplierChart && supplierChart.series.length > 0 ? (
            <Chart
              options={supplierChart.options}
              series={supplierChart.series}
              type="donut"
              height={320}
            />
          ) : (
            <div className="h-[320px] flex items-center justify-center text-slate-400 text-sm font-semibold">
              {isChartReady ? "Không có dữ liệu doanh thu" : "Đang tải biểu đồ..."}
            </div>
          )}
        </div>
      </div>

      {/* Category list table & Supplier ranking table */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Categories list */}
        <div className="lg:col-span-3 bg-white rounded border border-slate-100 shadow-sm p-6 print-card flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-base mb-6">Chi tiết Danh mục</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-[11px] font-bold text-slate-400 tracking-widest uppercase">
                    <th className="px-4 py-3 text-center w-12">STT</th>
                    <th className="px-4 py-3">TÊN DANH MỤC</th>
                    <th className="px-4 py-3 text-center">SỐ SẢN PHẨM</th>
                    <th className="px-4 py-3 text-center">ĐÃ BÁN</th>
                    <th className="px-4 py-3 text-right">TỔNG DOANH THU</th>
                    <th className="px-4 py-3 text-right">TỶ TRỌNG</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedCategories.map((cat, idx) => (
                    <tr key={cat.categoryID} className="hover:bg-slate-100/70 transition-colors group">
                      <td className="px-4 py-3 text-center text-xs font-semibold text-slate-400">
                        {(categoryPage - 1) * pageSize + idx + 1}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-700">{cat.categoryName}</td>
                      <td className="px-4 py-3 text-center text-slate-600 font-medium">{cat.totalProducts}</td>
                      <td className="px-4 py-3 text-center font-bold text-slate-700">{cat.quantitySold}</td>
                      <td className="px-4 py-3 text-right font-bold text-green-600">
                        {formatCurrency(cat.totalRevenue)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-500">
                        {cat.revenueSharePercentage}%
                      </td>
                    </tr>
                  ))}
                  {paginatedCategories.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400 font-medium">
                        Không tìm thấy danh mục nào.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {categoryTotalPages > 1 && (
            <div className="no-print mt-2 rounded-xl overflow-hidden">
              <Pagination
                currentPage={categoryPage}
                totalPages={categoryTotalPages}
                totalItems={categoryStats.length}
                itemsPerPage={pageSize}
                onPageChange={(page) => setCategoryPage(page)}
              />
            </div>
          )}
        </div>

        {/* Supplier list */}
        <div className="lg:col-span-2 bg-white rounded border border-slate-100 shadow-sm p-6 print-card flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-base mb-6">Bảng xếp hạng Thương hiệu</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-[11px] font-bold text-slate-400 tracking-widest uppercase">
                    <th className="px-3 py-3 text-center w-12">STT</th>
                    <th className="px-3 py-3">THƯƠNG HIỆU</th>
                    <th className="px-3 py-3 text-center">ĐÃ BÁN</th>
                    <th className="px-3 py-3 text-right">DOANH THU</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedBrands.map((brand, idx) => {
                    const globalIdx = (brandPage - 1) * pageSize + idx;
                    return (
                      <tr key={brand.supplierID} className="hover:bg-slate-100/70 transition-colors group">
                        <td className="px-3 py-3 text-center font-bold text-slate-700">
                          {globalIdx === 0 ? (
                            <span className="text-yellow-500 flex items-center justify-center text-base">🏆</span>
                          ) : globalIdx === 1 ? (
                            <span className="text-slate-400 flex items-center justify-center text-base">🥈</span>
                          ) : globalIdx === 2 ? (
                            <span className="text-amber-600 flex items-center justify-center text-base">🥉</span>
                          ) : (
                            globalIdx + 1
                          )}
                        </td>
                        <td className="px-3 py-3 font-semibold text-slate-700">{brand.supplierName}</td>
                        <td className="px-3 py-3 text-center font-bold text-slate-700">{brand.quantitySold}</td>
                        <td className="px-3 py-3 text-right font-bold text-green-600">
                          {formatCurrency(brand.totalRevenue)}
                        </td>
                      </tr>
                    );
                  })}
                  {paginatedBrands.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-slate-400 font-medium">
                        Không tìm thấy thương hiệu nào.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {brandTotalPages > 1 && (
            <div className="no-print mt-2 rounded-xl overflow-hidden">
              <Pagination
                currentPage={brandPage}
                totalPages={brandTotalPages}
                totalItems={brandStats.length}
                itemsPerPage={pageSize}
                onPageChange={(page) => setBrandPage(page)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
