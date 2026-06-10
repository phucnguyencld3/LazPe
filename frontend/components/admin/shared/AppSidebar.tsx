"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";

type SubMenuItem = {
  name: string;
  path: string;
};

type MenuItem = {
  name: string;
  icon: string;
  path?: string;
  subItems?: SubMenuItem[];
};

type MenuGroup = {
  groupName: string;
  items: MenuItem[];
};

const menuGroups: MenuGroup[] = [
  {
    groupName: "Tổng quan",
    items: [
      {
        name: "Tổng quan",
        icon: "dashboard",
        path: "/admin",
      },
    ],
  },
  {
    groupName: "Sản phẩm",
    items: [
      {
        name: "Sản phẩm",
        icon: "inventory_2",
        path: "/admin/products",
      },
      {
        name: "Combo",
        icon: "inventory",
        path: "/admin/combo",
      },
      {
        name: "Danh mục",
        icon: "category",
        path: "/admin/categories",
      },
      {
        name: "Thương hiệu",
        icon: "verified",
        path: "/admin/brands",
      },
    ],
  },
  {
    groupName: "Tài khoản",
    items: [
      {
        name: "Người dùng",
        icon: "group",
        path: "/admin/users",
      },
      {
        name: "Phân quyền",
        icon: "person",
        path: "/admin/permissions",
      },
    ],
  },
  {
    groupName: "Đơn hàng",
    items: [
      {
        name: "Đơn hàng",
        icon: "shopping_cart",
        path: "/admin/orders",
      },
    ],
  },
  {
    groupName: "Hỗ trợ",
    items: [
      {
        name: "Tin nhắn",
        icon: "chat",
        path: "/admin/chats",
      },
    ],
  },
  {
    groupName: "Thống kê",
    items: [
      {
        name: "Thống kê",
        icon: "bar_chart",
        path: "/admin/statistics",
      },
    ],
  },
  {
    groupName: "Khuyến mãi & Loyalty",
    items: [
      {
        name: "Quản lý Voucher",
        icon: "confirmation_number",
        path: "/admin/vouchers",
      },
      {
        name: "Quản lý Loyalty",
        icon: "loyalty",
        path: "/admin/loyalty",
      },
    ],
  },
  {
    groupName: "Đánh giá sản phẩm",
    items: [
      {
        name: "Kiểm duyệt đánh giá",
        icon: "gavel",
        path: "/admin/reviews",
      },
    ],
  },
  {
    groupName: "Thông báo",
    items: [
      {
        name: "Quản lý thông báo",
        icon: "notifications",
        path: "/admin/notifications",
      },
    ],
  },
];

export const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();

  const isOpen = isExpanded || isHovered || isMobileOpen;

  const isActive = (path: string) => {
    if (path === "/admin" && pathname !== "/admin") return false;
    return pathname?.startsWith(path);
  };

  return (
    <aside
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`fixed top-0 left-0 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 text-gray-900 z-50 flex flex-col transition-all duration-300 ease-in-out font-outfit
        ${isOpen ? "w-[290px]" : "w-[90px]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
    >
      {/* Brand logo header */}
      <div className={`py-6 px-6 border-b border-gray-100 dark:border-gray-800 flex items-center ${isOpen ? "justify-between" : "justify-center"}`}>
        <Link href="/admin" className="flex items-center gap-2">
          {isOpen ? (
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Laz<span className="text-brand-500">Pe</span> <span className="text-xs font-semibold px-2 py-0.5 bg-brand-50 text-brand-500 rounded-md dark:bg-brand-500/15 dark:text-brand-400">Admin</span>
            </h1>
          ) : (
            <span className="material-symbols-outlined text-brand-500 text-3xl font-bold">admin_panel_settings</span>
          )}
        </Link>
      </div>

      {/* Navigation menu */}
      <div className="flex-1 overflow-y-auto no-scrollbar py-4 px-3 space-y-6">
        {menuGroups.map((group) => (
          <div key={group.groupName} className="space-y-1">
            {isOpen ? (
              <span className="block px-3 py-1.5 text-[10px] uppercase font-bold tracking-widest text-gray-400 dark:text-gray-500">
                {group.groupName}
              </span>
            ) : (
              <div className="h-px bg-gray-100 dark:bg-gray-800/50 my-2 mx-2" />
            )}
            <ul className="space-y-1">
              {group.items.map((item) => (
                <li key={item.name}>
                  {item.path && (
                    <Link
                      href={item.path}
                      className={`menu-item group ${
                        isActive(item.path) ? "menu-item-active" : "menu-item-inactive"
                      } ${!isOpen ? "justify-center px-0" : "px-3"}`}
                    >
                      <span
                        className={`material-symbols-outlined text-[22px] transition-colors ${
                          isActive(item.path)
                            ? "text-brand-500 dark:text-brand-400"
                            : "text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300"
                        }`}
                      >
                        {item.icon}
                      </span>
                      {isOpen && <span className="menu-item-text">{item.name}</span>}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>


    </aside>
  );
};
export default AppSidebar;
