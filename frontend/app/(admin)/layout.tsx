"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import * as signalR from "@microsoft/signalr";
import { toast } from "@/lib/toast";
import { getNotifications, getUnreadNotificationCount, markNotificationRead, markAllNotificationsRead, UserNotificationItem } from "@/lib/api";
import { getValidToken, clearAuth } from "@/lib/utils/auth";

import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
import AppSidebar from "@/components/admin/shared/AppSidebar";
import AppHeader from "@/components/admin/shared/AppHeader";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </SidebarProvider>
  );
}

function AdminLayoutContent({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isAuth, setIsAuth] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Notifications states
  const [notifications, setNotifications] = useState<UserNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const { isExpanded, isHovered, isMobileOpen, toggleMobileSidebar } = useSidebar();
  const isOpen = isExpanded || isHovered || isMobileOpen;

  // Synchronize token and isAuth with auth state
  useEffect(() => {
    const handleAuthChange = () => {
      const currentToken = getValidToken();
      setToken(currentToken);
      if (!currentToken) {
        setIsAuth(false);
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
        const user = data.user;
        const roles = user?.roles || [];
        const permissions = user?.permissions || [];
        const hasDashboardAccess = user?.isAdmin || roles.includes("Admin") || permissions.includes("Admin.Access");
        
        if (!data.success || !hasDashboardAccess) {
          clearAuth();
          window.location.replace("/login");
        } else {
          setIsAuth(true);
        }
      } catch (e) {
        clearAuth();
        window.location.replace("/login");
      }
    };
    checkAuth();
  }, [router, pathname, isAuth]);

  if (!isAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isOpen
    ? "lg:ml-[290px]"
    : "lg:ml-[90px]";

  return (
    <div className="min-h-screen lg:flex bg-gray-50 dark:bg-gray-950 font-outfit text-gray-900 dark:text-white/90" style={{ zoom: "85%" }}>
      {/* Sidebar navigation */}
      <AppSidebar />

      {/* Backdrop for mobile */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/50 lg:hidden backdrop-blur-xs"
          onClick={toggleMobileSidebar}
        />
      )}

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out ${mainContentMargin}`}>
        {/* App Header */}
        <AppHeader
          notifications={notifications}
          unreadCount={unreadCount}
          handleMarkAllRead={handleMarkAllRead}
          handleNotificationClick={handleNotificationClick}
          getNotifIcon={getNotifIcon}
          formatTime={formatTime}
        />

        {/* Content body */}
        <main className={`flex-1 flex flex-col min-h-0 ${pathname === "/admin/chats" ? "h-[calc(100vh-4.5rem)] p-4 pb-2" : "p-6 lg:p-8"}`}>
          <div className="flex-1 flex flex-col min-h-0">
            {children}
          </div>

          {/* Footer Shell */}
          <footer className={`flex flex-col sm:flex-row justify-between items-center text-xs text-gray-400 border-t border-gray-150 dark:border-gray-800 bg-transparent py-4 mt-8 gap-2`}>
            <p>© 2024 Hệ thống quản lý LazPe. Bảo lưu mọi quyền.</p>
            <div className="flex gap-4">
              <a className="hover:text-brand-500 transition-colors" href="#">Chính sách bảo mật</a>
              <a className="hover:text-brand-500 transition-colors" href="#">Điều khoản dịch vụ</a>
              <a className="hover:text-brand-500 transition-colors" href="#">Hướng dẫn quản trị</a>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}