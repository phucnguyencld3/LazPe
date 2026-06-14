"use client";

import React, { useState, useEffect } from "react";
import { User, Phone, Lock, Mail, Loader } from "lucide-react";
import { toast } from "@/lib/toast";
import { updateUserProfile, UserProfile } from "@/lib/api";

interface PersonalInfoCardProps {
  userId: string;
  token: string;
  profile: UserProfile | null;
  fetchProfile: (uid: string, authToken: string) => Promise<void>;
  user: any;
  setUser: React.Dispatch<React.SetStateAction<any>>;
}

export default function PersonalInfoCard({
  userId,
  token,
  profile,
  fetchProfile,
  user,
  setUser,
}: PersonalInfoCardProps) {
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Sync state with profile
  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || "");
      setPhoneNumber(profile.phoneNumber || "");
    }
  }, [profile]);

  // Handle Profile Update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !token || !profile) return;

    if (!fullName.trim()) {
      toast.error("Họ và tên không được để trống");
      return;
    }

    setUpdatingProfile(true);
    try {
      const result = await updateUserProfile(userId, token, {
        fullName: fullName.trim(),
        email: profile.email, // Email stays unchanged
        phoneNumber: phoneNumber.trim() || undefined,
        avatar: profile.avatar || undefined,
      });

      if (result.success) {
        toast.success("Cập nhật thông tin cá nhân thành công!");
        
        // Sync local storage user object
        const updatedLocalUser = {
          ...user,
          fullName: fullName.trim(),
          phoneNumber: phoneNumber.trim(),
        };
        localStorage.setItem("user", JSON.stringify(updatedLocalUser));
        sessionStorage.setItem("user", JSON.stringify(updatedLocalUser));
        
        setUser(updatedLocalUser);

        // Dispatch event for other headers/menus to update dynamically
        window.dispatchEvent(new Event("auth-change"));
        
        // Refresh profile data
        await fetchProfile(userId, token);
      } else {
        toast.error(result.message || "Cập nhật thông tin thất bại");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối hệ thống");
    } finally {
      setUpdatingProfile(false);
    }
  };

  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 p-6 md:p-8 shadow-sm space-y-6 animate-in fade-in duration-300">
      <div>
        <h3 className="font-headline-sm text-headline-sm text-primary font-bold">Thông Tin Cá Nhân</h3>
        <p className="font-body-md text-body-md text-on-surface-variant/70 mt-1">Cập nhật họ tên và số điện thoại liên lạc của bạn.</p>
      </div>

      <form onSubmit={handleUpdateProfile} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Họ tên */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Họ và tên *</label>
            <div className="relative">
              <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nhập họ và tên..."
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-rose-400 focus:bg-white text-slate-800"
                required
              />
            </div>
          </div>

          {/* Số điện thoại */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Số điện thoại</label>
            <div className="relative">
              <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Nhập số điện thoại..."
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-rose-400 focus:bg-white text-slate-800"
              />
            </div>
          </div>

          {/* Email (Readonly) */}
          <div className="space-y-2 md:col-span-2">
            <label className="block text-xs font-bold text-slate-450 uppercase tracking-wider flex items-center gap-1.5">
              Địa chỉ Email <Lock size={14} className="text-slate-400" /> (Không thể chỉnh sửa)
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="email" 
                value={profile?.email || ""} 
                disabled
                className="w-full pl-11 pr-4 py-3 bg-slate-100 border border-slate-200/60 rounded-xl text-sm font-semibold text-slate-500 cursor-not-allowed select-none"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={updatingProfile}
            className="px-6 py-3 bg-primary hover:opacity-90 text-on-primary rounded-xl text-sm font-bold flex items-center gap-1.5 disabled:opacity-50 active:scale-95 shadow-md transition-all cursor-pointer"
          >
            {updatingProfile ? (
              <>
                <Loader className="animate-spin" size={14} /> Đang lưu...
              </>
            ) : (
              "Lưu thay đổi"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
