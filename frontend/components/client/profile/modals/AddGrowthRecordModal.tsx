import React, { useState } from "react";
import { GrowthRecord } from "@/lib/api";

interface AddGrowthRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: GrowthRecord) => Promise<void>;
  initialWeight?: number;
  initialHeight?: number;
}

export function AddGrowthRecordModal({ isOpen, onClose, onSubmit, initialWeight, initialHeight }: AddGrowthRecordModalProps) {
  const [recordedDate, setRecordedDate] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Prepopulate state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setRecordedDate(new Date().toISOString().split("T")[0]);
      setWeightKg(initialWeight ? initialWeight.toString() : "");
      setHeightCm(initialHeight ? initialHeight.toString() : "");
      setNotes("");
    }
  }, [isOpen, initialWeight, initialHeight]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordedDate || !weightKg || !heightCm) return;
    
    setIsSubmitting(true);
    await onSubmit({
      recordedDate: new Date(recordedDate).toISOString(),
      weightKg: parseFloat(weightKg),
      heightCm: parseFloat(heightCm),
      notes: notes
    });
    setIsSubmitting(false);
    
    // Reset form
    setRecordedDate("");
    setWeightKg("");
    setHeightCm("");
    setNotes("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[20px] w-[95vw] sm:w-[450px] shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-500">add_chart</span> 
            Cập nhật chỉ số
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Ngày đo</label>
            <input 
              type="date" 
              required
              value={recordedDate}
              onChange={(e) => setRecordedDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              className="w-full border border-slate-200 rounded-[10px] px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Cân nặng (kg)</label>
              <input 
                type="number" 
                step="0.1" 
                min="0" 
                required
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                placeholder="VD: 5.5"
                className="w-full border border-slate-200 rounded-[10px] px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Chiều cao (cm)</label>
              <input 
                type="number" 
                step="0.1" 
                min="0" 
                required
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                placeholder="VD: 60"
                className="w-full border border-slate-200 rounded-[10px] px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Ghi chú (Không bắt buộc)</label>
            <textarea 
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ghi chú thêm về tình trạng của bé..."
              className="w-full border border-slate-200 rounded-[10px] px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all resize-none"
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-[10px] hover:bg-slate-200 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-indigo-500 text-white font-bold rounded-[10px] hover:bg-indigo-600 transition-colors shadow-md shadow-indigo-500/20 disabled:opacity-70 flex justify-center items-center gap-2"
            >
              {isSubmitting ? <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> : null}
              Lưu chỉ số
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
