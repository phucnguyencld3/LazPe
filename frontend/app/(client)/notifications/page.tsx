"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader, Search, Check, Trash2, Bell, MessageSquare, ArrowRight } from "lucide-react";
import { toast } from "@/lib/toast";
import { getNotifications, markNotificationRead, markAllNotificationsRead, deleteNotification, UserNotificationItem } from "@/lib/api";

type TabKey = "ALL" | "UNREAD" | "PROMOTION" | "ORDER" | "SYSTEM" | "ACCOUNT";

function NotificationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // States
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<UserNotificationItem[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!savedToken) {
      router.push("/login");
      return;
    }
    setToken(savedToken);
    
    // Check if redirecting from specific notification detail URL param
    const selectedId = searchParams.get("id");
    if (selectedId) {
      // Auto open or highlight if needed, or we just handle it
    }

    fetchNotifications(savedToken, activeTab, 1);
  }, [activeTab, searchParams]);

  const fetchNotifications = async (authToken: string, tab: TabKey, pageNum: number) => {
    setLoading(true);
    try {
      let isReadFilter: boolean | undefined = undefined;
      if (tab === "UNREAD") isReadFilter = false;

      let typeFilter: string | undefined = undefined;
      if (["PROMOTION", "ORDER", "SYSTEM"].includes(tab)) {
        typeFilter = tab;
      } else if (tab === "ACCOUNT") {
        typeFilter = "Membership"; // or RewardPoints, we will fetch both locally or filter below
      }

      const data = await getNotifications(authToken, typeFilter, isReadFilter, pageNum, 15);
      
      if (data) {
        let filtered = data;
        // Additional local filtering if needed
        if (tab === "ACCOUNT") {
          filtered = data.filter(n => n.type === "Membership" || n.type === "RewardPoints");
        }
        
        setNotifications(filtered);
        setHasMore(data.length === 15);
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

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    setPage(1);
    if (token) fetchNotifications(token, tab, 1);
  };

  const handleMarkRead = async (e: React.MouseEvent, notif: UserNotificationItem) => {
    e.stopPropagation();
    if (!token) return;
    if (notif.isRead) return;

    try {
      const result = await markNotificationRead(token, notif.id);
      if (result.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
        );
        toast.success("Đã đánh dấu đã đọc");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    if (!token) return;
    try {
      const result = await markAllNotificationsRead(token);
      if (result.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        toast.success("Đã đánh dấu đọc tất cả");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (e: React.MouseEvent, notifId: number) => {
    e.stopPropagation();
    if (!token) return;
    if (!window.confirm("Bạn có chắc chắn muốn xóa thông báo này?")) return;

    try {
      const result = await deleteNotification(token, notifId);
      if (result.success) {
        setNotifications((prev) => prev.filter((n) => n.id !== notifId));
        toast.success("Đã xóa thông báo");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRowClick = async (notif: UserNotificationItem) => {
    if (!token) return;
    if (!notif.isRead) {
      try {
        await markNotificationRead(token, notif.id);
      } catch (err) {
        console.error(err);
      }
    }

    if (notif.actionUrl) {
      router.push(notif.actionUrl);
    } else {
      router.push(`/notifications/${notif.id}`);
    }
  };

  const getNotifIcon = (type: string) => {
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
    switch (type.toLowerCase()) {
      case "system": return "bg-blue-50 text-blue-600 border-blue-100";
      case "promotion": return "bg-rose-50 text-rose-600 border-rose-100";
      case "order": return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "membership": return "bg-amber-50 text-amber-600 border-amber-100";
      case "rewardpoints": return "bg-purple-50 text-purple-600 border-purple-100";
      default: return "bg-slate-50 text-slate-600 border-slate-100";
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  const filteredNotifications = notifications.filter(notif => 
    notif.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    notif.shortDescription.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 py-10 pt-28">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center">
              <Bell size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Hộp thư thông báo</h1>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">Quản lý và xem các thông báo cá nhân của bạn</p>
            </div>
          </div>
          
          <button
            onClick={handleMarkAllRead}
            className="px-4 py-2 border border-slate-200 hover:border-rose-200 hover:text-rose-500 rounded-xl text-xs font-bold text-slate-600 bg-white transition-all flex items-center gap-1.5 active:scale-95 shadow-sm"
          >
            <Check size={14} />
            Đánh dấu đã đọc tất cả
          </button>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-6 space-y-4">
          {/* Tabs */}
          <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-none">
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
                onClick={() => handleTabChange(tab.key)}
                className={`px-4 py-2 rounded-full font-bold text-xs whitespace-nowrap transition-all ${
                  activeTab === tab.key
                    ? "bg-rose-500 text-white shadow-sm"
                    : "bg-slate-50 text-slate-600 hover:text-rose-500 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Tìm kiếm tiêu đề hoặc nội dung thông báo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-rose-400 focus:bg-white transition-all text-slate-800"
            />
          </div>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-100 flex flex-col items-center justify-center">
            <Loader className="animate-spin text-rose-500 mb-3" size={32} />
            <p className="text-xs text-slate-500 font-semibold">Đang tải thông báo...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 shadow-sm border border-slate-100 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 text-slate-400">
              <span className="material-symbols-outlined text-4xl">mail_lock</span>
            </div>
            <h3 className="text-sm font-bold text-slate-700">Hộp thư trống</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">Không tìm thấy thông báo nào phù hợp với bộ lọc hiện tại.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleRowClick(notif)}
                className={`bg-white rounded-2xl p-4 shadow-sm border transition-all duration-200 cursor-pointer hover:shadow-md hover:border-slate-300 relative group flex gap-4 ${
                  !notif.isRead ? "border-rose-200 bg-rose-50/10" : "border-slate-100"
                } ${notif.isPinned ? "ring-1 ring-rose-400" : ""}`}
              >
                {/* Pin Badge */}
                {notif.isPinned && (
                  <span className="absolute top-0 left-6 -translate-y-1/2 bg-rose-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-[8px] font-bold">push_pin</span>
                    Ghim
                  </span>
                )}

                {/* Left Icon / Thumbnail */}
                <div className={`w-12 h-12 rounded-xl border flex-shrink-0 flex items-center justify-center relative overflow-hidden ${getNotifColor(notif.type)}`}>
                  {notif.thumbnailImage ? (
                    <img src={notif.thumbnailImage} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-xl">
                      {getNotifIcon(notif.type)}
                    </span>
                  )}
                </div>

                {/* Middle Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className={`text-sm text-slate-800 line-clamp-1 leading-snug ${!notif.isRead ? "font-bold" : "font-semibold"}`}>
                      {notif.title}
                    </h3>
                    {!notif.isRead && (
                      <span className="w-2 h-2 bg-rose-500 rounded-full flex-shrink-0"></span>
                    )}
                  </div>
                  
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                    {notif.shortDescription}
                  </p>
                  
                  <div className="flex items-center gap-3 mt-3 text-[10px] text-slate-400 font-bold">
                    <span>{formatTime(notif.createdAt)}</span>
                    <span>•</span>
                    <span className="uppercase tracking-wider text-[9px]">{notif.type}</span>
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex flex-col justify-between items-end flex-shrink-0 gap-2">
                  <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    {!notif.isRead && (
                      <button
                        onClick={(e) => handleMarkRead(e, notif)}
                        className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"
                        title="Đánh dấu đã đọc"
                      >
                        <Check size={14} />
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDelete(e, notif.id)}
                      className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
                      title="Xóa thông báo"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  
                  <span className="text-rose-500 text-xs font-bold flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                    Chi tiết <ArrowRight size={12} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 py-10 pt-28 flex flex-col items-center justify-center">
        <Loader className="animate-spin text-rose-500 mb-3" size={32} />
        <p className="text-xs text-slate-500 font-semibold">Đang tải...</p>
      </div>
    }>
      <NotificationsContent />
    </Suspense>
  );
}
