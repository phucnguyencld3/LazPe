"use client";

import React from "react";
import { Shield } from "lucide-react";

interface PermissionsCardProps {
  user: any;
}

export default function PermissionsCard({ user }: PermissionsCardProps) {
  const permissions = user?.permissions || [];

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm space-y-6 flex flex-col justify-between">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-1.5">
            <Shield size={20} className="text-indigo-500" /> Quyền Hạn Tài Khoản (Permissions)
          </h3>
          <p className="text-sm text-slate-450 font-semibold mt-1">
            Danh sách chi tiết các quyền chức năng hiện có của tài khoản trong hệ thống quản trị.
          </p>
        </div>

        <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 flex-1 min-h-[150px] overflow-y-auto" style={{ maxHeight: "250px" }}>
          {permissions.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm font-semibold">
              <Shield size={24} className="mx-auto mb-2 text-slate-300" />
              Tài khoản không được cấp quyền hạn riêng lẻ nào.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {permissions.map((perm: string) => (
                <span 
                  key={perm} 
                  className="text-xs font-mono font-bold px-3 py-1.5 bg-white border border-slate-200/80 shadow-sm text-slate-600 hover:text-indigo-600 rounded-lg transition-colors cursor-default"
                >
                  {perm}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
