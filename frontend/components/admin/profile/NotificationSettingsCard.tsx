"use client";

import React, { useState, useEffect } from "react";
import { Bell, Loader } from "lucide-react";
import { toast } from "@/lib/toast";
import { updateNotificationSettings, UserProfile } from "@/lib/api";

interface NotificationSettingsCardProps {
  userId: string;
  token: string;
  profile: UserProfile | null;
}

export default function NotificationSettingsCard({
  userId,
  token,
  profile,
}: NotificationSettingsCardProps) {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [promotions, setPromotions] = useState(true);
  const [updatingNotifications, setUpdatingNotifications] = useState(false);

  // Sync state with profile
  useEffect(() => {
    if (profile) {
      setEmailNotifications((profile as any).receiveEmailNotifications ?? true);
      setOrderUpdates((profile as any).receiveOrderUpdates ?? true);
      setPromotions((profile as any).receivePromotions ?? true);
    }
  }, [profile]);

  const handleUpdateNotifications = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !token) return;

    setUpdatingNotifications(true);
    try {
      const result = await updateNotificationSettings(userId, token, {
        emailNotifications,
        orderUpdates,
        promotions,
      });

      if (result.success) {
        toast.success("Cập nhật cài đặt thông báo thành công!");
      } else {
        toast.error(result.message || "Cập nhật thất bại");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối đến máy chủ");
    } finally {
      setUpdatingNotifications(false);
    }
  };

  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 p-6 md:p-8 shadow-sm space-y-6 animate-in fade-in duration-300">
      <div>
        <h3 className="font-headline-sm text-headline-sm text-primary font-bold">Cài Đặt Thông Báo</h3>
        <p className="font-body-md text-body-md text-on-surface-variant/70 mt-1">Cấu hình nhận thông báo hệ thống và email cá nhân.</p>
      </div>

      <form onSubmit={handleUpdateNotifications} className="space-y-3">
        <label className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-200/60 rounded-xl transition-all cursor-pointer select-none">
          <div className="flex flex-col text-left pr-2">
            <span className="text-sm font-bold text-slate-800">Email thông báo</span>
            <span className="text-[11px] text-slate-400 font-semibold mt-0.5 leading-snug">Nhận thông báo qua hòm thư điện tử.</span>
          </div>
          <input 
            type="checkbox" 
            checked={emailNotifications} 
            onChange={(e) => setEmailNotifications(e.target.checked)}
            className="w-5 h-5 rounded border-slate-350 text-primary focus:ring-primary cursor-pointer accent-primary flex-shrink-0"
          />
        </label>

        <label className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-200/60 rounded-xl transition-all cursor-pointer select-none">
          <div className="flex flex-col text-left pr-2">
            <span className="text-sm font-bold text-slate-800">Cập nhật đơn hàng</span>
            <span className="text-[11px] text-slate-400 font-semibold mt-0.5 leading-snug">Nhận tin báo trạng thái đơn hàng mua sắm.</span>
          </div>
          <input 
            type="checkbox" 
            checked={orderUpdates} 
            onChange={(e) => setOrderUpdates(e.target.checked)}
            className="w-5 h-5 rounded border-slate-350 text-primary focus:ring-primary cursor-pointer accent-primary flex-shrink-0"
          />
        </label>

        <label className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-200/60 rounded-xl transition-all cursor-pointer select-none">
          <div className="flex flex-col text-left pr-2">
            <span className="text-sm font-bold text-slate-800">Tin tức & Khuyến mãi</span>
            <span className="text-[11px] text-slate-400 font-semibold mt-0.5 leading-snug">Nhận bản tin khuyến mãi và tin tức mới nhất.</span>
          </div>
          <input 
            type="checkbox" 
            checked={promotions} 
            onChange={(e) => setPromotions(e.target.checked)}
            className="w-5 h-5 rounded border-slate-350 text-primary focus:ring-primary cursor-pointer accent-primary flex-shrink-0"
          />
        </label>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={updatingNotifications}
            className="px-5 py-2.5 bg-primary hover:opacity-90 text-on-primary rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 active:scale-95 shadow-md transition-all cursor-pointer"
          >
            {updatingNotifications ? (
              <>
                <Loader className="animate-spin" size={14} /> Đang lưu...
              </>
            ) : (
              "Lưu cài đặt"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
