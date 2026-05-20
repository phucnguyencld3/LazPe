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
  const [isPermOpen, setIsPermOpen] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
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
        
        // Check if user is authenticated and is an Admin
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

  const activeClass = "bg-primary-container text-on-primary-container font-bold";
  const inactiveClass = "text-on-surface-variant hover:bg-surface-variant";

  if (!isAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-surface font-body-md text-on-surface">
      {/* Sidebar Navigation */}
      <aside className="w-72 bg-surface-container-lowest border-r border-outline-variant hidden md:flex flex-col sticky top-0 h-screen z-50">
        <div className="p-md flex items-center gap-sm">
          <div className="w-10 h-10 bg-primary-container rounded-full flex items-center justify-center p-0.5 overflow-hidden">
            <Image
              src="/logo/LazPeLogo.png"
              alt="LazPe Logo"
              width={40}
              height={40}
              className="w-full h-full object-contain"
            />
          </div>
          <span className="font-display-lg text-headline-md text-primary tracking-tight">
            LazPe
          </span>
        </div>
        <nav className="flex-1 overflow-y-auto px-sm py-md space-y-md" style={{ scrollbarWidth: "thin", scrollbarColor: "#d6c2c3 transparent" }}>
          {/* Section: Dashboard */}
          <div>
            <div className="space-y-xs">
              <Link
                className={`flex items-center gap-sm px-md py-sm rounded-lg transition-all group ${isActive("/admin") && pathname === "/admin" ? activeClass : inactiveClass}`}
                href="/admin"
              >
                <span className="material-symbols-outlined group-hover:scale-110 transition-transform">
                  dashboard
                </span>
                <span className="font-label-md">Tổng quan</span>
              </Link>
            </div>
          </div>
          
          {/* Section: Sản phẩm */}
          <div>
            <h3 className="px-md mb-xs font-label-sm text-on-surface-variant uppercase tracking-widest text-xs font-bold">
              Quản lý sản phẩm
            </h3>
            <div className="space-y-xs">
              <Link
                className={`flex items-center gap-sm px-md py-sm rounded-lg transition-all group ${isActive("/admin/products") ? activeClass : inactiveClass}`}
                href="/admin/products"
              >
                <span className="material-symbols-outlined group-hover:scale-110 transition-transform">
                  inventory_2
                </span>
                <span className="font-label-md">Sản phẩm</span>
              </Link>
              <Link
                className={`flex items-center gap-sm px-md py-sm rounded-lg transition-all group ${isActive("/admin/categories") ? activeClass : inactiveClass}`}
                href="/admin/categories"
              >
                <span className="material-symbols-outlined group-hover:scale-110 transition-transform">
                  category
                </span>
                <span className="font-label-md">Danh mục</span>
              </Link>
              <Link
                className={`flex items-center gap-sm px-md py-sm rounded-lg transition-all group ${isActive("/admin/brands") ? activeClass : inactiveClass}`}
                href="/admin/brands"
              >
                <span className="material-symbols-outlined group-hover:scale-110 transition-transform">
                  verified
                </span>
                <span className="font-label-md">Thương hiệu</span>
              </Link>
            </div>
          </div>

          {/* Section: Bán hàng */}
          <div>
            <h3 className="px-md mb-xs font-label-sm text-on-surface-variant uppercase tracking-widest text-xs font-bold">
              Bán hàng
            </h3>
            <div className="space-y-xs">
              <Link
                className={`flex items-center gap-sm px-md py-sm rounded-lg transition-all group ${isActive("/admin/orders") ? activeClass : inactiveClass}`}
                href="/admin/orders"
              >
                <span className="material-symbols-outlined group-hover:scale-110 transition-transform">
                  shopping_bag
                </span>
                <span className="font-label-md">Đơn hàng</span>
              </Link>
              <Link
                className={`flex items-center gap-sm px-md py-sm rounded-lg transition-all group ${isActive("/admin/vouchers") ? activeClass : inactiveClass}`}
                href="/admin/vouchers"
              >
                <span className="material-symbols-outlined group-hover:scale-110 transition-transform">
                  confirmation_number
                </span>
                <span className="font-label-md">Voucher</span>
              </Link>
            </div>
          </div>

          {/* Section: Người dùng */}
          <div>
            <h3 className="px-md mb-xs font-label-sm text-on-surface-variant uppercase tracking-widest text-xs font-bold">
              Hệ thống
            </h3>
            <div className="space-y-xs">
              <Link
                className={`flex items-center gap-sm px-md py-sm rounded-lg transition-all group ${isActive("/admin/users") ? activeClass : inactiveClass}`}
                href="/admin/users"
              >
                <span className="material-symbols-outlined group-hover:scale-110 transition-transform">
                  group
                </span>
                <span className="font-label-md">Người dùng</span>
              </Link>
              <button
                className="w-full flex items-center justify-between px-md py-sm rounded-lg text-on-surface-variant hover:bg-surface-variant transition-all group"
                onClick={() => setIsPermOpen(!isPermOpen)}
              >
                <div className="flex items-center gap-sm">
                  <span className="material-symbols-outlined group-hover:scale-110 transition-transform">
                    admin_panel_settings
                  </span>
                  <span className="font-label-md">Phân quyền</span>
                </div>
                <span className="material-symbols-outlined text-sm">
                  {isPermOpen ? "expand_less" : "expand_more"}
                </span>
              </button>
              {isPermOpen && (
                <div className="pl-lg space-y-xs">
                  <Link
                    className="block px-md py-xs rounded-lg text-on-surface-variant hover:text-primary font-label-sm"
                    href="/admin/permissions"
                  >
                    Danh sách quyền
                  </Link>
                </div>
              )}
            </div>
          </div>
        </nav>
        <div className="p-md border-t border-outline-variant">
          <div className="flex items-center gap-sm">
            <Image
              alt="Admin Profile"
              className="w-10 h-10 rounded-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAuy8qJWDyqX0PLOSBv8rWRIUtX0lPfOjmc5PmtfgAl9p0f6qS16JrrNjI_Gj6Y44UBOm6mfvGetWfT4VNcRvBfFW_NtcLhh6TIgyyv7Z2592PEiBd37F7vFwruXghY6lNToyfpV53I-b5XCYAXKLNf36K3mUco-CXFj68p1aD6w2idtxA9PQ8tCDI6AE5AOABHIWKaAZDvOhHx7r2dVxwrs4fnVWXQLYzyTXZlTp6cimTA1KHpLw5oY2pZvX3A1JhKZXM9NC7BhzsP"
              width={40}
              height={40}
            />
            <div className="flex flex-col">
              <span className="font-label-md text-on-surface">Admin</span>
              <span className="text-[10px] text-on-surface-variant font-bold uppercase">
                Store Owner
              </span>
            </div>
          </div>
        </div>
      </aside>
      
      {/* Main Content */}
      <div className="flex-1 overflow-x-hidden">
        {children}
      </div>
    </div>
  );
}