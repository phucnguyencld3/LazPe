"use client";

import React, { useState, useRef } from "react";
import { Search, Upload, Plus, Edit2, Trash2, Loader2 } from "lucide-react";
import {
  ReviewSensitiveKeyword,
  createReviewSensitiveKeyword,
  updateReviewSensitiveKeyword,
  deleteReviewSensitiveKeyword,
  importReviewSensitiveKeywords,
  downloadSampleKeywordsExcel,
} from "@/lib/api";
import { toast } from "@/lib/toast";
import { KeywordModal } from "./modals/KeywordModal";

interface KeywordsTabProps {
  keywords: ReviewSensitiveKeyword[];
  loading: boolean;
  onRefresh: () => Promise<void>;
}

export const KeywordsTab: React.FC<KeywordsTabProps> = ({
  keywords,
  loading,
  onRefresh,
}) => {
  const [keywordSearch, setKeywordSearch] = useState("");
  const [showAddKeywordModal, setShowAddKeywordModal] = useState(false);
  const [editingKeyword, setEditingKeyword] = useState<ReviewSensitiveKeyword | null>(null);
  const [submittingKeyword, setSubmittingKeyword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleKeywordSubmit = async (
    word: string,
    severity: string,
    category: string,
    keywordId?: number
  ) => {
    setSubmittingKeyword(true);
    try {
      let res;
      if (keywordId) {
        res = await updateReviewSensitiveKeyword(keywordId, {
          word: word.trim(),
          severity,
          category,
        });
      } else {
        res = await createReviewSensitiveKeyword({
          word: word.trim(),
          severity,
          category,
        });
      }

      if (res.success) {
        toast.success(res.message);
        setShowAddKeywordModal(false);
        await onRefresh();
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối.");
    } finally {
      setSubmittingKeyword(false);
    }
  };

  const handleDeleteKeyword = async (k: ReviewSensitiveKeyword) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa từ khóa "${k.word}"?`)) return;
    try {
      const res = await deleteReviewSensitiveKeyword(k.keywordID);
      if (res.success) {
        toast.success(res.message);
        await onRefresh();
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      console.error(err);
      toast.error("Có lỗi xảy ra khi xóa.");
    }
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await importReviewSensitiveKeywords(file);
      if (res.success) {
        toast.success(res.message);
        await onRefresh();
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi import file Excel.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDownloadSample = async () => {
    try {
      const blob = await downloadSampleKeywordsExcel();
      if (!blob) {
        toast.error("Không thể tải file mẫu.");
        return;
      }
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "TuKhoaMau.xlsx");
      document.body.appendChild(link);
      link.click();
      link.removeAttribute("download");
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      toast.error("Có lỗi xảy ra khi tải file mẫu.");
    }
  };

  return (
    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in duration-300">
      {/* Header Action Bar */}
      <div className="p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
        {/* Search keyword */}
        <div className="flex-1 min-w-[260px] relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            value={keywordSearch}
            onChange={(e) => setKeywordSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl font-semibold text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            placeholder="Tìm từ khóa vi phạm..."
          />
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <input
            type="file"
            accept=".xlsx"
            ref={fileInputRef}
            onChange={handleImportExcel}
            className="hidden"
          />
          <button
            onClick={handleDownloadSample}
            className="px-5 py-3 rounded-2xl border border-slate-200 text-slate-600 bg-slate-50/50 hover:bg-slate-100 font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            Tải file mẫu
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-5 py-3 rounded-2xl border border-slate-200 text-slate-650 hover:bg-slate-50 font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Upload size={14} />
            Import Excel (.xlsx)
          </button>
          <button
            onClick={() => {
              setEditingKeyword(null);
              setShowAddKeywordModal(true);
            }}
            className="px-5 py-3 rounded-2xl bg-primary hover:bg-primary/95 text-white font-bold text-xs flex items-center gap-2 cursor-pointer transition-all shadow-md active:scale-95"
          >
            <Plus size={14} />
            Thêm từ khóa
          </button>
        </div>
      </div>

      {/* Keywords Table List */}
      {loading ? (
        <div className="p-20 text-center">
          <Loader2 className="animate-spin text-primary mx-auto" size={32} />
          <p className="text-slate-400 mt-4 font-semibold text-sm">Đang tải danh sách từ khóa...</p>
        </div>
      ) : keywords.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-widest">
                <th className="py-4 px-6">ID</th>
                <th className="py-4 px-6">Từ khóa</th>
                <th className="py-4 px-6">Mức độ</th>
                <th className="py-4 px-6">Phân loại</th>
                <th className="py-4 px-6">Ngày tạo</th>
                <th className="py-4 px-6 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-605 font-semibold">
              {keywords
                .filter((k) => k.word.toLowerCase().includes(keywordSearch.toLowerCase()))
                .map((k) => (
                  <tr key={k.keywordID} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 text-slate-400">#{k.keywordID}</td>
                    <td className="py-4 px-6 font-extrabold text-slate-800">{k.word}</td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        k.severity === "Critical"
                          ? "bg-rose-50 text-rose-600 border-rose-100"
                          : k.severity === "Medium"
                          ? "bg-orange-50 text-orange-600 border-orange-100"
                          : "bg-amber-50 text-amber-600 border-amber-100"
                      }`}>
                        {k.severity}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-105 bg-slate-100 text-slate-600 text-xs font-bold">
                        {k.category === "Abuse" && "Xúc phạm"}
                        {k.category === "Vulgarity" && "Tục tĩu"}
                        {k.category === "Spam" && "Spam quảng cáo"}
                        {k.category === "Phone" && "Số điện thoại"}
                        {k.category === "Link" && "Link liên kết"}
                        {k.category === "Scam" && "Lừa đảo"}
                        {k.category === "Violations" && "Vi phạm nguyên tắc"}
                        {!["Abuse", "Vulgarity", "Spam", "Phone", "Link", "Scam", "Violations"].includes(k.category) && k.category}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-400">{new Date(k.createdAt).toLocaleDateString("vi-VN")}</td>
                    <td className="py-4 px-6 text-right flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditingKeyword(k);
                          setShowAddKeywordModal(true);
                        }}
                        className="w-9 h-9 rounded-full hover:bg-primary-container/20 text-primary flex items-center justify-center transition-colors cursor-pointer"
                        title="Sửa từ khóa"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteKeyword(k)}
                        className="w-9 h-9 rounded-full hover:bg-error-container/20 text-error flex items-center justify-center transition-colors cursor-pointer"
                        title="Xóa từ khóa"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-20 text-center">
          <span className="material-symbols-outlined text-slate-300 text-5xl mb-2">vpn_key</span>
          <p className="text-slate-400 font-bold text-sm">Chưa cấu hình từ khóa vi phạm nào.</p>
        </div>
      )}

      {/* Add / Edit Keyword Modal */}
      <KeywordModal
        isOpen={showAddKeywordModal}
        onClose={() => {
          setShowAddKeywordModal(false);
          setEditingKeyword(null);
        }}
        keyword={editingKeyword}
        onSubmit={handleKeywordSubmit}
        submitting={submittingKeyword}
      />
    </div>
  );
};
