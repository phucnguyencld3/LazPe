"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader } from "lucide-react";
import { toast } from "@/lib/toast";
import { getUserProfile, get2FaStatus, UserProfile } from "@/lib/api";

// Sub-components
import AdminSummaryCard from "@/components/admin/profile/AdminSummaryCard";
import PersonalInfoCard from "@/components/admin/profile/PersonalInfoCard";
import PasswordCard from "@/components/admin/profile/PasswordCard";
import NotificationSettingsCard from "@/components/admin/profile/NotificationSettingsCard";
import TwoFactorCard from "@/components/admin/profile/TwoFactorCard";
import PermissionsCard from "@/components/admin/profile/PermissionsCard";

// Modals (React Portals)
import AuthenticatorModal from "@/components/admin/profile/AuthenticatorModal";
import Email2FaModal from "@/components/admin/profile/Email2FaModal";

export default function AdminProfilePage() {
  const router = useRouter();

  // Authentication & Profile States
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // 2FA Settings States
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorProviders, setTwoFactorProviders] = useState<string[]>([]);
  const [loadingTwoFactor, setLoadingTwoFactor] = useState(false);
  const [showAuthenticatorModal, setShowAuthenticatorModal] = useState(false);
  const [showEmail2FaModal, setShowEmail2FaModal] = useState(false);
  const [authenticatorSetupData, setAuthenticatorSetupData] = useState<any>(null);

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

  // Fetch newest user profile info from API
  const fetchProfile = async (uid: string, authToken: string) => {
    try {
      const data = await getUserProfile(uid, authToken);
      if (data) {
        setProfile(data);
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
      toast.error("Không thể tải thông tin hồ sơ từ server");
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-3xl border border-slate-100 min-h-[500px]">
        <Loader className="animate-spin text-rose-500 mb-3" size={36} />
        <p className="text-sm font-semibold text-slate-500">Đang tải thông tin hồ sơ quản trị...</p>
      </div>
    );
  }

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
        
        {/* Left Column (1 Column) - Avatar, Notification Settings, and 2FA */}
        <div className="lg:col-span-1 space-y-6">
          {userId && token && (
            <AdminSummaryCard
              userId={userId}
              token={token}
              profile={profile}
              setProfile={setProfile}
              user={user}
              setUser={setUser}
            />
          )}

          {userId && token && (
            <NotificationSettingsCard
              userId={userId}
              token={token}
              profile={profile}
            />
          )}

          {token && (
            <TwoFactorCard
              token={token}
              twoFactorEnabled={twoFactorEnabled}
              twoFactorProviders={twoFactorProviders}
              loadingTwoFactor={loadingTwoFactor}
              setLoadingTwoFactor={setLoadingTwoFactor}
              fetchTwoFactorStatus={fetchTwoFactorStatus}
              setShowAuthenticatorModal={setShowAuthenticatorModal}
              setAuthenticatorSetupData={setAuthenticatorSetupData}
              setShowEmail2FaModal={setShowEmail2FaModal}
            />
          )}
        </div>

        {/* Right Column (2 Columns) - Personal Info, Password, and Permissions */}
        <div className="lg:col-span-2 space-y-6">
          {userId && token && (
            <PersonalInfoCard
              userId={userId}
              token={token}
              profile={profile}
              fetchProfile={fetchProfile}
              user={user}
              setUser={setUser}
            />
          )}

          {userId && token && (
            <PasswordCard
              userId={userId}
              token={token}
            />
          )}

          <PermissionsCard user={user} />
        </div>
      </div>

      {/* Authenticator Setup Modal (React Portal) */}
      {token && showAuthenticatorModal && authenticatorSetupData && (
        <AuthenticatorModal
          token={token}
          authenticatorSetupData={authenticatorSetupData}
          setShowAuthenticatorModal={setShowAuthenticatorModal}
          fetchTwoFactorStatus={fetchTwoFactorStatus}
        />
      )}

      {/* Email OTP Setup Modal (React Portal) */}
      {token && showEmail2FaModal && profile && (
        <Email2FaModal
          token={token}
          email={profile.email}
          setShowEmail2FaModal={setShowEmail2FaModal}
          fetchTwoFactorStatus={fetchTwoFactorStatus}
        />
      )}
    </div>
  );
}
