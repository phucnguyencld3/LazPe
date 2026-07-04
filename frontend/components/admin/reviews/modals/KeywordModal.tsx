"use client";

import React, { useState, useEffect } from "react";
import { Loader2, X, Key } from "lucide-react";
import { ReviewSensitiveKeyword } from "@/lib/api";

interface KeywordModalProps {
  isOpen: boolean;
  onClose: () => void;
  keyword: ReviewSensitiveKeyword | null;
  onSubmit: (word: string, severity: string, category: string, keywordId?: number) => Promise<void>;
  submitting: boolean;
}

export const KeywordModal: React.FC<KeywordModalProps> = ({
  isOpen,
  onClose,
  keyword,
  onSubmit,
  submitting,
}) => {
  const [word, setWord] = useState("");
  const [severity, setSeverity] = useState("Warning");
  const [category, setCategory] = useState("Abuse");

  useEffect(() => {
    if (keyword) {
      setWord(keyword.word);
      setSeverity(keyword.severity);
      setCategory(keyword.category);
    } else {
      setWord("");
      setSeverity("Warning");
      setCategory("Abuse");
    }
  }, [keyword, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim()) return;
    onSubmit(word.trim(), severity, category, keyword?.keywordID);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-[calc(100vw-2rem)] md:w-[450px] shrink-0 rounded-[12px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center text-primary shrink-0">
              <Key size={18} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">
              {keyword ? "Cập nhật từ khóa" : "Thêm từ khóa vi phạm"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} className="text-slate-400" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-650 block">Từ khóa vi phạm</label>
              <input
                type="text"
                value={word}
                onChange={(e) => setWord(e.target.value)}
                placeholder="Ví dụ: lừa đảo, cùi bắp, shop ngu..."
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-[8px] font-semibold text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-650 block">Mức độ vi phạm</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-[8px] font-bold text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
              >
                <option value="Warning">⚠️ Warning (Nhẹ - gắn cờ cần xem xét)</option>
                <option value="Medium">🚫 Medium (Trung bình - tạm ẩn)</option>
                <option value="Critical">❌ Critical (Nghiêm trọng - từ chối ngay)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-650 block">Phân loại danh mục</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-[8px] font-bold text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
              >
                <option value="Abuse">Abuse (Xúc phạm)</option>
                <option value="Vulgarity">Vulgarity (Từ ngữ tục tĩu)</option>
                <option value="Spam">Spam (Spam quảng cáo)</option>
                <option value="Phone">Phone (Số điện thoại)</option>
                <option value="Link">Link (Website, Zalo, Telegram...)</option>
                <option value="Scam">Scam (Nội dung lừa đảo)</option>
                <option value="Violations">Violations (Vi phạm nguyên tắc cộng đồng)</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-[8px] border border-slate-200 text-slate-650 hover:bg-slate-50 font-bold text-xs cursor-pointer transition-colors"
                disabled={submitting}
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-[8px] bg-primary hover:bg-primary/95 text-white font-bold text-xs cursor-pointer transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
              >
                {submitting && <Loader2 className="animate-spin" size={14} />}
                <span>Xác nhận lưu</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
