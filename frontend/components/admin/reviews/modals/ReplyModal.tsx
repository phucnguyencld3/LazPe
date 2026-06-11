"use client";

import React, { useState, useEffect } from "react";
import { Loader2, X, MessageSquare } from "lucide-react";
import { ReviewItem } from "@/lib/api";

interface ReplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: ReviewItem | null;
  onSubmit: (reviewId: number, content: string) => Promise<void>;
  submitting: boolean;
}

export const ReplyModal: React.FC<ReplyModalProps> = ({
  isOpen,
  onClose,
  review,
  onSubmit,
  submitting,
}) => {
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    if (review) {
      setReplyText(review.comments?.[0]?.content || "");
    }
  }, [review, isOpen]);

  if (!isOpen || !review) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(review.reviewID, replyText);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-[calc(100vw-2rem)] md:w-[500px] shrink-0 rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary-container/20 flex items-center justify-center text-secondary shrink-0">
              <MessageSquare size={20} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">
              {review.comments && review.comments.length > 0 ? "Sửa phản hồi đánh giá" : "Phản hồi đánh giá"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} className="text-slate-400" />
          </button>
        </div>

        {/* Body & Form */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs font-semibold text-slate-500 space-y-2">
              <p><strong>Khách hàng:</strong> {review.user?.fullName || "Ẩn danh"}</p>
              <p><strong>Đánh giá:</strong> {review.rating} sao - "{review.content || "Không có nội dung chữ"}"</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-650 block">Nội dung phản hồi từ Shop</label>
              <textarea
                rows={4}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Nhập nội dung phản hồi chính thức của cửa hàng..."
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl font-semibold text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                required
              />
            </div>

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
                <span>Xác nhận gửi</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
