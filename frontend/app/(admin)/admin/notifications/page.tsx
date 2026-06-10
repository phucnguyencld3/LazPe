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
import Button from "@/components/admin/ui/Button";
import Input from "@/components/admin/ui/Input";
import TextArea from "@/components/admin/ui/TextArea";
import Badge from "@/components/admin/ui/Badge";
import Modal from "@/components/admin/ui/Modal";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/admin/ui/Table";
import { Card, StatsCard } from "@/components/admin/ui/Card";

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
        return <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold flex items-center gap-1 w-fit"><CheckCircle size={12} /> Đã gửi</span>;
      case "Scheduled":
        return <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold flex items-center gap-1 w-fit"><Clock size={12} /> Lập lịch</span>;
      case "Draft":
        return <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold flex items-center gap-1 w-fit"><FileText size={12} /> Bản nháp</span>;
      case "Cancelled":
        return <span className="px-2.5 py-1 bg-red-50 text-red-700 rounded-lg text-xs font-bold flex items-center gap-1 w-fit"><XCircle size={12} /> Đã hủy</span>;
      default:
        return <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold w-fit">{status}</span>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "Critical":
        return <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded text-[10px] font-bold">Khẩn cấp</span>;
      case "High":
        return <span className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded text-[10px] font-bold">Cao</span>;
      case "Medium":
        return <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-[10px] font-bold">Trung bình</span>;
      default:
        return <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-bold">Thấp</span>;
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
    <div className="space-y-6 font-outfit pb-20">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Quản lý Thông báo (Notification Center)</h1>
          <p className="text-xs text-slate-500 font-semibold mt-1">Lập chiến dịch tiếp thị, gửi thông báo hệ thống và theo dõi hiệu suất tương tác</p>
        </div>

        <Link
          href="/admin/notifications/create"
          className="px-5 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all duration-200 active:scale-95 shadow-md shadow-rose-500/10 w-fit"
        >
          <Plus size={16} /> Tạo thông báo mới
        </Link>
      </div>

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
            className={`flex items-center gap-2 px-5 py-3 rounded-t-xl text-xs font-bold transition-all border-b-2 -mb-1.5 focus:outline-none ${
              activeTab === tab.key
                ? "border-rose-500 text-rose-600 bg-white"
                : "border-transparent text-slate-500 hover:text-rose-500"
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                <StatsCard
                  title="Tổng chiến dịch"
                  value={stats.totalNotifications ?? "0"}
                  icon={<span className="material-symbols-outlined">campaign</span>}
                  iconBgColor="bg-blue-50 text-blue-500 dark:bg-blue-900/20"
                />
                <StatsCard
                  title="Đã phát hành"
                  value={stats.totalSent ?? "0"}
                  icon={<span className="material-symbols-outlined">done_all</span>}
                  iconBgColor="bg-emerald-50 text-emerald-500 dark:bg-emerald-900/20"
                />
                <StatsCard
                  title="Tổng người nhận"
                  value={stats.totalRecipients ?? "0"}
                  icon={<span className="material-symbols-outlined">groups</span>}
                  iconBgColor="bg-purple-50 text-purple-500 dark:bg-purple-900/20"
                />
                <StatsCard
                  title="Tỷ lệ đọc TB"
                  value={`${stats.overallReadRate ?? 0}%`}
                  icon={<span className="material-symbols-outlined">mark_chat_read</span>}
                  iconBgColor="bg-pink-50 text-pink-500 dark:bg-pink-900/20"
                />
                <StatsCard
                  title="Tỷ lệ tương tác"
                  value={`${stats.engagementRate ?? 0}%`}
                  icon={<span className="material-symbols-outlined">ads_click</span>}
                  iconBgColor="bg-amber-50 text-amber-500 dark:bg-amber-900/20"
                />
              </div>

              {/* Charts grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sent over time */}
                <div className="bg-white dark:bg-gray-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-rose-500">timeline</span> Tương tác chiến dịch (7 ngày qua)
                  </h3>
                  <div className="h-64">
                    <Chart options={timeSeriesChartOptions} series={timeSeriesChartSeries} type="line" height="100%" />
                  </div>
                </div>

                {/* Read rates by type */}
                <div className="bg-white dark:bg-gray-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-rose-500">bar_chart</span> Hiệu suất đọc theo loại thông báo (%)
                  </h3>
                  <div className="h-64">
                    <Chart options={typeChartOptions} series={typeChartSeries} type="bar" height="100%" />
                  </div>
                </div>
              </div>

              {/* Top Campaigns table */}
              <Card className="p-6">
                <h3 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-brand-500">stars</span> Top 5 chiến dịch hiệu quả nhất
                </h3>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableCell isHeader>Mã</TableCell>
                        <TableCell isHeader>Tiêu đề chiến dịch</TableCell>
                        <TableCell isHeader>Loại thông báo</TableCell>
                        <TableCell isHeader>Tổng người nhận</TableCell>
                        <TableCell isHeader>Đã đọc</TableCell>
                        <TableCell isHeader className="text-right">Tỷ lệ đọc</TableCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.topCampaigns?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-6 text-slate-400">Chưa có chiến dịch nào được ghi nhận hiệu suất.</TableCell>
                        </TableRow>
                      ) : (
                        stats.topCampaigns?.map((camp: any) => (
                          <TableRow key={camp.id}>
                            <TableCell className="font-mono font-bold text-slate-400">#{camp.code}</TableCell>
                            <TableCell className="font-bold text-slate-800 dark:text-white">{camp.title}</TableCell>
                            <TableCell className="capitalize">{camp.type === "RewardPoints" ? "Điểm thưởng" : camp.type === "Membership" ? "Thành viên" : camp.type}</TableCell>
                            <TableCell>{camp.recipientsCount}</TableCell>
                            <TableCell>{camp.readCount}</TableCell>
                            <TableCell className="text-right text-brand-500 font-bold">{camp.readRate}%</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </div>
          )}

          {/* TAB 2: CAMPAIGNS LIST */}
          {activeTab === "CAMPAIGNS" && (
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-4 justify-between bg-slate-50/50 dark:bg-gray-800/50">
                <div className="relative w-full sm:w-80">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10">
                    <Search size={16} />
                  </span>
                  <Input
                    type="text"
                    placeholder="Tìm kiếm chiến dịch..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12"
                  />
                </div>
                <span className="text-xs text-slate-400 dark:text-gray-400 font-bold">Hiển thị {filteredCampaigns.length} chiến dịch</span>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableCell isHeader>Mã</TableCell>
                      <TableCell isHeader>Chiến dịch</TableCell>
                      <TableCell isHeader>Loại / Mức độ</TableCell>
                      <TableCell isHeader>Đối tượng nhận</TableCell>
                      <TableCell isHeader>Trạng thái</TableCell>
                      <TableCell isHeader>Lịch gửi</TableCell>
                      <TableCell isHeader>Tương tác</TableCell>
                      <TableCell isHeader className="text-right">Thao tác</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCampaigns.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-16 text-slate-400">
                          <span className="material-symbols-outlined text-4xl text-slate-300 mb-1">campaign</span>
                          <p className="font-medium text-xs mt-1">Không tìm thấy chiến dịch nào</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCampaigns.map((camp) => (
                        <TableRow key={camp.id}>
                          <TableCell className="font-mono font-bold text-slate-400">#{camp.code}</TableCell>
                          <TableCell className="max-w-[20rem]">
                            <p className="font-bold text-slate-800 dark:text-white truncate" title={camp.title}>{camp.title}</p>
                            <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5" title={camp.shortDescription}>{camp.shortDescription}</p>
                          </TableCell>
                          <TableCell className="space-y-1">
                            <p className="capitalize font-bold text-slate-650 dark:text-gray-300 text-[11px]">
                              {camp.type === "RewardPoints" ? "Điểm thưởng" : camp.type === "Membership" ? "Thành viên" : camp.type}
                            </p>
                            {camp.priority === "Critical" && <Badge color="error" size="sm">Khẩn cấp</Badge>}
                            {camp.priority === "High" && <Badge color="warning" size="sm">Cao</Badge>}
                            {camp.priority === "Medium" && <Badge color="info" size="sm">Trung bình</Badge>}
                            {camp.priority === "Low" && <Badge color="light" size="sm">Thấp</Badge>}
                          </TableCell>
                          <TableCell>
                            <Badge color="light" size="sm">
                              {camp.targetTypeName}
                            </Badge>
                            {camp.targetValue && (
                              <p className="text-[9px] text-slate-400 mt-1 font-mono max-w-[120px] truncate" title={camp.targetValue}>
                                {camp.targetValue}
                              </p>
                            )}
                          </TableCell>
                          <TableCell>
                            {camp.status === "Sent" && <Badge color="success" startIcon={<CheckCircle size={10} />}>Đã gửi</Badge>}
                            {camp.status === "Scheduled" && <Badge color="info" startIcon={<Clock size={10} />}>Lập lịch</Badge>}
                            {camp.status === "Draft" && <Badge color="light" startIcon={<FileText size={10} />}>Bản nháp</Badge>}
                            {camp.status === "Cancelled" && <Badge color="error" startIcon={<XCircle size={10} />}>Đã hủy</Badge>}
                          </TableCell>
                          <TableCell className="text-[11px] text-slate-500 font-bold">{formatDateTime(camp.publishedAt)}</TableCell>
                          <TableCell className="text-[11px]">
                            {camp.status === "Sent" ? (
                              <div className="space-y-0.5">
                                <p className="font-bold text-slate-800 dark:text-white">{camp.readCount} / {camp.recipientsCount} đọc</p>
                                <p className="text-[10px] text-brand-500 font-bold">{camp.readRate}%</p>
                              </div>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1.5">
                              {camp.status === "Scheduled" && (
                                <button
                                  onClick={() => handleCancelSchedule(camp.id)}
                                  className="w-8 h-8 rounded-full hover:bg-orange-50 text-orange-500 flex items-center justify-center transition-colors cursor-pointer"
                                  title="Hủy lịch gửi"
                                >
                                  <span className="material-symbols-outlined text-[16px] font-bold">cancel_schedule_send</span>
                                </button>
                              )}
                              {(camp.status === "Draft" || camp.status === "Scheduled" || camp.status === "Cancelled") && (
                                <>
                                  <button
                                    onClick={() => handleSendNow(camp.id)}
                                    className="w-8 h-8 rounded-full hover:bg-emerald-50 text-emerald-500 flex items-center justify-center transition-colors cursor-pointer"
                                    title="Gửi ngay bây giờ"
                                  >
                                    <Play size={14} />
                                  </button>
                                  <Link
                                    href={`/admin/notifications/edit/${camp.id}`}
                                    className="w-8 h-8 rounded-full hover:bg-blue-50 text-blue-500 flex items-center justify-center transition-colors cursor-pointer"
                                    title="Chỉnh sửa"
                                  >
                                    <span className="material-symbols-outlined text-[16px] font-bold">edit</span>
                                  </Link>
                                </>
                              )}
                              <button
                                onClick={() => handleDeleteCampaign(camp.id)}
                                className="w-8 h-8 rounded-full hover:bg-red-50 text-red-500 hover:text-red-600 flex items-center justify-center transition-colors cursor-pointer"
                                title="Xóa"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* TAB 3: TEMPLATES LIST */}
          {activeTab === "TEMPLATES" && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button
                  onClick={() => handleOpenTemplateModal()}
                  variant="primary"
                  startIcon={<Plus size={14} />}
                >
                  Tạo mẫu thông báo mới
                </Button>
              </div>

              <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableCell isHeader>ID</TableCell>
                        <TableCell isHeader>Tên Mẫu</TableCell>
                        <TableCell isHeader>Mã Mẫu Code</TableCell>
                        <TableCell isHeader>Trạng thái</TableCell>
                        <TableCell isHeader>Ngày tạo</TableCell>
                        <TableCell isHeader className="text-right">Thao tác</TableCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {templates.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-12 text-slate-400">Chưa có mẫu thông báo nào.</TableCell>
                        </TableRow>
                      ) : (
                        templates.map((tpl) => (
                          <TableRow key={tpl.id}>
                            <TableCell className="font-mono font-bold text-slate-400">#{tpl.id}</TableCell>
                            <TableCell className="font-bold text-slate-800 dark:text-white">{tpl.templateName}</TableCell>
                            <TableCell className="font-mono font-bold text-slate-400">{tpl.templateCode}</TableCell>
                            <TableCell>
                              {tpl.isActive ? (
                                <Badge color="success">Kích hoạt</Badge>
                              ) : (
                                <Badge color="light">Tắt</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-[11px] text-slate-400">{formatDateTime(tpl.createdAt)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1.5">
                                <button
                                  onClick={() => handleOpenTemplateModal(tpl)}
                                  className="w-8 h-8 rounded-full hover:bg-blue-50 text-blue-500 flex items-center justify-center transition-colors cursor-pointer"
                                  title="Sửa mẫu"
                                >
                                  <span className="material-symbols-outlined text-[16px] font-bold">edit</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteTemplate(tpl.id)}
                                  className="w-8 h-8 rounded-full hover:bg-red-50 text-red-500 flex items-center justify-center transition-colors cursor-pointer"
                                  title="Xóa mẫu"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* TEMPLATE DIALOG MODAL */}
      <Modal
        isOpen={templateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
        showCloseButton={false}
        className="max-w-[32rem] !p-0 overflow-hidden"
      >
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-gray-800/50 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 dark:text-white text-sm">{editingTemplate ? "Chỉnh sửa mẫu" : "Tạo mẫu thông báo mới"}</h3>
          <button 
            onClick={() => setTemplateModalOpen(false)}
            className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <form onSubmit={handleTemplateSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Tên mẫu</label>
            <Input
              type="text"
              value={templateForm.templateName}
              onChange={(e) => setTemplateForm({ ...templateForm, templateName: e.target.value })}
              placeholder="Ví dụ: Voucher Sinh Nhật Khách Hàng"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Mã mẫu (Code)</label>
            <Input
              type="text"
              value={templateForm.templateCode}
              onChange={(e) => setTemplateForm({ ...templateForm, templateCode: e.target.value.toUpperCase().replace(/\s+/g, "_") })}
              placeholder="Ví dụ: TPL_BIRTHDAY_GIFT"
              disabled={!!editingTemplate}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Nội dung mẫu (Content Template)</label>
            <TextArea
              rows={5}
              value={templateForm.templateContent}
              onChange={(e) => setTemplateForm({ ...templateForm, templateContent: e.target.value })}
              placeholder="Chúc mừng sinh nhật {FullName}! LazPe tặng bạn 1 voucher giảm 10% cho đơn hàng tiếp theo. Mã voucher: {VoucherCode}."
              required
            />
            <p className="text-[10px] text-slate-400 dark:text-gray-500 mt-1.5 font-medium leading-relaxed">
              * Gợi ý: Có thể sử dụng các biến placeholder như {"{FullName}"}, {"{VoucherCode}"}, {"{TierName}"} để hệ thống tự động thay đổi giá trị theo từng người nhận.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="tpl-active"
              checked={templateForm.isActive}
              onChange={(e) => setTemplateForm({ ...templateForm, isActive: e.target.checked })}
              className="w-4 h-4 rounded border-slate-200 text-brand-500 focus:ring-brand-500"
            />
            <label htmlFor="tpl-active" className="text-xs font-semibold text-slate-700 dark:text-gray-300 select-none cursor-pointer">
              Kích hoạt sử dụng mẫu này
            </label>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
            <Button
              type="button"
              onClick={() => setTemplateModalOpen(false)}
              variant="outline"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
            >
              {editingTemplate ? "Cập nhật mẫu" : "Tạo mẫu"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Modal */}
      <Modal
        isOpen={confirmModal.show}
        onClose={() => setConfirmModal(prev => ({ ...prev, show: false }))}
        showCloseButton={false}
        className="max-w-[380px]"
      >
        <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-2">
          {confirmModal.title}
        </h3>
        <p className="text-xs text-slate-500 dark:text-gray-400 leading-relaxed mb-6 font-semibold">
          {confirmModal.message}
        </p>
        <div className="flex justify-end gap-2">
          <Button
            onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
            variant="outline"
            size="sm"
          >
            Hủy bỏ
          </Button>
          <Button
            onClick={confirmModal.onConfirm}
            variant="primary"
            size="sm"
          >
            Xác nhận
          </Button>
        </div>
      </Modal>
    </div>
  );
}
