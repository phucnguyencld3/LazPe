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
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarPinned, setIsSidebarPinned] = useState(true);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    orders: false,
    products: false,
    marketing: false,
    users: false,
    interactions: false,
  });

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

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
        audio.play().catch(e => { console.warn("Audio play blocked/failed:", e); });
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
      window.location.href = `/admin/notifications/inbox?id=${notif.id}`;
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
          // Người dùng hợp lệ nhưng không có quyền truy cập Admin -> Chuyển đến trang 404
          window.location.replace("/404");
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
          <div className="h-9 w-9 rounded-[8px] overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
            {user?.avatar ? (
              <img alt="Avatar" className="w-full h-full object-cover" src={user.avatar} />
            ) : (
              <span className="material-symbols-outlined text-slate-500 text-sm">person</span>
            )}
          </div>
        </Link>
      </div>

      {/* Top Navigation Shell (Desktop) */}
      <header className="hidden lg:flex sticky top-0 z-40 items-center justify-between w-full h-16 px-margin-desktop bg-white shadow-sm border-b border-slate-100 transition-all duration-300">
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
            <input 
              type="text" 
              placeholder="Tìm kiếm nhanh mã đơn hàng, sản phẩm, email khách hàng..." 
              className="w-full h-11 pl-5 pr-14 rounded-[10px] border-2 border-primary/20 bg-slate-50 focus:bg-white focus:outline-none focus:border-primary transition-all text-sm placeholder:text-slate-400 font-medium" 
            />
            <button type="button" className="absolute right-1 top-1 bottom-1 w-12 bg-primary hover:bg-primary/90 text-white rounded-[8px] flex items-center justify-center transition-colors">
               <span className="material-symbols-outlined text-[20px]">search</span>
            </button>
          </div>
        </div>
        <div className="flex items-center gap-md">
          <div className="relative">
            <button
              onClick={() => setIsNotifDropdownOpen(!isNotifDropdownOpen)}
              className={`p-1.5 sm:p-2 text-slate-600 hover:text-primary rounded-[8px] transition-colors relative focus:outline-none ${unreadCount > 0 ? "animate-pulse" : ""}`}
              title="Thông báo"
            >
              <span className="material-symbols-outlined text-[24px]">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-primary text-white text-[9px] w-4.5 h-4.5 rounded-[6px] flex items-center justify-center font-bold">
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
                    href="/admin/notifications/inbox"
                    className="block text-center w-full py-2 bg-slate-50 hover:bg-slate-100 rounded-[8px] text-xs font-bold text-slate-700 transition-colors"
                    onClick={() => setIsNotifDropdownOpen(false)}
                  >
                    Xem tất cả thông báo
                  </Link>
                </div>
              </div>
            )}
          </div>
          <button className="p-1.5 sm:p-2 text-slate-600 hover:text-primary rounded-[8px] transition-colors" title="Cài đặt">
            <span className="material-symbols-outlined text-[24px]">settings</span>
          </button>
          
          <div 
            className="relative flex items-center h-full py-2"
            onMouseEnter={() => setIsUserDropdownOpen(true)}
            onMouseLeave={() => setIsUserDropdownOpen(false)}
          >
            {/* Avatar / Trigger */}
            <div className="flex items-center gap-2 transition-opacity cursor-pointer">
              <div className="h-10 w-10 rounded-[8px] overflow-hidden border-2 border-primary-container bg-slate-100 flex items-center justify-center hover:border-primary transition-all duration-200">
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
            </div>

            {/* Dropdown Menu */}
            <div className={`absolute right-0 top-full pt-1 w-56 origin-top-right z-50 before:content-[''] before:absolute before:-top-4 before:left-0 before:right-0 before:h-4 transition-all duration-150 ${
              isUserDropdownOpen 
                ? "opacity-100 pointer-events-auto scale-100" 
                : "opacity-0 pointer-events-none scale-95"
            }`}>
              <div className="bg-white rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.08)] border border-slate-100 overflow-hidden py-1">
                <div className="p-1 space-y-0.5">
                  <Link
                    href="/admin/profile"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold text-slate-600 hover:text-primary hover:bg-slate-50 transition-colors"
                    onClick={() => setIsUserDropdownOpen(false)}
                  >
                    <span className="material-symbols-outlined text-base">account_circle</span>
                    Hồ sơ của tôi
                  </Link>
                  <button
                    onClick={() => {
                      setIsUserDropdownOpen(false);
                      setShowLogoutConfirm(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors text-left"
                  >
                    <span className="material-symbols-outlined text-base">logout</span>
                    Đăng xuất
                  </button>
                </div>
              </div>
            </div>
          </div>
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
                className={`flex w-[calc(100%-1.5rem)] items-center py-2.5 mx-3 rounded-[8px] transition-all duration-200 ${isActive("/admin") ? "bg-primary-container text-on-primary-container font-bold shadow-sm shadow-primary/20" : "text-on-surface-variant hover:bg-secondary-container/50"} ${isSidebarExpanded ? "px-4 gap-3" : "px-0 justify-center"}`}
                title={!isSidebarExpanded ? "Bảng điều khiển" : undefined}
              >
                <span className="material-symbols-outlined text-[28px] flex-shrink-0">dashboard</span>
                {isSidebarExpanded && <span className="text-[17.5px] font-semibold whitespace-nowrap animate-in fade-in duration-300">Bảng điều khiển</span>}
              </Link>
              {hasPermission("Analytics.Read") && (
                <Link
                  href="/admin/statistics"
                  className={`flex w-[calc(100%-1.5rem)] items-center py-2.5 mx-3 rounded-[8px] transition-all duration-200 ${isActive("/admin/statistics") ? "bg-primary-container text-on-primary-container font-bold shadow-sm shadow-primary/20" : "text-on-surface-variant hover:bg-secondary-container/50"} ${isSidebarExpanded ? "px-4 gap-3" : "px-0 justify-center"}`}
                  title={!isSidebarExpanded ? "Thống kê doanh thu" : undefined}
                >
                  <span className="material-symbols-outlined text-[28px] flex-shrink-0">bar_chart</span>
                  {isSidebarExpanded && <span className="text-[17.5px] font-semibold whitespace-nowrap animate-in fade-in duration-300">Thống kê doanh thu</span>}
                </Link>
              )}
            </div>

            {/* ĐƠN HÀNG */}
            {(hasPermission("Order.Read") || hasPermission("Review.Read")) && (
              <div className="pt-1">
                {isSidebarExpanded ? (
                  <button onClick={() => toggleGroup('orders')} className={`flex w-[calc(100%-1.5rem)] items-center justify-between mx-3 py-2.5 px-4 rounded-[8px] group focus:outline-none cursor-pointer transition-all duration-200 ${expandedGroups.orders ? 'bg-primary-container/40' : 'hover:bg-secondary-container/50'}`}>
                    <div className="flex items-center gap-3">
                      <span className={`material-symbols-outlined text-[28px] flex-shrink-0 transition-colors ${expandedGroups.orders ? 'text-primary' : 'text-on-surface-variant group-hover:text-primary'}`}>shopping_cart</span>
                      <span className={`font-semibold text-[17.5px] whitespace-nowrap transition-colors ${expandedGroups.orders ? 'text-primary' : 'text-on-surface-variant group-hover:text-primary'}`}>Đơn hàng</span>
                    </div>
                    <span className={`material-symbols-outlined text-[24px] transition-transform duration-300 ${expandedGroups.orders ? 'rotate-180 text-primary' : 'text-on-surface-variant group-hover:text-primary'}`}>expand_more</span>
                  </button>
                ) : (
                  <button onClick={() => toggleGroup('orders')} className={`flex w-[calc(100%-1.5rem)] items-center justify-center mx-3 py-2.5 rounded-[8px] group focus:outline-none cursor-pointer transition-all duration-200 ${expandedGroups.orders ? 'bg-primary-container/40' : 'hover:bg-secondary-container/50'}`}>
                    <span className={`material-symbols-outlined text-[28px] transition-colors ${expandedGroups.orders ? 'text-primary' : 'text-on-surface-variant group-hover:text-primary'}`}>shopping_cart</span>
                  </button>
                )}
                
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${!isSidebarExpanded || expandedGroups.orders ? 'max-h-[500px] opacity-100 mt-1' : 'max-h-0 opacity-0 mt-0'}`}>
                  {hasPermission("Order.Read") && (
                    <>
                      <Link
                        href="/admin/orders"
                        className={`flex items-center py-2 mx-3 rounded-[8px] transition-all duration-200 ${isActive("/admin/orders", ["/admin/orders/batch-print"]) ? "bg-primary/10 text-primary font-bold" : "text-on-surface-variant hover:bg-secondary-container/50 hover:text-primary"} ${isSidebarExpanded ? "px-4 gap-3 pl-8" : "px-0 justify-center hidden"}`}
                      >
                        <span className="material-symbols-outlined text-[26px] flex-shrink-0">inventory_2</span>
                        <span className="text-[16.5px] font-medium whitespace-nowrap">Xử lý Đơn hàng</span>
                      </Link>
                      <Link
                        href="/admin/tracking"
                        className={`flex items-center py-2 mx-3 rounded-[8px] transition-all duration-200 ${isActive("/admin/tracking") ? "bg-primary/10 text-primary font-bold" : "text-on-surface-variant hover:bg-secondary-container/50 hover:text-primary"} ${isSidebarExpanded ? "px-4 gap-3 pl-8" : "px-0 justify-center hidden"}`}
                      >
                        <span className="material-symbols-outlined text-[26px] flex-shrink-0">barcode_scanner</span>
                        <span className="text-[16.5px] font-medium whitespace-nowrap">Tra cứu Đơn hàng</span>
                      </Link>
                      <Link
                        href="/admin/orders/batch-print"
                        className={`flex items-center py-2 mx-3 rounded-[8px] transition-all duration-200 ${isActive("/admin/orders/batch-print") ? "bg-primary/10 text-primary font-bold" : "text-on-surface-variant hover:bg-secondary-container/50 hover:text-primary"} ${isSidebarExpanded ? "px-4 gap-3 pl-8" : "px-0 justify-center hidden"}`}
                      >
                        <span className="material-symbols-outlined text-[26px] flex-shrink-0">print</span>
                        <span className="text-[16.5px] font-medium whitespace-nowrap">In Đơn Hàng Loạt</span>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* KIỂM DUYỆT ĐÁNH GIÁ (Single Link) */}
            {hasPermission("Review.Read") && (
              <div className="pt-1">
                <Link
                  href="/admin/reviews"
                  className={`flex w-[calc(100%-1.5rem)] items-center py-2.5 mx-3 rounded-[8px] transition-all duration-200 ${isActive("/admin/reviews") ? "bg-primary-container text-on-primary-container font-bold shadow-sm shadow-primary/20" : "text-on-surface-variant hover:bg-secondary-container/50"} ${isSidebarExpanded ? "px-4 gap-3" : "px-0 justify-center"}`}
                  title={!isSidebarExpanded ? "Kiểm duyệt Đánh giá" : undefined}
                >
                  <span className="material-symbols-outlined text-[28px] flex-shrink-0">gavel</span>
                  {isSidebarExpanded && <span className="text-[17.5px] font-semibold whitespace-nowrap animate-in fade-in duration-300">Đánh giá</span>}
                </Link>
              </div>
            )}

            {/* DANH MỤC SẢN PHẨM */}
            {(hasPermission("Product.Read") || hasPermission("Bundle.Read") || hasPermission("Category.Read") || hasPermission("Supplier.Read")) && (
              <div className="pt-1">
                {isSidebarExpanded ? (
                  <button onClick={() => toggleGroup('products')} className={`flex w-[calc(100%-1.5rem)] items-center justify-between mx-3 py-2.5 px-4 rounded-[8px] group focus:outline-none cursor-pointer transition-all duration-200 ${expandedGroups.products ? 'bg-primary-container/40' : 'hover:bg-secondary-container/50'}`}>
                    <div className="flex items-center gap-3">
                      <span className={`material-symbols-outlined text-[28px] flex-shrink-0 transition-colors ${expandedGroups.products ? 'text-primary' : 'text-on-surface-variant group-hover:text-primary'}`}>inventory_2</span>
                      <span className={`font-semibold text-[17.5px] whitespace-nowrap transition-colors ${expandedGroups.products ? 'text-primary' : 'text-on-surface-variant group-hover:text-primary'}`}>Sản phẩm</span>
                    </div>
                    <span className={`material-symbols-outlined text-[24px] transition-transform duration-300 ${expandedGroups.products ? 'rotate-180 text-primary' : 'text-on-surface-variant group-hover:text-primary'}`}>expand_more</span>
                  </button>
                ) : (
                  <button onClick={() => toggleGroup('products')} className={`flex w-[calc(100%-1.5rem)] items-center justify-center mx-3 py-2.5 rounded-[8px] group focus:outline-none cursor-pointer transition-all duration-200 ${expandedGroups.products ? 'bg-primary-container/40' : 'hover:bg-secondary-container/50'}`}>
                    <span className={`material-symbols-outlined text-[28px] transition-colors ${expandedGroups.products ? 'text-primary' : 'text-on-surface-variant group-hover:text-primary'}`}>inventory_2</span>
                  </button>
                )}
                
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${!isSidebarExpanded || expandedGroups.products ? 'max-h-[500px] opacity-100 mt-1' : 'max-h-0 opacity-0 mt-0'}`}>
                  {hasPermission("Product.Read") && (
                    <Link
                      href="/admin/products"
                      className={`flex items-center py-2 mx-3 rounded-[8px] transition-all duration-200 ${isActive("/admin/products") ? "bg-primary/10 text-primary font-bold" : "text-on-surface-variant hover:bg-secondary-container/50 hover:text-primary"} ${isSidebarExpanded ? "px-4 gap-3 pl-8" : "px-0 justify-center hidden"}`}
                    >
                      <span className="material-symbols-outlined text-[26px] flex-shrink-0">inventory_2</span>
                      <span className="text-[16.5px] font-medium whitespace-nowrap">Kho Sản phẩm</span>
                    </Link>
                  )}
                  {hasPermission("Bundle.Read") && (
                    <Link
                      href="/admin/combo"
                      className={`flex items-center py-2 mx-3 rounded-[8px] transition-all duration-200 ${isActive("/admin/combo") ? "bg-primary/10 text-primary font-bold" : "text-on-surface-variant hover:bg-secondary-container/50 hover:text-primary"} ${isSidebarExpanded ? "px-4 gap-3 pl-8" : "px-0 justify-center hidden"}`}
                    >
                      <span className="material-symbols-outlined text-[26px] flex-shrink-0">inventory</span>
                      <span className="text-[16.5px] font-medium whitespace-nowrap">Gói Combo</span>
                    </Link>
                  )}
                  {hasPermission("Category.Read") && (
                    <Link
                      href="/admin/categories"
                      className={`flex items-center py-2 mx-3 rounded-[8px] transition-all duration-200 ${isActive("/admin/categories") ? "bg-primary/10 text-primary font-bold" : "text-on-surface-variant hover:bg-secondary-container/50 hover:text-primary"} ${isSidebarExpanded ? "px-4 gap-3 pl-8" : "px-0 justify-center hidden"}`}
                    >
                      <span className="material-symbols-outlined text-[26px] flex-shrink-0">category</span>
                      <span className="text-[16.5px] font-medium whitespace-nowrap">Phân loại Danh mục</span>
                    </Link>
                  )}
                  {hasPermission("Supplier.Read") && (
                    <Link
                      href="/admin/brands"
                      className={`flex items-center py-2 mx-3 rounded-[8px] transition-all duration-200 ${isActive("/admin/brands") ? "bg-primary/10 text-primary font-bold" : "text-on-surface-variant hover:bg-secondary-container/50 hover:text-primary"} ${isSidebarExpanded ? "px-4 gap-3 pl-8" : "px-0 justify-center hidden"}`}
                    >
                      <span className="material-symbols-outlined text-[26px] flex-shrink-0">verified</span>
                      <span className="text-[16.5px] font-medium whitespace-nowrap">Thương hiệu</span>
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* MARKETING & ƯU ĐÃI */}
            {(hasPermission("Voucher.Read") || hasPermission("FlashSale.Read") || hasPermission("Loyalty.Read") || hasPermission("Banner.Read")) && (
              <div className="pt-1">
                {isSidebarExpanded ? (
                  <button onClick={() => toggleGroup('marketing')} className={`flex w-[calc(100%-1.5rem)] items-center justify-between mx-3 py-2.5 px-4 rounded-[8px] group focus:outline-none cursor-pointer transition-all duration-200 ${expandedGroups.marketing ? 'bg-primary-container/40' : 'hover:bg-secondary-container/50'}`}>
                    <div className="flex items-center gap-3">
                      <span className={`material-symbols-outlined text-[28px] flex-shrink-0 transition-colors ${expandedGroups.marketing ? 'text-primary' : 'text-on-surface-variant group-hover:text-primary'}`}>campaign</span>
                      <span className={`font-semibold text-[17.5px] whitespace-nowrap transition-colors ${expandedGroups.marketing ? 'text-primary' : 'text-on-surface-variant group-hover:text-primary'}`}>Marketing</span>
                    </div>
                    <span className={`material-symbols-outlined text-[24px] transition-transform duration-300 ${expandedGroups.marketing ? 'rotate-180 text-primary' : 'text-on-surface-variant group-hover:text-primary'}`}>expand_more</span>
                  </button>
                ) : (
                  <button onClick={() => toggleGroup('marketing')} className={`flex w-[calc(100%-1.5rem)] items-center justify-center mx-3 py-2.5 rounded-[8px] group focus:outline-none cursor-pointer transition-all duration-200 ${expandedGroups.marketing ? 'bg-primary-container/40' : 'hover:bg-secondary-container/50'}`}>
                    <span className={`material-symbols-outlined text-[28px] transition-colors ${expandedGroups.marketing ? 'text-primary' : 'text-on-surface-variant group-hover:text-primary'}`}>campaign</span>
                  </button>
                )}
                
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${!isSidebarExpanded || expandedGroups.marketing ? 'max-h-[500px] opacity-100 mt-1' : 'max-h-0 opacity-0 mt-0'}`}>
                  {hasPermission("Voucher.Read") && (
                    <Link
                      href="/admin/vouchers"
                      className={`flex items-center py-2 mx-3 rounded-[8px] transition-all duration-200 ${isActive("/admin/vouchers") ? "bg-primary/10 text-primary font-bold" : "text-on-surface-variant hover:bg-secondary-container/50 hover:text-primary"} ${isSidebarExpanded ? "px-4 gap-3 pl-8" : "px-0 justify-center hidden"}`}
                    >
                      <span className="material-symbols-outlined text-[26px] flex-shrink-0">confirmation_number</span>
                      <span className="text-[16.5px] font-medium whitespace-nowrap">Mã giảm giá</span>
                    </Link>
                  )}
                  {hasPermission("FlashSale.Read") && (
                    <Link
                      href="/admin/flash-sales"
                      className={`flex items-center py-2 mx-3 rounded-[8px] transition-all duration-200 ${isActive("/admin/flash-sales") ? "bg-primary/10 text-primary font-bold" : "text-on-surface-variant hover:bg-secondary-container/50 hover:text-primary"} ${isSidebarExpanded ? "px-4 gap-3 pl-8" : "px-0 justify-center hidden"}`}
                    >
                      <span className="material-symbols-outlined text-[26px] flex-shrink-0">bolt</span>
                      <span className="text-[16.5px] font-medium whitespace-nowrap">Flash Sale</span>
                    </Link>
                  )}
                  {hasPermission("Loyalty.Read") && (
                    <Link
                      href="/admin/loyalty"
                      className={`flex items-center py-2 mx-3 rounded-[8px] transition-all duration-200 ${isActive("/admin/loyalty") ? "bg-primary/10 text-primary font-bold" : "text-on-surface-variant hover:bg-secondary-container/50 hover:text-primary"} ${isSidebarExpanded ? "px-4 gap-3 pl-8" : "px-0 justify-center hidden"}`}
                    >
                      <span className="material-symbols-outlined text-[26px] flex-shrink-0">loyalty</span>
                      <span className="text-[16.5px] font-medium whitespace-nowrap">Loyalty</span>
                    </Link>
                  )}
                  {hasPermission("Banner.Read") && (
                    <Link
                      href="/admin/banners"
                      className={`flex items-center py-2 mx-3 rounded-[8px] transition-all duration-200 ${isActive("/admin/banners") ? "bg-primary/10 text-primary font-bold" : "text-on-surface-variant hover:bg-secondary-container/50 hover:text-primary"} ${isSidebarExpanded ? "px-4 gap-3 pl-8" : "px-0 justify-center hidden"}`}
                    >
                      <span className="material-symbols-outlined text-[26px] flex-shrink-0">view_carousel</span>
                      <span className="text-[16.5px] font-medium whitespace-nowrap">Quản lý Banner</span>
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* RÚT TIỀN (Single Link) */}
            <div className="pt-1">
              <Link
                href="/admin/withdrawals"
                className={`flex w-[calc(100%-1.5rem)] items-center py-2.5 mx-3 rounded-[8px] transition-all duration-200 ${isActive("/admin/withdrawals") ? "bg-primary-container text-on-primary-container font-bold shadow-sm shadow-primary/20" : "text-on-surface-variant hover:bg-secondary-container/50"} ${isSidebarExpanded ? "px-4 gap-3" : "px-0 justify-center"}`}
                title={!isSidebarExpanded ? "Quản lý Rút tiền" : undefined}
              >
                <span className="material-symbols-outlined text-[28px] flex-shrink-0">account_balance</span>
                {isSidebarExpanded && <span className="text-[17.5px] font-semibold whitespace-nowrap animate-in fade-in duration-300">Tài chính</span>}
              </Link>
            </div>

            {/* NHÂN SỰ & NGƯỜI DÙNG */}
            <div className="pt-1">
              {isSidebarExpanded ? (
                <button onClick={() => toggleGroup('users')} className={`flex w-[calc(100%-1.5rem)] items-center justify-between mx-3 py-2.5 px-4 rounded-[8px] group focus:outline-none cursor-pointer transition-all duration-200 ${expandedGroups.users ? 'bg-primary-container/40' : 'hover:bg-secondary-container/50'}`}>
                  <div className="flex items-center gap-3">
                    <span className={`material-symbols-outlined text-[28px] flex-shrink-0 transition-colors ${expandedGroups.users ? 'text-primary' : 'text-on-surface-variant group-hover:text-primary'}`}>group</span>
                    <span className={`font-semibold text-[17.5px] whitespace-nowrap transition-colors ${expandedGroups.users ? 'text-primary' : 'text-on-surface-variant group-hover:text-primary'}`}>Người dùng</span>
                  </div>
                  <span className={`material-symbols-outlined text-[24px] transition-transform duration-300 ${expandedGroups.users ? 'rotate-180 text-primary' : 'text-on-surface-variant group-hover:text-primary'}`}>expand_more</span>
                </button>
              ) : (
                <button onClick={() => toggleGroup('users')} className={`flex w-[calc(100%-1.5rem)] items-center justify-center mx-3 py-2.5 rounded-[8px] group focus:outline-none cursor-pointer transition-all duration-200 ${expandedGroups.users ? 'bg-primary-container/40' : 'hover:bg-secondary-container/50'}`}>
                  <span className={`material-symbols-outlined text-[28px] transition-colors ${expandedGroups.users ? 'text-primary' : 'text-on-surface-variant group-hover:text-primary'}`}>group</span>
                </button>
              )}
              
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${!isSidebarExpanded || expandedGroups.users ? 'max-h-[500px] opacity-100 mt-1' : 'max-h-0 opacity-0 mt-0'}`}>
                {hasPermission("User.Read") && (
                  <Link
                    href="/admin/users"
                    className={`flex items-center py-2 mx-3 rounded-[8px] transition-all duration-200 ${isActive("/admin/users") ? "bg-primary/10 text-primary font-bold" : "text-on-surface-variant hover:bg-secondary-container/50 hover:text-primary"} ${isSidebarExpanded ? "px-4 gap-3 pl-8" : "px-0 justify-center hidden"}`}
                  >
                    <span className="material-symbols-outlined text-[26px] flex-shrink-0">group</span>
                    <span className="text-[16.5px] font-medium whitespace-nowrap">Tài khoản Hệ thống</span>
                  </Link>
                )}
                {hasPermission("Permission.Read") && (
                  <Link
                    href="/admin/permissions"
                    className={`flex items-center py-2 mx-3 rounded-[8px] transition-all duration-200 ${isActive("/admin/permissions") ? "bg-primary/10 text-primary font-bold" : "text-on-surface-variant hover:bg-secondary-container/50 hover:text-primary"} ${isSidebarExpanded ? "px-4 gap-3 pl-8" : "px-0 justify-center hidden"}`}
                  >
                    <span className="material-symbols-outlined text-[26px] flex-shrink-0">person</span>
                    <span className="text-[16.5px] font-medium whitespace-nowrap">Phân quyền Truy cập</span>
                  </Link>
                )}
                {hasPermission("Admin.Access") && (
                  <Link
                    href="/admin/blocked-ips"
                    className={`flex items-center py-2 mx-3 rounded-[8px] transition-all duration-200 ${isActive("/admin/blocked-ips") ? "bg-primary/10 text-primary font-bold" : "text-on-surface-variant hover:bg-secondary-container/50 hover:text-primary"} ${isSidebarExpanded ? "px-4 gap-3 pl-8" : "px-0 justify-center hidden"}`}
                  >
                    <span className="material-symbols-outlined text-[26px] flex-shrink-0">block</span>
                    <span className="text-[16.5px] font-medium whitespace-nowrap">IP Bị Chặn</span>
                  </Link>
                )}
              </div>
            </div>

            {/* TƯƠNG TÁC HỆ THỐNG */}
            {(hasPermission("Chat.Manage") || hasPermission("Notification.Read")) && (
              <div className="pt-1">
                {isSidebarExpanded ? (
                  <button onClick={() => toggleGroup('interactions')} className={`flex w-[calc(100%-1.5rem)] items-center justify-between mx-3 py-2.5 px-4 rounded-[8px] group focus:outline-none cursor-pointer transition-all duration-200 ${expandedGroups.interactions ? 'bg-primary-container/40' : 'hover:bg-secondary-container/50'}`}>
                    <div className="flex items-center gap-3">
                      <span className={`material-symbols-outlined text-[28px] flex-shrink-0 transition-colors ${expandedGroups.interactions ? 'text-primary' : 'text-on-surface-variant group-hover:text-primary'}`}>support_agent</span>
                      <span className={`font-semibold text-[17.5px] whitespace-nowrap transition-colors ${expandedGroups.interactions ? 'text-primary' : 'text-on-surface-variant group-hover:text-primary'}`}>Tương tác</span>
                    </div>
                    <span className={`material-symbols-outlined text-[24px] transition-transform duration-300 ${expandedGroups.interactions ? 'rotate-180 text-primary' : 'text-on-surface-variant group-hover:text-primary'}`}>expand_more</span>
                  </button>
                ) : (
                  <button onClick={() => toggleGroup('interactions')} className={`flex w-[calc(100%-1.5rem)] items-center justify-center mx-3 py-2.5 rounded-[8px] group focus:outline-none cursor-pointer transition-all duration-200 ${expandedGroups.interactions ? 'bg-primary-container/40' : 'hover:bg-secondary-container/50'}`}>
                    <span className={`material-symbols-outlined text-[28px] transition-colors ${expandedGroups.interactions ? 'text-primary' : 'text-on-surface-variant group-hover:text-primary'}`}>support_agent</span>
                  </button>
                )}
                
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${!isSidebarExpanded || expandedGroups.interactions ? 'max-h-[500px] opacity-100 mt-1' : 'max-h-0 opacity-0 mt-0'}`}>
                  {hasPermission("Chat.Manage") && (
                    <Link
                      href="/admin/chats"
                      className={`flex items-center py-2 mx-3 rounded-[8px] transition-all duration-200 ${isActive("/admin/chats") ? "bg-primary/10 text-primary font-bold" : "text-on-surface-variant hover:bg-secondary-container/50 hover:text-primary"} ${isSidebarExpanded ? "px-4 gap-3 pl-8" : "px-0 justify-center hidden"}`}
                    >
                      <span className="material-symbols-outlined text-[26px] flex-shrink-0">chat</span>
                      <span className="text-[16.5px] font-medium whitespace-nowrap">Tin nhắn Hỗ trợ</span>
                    </Link>
                  )}
                  {hasPermission("Notification.Read") && (
                    <Link
                      href="/admin/notifications"
                      className={`flex items-center py-2 mx-3 rounded-[8px] transition-all duration-200 ${isActive("/admin/notifications") ? "bg-primary/10 text-primary font-bold" : "text-on-surface-variant hover:bg-secondary-container/50 hover:text-primary"} ${isSidebarExpanded ? "px-4 gap-3 pl-8" : "px-0 justify-center hidden"}`}
                    >
                      <span className="material-symbols-outlined text-[26px] flex-shrink-0">notifications</span>
                      <span className="text-[16.5px] font-medium whitespace-nowrap">Thông báo nội bộ</span>
                    </Link>
                  )}
                </div>
              </div>
            )}
          </nav>
          
          <div className={`mt-auto pb-md pt-md space-y-2 ${isSidebarExpanded ? "px-4" : "px-0 flex flex-col items-center"}`}>
          </div>
        </aside>
        
        {/* Main Content Area */}
        <main className={`flex-1 flex flex-col transition-all duration-300 ${marginLeft} ${pathname?.includes("/chat") ? "h-[calc(117.647vh-4rem)] p-4 pb-2" : "p-4 md:p-margin-desktop min-h-0 w-full overflow-hidden"}`}>
          <div className="flex-1 flex flex-col min-h-0">
            {children}
          </div>
          
          {/* Footer Shell */}
          <footer className={`flex justify-between items-center text-on-surface-variant font-label-sm border-t border-surface-container-high/50 bg-background ${pathname?.includes("/chat") ? "py-2 mt-2 text-xs" : "py-md mt-lg"}`}>
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