import React, { useRef, useState } from "react";
import { User, Loader } from "lucide-react";
import { UserProfile, uploadAvatar } from "@/lib/api";
import { toast } from "@/lib/toast";

interface ProfileHeaderProps {
  userProfile: UserProfile;
  token: string;
  onAvatarUpdated: (newAvatarUrl: string) => void;
  loyaltyProfile?: {
    currentTierName?: string;
    availablePoints?: number;
    colorHex?: string;
  } | null;
}

export function ProfileHeader({ userProfile, token, onAvatarUpdated, loyaltyProfile }: ProfileHeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userProfile || !token) return;

    // Validate type and size
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      toast.error("Chỉ chấp nhận file ảnh (JPG, PNG, GIF)");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File ảnh không được vượt quá 2MB");
      return;
    }

    setUploadingAvatar(true);

    try {
      const result = await uploadAvatar(userProfile.userId, token, file);
      if (result.success && result.data) {
        toast.success("Cập nhật ảnh đại diện thành công!");
        const newAvatarUrl = result.data;
        onAvatarUpdated(newAvatarUrl);
      } else {
        toast.error(result.message || "Không thể tải lên ảnh đại diện");
      }
    } catch (err) {
      console.error(err);
      toast.error("Có lỗi xảy ra khi upload avatar");
    } finally {
      setUploadingAvatar(false);
      // Reset input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <section className="flex flex-col md:flex-row items-center gap-4 bg-white rounded-[10px] p-5 border border-slate-100/60 shadow-sm">
      <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
        <div className="w-16 h-16 rounded-full overflow-hidden shadow-sm relative bg-slate-50 flex items-center justify-center transition-transform hover:scale-105">
          {uploadingAvatar ? (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
              <Loader className="animate-spin text-white" size={16} />
            </div>
          ) : null}
          {userProfile.avatar ? (
            <img
              className="w-full h-full object-cover"
              alt="Ảnh đại diện người dùng"
              src={userProfile.avatar}
            />
          ) : (
            <User size={28} className="text-slate-400" />
          )}
        </div>
        <button className="absolute bottom-0 right-0 bg-primary text-white p-1 rounded-full shadow-md active:scale-90 transition-transform flex items-center justify-center">
          <span className="material-symbols-outlined text-[10px] font-bold">edit</span>
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleAvatarChange}
          className="hidden"
          accept="image/*"
        />
      </div>
      <div className="text-center md:text-left space-y-1">
        <h1 className="text-lg font-bold text-slate-800 tracking-tight">{userProfile.fullName}</h1>
        <p className="text-[13px] text-slate-500 font-medium">{userProfile.email}</p>

        {/* Badges / Loyalty Info */}
        <div className="mt-1.5 flex flex-wrap justify-center md:justify-start gap-1.5">
          <span className="px-2.5 py-0.5 bg-gradient-to-r from-rose-50 to-pink-50 text-rose-600 rounded-full text-[10px] font-bold shadow-sm border border-rose-100/50 flex items-center gap-1">
            <span className="material-symbols-outlined text-[12px]">military_tech</span>
            Thành viên {loyaltyProfile?.currentTierName || "Standard"}
          </span>
          <span className="px-2.5 py-0.5 bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-600 rounded-full text-[10px] font-bold shadow-sm border border-emerald-100/50 flex items-center gap-1">
            <span className="material-symbols-outlined text-[12px]">stars</span>
            {loyaltyProfile?.availablePoints != null ? loyaltyProfile.availablePoints.toLocaleString("vi-VN") : "0"} điểm
          </span>
        </div>
      </div>
    </section>
  );
}
