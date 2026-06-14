"use client";

import React from "react";
import { Shield } from "lucide-react";

interface PermissionsCardProps {
  user: any;
}

export default function PermissionsCard({ user }: PermissionsCardProps) {
  const permissions = user?.permissions || [];

  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 p-6 md:p-8 shadow-sm space-y-6 flex flex-col justify-between animate-in fade-in duration-300">
      <div className="space-y-6">
        <div>
          <h3 className="font-headline-sm text-headline-sm text-primary font-bold">Chức Vụ & Quyền Hạn</h3>
          <p className="font-body-md text-body-md text-on-surface-variant/70 mt-1">Vai trò hiện tại của bạn trong hệ thống quản trị.</p>
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
