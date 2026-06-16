"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Loader, Plus, Search, Calendar, Play, AlertTriangle, Eye, Trash2, CheckCircle, Clock, XCircle, FileText, ChevronRight } from "lucide-react";
import { toast } from "@/lib/toast";
import { 
  adminGetNotifications, 
  adminDeleteNotification, 
  adminSendNotificationNow, 
  adminCancelNotificationSchedule, 
  adminGetNotificationStats,
  adminGetTemplates,
  adminCreateTemplate,
  adminUpdateTemplate,
  adminDeleteTemplate
} from "@/lib/api";

// Import ApexCharts dynamically to avoid Hydration errors
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

type TabKey = "STATS" | "CAMPAIGNS" | "TEMPLATES";

export default function AdminNotificationsPage() {
  // State
  const [token, setToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("STATS");
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [stats, setStats] = useState<any | null>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [campaignPage, setCampaignPage] = useState(1);
  const itemsPerPage = 10;
  
  useEffect(() => {
    setCampaignPage(1);
  }, [searchTerm]);

  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    show: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const requestConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({
      show: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmModal(prev => ({ ...prev, show: false }));
      }
    });
  };

  // Template Modal States
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
  const [templateForm, setTemplateForm] = useState({
    templateName: "",
    templateCode: "",
    templateContent: "",
    isActive: true
  });

  useEffect(() => {
    const savedToken = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!savedToken) {
      window.location.replace("/login");
      return;
    }
    setToken(savedToken);
    loadTabData(savedToken, activeTab);
  }, [activeTab]);

  const loadTabData = async (authToken: string, tab: TabKey) => {
    setLoading(true);
    try {
      if (tab === "STATS") {
        const statsData = await adminGetNotificationStats(authToken);
        if (statsData) setStats(statsData);
      } else if (tab === "CAMPAIGNS") {
        const data = await adminGetNotifications(authToken);
        if (data) setCampaigns(data);
      } else if (tab === "TEMPLATES") {
        const data = await adminGetTemplates(authToken);
        if (data) setTemplates(data);
      }
    } catch (e) {
      console.error(e);
      toast.error("Lỗi khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const executeSendNow = async (id: number) => {
    if (!token) return;
    try {
      const result = await adminSendNotificationNow(token, id);
      if (result.success) {
        toast.success("Thông báo đã được phát đi thành công!");
        loadTabData(token, activeTab);
      } else {
        toast.error(result.message || "Gửi thất bại");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendNow = (id: number) => {
    requestConfirm(
      "Phát hành thông báo?",
      "Bạn có chắc chắn muốn phát hành thông báo này ngay lập tức?",
      () => executeSendNow(id)
    );
  };

  const executeCancelSchedule = async (id: number) => {
    if (!token) return;
    try {
      const result = await adminCancelNotificationSchedule(token, id);
      if (result.success) {
        toast.success("Đã hủy lịch gửi thành công");
        loadTabData(token, activeTab);
      } else {
        toast.error(result.message || "Không thể hủy lịch gửi");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelSchedule = (id: number) => {
    requestConfirm(
      "Hủy lịch gửi?",
      "Bạn có chắc chắn muốn hủy lịch gửi của thông báo này?",
      () => executeCancelSchedule(id)
    );
  };

  const executeDeleteCampaign = async (id: number) => {
    if (!token) return;
    try {
      const result = await adminDeleteNotification(token, id);
      if (result.success) {
        toast.success("Đã xóa chiến dịch thành công");
        loadTabData(token, activeTab);
      } else {
        toast.error(result.message || "Xóa thất bại");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCampaign = (id: number) => {
    requestConfirm(
      "Xóa chiến dịch?",
      "Bạn có chắc chắn muốn xóa chiến dịch này? (Dữ liệu vẫn được lưu trữ trên hệ thống)",
      () => executeDeleteCampaign(id)
    );
  };

  // Template Handlers
  const handleOpenTemplateModal = (tpl: any = null) => {
    if (tpl) {
      setEditingTemplate(tpl);
      setTemplateForm({
        templateName: tpl.templateName,
        templateCode: tpl.templateCode,
        templateContent: tpl.templateContent,
        isActive: tpl.isActive
      });
    } else {
      setEditingTemplate(null);
      setTemplateForm({
        templateName: "",
        templateCode: "",
        templateContent: "",
        isActive: true
      });
    }
    setTemplateModalOpen(true);
  };

  const handleTemplateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (!templateForm.templateName || !templateForm.templateCode || !templateForm.templateContent) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    try {
      let result;
      if (editingTemplate) {
        result = await adminUpdateTemplate(token, editingTemplate.id, templateForm);
      } else {
        result = await adminCreateTemplate(token, templateForm);
      }

      if (result.success) {
        toast.success(editingTemplate ? "Cập nhật mẫu thành công" : "Tạo mẫu mới thành công");
        setTemplateModalOpen(false);
        loadTabData(token, "TEMPLATES");
      } else {
        toast.error(result.message || "Thao tác thất bại");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const executeDeleteTemplate = async (id: number) => {
    if (!token) return;
    try {
      const result = await adminDeleteTemplate(token, id);
      if (result.success) {
        toast.success("Đã xóa mẫu thành công");
        loadTabData(token, "TEMPLATES");
      } else {
        toast.error(result.message || "Xóa thất bại");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTemplate = (id: number) => {
    requestConfirm(
      "Xóa mẫu thông báo?",
      "Bạn có chắc chắn muốn xóa mẫu thông báo này?",
      () => executeDeleteTemplate(id)
    );
  };

  // Styling Helpers
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Sent":
        return <span className="text-emerald-500 font-bold flex items-center gap-1 w-fit"><CheckCircle size={14} /> Đã gửi</span>;
      case "Scheduled":
        return <span className="text-blue-500 font-bold flex items-center gap-1 w-fit"><Clock size={14} /> Lập lịch</span>;
      case "Draft":
        return <span className="text-slate-500 font-bold flex items-center gap-1 w-fit"><FileText size={14} /> Bản nháp</span>;
      case "Cancelled":
        return <span className="text-red-500 font-bold flex items-center gap-1 w-fit"><XCircle size={14} /> Đã hủy</span>;
      default:
        return <span className="text-slate-500 font-bold w-fit">{status}</span>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "Critical":
        return <span className="text-red-500 text-sm font-bold">Khẩn cấp</span>;
      case "High":
        return <span className="text-orange-500 text-sm font-bold">Cao</span>;
      case "Medium":
        return <span className="text-blue-500 text-sm font-bold">Trung bình</span>;
      default:
        return <span className="text-slate-500 text-sm font-bold">Thấp</span>;
    }
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  const filteredCampaigns = campaigns.filter(c => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedCampaigns = filteredCampaigns.slice(
    (campaignPage - 1) * itemsPerPage,
    campaignPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredCampaigns.length / itemsPerPage);

  // Chart configs
  const timeSeriesChartOptions = stats ? {
    chart: { id: "time-series-notif", type: "line" as const, toolbar: { show: false } },
    colors: ["#ec4899", "#6366f1"],
    stroke: { curve: "smooth" as const, width: 3 },
    xaxis: { categories: stats.sentOverTime?.map((d: any) => d.date) || [] },
    markers: { size: 4 },
    dataLabels: { enabled: false },
    legend: { position: "top" as const }
  } : {};

  const timeSeriesChartSeries = stats ? [
    { name: "Số lượng gửi", data: stats.sentOverTime?.map((d: any) => d.sentCount) || [] },
    { name: "Số lượng đã đọc", data: stats.sentOverTime?.map((d: any) => d.readCount) || [] }
  ] : [];

  const typeChartOptions = stats ? {
    chart: { type: "bar" as const, toolbar: { show: false } },
    colors: ["#f43f5e"],
    plotOptions: { bar: { borderRadius: 6, horizontal: true } },
    xaxis: { categories: stats.readRatesByType?.map((t: any) => t.typeName) || [] },
    dataLabels: {
      formatter: function (val: number) {
        return val + "%";
      }
    }
  } : {};

  const typeChartSeries = stats ? [
    { name: "Tỷ lệ đọc", data: stats.readRatesByType?.map((t: any) => t.readRate) || [] }
  ] : [];

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <header className="mb-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-md text-headline-md text-primary font-bold">Quản lý Thông báo (Notification Center)</h1>
          <p className="font-body-md text-body-md text-on-surface-variant/70">Lập chiến dịch tiếp thị, gửi thông báo hệ thống và theo dõi hiệu suất tương tác</p>
        </div>

        <Link
          href="/admin/notifications/create"
          className="px-5 py-3 bg-primary hover:opacity-90 text-on-primary rounded-xl text-sm font-bold flex items-center gap-2 transition-all duration-200 active:scale-95 shadow-md w-fit"
        >
          <Plus size={16} /> Tạo thông báo mới
        </Link>
      </header>

      {/* Tabs Menu */}
      <div className="flex gap-2 border-b border-slate-200 pb-1">
        {(
          [
            { key: "STATS", label: "Thống kê hiệu quả", icon: "bar_chart" },
            { key: "CAMPAIGNS", label: "Lịch sử chiến dịch", icon: "history" },
            { key: "TEMPLATES", label: "Mẫu thông báo", icon: "file_copy" }
          ] as const
        ).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-5 py-3 rounded-t-xl text-sm font-bold transition-all border-b-2 -mb-1.5 focus:outline-none ${
              activeTab === tab.key
                ? "border-primary text-primary bg-white"
                : "border-transparent text-slate-500 hover:text-primary"
            }`}
          >
            <span className="material-symbols-outlined text-lg">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading overlay */}
      {loading ? (
        <div className="bg-white rounded-2xl p-16 border border-slate-100 shadow-sm flex flex-col items-center justify-center min-h-[400px]">
          <Loader className="animate-spin text-rose-500 mb-3" size={36} />
          <p className="text-xs text-slate-500 font-semibold">Đang tải dữ liệu...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: STATISTICS */}
          {activeTab === "STATS" && stats && (
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                  { label: "Tổng chiến dịch", value: stats.totalNotifications, icon: "campaign", color: "text-blue-500 bg-blue-50 border-blue-100" },
                  { label: "Đã phát hành", value: stats.totalSent, icon: "done_all", color: "text-emerald-500 bg-emerald-50 border-emerald-100" },
                  { label: "Tổng người nhận", value: stats.totalRecipients, icon: "groups", color: "text-purple-500 bg-purple-50 border-purple-100" },
                  { label: "Tỷ lệ đọc TB", value: `${stats.overallReadRate}%`, icon: "mark_chat_read", color: "text-pink-500 bg-pink-50 border-pink-100" },
                  { label: "Tỷ lệ tương tác", value: `${stats.engagementRate}%`, icon: "ads_click", color: "text-amber-500 bg-amber-50 border-amber-100" }
                ].map((kpi, idx) => (
                  <div key={idx} className="bg-white px-5 py-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-all duration-300 animate-in fade-in duration-300">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${kpi.color}`}>
                        <span className="material-symbols-outlined text-[20px]">{kpi.icon}</span>
                      </div>
                      <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">{kpi.label}</span>
                    </div>
                    <span className="text-2xl font-extrabold text-slate-800">{kpi.value}</span>
                  </div>
                ))}
              </div>

              {/* Charts grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sent over time */}
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
                  <h3 className="font-headline-sm text-primary font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined">timeline</span> Tương tác chiến dịch (7 ngày qua)
                  </h3>
                  <div className="h-64">
                    <Chart options={timeSeriesChartOptions} series={timeSeriesChartSeries} type="line" height="100%" />
                  </div>
                </div>

                {/* Read rates by type */}
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
                  <h3 className="font-headline-sm text-primary font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined">bar_chart</span> Hiệu suất đọc theo loại thông báo (%)
                  </h3>
                  <div className="h-64">
                    <Chart options={typeChartOptions} series={typeChartSeries} type="bar" height="100%" />
                  </div>
                </div>
              </div>

              {/* Top Campaigns table */}
              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
                <h3 className="font-headline-sm text-primary font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined">stars</span> Top 5 chiến dịch hiệu quả nhất
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100 text-sm font-bold text-slate-400 tracking-widest uppercase">
                        <th className="px-6 py-4 text-center w-[80px]">STT</th>
                        <th className="px-6 py-4">Mã</th>
                        <th className="px-6 py-4">Tiêu đề chiến dịch</th>
                        <th className="px-6 py-4">Loại thông báo</th>
                        <th className="px-6 py-4">Tổng người nhận</th>
                        <th className="px-6 py-4">Đã đọc</th>
                        <th className="px-6 py-4 pr-6 text-right">Tỷ lệ đọc</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-sm font-semibold text-slate-700">
                      {stats.topCampaigns?.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-6 text-slate-400">Chưa có chiến dịch nào được ghi nhận hiệu suất.</td>
                        </tr>
                      ) : (
                        stats.topCampaigns?.map((camp: any, index: number) => (
                          <tr key={camp.id} className="hover:bg-slate-100/70 transition-all duration-200 group">
                            <td className="px-6 py-4 text-center text-sm font-semibold text-slate-400">{index + 1}</td>
                            <td className="px-6 py-4 font-mono font-bold text-slate-400 text-sm">{camp.code}</td>
                            <td className="px-6 py-4 font-bold text-slate-800 text-sm">{camp.title}</td>
                            <td className="px-6 py-4 capitalize">{camp.type === "RewardPoints" ? "Điểm thưởng" : camp.type === "Membership" ? "Thành viên" : camp.type}</td>
                            <td className="px-6 py-4">{camp.recipientsCount}</td>
                            <td className="px-6 py-4">{camp.readCount}</td>
                            <td className="px-6 py-4 pr-6 text-rose-500 font-bold text-right">{camp.readRate}%</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CAMPAIGNS LIST */}
          {activeTab === "CAMPAIGNS" && (
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in duration-300">
              <div className="p-6 border-b border-slate-100 flex flex-wrap items-center gap-4 bg-slate-50/50">
                <div className="flex-1 min-w-[260px] relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    search
                  </span>
                  <input
                    type="text"
                    placeholder="Tìm kiếm chiến dịch bằng tiêu đề, mã..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl font-semibold text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-400/20 focus:border-rose-400 transition-all"
                  />
                </div>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="px-6 py-3 text-slate-500 font-bold text-sm rounded-2xl hover:bg-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">clear</span>
                    Xóa bộ lọc
                  </button>
                )}
                <span className="text-xs text-slate-400 font-bold ml-auto">Hiển thị {filteredCampaigns.length} chiến dịch</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100 text-sm font-bold text-slate-400 tracking-widest uppercase">
                      <th className="px-6 py-4 text-center w-[80px]">STT</th>
                      <th className="px-6 py-4">Mã</th>
                      <th className="px-6 py-4">Chiến dịch</th>
                      <th className="px-6 py-4">Đối tượng nhận</th>
                      <th className="px-6 py-4">Trạng thái</th>
                      <th className="px-6 py-4">Lịch gửi</th>
                      <th className="px-6 py-4">Tương tác</th>
                      <th className="px-6 py-4 pr-6 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-sm font-semibold text-slate-700">
                    {paginatedCampaigns.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-16 text-slate-400">
                          <span className="material-symbols-outlined text-4xl text-slate-300 mb-1">campaign</span>
                          <p className="font-medium text-xs mt-1">Không tìm thấy chiến dịch nào</p>
                        </td>
                      </tr>
                    ) : (
                      paginatedCampaigns.map((camp, index) => (
                        <tr key={camp.id} className="hover:bg-slate-100/70 transition-all duration-200 group">
                          <td className="px-6 py-4 text-center text-sm font-semibold text-slate-400">{(campaignPage - 1) * itemsPerPage + index + 1}</td>
                          <td className="px-6 py-4 font-mono font-bold text-slate-400 text-sm">{camp.code}</td>
                          <td className="px-6 py-4 max-w-[20rem]">
                            <p className="font-bold text-slate-800 truncate text-sm" title={camp.title}>{camp.title}</p>
                            <p className="text-xs text-slate-400 line-clamp-1 mt-0.5" title={camp.shortDescription}>{camp.shortDescription}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 bg-slate-50 border border-slate-100 text-slate-600 rounded text-sm font-bold">
                              {camp.targetTypeName}
                            </span>
                            {camp.targetValue && (
                              <p className="text-xs text-slate-400 mt-1 font-mono max-w-[120px] truncate" title={camp.targetValue}>
                                {camp.targetValue}
                              </p>
                            )}
                          </td>
                          <td className="px-6 py-4">{getStatusBadge(camp.status)}</td>
                          <td className="px-6 py-4 text-sm text-slate-500 font-bold">{formatDateTime(camp.publishedAt)}</td>
                          <td className="px-6 py-4 text-sm">
                            {camp.status === "Sent" ? (
                              <div className="space-y-0.5">
                                <p className="font-bold text-slate-800">{camp.readCount} / {camp.recipientsCount} đọc</p>
                                <p className="text-sm text-primary font-bold">{camp.readRate}%</p>
                              </div>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 pr-6 text-right">
                            <div className="flex justify-end gap-1.5">
                              {camp.status === "Scheduled" && (
                                <button
                                  onClick={() => handleCancelSchedule(camp.id)}
                                  className="p-1.5 hover:bg-orange-50 text-orange-500 rounded-lg transition-colors cursor-pointer"
                                  title="Hủy lịch gửi"
                                >
                                  <span className="material-symbols-outlined text-[16px] font-bold">cancel_schedule_send</span>
                                </button>
                              )}
                              {(camp.status === "Draft" || camp.status === "Scheduled" || camp.status === "Cancelled") && (
                                <>
                                  <button
                                    onClick={() => handleSendNow(camp.id)}
                                    className="p-1.5 hover:bg-emerald-50 text-emerald-500 rounded-lg transition-colors cursor-pointer"
                                    title="Gửi ngay bây giờ"
                                  >
                                    <Play size={14} />
                                  </button>
                                  <Link
                                    href={`/admin/notifications/edit/${camp.id}`}
                                    className="p-1.5 hover:bg-blue-50 text-blue-500 rounded-lg transition-colors flex items-center justify-center cursor-pointer"
                                    title="Chỉnh sửa"
                                  >
                                    <span className="material-symbols-outlined text-[16px] font-bold">edit</span>
                                  </Link>
                                </>
                              )}
                              <button
                                onClick={() => handleDeleteCampaign(camp.id)}
                                className="p-1.5 hover:bg-red-50 text-red-500 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                                title="Xóa"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {/* Pagination Controls */}
              {filteredCampaigns.length > 0 && (
                <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <span className="text-sm text-slate-500 font-bold">
                    Hiển thị {(campaignPage - 1) * itemsPerPage + 1} - {Math.min(campaignPage * itemsPerPage, filteredCampaigns.length)} trong số {filteredCampaigns.length} chiến dịch
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCampaignPage(p => Math.max(1, p - 1))}
                      disabled={campaignPage === 1}
                      className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold bg-white text-slate-600 hover:bg-primary hover:text-on-primary transition-colors disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-slate-600"
                    >
                      Trước
                    </button>
                    <button
                      onClick={() => setCampaignPage(p => Math.min(totalPages, p + 1))}
                      disabled={campaignPage >= totalPages}
                      className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold bg-white text-slate-600 hover:bg-primary hover:text-on-primary transition-colors disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-slate-600"
                    >
                      Sau
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TEMPLATES LIST */}
          {activeTab === "TEMPLATES" && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  onClick={() => handleOpenTemplateModal()}
                  className="px-4 py-2.5 bg-primary hover:opacity-90 text-on-primary rounded-xl text-sm font-bold flex items-center gap-1.5 transition-all duration-200 active:scale-95 shadow-sm cursor-pointer"
                >
                  <Plus size={14} /> Tạo mẫu thông báo mới
                </button>
              </div>

              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in duration-300">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100 text-sm font-bold text-slate-400 tracking-widest uppercase">
                        <th className="px-6 py-4 text-center w-[80px]">STT</th>
                        <th className="px-6 py-4">ID</th>
                        <th className="px-6 py-4">Tên Mẫu</th>
                        <th className="px-6 py-4">Mã Mẫu Code</th>
                        <th className="px-6 py-4">Trạng thái</th>
                        <th className="px-6 py-4">Ngày tạo</th>
                        <th className="px-6 py-4 pr-6 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-sm font-semibold text-slate-700">
                      {templates.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-12 text-slate-400">Chưa có mẫu thông báo nào.</td>
                        </tr>
                      ) : (
                        templates.map((tpl, index) => (
                          <tr key={tpl.id} className="hover:bg-slate-100/70 transition-all duration-200 group">
                            <td className="px-6 py-4 text-center text-sm font-semibold text-slate-400">{index + 1}</td>
                            <td className="px-6 py-4 font-mono font-bold text-slate-400 text-sm">{tpl.id}</td>
                            <td className="px-6 py-4 font-bold text-slate-800 text-sm">{tpl.templateName}</td>
                            <td className="px-6 py-4 font-mono font-bold text-slate-400 text-sm">{tpl.templateCode}</td>
                            <td className="px-6 py-4">
                              {tpl.isActive ? (
                                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full text-[10px] font-bold">Kích hoạt</span>
                              ) : (
                                <span className="px-2.5 py-1 bg-slate-50 text-slate-400 border border-slate-100 rounded-full text-[10px] font-bold">Tắt</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-400">{formatDateTime(tpl.createdAt)}</td>
                            <td className="px-6 py-4 pr-6 text-right">
                              <div className="flex justify-end gap-1.5">
                                <button
                                  onClick={() => handleOpenTemplateModal(tpl)}
                                  className="p-1.5 hover:bg-blue-50 text-blue-500 rounded-lg transition-colors cursor-pointer"
                                  title="Sửa mẫu"
                                >
                                  <span className="material-symbols-outlined text-[16px] font-bold">edit</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteTemplate(tpl.id)}
                                  className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors cursor-pointer"
                                  title="Xóa mẫu"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* TEMPLATE DIALOG MODAL */}
      {templateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] w-full max-w-[32rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-sm">{editingTemplate ? "Chỉnh sửa mẫu" : "Tạo mẫu thông báo mới"}</h3>
              <button 
                onClick={() => setTemplateModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleTemplateSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tên mẫu</label>
                <input
                  type="text"
                  value={templateForm.templateName}
                  onChange={(e) => setTemplateForm({ ...templateForm, templateName: e.target.value })}
                  placeholder="Ví dụ: Voucher Sinh Nhật Khách Hàng"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Mã mẫu (Code)</label>
                <input
                  type="text"
                  value={templateForm.templateCode}
                  onChange={(e) => setTemplateForm({ ...templateForm, templateCode: e.target.value.toUpperCase().replace(/\s+/g, "_") })}
                  placeholder="Ví dụ: TPL_BIRTHDAY_GIFT"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white text-slate-800"
                  disabled={!!editingTemplate}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nội dung mẫu (Content Template)</label>
                <textarea
                  rows={6}
                  value={templateForm.templateContent}
                  onChange={(e) => setTemplateForm({ ...templateForm, templateContent: e.target.value })}
                  placeholder="Chúc mừng sinh nhật {FullName}! LazPe tặng bạn 1 voucher giảm 10% cho đơn hàng tiếp theo. Mã voucher: {VoucherCode}."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white text-slate-800"
                />
                <p className="text-[10px] text-slate-400 mt-1.5 font-medium leading-relaxed">
                  * Gợi ý: Có thể sử dụng các biến placeholder như {"{FullName}"}, {"{VoucherCode}"}, {"{TierName}"} để hệ thống tự động thay đổi giá trị theo từng người nhận.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="tpl-active"
                  checked={templateForm.isActive}
                  onChange={(e) => setTemplateForm({ ...templateForm, isActive: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-200 text-primary focus:ring-primary accent-primary"
                />
                <label htmlFor="tpl-active" className="text-xs font-semibold text-slate-700 select-none">
                  Kích hoạt sử dụng mẫu này
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTemplateModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-on-primary rounded-xl text-sm font-bold hover:opacity-90"
                >
                  {editingTemplate ? "Cập nhật mẫu" : "Tạo mẫu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
          />
          <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-slate-100 max-w-[380px] w-full relative z-10 transform scale-100 transition-all duration-300 animate-in fade-in zoom-in-95">
            <h3 className="text-sm font-bold text-slate-800 mb-2">
              {confirmModal.title}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-6 font-semibold">
              {confirmModal.message}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-[11px] font-bold text-slate-600 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="px-4 py-2 bg-error hover:bg-error/90 text-white rounded-xl text-sm font-bold transition-all shadow-md active:scale-95"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
