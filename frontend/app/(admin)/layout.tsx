"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import * as signalR from "@microsoft/signalr";
import { toast } from "@/lib/toast";
import { getNotifications, getUnreadNotificationCount, markNotificationRead, markAllNotificationsRead, UserNotificationItem } from "@/lib/api";
import { getValidToken, clearAuth } from "@/lib/utils/auth";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isAuth, setIsAuth] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const pathname = usePathname();
  const router = useRouter();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Notifications states
  const [notifications, setNotifications] = useState<UserNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Synchronize token and isAuth with auth state
  useEffect(() => {
    const handleAuthChange = () => {
      const currentToken = getValidToken();
      setToken(currentToken);
      if (!currentToken) {
        setIsAuth(false);
        setUser(null);
      } else {
        const savedUserJson = localStorage.getItem("user") || sessionStorage.getItem("user");
        if (savedUserJson) {
          try {
            setUser(JSON.parse(savedUserJson));
          } catch (e) {
            console.error("Error parsing user from storage:", e);
          }
        }
      }
    };

    handleAuthChange();

    window.addEventListener("auth-change", handleAuthChange);
    return () => {
      window.removeEventListener("auth-change", handleAuthChange);
    };
  }, []);

  // Load notifications and setup SignalR connection reactively when token changes
  useEffect(() => {
    if (!token) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

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

    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5101/api";
    const hubUrl = apiBase.replace(/\/api$/, "") + "/notificationHub";

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
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
  }, [token]);

  const handleMarkAllRead = async () => {
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

  // Perform route guard checks on render and mount
  useEffect(() => {
    const currentToken = getValidToken();
    if (!currentToken) {
      clearAuth();
      setIsAuth(false);
      window.location.replace("/login");
      return;
    }

    if (isAuth) return;

    const checkAuth = async () => {
      try {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5101/api";
        const res = await fetch(`${API_BASE_URL}/Authentication/current-user`, {
          headers: {
            Authorization: `Bearer ${currentToken}`
          }
        });

        if (!res.ok) {
          clearAuth();
          window.location.replace("/login");
          return;
        }

        const data = await res.json();
        const apiUser = data.user;
        const roles = apiUser?.roles || [];
        const permissions = apiUser?.permissions || [];
        const hasDashboardAccess = apiUser?.isAdmin || roles.includes("Admin") || permissions.includes("Admin.Access");
        
        if (!data.success || !hasDashboardAccess) {
          clearAuth();
          window.location.replace("/login");
        } else {
          setIsAuth(true);
          setUser(apiUser);
          const storage = localStorage.getItem("token") ? localStorage : sessionStorage;
          storage.setItem("user", JSON.stringify(apiUser));
        }
      } catch (e) {
        clearAuth();
        window.location.replace("/login");
      }
    };
    checkAuth();
  }, [router, pathname, isAuth]);

  const isActive = (path: string) => {
    if (path === "/admin" && pathname !== "/admin") return false;
    return pathname?.startsWith(path);
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
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
      {/* Mobile Top Navigation */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-slate-100 shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="material-symbols-outlined p-2 hover:bg-slate-100 rounded-full cursor-pointer text-slate-700"
          >
            menu
          </button>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Laz<span className="text-rose-500">Pe</span>
          </h1>
        </div>
        <Link href="/admin/profile" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-full overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
            {user?.avatar ? (
              <img alt="Avatar" className="w-full h-full object-cover" src={user.avatar} />
            ) : (
              <span className="material-symbols-outlined text-slate-500 text-sm">person</span>
            )}
          </div>
        </Link>
      </div>

      {/* Top Navigation Shell (Desktop) */}
      <header className="hidden lg:flex sticky top-0 z-40 items-center justify-between w-full h-20 px-margin-desktop bg-surface-container-lowest shadow-sm shadow-primary/10">
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
          <Link href="/admin/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-primary-container bg-slate-100 flex items-center justify-center">
              {user?.avatar ? (
                <img 
                  alt="Admin Profile Avatar" 
                  className="w-full h-full object-cover"
                  src={user.avatar} 
                />
              ) : (
                <span className="material-symbols-outlined text-slate-500">person</span>
              )}
            </div>
            <div className="hidden md:flex flex-col items-start leading-none text-left">
              <span className="text-xs font-bold text-slate-800">{user?.fullName || "Quản trị viên"}</span>
              <span className="text-[10px] text-slate-500 mt-0.5">{user?.email || "admin@lazpe.com"}</span>
            </div>
          </Link>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Mobile Backdrop */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar Shell */}
        <aside className={`fixed left-0 top-0 h-full w-72 py-md gap-sm bg-surface-container-low flex flex-col z-50 shadow-xl shadow-primary/5 transition-transform duration-300 overflow-y-auto sidebar-scroll ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`} style={{ scrollbarWidth: "thin" }}>
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
                <span className="text-[14.5px] font-semibold">Tổng quan</span>
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
                <span className="text-[14.5px] font-semibold">Sản phẩm</span>
              </Link>
              <Link
                href="/admin/combo"
                className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-xl transition-all duration-200 ${isActive("/admin/combo") ? "bg-primary-container text-on-primary-container font-bold" : "text-on-surface-variant hover:bg-secondary-container/50"}`}
              >
                <span className="material-symbols-outlined">inventory</span>
                <span className="text-[14.5px] font-semibold">Combo</span>
              </Link>
              <Link
                href="/admin/categories"
                className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-xl transition-all duration-200 ${isActive("/admin/categories") ? "bg-primary-container text-on-primary-container font-bold" : "text-on-surface-variant hover:bg-secondary-container/50"}`}
              >
                <span className="material-symbols-outlined">category</span>
                <span className="text-[14.5px] font-semibold">Danh mục</span>
              </Link>
              <Link
                href="/admin/brands"
                className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-xl transition-all duration-200 ${isActive("/admin/brands") ? "bg-primary-container text-on-primary-container font-bold" : "text-on-surface-variant hover:bg-secondary-container/50"}`}
              >
                <span className="material-symbols-outlined">verified</span>
                <span className="text-[14.5px] font-semibold">Thương hiệu</span>
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
                <span className="text-[14.5px] font-semibold">Người dùng</span>
              </Link>
              <Link
                href="/admin/permissions"
                className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-xl transition-all duration-200 ${isActive("/admin/permissions") ? "bg-primary-container text-on-primary-container font-bold" : "text-on-surface-variant hover:bg-secondary-container/50"}`}
              >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                <span className="text-[14.5px] font-semibold">Phân quyền</span>
              </Link>
              <Link
                href="/admin/profile"
                className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-xl transition-all duration-200 ${isActive("/admin/profile") ? "bg-primary-container text-on-primary-container font-bold" : "text-on-surface-variant hover:bg-secondary-container/50"}`}
              >
                <span className="material-symbols-outlined">account_circle</span>
                <span className="text-[14.5px] font-semibold">Hồ sơ cá nhân</span>
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
                <span className="text-[14.5px] font-semibold">Đơn hàng</span>
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
                <span className="text-[14.5px] font-semibold">Tin nhắn</span>
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
                <span className="text-[14.5px] font-semibold">Thống kê</span>
              </Link>
            </div>

            {/* Loyalty & Vouchers */}
            <div className="space-y-1">
              <span className="font-label-sm text-[12px] text-on-surface-variant font-bold uppercase tracking-wider px-4 block">Khuyến mãi & Loyalty</span>
              <Link
                href="/admin/vouchers"
                className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-xl transition-all duration-200 ${isActive("/admin/vouchers") ? "bg-primary-container text-on-primary-container font-bold" : "text-on-surface-variant hover:bg-secondary-container/50"}`}
              >
                <span className="material-symbols-outlined">confirmation_number</span>
                <span className="text-[14.5px] font-semibold">Quản lý Voucher</span>
              </Link>
              <Link
                href="/admin/flash-sales"
                className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-xl transition-all duration-200 ${isActive("/admin/flash-sales") ? "bg-primary-container text-on-primary-container font-bold" : "text-on-surface-variant hover:bg-secondary-container/50"}`}
              >
                <span className="material-symbols-outlined">bolt</span>
                <span className="text-[14.5px] font-semibold">Quản lý Flash Sale</span>
              </Link>
              <Link
                href="/admin/loyalty"
                className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-xl transition-all duration-200 ${isActive("/admin/loyalty") ? "bg-primary-container text-on-primary-container font-bold" : "text-on-surface-variant hover:bg-secondary-container/50"}`}
              >
                <span className="material-symbols-outlined">loyalty</span>
                <span className="text-[14.5px] font-semibold">Quản lý Loyalty</span>
              </Link>
            </div>

            {/* Đánh giá */}
            <div className="space-y-1">
              <span className="font-label-sm text-[12px] text-on-surface-variant font-bold uppercase tracking-wider px-4 block">Đánh giá sản phẩm</span>
              <Link
                href="/admin/reviews"
                className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-xl transition-all duration-200 ${isActive("/admin/reviews") ? "bg-primary-container text-on-primary-container font-bold" : "text-on-surface-variant hover:bg-secondary-container/50"}`}
              >
                <span className="material-symbols-outlined">gavel</span>
                <span className="text-[14.5px] font-semibold">Kiểm duyệt đánh giá</span>
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
                <span className="text-[14.5px] font-semibold">Quản lý thông báo</span>
              </Link>
            </div>
          </nav>
          
          <div className="mt-auto px-4 pb-md pt-md space-y-2">
            <button className="w-full flex items-center justify-center gap-2 bg-secondary text-on-secondary font-label-md py-3 rounded-full hover:scale-105 active:scale-95 shadow-md transition-transform cursor-pointer">
              <span className="material-symbols-outlined text-sm">help</span>
              Trung tâm hỗ trợ
            </button>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 text-white font-label-md py-3 rounded-full hover:scale-105 active:scale-95 shadow-md shadow-rose-500/10 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">logout</span>
              Đăng xuất
            </button>
          </div>
        </aside>
        
        {/* Main Content Area */}
        <main className={`flex-1 lg:ml-72 flex flex-col ${pathname === "/admin/chats" ? "h-[calc(133.33vh-5rem)] p-4 pb-2" : "p-4 md:p-margin-desktop min-h-0 w-full overflow-hidden"}`}>
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

      {/* Custom Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-[420px] max-w-full p-8 border border-slate-100 shadow-2xl space-y-7 animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-3xl">logout</span>
              </div>
              <h3 className="text-lg font-extrabold text-slate-800">Xác nhận đăng xuất</h3>
              <p className="text-sm text-slate-500 font-semibold leading-relaxed">
                Bạn có chắc chắn muốn đăng xuất khỏi hệ thống quản trị LazPe không?
              </p>
            </div>
            
            <div className="flex gap-4 pt-3">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  clearAuth();
                  window.location.replace("/login");
                }}
                className="flex-1 py-3.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}