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
  const [isSettingsDropdownOpen, setIsSettingsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarPinned, setIsSidebarPinned] = useState(true);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  useEffect(() => {
    const savedPin = localStorage.getItem("sidebarPinned");
    if (savedPin !== null) {
      setIsSidebarPinned(savedPin === "true");
    }
  }, []);

  const handleTogglePin = () => {
    const newVal = !isSidebarPinned;
    setIsSidebarPinned(newVal);
    localStorage.setItem("sidebarPinned", String(newVal));
  };

  const isSidebarExpanded = isSidebarPinned || isSidebarHovered;
  const sidebarWidth = isSidebarExpanded ? "w-72" : "w-[84px]";
  const marginLeft = isSidebarExpanded ? "lg:ml-72" : "lg:ml-[84px]";

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
        accessTokenFactory: () => token,
        transport: signalR.HttpTransportType.ServerSentEvents | signalR.HttpTransportType.LongPolling
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

        // Chỉ đăng xuất nếu lỗi là 401 Unauthorized (Token hết hạn/sai)
        if (res.status === 401) {
          clearAuth();
          window.location.replace("/login");
          return;
        }

        // Bỏ qua lỗi 429 (Rate Limit) hoặc 5xx (Server Error), không đăng xuất người dùng
        if (!res.ok) {
          // Thử lấy User từ LocalStorage nếu server đang sập tạm thời
          const storage = localStorage.getItem("token") ? localStorage : sessionStorage;
          const cachedUser = storage.getItem("user");
          if (cachedUser) {
             setIsAuth(true);
             setUser(JSON.parse(cachedUser));
          }
          return;
        }

        const data = await res.json();
        const apiUser = data.user;
        const roles = apiUser?.roles || [];
        const permissions = apiUser?.permissions || [];
        const hasDashboardAccess = apiUser?.isAdmin || roles.includes("Admin") || permissions.includes("Admin.Access");
        
        if (data.success && !hasDashboardAccess) {
          // Người dùng hợp lệ nhưng không có quyền truy cập Admin
          clearAuth();
          window.location.replace("/login");
        } else if (data.success && apiUser) {
          setIsAuth(true);
          setUser(apiUser);
          const storage = localStorage.getItem("token") ? localStorage : sessionStorage;
          storage.setItem("user", JSON.stringify(apiUser));
        } else if (!data.success && data.message === 'Too many requests.') {
           // Giữ nguyên phiên đăng nhập nếu bị rate limit
           setIsAuth(true);
        }
      } catch (e) {
        console.warn("Auth check failed due to network or server issue, preserving session");
        // Không gọi clearAuth() ở đây để tránh văng web khi server rớt tạm thời
      }
    };
    checkAuth();
  }, [router, pathname, isAuth]);

  const isActive = (path: string, excludes: string[] = []) => {
    if (path === "/admin" && pathname !== "/admin") return false;
    if (excludes.some(ex => pathname?.startsWith(ex))) return false;
    return pathname?.startsWith(path);
  };

  const hasPermission = (permissionName: string) => {
    if (!user) return false;
    if (user.isAdmin || user.roles?.includes("Admin")) return true;
    return user.permissions?.includes(permissionName) || false;
  };

  // Route Guard checks for subpaths
  useEffect(() => {
    if (!isAuth || !user) return;

    let requiredPermission: string | null = null;
    if (pathname.startsWith("/admin/statistics")) requiredPermission = "Analytics.Read";
    else if (pathname.startsWith("/admin/orders")) requiredPermission = "Order.Read";
    else if (pathname.startsWith("/admin/tracking")) requiredPermission = "Order.Read";
    else if (pathname.startsWith("/admin/reviews")) requiredPermission = "Review.Read";
    else if (pathname.startsWith("/admin/products")) requiredPermission = "Product.Read";
    else if (pathname.startsWith("/admin/combo")) requiredPermission = "Bundle.Read";
    else if (pathname.startsWith("/admin/categories")) requiredPermission = "Category.Read";
    else if (pathname.startsWith("/admin/brands")) requiredPermission = "Supplier.Read";
    else if (pathname.startsWith("/admin/vouchers")) requiredPermission = "Voucher.Read";
    else if (pathname.startsWith("/admin/flash-sales")) requiredPermission = "FlashSale.Read";
    else if (pathname.startsWith("/admin/loyalty")) requiredPermission = "Loyalty.Read";
    else if (pathname.startsWith("/admin/users")) requiredPermission = "User.Read";
    else if (pathname.startsWith("/admin/permissions")) requiredPermission = "Permission.Read";
    else if (pathname.startsWith("/admin/role-templates")) requiredPermission = "Permission.Read";
    else if (pathname.startsWith("/admin/chats")) requiredPermission = "Chat.Manage";
    else if (pathname.startsWith("/admin/notifications")) requiredPermission = "Notification.Read";

    if (requiredPermission && !hasPermission(requiredPermission)) {
      toast.error("Bạn không có quyền truy cập vào chức năng này.");
      router.replace("/admin");
    }
  }, [pathname, isAuth, user, router]);

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

  if (pathname?.endsWith("/print") || pathname?.includes("/batch-print/execute")) {
    return (
      <div className="bg-white min-h-screen font-body-md text-black print:m-0 print:p-0">
        {children}
      </div>
    );
  }

  return (
    <div className="bg-background font-body-md text-on-surface min-h-[117.65vh] flex flex-col relative admin-scaled-layout">
      {/* Mobile Top Navigation */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-slate-100 shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="material-symbols-outlined p-2 hover:bg-slate-100 rounded-full cursor-pointer text-slate-700"
          >
            menu
          </button>
          <Image 
            src="/logo/Logo_2.png" 
            alt="LazPe Logo" 
            width={120} 
            height={32} 
            className="object-contain h-8 w-auto"
            priority
          />
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
      <header className="hidden lg:flex sticky top-0 z-40 items-center justify-between w-full h-16 px-margin-desktop bg-surface-container-lowest shadow-sm shadow-primary/10 transition-all duration-300">
        <div className={`flex items-center gap-4 flex-1 max-w-2xl pr-8 transition-all duration-300 ${marginLeft}`}>
          <button 
            onClick={handleTogglePin} 
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-slate-100 text-slate-600 transition-colors flex-shrink-0"
            title={isSidebarPinned ? "Thu gọn Sidebar" : "Mở rộng Sidebar"}
          >
            <span className="material-symbols-outlined text-[24px]">
              {isSidebarPinned ? "menu_open" : "menu"}
            </span>
          </button>
          
          <div className="relative w-full group">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] group-focus-within:text-primary transition-colors">search</span>
            <input 
              type="text" 
              placeholder="Tìm kiếm nhanh mã đơn hàng, sản phẩm, email khách hàng..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-[8px] focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm outline-none text-slate-700 font-medium" 
            />
          </div>
        </div>
        <div className="flex items-center gap-md">
          <div className="relative">
            <button
              onClick={() => setIsNotifDropdownOpen(!isNotifDropdownOpen)}
              className={`material-symbols-outlined p-2 text-on-surface-variant hover:bg-primary-container/20 rounded-full transition-colors duration-300 relative focus:outline-none ${unreadCount > 0 ? "animate-pulse" : ""}`}
              title="Thông báo">
              notifications
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 bg-rose-500 text-white text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown Panel */}
            {isNotifDropdownOpen && (
              <div className="absolute right-0 mt-3 w-80 bg-white rounded-[8px] shadow-[0_10px_30px_rgba(0,0,0,0.08)] border border-slate-100 py-3 z-50 text-slate-800">
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
                    className="block text-center w-full py-2 bg-slate-50 hover:bg-slate-100 rounded-[8px] text-xs font-bold text-slate-700 transition-colors"
                    onClick={() => setIsNotifDropdownOpen(false)}
                  >
                    Xem tất cả thông báo
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button 
              onClick={() => {
                setIsSettingsDropdownOpen(!isSettingsDropdownOpen);
                setIsNotifDropdownOpen(false);
              }}
              className="material-symbols-outlined p-2 text-on-surface-variant hover:bg-primary-container/20 rounded-full transition-colors duration-300 focus:outline-none"
              title="Cài đặt hệ thống"
            >
              settings
            </button>
            
            {isSettingsDropdownOpen && (
              <div className="absolute right-0 mt-3 w-56 bg-white rounded-[8px] shadow-[0_10px_30px_rgba(0,0,0,0.08)] border border-slate-100 py-2 z-50 text-slate-800">
                <div className="px-4 pb-2 border-b border-slate-100 mb-2">
                  <span className="font-bold text-slate-800 text-sm">Bảo mật hệ thống</span>
                </div>
                
                {hasPermission("Admin.Access") ? (
                  <>
                    <Link
                      href="/admin/blocked-ips"
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-sm text-slate-700"
                      onClick={() => setIsSettingsDropdownOpen(false)}
                    >
                      <span className="material-symbols-outlined text-[20px] text-slate-400">block</span>
                      <span className="font-medium">IP Bị Chặn</span>
                    </Link>
                    <Link
                      href="/admin/security-logs"
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-sm text-slate-700"
                      onClick={() => setIsSettingsDropdownOpen(false)}
                    >
                      <span className="material-symbols-outlined text-[20px] text-slate-400">security</span>
                      <span className="font-medium">Nhật ký Anti-Spam</span>
                    </Link>
                  </>
                ) : (
                  <div className="px-4 py-3 text-xs text-slate-500 text-center">
                    Không có quyền truy cập
                  </div>
                )}
              </div>
            )}
          </div>

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
        <aside 
          onMouseEnter={() => !isSidebarPinned && setIsSidebarHovered(true)}
          onMouseLeave={() => !isSidebarPinned && setIsSidebarHovered(false)}
          className={`fixed left-0 top-0 h-full py-md gap-sm bg-surface-container-low flex flex-col z-50 shadow-xl shadow-primary/5 border-r border-slate-200 transition-all duration-300 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 ${sidebarWidth}`} 
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <div className="px-md mb-lg">
            <div className={`flex items-center ${isSidebarExpanded ? 'justify-between' : 'justify-center'} mb-xs`}>
              <div className="flex items-center w-full">
                {isSidebarExpanded ? (
                  <div className="relative w-64 h-20 flex items-center justify-start -ml-2">
                    <img 
                      src="/logo/Logo_2.png" 
                      alt="LazPe Admin Logo" 
                      className="w-full h-full object-contain object-left mix-blend-multiply animate-in fade-in zoom-in-95 duration-300"
                    />
                  </div>
                ) : (
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <img 
                      src="/logo/icon_logo.svg" 
                      alt="LazPe Admin Icon" 
                      className="w-full h-full object-contain mix-blend-multiply"
                    />
                  </div>
                )}
              </div>
            </div>

          </div>
          
          <nav className="flex-1 space-y-md pb-4">
            {/* TRUNG TÂM ĐIỀU HÀNH */}
            <div className="space-y-1">
              {isSidebarExpanded ? (
                <span className="font-label-sm text-[12px] text-on-surface-variant font-bold uppercase tracking-wider px-4 block whitespace-nowrap animate-in fade-in duration-300">Trung tâm điều hành</span>
              ) : (
                <div className="flex justify-center mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mx-0.5"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mx-0.5"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mx-0.5"></div>
                </div>
              )}
              <Link
                href="/admin"
                className={`flex items-center py-3.5 mx-3 rounded-[8px] transition-all duration-200 ${isActive("/admin") ? "bg-primary-container text-on-primary-container font-bold shadow-sm shadow-primary/20" : "text-on-surface-variant hover:bg-secondary-container/50"} ${isSidebarExpanded ? "px-4 gap-3" : "px-0 justify-center"}`}
                title={!isSidebarExpanded ? "Bảng điều khiển" : undefined}
              >
                <span className="material-symbols-outlined text-[22px] flex-shrink-0">dashboard</span>
                {isSidebarExpanded && <span className="text-[14.5px] font-semibold whitespace-nowrap animate-in fade-in duration-300">Bảng điều khiển</span>}
              </Link>
              {hasPermission("Analytics.Read") && (
                <Link
                  href="/admin/statistics"
                  className={`flex items-center py-3.5 mx-3 rounded-[8px] transition-all duration-200 ${isActive("/admin/statistics") ? "bg-primary-container text-on-primary-container font-bold shadow-sm shadow-primary/20" : "text-on-surface-variant hover:bg-secondary-container/50"} ${isSidebarExpanded ? "px-4 gap-3" : "px-0 justify-center"}`}
                  title={!isSidebarExpanded ? "Thống kê doanh thu" : undefined}
                >
                  <span className="material-symbols-outlined text-[22px] flex-shrink-0">bar_chart</span>
                  {isSidebarExpanded && <span className="text-[14.5px] font-semibold whitespace-nowrap animate-in fade-in duration-300">Thống kê doanh thu</span>}
                </Link>
              )}
            </div>

            {/* QUẢN LÝ KINH DOANH */}
            {(hasPermission("Order.Read") || hasPermission("Review.Read")) && (
              <div className="space-y-1 pt-2">
                {isSidebarExpanded ? (
                  <span className="font-label-sm text-[12px] text-on-surface-variant font-bold uppercase tracking-wider px-4 block whitespace-nowrap animate-in fade-in duration-300">Quản lý kinh doanh</span>
                ) : (
                  <div className="flex justify-center mb-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mx-0.5"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mx-0.5"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mx-0.5"></div>
                  </div>
                )}
                {hasPermission("Order.Read") && (
                  <>
                    <Link
                      href="/admin/orders"
                      className={`flex items-center py-3.5 mx-3 rounded-[8px] transition-all duration-200 ${isActive("/admin/orders", ["/admin/orders/batch-print"]) ? "bg-primary-container text-on-primary-container font-bold shadow-sm shadow-primary/20" : "text-on-surface-variant hover:bg-secondary-container/50"} ${isSidebarExpanded ? "px-4 gap-3" : "px-0 justify-center"}`}
                      title={!isSidebarExpanded ? "Xử lý Đơn hàng" : undefined}
                    >
                      <span className="material-symbols-outlined text-[22px] flex-shrink-0">shopping_cart</span>
                      {isSidebarExpanded && <span className="text-[14.5px] font-semibold whitespace-nowrap animate-in fade-in duration-300">Xử lý Đơn hàng</span>}
                    </Link>
                    <Link
                      href="/admin/tracking"
                      className={`flex items-center py-3.5 mx-3 rounded-[8px] transition-all duration-200 ${isActive("/admin/tracking") ? "bg-primary-container text-on-primary-container font-bold shadow-sm shadow-primary/20" : "text-on-surface-variant hover:bg-secondary-container/50"} ${isSidebarExpanded ? "px-4 gap-3" : "px-0 justify-center"}`}
                      title={!isSidebarExpanded ? "Tra cứu Đơn hàng" : undefined}
                    >
                      <span className="material-symbols-outlined text-[22px] flex-shrink-0">barcode_scanner</span>
                      {isSidebarExpanded && <span className="text-[14.5px] font-semibold whitespace-nowrap animate-in fade-in duration-300">Tra cứu Đơn hàng</span>}
                    </Link>
                    <Link
                      href="/admin/orders/batch-print"
                      className={`flex items-center py-3.5 mx-3 rounded-[8px] transition-all duration-200 ${isActive("/admin/orders/batch-print") ? "bg-primary-container text-on-primary-container font-bold shadow-sm shadow-primary/20" : "text-on-surface-variant hover:bg-secondary-container/50"} ${isSidebarExpanded ? "px-4 gap-3" : "px-0 justify-center"}`}
                      title={!isSidebarExpanded ? "In Đơn Hàng Loạt" : undefined}
                    >
                      <span className="material-symbols-outlined text-[22px] flex-shrink-0">print</span>
                      {isSidebarExpanded && <span className="text-[14.5px] font-semibold whitespace-nowrap animate-in fade-in duration-300">In Đơn Hàng Loạt</span>}
                    </Link>
                  </>
                )}
                {hasPermission("Review.Read") && (
                  <Link
                    href="/admin/reviews"
                    className={`flex items-center py-3.5 mx-3 rounded-[8px] transition-all duration-200 ${isActive("/admin/reviews") ? "bg-primary-container text-on-primary-container font-bold shadow-sm shadow-primary/20" : "text-on-surface-variant hover:bg-secondary-container/50"} ${isSidebarExpanded ? "px-4 gap-3" : "px-0 justify-center"}`}
                    title={!isSidebarExpanded ? "Kiểm duyệt Đánh giá" : undefined}
                  >
                    <span className="material-symbols-outlined text-[22px] flex-shrink-0">gavel</span>
                    {isSidebarExpanded && <span className="text-[14.5px] font-semibold whitespace-nowrap animate-in fade-in duration-300">Kiểm duyệt Đánh giá</span>}
                  </Link>
                )}
              </div>
            )}

            {/* DANH MỤC SẢN PHẨM */}
            {(hasPermission("Product.Read") || hasPermission("Bundle.Read") || hasPermission("Category.Read") || hasPermission("Supplier.Read")) && (
              <div className="space-y-1 pt-2">
                {isSidebarExpanded ? (
                  <span className="font-label-sm text-[12px] text-on-surface-variant font-bold uppercase tracking-wider px-4 block whitespace-nowrap animate-in fade-in duration-300">Danh mục sản phẩm</span>
                ) : (
                  <div className="flex justify-center mb-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mx-0.5"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mx-0.5"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mx-0.5"></div>
                  </div>
                )}
                {hasPermission("Product.Read") && (
                  <Link
                    href="/admin/products"
                    className={`flex items-center py-3.5 mx-3 rounded-[8px] transition-all duration-200 ${isActive("/admin/products") ? "bg-primary-container text-on-primary-container font-bold shadow-sm shadow-primary/20" : "text-on-surface-variant hover:bg-secondary-container/50"} ${isSidebarExpanded ? "px-4 gap-3" : "px-0 justify-center"}`}
                    title={!isSidebarExpanded ? "Kho Sản phẩm" : undefined}
                  >
                    <span className="material-symbols-outlined text-[22px] flex-shrink-0">inventory_2</span>
                    {isSidebarExpanded && <span className="text-[14.5px] font-semibold whitespace-nowrap animate-in fade-in duration-300">Kho Sản phẩm</span>}
                  </Link>
                )}
                {hasPermission("Bundle.Read") && (
                  <Link
                    href="/admin/combo"
                    className={`flex items-center py-3.5 mx-3 rounded-[8px] transition-all duration-200 ${isActive("/admin/combo") ? "bg-primary-container text-on-primary-container font-bold shadow-sm shadow-primary/20" : "text-on-surface-variant hover:bg-secondary-container/50"} ${isSidebarExpanded ? "px-4 gap-3" : "px-0 justify-center"}`}
                    title={!isSidebarExpanded ? "Gói Combo" : undefined}
                  >
                    <span className="material-symbols-outlined text-[22px] flex-shrink-0">inventory</span>
                    {isSidebarExpanded && <span className="text-[14.5px] font-semibold whitespace-nowrap animate-in fade-in duration-300">Gói Combo</span>}
                  </Link>
                )}
                {hasPermission("Category.Read") && (
                  <Link
                    href="/admin/categories"
                    className={`flex items-center py-3.5 mx-3 rounded-[8px] transition-all duration-200 ${isActive("/admin/categories") ? "bg-primary-container text-on-primary-container font-bold shadow-sm shadow-primary/20" : "text-on-surface-variant hover:bg-secondary-container/50"} ${isSidebarExpanded ? "px-4 gap-3" : "px-0 justify-center"}`}
                    title={!isSidebarExpanded ? "Phân loại Danh mục" : undefined}
                  >
                    <span className="material-symbols-outlined text-[22px] flex-shrink-0">category</span>
                    {isSidebarExpanded && <span className="text-[14.5px] font-semibold whitespace-nowrap animate-in fade-in duration-300">Phân loại Danh mục</span>}
                  </Link>
                )}
                {hasPermission("Supplier.Read") && (
                  <Link
                    href="/admin/brands"
                    className={`flex items-center py-3.5 mx-3 rounded-[8px] transition-all duration-200 ${isActive("/admin/brands") ? "bg-primary-container text-on-primary-container font-bold shadow-sm shadow-primary/20" : "text-on-surface-variant hover:bg-secondary-container/50"} ${isSidebarExpanded ? "px-4 gap-3" : "px-0 justify-center"}`}
                    title={!isSidebarExpanded ? "Thương hiệu" : undefined}
                  >
                    <span className="material-symbols-outlined text-[22px] flex-shrink-0">verified</span>
                    {isSidebarExpanded && <span className="text-[14.5px] font-semibold whitespace-nowrap animate-in fade-in duration-300">Thương hiệu</span>}
                  </Link>
                )}
              </div>
            )}

            {/* MARKETING & ƯU ĐÃI */}
            {(hasPermission("Voucher.Read") || hasPermission("FlashSale.Read") || hasPermission("Loyalty.Read") || hasPermission("Banner.Read")) && (
              <div className="space-y-1 pt-2">
                {isSidebarExpanded ? (
                  <span className="font-label-sm text-[12px] text-on-surface-variant font-bold uppercase tracking-wider px-4 block whitespace-nowrap animate-in fade-in duration-300">Marketing & Ưu đãi</span>
                ) : (
                  <div className="flex justify-center mb-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mx-0.5"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mx-0.5"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mx-0.5"></div>
                  </div>
                )}
                {hasPermission("Voucher.Read") && (
                  <Link
                    href="/admin/vouchers"
                    className={`flex items-center py-3.5 mx-3 rounded-[8px] transition-all duration-200 ${isActive("/admin/vouchers") ? "bg-primary-container text-on-primary-container font-bold shadow-sm shadow-primary/20" : "text-on-surface-variant hover:bg-secondary-container/50"} ${isSidebarExpanded ? "px-4 gap-3" : "px-0 justify-center"}`}
                    title={!isSidebarExpanded ? "Mã giảm giá (Voucher)" : undefined}
                  >
                    <span className="material-symbols-outlined text-[22px] flex-shrink-0">confirmation_number</span>
                    {isSidebarExpanded && <span className="text-[14.5px] font-semibold whitespace-nowrap animate-in fade-in duration-300">Mã giảm giá (Voucher)</span>}
                  </Link>
                )}
                {hasPermission("FlashSale.Read") && (
                  <Link
                    href="/admin/flash-sales"
                    className={`flex items-center py-3.5 mx-3 rounded-[8px] transition-all duration-200 ${isActive("/admin/flash-sales") ? "bg-primary-container text-on-primary-container font-bold shadow-sm shadow-primary/20" : "text-on-surface-variant hover:bg-secondary-container/50"} ${isSidebarExpanded ? "px-4 gap-3" : "px-0 justify-center"}`}
                    title={!isSidebarExpanded ? "Chiến dịch Flash Sale" : undefined}
                  >
                    <span className="material-symbols-outlined text-[22px] flex-shrink-0">bolt</span>
                    {isSidebarExpanded && <span className="text-[14.5px] font-semibold whitespace-nowrap animate-in fade-in duration-300">Chiến dịch Flash Sale</span>}
                  </Link>
                )}
                {hasPermission("Loyalty.Read") && (
                  <Link
                    href="/admin/loyalty"
                    className={`flex items-center py-3.5 mx-3 rounded-[8px] transition-all duration-200 ${isActive("/admin/loyalty") ? "bg-primary-container text-on-primary-container font-bold shadow-sm shadow-primary/20" : "text-on-surface-variant hover:bg-secondary-container/50"} ${isSidebarExpanded ? "px-4 gap-3" : "px-0 justify-center"}`}
                    title={!isSidebarExpanded ? "Chương trình Loyalty" : undefined}
                  >
                    <span className="material-symbols-outlined text-[22px] flex-shrink-0">loyalty</span>
                    {isSidebarExpanded && <span className="text-[14.5px] font-semibold whitespace-nowrap animate-in fade-in duration-300">Chương trình Loyalty</span>}
                  </Link>
                )}
                {hasPermission("Banner.Read") && (
                  <Link
                    href="/admin/banners"
                    className={`flex items-center py-3.5 mx-3 rounded-[8px] transition-all duration-200 ${isActive("/admin/banners") ? "bg-primary-container text-on-primary-container font-bold shadow-sm shadow-primary/20" : "text-on-surface-variant hover:bg-secondary-container/50"} ${isSidebarExpanded ? "px-4 gap-3" : "px-0 justify-center"}`}
                    title={!isSidebarExpanded ? "Quản lý Banner" : undefined}
                  >
                    <span className="material-symbols-outlined text-[22px] flex-shrink-0">view_carousel</span>
                    {isSidebarExpanded && <span className="text-[14.5px] font-semibold whitespace-nowrap animate-in fade-in duration-300">Quản lý Banner</span>}
                  </Link>
                )}
              </div>
            )}

            {/* NHÂN SỰ & NGƯỜI DÙNG */}
            <div className="space-y-1 pt-2">
              {isSidebarExpanded ? (
                <span className="font-label-sm text-[12px] text-on-surface-variant font-bold uppercase tracking-wider px-4 block whitespace-nowrap animate-in fade-in duration-300">Nhân sự & Người dùng</span>
              ) : (
                <div className="flex justify-center mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mx-0.5"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mx-0.5"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mx-0.5"></div>
                </div>
              )}
              {hasPermission("User.Read") && (
                <Link
                  href="/admin/users"
                  className={`flex items-center py-3.5 mx-3 rounded-[8px] transition-all duration-200 ${isActive("/admin/users") ? "bg-primary-container text-on-primary-container font-bold shadow-sm shadow-primary/20" : "text-on-surface-variant hover:bg-secondary-container/50"} ${isSidebarExpanded ? "px-4 gap-3" : "px-0 justify-center"}`}
                  title={!isSidebarExpanded ? "Tài khoản Hệ thống" : undefined}
                >
                  <span className="material-symbols-outlined text-[22px] flex-shrink-0">group</span>
                  {isSidebarExpanded && <span className="text-[14.5px] font-semibold whitespace-nowrap animate-in fade-in duration-300">Tài khoản Hệ thống</span>}
                </Link>
              )}
              {hasPermission("Permission.Read") && (
                <Link
                  href="/admin/permissions"
                  className={`flex items-center py-3.5 mx-3 rounded-[8px] transition-all duration-200 ${isActive("/admin/permissions") ? "bg-primary-container text-on-primary-container font-bold shadow-sm shadow-primary/20" : "text-on-surface-variant hover:bg-secondary-container/50"} ${isSidebarExpanded ? "px-4 gap-3" : "px-0 justify-center"}`}
                  title={!isSidebarExpanded ? "Phân quyền Truy cập" : undefined}
                >
                  <span className="material-symbols-outlined text-[22px] flex-shrink-0">person</span>
                  {isSidebarExpanded && <span className="text-[14.5px] font-semibold whitespace-nowrap animate-in fade-in duration-300">Phân quyền Truy cập</span>}
                </Link>
              )}

              <Link
                href="/admin/profile"
                className={`flex items-center py-3.5 mx-3 rounded-[8px] transition-all duration-200 ${isActive("/admin/profile") ? "bg-primary-container text-on-primary-container font-bold shadow-sm shadow-primary/20" : "text-on-surface-variant hover:bg-secondary-container/50"} ${isSidebarExpanded ? "px-4 gap-3" : "px-0 justify-center"}`}
                title={!isSidebarExpanded ? "Hồ sơ của tôi" : undefined}
              >
                <span className="material-symbols-outlined text-[22px] flex-shrink-0">account_circle</span>
                {isSidebarExpanded && <span className="text-[14.5px] font-semibold whitespace-nowrap animate-in fade-in duration-300">Hồ sơ của tôi</span>}
              </Link>
            </div>

            {/* TƯƠNG TÁC HỆ THỐNG */}
            {(hasPermission("Chat.Manage") || hasPermission("Notification.Read")) && (
              <div className="space-y-1 pt-2">
                {isSidebarExpanded ? (
                  <span className="font-label-sm text-[12px] text-on-surface-variant font-bold uppercase tracking-wider px-4 block whitespace-nowrap animate-in fade-in duration-300">Tương tác hệ thống</span>
                ) : (
                  <div className="flex justify-center mb-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mx-0.5"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mx-0.5"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mx-0.5"></div>
                  </div>
                )}
                {hasPermission("Chat.Manage") && (
                  <Link
                    href="/admin/chats"
                    className={`flex items-center py-3.5 mx-3 rounded-[8px] transition-all duration-200 ${isActive("/admin/chats") ? "bg-primary-container text-on-primary-container font-bold shadow-sm shadow-primary/20" : "text-on-surface-variant hover:bg-secondary-container/50"} ${isSidebarExpanded ? "px-4 gap-3" : "px-0 justify-center"}`}
                    title={!isSidebarExpanded ? "Tin nhắn Hỗ trợ" : undefined}
                  >
                    <span className="material-symbols-outlined text-[22px] flex-shrink-0">chat</span>
                    {isSidebarExpanded && <span className="text-[14.5px] font-semibold whitespace-nowrap animate-in fade-in duration-300">Tin nhắn Hỗ trợ</span>}
                  </Link>
                )}
                {hasPermission("Notification.Read") && (
                  <Link
                    href="/admin/notifications"
                    className={`flex items-center py-3.5 mx-3 rounded-[8px] transition-all duration-200 ${isActive("/admin/notifications") ? "bg-primary-container text-on-primary-container font-bold shadow-sm shadow-primary/20" : "text-on-surface-variant hover:bg-secondary-container/50"} ${isSidebarExpanded ? "px-4 gap-3" : "px-0 justify-center"}`}
                    title={!isSidebarExpanded ? "Thông báo nội bộ" : undefined}
                  >
                    <span className="material-symbols-outlined text-[22px] flex-shrink-0">notifications</span>
                    {isSidebarExpanded && <span className="text-[14.5px] font-semibold whitespace-nowrap animate-in fade-in duration-300">Thông báo nội bộ</span>}
                  </Link>
                )}
              </div>
            )}
          </nav>
          
          <div className={`mt-auto pb-md pt-md space-y-2 ${isSidebarExpanded ? "px-4" : "px-0 flex flex-col items-center"}`}>

            <button 
              onClick={handleLogout}
              className={`flex items-center justify-center gap-2 bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold rounded-[8px] transition-all cursor-pointer ${isSidebarExpanded ? "w-full py-3 px-4" : "w-[44px] h-[44px] mx-auto px-0 rounded-[8px] mt-2"}`}
              title={!isSidebarExpanded ? "Đăng xuất" : undefined}
            >
              <span className="material-symbols-outlined text-[20px] flex-shrink-0">logout</span>
              {isSidebarExpanded && <span className="whitespace-nowrap animate-in fade-in duration-300">Đăng xuất</span>}
            </button>
          </div>
        </aside>
        
        {/* Main Content Area */}
        <main className={`flex-1 flex flex-col transition-all duration-300 ${marginLeft} ${pathname === "/admin/chats" ? "h-[calc(117.65vh-4rem)] p-4 pb-2" : "p-4 md:p-margin-desktop min-h-0 w-full overflow-hidden"}`}>
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
          <div className="bg-white rounded-[8px] w-[420px] max-w-full p-8 border border-slate-100 shadow-2xl space-y-7 animate-in fade-in zoom-in-95 duration-200">
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
                className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-[8px] text-sm transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  clearAuth();
                  window.location.replace("/login");
                }}
                className="flex-1 py-3.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-[8px] text-sm transition-colors cursor-pointer"
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