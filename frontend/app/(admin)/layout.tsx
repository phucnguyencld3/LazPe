"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import * as signalR from "@microsoft/signalr";
import { toast } from "@/lib/toast";
import { getNotifications, getUnreadNotificationCount, markNotificationRead, markAllNotificationsRead, UserNotificationItem } from "@/lib/api";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isAuth, setIsAuth] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Notifications states
  const [notifications, setNotifications] = useState<UserNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return;

    const loadNotifications = async (authToken: string) => {
      try {
        const data = await getNotifications(authToken, undefined, undefined, 1, 5);
        if (data) {
          setNotifications(data);
        }
        const count = await getUnreadNotificationCount(authToken);
        setUnreadCount(count);
      } catch (err) {
        console.error("Error loading admin notifications:", err);
      }
    };

    loadNotifications(token);

    const connection = new signalR.HubConnectionBuilder()
      .withUrl("http://localhost:5101/notificationHub", {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .build();

    connection.on("ReceiveNotification", (notif: UserNotificationItem) => {
      setNotifications((prev) => [notif, ...prev.slice(0, 4)]);
      setUnreadCount((prev) => prev + 1);
      toast.success(`Thông báo mới: ${notif.title}`);

      try {
        const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-600.wav");
        audio.volume = 0.4;
        audio.play();
      } catch (e) {
        // blocked by browser
      }
    });

    connection.start().catch((err) => console.error("Admin SignalR error:", err));

    return () => {
      connection.stop();
    };
  }, []);

  const handleMarkAllRead = async () => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return;
    try {
      const result = await markAllNotificationsRead(token);
      if (result.success) {
        setUnreadCount(0);
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        toast.success("Đã đánh dấu đã đọc tất cả");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleNotificationClick = async (notif: UserNotificationItem) => {
    setIsNotifDropdownOpen(false);
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return;

    if (!notif.isRead) {
      try {
        await markNotificationRead(token, notif.id);
        setUnreadCount((prev) => Math.max(0, prev - 1));
        setNotifications((prev) => prev.map((n) => n.id === notif.id ? { ...n, isRead: true } : n));
      } catch (e) {
        console.error(e);
      }
    }

    if (notif.actionUrl) {
      window.location.href = notif.actionUrl;
    } else {
      window.location.href = "/admin/notifications";
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

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    return date.toLocaleDateString("vi-VN");
  };

  useEffect(() => {
    if (isAuth) return;

    const checkAuth = async () => {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) {
        window.location.replace("/login");
        return;
      }
      try {
        const res = await fetch("http://localhost:5101/api/Authentication/current-user", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!res.ok) {
          window.location.replace("/login");
          return;
        }

        const data = await res.json();
        const user = data.user;
        const roles = user?.roles || [];
        const permissions = user?.permissions || [];
        const hasDashboardAccess = user?.isAdmin || roles.includes("Admin") || permissions.includes("Admin.Access");
        
        if (!data.success || !hasDashboardAccess) {
          window.location.replace("/login");
        } else {
          setIsAuth(true);
        }
      } catch (e) {
        window.location.replace("/login");
      }
    };
    checkAuth();
  }, [router, pathname, isAuth]);

  const isActive = (path: string) => {
    if (path === "/admin" && pathname !== "/admin") return false;
    return pathname?.startsWith(path);
  };

  if (!isAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-background font-body-md text-on-surface min-h-screen flex flex-col relative admin-scaled-layout">
      {/* Top Navigation Shell */}
      <header className="sticky top-0 z-40 flex items-center justify-between w-full h-20 px-margin-desktop bg-surface-container-lowest shadow-sm shadow-primary/10">
        <div className="flex items-center gap-sm ml-72">
          {/* Logo shifted to avoid being completely covered by sidebar, if needed. Or just leave it as is if it matches mockup. We'll leave it as in mockup */}
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Laz<span className="text-rose-500">Pe</span>
          </h1>
        </div>
        <div className="flex items-center gap-md">
          <div className="relative">
            <button
              onClick={() => setIsNotifDropdownOpen(!isNotifDropdownOpen)}
              className={`material-symbols-outlined p-2 text-on-surface-variant hover:bg-primary-container/20 rounded-full transition-colors duration-300 relative focus:outline-none ${unreadCount > 0 ? "animate-pulse" : ""}`}
              title="Thông báo"
            >
              notifications
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 bg-rose-500 text-white text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown Panel */}
            {isNotifDropdownOpen && (
              <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.08)] border border-slate-100 py-3 z-50 text-slate-800">
                <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100">
                  <span className="font-bold text-slate-800 text-sm">Thông báo mới</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] text-rose-500 hover:text-rose-600 font-bold transition-colors"
                    >
                      Đọc tất cả
                    </button>
                  )}
                </div>
                
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                      <span className="material-symbols-outlined text-3xl mb-1 text-slate-300">notifications_off</span>
                      <span className="text-[11px] font-medium">Không có thông báo nào</span>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`flex items-start gap-3 p-3 hover:bg-slate-50 transition-colors cursor-pointer relative ${!notif.isRead ? "bg-rose-500/5" : ""}`}
                      >
                        {!notif.isRead && (
                          <span className="absolute top-4 right-3 w-2 h-2 bg-rose-500 rounded-full"></span>
                        )}

                        <div className="w-9 h-9 rounded-full bg-rose-50/50 flex-shrink-0 overflow-hidden flex items-center justify-center border border-rose-100/50 text-rose-500">
                          {notif.thumbnailImage ? (
                            <img src={notif.thumbnailImage} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="material-symbols-outlined text-lg">
                              {getNotifIcon(notif.type)}
                            </span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0 pr-2">
                          <p className={`text-xs text-slate-800 line-clamp-1 leading-snug ${!notif.isRead ? "font-bold" : "font-semibold"}`}>
                            {notif.title}
                          </p>
                          <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-snug">
                            {notif.shortDescription}
                          </p>
                          <span className="text-[9px] text-slate-400 font-bold block mt-1">
                            {formatTime(notif.createdAt)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="px-3 pt-2 mt-2 border-t border-slate-100">
                  <Link
                    href="/admin/notifications"
                    className="block text-center w-full py-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 transition-colors"
                    onClick={() => setIsNotifDropdownOpen(false)}
                  >
                    Xem tất cả thông báo
                  </Link>
                </div>
              </div>
            )}
          </div>
          <button className="material-symbols-outlined p-2 text-on-surface-variant hover:bg-primary-container/20 rounded-full transition-colors duration-300">settings</button>
          <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-primary-container">
            <img 
              alt="Admin Profile Avatar" 
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCtn-RPABrqyfAIk-Bol7wq_PAmzFO0RQccPYAVIGJTLXZIE2ypug3FJrFdrIcoxyyEIp0oSyNMKOHGT-aT-oDTQSI8g3dEYp7O9MYI5prps_co8yfSkh_Cu1n-lmp7QN_H_Fg-n1KONZK_cby4aQzkl4hykD5fFHyXAhB3Ci-nKb2yI5Jlty1I9JIDwnrT_GBkPsYDSKSeyt_birkk1ZG507kN25QVu7lzA5MoOOQ1iHkIJActwwm73iL00BYzLL0xa58jmYVecLco" 
            />
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar Shell */}
        <aside className="fixed left-0 top-0 h-full w-72 py-md gap-sm bg-surface-container-low flex flex-col z-50 shadow-xl shadow-primary/5 transition-all overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
          <div className="px-md mb-lg">
            <div className="flex items-center gap-sm mb-xs">
              <span className="material-symbols-outlined text-primary text-3xl">admin_panel_settings</span>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Laz<span className="text-rose-500">Pe</span> <span className="text-sm font-semibold text-slate-500">Admin</span>
              </h2>
            </div>
            <p className="font-label-sm text-label-sm text-on-surface-variant">Hệ thống quản lý LazPe</p>
          </div>
          
          <nav className="flex-1 space-y-md">
            {/* Tổng quan */}
            <div className="space-y-1">
              <span className="font-label-sm text-[12px] text-on-surface-variant font-bold uppercase tracking-wider px-4 block">Tổng quan</span>
              <Link
                href="/admin"
                className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-xl transition-all duration-200 ${isActive("/admin") ? "bg-primary-container text-on-primary-container font-bold" : "text-on-surface-variant hover:bg-secondary-container/50"}`}
              >
                <span className="material-symbols-outlined">dashboard</span>
                <span className="font-label-md">Tổng quan</span>
              </Link>
            </div>

            {/* Sản phẩm */}
            <div className="space-y-1">
              <span className="font-label-sm text-[12px] text-on-surface-variant font-bold uppercase tracking-wider px-4 block">Sản phẩm</span>
              <Link
                href="/admin/products"
                className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-xl transition-all duration-200 ${isActive("/admin/products") ? "bg-primary-container text-on-primary-container font-bold" : "text-on-surface-variant hover:bg-secondary-container/50"}`}
              >
                <span className="material-symbols-outlined">inventory_2</span>
                <span className="font-label-md">Sản phẩm</span>
              </Link>
              <Link
                href="/admin/combo"
                className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-xl transition-all duration-200 ${isActive("/admin/combo") ? "bg-primary-container text-on-primary-container font-bold" : "text-on-surface-variant hover:bg-secondary-container/50"}`}
              >
                <span className="material-symbols-outlined">inventory</span>
                <span className="font-label-md">Combo</span>
              </Link>
              <Link
                href="/admin/categories"
                className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-xl transition-all duration-200 ${isActive("/admin/categories") ? "bg-primary-container text-on-primary-container font-bold" : "text-on-surface-variant hover:bg-secondary-container/50"}`}
              >
                <span className="material-symbols-outlined">category</span>
                <span className="font-label-md">Danh mục</span>
              </Link>
            </div>

            {/* Tài khoản */}
            <div className="space-y-1">
              <span className="font-label-sm text-[12px] text-on-surface-variant font-bold uppercase tracking-wider px-4 block">Tài khoản</span>
              <Link
                href="/admin/users"
                className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-xl transition-all duration-200 ${isActive("/admin/users") ? "bg-primary-container text-on-primary-container font-bold" : "text-on-surface-variant hover:bg-secondary-container/50"}`}
              >
                <span className="material-symbols-outlined">group</span>
                <span className="font-label-md">Người dùng</span>
              </Link>
              <Link
                href="/admin/permissions"
                className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-xl transition-all duration-200 ${isActive("/admin/permissions") ? "bg-primary-container text-on-primary-container font-bold" : "text-on-surface-variant hover:bg-secondary-container/50"}`}
              >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                <span className="font-label-md">Phân quyền</span>
              </Link>
            </div>

            {/* Đơn hàng */}
            <div className="space-y-1">
              <span className="font-label-sm text-[12px] text-on-surface-variant font-bold uppercase tracking-wider px-4 block">Đơn hàng</span>
              <Link
                href="/admin/orders"
                className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-xl transition-all duration-200 ${isActive("/admin/orders") ? "bg-primary-container text-on-primary-container font-bold" : "text-on-surface-variant hover:bg-secondary-container/50"}`}
              >
                <span className="material-symbols-outlined">shopping_cart</span>
                <span className="font-label-md">Đơn hàng</span>
              </Link>
            </div>

            {/* Tin nhắn hỗ trợ */}
            <div className="space-y-1">
              <span className="font-label-sm text-[12px] text-on-surface-variant font-bold uppercase tracking-wider px-4 block">Hỗ trợ</span>
              <Link
                href="/admin/chats"
                className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-xl transition-all duration-200 ${isActive("/admin/chats") ? "bg-primary-container text-on-primary-container font-bold" : "text-on-surface-variant hover:bg-secondary-container/50"}`}
              >
                <span className="material-symbols-outlined">chat</span>
                <span className="font-label-md">Tin nhắn</span>
              </Link>
            </div>

            {/* Thống kê */}
            <div className="space-y-1">
              <span className="font-label-sm text-[12px] text-on-surface-variant font-bold uppercase tracking-wider px-4 block">Thống kê</span>
              <Link
                href="/admin/statistics"
                className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-xl transition-all duration-200 ${isActive("/admin/statistics") ? "bg-primary-container text-on-primary-container font-bold" : "text-on-surface-variant hover:bg-secondary-container/50"}`}
              >
                <span className="material-symbols-outlined">bar_chart</span>
                <span className="font-label-md">Thống kê</span>
              </Link>
            </div>

            {/* Loyalty */}
            <div className="space-y-1">
              <span className="font-label-sm text-[12px] text-on-surface-variant font-bold uppercase tracking-wider px-4 block">Chương trình Loyalty</span>
              <Link
                href="/admin/loyalty"
                className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-xl transition-all duration-200 ${isActive("/admin/loyalty") ? "bg-primary-container text-on-primary-container font-bold" : "text-on-surface-variant hover:bg-secondary-container/50"}`}
              >
                <span className="material-symbols-outlined">loyalty</span>
                <span className="font-label-md">Quản lý Loyalty</span>
              </Link>
            </div>

            {/* Thông báo */}
            <div className="space-y-1">
              <span className="font-label-sm text-[12px] text-on-surface-variant font-bold uppercase tracking-wider px-4 block">Thông báo</span>
              <Link
                href="/admin/notifications"
                className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-xl transition-all duration-200 ${isActive("/admin/notifications") ? "bg-primary-container text-on-primary-container font-bold" : "text-on-surface-variant hover:bg-secondary-container/50"}`}
              >
                <span className="material-symbols-outlined">notifications</span>
                <span className="font-label-md">Quản lý thông báo</span>
              </Link>
            </div>
          </nav>
          
          <div className="mt-auto px-4 pb-md pt-md">
            <button className="w-full flex items-center justify-center gap-2 bg-secondary text-on-secondary font-label-md py-3 rounded-full hover:scale-105 active:scale-95 shadow-md transition-transform">
              <span className="material-symbols-outlined text-sm">help</span>
              Trung tâm hỗ trợ
            </button>
          </div>
        </aside>
        
        {/* Main Content Area */}
        <main className={`flex-1 ml-72 flex flex-col ${pathname === "/admin/chats" ? "h-[calc(133.33vh-5rem)] p-4 pb-2" : "p-margin-desktop min-h-0"}`}>
          <div className="flex-1 flex flex-col min-h-0">
            {children}
          </div>
          
          {/* Footer Shell */}
          <footer className={`flex justify-between items-center text-on-surface-variant font-label-sm border-t border-surface-container-high/50 bg-background ${pathname === "/admin/chats" ? "py-2 mt-2" : "py-md mt-lg"}`}>
            <p>© 2024 Hệ thống quản lý LazPe. Bảo lưu mọi quyền.</p>
            <div className="flex gap-md">
              <a className="hover:text-primary transition-colors" href="#">Chính sách bảo mật</a>
              <a className="hover:text-primary transition-colors" href="#">Điều khoản dịch vụ</a>
              <a className="hover:text-primary transition-colors" href="#">Hướng dẫn quản trị</a>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}