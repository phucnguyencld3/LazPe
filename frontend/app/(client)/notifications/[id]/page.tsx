"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Calendar, User, Tag, Clock, ExternalLink } from "lucide-react";
import { toast } from "@/lib/toast";
import { getNotifications, markNotificationRead } from "@/lib/api";

export default function NotificationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const idStr = params.id as string;
  const notifId = parseInt(idStr, 10);

  // States
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<any | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!savedToken) {
      router.push("/login");
      return;
    }
    setToken(savedToken);
    
    if (isNaN(notifId)) {
      toast.error("Thông báo không hợp lệ");
      router.push("/notifications");
      return;
    }

    fetchDetail(savedToken);
  }, [notifId]);

  const fetchDetail = async (authToken: string) => {
    setLoading(true);
    try {
      // API client doesn't have direct single notification detail API yet, so we get it from list
      const list = await getNotifications(authToken, undefined, undefined, 1, 100);
      if (list) {
        const found = list.find((n) => n.id === notifId);
        if (found) {
          setNotification(found);
          
          // Mark as read immediately on open
          if (!found.isRead) {
            await markNotificationRead(authToken, found.id);
          }
        } else {
          toast.error("Không tìm thấy thông báo");
          router.push("/notifications");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi tải chi tiết thông báo");
    } finally {
      setLoading(false);
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type?.toLowerCase()) {
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

  const handleActionClick = () => {
    if (!notification) return;
    const url = notification.actionUrl;
    if (!url) return;

    const actionLower = notification.actionType?.toLowerCase();
    
    // Resolve dynamic actions
    if (actionLower === "product") {
      router.push(`/products/${url}`);
    } else if (actionLower === "voucher") {
      router.push("/profile?tab=vouchers");
    } else if (actionLower === "order") {
      router.push("/profile?tab=orders");
    } else if (actionLower === "membership") {
      router.push("/profile?tab=loyalty");
    } else if (url.startsWith("http://") || url.startsWith("https://")) {
      window.open(url, "_blank");
    } else {
      router.push(url);
    }
  };

  const formatContent = (content: string) => {
    if (!content) return "";
    let html = content;
    
    // 1. Headers: ## Title or # Title
    html = html.replace(/^## (.*?)$/gm, "<h2>$1</h2>");
    html = html.replace(/^# (.*?)$/gm, "<h1>$1</h1>");
    
    // 2. Bold & Italic: **text** or *text*
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
    
    // 3. Highlight Box: :::highlight ... :::
    html = html.replace(/:::highlight\n?([\s\S]*?)\n?:::/g, 
      '<div style="background:#fff1f2; padding:12px; border-radius:12px; border:1px solid #ffe4e6; color:#e11d48; margin:10px 0;">$1</div>'
    );
    
    // 4. Images: ![alt](url)
    html = html.replace(/!\[(.*?)\]\((.*?)\)/g, 
      '<img src="$2" alt="$1" style="width:100%; border-radius:12px; margin:10px 0; display:block;" />'
    );
    
    // 5. Links: [text](url)
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, 
      '<a href="$2" style="color:#f43f5e; font-weight:bold; text-decoration:underline;">$1</a>'
    );
    
    // 6. Unordered lists: lines starting with "- " or "* "
    html = html.replace(/^[-\*]\s+(.*?)$/gm, '<span style="display:inline-block; width:6px; height:6px; background:#f43f5e; border-radius:50%; margin-right:8px; vertical-align:middle;"></span>$1');

    return html;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 py-24 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-rose-500 mx-auto mb-3"></div>
          <p className="text-xs text-slate-500 font-semibold">Đang tải nội dung thông báo...</p>
        </div>
      </div>
    );
  }

  if (!notification) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 pt-28">
      <div className="max-w-3xl mx-auto px-4">
        {/* Back navigation */}
        <button
          onClick={() => router.push("/notifications")}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-xs font-bold mb-6 transition-colors"
        >
          <ArrowLeft size={16} /> Quay lại danh sách
        </button>

        {/* Detail Card */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100">
          {/* Banner Image */}
          {notification.bannerImage && (
            <div className="w-full h-64 md:h-80 bg-slate-100 overflow-hidden relative border-b border-slate-100">
              <img
                src={notification.bannerImage}
                alt="Banner thông báo"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Details header */}
          <div className="p-6 md:p-8">
            <div className="flex flex-wrap items-center gap-2.5 mb-4">
              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${getNotifColor(notification.type)}`}>
                {notification.type === "RewardPoints" ? "Điểm thưởng" : notification.type === "Membership" ? "Thành viên" : notification.type}
              </span>
              {notification.priority === "Critical" || notification.priority === "High" ? (
                <span className="bg-red-50 text-red-600 border border-red-100 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                  Khẩn cấp
                </span>
              ) : null}
            </div>

            <h1 className="text-xl md:text-2xl font-bold text-slate-800 leading-tight">
              {notification.title}
            </h1>

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 mt-4 pb-6 border-b border-slate-100 text-xs text-slate-400 font-bold">
              <span className="flex items-center gap-1">
                <Calendar size={14} />
                {formatTime(notification.createdAt)}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock size={14} />
                Mã: {notification.code}
              </span>
            </div>

            {/* Short Description Block */}
            <div className="my-6 p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
              <p className="text-slate-600 text-xs font-semibold leading-relaxed">
                {notification.shortDescription}
              </p>
            </div>

            {/* Rich Content body */}
            <div 
              className="prose prose-slate max-w-none text-slate-700 text-sm leading-relaxed mb-8 whitespace-pre-line"
              dangerouslySetInnerHTML={{ __html: formatContent(notification.content) }}
            />

            {/* Call To Action */}
            {notification.actionType && notification.actionType !== "None" && notification.actionUrl && (
              <div className="pt-6 border-t border-slate-100 flex justify-end">
                <button
                  onClick={handleActionClick}
                  className="px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl text-xs font-bold flex items-center gap-2 active:scale-95 shadow-md shadow-rose-500/10 transition-all"
                >
                  {getActionLabel(notification.actionType)}
                  <ExternalLink size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
