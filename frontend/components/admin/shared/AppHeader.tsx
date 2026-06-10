"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSidebar } from "@/context/SidebarContext";
import { UserNotificationItem } from "@/lib/api";
import { clearAuth } from "@/lib/utils/auth";

interface AppHeaderProps {
  notifications: UserNotificationItem[];
  unreadCount: number;
  handleMarkAllRead: () => void;
  handleNotificationClick: (notif: UserNotificationItem) => void;
  getNotifIcon: (type: string) => string;
  formatTime: (dateStr: string) => string;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  notifications,
  unreadCount,
  handleMarkAllRead,
  handleNotificationClick,
  getNotifIcon,
  formatTime,
}) => {
  const { isExpanded, isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();
  
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserOpen, setIsUserOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Click outside handlers
  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setIsUserOpen(false);
      }
    };
    document.addEventListener("mousedown", clickOutside);
    return () => document.removeEventListener("mousedown", clickOutside);
  }, []);

  // Cmd/Ctrl + K focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSidebarToggle = () => {
    if (window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  const handleSignOut = () => {
    clearAuth();
    window.location.replace("/login");
  };

  return (
    <header className="sticky top-0 flex items-center justify-between w-full h-18 px-6 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 z-40 font-outfit">
      
      {/* Left side: toggle sidebar & Logo on mobile */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSidebarToggle}
          className="p-2 text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer border border-gray-100 dark:border-gray-800"
          title="Thu gọn / Mở rộng Sidebar"
        >
          <span className="material-symbols-outlined text-[20px] flex items-center">
            {isExpanded || isMobileOpen ? "menu_open" : "menu"}
          </span>
        </button>

        {/* Mobile brand logo */}
        <Link href="/admin" className="lg:hidden flex items-center gap-1.5">
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Laz<span className="text-brand-500">Pe</span>
          </h1>
        </Link>
      </div>

      {/* Middle: search input */}
      <div className="hidden md:block w-72 lg:w-96">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-[18px] pointer-events-none">
            search
          </span>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Tìm kiếm hoặc Ctrl + K..."
            className="w-full h-10 pl-10 pr-12 text-sm bg-gray-50 dark:bg-white/[0.03] text-gray-800 dark:text-white/90 border border-gray-200 dark:border-gray-800 rounded-xl placeholder-gray-400 focus:outline-none focus:border-brand-500 focus:ring-3 focus:ring-brand-500/10 transition-all"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] bg-white dark:bg-gray-800 text-gray-400 border border-gray-200 dark:border-gray-700 px-1.5 py-0.5 rounded shadow-theme-xs font-bold pointer-events-none">
            Ctrl K
          </kbd>
        </div>
      </div>

      {/* Right side: settings, notifications, profile */}
      <div className="flex items-center gap-3">
        
        {/* Notifications Dropdown Container */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className={`p-2.5 text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800 rounded-full transition-colors relative cursor-pointer ${
              unreadCount > 0 ? "text-brand-500 bg-brand-50/20 dark:bg-brand-500/10" : ""
            }`}
            title="Thông báo"
          >
            <span className="material-symbols-outlined text-[20px] flex items-center">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 bg-rose-500 text-white text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-theme-lg py-3 z-50 text-gray-800 dark:text-white/90">
              <div className="flex items-center justify-between px-4 pb-2 border-b border-gray-50 dark:border-gray-800">
                <span className="font-bold text-sm">Thông báo</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-brand-500 hover:text-brand-600 font-bold transition-colors cursor-pointer"
                  >
                    Đọc tất cả
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-800/50 custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                    <span className="material-symbols-outlined text-3xl mb-1 text-gray-300">notifications_off</span>
                    <span className="text-xs">Không có thông báo nào</span>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => {
                        handleNotificationClick(notif);
                        setIsNotifOpen(false);
                      }}
                      className={`flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer relative ${
                        !notif.isRead ? "bg-brand-50/5 dark:bg-brand-500/5" : ""
                      }`}
                    >
                      {!notif.isRead && (
                        <span className="absolute top-4 right-3 w-1.5 h-1.5 bg-brand-500 rounded-full"></span>
                      )}

                      <div className="w-9 h-9 rounded-full bg-brand-50 dark:bg-brand-500/15 flex-shrink-0 flex items-center justify-center text-brand-500 dark:text-brand-400">
                        {notif.thumbnailImage ? (
                          <img src={notif.thumbnailImage} alt="" className="w-full h-full object-cover rounded-full" />
                        ) : (
                          <span className="material-symbols-outlined text-lg">
                            {getNotifIcon(notif.type)}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 pr-2">
                        <p className={`text-xs leading-snug line-clamp-1 ${!notif.isRead ? "font-bold text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"}`}>
                          {notif.title}
                        </p>
                        <p className="text-[11px] text-gray-400 line-clamp-2 mt-0.5 leading-snug">
                          {notif.shortDescription}
                        </p>
                        <span className="text-[9px] text-gray-400 font-bold block mt-1">
                          {formatTime(notif.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="px-3 pt-2 mt-2 border-t border-gray-100 dark:border-gray-800">
                <Link
                  href="/admin/notifications"
                  onClick={() => setIsNotifOpen(false)}
                  className="block text-center w-full py-2 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 transition-colors"
                >
                  Xem tất cả thông báo
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Area */}
        <div ref={userRef} className="relative flex items-center">
          <button
            onClick={() => setIsUserOpen(!isUserOpen)}
            className="flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 p-1.5 rounded-xl transition-colors cursor-pointer"
          >
            <div className="h-8.5 w-8.5 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700 shrink-0">
              <img
                alt="Profile Avatar"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCtn-RPABrqyfAIk-Bol7wq_PAmzFO0RQccPYAVIGJTLXZIE2ypug3FJrFdrIcoxyyEIp0oSyNMKOHGT-aT-oDTQSI8g3dEYp7O9MYI5prps_co8yfSkh_Cu1n-lmp7QN_H_Fg-n1KONZK_cby4aQzkl4hykD5fFHyXAhB3Ci-nKb2yI5Jlty1I9JIDwnrT_GBkPsYDSKSeyt_birkk1ZG507kN25QVu7lzA5MoOOQ1iHkIJActwwm73iL00BYzLL0xa58jmYVecLco"
              />
            </div>
            <div className="hidden sm:block text-left">
              <span className="block text-xs font-bold text-gray-800 dark:text-white/90 leading-tight">Administrator</span>
              <span className="block text-[10px] text-gray-400 leading-tight">lazpe.com</span>
            </div>
            <span className="material-symbols-outlined text-[18px] text-gray-400 select-none">keyboard_arrow_down</span>
          </button>

          {/* User Profile Panel */}
          {isUserOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-theme-lg py-3 z-50 text-gray-800 dark:text-white/90">
              <div className="px-4 pb-3 border-b border-gray-50 dark:border-gray-800">
                <span className="block text-sm font-bold">Admin LazPe</span>
                <span className="block text-[11px] text-gray-400">admin@lazpe.com</span>
              </div>
              <ul className="py-1.5 border-b border-gray-50 dark:border-gray-800">
                <li>
                  <Link
                    href="/admin"
                    onClick={() => setIsUserOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
                  >
                    <span className="material-symbols-outlined text-[18px]">account_circle</span>
                    Hồ sơ cá nhân
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin"
                    onClick={() => setIsUserOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
                  >
                    <span className="material-symbols-outlined text-[18px]">settings</span>
                    Thiết lập hệ thống
                  </Link>
                </li>
              </ul>
              <div className="px-2 pt-1.5">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  Đăng xuất
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
export default AppHeader;
