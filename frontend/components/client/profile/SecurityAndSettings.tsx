import React from "react";
import { toast } from "@/lib/toast";

interface SecurityAndSettingsProps {
  hasPassword?: boolean;
  onChangePasswordClick: () => void;
  notificationSettings: {
    emailNotifications: boolean;
    orderUpdates: boolean;
    promotions: boolean;
  };
  onNotificationToggle: (key: "emailNotifications" | "orderUpdates" | "promotions") => void;
}

export function SecurityAndSettings({
  hasPassword = true,
  onChangePasswordClick,
  notificationSettings,
  onNotificationToggle,
}: SecurityAndSettingsProps) {
  return (
    <>
      
      {/* Security Section */}
      <section className="p-5">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
          <span className="material-symbols-outlined text-rose-500 text-xl">shield</span> Bảo mật
        </h2>
        
        <button
          onClick={onChangePasswordClick}
          className="w-full flex items-center justify-between py-2 px-3 bg-slate-50 rounded-[8px] hover:bg-slate-100 transition-colors group border border-slate-100/60"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[16px]">lock</span>
            </div>
            <div className="text-left min-w-0">
              <p className="font-bold text-slate-800 whitespace-nowrap text-[13px]">
                {hasPassword ? "Đổi mật khẩu" : "Thiết lập mật khẩu"}
              </p>
              <p className="text-[11px] text-slate-500 whitespace-nowrap">Bảo vệ tài khoản của bạn</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-[18px] text-slate-400 group-hover:text-primary transition-colors flex-shrink-0">
            chevron_right
          </span>
        </button>

        {/* Notification Toggles */}
        <div className="mt-4 pt-4 border-t border-slate-100 space-y-2.5">
          <h3 className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1">Cài đặt nhận thông báo</h3>
          
          {/* Email Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-slate-700">Thông báo qua Email</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={notificationSettings.emailNotifications}
                onChange={() => onNotificationToggle("emailNotifications")}
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {/* Order Updates Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-slate-700">Cập nhật đơn hàng (Zalo)</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={notificationSettings.orderUpdates}
                onChange={() => onNotificationToggle("orderUpdates")}
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {/* Promotions Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-slate-700">Khuyến mãi & Tin tức</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={notificationSettings.promotions}
                onChange={() => onNotificationToggle("promotions")}
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>
      </section>
    </>
  );
}
