import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Activity, Loader } from "lucide-react";
import { toast } from "@/lib/toast";

interface UpdateWeightModalProps {
  isOpen: boolean;
  onClose: () => void;
  babyId: number | null;
  onSuccess: () => void;
}

export function UpdateWeightModal({ isOpen, onClose, babyId, onSuccess }: UpdateWeightModalProps) {
  const [predictedWeight, setPredictedWeight] = useState<number | null>(null);
  const [predictedHeight, setPredictedHeight] = useState<number | null>(null);
  const [customWeight, setCustomWeight] = useState("");
  const [customHeight, setCustomHeight] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (isOpen && babyId) {
      setPredictedWeight(null);
      setPredictedHeight(null);
      setCustomWeight("");
      setCustomHeight("");
      fetchPrediction(babyId);
    }
  }, [isOpen, babyId]);

  const fetchPrediction = async (id: number) => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      let apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5101/api";
      if (process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.endsWith('/api')) {
        apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api`;
      }
      const res = await fetch(`${apiUrl}/BabyTracker/${id}/growth/predict`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setPredictedWeight(json.predictedWeight);
        setPredictedHeight(json.predictedHeight);
        
        // Pre-fill fields with prediction
        setCustomWeight(json.predictedWeight ? json.predictedWeight.toString() : "");
        setCustomHeight(json.predictedHeight ? json.predictedHeight.toString() : "");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdate = async () => {
    if (!babyId) return;
    
    if (!customWeight || !customHeight) {
      toast.error("Vui lòng nhập đầy đủ cân nặng và chiều cao.");
      return;
    }

    setIsUpdating(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      let apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5101/api";
      if (process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.endsWith('/api')) {
        apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api`;
      }
      const res = await fetch(`${apiUrl}/BabyTracker/${babyId}/growth`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          weightKg: parseFloat(customWeight), 
          heightCm: parseFloat(customHeight) 
        })
      });
      if (res.ok) {
        toast.success("Cập nhật chỉ số thành công! Mẹ được tặng 50 Xu!");
        onSuccess();
        onClose();
      } else {
        toast.error("Cập nhật thất bại, vui lòng kiểm tra lại số liệu.");
      }
    } catch (err) {
      toast.error("Lỗi khi kết nối đến máy chủ.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isOpen) return null;

  if (typeof document === "undefined") return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl p-8 shrink-0 shadow-2xl relative"
        style={{ width: '450px', maxWidth: '90vw' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative top shape */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-rose-400 to-primary rounded-b-[50%] -translate-y-8 overflow-hidden" />
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:bg-white/20 p-2 rounded-full transition-colors z-10"
        >
          <X size={20} />
        </button>

        <div className="relative z-10 flex flex-col items-center text-center mt-6">
          <div className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center text-primary mb-4 animate-[pulse_2s_infinite]">
            <Activity size={32} />
          </div>
          <h3 className="text-xl font-black text-slate-800 mb-2 whitespace-nowrap">Bé đã lớn thêm rồi!</h3>
          
          <p className="text-slate-600 font-medium text-sm mb-6 px-2 leading-relaxed">
            Hệ thống gợi ý chỉ số dựa trên đà phát triển của bé.<br/>
            Mẹ hãy kiểm tra và chỉnh sửa lại theo <span className="font-bold text-primary">số đo thực tế</span> nhé!
          </p>

          <div className="flex flex-col gap-4 w-full mb-6 text-left">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 ml-2">Cân nặng (kg)</label>
              <input 
                type="number" 
                step="0.1"
                placeholder="VD: 8.5"
                className="w-full bg-slate-50 border border-slate-200 rounded-full px-5 py-3 outline-none focus:ring-2 focus:ring-primary text-slate-700 font-bold"
                value={customWeight}
                onChange={(e) => setCustomWeight(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 ml-2">Chiều cao (cm)</label>
              <input 
                type="number" 
                step="0.1"
                placeholder="VD: 75"
                className="w-full bg-slate-50 border border-slate-200 rounded-full px-5 py-3 outline-none focus:ring-2 focus:ring-primary text-slate-700 font-bold"
                value={customHeight}
                onChange={(e) => setCustomHeight(e.target.value)}
              />
            </div>
          </div>

          <button 
            disabled={isUpdating || !customWeight || !customHeight}
            onClick={handleUpdate}
            className="w-full bg-primary hover:bg-rose-600 text-white font-bold py-3 px-6 rounded-full shadow-[0_8px_20px_rgba(244,63,94,0.3)] transition-transform hover:-translate-y-1 mb-2 flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {isUpdating ? <Loader className="animate-spin" size={20} /> : "Lưu chỉ số (+50 Xu)"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
