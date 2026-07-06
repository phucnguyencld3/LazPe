'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, ShoppingCart, Bell, User, Heart, Menu, X } from 'lucide-react';
import { getNotifications, getUnreadNotificationCount, markNotificationRead, markAllNotificationsRead, UserNotificationItem } from "@/lib/api";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import { toast } from "@/lib/toast";
import * as signalR from "@microsoft/signalr";
import { getValidToken, clearAuth } from "@/lib/utils/auth";
import { useRouter } from 'next/navigation';
import { useDebounce } from 'use-debounce';
import { getProducts } from "@/lib/api";
import { Product } from "@/types";
import { ImageSearchButton } from '@/components/search/ImageSearchButton';
import { VoiceSearchButton } from '@/components/search/VoiceSearchButton';

export default function HeaderV2() {
  const [isAuth, setIsAuth] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const { cartCount } = useCart();
  const router = useRouter();
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery] = useDebounce(searchQuery, 500);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [similarSuggestions, setSimilarSuggestions] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  
  const userRoles = Array.isArray(user?.roles) ? user.roles : (user?.roles ? [user.roles] : []);
  const userPermissions = Array.isArray(user?.permissions) ? user.permissions : (user?.permissions ? [user.permissions] : []);
  const hasDashboardAccess = user?.isAdmin || userRoles.includes("Admin") || userPermissions.includes("Admin.Access") || user?.email === 'lazpevn@gmail.com';

  // Notifications states
  const [notifications, setNotifications] = useState<UserNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);
  const notifTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startNotifTimer = () => {
    if (notifTimeoutRef.current) clearTimeout(notifTimeoutRef.current);
    notifTimeoutRef.current = setTimeout(() => {
      setIsNotifDropdownOpen(false);
    }, 3000);
  };

  const clearNotifTimer = () => {
    if (notifTimeoutRef.current) clearTimeout(notifTimeoutRef.current);
  };

  useEffect(() => {
    if (isNotifDropdownOpen) {
      startNotifTimer();
    } else {
      clearNotifTimer();
    }
    return () => clearNotifTimer();
  }, [isNotifDropdownOpen]);

  // Click outside to close search suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch search suggestions
  useEffect(() => {
    const removeVietnameseTones = (str: string) => {
        str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
        str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
        str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
        str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
        str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
        str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
        str = str.replace(/đ/g, "d");
        str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
        str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
        str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
        str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
        str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
        str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
        str = str.replace(/Đ/g, "D");
        return str;
    };

    const fetchSuggestions = async () => {
      if (!debouncedSearchQuery.trim()) {
        setSuggestions([]);
        setSimilarSuggestions([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        const result = await getProducts(1, 8, debouncedSearchQuery.trim());
        if (result && result.items) {
          const query = debouncedSearchQuery.trim().toLowerCase();
          const queryNoTones = removeVietnameseTones(query);
          
          const exacts: Product[] = [];
          const similars: Product[] = [];
          
          result.items.forEach((p: Product) => {
             const pName = p.name ? p.name.toLowerCase() : '';
             const pNameNoTones = removeVietnameseTones(pName);
             
             // Nếu từ khóa có dấu và match chính xác
             if (pName.includes(query)) {
                exacts.push(p);
             } 
             // Nếu không match chính xác nhưng match khi bỏ dấu
             else if (pNameNoTones.includes(queryNoTones)) {
                similars.push(p);
             } else {
                similars.push(p); 
             }
          });

          setSuggestions(exacts.slice(0, 5));
          setSimilarSuggestions(similars.slice(0, 4));
          setShowSuggestions(true);
        }
      } catch (error) {
        console.error("Error fetching search suggestions:", error);
      } finally {
        setIsSearching(false);
      }
    };

    fetchSuggestions();
  }, [debouncedSearchQuery]);
  
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
      .configureLogging(signalR.LogLevel.None)
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
        audio.play().catch(e => { console.warn("Audio play blocked/failed:", e); });
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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/products');
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-slate-200">
      {/* Main Header Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-0">
        <div className="flex flex-wrap items-center justify-between sm:h-16 gap-3 sm:gap-8">
          
          {/* Logo */}
          <Link href="/" className="flex-shrink-0 flex items-center">
            <img 
              src="/logo/logo_1.png" 
              alt="LazPe Logo" 
              className="h-10 sm:h-14 w-auto object-contain transition-transform hover:scale-[1.02] mix-blend-multiply" 
            />
          </Link>

          {/* Search Bar - Wide */}
          <div className="relative w-full order-last mt-2 sm:mt-0 sm:order-none sm:w-auto sm:flex-1 max-w-3xl" ref={searchContainerRef}>
            <form onSubmit={handleSearchSubmit} className="relative group">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                  if (!e.target.value.trim()) setIsSearching(false);
                }}
                onFocus={() => {
                  if (searchQuery.trim() && suggestions.length > 0) {
                    setShowSuggestions(true);
                  }
                }}
                placeholder="Ba mẹ muốn tìm mua gì hôm nay?" 
                className="w-full h-11 pl-5 pr-[120px] rounded-[10px] border-2 border-primary/20 bg-slate-50 focus:bg-white focus:outline-none focus:border-primary transition-all text-sm placeholder:text-slate-400"
              />
              <div className="absolute right-[52px] top-1 bottom-1 flex items-center">
                <VoiceSearchButton onSearchSuccess={(keyword) => {
                  setSearchQuery(keyword);
                  setShowSuggestions(false);
                  router.push(`/products?search=${encodeURIComponent(keyword)}`);
                }} />
                <ImageSearchButton onSearchSuccess={(keyword) => {
                  setSearchQuery(keyword);
                  setShowSuggestions(false);
                  router.push(`/products?search=${encodeURIComponent(keyword)}`);
                }} />
              </div>
              <button type="submit" className="absolute right-1 top-1 bottom-1 w-12 bg-primary hover:bg-primary/90 text-white rounded-[8px] flex items-center justify-center transition-colors">
                <Search size={20} />
              </button>
            </form>

            {/* Auto-complete Dropdown */}
            {showSuggestions && searchQuery.trim() !== "" && (
              <div className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                {isSearching ? (
                  <div className="p-4 flex items-center justify-center text-slate-400">
                    <div className="w-5 h-5 border-2 border-slate-200 border-t-primary rounded-full animate-spin mr-2"></div>
                    <span className="text-sm font-medium">Đang tìm kiếm...</span>
                  </div>
                ) : (suggestions.length > 0 || similarSuggestions.length > 0) ? (
                  <div className="py-2">
                    {suggestions.length > 0 && (
                      <>
                        <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Sản phẩm gợi ý
                        </div>
                        <ul>
                          {suggestions.map((product) => (
                            <li key={product.id}>
                              <Link
                                href={`/products/${product.slug || product.id}`}
                                className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 transition-colors"
                                onClick={() => setShowSuggestions(false)}
                              >
                                <div className="w-10 h-10 rounded-lg border border-slate-100 overflow-hidden flex-shrink-0 bg-white">
                                  {product.image ? (
                                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                                      <ShoppingCart size={14} className="text-slate-300" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-slate-800 line-clamp-1">{product.name}</p>
                                  <p className="text-xs font-bold text-primary">{(product.discountPrice || product.price).toLocaleString("vi-VN")}đ</p>
                                </div>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}

                    {similarSuggestions.length > 0 && (
                      <>
                        <div className="px-4 py-2 text-xs font-bold text-amber-500 uppercase tracking-wider border-t border-slate-50 mt-1">
                          Có phải bạn muốn tìm?
                        </div>
                        <ul>
                          {similarSuggestions.map((product) => (
                            <li key={product.id}>
                              <Link
                                href={`/products/${product.slug || product.id}`}
                                className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 transition-colors"
                                onClick={() => setShowSuggestions(false)}
                              >
                                <div className="w-10 h-10 rounded-lg border border-slate-100 overflow-hidden flex-shrink-0 bg-white">
                                  {product.image ? (
                                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                                      <ShoppingCart size={14} className="text-slate-300" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-slate-800 line-clamp-1">{product.name}</p>
                                  <p className="text-xs font-bold text-primary">{(product.discountPrice || product.price).toLocaleString("vi-VN")}đ</p>
                                </div>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                    <div className="px-2 pt-2 border-t border-slate-50 mt-1">
                      <button
                        onClick={handleSearchSubmit}
                        className="w-full py-2 text-center text-xs font-bold text-primary hover:bg-primary/5 rounded-xl transition-colors"
                      >
                        Xem tất cả kết quả cho "{searchQuery}"
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center text-slate-500">
                    <Search className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-medium">Không tìm thấy sản phẩm nào phù hợp.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <Link href="/wishlist" className="p-1.5 sm:p-2 text-slate-600 hover:text-slate-900 transition-colors relative" title="Sản phẩm yêu thích">
              <Heart size={22} className="hover:text-primary transition-colors" />
              {mounted && wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] w-5 h-5 rounded-[6px] flex items-center justify-center font-semibold animate-in zoom-in-50 duration-150">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <Link href="/cart" className="p-1.5 sm:p-2 text-slate-600 hover:text-slate-900 transition-colors relative" title="Giỏ hàng">
              <ShoppingCart size={22} className="hover:text-primary transition-colors" />
              {mounted && cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] w-5 h-5 rounded-[6px] flex items-center justify-center font-semibold">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Notification Bell */}
            {isAuth && (
              <div 
                className="relative"
                onMouseEnter={clearNotifTimer}
                onMouseLeave={() => {
                  if (isNotifDropdownOpen) {
                    startNotifTimer();
                  }
                }}
              >
                <button
                  onClick={() => setIsNotifDropdownOpen(!isNotifDropdownOpen)}
                  className={`p-1.5 sm:p-2 text-slate-600 hover:text-primary rounded-[8px] transition-colors relative focus:outline-none ${unreadCount > 0 ? "animate-pulse" : ""}`}
                  title="Thông báo"
                >
                  <Bell size={22} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-primary text-white text-[9px] w-4.5 h-4.5 rounded-[6px] flex items-center justify-center font-bold">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Dropdown Panel */}
                {isNotifDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.08)] border border-slate-100 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100">
                      <span className="font-bold text-slate-800 text-sm">Thông báo mới</span>
                      <div className="flex items-center gap-3">
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-[11px] text-primary hover:text-primary font-bold transition-colors"
                          >
                            Đọc tất cả
                          </button>
                        )}
                        <button 
                          onClick={() => setIsNotifDropdownOpen(false)}
                          className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                          title="Đóng"
                        >
                          <X size={16} />
                        </button>
                      </div>
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

                            <div className="w-9 h-9 rounded-[8px] bg-primary/10 flex-shrink-0 overflow-hidden flex items-center justify-center border border-primary/20 text-primary">
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
                <div className="w-9 h-9 rounded-[10px] overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center transition-all duration-200 hover:border-primary cursor-pointer">
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
                      <div className="w-10 h-10 rounded-[8px] overflow-hidden border border-slate-100 bg-slate-50 flex-shrink-0 flex items-center justify-center">
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
                      {hasDashboardAccess && (
                        <Link
                          href="/admin"
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-primary hover:bg-slate-50 transition-colors"
                          onClick={() => setUserDropdownOpen(false)}
                        >
                          <span className="material-symbols-outlined text-base">dashboard</span>
                          Quản lý Dashboard
                        </Link>
                      )}
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
              <>
                {/* Mobile View: User Icon */}
                <Link href="/login" className="sm:hidden p-1.5 text-slate-600 hover:text-primary transition-colors relative" title="Đăng nhập">
                  <User size={22} className="hover:text-primary transition-colors" />
                </Link>

                {/* Desktop View: Buttons */}
                <div className="hidden sm:flex items-center gap-3">
                  <Link 
                    href="/login" 
                    className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors px-3 py-2"
                  >
                    Đăng nhập
                  </Link>
                  <Link 
                    href="/register" 
                    className="text-sm font-semibold text-white bg-primary hover:bg-primary/90 px-4 py-2 rounded-[8px] transition-all duration-200 active:scale-95 shadow-sm"
                  >
                    Đăng ký
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
