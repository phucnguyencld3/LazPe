"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Loader, Wallet, ShoppingBag, Gift, Award, TrendingUp, AlertCircle, ShoppingCart } from "lucide-react";
import { getSpendingDashboard } from "@/lib/api";
import { formatCurrency } from "@/lib/utils/formatters";

// Dynamically import ApexCharts to prevent SSR Hydration Errors in Next.js
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface SpendingDashboardData {
  totalSpent: number;
  totalOrders: number;
  totalSaved: number;
  availablePoints: number;
  vipTier: string;
  vipColor: string;
  monthlySpending: Array<{
    month: number;
    year: number;
    amount: number;
  }>;
  categorySpending: Array<{
    categoryID: number;
    categoryName: string;
    amount: number;
    percentage: number;
  }>;
  topProducts: Array<{
    productID: number;
    productName: string;
    quantity: number;
    totalPrice: number;
    imageUrl?: string;
  }>;
}

interface SpendingSectionProps {
  token: string | null;
}

export function SpendingSection({ token }: SpendingSectionProps) {
  const [data, setData] = useState<SpendingDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isChartReady, setIsChartReady] = useState<boolean>(false);

  useEffect(() => {
    if (!token) {
      setError("Vui lòng đăng nhập để xem thông tin chi tiêu.");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await getSpendingDashboard(token);
        if (result && result.success && result.data) {
          setData(result.data);
          // Trì hoãn hiển thị biểu đồ để đảm bảo container DOM ổn định
          setTimeout(() => {
            setIsChartReady(true);
          }, 200);
        } else {
          setError(result?.message || "Không thể lấy dữ liệu phân tích chi tiêu.");
        }
      } catch (err) {
        console.error("Error fetching spending dashboard:", err);
        setError("Lỗi kết nối đến máy chủ. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-100 p-8 shadow-sm">
        <Loader className="animate-spin text-primary mb-4" size={40} />
        <p className="text-slate-500 font-medium">Đang tổng hợp dữ liệu chi tiêu cá nhân của bạn...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[300px] flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-slate-100 p-8 shadow-sm">
        <AlertCircle className="text-rose-500 mb-4" size={48} />
        <h3 className="text-lg font-bold text-slate-800 mb-2">Đã xảy ra lỗi</h3>
        <p className="text-slate-500 max-w-md mb-6">{error}</p>
      </div>
    );
  }

  if (!data || data.totalOrders === 0) {
    return (
      <div className="min-h-[350px] flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-slate-100 p-8 shadow-sm">
        <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-4">
          <ShoppingCart size={32} />
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-2">Chưa có dữ liệu chi tiêu</h3>
        <p className="text-slate-500 max-w-sm mb-6">
          Các thống kê chi tiêu sẽ hiển thị tại đây sau khi bạn hoàn thành đơn hàng đầu tiên trên LazPe.
        </p>
      </div>
    );
  }

  // Cấu hình biểu đồ chi tiêu 12 tháng
  const getMonthlyChartConfig = () => {
    const months = data.monthlySpending.map((m) => `Tháng ${m.month}`);
    const amounts = data.monthlySpending.map((m) => m.amount);

    return {
      series: [
        {
          name: "Số tiền chi tiêu (₫)",
          data: amounts,
        },
      ],
      options: {
        chart: {
          type: "bar" as const,
          height: 320,
          toolbar: { show: false },
          fontFamily: "inherit",
        },
        plotOptions: {
          bar: {
            borderRadius: 6,
            columnWidth: "45%",
            distributed: false,
          },
        },
        colors: ["#ec4899"], // Màu hồng thương hiệu PolyBaby
        dataLabels: {
          enabled: false,
        },
        grid: {
          borderColor: "#f1f5f9",
          strokeDashArray: 4,
          yaxis: { lines: { show: true } },
        },
        xaxis: {
          categories: months,
          axisBorder: { show: false },
          axisTicks: { show: false },
          labels: {
            style: { colors: "#64748b", fontWeight: 500 },
          },
        },
        yaxis: {
          labels: {
            formatter: (val: number) => {
              if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
              if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
              return val.toString();
            },
            style: { colors: "#64748b" },
          },
        },
        tooltip: {
          y: {
            formatter: (val: number) => formatCurrency(val),
          },
        },
      },
    };
  };

  // Cấu hình biểu đồ tỉ trọng theo danh mục
  const getCategoryChartConfig = () => {
    const labels = data.categorySpending.map((c) => c.categoryName);
    const series = data.categorySpending.map((c) => c.amount);

    return {
      series: series,
      options: {
        chart: {
          type: "donut" as const,
          fontFamily: "inherit",
        },
        labels: labels,
        colors: ["#ec4899", "#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#64748b"],
        stroke: { width: 2, colors: ["#ffffff"] },
        dataLabels: { enabled: false },
        plotOptions: {
          pie: {
            donut: {
              size: "70%",
              labels: {
                show: true,
                total: {
                  show: true,
                  label: "Tổng chi tiêu",
                  formatter: () => {
                    const total = series.reduce((a, b) => a + b, 0);
                    if (total >= 1000000) return `${(total / 1000000).toFixed(2)}M`;
                    return formatCurrency(total);
                  },
                  style: {
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "#1e293b",
                  },
                },
              },
            },
          },
        },
        legend: {
          position: "bottom" as const,
          fontSize: "12px",
          fontWeight: 500,
          labels: { colors: "#475569" },
          markers: { size: 6 },
        },
        tooltip: {
          y: {
            formatter: (val: number) => formatCurrency(val),
          },
        },
      },
    };
  };

  const monthlyChart = getMonthlyChartConfig();
  const categoryChart = getCategoryChartConfig();

  return (
    <div className="bg-white rounded-[16px] shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-100">
      {/* 4 Thẻ KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-slate-100">
        {/* Tổng chi tiêu */}
        <div className="p-5 flex items-center gap-3 hover:bg-slate-50/50 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center text-pink-500 shrink-0">
            <Wallet size={20} />
          </div>
          <div className="space-y-0.5 min-w-0">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block truncate">Tổng chi tiêu</span>
            <span className="text-base font-bold text-slate-800 block truncate">
              {formatCurrency(data.totalSpent)}
            </span>
          </div>
        </div>

        {/* Số đơn hàng */}
        <div className="p-5 flex items-center gap-3 hover:bg-slate-50/50 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500 shrink-0">
            <ShoppingBag size={20} />
          </div>
          <div className="space-y-0.5 min-w-0">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block truncate">Đơn mua thành công</span>
            <span className="text-base font-bold text-slate-800 block truncate">
              {data.totalOrders} đơn hàng
            </span>
          </div>
        </div>

        {/* Tiền tiết kiệm */}
        <div className="p-5 flex items-center gap-3 hover:bg-slate-50/50 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0">
            <Gift size={20} />
          </div>
          <div className="space-y-0.5 min-w-0">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block truncate">Đã tiết kiệm được</span>
            <span className="text-base font-bold text-emerald-600 block truncate">
              {formatCurrency(data.totalSaved)}
            </span>
          </div>
        </div>

        {/* Cấp độ VIP */}
        <div className="p-5 flex items-center gap-3 hover:bg-slate-50/50 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
            <Award size={20} />
          </div>
          <div className="space-y-0.5 min-w-0 flex-1">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block truncate">Phân hạng VIP</span>
            <div className="text-base font-bold block truncate" style={{ color: data.vipColor }}>
              {data.vipTier}
            </div>
          </div>
        </div>
      </div>

      {/* Grid Biểu đồ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
        {/* Biến động chi tiêu qua các tháng */}
        <div className="lg:col-span-2 p-5 md:p-6">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-50">
            <div className="flex items-center gap-2">
              <TrendingUp className="text-pink-500" size={18} />
              <h3 className="font-bold text-slate-800 text-sm">Biến động chi tiêu theo tháng (Năm {new Date().getFullYear()})</h3>
            </div>
          </div>
          {isChartReady && monthlyChart && (
            <Chart options={monthlyChart.options} series={monthlyChart.series} type="bar" height={300} />
          )}
        </div>

        {/* Tỉ trọng danh mục chi tiêu */}
        <div className="p-5 md:p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-6 pb-3 border-b border-slate-50 shrink-0">
            <Wallet className="text-purple-500" size={18} />
            <h3 className="font-bold text-slate-800 text-sm">Cơ cấu chi tiêu danh mục</h3>
          </div>
          <div className="flex-1 flex items-center justify-center min-h-[300px]">
            {isChartReady && categoryChart && (
              <Chart options={categoryChart.options} series={categoryChart.series} type="donut" width="100%" />
            )}
          </div>
        </div>
      </div>

      {/* Top 5 sản phẩm mua nhiều nhất */}
      <div className="p-5 md:p-6">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-50">
          <ShoppingBag className="text-pink-500" size={18} />
          <h3 className="font-bold text-slate-800 text-sm">Top 5 sản phẩm mua nhiều nhất</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-2.5">Sản phẩm</th>
                <th className="py-2.5 text-center">Số lượng đã mua</th>
                <th className="py-2.5 text-right">Tổng tiền chi trả</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.topProducts.map((p, idx) => (
                <tr key={p.productID || idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-50 border border-slate-100 shrink-0 flex items-center justify-center">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.productName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-slate-300 text-lg">image</span>
                      )}
                    </div>
                    <span className="font-bold text-slate-700 line-clamp-1 max-w-[300px] sm:max-w-[450px]">
                      {p.productName}
                    </span>
                  </td>
                  <td className="py-3 text-center font-bold text-slate-600">
                    {p.quantity} sản phẩm
                  </td>
                  <td className="py-3 text-right font-extrabold text-slate-800">
                    {formatCurrency(p.totalPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
