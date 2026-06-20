"use client";

import React from "react";
import { Shield } from "lucide-react";

interface PermissionsCardProps {
  user: any;
}

const permissionTranslations: Record<string, string> = {
  "Admin.Access": "Truy cập quản trị",
  "Admin.ViewUsers": "Xem người dùng",
  "Admin.ManagePermissions": "Quản lý phân quyền",
  "User.Create": "Tạo người dùng",
  "User.Delete": "Xóa người dùng",
  "User.Lock": "Khóa tài khoản",
  "Product.Create": "Thêm sản phẩm",
  "Product.Delete": "Xóa sản phẩm",
  "Category.Create": "Thêm danh mục",
  "Category.Delete": "Xóa danh mục",
  "Order.Create": "Tạo đơn hàng",
  "Order.Delete": "Xóa đơn hàng",
  "Bundle.Create": "Tạo combo",
  "Bundle.Delete": "Xóa combo",
  "Supplier.Create": "Thêm nhà cung cấp",
  "Supplier.Delete": "Xóa nhà cung cấp",
  "Permission.Create": "Tạo quyền",
  "Permission.Delete": "Xóa quyền",
  "Permission.Assign": "Gán quyền",
  "Report.Read": "Xem báo cáo",
  "Analytics.Read": "Xem thống kê",
  "System.Config": "Cấu hình hệ thống",
  "System.Backup": "Sao lưu hệ thống",
  "Review.Create": "Tạo đánh giá",
  "Review.Delete": "Xóa đánh giá",
  "Address.Create": "Thêm địa chỉ",
  "Address.Delete": "Xóa địa chỉ"
};

export default function PermissionsCard({ user }: PermissionsCardProps) {
  const permissions = user?.permissions || [];
  const roles = user?.roles || [];
  const isAdmin = roles.some((r: string) => r.toLowerCase() === "admin");

  return (
    <div className="bg-white rounded-[8px] border border-slate-100 p-6 md:p-8 shadow-sm space-y-6 flex flex-col justify-between animate-in fade-in duration-300">
      <div className="space-y-6">
        <div>
          <h3 className="font-headline-sm text-headline-sm text-primary font-bold">Chức Vụ & Quyền Hạn</h3>
          <p className="font-body-md text-body-md text-on-surface-variant/70 mt-1">Vai trò hiện tại của bạn trong hệ thống quản trị.</p>
        </div>

        <div className="border border-slate-100 rounded-[8px] p-4 bg-slate-50/50 flex-1 min-h-[150px] overflow-y-auto" style={{ maxHeight: "250px" }}>
          {isAdmin ? (
            <div className="flex flex-wrap gap-2">
              <span className="text-xs font-bold px-3 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-[8px] shadow-sm cursor-default flex items-center gap-1.5">
                <Shield size={14} /> Toàn quyền hệ thống
              </span>
            </div>
          ) : permissions.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm font-semibold">
              <Shield size={24} className="mx-auto mb-2 text-slate-300" />
              Tài khoản không được cấp quyền hạn riêng lẻ nào.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {permissions.map((perm: string) => (
                <span 
                  key={perm} 
                  className="text-xs font-bold px-3 py-1.5 bg-white border border-slate-200/80 shadow-sm text-slate-600 hover:text-indigo-600 rounded-[8px] transition-colors cursor-default"
                >
                  {permissionTranslations[perm] || perm}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
