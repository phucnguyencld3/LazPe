"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import { Loader, Heart, Baby, Sparkles, Check, ChevronRight } from "lucide-react";
import { getUserProfile, updateUserProfile, addBabyProfile, UserProfile } from "@/lib/api";
import { validateBabyGrowth } from "@/lib/growthStandards";

const COLOR_OPTIONS = [
  { name: "Hồng pastel", value: "Pink", colorClass: "bg-pink-300 border-pink-400" },
  { name: "Xanh dương dịu", value: "Blue", colorClass: "bg-sky-300 border-sky-400" },
  { name: "Vàng chanh", value: "Yellow", colorClass: "bg-amber-200 border-amber-300" },
  { name: "Tím oải hương", value: "Purple", colorClass: "bg-purple-300 border-purple-400" },
  { name: "Xanh bạc hà", value: "Mint", colorClass: "bg-emerald-200 border-emerald-300" },
  { name: "Cam đào", value: "Peach", colorClass: "bg-orange-200 border-orange-300" }
];

export default function OnboardingPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [gender, setGender] = useState<string>("");
  const [ageMonths, setAgeMonths] = useState<number>(12);
  const [weightKg, setWeightKg] = useState<number>(9.5);
  const [knowsWeight, setKnowsWeight] = useState<boolean>(true);
  const [knowsAge, setKnowsAge] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedToken = localStorage.getItem("token") || sessionStorage.getItem("token");
      const savedUserJson = localStorage.getItem("user") || sessionStorage.getItem("user");

      if (!savedToken || !savedUserJson) {
        router.push("/login");
        return;
      }

      setToken(savedToken);
      const parsedUser = JSON.parse(savedUserJson);
      setUser(parsedUser);

      // Fetch profile to pre-fill if any
      const userId = parsedUser.id || parsedUser.userId;
      if (userId) {
        getUserProfile(userId, savedToken).then((profile) => {
          if (profile) {
            if (profile.isOnboarded) {
              // If already onboarded, redirect to home page
              router.push("/");
              return;
            }
            // No longer checking legacy fields during onboarding
          }
          setLoading(false);
        }).catch((err) => {
          console.error("Error fetching profile during onboarding:", err);
          setLoading(false);
        });
      } else {
        router.push("/login");
      }
    }
  }, [router]);

  const handleColorToggle = (colorVal: string) => {
    if (selectedColors.includes(colorVal)) {
      setSelectedColors(selectedColors.filter(c => c !== colorVal));
    } else {
      setSelectedColors([...selectedColors, colorVal]);
    }
  };

  const handleComplete = async () => {
    if (!token || !user) return;
    setSubmitting(true);
    const userId = user.id || user.userId;

    try {
      // Calculate baby's DateOfBirth
      const now = new Date();
      if (knowsAge && ageMonths > 0) {
        now.setMonth(now.getMonth() - ageMonths);
      }
      
      const validation = validateBabyGrowth(gender, knowsAge ? ageMonths : 0, knowsWeight ? weightKg : null, null);
      if (!validation.isValid) {
        toast.error(validation.message || "Thông tin nhập không hợp lệ.");
        setSubmitting(false);
        return;
      }

      const babyPayload = {
        name: "Bé cưng",
        relationship: "Con",
        gender: gender || undefined,
        dateOfBirth: now.toISOString(),
        weightKg: knowsWeight ? weightKg : undefined,
        favoriteColors: selectedColors.join(", ")
      };

      // Create baby profile first
      const babyResult = await addBabyProfile(token, babyPayload);
      if (!babyResult.success) {
        console.warn("Failed to create baby profile during onboarding:", babyResult.message);
      }

      const profilePayload = {
        fullName: user.fullName || "Khách Hàng",
        email: user.email || "",
        phoneNumber: user.phoneNumber || undefined,
        avatar: user.avatar,
        isOnboarded: true
      };

      const result = await updateUserProfile(userId, token, profilePayload);

      if (result.success) {
        toast.success("Tuyệt vời! LazPe đã ghi nhận sở thích của bạn.");
        
        // Update local session
        const savedUserJson = localStorage.getItem("user") || sessionStorage.getItem("user");
        if (savedUserJson) {
          const userObj = JSON.parse(savedUserJson);
          userObj.isOnboarded = true;
          
          if (localStorage.getItem("user")) {
            localStorage.setItem("user", JSON.stringify(userObj));
          } else {
            sessionStorage.setItem("user", JSON.stringify(userObj));
          }
          window.dispatchEvent(new Event("auth-change"));
        }

        router.push("/");
      } else {
        toast.error(result.message || "Không thể lưu thông tin. Vui lòng thử lại sau.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối đến máy chủ.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = async () => {
    if (!token || !user) return;
    setSubmitting(true);
    const userId = user.id || user.userId;

    try {
      const profilePayload = {
        fullName: user.fullName || "Khách Hàng",
        email: user.email || "",
        phoneNumber: user.phoneNumber || undefined,
        avatar: user.avatar,
        isOnboarded: true
      };

      const result = await updateUserProfile(userId, token, profilePayload);

      if (result.success) {
        // Update local session
        const savedUserJson = localStorage.getItem("user") || sessionStorage.getItem("user");
        if (savedUserJson) {
          const userObj = JSON.parse(savedUserJson);
          userObj.isOnboarded = true;
          
          if (localStorage.getItem("user")) {
            localStorage.setItem("user", JSON.stringify(userObj));
          } else {
            sessionStorage.setItem("user", JSON.stringify(userObj));
          }
          window.dispatchEvent(new Event("auth-change"));
        }

        router.push("/");
      } else {
        toast.error("Không thể cập nhật trạng thái.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối đến máy chủ.");
    } finally {
      setSubmitting(false);
    }
  };

  const getAgeDisplay = (months: number) => {
    if (months === 0) return "Dưới 1 tháng";
    if (months < 12) return `${months} tháng`;
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (remainingMonths === 0) return `${years} tuổi`;
    return `${years} tuổi ${remainingMonths} tháng`;
  };

  const getAgeLabelDescription = (months: number) => {
    if (months <= 3) return "Bé sơ sinh";
    if (months <= 6) return "Bé tập lật, tập bò";
    if (months <= 12) return "Bé ăn dặm, tập đi";
    if (months <= 24) return "Bé học nói, tò mò khám phá";
    if (months <= 36) return "Bé mẫu giáo bé";
    return "Bé mẫu giáo nhỡ";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <Loader className="animate-spin text-primary mb-4" size={48} />
        <p className="text-slate-600 font-medium">Đang tải thông tin cá nhân hóa...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-amber-50 flex items-center justify-center p-4 sm:p-6 md:p-8">
      <div className="max-w-[640px] w-full bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-rose-100 overflow-hidden relative p-6 sm:p-8 md:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
        
        {/* Decorative elements */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-pink-200/40 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-amber-200/40 rounded-full blur-2xl pointer-events-none" />

        {/* Top Header */}
        <div className="text-center space-y-3 relative">
          <div className="inline-flex p-3 bg-pink-100/80 text-rose-500 rounded-2xl mb-1 shadow-sm">
            <Heart className="w-8 h-8 animate-pulse fill-rose-500/20" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight leading-tight">
            Chào mừng đến với <span className="text-rose-500 font-black">LazPe</span>!
          </h1>
          <p className="text-slate-500 max-w-[480px] w-full mx-auto text-xs sm:text-sm font-medium leading-relaxed">
            Chúng mình muốn hiểu hơn về mẹ và bé để AI có thể gợi ý các sản phẩm phù hợp nhất với gia đình mình nhé!
          </p>
        </div>

        {/* Form Container */}
        <div className="space-y-6 sm:space-y-8 relative">
          
          {/* Question 1: Mom's Favorite Colors */}
          <div className="space-y-3">
            <label className="text-sm sm:text-base font-bold text-slate-700 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-pink-100 text-pink-600 text-xs font-black">1</span>
              Sở thích màu sắc của mẹ là gì? <span className="text-slate-400 font-semibold text-xs">(Có thể chọn nhiều)</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {COLOR_OPTIONS.map((color) => {
                const isSelected = selectedColors.includes(color.value);
                return (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => handleColorToggle(color.value)}
                    className={`flex items-center gap-2 p-3 rounded-2xl border text-xs sm:text-sm font-bold text-left transition-all ${
                      isSelected
                        ? "border-rose-400 bg-rose-50/50 text-rose-700 shadow-sm"
                        : "border-slate-100 bg-white hover:border-slate-300 text-slate-600"
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full border ${color.colorClass} flex-shrink-0 flex items-center justify-center`}>
                      {isSelected && <Check className="w-2.5 h-2.5 text-slate-700 stroke-[3]" />}
                    </span>
                    {color.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question 2: Baby's Gender */}
          <div className="space-y-3">
            <label className="text-sm sm:text-base font-bold text-slate-700 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-black">2</span>
              Giới tính của bé nhà mình?
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Bé Trai 👦", value: "Boy", hoverClass: "hover:bg-blue-50/50 hover:border-blue-300", activeClass: "border-blue-400 bg-blue-50/50 text-blue-700" },
                { label: "Bé Gái 👧", value: "Girl", hoverClass: "hover:bg-pink-50/50 hover:border-pink-300", activeClass: "border-pink-400 bg-pink-50/50 text-pink-700" },
                { label: "Bí mật 🤫", value: "Secret", hoverClass: "hover:bg-purple-50/50 hover:border-purple-300", activeClass: "border-purple-400 bg-purple-50/50 text-purple-700" }
              ].map((opt) => {
                const isActive = gender === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setGender(opt.value)}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs sm:text-sm font-bold transition-all gap-1.5 ${
                      isActive
                        ? opt.activeClass + " shadow-sm scale-[1.02]"
                        : "border-slate-100 bg-white text-slate-600 " + opt.hoverClass
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question 3: Baby's Age */}
          <div className="space-y-3 p-4 bg-slate-50/50 rounded-3xl border border-slate-100/50">
            <div className="flex justify-between items-center">
              <label className="text-sm sm:text-base font-bold text-slate-700 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-600 text-xs font-black">3</span>
                Độ tuổi hiện tại của bé?
              </label>
              <button
                type="button"
                onClick={() => setKnowsAge(!knowsAge)}
                className={`text-xs font-bold transition-all px-2.5 py-1 rounded-full ${
                  !knowsAge ? "bg-slate-200 text-slate-600" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                }`}
              >
                {!knowsAge ? "Đã xác định" : "Chưa rõ tháng tuổi"}
              </button>
            </div>

            {knowsAge ? (
              <div className="space-y-4 pt-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-rose-500 font-extrabold text-lg sm:text-xl">
                    {getAgeDisplay(ageMonths)}
                  </span>
                  <span className="text-xs text-slate-400 font-bold bg-white px-2 py-0.5 rounded-md border border-slate-100 shadow-2xs">
                    {getAgeLabelDescription(ageMonths)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="60"
                  value={ageMonths}
                  onChange={(e) => setAgeMonths(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-bold px-1">
                  <span>Sơ sinh</span>
                  <span>1 tuổi</span>
                  <span>2 tuổi</span>
                  <span>3 tuổi</span>
                  <span>4 tuổi</span>
                  <span>5 tuổi</span>
                </div>
              </div>
            ) : (
              <p className="text-slate-400 text-xs font-bold italic py-2">
                Chúng mình sẽ gợi ý các sản phẩm phù hợp chung cho trẻ nhỏ nếu chưa rõ độ tuổi cụ thể.
              </p>
            )}
          </div>

          {/* Question 4: Baby's Weight */}
          <div className="space-y-3 p-4 bg-slate-50/50 rounded-3xl border border-slate-100/50">
            <div className="flex justify-between items-center">
              <label className="text-sm sm:text-base font-bold text-slate-700 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 text-xs font-black">4</span>
                Cân nặng hiện tại của bé?
              </label>
              <button
                type="button"
                onClick={() => setKnowsWeight(!knowsWeight)}
                className={`text-xs font-bold transition-all px-2.5 py-1 rounded-full ${
                  !knowsWeight ? "bg-slate-200 text-slate-600" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                }`}
              >
                {!knowsWeight ? "Đã xác định" : "Chưa cân bé"}
              </button>
            </div>

            {knowsWeight ? (
              <div className="space-y-4 pt-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-emerald-600 font-extrabold text-lg sm:text-xl">
                    {weightKg.toFixed(1)} kg
                  </span>
                  <span className="text-xs text-slate-400 font-bold">
                    Cân nặng giúp AI chọn size bỉm tã, quần áo chuẩn hơn
                  </span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="25"
                  step="0.1"
                  value={weightKg}
                  onChange={(e) => setWeightKg(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-bold px-1">
                  <span>2 kg</span>
                  <span>5 kg</span>
                  <span>10 kg</span>
                  <span>15 kg</span>
                  <span>20 kg</span>
                  <span>25 kg</span>
                </div>
              </div>
            ) : (
              <p className="text-slate-400 text-xs font-bold italic py-2">
                Bỏ qua cân nặng nếu mẹ chưa đo chính xác gần đây nhé.
              </p>
            )}
          </div>

        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100 justify-end items-center">
          <button
            type="button"
            disabled={submitting}
            onClick={handleSkip}
            className="w-full sm:w-auto px-6 py-2.5 text-slate-500 hover:text-slate-800 text-sm font-bold transition-all order-2 sm:order-1 hover:bg-slate-100 rounded-full"
          >
            Bỏ qua bước này
          </button>
          
          <button
            type="button"
            disabled={submitting}
            onClick={handleComplete}
            className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-full font-bold text-sm shadow-md hover:from-rose-600 hover:to-pink-700 hover:shadow-lg transition-all flex items-center justify-center gap-2 group order-1 sm:order-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Đang lưu thông tin...
              </>
            ) : (
              <>
                Hoàn tất & Khám phá LazPe
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
