"use client";

import React, { useState, useEffect } from "react";
import { Loader2, X } from "lucide-react";
import { ReviewItem } from "@/lib/api";

interface CensorshipModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: ReviewItem | null;
  action: "HIDE" | "RESTORE";
  onSubmit: (reviewId: number, action: "HIDE" | "RESTORE", reason: string) => Promise<void>;
  submitting: boolean;
}

export const CensorshipModal: React.FC<CensorshipModalProps> = ({
  isOpen,
  onClose,
  review,
  action,
  onSubmit,
  submitting,
}) => {
  const presetReasons = [
    { value: "SPAM", label: "Chứa quảng cáo, liên kết rác, spam" },
    { value: "ABUSE", label: "Chứa từ ngữ thô tục, xúc phạm người khác" },
    { value: "UNRELATED", label: "Nội dung không liên quan đến sản phẩm" },
    { value: "FAKE", label: "Đánh giá giả mạo hoặc sai sự thật" },
    { value: "CUSTOM", label: "Lý do tùy chỉnh..." },
  ];

  const [selectedPresetReason, setSelectedPresetReason] = useState("SPAM");
  const [censorshipReason, setCensorshipReason] = useState(presetReasons[0].label);

  useEffect(() => {
    if (action === "RESTORE") {
      setCensorshipReason("Khôi phục hiển thị đánh giá bởi Quản trị viên");
    } else {
      setSelectedPresetReason("SPAM");
      setCensorshipReason(presetReasons[0].label);
    }
  }, [action, isOpen]);

  if (!isOpen || !review) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(review.reviewID, action, censorshipReason);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-[calc(100vw-2rem)] md:w-[520px] shrink-0 rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
              action === "HIDE" ? "bg-rose-105 bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"
            }`}>
              <span className="material-symbols-outlined text-[24px]">
                {action === "HIDE" ? "visibility_off" : "check_circle"}
              </span>
            </div>
            <h3 className="text-xl font-bold text-slate-800">
              {action === "HIDE" ? "Không duyệt đánh giá" : "Duyệt hiển thị đánh giá"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={20} className="text-slate-405" />
          </button>
        </div>

        {/* Body & Form */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-5">
            <p className="text-slate-500 text-sm leading-relaxed">
              {action === "HIDE"
                ? "Đánh giá bị không duyệt (ẩn) sẽ không xuất hiện trên trang sản phẩm. Điểm thưởng Loyalty liên quan sẽ không được cộng hoặc bị thu hồi."
                : "Duyệt hiển thị lại bài đánh giá trên trang chi tiết sản phẩm cho mọi khách hàng."}
            </p>

            {action === "HIDE" && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 block">Lý do ẩn có sẵn</label>
                  <select
                    value={selectedPresetReason}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedPresetReason(val);
                      if (val !== "CUSTOM") {
                        const found = presetReasons.find((p) => p.value === val);
                        if (found) setCensorshipReason(found.label);
                      } else {
                        setCensorshipReason("");
                      }
                    }}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                  >
                    {presetReasons.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 block">Nội dung lý do chi tiết</label>
                  <textarea
                    rows={3}
                    value={censorshipReason}
                    onChange={(e) => setCensorshipReason(e.target.value)}
                    disabled={selectedPresetReason !== "CUSTOM"}
                    placeholder="Ví dụ: Đánh giá chứa nội dung thô tục, spam link bán hàng khác hoặc không có nội dung trải nghiệm thực tế..."
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl font-semibold text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:bg-slate-50 disabled:text-slate-400"
                    required
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-full border border-slate-200 text-slate-650 hover:bg-slate-50 font-bold text-xs cursor-pointer transition-colors"
                disabled={submitting}
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-full bg-primary hover:bg-primary/95 text-white font-bold text-xs cursor-pointer transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
              >
                {submitting && <Loader2 className="animate-spin" size={14} />}
                <span>Xác nhận</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
