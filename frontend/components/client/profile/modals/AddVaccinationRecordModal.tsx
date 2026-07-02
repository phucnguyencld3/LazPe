import React, { useState } from "react";
import { VaccinationRecord } from "@/lib/api";

interface AddVaccinationRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: VaccinationRecord) => Promise<void>;
}

const STANDARD_VACCINES = [
  "Lao (BCG)",
  "Viêm gan B (HepB)",
  "5 trong 1 (Bạch hầu, Ho gà, Uốn ván, Viêm gan B, Hib)",
  "6 trong 1 (Bạch hầu, Ho gà, Uốn ván, Bại liệt, Viêm gan B, Hib)",
  "Bại liệt (OPV / IPV)",
  "Tiêu chảy do Rota virus",
  "Phế cầu khuẩn (Synflorix / Prevenar 13)",
  "Sởi - Quai bị - Rubella (MMR)",
  "Viêm não Nhật Bản",
  "Cúm mùa",
  "Thủy đậu",
  "Viêm gan A",
  "Thương hàn",
  "Não mô cầu AC/BC",
  "Khác"
];

export function AddVaccinationRecordModal({ isOpen, onClose, onSubmit }: AddVaccinationRecordModalProps) {
  const [vaccineName, setVaccineName] = useState(STANDARD_VACCINES[0]);
  const [status, setStatus] = useState("Pending"); // "Pending" or "Completed"
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vaccineName || !date) return;
    
    setIsSubmitting(true);
    
    const record: VaccinationRecord = {
      vaccineName,
      status,
      notes: notes || undefined
    };

    const dateIso = new Date(date).toISOString();
    if (status === "Completed") {
      record.administeredDate = dateIso;
    } else {
      record.nextDueDate = dateIso;
    }

    await onSubmit(record);
    setIsSubmitting(false);
    
    // Reset form
    setVaccineName(STANDARD_VACCINES[0]);
    setStatus("Pending");
    setDate("");
    setNotes("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[20px] w-[95vw] sm:w-[450px] shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-500">vaccines</span> 
            Thêm lịch tiêm chủng
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Tên Vắc-xin</label>
            <select 
              required
              value={vaccineName}
              onChange={(e) => setVaccineName(e.target.value)}
              className="w-full border border-slate-200 rounded-[10px] px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all bg-white"
            >
              {STANDARD_VACCINES.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Trạng thái</label>
              <select 
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full border border-slate-200 rounded-[10px] px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all bg-white"
              >
                <option value="Pending">Chờ tiêm</option>
                <option value="Completed">Đã tiêm</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                {status === "Completed" ? "Ngày tiêm" : "Ngày dự kiến"}
              </label>
              <input 
                type="date" 
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                max={status === "Completed" ? new Date().toISOString().split("T")[0] : undefined}
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
              placeholder="Ghi chú sau tiêm, dặn dò của bác sĩ..."
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
              Lưu lịch tiêm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
