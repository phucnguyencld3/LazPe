"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { formatCurrency } from "@/lib/utils/formatters";
import { DashboardSummary, TimeSeriesStat } from "@/types/statistics";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface OverviewTabProps {
  summary: DashboardSummary;
  timeSeriesData: TimeSeriesStat[];
  isChartReady: boolean;
  filterSection?: React.ReactNode;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ summary, timeSeriesData, isChartReady, filterSection }) => {
  // Format percent formatting
  const formatPercent = (val: number) => {
    return `${val > 0 ? "+" : ""}${val}%`;
  };

  const getTimeSeriesChartConfig = () => {
    if (!timeSeriesData || timeSeriesData.length === 0) return null;

    const categories = timeSeriesData.map((d) => d.timeLabel);
    const revenueSeries = timeSeriesData.map((d) => d.revenue);
    const ordersSeries = timeSeriesData.map((d) => d.ordersCount);

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
          toolbar: { show: false },
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
          size: 5,
          hover: { size: 7 },
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
          shared: false,
          intersect: true,
          followCursor: true,
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

  const mixedChart = getTimeSeriesChartConfig();

  return (
    <div className="space-y-6">
      {/* KPI Dashboard Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 kpi-print">
        {/* Revenue card */}
        <div className="bg-white p-5 rounded shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-all duration-300 print-card min-h-[135px]">
          <div className="flex justify-between items-start w-full">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                payments
              </span>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 ${
              summary.revenueGrowthRate >= 0 ? "text-green-600 bg-green-50" : "text-rose-600 bg-rose-50"
            }`}>
              <span className="material-symbols-outlined text-[9px] font-bold">
                {summary.revenueGrowthRate >= 0 ? "arrow_upward" : "arrow_downward"}
              </span>
              {formatPercent(summary.revenueGrowthRate)}
            </span>
          </div>
          <div className="mt-4">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest block">Doanh thu thuần</span>
            <span className="text-xl font-extrabold text-slate-850 mt-1 block truncate" title={formatCurrency(summary.totalRevenue)}>
              {formatCurrency(summary.totalRevenue)}
            </span>
            <span className="text-[9px] text-slate-400 mt-0.5 block">So với kỳ trước</span>
          </div>
        </div>

        {/* Orders count card */}
        <div className="bg-white p-5 rounded shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-all duration-300 print-card min-h-[135px]">
          <div className="flex justify-between items-start w-full">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 shrink-0">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                shopping_bag
              </span>
            </div>
            <div className="flex items-center gap-1 text-[9px] font-bold">
              <span className="text-green-600">{summary.completedOrders} HT</span>
              <span className="text-slate-300">|</span>
              <span className="text-rose-600">{summary.cancelledOrders} Hủy</span>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest block">Đơn hàng</span>
            <span className="text-xl font-extrabold text-slate-850 mt-1 block">
              {summary.totalOrders}
            </span>
            <span className="text-[9px] text-slate-400 mt-0.5 block">Tổng số đơn hàng</span>
          </div>
        </div>

        {/* Products sold card */}
        <div className="bg-white p-5 rounded shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-all duration-300 print-card min-h-[135px]">
          <div className="flex justify-between items-start w-full">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                inventory
              </span>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest block">Sản phẩm đã bán</span>
            <span className="text-xl font-extrabold text-slate-850 mt-1 block">
              {summary.totalProductsSold.toLocaleString()}
            </span>
            <span className="text-[9px] text-slate-400 mt-0.5 block">Khối lượng xuất kho</span>
          </div>
        </div>

        {/* Total customers card */}
        <div className="bg-white p-5 rounded shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-all duration-300 print-card min-h-[135px]">
          <div className="flex justify-between items-start w-full">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                group
              </span>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest block">Số khách hàng</span>
            <span className="text-xl font-extrabold text-slate-850 mt-1 block">
              {summary.totalCustomers}
            </span>
            <span className="text-[9px] text-slate-400 mt-0.5 block">Đã thanh toán</span>
          </div>
        </div>

        {/* Average order value card */}
        <div className="bg-white p-5 rounded shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-all duration-300 print-card min-h-[135px]">
          <div className="flex justify-between items-start w-full">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                price_check
              </span>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest block">Đơn hàng TB</span>
            <span className="text-xl font-extrabold text-slate-850 mt-1 block truncate" title={formatCurrency(summary.averageOrderValue)}>
              {formatCurrency(summary.averageOrderValue)}
            </span>
            <span className="text-[9px] text-slate-400 mt-0.5 block">Bình quân đơn hàng</span>
          </div>
        </div>
      </div>

      {filterSection}

      {/* Mixed Trend Chart */}
      <div className="bg-white rounded border border-slate-100 shadow-sm p-6 print-card">
        <h3 className="font-bold text-slate-800 text-base mb-6">Xu hướng Doanh thu & Đơn hàng</h3>
        {isChartReady && mixedChart ? (
          <Chart
            options={mixedChart.options}
            series={mixedChart.series}
            type="line"
            height={360}
          />
        ) : (
          <div className="h-[360px] flex items-center justify-center text-slate-400 text-sm font-semibold">
            Đang tải biểu đồ...
          </div>
        )}
      </div>
    </div>
  );
};
