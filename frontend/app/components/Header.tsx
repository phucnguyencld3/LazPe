"use client";
 
import Link from "next/link";
import { ShoppingCart, User, Menu, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { Category } from "@/types";
import { getCategories, getCart } from "@/lib/api";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  
  // Categories State
  const [parentCategories, setParentCategories] = useState<Category[]>([]);
  const [categoryTree, setCategoryTree] = useState<Record<number, Category[]>>({});
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);

  useEffect(() => {
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

    const loadCartCount = async (authToken: string) => {
      try {
        const cartData = await getCart(authToken);
        if (cartData && cartData.cartDetails) {
          const count = cartData.cartDetails.reduce((sum, item) => sum + item.quantity, 0);
          setCartCount(count);
        }
      } catch (err) {
        console.error("Error loading header cart count:", err);
      }
    };

    loadCategories();
    if (token) {
      loadCartCount(token);
    }
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
            <Link href="/cart" className="p-2 text-slate-600 hover:text-slate-900 transition-colors relative" title="Giỏ hàng">
              <ShoppingCart size={20} />
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-semibold">
                {cartCount}
              </span>
            </Link>
            
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

