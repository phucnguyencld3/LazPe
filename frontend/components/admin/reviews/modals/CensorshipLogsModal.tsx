"use client";

import React from "react";
import { Loader2, X, History } from "lucide-react";
import { ReviewItem, ReviewCensorshipLog } from "@/lib/api";

interface CensorshipLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: ReviewItem | null;
  logs: ReviewCensorshipLog[];
  loading: boolean;
}

export const CensorshipLogsModal: React.FC<CensorshipLogsModalProps> = ({
  isOpen,
  onClose,
  review,
  logs,
  loading,
}) => {
  if (!isOpen || !review) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN");
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-[calc(100vw-2rem)] md:w-[500px] shrink-0 rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center text-primary shrink-0">
              <History size={20} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">
              Lịch sử kiểm duyệt đánh giá #{review.reviewID}
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
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
          {loading ? (
            <div className="py-8 flex flex-col justify-center items-center">
              <Loader2 className="animate-spin text-primary mb-2" size={24} />
              <span className="text-slate-400 text-xs font-bold">Đang tải lịch sử...</span>
            </div>
          ) : logs.length > 0 ? (
            <div className="space-y-4 relative border-l-2 border-slate-100 pl-4 ml-2.5">
              {logs.map((log) => (
                <div key={log.logID} className="relative space-y-1">
                  {/* Timeline dot */}
                  <span className={`absolute -left-[23px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                    log.action === "HIDE" ? "bg-red-500" : "bg-emerald-500"
                  }`} />

                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase">
                    <span className={log.action === "HIDE" ? "text-red-500" : "text-emerald-500"}>
                      {log.action === "HIDE" ? "ẨN ĐÁNH GIÁ" : "HIỂN THỊ LẠI"}
                    </span>
                    <span>•</span>
                    <span>{formatDate(log.timestamp)}</span>
                  </div>

                  <div className="text-xs font-semibold text-slate-700">
                    Thực hiện bởi: <strong className="font-bold">{log.actorName}</strong>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded border border-slate-150 text-xs font-medium text-slate-550 leading-relaxed">
                    Lý do: <span className="text-slate-700 font-bold">{log.reason}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-6 text-slate-400 font-bold text-xs">
              Không tìm thấy bản ghi lịch sử kiểm duyệt nào cho đánh giá này.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-full border border-slate-200 text-slate-650 hover:bg-slate-50 font-bold text-xs cursor-pointer transition-colors"
          >
            Đóng lại
          </button>
        </div>
      </div>
    </div>
  );
};
