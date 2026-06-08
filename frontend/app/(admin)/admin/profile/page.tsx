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
  AlertCircle,
  Bell,
  Smartphone,
  QrCode,
  ShieldCheck
} from "lucide-react";
import { toast } from "@/lib/toast";
import { 
  getUserProfile, 
  updateUserProfile, 
  changePassword, 
  uploadAvatar,
  updateNotificationSettings,
  get2FaStatus,
  setupAuthenticator,
  enableAuthenticator,
  setupEmail2Fa,
  enableEmail2Fa,
  disable2Fa,
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

  // Form States - Notification Settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [promotions, setPromotions] = useState(true);
  const [updatingNotifications, setUpdatingNotifications] = useState(false);

  // Form States - 2FA Settings
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorProviders, setTwoFactorProviders] = useState<string[]>([]);
  const [loadingTwoFactor, setLoadingTwoFactor] = useState(false);
  const [showAuthenticatorModal, setShowAuthenticatorModal] = useState(false);
  const [showEmail2FaModal, setShowEmail2FaModal] = useState(false);
  const [authenticatorSetupData, setAuthenticatorSetupData] = useState<any>(null);
  const [authenticatorCode, setAuthenticatorCode] = useState("");
  const [emailOtpCode, setEmailOtpCode] = useState("");
  const [submittingTwoFactor, setSubmittingTwoFactor] = useState(false);
  const [emailSetupOtpSent, setEmailSetupOtpSent] = useState(false);

  const fetchTwoFactorStatus = async (authToken: string) => {
    try {
      const res = await get2FaStatus(authToken);
      if (res && res.success) {
        setTwoFactorEnabled(res.isEnabled);
        setTwoFactorProviders(res.providers || []);
      }
    } catch (err) {
      console.error("Error fetching 2FA status:", err);
    }
  };

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
        fetchTwoFactorStatus(savedToken);
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
        
        // Initialize notifications states
        setEmailNotifications((data as any).receiveEmailNotifications ?? true);
        setOrderUpdates((data as any).receiveOrderUpdates ?? true);
        setPromotions((data as any).receivePromotions ?? true);
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

  // Handle Notification Settings Update
  const handleUpdateNotifications = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !token) return;

    setUpdatingNotifications(true);
    try {
      const result = await updateNotificationSettings(userId, token, {
        emailNotifications,
        orderUpdates,
        promotions
      });

      if (result.success) {
        toast.success("Cập nhật cài đặt nhận thông báo thành công!");
        if (profile) {
          setProfile({
            ...profile,
            receiveEmailNotifications: emailNotifications,
            receiveOrderUpdates: orderUpdates,
            receivePromotions: promotions
          } as any);
        }
      } else {
        toast.error(result.message || "Không thể cập nhật cài đặt nhận thông báo");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối khi cập nhật cài đặt thông báo");
    } finally {
      setUpdatingNotifications(false);
    }
  };

  // Handle Setup Authenticator App
  const handleSetupAuthenticator = async () => {
    if (!token) return;
    setLoadingTwoFactor(true);
    try {
      const res = await setupAuthenticator(token);
      if (res && res.success) {
        setAuthenticatorSetupData(res);
        setShowAuthenticatorModal(true);
      } else {
        toast.error(res?.message || "Không thể cấu hình Authenticator App");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối khi thiết lập Authenticator");
    } finally {
      setLoadingTwoFactor(false);
    }
  };

  // Handle Enable Authenticator App
  const handleEnableAuthenticator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !authenticatorCode) return;
    setSubmittingTwoFactor(true);
    try {
      const res = await enableAuthenticator(token, authenticatorCode);
      if (res.success) {
        toast.success("Bật xác thực qua Authenticator App thành công!");
        setShowAuthenticatorModal(false);
        setAuthenticatorCode("");
        await fetchTwoFactorStatus(token);
      } else {
        toast.error(res.message || "Mã xác thực không chính xác");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi hệ thống khi kích hoạt Authenticator");
    } finally {
      setSubmittingTwoFactor(false);
    }
  };

  // Handle Setup Email 2FA OTP
  const handleSetupEmail2Fa = async () => {
    if (!token) return;
    setLoadingTwoFactor(true);
    try {
      const res = await setupEmail2Fa(token);
      if (res.success) {
        setEmailSetupOtpSent(true);
        setShowEmail2FaModal(true);
        toast.success("Đã gửi mã xác nhận đến email của bạn!");
      } else {
        toast.error(res.message || "Không thể gửi yêu cầu thiết lập Email 2FA");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối khi thiết lập Email 2FA");
    } finally {
      setLoadingTwoFactor(false);
    }
  };

  // Handle Enable Email 2FA
  const handleEnableEmail2Fa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !emailOtpCode) return;
    setSubmittingTwoFactor(true);
    try {
      const res = await enableEmail2Fa(token, emailOtpCode);
      if (res.success) {
        toast.success("Bật xác thực qua Email thành công!");
        setShowEmail2FaModal(false);
        setEmailOtpCode("");
        setEmailSetupOtpSent(false);
        await fetchTwoFactorStatus(token);
      } else {
        toast.error(res.message || "Mã xác thực không chính xác hoặc đã hết hạn");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi hệ thống khi kích hoạt Email 2FA");
    } finally {
      setSubmittingTwoFactor(false);
    }
  };

  // Handle Disable 2FA
  const handleDisable2Fa = async () => {
    if (!token) return;
    if (!confirm("Bạn có chắc chắn muốn tắt tính năng xác thực 2 bước không? Tài khoản của bạn sẽ kém an toàn hơn.")) return;
    
    setLoadingTwoFactor(true);
    try {
      const res = await disable2Fa(token);
      if (res.success) {
        toast.success("Tắt xác thực 2 bước thành công!");
        await fetchTwoFactorStatus(token);
      } else {
        toast.error(res.message || "Không thể tắt xác thực 2 bước");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối khi tắt xác thực 2 bước");
    } finally {
      setLoadingTwoFactor(false);
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
    <div className="space-y-6 pb-12 font-sans text-sm">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Hồ Sơ Cá Nhân</h1>
        <p className="text-sm text-slate-500 font-semibold mt-1.5">
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

            <h2 className="text-xl font-bold text-slate-800 mt-4 leading-tight">
              {profile?.fullName || user?.fullName || "Chưa thiết lập"}
            </h2>
            <p className="text-sm text-slate-500 font-semibold mt-1">
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
            <div className="w-full text-left mt-6 space-y-4 border-t border-slate-100 pt-4 text-sm font-semibold text-slate-600">
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
        </div>

        {/* Center/Right Cards: Edit Info & Password (2 Columns) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card 1: Personal Info form */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-extrabold text-slate-800">Thông Tin Cá Nhân</h3>
              <p className="text-sm text-slate-400 font-semibold mt-1">Cập nhật họ tên và số điện thoại liên lạc của bạn.</p>
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
                  className="px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-bold flex items-center gap-1.5 disabled:opacity-50 active:scale-95 shadow-md shadow-rose-500/10 transition-all cursor-pointer"
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
              <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-1.5">
                <Key size={20} className="text-rose-500" /> Đổi Mật Khẩu
              </h3>
              <p className="text-sm text-slate-400 font-semibold mt-1">Bảo vệ tài khoản bằng cách sử dụng mật khẩu mạnh.</p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {passwordError && (
                <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2 text-rose-600 text-sm font-bold">
                  <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                  <span>{passwordError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Mật khẩu cũ */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Mật khẩu hiện tại *</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Mật khẩu cũ..."
                      className="w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-rose-400 focus:bg-white text-slate-800"
                      required
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Mật khẩu mới */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Mật khẩu mới *</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Ít nhất 6 ký tự..."
                      className="w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-rose-400 focus:bg-white text-slate-800"
                      required
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Nhập lại mật khẩu mới */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Xác nhận mật khẩu *</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Xác nhận mật khẩu..."
                      className="w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-rose-400 focus:bg-white text-slate-800"
                      required
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="px-6 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-bold flex items-center gap-1.5 disabled:opacity-50 active:scale-95 transition-all cursor-pointer"
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

          {/* Grid Layout for Notifications, 2FA, and Permissions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Card 3: Notification Settings */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm space-y-6 flex flex-col justify-between">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-1.5">
                    <Bell size={20} className="text-rose-500" /> Cài Đặt Thông Báo
                  </h3>
                  <p className="text-sm text-slate-400 font-semibold mt-1">Cấu hình nhận thông báo hệ thống và email cá nhân.</p>
                </div>

                <form onSubmit={handleUpdateNotifications} className="space-y-3">
                  <label className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-200/60 rounded-xl transition-all cursor-pointer select-none">
                    <div className="flex flex-col text-left pr-2">
                      <span className="text-sm font-bold text-slate-800">Email thông báo</span>
                      <span className="text-[11px] text-slate-400 font-semibold mt-0.5 leading-snug">Nhận thông báo qua hòm thư điện tử.</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={emailNotifications} 
                      onChange={(e) => setEmailNotifications(e.target.checked)}
                      className="w-5 h-5 rounded border-slate-350 text-rose-500 focus:ring-rose-400 cursor-pointer accent-rose-500 flex-shrink-0"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-200/60 rounded-xl transition-all cursor-pointer select-none">
                    <div className="flex flex-col text-left pr-2">
                      <span className="text-sm font-bold text-slate-800">Cập nhật đơn hàng</span>
                      <span className="text-[11px] text-slate-400 font-semibold mt-0.5 leading-snug">Nhận tin báo trạng thái đơn hàng mua sắm.</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={orderUpdates} 
                      onChange={(e) => setOrderUpdates(e.target.checked)}
                      className="w-5 h-5 rounded border-slate-350 text-rose-500 focus:ring-rose-400 cursor-pointer accent-rose-500 flex-shrink-0"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-200/60 rounded-xl transition-all cursor-pointer select-none">
                    <div className="flex flex-col text-left pr-2">
                      <span className="text-sm font-bold text-slate-800">Tin tức & Khuyến mãi</span>
                      <span className="text-[11px] text-slate-400 font-semibold mt-0.5 leading-snug">Nhận bản tin khuyến mãi và tin tức mới nhất.</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={promotions} 
                      onChange={(e) => setPromotions(e.target.checked)}
                      className="w-5 h-5 rounded border-slate-350 text-rose-500 focus:ring-rose-400 cursor-pointer accent-rose-500 flex-shrink-0"
                    />
                  </label>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={updatingNotifications}
                      className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 active:scale-95 shadow-md shadow-rose-500/10 transition-all cursor-pointer"
                    >
                      {updatingNotifications ? (
                        <>
                          <Loader className="animate-spin" size={14} /> Đang lưu...
                        </>
                      ) : (
                        "Lưu cài đặt"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Card 4: Two-Factor Authentication (2FA) */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm space-y-6 flex flex-col justify-between">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-1.5">
                    <ShieldCheck size={20} className="text-emerald-500" /> Xác Thực 2 Bước (2FA)
                  </h3>
                  <p className="text-sm text-slate-400 font-semibold mt-1">Bảo vệ tài khoản tối đa bằng hai lớp xác thực bảo mật.</p>
                </div>

                <div className="space-y-4">
                  {/* Status indicator */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200/60 rounded-2xl">
                    <span className="text-sm font-bold text-slate-700">Trạng thái 2FA:</span>
                    <span className={`text-xs font-extrabold px-3 py-1.5 rounded-full flex items-center gap-1.5 ${
                      twoFactorEnabled 
                        ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" 
                        : "bg-slate-100 text-slate-500 border border-slate-200"
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${twoFactorEnabled ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`}></span>
                      {twoFactorEnabled ? "Đang bật" : "Đang tắt"}
                    </span>
                  </div>

                  {/* Configured providers details */}
                  {twoFactorEnabled && twoFactorProviders.length > 0 && (
                    <div className="text-xs font-semibold text-slate-500 space-y-2">
                      <span className="block text-[11px] uppercase tracking-wider text-slate-400">Phương thức kích hoạt:</span>
                      <div className="flex flex-wrap gap-2">
                        {twoFactorProviders.map(prov => (
                          <span key={prov} className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 flex items-center gap-1.5 font-bold">
                            {prov === "Authenticator" ? <Smartphone size={14} className="text-rose-500" /> : <Mail size={14} className="text-rose-500" />}
                            {prov === "Authenticator" ? "Authenticator App" : "Email OTP"}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-2">
                    {twoFactorEnabled ? (
                      <button
                        type="button"
                        onClick={handleDisable2Fa}
                        disabled={loadingTwoFactor}
                        className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-650 rounded-xl text-sm font-bold border border-red-200/50 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        {loadingTwoFactor ? <Loader className="animate-spin" size={16} /> : <Lock size={16} />}
                        Tắt xác thực 2 bước
                      </button>
                    ) : (
                      <div className="space-y-2.5">
                        <button
                          type="button"
                          onClick={handleSetupAuthenticator}
                          disabled={loadingTwoFactor}
                          className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          {loadingTwoFactor ? <Loader className="animate-spin" size={16} /> : <QrCode size={16} />}
                          Cài đặt Authenticator App
                        </button>
                        <button
                          type="button"
                          onClick={handleSetupEmail2Fa}
                          disabled={loadingTwoFactor}
                          className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-rose-500/10 cursor-pointer"
                        >
                          {loadingTwoFactor ? <Loader className="animate-spin" size={16} /> : <Mail size={16} />}
                          Cài đặt qua Email OTP
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Card 5: Permissions & Roles list */}
            <div className="md:col-span-2 bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm space-y-6 flex flex-col justify-between">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-1.5">
                    <Shield size={20} className="text-indigo-500" /> Quyền Hạn Tài Khoản (Permissions)
                  </h3>
                  <p className="text-sm text-slate-450 font-semibold mt-1">
                    Danh sách chi tiết các quyền chức năng hiện có của tài khoản trong hệ thống quản trị.
                  </p>
                </div>

                <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 flex-1 min-h-[150px] overflow-y-auto" style={{ maxHeight: "250px" }}>
                  {permissions.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-sm font-semibold">
                      <Shield size={24} className="mx-auto mb-2 text-slate-300" />
                      Tài khoản không được cấp quyền hạn riêng lẻ nào.
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {permissions.map((perm: string) => (
                        <span 
                          key={perm} 
                          className="text-xs font-mono font-bold px-3 py-1.5 bg-white border border-slate-200/80 shadow-sm text-slate-600 hover:text-indigo-600 rounded-lg transition-colors cursor-default"
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
      </div>

      {/* Authenticator Setup Modal */}
      {showAuthenticatorModal && authenticatorSetupData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 border border-slate-100 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-1.5">
                <QrCode size={22} className="text-rose-500" /> Cấu hình Authenticator App
              </h3>
              <button 
                type="button" 
                onClick={() => { setShowAuthenticatorModal(false); setAuthenticatorCode(""); }}
                className="text-slate-400 hover:text-slate-650 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4 text-sm font-medium text-slate-650">
              <p><strong>Bước 1:</strong> Sử dụng ứng dụng Authenticator (Google/Microsoft Authenticator) để quét mã QR dưới đây:</p>
              
              <div className="flex justify-center py-2">
                <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-inner">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(authenticatorSetupData.qrCodeUri || "")}`}
                    alt="2FA QR Code" 
                    className="w-40 h-40"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/50 space-y-1">
                <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Nếu không quét được, nhập khoá thủ công:</span>
                <code className="block text-xs font-mono font-bold select-all text-slate-800 tracking-wide text-center">{authenticatorSetupData.sharedKey}</code>
              </div>

              <p><strong>Bước 2:</strong> Nhập mã 6 chữ số hiển thị trên ứng dụng xác thực để kích hoạt:</p>

              <form onSubmit={handleEnableAuthenticator} className="space-y-4">
                <div className="relative">
                  <Smartphone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    maxLength={6}
                    value={authenticatorCode}
                    onChange={(e) => setAuthenticatorCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="Mã xác thực 6 số..."
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-rose-400 focus:bg-white text-slate-800 tracking-[4px] font-mono text-center font-bold"
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowAuthenticatorModal(false); setAuthenticatorCode(""); }}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={submittingTwoFactor || authenticatorCode.length < 6}
                    className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl text-xs flex items-center gap-1 disabled:opacity-60 cursor-pointer"
                  >
                    {submittingTwoFactor && <Loader className="animate-spin" size={12} />}
                    Xác nhận kích hoạt
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Email OTP Setup Modal */}
      {showEmail2FaModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 border border-slate-100 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-1.5">
                <Mail size={22} className="text-rose-500" /> Cấu hình Xác thực Email
              </h3>
              <button 
                type="button" 
                onClick={() => { setShowEmail2FaModal(false); setEmailOtpCode(""); setEmailSetupOtpSent(false); }}
                className="text-slate-400 hover:text-slate-650 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4 text-sm font-medium text-slate-650">
              <p>Chúng tôi đã gửi mã OTP gồm 6 chữ số vào địa chỉ email: <strong>{profile?.email}</strong>. Vui lòng nhập mã để hoàn tất kích hoạt.</p>

              <form onSubmit={handleEnableEmail2Fa} className="space-y-4">
                <div className="relative">
                  <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    maxLength={6}
                    value={emailOtpCode}
                    onChange={(e) => setEmailOtpCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="Nhập mã OTP..."
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-rose-400 focus:bg-white text-slate-800 tracking-[4px] font-mono text-center font-bold"
                    required
                  />
                </div>

                <div className="text-center text-xs">
                  <button
                    type="button"
                    onClick={handleSetupEmail2Fa}
                    className="text-rose-500 hover:text-rose-600 font-bold hover:underline cursor-pointer"
                  >
                    Gửi lại mã OTP qua email
                  </button>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowEmail2FaModal(false); setEmailOtpCode(""); setEmailSetupOtpSent(false); }}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={submittingTwoFactor || emailOtpCode.length < 6}
                    className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl text-xs flex items-center gap-1 disabled:opacity-60 cursor-pointer"
                  >
                    {submittingTwoFactor && <Loader className="animate-spin" size={12} />}
                    Xác nhận kích hoạt
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
