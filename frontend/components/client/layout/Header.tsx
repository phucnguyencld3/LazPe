"use client";
 
import Link from "next/link";
import { ShoppingCart, User, Menu, ChevronDown, Heart, Bell } from "lucide-react";
import { useState, useEffect } from "react";
import { Category } from "@/types";
import { getCategories, getNotifications, getUnreadNotificationCount, markNotificationRead, markAllNotificationsRead, UserNotificationItem } from "@/lib/api";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import { toast } from "@/lib/toast";
import * as signalR from "@microsoft/signalr";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const { cartCount } = useCart();
  
  // Notifications states
  const [notifications, setNotifications] = useState<UserNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);
  
  const { wishlist } = useWishlist();
  const wishlistCount = wishlist.length;
  const [mounted, setMounted] = useState(false);
  
  // Categories State
  const [parentCategories, setParentCategories] = useState<Category[]>([]);
  const [categoryTree, setCategoryTree] = useState<Record<number, Category[]>>({});
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    setIsAuth(!!token);

    const loadCategories = async () => {
      try {
        const data = await getCategories();
        if (data) {
          // Parent categories are level 0 or parentId is null
          const parents = data.filter(
            (c) => c.parentId === null || c.parentId === undefined || c.level === 0
          );
          setParentCategories(parents);

          // Build tree mapping parentId -> subcategories
          const tree: Record<number, Category[]> = {};
          data.forEach((c) => {
            if (c.parentId !== null && c.parentId !== undefined) {
              if (!tree[c.parentId]) {
                tree[c.parentId] = [];
              }
              tree[c.parentId].push(c);
            }
          });
          setCategoryTree(tree);
        }
      } catch (err) {
        console.error("Error loading header categories:", err);
      }
    };



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

    loadCategories();
    if (token) {
      loadNotifications(token);

      // Thiết lập kết nối SignalR
      const connection = new signalR.HubConnectionBuilder()
        .withUrl("http://localhost:5101/notificationHub", {
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

      connection.start().catch((err) => console.error("SignalR connection error:", err));

      return () => {
        connection.stop();
      };
    }
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
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    setIsAuth(false);
    window.location.href = "/";
  };

  const navigation = [
    { label: "Tất cả sản phẩm", href: "/products" },
    { label: "Hàng mới", href: "/products?sort=newest" },
    { label: "Bán chạy", href: "/products?sort=bestseller" },
    { label: "Khuyến mãi", href: "/products?sort=sale" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-slate-200">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">
              Laz<span className="text-rose-500">Pe</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8 h-full relative">
            {/* Mega Menu Trigger */}
            <div
              className="h-full flex items-center"
              onMouseEnter={() => setMegaMenuOpen(true)}
              onMouseLeave={() => setMegaMenuOpen(false)}
            >
              <button 
                className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors h-full focus:outline-none"
              >
                Danh mục
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 ${
                    megaMenuOpen ? "rotate-180 text-rose-500" : ""
                  }`}
                />
              </button>

              {/* Mega Menu Dropdown */}
              {megaMenuOpen && parentCategories.length > 0 && (
                <div 
                  className="absolute top-full left-0 w-[600px] bg-white shadow-xl rounded-b-2xl border border-slate-100 p-6 z-50 grid grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-2 duration-150"
                  onMouseEnter={() => setMegaMenuOpen(true)}
                >
                  {parentCategories.map((parent) => {
                    const children = categoryTree[parent.id] || [];
                    return (
                      <div key={parent.id} className="space-y-2.5">
                        <Link
                          href={`/products?categoryId=${parent.id}`}
                          className="font-semibold text-slate-900 hover:text-rose-600 transition-colors text-sm block"
                          onClick={() => setMegaMenuOpen(false)}
                        >
                          {parent.name}
                        </Link>
                        {children.length > 0 && (
                          <ul className="space-y-1.5 border-l border-slate-100 pl-3">
                            {children.map((child) => (
                              <li key={child.id}>
                                <Link
                                  href={`/products?categoryId=${child.id}`}
                                  className="text-xs text-slate-600 hover:text-rose-500 transition-colors block py-0.5"
                                  onClick={() => setMegaMenuOpen(false)}
                                >
                                  {child.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Link href="/wishlist" className="p-2 text-slate-600 hover:text-slate-900 transition-colors relative" title="Sản phẩm yêu thích">
              <Heart size={20} className="hover:text-rose-500 transition-colors" />
              {mounted && wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-semibold animate-in zoom-in-50 duration-150">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <Link href="/cart" className="p-2 text-slate-600 hover:text-slate-900 transition-colors relative" title="Giỏ hàng">
              <ShoppingCart size={20} />
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-semibold">
                {cartCount}
              </span>
            </Link>

            {/* Notification Bell */}
            {isAuth && (
              <div className="relative">
                <button
                  onClick={() => setIsNotifDropdownOpen(!isNotifDropdownOpen)}
                  className={`p-2 text-slate-600 hover:text-rose-500 rounded-full transition-colors relative focus:outline-none ${unreadCount > 0 ? "animate-pulse" : ""}`}
                  title="Thông báo"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold">
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
              <div className="flex items-center gap-3">
                <Link href="/profile" className="p-2 text-slate-600 hover:text-slate-900 transition-colors" title="Trang cá nhân">
                  <User size={20} />
                </Link>
                <button 
                  onClick={handleLogout}
                  className="text-xs font-semibold text-rose-500 hover:text-rose-600 px-3 py-1.5 border border-rose-200 hover:border-rose-300 rounded-full transition-all"
                >
                  Đăng xuất
                </button>
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
                  className="text-sm font-semibold text-white bg-rose-500 hover:bg-rose-600 px-4 py-2 rounded-full transition-all duration-200 active:scale-95 shadow-sm"
                >
                  Đăng ký
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden p-2 text-slate-600 hover:text-slate-900"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu size={20} />
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 py-4 space-y-2 max-h-[80vh] overflow-y-auto">
            {/* Mobile Categories Collapsible */}
            {parentCategories.length > 0 && (
              <div>
                <button
                  onClick={() => setMobileCategoriesOpen(!mobileCategoriesOpen)}
                  className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <span>Danh mục sản phẩm</span>
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-200 ${
                      mobileCategoriesOpen ? "rotate-180 text-rose-500" : ""
                    }`}
                  />
                </button>
                {mobileCategoriesOpen && (
                  <div className="pl-6 pr-4 py-2 space-y-2.5 bg-slate-50 rounded-lg mt-1 mx-2">
                    {parentCategories.map((parent) => {
                      const children = categoryTree[parent.id] || [];
                      return (
                        <div key={parent.id} className="space-y-1">
                          <Link
                            href={`/products?categoryId=${parent.id}`}
                            className="block py-0.5 text-xs font-semibold text-slate-800 hover:text-rose-600"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            {parent.name}
                          </Link>
                          {children.map((child) => (
                            <Link
                              key={child.id}
                              href={`/products?categoryId=${child.id}`}
                              className="block py-0.5 pl-3 text-xs text-slate-500 hover:text-rose-500"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              - {child.name}
                            </Link>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            
            <Link
              href="/wishlist"
              className="block px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Heart size={16} className="text-slate-500" />
                  Sản phẩm yêu thích
                </span>
                {mounted && wishlistCount > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full font-semibold">
                    {wishlistCount}
                  </span>
                )}
              </div>
            </Link>
            
            {isAuth ? (
              <div className="border-t border-slate-100 pt-4 px-4 flex flex-col gap-2">
                <Link
                  href="/profile"
                  className="block px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Trang cá nhân
                </Link>
                <button 
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full text-center py-2 text-sm font-semibold text-rose-500 border border-rose-200 rounded-lg hover:bg-rose-50"
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <div className="border-t border-slate-100 pt-4 px-4 flex flex-col gap-2">
                <Link 
                  href="/login" 
                  className="w-full text-center py-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Đăng nhập
                </Link>
                <Link 
                  href="/register" 
                  className="w-full text-center py-2 text-sm font-semibold text-white bg-rose-500 rounded-lg hover:bg-rose-600"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}

