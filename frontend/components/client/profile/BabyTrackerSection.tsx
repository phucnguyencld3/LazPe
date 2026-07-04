import React, { useState, useEffect } from "react";
import GrowthChart from "@/components/client/tracker/GrowthChart";
import VaccinationTimeline from "@/components/client/tracker/VaccinationTimeline";

import { ArrowLeft, Loader2 } from "lucide-react";
import { getBabyTrackerData, addGrowthRecord, addVaccinationRecord, BabyTrackerResponse, GrowthRecord, VaccinationRecord } from "@/lib/api";
import { AddGrowthRecordModal } from "./modals/AddGrowthRecordModal";
import { AddVaccinationRecordModal } from "./modals/AddVaccinationRecordModal";
import { toast } from "@/lib/toast";

interface BabyTrackerSectionProps {
  babyId: number;
  onBack: () => void;
  onUpdate?: () => void;
}

export function BabyTrackerSection({ babyId, onBack, onUpdate }: BabyTrackerSectionProps) {
  const [data, setData] = useState<BabyTrackerResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGrowthModalOpen, setGrowthModalOpen] = useState(false);
  const [isVaccineModalOpen, setVaccineModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (token) {
      const result = await getBabyTrackerData(babyId, token);
      if (result) {
        setData(result);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [babyId]);

  const handleAddGrowth = async (recordData: GrowthRecord) => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return;
    
    const success = await addGrowthRecord(babyId, recordData, token);
    if (success) {
      toast.success("Cập nhật chỉ số thành công");
      setGrowthModalOpen(false);
      fetchData(); // Reload data
      if (onUpdate) onUpdate();
    } else {
      toast.error("Có lỗi xảy ra, vui lòng thử lại");
    }
  };

  const handleAddVaccine = async (recordData: VaccinationRecord) => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return;
    
    const success = await addVaccinationRecord(babyId, recordData, token);
    if (success) {
      toast.success("Thêm lịch tiêm chủng thành công");
      setVaccineModalOpen(false);
      fetchData(); // Reload data
      if (onUpdate) onUpdate();
    } else {
      toast.error("Có lỗi xảy ra, vui lòng thử lại");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500 mb-4" />
        <p className="text-slate-500 font-medium text-sm">Đang tải dữ liệu hồ sơ...</p>
      </div>
    );
  }

  if (!data || !data.profile) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-slate-500 font-medium mb-4">Không tìm thấy dữ liệu hồ sơ này.</p>
        <button onClick={onBack} className="text-primary font-bold">Quay lại</button>
      </div>
    );
  }

  const { profile, growthStatus, recommendations } = data;

  return (
    <section className="bg-white rounded-[16px] shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="p-5 md:p-6">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={onBack}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-500 text-xl font-bold">medical_information</span> 
                Sổ tay sức khỏe: {profile.name}
              </h2>
              <p className="text-[12px] text-slate-400 font-medium mt-0.5 ml-1">
                Mã hồ sơ: #{babyId} • Sinh ngày: {new Date(profile.dateOfBirth).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setVaccineModalOpen(true)}
              className="text-[12px] bg-indigo-500 text-white hover:bg-indigo-600 font-bold px-4 py-2 rounded-[10px] transition-all shadow-md shadow-indigo-500/15 flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">vaccines</span> Thêm lịch tiêm
            </button>
            <button 
              onClick={() => setGrowthModalOpen(true)}
              className="text-[12px] bg-indigo-500 text-white hover:bg-indigo-600 font-bold px-4 py-2 rounded-[10px] transition-all shadow-md shadow-indigo-500/15 flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">add</span> Cập nhật chỉ số
            </button>
          </div>
        </div>


      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
        <div className="h-full">
          <GrowthChart profile={profile} />
        </div>
        <div className="h-full">
          <VaccinationTimeline records={profile.vaccinationRecords || []} profile={profile} />
        </div>
      </div>

      {(() => {
        let latestWeight = profile.weightKg;
        let latestHeight = profile.heightCm;
        if (profile.growthRecords && profile.growthRecords.length > 0) {
          const sorted = [...profile.growthRecords].sort((a, b) => new Date(b.recordedDate).getTime() - new Date(a.recordedDate).getTime());
          latestWeight = sorted[0].weightKg;
          latestHeight = sorted[0].heightCm;
        }

        return (
          <AddGrowthRecordModal 
            isOpen={isGrowthModalOpen}
            onClose={() => setGrowthModalOpen(false)}
            onSubmit={handleAddGrowth}
            initialWeight={latestWeight}
            initialHeight={latestHeight}
          />
        );
      })()}
      
      <AddVaccinationRecordModal 
        isOpen={isVaccineModalOpen}
        onClose={() => setVaccineModalOpen(false)}
        onSubmit={handleAddVaccine}
      />
    </section>
  );
}
