"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isAuth, setIsAuth] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      try {
        const res = await fetch("http://localhost:5101/api/Authentication/current-user", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const data = await res.json();
        
        if (!res.ok || !data.success || !data.user.isAdmin) {
          router.push("/login");
        } else {
          setIsAuth(true);
        }
      } catch (e) {
        router.push("/login");
      }
    };
    checkAuth();
  }, [router]);

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
          <button className="material-symbols-outlined p-2 text-on-surface-variant hover:bg-primary-container/20 rounded-full transition-colors duration-300">notifications</button>
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
              <span className="material-symbols-outlined text-primary text-3xl">child_care</span>
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
          </nav>
          
          <div className="mt-auto px-4 pb-md pt-md">
            <button className="w-full flex items-center justify-center gap-2 bg-secondary text-on-secondary font-label-md py-3 rounded-full hover:scale-105 active:scale-95 shadow-md transition-transform">
              <span className="material-symbols-outlined text-sm">help</span>
              Trung tâm hỗ trợ
            </button>
          </div>
        </aside>
        
        {/* Main Content Area */}
        <main className="flex-1 ml-72 p-margin-desktop flex flex-col min-h-0">
          <div className="flex-1">
            {children}
          </div>
          
          {/* Footer Shell */}
          <footer className="flex justify-between items-center py-md mt-lg text-on-surface-variant font-label-sm border-t border-surface-container-high/50 bg-background">
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