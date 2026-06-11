import React from "react";
import { toast } from "@/lib/toast";

interface SecurityAndSettingsProps {
  onChangePasswordClick: () => void;
  notificationSettings: {
    emailNotifications: boolean;
    orderUpdates: boolean;
    promotions: boolean;
  };
  onNotificationToggle: (key: "emailNotifications" | "orderUpdates" | "promotions") => void;
}

export function SecurityAndSettings({
  onChangePasswordClick,
  notificationSettings,
  onNotificationToggle,
}: SecurityAndSettingsProps) {
  return (
    <aside className="space-y-lg">
      
      {/* Security Section */}
      <section className="bg-white rounded-xl py-5 px-6 shadow-[0_20px_40px_rgba(135,78,88,0.06)] border border-slate-100">
        <h2 className="font-headline-md text-lg font-bold text-primary flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
          <span className="material-symbols-outlined text-primary text-xl">shield</span> Bảo mật
        </h2>
        
        <button
          onClick={onChangePasswordClick}
          className="w-full flex items-center justify-between py-3 px-4 bg-surface-container-low rounded-xl hover:bg-surface-container-high transition-colors group border border-slate-100"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined">lock</span>
            </div>
            <div className="text-left min-w-0">
              <p className="font-bold text-slate-800 whitespace-nowrap text-sm">Đổi mật khẩu</p>
              <p className="text-xs text-slate-500 whitespace-nowrap">Bảo vệ tài khoản của bạn</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors flex-shrink-0">
            chevron_right
          </span>
        </button>

        {/* Notification Toggles */}
        <div className="mt-5 pt-5 border-t border-slate-100 space-y-3">
          <h3 className="font-bold text-primary uppercase tracking-wider text-[11px] mb-1.5">Cài đặt nhận thông báo</h3>
          
          {/* Email Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">Thông báo qua Email</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={notificationSettings.emailNotifications}
                onChange={() => onNotificationToggle("emailNotifications")}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {/* Order Updates Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">Cập nhật đơn hàng (Zalo)</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={notificationSettings.orderUpdates}
                onChange={() => onNotificationToggle("orderUpdates")}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {/* Promotions Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">Khuyến mãi & Tin tức</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={notificationSettings.promotions}
                onChange={() => onNotificationToggle("promotions")}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>
      </section>
    </aside>
  );
}
