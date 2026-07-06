import React from "react";
import Link from "next/link";
import { UserProfile } from "@/lib/api";
import { Heart, Baby, Palette, Calendar, Scale, Ruler, Sparkles } from "lucide-react";

interface BabyInfoProps {
  userProfile: UserProfile;
  onEditClick: () => void;
  onOpenTracker?: (babyId: number) => void;
}

export function BabyInfo({ userProfile, onEditClick, onOpenTracker }: BabyInfoProps) {
  const getGenderLabel = (g?: string | null) => {
    if (!g) return "Chưa cập nhật";
    if (g === "Boy" || g === "Male" || g === "Nam") return "Bé trai";
    if (g === "Girl" || g === "Female" || g === "Nữ") return "Bé gái";
    if (g === "Secret") return "Bí mật";
    return g;
  };

  const getAgeDisplayFromDate = (dobString: string) => {
    try {
      const dob = new Date(dobString);
      const now = new Date();
      let ageMonths = (now.getFullYear() - dob.getFullYear()) * 12 + now.getMonth() - dob.getMonth();
      if (now.getDate() < dob.getDate()) {
        ageMonths--;
      }
      if (ageMonths < 0) ageMonths = 0;
      
      if (ageMonths === 0) return "Dưới 1 tháng";
      if (ageMonths < 12) return `${ageMonths} tháng`;
      const years = Math.floor(ageMonths / 12);
      const remainingMonths = ageMonths % 12;
      if (remainingMonths === 0) return `${years} tuổi`;
      return `${years} tuổi ${remainingMonths} tháng`;
    } catch {
      return "Chưa cập nhật";
    }
  };

  const hasBabies = userProfile.babyProfiles && userProfile.babyProfiles.length > 0;

  return (
    <section className="p-5 sm:p-6">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-rose-500 text-xl font-bold">child_care</span> Thông tin của Bé & Sở thích
          </h2>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
            Hỗ trợ gợi ý các sản phẩm tối ưu dựa trên độ tuổi, giới tính và cân nặng của bé.
          </p>
        </div>
        <button
          onClick={onEditClick}
          className="text-primary font-bold flex items-center gap-1.5 hover:text-rose-600 active:scale-95 transition-all text-[12px] bg-slate-50 py-2 px-4 rounded-[10px] border border-slate-100 hover:bg-slate-100"
        >
          <span className="material-symbols-outlined text-[14px] font-bold">edit</span> Thiết lập
        </button>
      </div>


      {!hasBabies ? (
        <div className="py-8 w-full flex flex-col items-center space-y-4">
          <div className="w-16 h-16 bg-slate-50 rounded-[14px] flex items-center justify-center shadow-inner">
            <Baby className="w-9 h-9 text-slate-300 stroke-[1.2]" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-slate-700 text-[14px] font-bold">Chưa có hồ sơ bé yêu</p>
            <p className="text-slate-400 text-[12px] font-medium leading-relaxed max-w-[360px] mx-auto">
              Cập nhật thông tin các bé cưng để hệ thống tự động cá nhân hóa trải nghiệm mua sắm và hỗ trợ chat tư vấn tốt nhất.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onEditClick}
              className="text-[13px] bg-primary text-white hover:bg-primary/95 font-bold px-6 py-2.5 rounded-[10px] transition-all shadow-md shadow-rose-500/15 hover:shadow-rose-500/20 active:scale-95"
            >
              Thêm bé ngay
            </button>
            <button
              onClick={async () => {
                try {
                  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                  const res = await fetch('http://localhost:5101/api/BabyTimeline/SeedDemoData', {
                    method: 'POST',
                    headers: { 'Authorization': 'Bearer ' + token }
                  });
                  const json = await res.json();
                  if (json.success) {
                    alert("Tạo dữ liệu thành công! Vui lòng F5 tải lại trang.");
                  } else {
                    alert("Lỗi: " + json.message);
                  }
                } catch (e) {
                  alert("Lỗi kết nối");
                }
              }}
              className="text-[13px] bg-amber-500 text-white hover:bg-amber-600 font-bold px-6 py-2.5 rounded-[10px] transition-all shadow-md shadow-amber-500/15 hover:shadow-amber-500/20 active:scale-95"
            >
              Tạo dữ liệu Demo
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userProfile.babyProfiles?.map((baby) => {
              const isBoy = baby.gender === "Boy" || baby.gender === "Male" || baby.gender === "Nam";
              return (
                <div
                  key={baby.babyProfileID}
                  className="relative overflow-hidden rounded-[14px] px-4 py-3.5 border border-slate-200 bg-white transition-all hover:shadow-md"
                >
                  {/* Card Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isBoy ? "bg-blue-100 text-blue-600" : "bg-pink-100 text-pink-600"
                        }`}
                      >
                        <Baby className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-[15px] text-slate-800 leading-tight">
                          {baby.name}
                        </h3>
                        {baby.relationship && (
                          <span className="inline-block text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                            {baby.relationship}
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`text-[12px] font-bold ${
                        isBoy ? "text-blue-600" : "text-pink-600"
                      }`}
                    >
                      {getGenderLabel(baby.gender)}
                    </span>
                  </div>

                  {/* Card Grid Details */}
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-[12px]">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <div>
                        <span className="text-slate-400 block text-[9px] font-bold uppercase tracking-wider">Tuổi hiện tại</span>
                        <span className="font-semibold text-indigo-700">{getAgeDisplayFromDate(baby.dateOfBirth)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-slate-600">
                      <Scale className="w-3.5 h-3.5 text-slate-400" />
                      <div>
                        <span className="text-slate-400 block text-[9px] font-bold uppercase tracking-wider">Cân nặng (gần nhất)</span>
                        <span className="font-semibold text-rose-600">
                          {baby.weightKg ? `${baby.weightKg.toFixed(1)} kg` : "Chưa có"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-slate-600">
                      <Ruler className="w-3.5 h-3.5 text-slate-400" />
                      <div>
                        <span className="text-slate-400 block text-[9px] font-bold uppercase tracking-wider">Chiều cao (gần nhất)</span>
                        <span className="font-semibold text-emerald-600">
                          {baby.heightCm ? `${baby.heightCm.toFixed(0)} cm` : "Chưa có"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-slate-600">
                      <Heart className="w-3.5 h-3.5 text-slate-400" />
                      <div>
                        <span className="text-slate-400 block text-[9px] font-bold uppercase tracking-wider">Màu sắc</span>
                        <span className="font-semibold truncate max-w-[100px] block" title={baby.favoriteColors}>
                          {baby.favoriteColors || "Chưa có"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Sổ tay sức khỏe & Hành trình Button */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end gap-2">
                    <Link
                      href={`/baby-timeline/${baby.babyProfileID}`}
                      className={`text-[11px] font-bold text-white px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors ${
                        isBoy ? "bg-purple-500 hover:bg-purple-600" : "bg-purple-500 hover:bg-purple-600"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[14px]">auto_awesome</span> Hành trình
                    </Link>
                    <button
                      onClick={() => onOpenTracker && onOpenTracker(baby.babyProfileID)}
                      className={`text-[11px] font-bold text-white px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors ${
                        isBoy ? "bg-blue-500 hover:bg-blue-600" : "bg-pink-500 hover:bg-pink-600"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[14px]">medical_information</span> Sổ tay sức khỏe
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Tip Banner */}
          <div className="p-3 bg-gradient-to-r from-indigo-50/80 via-purple-50/40 to-pink-50/80 rounded-[12px] border border-indigo-100/50 flex items-center gap-3 shadow-[0_2px_10px_-4px_rgba(99,102,241,0.1)] overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm text-indigo-500">
              <span className="material-symbols-outlined text-[18px] animate-pulse">auto_awesome</span>
            </div>
            <p className="text-slate-600 text-[11px] md:text-[12px] font-medium truncate">
              Các thông tin trên sẽ được tích hợp trực tiếp để cải tiến chất lượng đề xuất sản phẩm và giúp chatbot trợ lý ảo <span className="font-bold text-indigo-600">LazPe</span> tư vấn hỗ trợ phù hợp tối ưu nhất cho bé cưng.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
