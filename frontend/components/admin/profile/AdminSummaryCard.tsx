"use client";

import React, { useState } from "react";
import { User, Upload, Loader, Check, AlertCircle } from "lucide-react";
import { toast } from "@/lib/toast";
import { uploadAvatar, UserProfile } from "@/lib/api";

interface AdminSummaryCardProps {
  userId: string;
  token: string;
  profile: UserProfile | null;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  user: any;
  setUser: React.Dispatch<React.SetStateAction<any>>;
}

export default function AdminSummaryCard({
  userId,
  token,
  profile,
  setProfile,
  user,
  setUser,
}: AdminSummaryCardProps) {
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Visual helper colors for roles
  const getRoleBadgeColor = (roleName: string) => {
    switch (roleName.toLowerCase()) {
      case "admin":
        return "bg-rose-500/10 text-rose-600 border border-rose-500/20";
      case "staff":
        return "bg-indigo-500/10 text-indigo-600 border border-indigo-500/20";
      default:
        return "bg-slate-500/10 text-slate-600 border border-slate-500/20";
    }
  };

  // Handle Avatar File Upload
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId || !token) return;

    // Validation sizes and formats
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Chỉ hỗ trợ file ảnh JPG, PNG, GIF, WebP");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Kích thước ảnh đại diện không vượt quá 2MB");
      return;
    }

    setUploadingAvatar(true);
    try {
      toast.success("Đang tải avatar mới lên Cloudinary...");
      const result = await uploadAvatar(userId, token, file);
      
      if (result.success && result.data) {
        toast.success("Cập nhật ảnh đại diện thành công!");
        
        // Update local user and profile state
        if (profile) {
          setProfile({ ...profile, avatar: result.data });
        }
        
        const updatedLocalUser = {
          ...user,
          avatar: result.data
        };
        localStorage.setItem("user", JSON.stringify(updatedLocalUser));
        sessionStorage.setItem("user", JSON.stringify(updatedLocalUser));
        
        setUser(updatedLocalUser);
        
        // Dispatch authentication state changed
        window.dispatchEvent(new Event("auth-change"));
      } else {
        toast.error(result.message || "Tải ảnh đại diện thất bại");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi tải ảnh lên hệ thống");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const roles = user?.roles || [];

  return (
    <div className="bg-white rounded-[8px] border border-slate-100 p-6 shadow-sm flex flex-col items-center text-center animate-in fade-in duration-300">
      {/* Avatar Container with Upload Overlay */}
      <div className="relative group w-32 h-32 rounded-full overflow-hidden border-4 border-slate-100 shadow-inner bg-slate-50 flex items-center justify-center">
        {profile?.avatar ? (
          <img 
            src={profile.avatar} 
            alt={profile.fullName} 
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
          />
        ) : (
          <User size={48} className="text-slate-300" />
        )}
        
        {uploadingAvatar && (
          <div className="absolute inset-0 bg-black/45 flex items-center justify-center text-white">
            <Loader className="animate-spin" size={20} />
          </div>
        )}

        {!uploadingAvatar && (
          <label className="absolute inset-0 bg-black/0 group-hover:bg-black/45 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer">
            <Upload size={18} className="mb-1" />
            <span className="text-xs font-bold">Tải ảnh lên</span>
            <input 
              type="file" 
              onChange={handleAvatarChange} 
              accept="image/*" 
              className="hidden" 
            />
          </label>
        )}
      </div>

      <h2 className="font-headline-sm text-[20px] font-bold text-slate-800 mt-4 leading-tight">
        {profile?.fullName || user?.fullName || "Chưa thiết lập"}
      </h2>
      <p className="font-body-md text-sm text-on-surface-variant/70 mt-1">
        {profile?.email || user?.email}
      </p>

      {/* Badges of Roles */}
      <div className="flex flex-wrap gap-2 justify-center mt-3.5 w-full border-t border-slate-100 pt-3.5">
        {roles.length === 0 ? (
          <span className="text-xs px-2.5 py-1 bg-slate-100 text-slate-500 rounded-full font-bold">
            Không có vai trò
          </span>
        ) : (
          roles.map((r: string) => (
            <span 
              key={r} 
              className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider ${getRoleBadgeColor(r)}`}
            >
              {r}
            </span>
          ))
        )}
      </div>

      {/* General Info list */}
      <div className="w-full text-left mt-6 space-y-4 border-t border-slate-100 pt-4 text-sm font-semibold text-slate-650">
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Trạng thái:</span>
          <span className="flex items-center gap-1.5 text-emerald-500 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Hoạt động
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Xác thực Email:</span>
          {profile?.emailConfirmed ? (
            <span className="text-emerald-500 flex items-center gap-1 font-bold"><Check size={16} /> Đã xác thực</span>
          ) : (
            <span className="text-amber-500 flex items-center gap-1 font-bold"><AlertCircle size={16} /> Chưa xác thực</span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Ngày đăng ký:</span>
          <span className="text-slate-800 font-bold">
            {profile?.registerDate ? new Date(profile.registerDate).toLocaleDateString("vi-VN") : "N/A"}
          </span>
        </div>
      </div>
    </div>
  );
}
