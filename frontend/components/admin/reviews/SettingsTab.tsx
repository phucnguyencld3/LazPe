"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { getReviewLoyaltySettings, updateReviewLoyaltySettings } from "@/lib/api";
import { toast } from "@/lib/toast";

export const SettingsTab: React.FC = () => {
  const [loyaltySettings, setLoyaltySettings] = useState<any>({
    enableReviewReward: true,
    reviewRewardPoints: 200,
    minimumReviewWords: 50,
    requiredRatingForReward: 5,
    allowMultipleRewardsPerProduct: false,
    reviewWithImageRewardPoints: 300,
    reviewWithVideoRewardPoints: 500,
    minimumReviewChars: 100,
    allowEditReviewTimeLimitMinutes: 30,
    maxReviewDaysAfterReceipt: 30,
    requireDeliveryToReview: true,
  });

  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoadingSettings(true);
    try {
      const result = await getReviewLoyaltySettings();
      if (result) {
        setLoyaltySettings(result);
      }
    } catch (e) {
      console.error(e);
      toast.error("Lỗi khi tải cấu hình đánh giá.");
    } finally {
      setLoadingSettings(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const result = await updateReviewLoyaltySettings(loyaltySettings);
      if (result.success) {
        toast.success("Cập nhật cấu hình thưởng điểm đánh giá thành công!");
        await fetchSettings();
      } else {
        toast.error(result.message || "Cập nhật cấu hình thất bại.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Lỗi máy chủ.");
    } finally {
      setSavingSettings(false);
    }
  };

  if (loadingSettings) {
    return (
      <div className="w-full flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 className="animate-spin text-primary mb-2" size={32} />
        <span className="text-slate-400 font-bold text-xs">Đang tải cấu hình...</span>
      </div>
    );
  }

  return (
    <div className="p-8 w-full animate-in fade-in duration-300">
      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Reward Point Enable Toggle */}
        <div className="flex items-center justify-between p-6 bg-slate-50/50 rounded-2xl border border-slate-100">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-slate-705 block">Kích hoạt tặng điểm thưởng Loyalty</span>
            <span className="text-[10px] text-slate-400 font-semibold block">Tự động tặng điểm khi người dùng viết đánh giá chất lượng sản phẩm</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input
              type="checkbox"
              checked={loyaltySettings.enableReviewReward}
              onChange={(e) => setLoyaltySettings({ ...loyaltySettings, enableReviewReward: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>

        {/* Settings parameters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Review Points */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase block tracking-wider">Thưởng đánh giá cơ bản (chỉ có chữ)</label>
            <div className="relative">
              <input
                type="number"
                value={loyaltySettings.reviewRewardPoints}
                onChange={(e) => setLoyaltySettings({ ...loyaltySettings, reviewRewardPoints: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-3 bg-white border border-slate-202 border-slate-200 rounded-2xl font-semibold text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
              <span className="absolute inset-y-0 right-4 flex items-center text-[10px] font-bold text-slate-400 uppercase">điểm</span>
            </div>
          </div>

          {/* Review with Image Points */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase block tracking-wider">Thưởng đánh giá có kèm HÌNH ẢNH</label>
            <div className="relative">
              <input
                type="number"
                value={loyaltySettings.reviewWithImageRewardPoints}
                onChange={(e) => setLoyaltySettings({ ...loyaltySettings, reviewWithImageRewardPoints: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl font-semibold text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
              <span className="absolute inset-y-0 right-4 flex items-center text-[10px] font-bold text-slate-400 uppercase">điểm</span>
            </div>
          </div>

          {/* Review with Video Points */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase block tracking-wider">Thưởng đánh giá có kèm VIDEO</label>
            <div className="relative">
              <input
                type="number"
                value={loyaltySettings.reviewWithVideoRewardPoints}
                onChange={(e) => setLoyaltySettings({ ...loyaltySettings, reviewWithVideoRewardPoints: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl font-semibold text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
              <span className="absolute inset-y-0 right-4 flex items-center text-[10px] font-bold text-slate-400 uppercase">điểm</span>
            </div>
          </div>

          {/* Minimum Character count */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase block tracking-wider">Số ký tự tối thiểu để nhận quà</label>
            <div className="relative">
              <input
                type="number"
                value={loyaltySettings.minimumReviewChars}
                onChange={(e) => setLoyaltySettings({ ...loyaltySettings, minimumReviewChars: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl font-semibold text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
              <span className="absolute inset-y-0 right-4 flex items-center text-[10px] font-bold text-slate-400 uppercase">ký tự</span>
            </div>
          </div>

          {/* Required Rating stars */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase block tracking-wider">Số sao tối thiểu để nhận quà</label>
            <select
              value={loyaltySettings.requiredRatingForReward}
              onChange={(e) => setLoyaltySettings({ ...loyaltySettings, requiredRatingForReward: parseInt(e.target.value) })}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
            >
              <option value="5">⭐ 5 Sao</option>
              <option value="4">⭐ 4 Sao</option>
              <option value="3">⭐ 3 Sao</option>
              <option value="2">⭐ 2 Sao</option>
              <option value="1">⭐ 1 Sao</option>
            </select>
          </div>

          {/* Edit Time limit */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase block tracking-wider">Thời gian tối đa để chỉnh sửa đánh giá</label>
            <div className="relative">
              <input
                type="number"
                value={loyaltySettings.allowEditReviewTimeLimitMinutes}
                onChange={(e) => setLoyaltySettings({ ...loyaltySettings, allowEditReviewTimeLimitMinutes: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl font-semibold text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
              <span className="absolute inset-y-0 right-4 flex items-center text-[10px] font-bold text-slate-400 uppercase">phút</span>
            </div>
          </div>

          {/* Max Review days limit after order receipt */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase block tracking-wider">Số ngày tối đa để đánh giá sau khi mua</label>
            <div className="relative">
              <input
                type="number"
                value={loyaltySettings.maxReviewDaysAfterReceipt}
                onChange={(e) => setLoyaltySettings({ ...loyaltySettings, maxReviewDaysAfterReceipt: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl font-semibold text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
              <span className="absolute inset-y-0 right-4 flex items-center text-[10px] font-bold text-slate-400 uppercase">ngày</span>
            </div>
          </div>

          {/* Require Delivery Verification */}
          <div className="space-y-2 flex flex-col justify-end">
            <label className="flex items-center gap-2 select-none cursor-pointer border border-slate-200 p-3.5 rounded-2xl bg-white hover:bg-slate-50 transition-colors">
              <input
                type="checkbox"
                checked={loyaltySettings.requireDeliveryToReview}
                onChange={(e) => setLoyaltySettings({ ...loyaltySettings, requireDeliveryToReview: e.target.checked })}
                className="rounded border-slate-305 text-primary focus:ring-primary/20"
              />
              <span className="text-xs font-bold text-slate-605">Yêu cầu hoàn thành giao hàng mới được đánh giá</span>
            </label>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end mt-6">
          <button
            type="submit"
            disabled={savingSettings}
            className="px-8 py-3 bg-primary hover:bg-primary/95 text-white rounded-[8px] font-bold text-sm hover:scale-[1.01] active:scale-95 transition-all shadow-md disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            {savingSettings && <Loader2 className="animate-spin" size={16} />}
            Lưu cấu hình cài đặt
          </button>
        </div>
      </form>
    </div>
  );
};
