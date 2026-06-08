"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Key, 
  Shield, 
  Upload, 
  Loader, 
  Eye, 
  EyeOff, 
  Check, 
  AlertCircle 
} from "lucide-react";
import { toast } from "@/lib/toast";
import { 
  getUserProfile, 
  updateUserProfile, 
  changePassword, 
  uploadAvatar,
  UserProfile 
} from "@/lib/api";

export default function AdminProfilePage() {
  const router = useRouter();

  // Authentication & Profile States
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Form States - Personal Info
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Form States - Password Change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Initialize data on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("token") || sessionStorage.getItem("token");
    const savedUserJson = localStorage.getItem("user") || sessionStorage.getItem("user");

    if (!savedToken || !savedUserJson) {
      router.push("/login");
      return;
    }

    setToken(savedToken);
    try {
      const parsedUser = JSON.parse(savedUserJson);
      setUser(parsedUser);
      const uid = parsedUser.id || parsedUser.userId || parsedUser.UserId;
      setUserId(uid);

      if (uid) {
        fetchProfile(uid, savedToken);
      } else {
        setLoading(false);
      }
    } catch (e) {
      console.error("Error loading user state:", e);
      router.push("/login");
    }
  }, [router]);

  // Fetch newest user profile info from API
  const fetchProfile = async (uid: string, authToken: string) => {
    try {
      const data = await getUserProfile(uid, authToken);
      if (data) {
        setProfile(data);
        setFullName(data.fullName);
        setPhoneNumber(data.phoneNumber || "");
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
      toast.error("Không thể tải thông tin hồ sơ từ server");
    } finally {
      setLoading(false);
    }
  };

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
        avatar: profile.avatar || undefined
      });

      if (result.success) {
        toast.success("Cập nhật thông tin cá nhân thành công!");
        
        // Sync local storage user object
        const updatedLocalUser = {
          ...user,
          fullName: fullName.trim(),
          phoneNumber: phoneNumber.trim()
        };
        localStorage.setItem("user", JSON.stringify(updatedLocalUser));
        sessionStorage.setItem("user", JSON.stringify(updatedLocalUser));
        
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

  // Handle Password Change
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!userId || !token) return;

    if (!currentPassword) {
      setPasswordError("Mật khẩu hiện tại không được để trống");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Mật khẩu mới phải có độ dài ít nhất 6 ký tự");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError("Xác nhận mật khẩu mới không khớp");
      return;
    }

    setChangingPassword(true);
    try {
      const result = await changePassword(userId, token, {
        currentPassword,
        newPassword,
        confirmNewPassword
      });

      if (result.success) {
        toast.success("Thay đổi mật khẩu thành công!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
      } else {
        setPasswordError(result.message || "Mật khẩu hiện tại không chính xác");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối khi đổi mật khẩu");
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-3xl border border-slate-100 min-h-[500px]">
        <Loader className="animate-spin text-rose-500 mb-3" size={36} />
        <p className="text-sm font-semibold text-slate-500">Đang tải thông tin hồ sơ quản trị...</p>
      </div>
    );
  }

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

  const roles = user?.roles || [];
  const permissions = user?.permissions || [];

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Hồ Sơ Cá Nhân</h1>
        <p className="text-xs text-slate-400 font-semibold mt-1">
          Quản lý thông tin cá nhân, cập nhật ảnh đại diện và thay đổi mật khẩu tài khoản quản trị viên.
        </p>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Card: Dynamic Avatar & User Summary (1 Column) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex flex-col items-center text-center">
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
                  <span className="text-[10px] font-bold">Tải ảnh lên</span>
                  <input 
                    type="file" 
                    onChange={handleAvatarChange} 
                    accept="image/*" 
                    className="hidden" 
                  />
                </label>
              )}
            </div>

            <h2 className="text-lg font-bold text-slate-800 mt-4 leading-tight">
              {profile?.fullName || user?.fullName || "Chưa thiết lập"}
            </h2>
            <p className="text-xs text-slate-400 font-semibold mt-1">
              {profile?.email || user?.email}
            </p>

            {/* Badges of Roles */}
            <div className="flex flex-wrap gap-2 justify-center mt-3 w-full border-t border-slate-50 pt-3">
              {roles.length === 0 ? (
                <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full font-bold">
                  Không có vai trò
                </span>
              ) : (
                roles.map((r: string) => (
                  <span 
                    key={r} 
                    className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${getRoleBadgeColor(r)}`}
                  >
                    {r}
                  </span>
                ))
              )}
            </div>

            {/* General Info list */}
            <div className="w-full text-left mt-6 space-y-3.5 border-t border-slate-50 pt-4 text-xs font-semibold text-slate-600">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Trạng thái:</span>
                <span className="flex items-center gap-1 text-emerald-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Hoạt động
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Xác thực Email:</span>
                {profile?.emailConfirmed ? (
                  <span className="text-emerald-500 flex items-center gap-0.5"><Check size={14} /> Đã xác thực</span>
                ) : (
                  <span className="text-amber-500 flex items-center gap-0.5"><AlertCircle size={14} /> Chưa xác thực</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Ngày đăng ký:</span>
                <span className="text-slate-800">
                  {profile?.registerDate ? new Date(profile.registerDate).toLocaleDateString("vi-VN") : "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center/Right Cards: Edit Info & Password (2 Columns) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card 1: Personal Info form */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-extrabold text-slate-800">Thông Tin Cá Nhân</h3>
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Cập nhật họ tên và số điện thoại liên lạc của bạn.</p>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Họ tên */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Họ và tên *</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nhập họ và tên..."
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-rose-400 focus:bg-white text-slate-800"
                      required
                    />
                  </div>
                </div>

                {/* Số điện thoại */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Số điện thoại</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Nhập số điện thoại..."
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-rose-400 focus:bg-white text-slate-800"
                    />
                  </div>
                </div>

                {/* Email (Readonly) */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    Địa chỉ Email <Lock size={12} className="text-slate-400" /> (Không thể chỉnh sửa)
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-350" />
                    <input 
                      type="email" 
                      value={profile?.email || ""} 
                      disabled
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border border-slate-200/60 rounded-xl text-xs font-semibold text-slate-400 cursor-not-allowed select-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={updatingProfile}
                  className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 active:scale-95 shadow-md shadow-rose-500/10 transition-all"
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

          {/* Card 2: Password form */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-1.5">
                <Key size={18} className="text-rose-500" /> Đổi Mật Khẩu
              </h3>
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Bảo vệ tài khoản bằng cách sử dụng mật khẩu mạnh.</p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {passwordError && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2 text-rose-600 text-[11px] font-bold">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <span>{passwordError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Mật khẩu cũ */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Mật khẩu hiện tại *</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Mật khẩu cũ..."
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-rose-400 focus:bg-white text-slate-800"
                      required
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Mật khẩu mới */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Mật khẩu mới *</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Ít nhất 6 ký tự..."
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-rose-400 focus:bg-white text-slate-800"
                      required
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Nhập lại mật khẩu mới */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Xác nhận mật khẩu *</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Xác nhận mật khẩu..."
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-rose-400 focus:bg-white text-slate-800"
                      required
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 active:scale-95 transition-all"
                >
                  {changingPassword ? (
                    <>
                      <Loader className="animate-spin" size={14} /> Đang xử lý...
                    </>
                  ) : (
                    "Đổi mật khẩu"
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Card 3: Permissions & Roles list */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-1.5">
                <Shield size={18} className="text-indigo-500" /> Quyền Hạn Tài Khoản (Permissions)
              </h3>
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                Danh sách chi tiết các quyền chức năng hiện có của tài khoản trong hệ thống quản trị.
              </p>
            </div>

            <div className="border border-slate-50 rounded-2xl p-4 bg-slate-50/30">
              {permissions.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs font-semibold">
                  <Shield size={24} className="mx-auto mb-2 text-slate-300" />
                  Tài khoản không được cấp quyền hạn riêng lẻ nào.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {permissions.map((perm: string) => (
                    <span 
                      key={perm} 
                      className="text-[11px] font-mono font-bold px-3 py-1 bg-white border border-slate-100 shadow-sm text-slate-600 hover:text-indigo-600 rounded-lg transition-colors cursor-default"
                    >
                      {perm}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
