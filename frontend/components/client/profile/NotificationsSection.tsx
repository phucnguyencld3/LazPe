"use client";

import React, { useState, useEffect } from "react";
import { Loader, Search, Check, Trash2, Bell, ArrowRight, ArrowLeft, ExternalLink } from "lucide-react";
import { toast } from "@/lib/toast";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  UserNotificationItem
} from "@/lib/api";

interface NotificationsSectionProps {
  token: string;
  initialSelectedId?: number | null;
  onClearInitialId?: () => void;
}

type TabKey = "ALL" | "UNREAD" | "PROMOTION" | "ORDER" | "SYSTEM" | "ACCOUNT";

export function NotificationsSection({ token, initialSelectedId, onClearInitialId }: NotificationsSectionProps) {
  // States
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<UserNotificationItem[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedNotif, setSelectedNotif] = useState<UserNotificationItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    show: false,
    title: "",
    message: "",
    onConfirm: () => { },
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

  useEffect(() => {
    fetchNotifications(activeTab);
  }, [activeTab]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm]);

  useEffect(() => {
    if (initialSelectedId) {
      handleLoadDetailById(initialSelectedId);
    }
  }, [initialSelectedId]);

  const fetchNotifications = async (tab: TabKey) => {
    setLoading(true);
    try {
      let isReadFilter: boolean | undefined = undefined;
      if (tab === "UNREAD") isReadFilter = false;

      let typeFilter: string | undefined = undefined;
      if (["PROMOTION", "ORDER", "SYSTEM"].includes(tab)) {
        typeFilter = tab;
      }

      const data = await getNotifications(token, typeFilter, isReadFilter, 1, 100);

      if (data) {
        let filtered = data;
        if (tab === "ACCOUNT") {
          filtered = data.filter(n => n.type === "Membership" || n.type === "RewardPoints");
        }
        setNotifications(filtered);
      } else {
        setNotifications([]);
      }
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải thông báo");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadDetailById = async (id: number) => {
    setDetailLoading(true);
    try {
      // Find locally first
      let found = notifications.find(n => n.id === id);

      if (!found) {
        // If not found in current list, fetch a larger list to search
        const list = await getNotifications(token, undefined, undefined, 1, 100);
        if (list) {
          found = list.find(n => n.id === id);
        }
      }

      if (found) {
        setSelectedNotif(found);
        if (!found.isRead) {
          await markNotificationRead(token, found.id);
          // Update status locally
          setNotifications(prev =>
            prev.map(n => n.id === found!.id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)
          );
        }
      } else {
        toast.error("Không tìm thấy thông báo hoặc thông báo đã bị xóa");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi tải chi tiết thông báo");
    } finally {
      setDetailLoading(false);
      if (onClearInitialId) {
        onClearInitialId();
      }
    }
  };

  const handleMarkRead = async (e: React.MouseEvent, notif: UserNotificationItem) => {
    e.stopPropagation();
    if (notif.isRead) return;

    try {
      const result = await markNotificationRead(token, notif.id);
      if (result.success) {
        setNotifications(prev =>
          prev.map(n => (n.id === notif.id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
        );
        toast.success("Đã đánh dấu đã đọc");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const result = await markAllNotificationsRead(token);
      if (result.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        toast.success("Đã đánh dấu đọc tất cả");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const executeDelete = async (notifId: number) => {
    try {
      const result = await deleteNotification(token, notifId);
      if (result.success) {
        setNotifications(prev => prev.filter(n => n.id !== notifId));
        toast.success("Đã xóa thông báo");
        if (selectedNotif && selectedNotif.id === notifId) {
          setSelectedNotif(null);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Không thể xóa thông báo");
    }
  };

  const handleDelete = (e: React.MouseEvent, notifId: number) => {
    e.stopPropagation();
    requestConfirm(
      "Xóa thông báo?",
      "Bạn có chắc chắn muốn xóa thông báo này? Hành động này không thể hoàn tác.",
      () => executeDelete(notifId)
    );
  };

  const handleRowClick = async (notif: UserNotificationItem) => {
    setSelectedNotif(notif);
    if (!notif.isRead) {
      try {
        await markNotificationRead(token, notif.id);
        setNotifications(prev =>
          prev.map(n => (n.id === notif.id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
        );
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleActionClick = (notif: UserNotificationItem) => {
    const url = notif.actionUrl;
    if (!url) return;

    const actionLower = notif.actionType?.toLowerCase();

    if (actionLower === "product") {
      window.location.href = `/products/${url}`;
    } else if (actionLower === "voucher") {
      window.location.href = "/profile?tab=vouchers";
    } else if (actionLower === "order") {
      window.location.href = "/profile?tab=orders";
    } else if (actionLower === "membership") {
      window.location.href = "/profile?tab=loyalty";
    } else if (url.startsWith("http://") || url.startsWith("https://")) {
      window.open(url, "_blank");
    } else {
      window.location.href = url;
    }
  };

  const getNotifIcon = (type?: string) => {
    if (!type) return "notifications";
    switch (type.toLowerCase()) {
      case "system": return "settings";
      case "promotion": return "campaign";
      case "order": return "local_shipping";
      case "membership": return "military_tech";
      case "rewardpoints": return "stars";
      default: return "notifications";
    }
  };

  const getNotifColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case "system": return "bg-blue-50 text-blue-600 border-blue-100";
      case "promotion": return "bg-rose-50 text-rose-600 border-rose-100";
      case "order": return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "membership": return "bg-amber-50 text-amber-600 border-amber-100";
      case "rewardpoints": return "bg-purple-50 text-purple-600 border-purple-100";
      default: return "bg-slate-50 text-slate-600 border-slate-100";
    }
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  const getActionLabel = (actionType: string) => {
    switch (actionType?.toLowerCase()) {
      case "product": return "Xem sản phẩm";
      case "voucher": return "Nhận Voucher ngay";
      case "order": return "Xem chi tiết đơn hàng";
      case "membership": return "Xem hạng thành viên";
      case "promotion": return "Xem chương trình khuyến mãi";
      case "customurl": return "Đi đến liên kết";
      default: return "Khám phá ngay";
    }
  };

  const formatContent = (content: string) => {
    if (!content) return "";

    // Early exit if HTML generated by Tiptap
    const isHtml = content.trim().startsWith("<");
    if (isHtml) {
      return content;
    }

    let html = content;

    // Markdown Fallback Parsing
    html = html.replace(/^## (.*?)$/gm, "<h2>$1</h2>");
    html = html.replace(/^# (.*?)$/gm, "<h1>$1</h1>");
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
    html = html.replace(/:::highlight\n?([\s\S]*?)\n?:::/g,
      '<div style="background:#fff1f2; padding:12px; border-radius:12px; border:1px solid #ffe4e6; color:#e11d48; margin:10px 0;">$1</div>'
    );
    html = html.replace(/!\[(.*?)\]\((.*?)\)/g,
      '<img src="$2" alt="$1" style="width:100%; border-radius:12px; margin:10px 0; display:block;" />'
    );
    html = html.replace(/\[(.*?)\]\((.*?)\)/g,
      '<a href="$2" style="color:#f43f5e; font-weight:bold; text-decoration:underline;">$1</a>'
    );
    html = html.replace(/^[-\*]\s+(.*?)$/gm, '<span style="display:inline-block; width:6px; height:6px; background:#f43f5e; border-radius:50%; margin-right:8px; vertical-align:middle;"></span>$1');

    return html;
  };

  const filteredNotifications = notifications.filter(notif =>
    notif.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    notif.shortDescription.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
  const currentNotifications = filteredNotifications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // ----------------------------------------------------
  // Detail View Rendering
  // ----------------------------------------------------
  if (selectedNotif) {
    const isHtml = selectedNotif.content?.trim().startsWith("<");
    return (
      <div className="bg-white rounded-[10px] border border-slate-100 shadow-[0_20px_40px_rgba(135,78,88,0.06)] overflow-hidden">
        {/* Banner Image */}
        {selectedNotif.bannerImage && (
          <div className="w-full h-48 md:h-64 bg-slate-100 overflow-hidden relative border-b border-slate-100">
            <img
              src={selectedNotif.bannerImage}
              alt="Banner thông báo"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Content detail wrapper */}
        <div className="p-6 md:p-8 space-y-6">
          {/* Header row */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              onClick={() => setSelectedNotif(null)}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-xs font-bold transition-colors"
            >
              <ArrowLeft size={16} /> Quay lại danh sách
            </button>
            <button
              onClick={(e) => handleDelete(e, selectedNotif.id)}
              className="text-xs font-bold text-slate-400 hover:text-rose-500 flex items-center gap-1 transition-colors"
            >
              <Trash2 size={14} /> Xóa thông báo
            </button>
          </div>

          {/* Badges & Meta */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold border ${getNotifColor(selectedNotif.type)}`}>
                {selectedNotif.type === "RewardPoints" ? "Điểm thưởng" : selectedNotif.type === "Membership" ? "Thành viên" : selectedNotif.type}
              </span>
              {(selectedNotif.priority === "Critical" || selectedNotif.priority === "High") && (
                <span className="bg-red-50 text-red-600 border border-red-100 px-2.5 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider">
                  Quan trọng
                </span>
              )}
            </div>

            <h2 className="text-lg md:text-xl font-bold text-slate-800 leading-tight">
              {selectedNotif.title}
            </h2>

            <p className="text-[10px] text-slate-400 font-semibold">
              Đăng lúc: {formatTime(selectedNotif.createdAt)}
            </p>
          </div>

          {/* Short description */}
          {selectedNotif.shortDescription && 
           selectedNotif.shortDescription !== selectedNotif.content && 
           !selectedNotif.content.startsWith(selectedNotif.shortDescription.replace("...", "")) && (
            <div className="p-4 bg-slate-50 rounded-[10px] border border-slate-100/50">
              <p className="text-slate-600 text-xs font-semibold leading-relaxed">
                {selectedNotif.shortDescription}
              </p>
            </div>
          )}

          {/* Editor/HTML Content */}
          <div
            className={`tiptap prose prose-slate max-w-none text-slate-700 text-xs leading-relaxed mb-6 ${isHtml ? "" : "whitespace-pre-line"}`}
            dangerouslySetInnerHTML={{ __html: formatContent(selectedNotif.content) }}
          />

          {/* Action Button */}
          {selectedNotif.actionType && selectedNotif.actionType !== "None" && selectedNotif.actionUrl && (
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => handleActionClick(selectedNotif)}
                className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 active:scale-95 shadow-md shadow-rose-500/10 transition-all"
              >
                {getActionLabel(selectedNotif.actionType)}
                <ExternalLink size={12} />
              </button>
            </div>
          )}
        </div>

        {/* Confirm Modal inside detail view */}
        {confirmModal.show && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300"
              onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
            />
            <div className="bg-white rounded-[10px] p-6 shadow-xl border border-slate-100 max-w-[380px] w-full relative z-10 transform scale-100 transition-all duration-300 animate-in fade-in zoom-in-95">
              <h3 className="text-sm font-bold text-slate-800 mb-2">
                {confirmModal.title}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-6 font-semibold">
                {confirmModal.message}
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-[11px] font-bold text-slate-600 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={confirmModal.onConfirm}
                  className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-[11px] font-bold transition-all shadow-md shadow-rose-500/10 active:scale-95"
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

  // ----------------------------------------------------
  // List View Rendering
  // ----------------------------------------------------
  return (
    <section className="bg-white rounded-[10px] p-5 shadow-sm border border-slate-100/60 w-full overflow-hidden">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 pb-3 border-b border-slate-100">
        <h2 className="text-[13px] font-bold text-slate-800 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-base">notifications</span> Hộp thư thông báo
        </h2>
        <button
          onClick={handleMarkAllRead}
          className="border border-primary/30 bg-primary/5 text-primary hover:bg-primary hover:text-white px-3.5 py-1.5 rounded-[6px] font-bold text-[11px] transition-colors flex items-center gap-1.5 active:scale-95 shadow-sm"
        >
          <Check size={14} />
          Đọc tất cả
        </button>
      </div>

      {/* Search Input */}
      <div className="mb-5 relative w-full">
        <input
          type="text"
          placeholder="Tìm kiếm tiêu đề hoặc tóm tắt thông báo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full min-w-0 pl-10 pr-4 py-2.5 rounded-[8px] border border-slate-200/80 focus:outline-none focus:border-primary text-[13px] font-semibold transition-colors shadow-sm"
        />
        <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[20px]">
          search
        </span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100 mb-5 overflow-x-auto scrollbar-none w-full">
        {(
          [
            { key: "ALL", label: "Tất cả" },
            { key: "UNREAD", label: "Chưa đọc" },
            { key: "PROMOTION", label: "Khuyến mãi" },
            { key: "ORDER", label: "Đơn hàng" },
            { key: "SYSTEM", label: "Hệ thống" },
            { key: "ACCOUNT", label: "Tài khoản & Điểm" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-3 px-2 text-[12px] sm:text-[13px] font-bold border-b-2 whitespace-nowrap text-center transition-all ${
              activeTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {detailLoading || loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] bg-white rounded-[10px] border border-slate-100/60 shadow-sm p-5">
          <Loader className="animate-spin text-primary mb-3" size={32} />
          <p className="text-slate-500 font-bold text-[12px]">Đang tải thông báo...</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-[10px] border border-dashed border-slate-200">
          <div className="w-12 h-12 bg-slate-100/50 rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-100 text-slate-400">
            <span className="material-symbols-outlined text-2xl">mail_lock</span>
          </div>
          <h3 className="text-xs font-bold text-slate-700">Hộp thư trống</h3>
          <p className="text-[10px] text-slate-400 mt-1 max-w-[20rem] mx-auto">Không tìm thấy thông báo nào phù hợp với bộ lọc hiện tại.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {currentNotifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleRowClick(notif)}
              className={`bg-white rounded-[8px] p-3 border transition-all duration-200 cursor-pointer hover:shadow-sm hover:border-slate-200 relative group flex gap-3 ${
                !notif.isRead
                  ? "border-primary/20 bg-primary/5"
                  : "border-slate-100/80 shadow-sm"
              } ${notif.isPinned ? "ring-1 ring-primary/40" : ""}`}
            >
              {/* Pin badge */}
              {notif.isPinned && (
                <span className="absolute top-0 left-6 -translate-y-1/2 bg-primary text-white text-[8px] font-bold px-1.5 py-0.5 rounded-[4px] shadow-sm flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[8px] font-bold">push_pin</span>
                  Ghim
                </span>
              )}

              {/* Icon / Thumbnail */}
              <div className={`w-9 h-9 rounded-[6px] border flex-shrink-0 flex items-center justify-center relative overflow-hidden ${getNotifColor(notif.type)}`}>
                {notif.thumbnailImage ? (
                  <img src={notif.thumbnailImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-[18px]">
                    {getNotifIcon(notif.type)}
                  </span>
                )}
              </div>

              {/* Text content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className={`text-[12px] text-slate-800 line-clamp-1 leading-snug ${!notif.isRead ? "font-bold text-slate-900" : "font-semibold"}`}>
                    {notif.title}
                  </h3>
                  {!notif.isRead && (
                    <span className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0"></span>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                  {notif.shortDescription}
                </p>

                <div className="flex items-center gap-2 mt-1.5 text-[9px] text-slate-400 font-bold">
                  <span>{formatTime(notif.createdAt)}</span>
                  <span>•</span>
                  <span className="uppercase tracking-wider text-[8px]">{notif.type === "RewardPoints" ? "Điểm thưởng" : notif.type === "Membership" ? "Thành viên" : notif.type}</span>
                </div>
              </div>

              {/* Right panel Actions */}
              <div className="flex flex-col justify-between items-end flex-shrink-0 gap-2">
                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                  {!notif.isRead && (
                    <button
                      onClick={(e) => handleMarkRead(e, notif)}
                      className="p-1 hover:bg-primary/10 text-slate-400 hover:text-primary rounded-md transition-colors"
                      title="Đánh dấu đã đọc"
                    >
                      <Check size={12} />
                    </button>
                  )}
                  <button
                    onClick={(e) => handleDelete(e, notif.id)}
                    className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
                    title="Xóa thông báo"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

                <span className="text-primary text-[10px] font-bold flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                  Xem <ArrowRight size={10} />
                </span>
              </div>
            </div>
          ))}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 mt-2 border-t border-slate-100">
              <span className="text-xs text-slate-500 font-medium">
                Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredNotifications.length)} trong số {filteredNotifications.length} thông báo
              </span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowLeft size={14} />
                </button>
                <div className="flex items-center px-2">
                  <span className="text-xs font-bold text-slate-700">Trang {currentPage} / {totalPages}</span>
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirm Modal inside main view */}
      {confirmModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
          />
          <div className="bg-white rounded-[10px] p-6 shadow-xl border border-slate-100 max-w-[380px] w-full relative z-10 transform scale-100 transition-all duration-300 animate-in fade-in zoom-in-95">
            <h3 className="text-sm font-bold text-slate-800 mb-2">
              {confirmModal.title}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-6 font-semibold">
              {confirmModal.message}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-[11px] font-bold text-slate-600 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-[11px] font-bold transition-all shadow-md shadow-rose-500/10 active:scale-95"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
