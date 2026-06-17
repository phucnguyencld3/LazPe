'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, ShoppingCart, Bell, User, Heart, Menu } from 'lucide-react';
import { getNotifications, getUnreadNotificationCount, markNotificationRead, markAllNotificationsRead, UserNotificationItem } from "@/lib/api";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import { toast } from "@/lib/toast";
import * as signalR from "@microsoft/signalr";
import { getValidToken, clearAuth } from "@/lib/utils/auth";

export default function HeaderV2() {
  const [isAuth, setIsAuth] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const { cartCount } = useCart();
  
  // Notifications states
  const [notifications, setNotifications] = useState<UserNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);
  
  const { wishlist } = useWishlist();
  const wishlistCount = wishlist.length;
  const [mounted, setMounted] = useState(false);

  // Synchronize token and isAuth with auth state and handle changes reactively
  useEffect(() => {
    setMounted(true);

    const handleAuthChange = () => {
      const currentToken = getValidToken();
      setToken(currentToken);
      setIsAuth(!!currentToken);

      if (currentToken) {
        const savedUserJson = localStorage.getItem("user") || sessionStorage.getItem("user");
        if (savedUserJson) {
          try {
            setUser(JSON.parse(savedUserJson));
          } catch (e) {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };

    // Initial load
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
        console.error("Error loading header notifications:", err);
      }
    };

    loadNotifications(token);

    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5101/api";
    const hubUrl = apiBase.replace(/\/api$/, "") + "/notificationHub";

    // Thiết lập kết nối SignalR
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .build();

    connection.on("ReceiveNotification", (notif: UserNotificationItem) => {
      setNotifications((prev) => [notif, ...prev.slice(0, 4)]);
      setUnreadCount((prev) => prev + 1);
      
      // Hiển thị toast popup thông báo mới nhận
      toast.success(`Thông báo mới: ${notif.title}`);

      // Phát âm thanh thông báo
      try {
        const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-600.wav");
        audio.volume = 0.4;
        audio.play();
      } catch (e) {
        // Trình duyệt có thể block tự động phát tiếng
      }
    });

    const startPromise = connection.start().catch((err) => console.error("SignalR connection error:", err));

    return () => {
      startPromise.then(() => {
        connection.stop();
      });
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
      window.location.href = `/profile?tab=notifications&id=${notif.id}`;
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

  const handleLogout = () => {
    clearAuth();
    window.location.href = "/";
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-slate-200">
      {/* Main Header Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-0">
        <div className="flex flex-wrap items-center justify-between sm:h-16 gap-3 sm:gap-8">
          
          {/* Logo (Simple text like before) */}
          <Link href="/" className="flex-shrink-0">
            <span className="text-3xl font-bold text-slate-900 tracking-tight">
              Laz<span className="text-primary">Pe</span>
            </span>
          </Link>

          {/* Search Bar - Wide */}
          <div className="w-full order-last mt-2 sm:mt-0 sm:order-none sm:w-auto sm:flex-1 max-w-3xl">
            <div className="relative group">
              <input 
                type="text" 
                placeholder="Ba mẹ muốn tìm mua gì hôm nay?" 
                className="w-full h-11 pl-5 pr-14 rounded-full border-2 border-primary/20 bg-slate-50 focus:bg-white focus:outline-none focus:border-primary transition-all text-sm placeholder:text-slate-400"
              />
              <button className="absolute right-1 top-1 bottom-1 w-12 bg-primary hover:bg-primary/90 text-white rounded-full flex items-center justify-center transition-colors">
                <Search size={20} />
              </button>
            </div>
            {/* Quick search tags have been removed */}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <Link href="/wishlist" className="p-1.5 sm:p-2 text-slate-600 hover:text-slate-900 transition-colors relative" title="Sản phẩm yêu thích">
              <Heart size={22} className="hover:text-primary transition-colors" />
              {mounted && wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-semibold animate-in zoom-in-50 duration-150">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <Link href="/cart" className="p-1.5 sm:p-2 text-slate-600 hover:text-slate-900 transition-colors relative" title="Giỏ hàng">
              <ShoppingCart size={22} className="hover:text-primary transition-colors" />
              {mounted && cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-semibold">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Notification Bell */}
            {isAuth && (
              <div className="relative">
                <button
                  onClick={() => setIsNotifDropdownOpen(!isNotifDropdownOpen)}
                  className={`p-1.5 sm:p-2 text-slate-600 hover:text-primary rounded-full transition-colors relative focus:outline-none ${unreadCount > 0 ? "animate-pulse" : ""}`}
                  title="Thông báo"
                >
                  <Bell size={22} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-primary text-white text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Dropdown Panel */}
                {isNotifDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.08)] border border-slate-100 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100">
                      <span className="font-bold text-slate-800 text-sm">Thông báo mới</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-[11px] text-primary hover:text-primary font-bold transition-colors"
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
                            className={`flex items-start gap-3 p-3 hover:bg-slate-50 transition-colors cursor-pointer relative ${!notif.isRead ? "bg-primary/5" : ""}`}
                          >
                            {!notif.isRead && (
                              <span className="absolute top-4 right-3 w-2 h-2 bg-primary rounded-full"></span>
                            )}

                            <div className="w-9 h-9 rounded-full bg-primary/10 flex-shrink-0 overflow-hidden flex items-center justify-center border border-primary/20 text-primary">
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
                        href="/profile?tab=notifications"
                        className="block text-center w-full py-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 transition-colors"
                        onClick={() => setIsNotifDropdownOpen(false)}
                      >
                        Xem tất cả thông báo
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {isAuth ? (
              <div 
                className="relative flex items-center h-full py-2"
                onMouseEnter={() => setUserDropdownOpen(true)}
                onMouseLeave={() => setUserDropdownOpen(false)}
              >
                {/* Avatar / Circle Trigger */}
                <div className="w-9 h-9 rounded-full overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center transition-all duration-200 hover:border-primary cursor-pointer">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={18} className="text-slate-600" />
                  )}
                </div>

                {/* Dropdown Menu */}
                <div className={`absolute right-0 top-full pt-2 w-64 origin-top-right z-50 before:content-[''] before:absolute before:-top-4 before:left-0 before:right-0 before:h-4 transition-all duration-150 ${
                  userDropdownOpen 
                    ? "opacity-100 pointer-events-auto scale-100" 
                    : "opacity-0 pointer-events-none scale-95"
                }`}>
                  <div className="bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.08)] border border-slate-100 overflow-hidden py-2">
                    {/* User Info Header */}
                    <div className="px-4 py-3 border-b border-slate-50 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-100 bg-slate-50 flex-shrink-0 flex items-center justify-center">
                        {user?.avatar ? (
                          <img
                            src={user.avatar}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User size={20} className="text-slate-500" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate leading-snug">
                          {user?.fullName || "Người dùng"}
                        </p>
                        <p className="text-[11px] text-slate-400 font-semibold truncate mt-0.5">
                          {user?.email || ""}
                        </p>
                      </div>
                    </div>

                    {/* Navigation Links */}
                    <div className="p-1 space-y-0.5">
                      <Link
                        href="/profile?tab=profile"
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-primary hover:bg-slate-50 transition-colors"
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        <span className="material-symbols-outlined text-base">person</span>
                        Trang cá nhân
                      </Link>
                      <Link
                        href="/profile?tab=orders"
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-primary hover:bg-slate-50 transition-colors"
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        <span className="material-symbols-outlined text-base">shopping_bag</span>
                        Đơn hàng của tôi
                      </Link>
                      <Link
                        href="/wishlist"
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-primary hover:bg-slate-50 transition-colors"
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        <span className="material-symbols-outlined text-base">favorite</span>
                        Sản phẩm yêu thích
                      </Link>
                    </div>

                    {/* Logout Button */}
                    <div className="border-t border-slate-50 p-1 mt-1">
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-primary hover:bg-primary/10 transition-colors text-left"
                      >
                        <span className="material-symbols-outlined text-base">logout</span>
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-3">
                <Link 
                  href="/login" 
                  className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors px-3 py-2"
                >
                  Đăng nhập
                </Link>
                <Link 
                  href="/register" 
                  className="text-sm font-semibold text-white bg-primary hover:bg-primary/90 px-4 py-2 rounded-full transition-all duration-200 active:scale-95 shadow-sm"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
