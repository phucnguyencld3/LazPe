import React from "react";
import dynamic from "next/dynamic";
import { AITrendResponse } from "@/types/statistics";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface TrendsTabProps {
  trendData: AITrendResponse | null;
  isChartReady: boolean;
  loadingAI: boolean;
}

export const TrendsTab: React.FC<TrendsTabProps> = ({ trendData, isChartReady, loadingAI }) => {
  const [isTraining, setIsTraining] = React.useState(false);

  const handleTrainAI = async () => {
    try {
      setIsTraining(true);
      const token = typeof window !== "undefined" ? (localStorage.getItem("token") || sessionStorage.getItem("token")) : null;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5101/api"}/Statistics/train-ai`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        import("@/lib/toast").then(m => m.toast.success("Đã huấn luyện AI thành công! Vui lòng F5 lại trang để xem kết quả."));
      } else {
        import("@/lib/toast").then(m => m.toast.error(data.message || "Huấn luyện AI thất bại"));
      }
    } catch (error) {
      console.error(error);
      import("@/lib/toast").then(m => m.toast.error("Lỗi kết nối khi huấn luyện AI"));
    } finally {
      setIsTraining(false);
    }
  };

  if (loadingAI) {
    return (
      <div className="bg-white p-12 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center">
        <span className="material-symbols-outlined text-4xl text-primary animate-spin mb-4">settings</span>
        <p className="font-semibold text-slate-500">Đang khởi tạo thuật toán AI và dự đoán dữ liệu...</p>
      </div>
    );
  }

  if (!trendData || (!trendData.historicalData.length && !trendData.forecastData.length)) {
    return (
      <div className="bg-white p-12 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center">
        <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">query_stats</span>
        <p className="font-semibold text-slate-500 mb-4">Mô hình AI chưa được huấn luyện hoặc không đủ dữ liệu.</p>
        <button 
          onClick={handleTrainAI}
          disabled={isTraining}
          className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 transition-all shadow-md disabled:opacity-50"
        >
          <span className={`material-symbols-outlined text-[18px] ${isTraining ? 'animate-spin' : ''}`}>
            {isTraining ? 'autorenew' : 'model_training'}
          </span>
          {isTraining ? 'Đang huấn luyện AI...' : 'Huấn luyện AI ngay'}
        </button>
      </div>
    );
  }

  const allData = [...trendData.historicalData, ...trendData.forecastData];
  const categories = allData.map(d => d.timeLabel);
  
  // Historical series
  const actualData = allData.map(d => !d.isForecast ? d.productsSoldCount : null);
  
  // Forecast series
  const forecastData = allData.map(d => d.isForecast ? d.productsSoldCount : null);
  
  // To connect the lines, we can copy the last actual data point to the first forecast data point
  const lastActualIndex = trendData.historicalData.length - 1;
  if (lastActualIndex >= 0 && trendData.forecastData.length > 0) {
    forecastData[lastActualIndex] = actualData[lastActualIndex];
  }

  const chartOptions: any = {
    chart: {
      type: "line",
      toolbar: { show: false },
      zoom: { enabled: false },
      fontFamily: "inherit",
    },
    colors: ["#3b82f6", "#10b981"], // Blue for actual, Emerald for forecast
    stroke: {
      curve: "smooth",
      width: [3, 3],
      dashArray: [0, 5] // Solid line for actual, Dashed line for forecast
    },
    xaxis: {
      categories: categories,
      labels: {
        style: { colors: "#94a3b8", fontSize: "12px" }
      },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      labels: {
        style: { colors: "#94a3b8", fontSize: "12px" },
        formatter: (val: number) => Math.round(val)
      }
    },
    legend: {
      position: "top",
      horizontalAlign: "right"
    },
    grid: {
      borderColor: "#f1f5f9",
      strokeDashArray: 4,
      xaxis: { lines: { show: true } },
      yaxis: { lines: { show: true } },
    },
    tooltip: {
      shared: false,
      intersect: true,
      followCursor: true,
      y: {
        formatter: (val: number) => {
          if (val === null || val === undefined) return val;
          return `${Math.round(val)} sản phẩm`;
        }
      }
    },
    markers: {
      size: [0, 4], // Show markers only for forecast to make it pop
      hover: { sizeOffset: 3 }
    }
  };

  const chartSeries = [
    {
      name: "Số lượng bán thực tế",
      data: actualData
    },
    {
      name: "AI Dự báo (14 ngày tới)",
      data: forecastData
    }
  ];

  return (
    <div className="space-y-6">

      <div className="bg-white rounded border border-slate-100 shadow-sm p-6 print-card">
        <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">ssid_chart</span>
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Dự báo Xu hướng Bán hàng (Time Series)</h3>
              <p className="text-sm text-slate-500">Mô hình SSA dự đoán số lượng sản phẩm tiêu thụ trong 14 ngày tới</p>
            </div>
          </div>
        </div>
        
        {isChartReady ? (
          <div className="h-96">
            <ReactApexChart options={chartOptions} series={chartSeries} type="line" height="100%" />
          </div>
        ) : (
          <div className="h-96 flex items-center justify-center bg-slate-50 rounded-xl border border-slate-100 border-dashed">
            <span className="material-symbols-outlined text-slate-300 animate-spin">refresh</span>
          </div>
        )}
      </div>

      {trendData.trendingProducts && trendData.trendingProducts.length > 0 && (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 print-card">
          <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-amber-500">local_fire_department</span>
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Dự báo Mặt hàng Bán chạy (Trending Products)</h3>
                <p className="text-sm text-slate-500">AI phân tích gia tốc bán hàng 7 ngày qua để tìm ra mặt hàng có tỷ lệ tăng trưởng cao nhất</p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="pb-4 font-bold pl-4">Sản phẩm</th>
                  <th className="pb-4 font-bold text-right">7 Ngày trước</th>
                  <th className="pb-4 font-bold text-right">7 Ngày qua</th>
                  <th className="pb-4 font-bold text-right pr-4">Gia tốc bán hàng (Dự báo)</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {trendData.trendingProducts.map((p, idx) => (
                  <tr key={p.productID} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                    <td className="py-4 pl-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                          #{idx + 1}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 group-hover:text-primary transition-colors">{p.productName}</p>
                          <p className="text-xs text-slate-500 font-mono mt-0.5">{p.productCode}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-right text-slate-500 font-medium">
                      {p.previousPeriodSales} <span className="text-xs">sp</span>
                    </td>
                    <td className="py-4 text-right font-bold text-slate-800">
                      {p.currentPeriodSales} <span className="text-xs text-slate-500 font-medium">sp</span>
                    </td>
                    <td className="py-4 text-right pr-4">
                      <div className="flex items-center justify-end gap-1.5">
                        {p.growthRate > 0 ? (
                          <span className="material-symbols-outlined text-[16px] text-emerald-500">trending_up</span>
                        ) : p.growthRate < 0 ? (
                          <span className="material-symbols-outlined text-[16px] text-rose-500">trending_down</span>
                        ) : (
                          <span className="material-symbols-outlined text-[16px] text-slate-400">horizontal_rule</span>
                        )}
                        <span className={`font-bold ${p.growthRate > 0 ? 'text-emerald-500' : p.growthRate < 0 ? 'text-rose-500' : 'text-slate-500'}`}>
                          {p.growthRate > 0 ? '+' : ''}{p.growthRate}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
