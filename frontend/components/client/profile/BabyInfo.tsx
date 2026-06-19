import React from "react";
import { UserProfile } from "@/lib/api";
import { Heart, Baby, Palette } from "lucide-react";

interface BabyInfoProps {
  userProfile: UserProfile;
  onEditClick: () => void;
}

export function BabyInfo({ userProfile, onEditClick }: BabyInfoProps) {
  const getGenderLabel = (g?: string | null) => {
    if (!g) return "Chưa cập nhật";
    if (g === "Boy") return "Bé trai";
    if (g === "Girl") return "Bé gái";
    if (g === "Secret") return "Bí mật";
    return g;
  };

  const getAgeDisplay = (months?: number | null) => {
    if (months === undefined || months === null) return "Chưa cập nhật";
    if (months === 0) return "Dưới 1 tháng tuổi";
    if (months < 12) return `${months} tháng tuổi`;
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (remainingMonths === 0) return `${years} tuổi`;
    return `${years} tuổi ${remainingMonths} tháng`;
  };

  const getWeightDisplay = (weight?: number | null) => {
    if (weight === undefined || weight === null) return "Chưa cập nhật";
    return `${weight.toFixed(1)} kg`;
  };

  const hasPreferences =
    userProfile.momFavoriteColors ||
    userProfile.childGender ||
    userProfile.childAgeMonths !== undefined ||
    userProfile.childWeightKg !== undefined;

  return (
    <section className="bg-white rounded-[10px] p-5 shadow-sm border border-slate-100/60">
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <span className="material-symbols-outlined text-rose-500 text-xl">child_care</span> Thông tin của Bé & Sở thích
        </h2>
        <button
          onClick={onEditClick}
          className="text-primary font-bold flex items-center gap-1 hover:text-rose-600 active:scale-95 transition-all text-[11px] bg-slate-50 py-1.5 px-3 rounded-full border border-slate-100 hover:bg-slate-100"
        >
          <span className="material-symbols-outlined text-[11px] font-bold">edit</span> Thiết lập
        </button>
      </div>

      {!hasPreferences ? (
        <div className="py-6 w-full flex flex-col items-center space-y-3">
          <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center">
            <Baby className="w-7 h-7 text-slate-300 stroke-[1.5]" />
          </div>
          <p className="text-slate-500 text-[13px] font-medium text-center w-full max-w-[400px] leading-relaxed">
            Mẹ chưa cập nhật sở thích màu sắc và thông tin tuổi, cân nặng bé cưng để AI giúp gợi ý sản phẩm phù hợp.
          </p>
          <button
            onClick={onEditClick}
            className="text-[13px] bg-primary text-white hover:bg-primary/90 font-bold px-5 py-2 rounded-full transition-colors shadow-sm"
          >
            Cập nhật ngay
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">

          {/* Mẹ's Favorite Colors */}
          <div className="flex flex-col gap-1 border-b border-slate-50 pb-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <Palette className="w-3 h-3 text-pink-500" /> Màu sắc yêu thích của mẹ
            </span>
            <span className="font-semibold text-[13px] text-slate-800">
              {userProfile.momFavoriteColors || "Chưa cập nhật"}
            </span>
          </div>

          {/* Bé's Gender */}
          <div className="flex flex-col gap-1 border-b border-slate-50 pb-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <Baby className="w-3 h-3 text-blue-500" /> Giới tính bé cưng
            </span>
            <span className="font-semibold text-[13px] text-slate-800">
              {getGenderLabel(userProfile.childGender)}
            </span>
          </div>

          {/* Bé's Age */}
          <div className="flex flex-col gap-1 border-b border-slate-50 pb-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px] text-amber-500 font-black">schedule</span> Độ tuổi của bé
            </span>
            <span className="font-semibold text-[13px] text-slate-800">
              {getAgeDisplay(userProfile.childAgeMonths)}
            </span>
          </div>

          {/* Bé's Weight */}
          <div className="flex flex-col gap-1 border-b border-slate-50 pb-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px] text-emerald-500 font-black">fitness_center</span> Cân nặng của bé
            </span>
            <span className="font-semibold text-[13px] text-slate-800">
              {getWeightDisplay(userProfile.childWeightKg)}
            </span>
          </div>

          {/* Matching tip banner */}
          <div className="md:col-span-2 p-2.5 bg-gradient-to-r from-pink-50 to-amber-50 rounded-[8px] border border-pink-100/30 flex items-center gap-2 mt-1">
            <span className="material-symbols-outlined text-rose-500 text-lg font-bold shrink-0 animate-pulse">sparkles</span>
            <p className="text-slate-500 text-[11px] font-semibold leading-normal">
              Dựa vào thông tin này, hệ thống AI LazPe sẽ phân tích từ mô tả chi tiết của sản phẩm để đưa ra các gợi ý chính xác nhất về size, màu sắc phù hợp cho bé yêu!
            </p>
          </div>

        </div>
      )}
    </section>
  );
}
