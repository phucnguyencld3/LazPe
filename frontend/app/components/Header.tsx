"use client";

import Link from "next/link";
import { ShoppingCart, User, Menu } from "lucide-react";
import { useState, useEffect } from "react";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    setIsAuth(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    setIsAuth(false);
    window.location.href = "/";
  };

  const navigation = [
    { label: "Tất cả", href: "/products" },
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
          <div className="hidden md:flex items-center gap-8">
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
            <button className="p-2 text-slate-600 hover:text-slate-900 transition-colors relative">
              <ShoppingCart size={20} />
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-semibold">
                0
              </span>
            </button>
            
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
          <div className="md:hidden border-t border-slate-200 py-4 space-y-2">
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
