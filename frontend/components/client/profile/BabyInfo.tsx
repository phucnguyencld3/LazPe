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
    <section className="bg-white rounded-xl py-5 px-6 shadow-[0_20px_40px_rgba(135,78,88,0.06)] border border-slate-100">
      <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
        <h2 className="font-headline-md text-lg font-bold text-primary flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">child_care</span> Thông tin của Bé & Sở thích
        </h2>
        <button
          onClick={onEditClick}
          className="text-primary font-bold flex items-center gap-1 hover:underline active:scale-95 transition-all text-xs py-1.5 px-3 rounded-full hover:bg-primary-container/20"
        >
          <span className="material-symbols-outlined text-xs font-bold">edit</span> Thiết lập
        </button>
      </div>

      {!hasPreferences ? (
        <div className="py-6 text-center space-y-3">
          <Baby className="w-12 h-12 text-slate-300 mx-auto stroke-[1.5]" />
          <p className="text-slate-400 text-sm font-semibold max-w-sm mx-auto">
            Mẹ chưa cập nhật sở thích màu sắc của mẹ và thông tin tuổi, cân nặng bé cưng để AI giúp gợi ý sản phẩm phù hợp.
          </p>
          <button
            onClick={onEditClick}
            className="text-xs bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold px-4 py-2 rounded-full border border-rose-100 transition-colors"
          >
            Cập nhật ngay
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">

          {/* Mẹ's Favorite Colors */}
          <div className="space-y-1">
            <label className="text-[10px] text-on-surface-variant font-semibold px-1 uppercase tracking-wider block flex items-center gap-1">
              <Palette className="w-3 h-3 text-pink-500" /> Màu sắc yêu thích của mẹ
            </label>
            <div className="bg-surface-container-low py-3 px-4 rounded-xl font-semibold text-sm text-slate-800 border border-slate-100/50">
              {userProfile.momFavoriteColors || "Chưa cập nhật"}
            </div>
          </div>

          {/* Bé's Gender */}
          <div className="space-y-1">
            <label className="text-[10px] text-on-surface-variant font-semibold px-1 uppercase tracking-wider block flex items-center gap-1">
              <Baby className="w-3 h-3 text-blue-500" /> Giới tính bé cưng
            </label>
            <div className="bg-surface-container-low py-3 px-4 rounded-xl font-semibold text-sm text-slate-800 border border-slate-100/50">
              {getGenderLabel(userProfile.childGender)}
            </div>
          </div>

          {/* Bé's Age */}
          <div className="space-y-1">
            <label className="text-[10px] text-on-surface-variant font-semibold px-1 uppercase tracking-wider block flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px] text-amber-500 font-black">schedule</span> Độ tuổi của bé
            </label>
            <div className="bg-surface-container-low py-3 px-4 rounded-xl font-semibold text-sm text-slate-800 border border-slate-100/50">
              {getAgeDisplay(userProfile.childAgeMonths)}
            </div>
          </div>

          {/* Bé's Weight */}
          <div className="space-y-1">
            <label className="text-[10px] text-on-surface-variant font-semibold px-1 uppercase tracking-wider block flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px] text-emerald-500 font-black">fitness_center</span> Cân nặng của bé
            </label>
            <div className="bg-surface-container-low py-3 px-4 rounded-xl font-semibold text-sm text-slate-800 border border-slate-100/50">
              {getWeightDisplay(userProfile.childWeightKg)}
            </div>
          </div>

          {/* Matching tip banner */}
          <div className="md:col-span-2 p-3 bg-gradient-to-r from-pink-50 to-amber-50 rounded-xl border border-pink-100/30 flex items-center gap-3">
            <span className="material-symbols-outlined text-rose-500 text-xl font-bold shrink-0 animate-pulse">sparkles</span>
            <p className="text-slate-500 text-xs font-semibold leading-normal">
              Dựa vào thông tin này, hệ thống AI LazPe sẽ phân tích từ mô tả chi tiết của sản phẩm để đưa ra các gợi ý chính xác nhất về size, màu sắc phù hợp cho bé yêu!
            </p>
          </div>

        </div>
      )}
    </section>
  );
}
