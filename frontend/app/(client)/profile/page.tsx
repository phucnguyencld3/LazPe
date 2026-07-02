"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader } from "lucide-react";
import { toast } from "@/lib/toast";
import {
  getUserProfile,
  updateUserProfile,
  changePassword,
  checkHasPassword,
  setPassword,
  getUserAddresses,
  getProvinces,
  getDistricts,
  getWards,
  createAddress,
  updateAddress,
  setDefaultAddress,
  deleteAddress,
  getLoyaltyProfile,
  UserProfile,
  AddressItem,
  normalizeName,
  updateNotificationSettings
} from "@/lib/api";

import { ProfileHeader } from "@/components/client/profile/ProfileHeader";
import { PersonalInfo } from "@/components/client/profile/PersonalInfo";
import { BabyInfo } from "@/components/client/profile/BabyInfo";
import { AddressList } from "@/components/client/profile/AddressList";
import { SecurityAndSettings } from "@/components/client/profile/SecurityAndSettings";
import { EditProfileModal } from "@/components/client/profile/modals/EditProfileModal";
import { EditBabyInfoModal } from "@/components/client/profile/modals/EditBabyInfoModal";
import { ProfileMessages } from "@/components/client/profile/ProfileMessages";
import { ChangePasswordModal } from "@/components/client/profile/modals/ChangePasswordModal";
import { ProfileAddressModal } from "@/components/client/profile/modals/ProfileAddressModal";
import { VoucherSection } from "@/components/client/profile/VoucherSection";
import { OrdersSection } from "@/components/client/profile/OrdersSection";
import { ReviewsSection } from "@/components/client/profile/ReviewsSection";
import { PrivacySection } from "@/components/client/profile/PrivacySection";
import { LoyaltySection } from "@/components/client/profile/LoyaltySection";
import { NotificationsSection } from "@/components/client/profile/NotificationsSection";
import { SpendingSection } from "@/components/client/profile/SpendingSection";
import { ProductAlertsSection } from "@/components/client/profile/ProductAlertsSection";
import { WalletSection } from "@/components/client/profile/WalletSection";
import { BabyTrackerSection } from "@/components/client/profile/BabyTrackerSection";

export default function ProfilePage() {
  const router = useRouter();

  // States
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [hasPassword, setHasPassword] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("profile");
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [loyaltyProfile, setLoyaltyProfile] = useState<any>(null);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);
  const [initialNotifId, setInitialNotifId] = useState<number | null>(null);
  const [pendingSupportOrder, setPendingSupportOrder] = useState<any>(null);
  const [activeBabyId, setActiveBabyId] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      const idParam = params.get("id");
      if (tabParam) {
        setActiveTab(tabParam);
      }
      if (idParam) {
        const parsed = parseInt(idParam, 10);
        if (!isNaN(parsed)) {
          setInitialNotifId(parsed);
        }
      }
    }
  }, []);

  const handleClearInitialId = () => {
    setInitialNotifId(null);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("id");
      window.history.replaceState({}, "", url.pathname + url.search);
    }
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tabId);
      window.history.replaceState({}, "", url.pathname + url.search);
    }
  };

  // Modals States
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [editBabyInfoOpen, setEditBabyInfoOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressItem | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<number | null>(null);

  // Forms States
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    dateOfBirth: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const [addressForm, setAddressForm] = useState({
    recipientName: "",
    phoneNumber: "",
    provinceCode: "",
    provinceName: "",
    districtCode: "",
    districtName: "",
    wardCode: "",
    wardName: "",
    detailAddress: "",
    isDefault: false,
    apiVersion: "v2"
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    orderUpdates: true,
    promotions: false,
  });

  const [addressError, setAddressError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem("token") || sessionStorage.getItem("token");
    const savedUserJson = localStorage.getItem("user") || sessionStorage.getItem("user");

    if (!savedToken || !savedUserJson) {
      router.push("/login");
      return;
    }

    setToken(savedToken);

    // Gỡ bỏ load từ localStorage để dùng API backend trực tiếp

    const parsedUser = JSON.parse(savedUserJson);
    const userId = parsedUser.id || parsedUser.userId;

    if (!userId) {
      router.push("/login");
      return;
    }

    fetchData(userId, savedToken);
  }, []);

  useEffect(() => {
    if (activeTab === "address" && userProfile && token) {
      getUserAddresses(userProfile.userId, token).then((addressList) => {
        if (addressList) setAddresses(addressList);
      });
    }
  }, [activeTab, userProfile, token]);

  const fetchData = async (userId: string, authToken: string) => {
    setLoading(true);
    try {
      const profileData = await getUserProfile(userId, authToken);
      if (profileData) {
        setUserProfile(profileData);
        setProfileForm({
          fullName: profileData.fullName,
          email: profileData.email,
          phoneNumber: profileData.phoneNumber || "",
          dateOfBirth: profileData.dateOfBirth ? profileData.dateOfBirth.split("T")[0] : "",
        });
        setNotificationSettings({
          emailNotifications: (profileData as any).receiveEmailNotifications ?? true,
          orderUpdates: (profileData as any).receiveOrderUpdates ?? true,
          promotions: (profileData as any).receivePromotions ?? true,
        });
      }

      // Check has password
      const hasPass = await checkHasPassword(userId, authToken);
      setHasPassword(hasPass);

      const addressList = await getUserAddresses(userId, authToken);
      if (addressList) {
        setAddresses(addressList);
      }

      // Fetch Loyalty Profile
      try {
        const lp = await getLoyaltyProfile(authToken);
        if (lp) {
          setLoyaltyProfile(lp);
        }
      } catch (e) {
        console.error("Error fetching loyalty profile in profile:", e);
      }
    } catch (error) {
      console.error("Error fetching profile details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile || !token) return;

    setProfileError(null);
    try {
      const result = await updateUserProfile(userProfile.userId, token, {
        fullName: profileForm.fullName,
        email: profileForm.email,
        phoneNumber: profileForm.phoneNumber || undefined,
        dateOfBirth: profileForm.dateOfBirth ? new Date(profileForm.dateOfBirth).toISOString() : null,
        avatar: userProfile.avatar,
      });

      if (result.success) {
        toast.success("Cập nhật thông tin cá nhân thành công!");
        const updatedProfile = {
          ...userProfile,
          fullName: profileForm.fullName,
          email: profileForm.email,
          phoneNumber: profileForm.phoneNumber,
          dateOfBirth: profileForm.dateOfBirth ? new Date(profileForm.dateOfBirth).toISOString() : undefined,
        };
        setUserProfile(updatedProfile);

        const savedUserJson = localStorage.getItem("user") || sessionStorage.getItem("user");
        if (savedUserJson) {
          const userObj = JSON.parse(savedUserJson);
          userObj.fullName = profileForm.fullName;
          userObj.phoneNumber = profileForm.phoneNumber;
          userObj.email = profileForm.email;

          if (localStorage.getItem("user")) {
            localStorage.setItem("user", JSON.stringify(userObj));
          } else {
            sessionStorage.setItem("user", JSON.stringify(userObj));
          }
        }
        setEditProfileOpen(false);
        setEditBabyInfoOpen(false);
      } else {
        setProfileError(result.message || "Không thể cập nhật thông tin cá nhân");
      }
    } catch (err) {
      console.error(err);
      setProfileError("Lỗi kết nối đến server");
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile || !token) return;
    setPasswordError(null);

    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      setPasswordError("Mật khẩu mới không khớp!");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError("Mật khẩu mới phải có ít nhất 6 ký tự!");
      return;
    }

    try {
      let result;
      if (hasPassword) {
        result = await changePassword(userProfile.userId, token, {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
          confirmNewPassword: passwordForm.confirmNewPassword
        });
      } else {
        result = await setPassword(userProfile.userId, token, {
          newPassword: passwordForm.newPassword,
          confirmNewPassword: passwordForm.confirmNewPassword
        });
      }

      if (result.success) {
        toast.success(hasPassword ? "Đổi mật khẩu thành công!" : "Thiết lập mật khẩu thành công!");
        setChangePasswordOpen(false);
        setPasswordForm({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
        setHasPassword(true); // User now has a password
      } else {
        setPasswordError(result.message || (hasPassword ? "Đổi mật khẩu thất bại" : "Thiết lập mật khẩu thất bại"));
      }
    } catch (err) {
      console.error(err);
      setPasswordError("Lỗi kết nối đến server");
    }
  };

  const handleNotificationToggle = async (key: keyof typeof notificationSettings) => {
    if (!userProfile || !token) return;
    const updated = { ...notificationSettings, [key]: !notificationSettings[key] };

    setNotificationSettings(updated);
    try {
      const result = await updateNotificationSettings(userProfile.userId, token, updated);
      if (result.success) {
        toast.success("Đã cập nhật cài đặt thông báo!");
      } else {
        toast.error(result.message || "Không thể lưu cài đặt");
        setNotificationSettings(notificationSettings);
      }
    } catch (e) {
      console.error(e);
      toast.error("Lỗi kết nối khi cập nhật cài đặt");
      setNotificationSettings(notificationSettings);
    }
  };

  const handleAvatarUpdated = (newAvatarUrl: string) => {
    if (userProfile) {
      setUserProfile({ ...userProfile, avatar: newAvatarUrl });

      const savedUserJson = localStorage.getItem("user") || sessionStorage.getItem("user");
      if (savedUserJson) {
        const userObj = JSON.parse(savedUserJson);
        userObj.avatar = newAvatarUrl;
        if (localStorage.getItem("user")) {
          localStorage.setItem("user", JSON.stringify(userObj));
        } else {
          sessionStorage.setItem("user", JSON.stringify(userObj));
        }
        window.dispatchEvent(new Event("auth-change"));
      }
    }
  };

  const openNewAddressModal = async () => {
    setAddressModalOpen(true);
    setAddressError(null);
    setEditingAddress(null);
    setAddressForm({
      recipientName: "",
      phoneNumber: "",
      provinceCode: "",
      provinceName: "",
      districtCode: "",
      districtName: "",
      wardCode: "",
      wardName: "",
      detailAddress: "",
      isDefault: false,
      apiVersion: "v2"
    });
    setDistricts([]);
    setWards([]);

    try {
      const provList = await getProvinces("v2");
      if (provList) setProvinces(provList);
    } catch (err) {
      console.error("Error loading provinces:", err);
    }
  };

  const handleOpenEditAddressForm = async (address: AddressItem) => {
    setEditingAddress(address);
    setAddressError(null);
    setAddressModalOpen(true);

    try {
      const apiVer = address.apiVersion || "v1";
      const provList = await getProvinces(apiVer);
      if (provList) setProvinces(provList);

      let matchedProvince = null;
      if (address.provinceCode) {
        matchedProvince = provList?.find((p) => String(p.code) === String(address.provinceCode));
      }
      if (!matchedProvince && address.province) {
        matchedProvince = provList?.find((p) => normalizeName(p.name) === normalizeName(address.province));
      }
      const provCode = matchedProvince ? String(matchedProvince.code) : (address.provinceCode ? String(address.provinceCode) : "");
      const provName = matchedProvince?.name || address.province || "";

      let distList: any[] = [];
      let matchedDistrict: any = null;
      if (provCode) {
        const distData = await getDistricts(provCode, apiVer);
        distList = distData?.districts || [];
        setDistricts(distList);

        if (distList.length === 1) {
          matchedDistrict = distList[0];
        } else {
          if (address.districtCode) {
            matchedDistrict = distList.find((d) => String(d.code) === String(address.districtCode));
          }
          if (!matchedDistrict && address.district) {
            matchedDistrict = distList.find((d) => normalizeName(d.name) === normalizeName(address.district));
          }
        }
      }
      const distCode = matchedDistrict ? String(matchedDistrict.code) : (address.districtCode ? String(address.districtCode) : "");
      const distName = matchedDistrict?.name || address.district || "";

      let wardList: any[] = [];
      let matchedWard: any = null;
      const wardFetchCode = distCode || provCode;
      if (wardFetchCode) {
        const wardData = await getWards(wardFetchCode, apiVer);
        wardList = wardData?.wards || [];
        setWards(wardList);

        if (address.wardCode) {
          matchedWard = wardList.find((w: any) => String(w.code) === String(address.wardCode));
        }
        if (!matchedWard && address.ward) {
          matchedWard = wardList.find((w: any) => normalizeName(w.name) === normalizeName(address.ward));
        }
      }
      const wardCode = matchedWard ? String(matchedWard.code) : (address.wardCode ? String(address.wardCode) : "");
      const wardName = matchedWard?.name || address.ward || "";

      setAddressForm({
        recipientName: address.recipientName,
        phoneNumber: address.phoneNumber,
        provinceCode: provCode,
        provinceName: provName,
        districtCode: distCode,
        districtName: distName,
        wardCode: wardCode,
        wardName: wardName,
        detailAddress: address.detailAddress || "",
        isDefault: address.isDefault,
        apiVersion: apiVer
      });
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải thông tin địa chỉ");
    }
  };

  const handleProvinceChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const name = e.target.options[e.target.selectedIndex].text;
    setAddressForm({ ...addressForm, provinceCode: code, provinceName: name, districtCode: "", districtName: "", wardCode: "", wardName: "" });
    setDistricts([]);
    setWards([]);

    if (code) {
      const data = await getDistricts(code, addressForm.apiVersion);
      if (data && data.districts) setDistricts(data.districts);
    }
  };

  const handleDistrictChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const name = e.target.options[e.target.selectedIndex].text;
    setAddressForm({ ...addressForm, districtCode: code, districtName: name, wardCode: "", wardName: "" });
    setWards([]);

    if (code) {
      const data = await getWards(code, addressForm.apiVersion);
      if (data && data.wards) setWards(data.wards);
    }
  };

  const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const name = e.target.options[e.target.selectedIndex].text;
    setAddressForm({ ...addressForm, wardCode: code, wardName: name });
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile || !token) return;
    setAddressError(null);

    if (!addressForm.provinceCode || !addressForm.districtCode || (addressForm.apiVersion === "v1" && !addressForm.wardCode)) {
      setAddressError(addressForm.apiVersion === "v2" ? "Vui lòng chọn đầy đủ Tỉnh/Thành và Phường/Xã" : "Vui lòng chọn đầy đủ Tỉnh/Thành, Quận/Huyện và Phường/Xã");
      return;
    }

    try {
      const data = {
        userId: userProfile.userId,
        recipientName: addressForm.recipientName,
        phoneNumber: addressForm.phoneNumber,
        provinceCode: addressForm.provinceCode,
        provinceName: addressForm.provinceName,
        districtCode: addressForm.districtCode,
        districtName: addressForm.districtName,
        wardCode: addressForm.wardCode,
        wardName: addressForm.wardName,
        detailAddress: addressForm.detailAddress,
        isDefault: addressForm.isDefault,
        apiVersion: addressForm.apiVersion
      };

      let result;
      if (editingAddress) {
        result = await updateAddress(editingAddress.addressID, token, data);
      } else {
        result = await createAddress(token, data);
      }

      if (result.success) {
        toast.success(editingAddress ? "Cập nhật địa chỉ thành công!" : "Thêm địa chỉ mới thành công!");
        setAddressModalOpen(false);
        const addressList = await getUserAddresses(userProfile.userId, token);
        if (addressList) setAddresses(addressList);
      } else {
        setAddressError(result.message || "Có lỗi xảy ra");
      }
    } catch (err) {
      console.error(err);
      setAddressError("Lỗi kết nối đến server");
    }
  };

  const handleDeleteAddressClick = (addressId: number) => {
    setAddressToDelete(addressId);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDeleteAddress = async () => {
    if (!token || !userProfile || addressToDelete === null) return;
    try {
      const result = await deleteAddress(addressToDelete, token);
      if (result.success) {
        toast.success("Xóa địa chỉ thành công");
        const addressList = await getUserAddresses(userProfile.userId, token);
        if (addressList) setAddresses(addressList);
      } else {
        toast.error(result.message || "Không thể xóa địa chỉ");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối đến server");
    } finally {
      setDeleteConfirmOpen(false);
      setAddressToDelete(null);
    }
  };

  const handleSetDefaultAddressClick = async (addressId: number) => {
    if (!token || !userProfile) return;
    const result = await setDefaultAddress(addressId, token);
    if (result.success) {
      toast.success("Đã thiết lập địa chỉ mặc định");
      const addressList = await getUserAddresses(userProfile.userId, token);
      if (addressList) setAddresses(addressList);
    } else {
      toast.error(result.message || "Không thể thiết lập mặc định");
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader className="animate-spin text-primary mb-4" size={48} />
        <p className="text-on-surface-variant font-medium">Đang tải thông tin tài khoản...</p>
      </div>
    );
  }

  if (!userProfile || !token) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
        <span className="material-symbols-outlined text-6xl text-error mb-4">error</span>
        <h2 className="text-xl font-bold text-on-surface mb-2">Không thể tải thông tin</h2>
        <p className="text-on-surface-variant mb-6">Vui lòng đăng nhập lại để tiếp tục</p>
        <button onClick={() => router.push("/login")} className="bg-primary text-white px-6 py-2 rounded-full font-bold">
          Đăng nhập
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex flex-col lg:flex-row gap-4 items-start">
        {/* Left Sidebar Menu */}
        <aside className="w-full lg:w-[240px] flex-shrink-0 lg:sticky lg:top-[90px] z-10">
          <div className="bg-white rounded-[10px] border border-slate-100/60 shadow-sm pb-3 max-h-[calc(100vh-140px)] overflow-y-auto scrollbar-none">
            {/* Quick User Section */}
              <div className="p-5 flex flex-col items-center text-center gap-2">
                <div className="space-y-1 w-full">
                  <h3 className="font-bold text-slate-800 text-base line-clamp-1">{userProfile.fullName}</h3>
                  <p className="text-[11px] text-slate-400 font-medium truncate px-2">{userProfile.email}</p>
                </div>
              </div>

              {/* Menu List Section */}
              <div className="px-2">
                {/* Desktop view */}
                <nav className="hidden lg:flex flex-col gap-1">
                  {(
                    [
                      { id: "profile", label: "Thông tin tài khoản", icon: "person" },
                      { id: "wallet", label: "Ví LazPe", icon: "account_balance_wallet" },
                      { id: "loyalty", label: "Khách hàng thân thiết", icon: "military_tech" },
                      { id: "spending", label: "Phân tích chi tiêu", icon: "monitoring" },
                      { id: "address", label: "Địa chỉ nhận hàng", icon: "location_on" },
                      { id: "vouchers", label: "Voucher của tôi", icon: "confirmation_number" },
                      { id: "orders", label: "Đơn mua", icon: "shopping_bag" },
                      { id: "messages", label: "Tin nhắn hỗ trợ", icon: "chat" },
                      { id: "alerts", label: "Thông báo giá/kho", icon: "add_alert" },
                      { id: "notifications", label: "Thông báo của tôi", icon: "notifications" },
                      { id: "reviews", label: "Đánh giá của tôi", icon: "reviews" },
                      { id: "privacy", label: "Chính sách bảo mật", icon: "policy" },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleTabChange(item.id)}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-[8px] font-bold text-[13px] text-left transition-all ${activeTab === item.id
                        ? "bg-primary text-white shadow-sm shadow-primary/20 scale-[1.01]"
                        : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                        }`}
                    >
                      <span className={`material-symbols-outlined text-[18px] ${activeTab === item.id ? "text-white" : "text-slate-400"}`}>
                        {item.icon}
                      </span>
                      {item.label}
                    </button>
                  ))}
                </nav>

                {/* Mobile view */}
                <div className="lg:hidden flex overflow-x-auto gap-2 pb-2 scrollbar-none px-1">
                  {(
                    [
                      { id: "profile", label: "Tài khoản", icon: "person" },
                      { id: "wallet", label: "Ví LazPe", icon: "account_balance_wallet" },
                      { id: "loyalty", label: "Tích điểm", icon: "military_tech" },
                      { id: "spending", label: "Chi tiêu", icon: "monitoring" },
                      { id: "address", label: "Địa chỉ", icon: "location_on" },
                      { id: "vouchers", label: "Voucher", icon: "confirmation_number" },
                      { id: "orders", label: "Đơn mua", icon: "shopping_bag" },
                      { id: "messages", label: "Tin nhắn", icon: "chat" },
                      { id: "alerts", label: "Báo giá", icon: "add_alert" },
                      { id: "notifications", label: "Thông báo", icon: "notifications" },
                      { id: "reviews", label: "Đánh giá", icon: "reviews" },
                      { id: "privacy", label: "Bảo mật", icon: "policy" },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleTabChange(item.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold text-[11px] whitespace-nowrap transition-all ${activeTab === item.id
                        ? "bg-primary text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:text-primary hover:bg-slate-200"
                        }`}
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {item.icon}
                      </span>
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Right Content Area */}
          <main className="flex-1 min-w-0 w-full">
            {activeTab === "profile" && (
              <div className="space-y-3">
                <ProfileHeader
                  userProfile={userProfile}
                  token={token}
                  onAvatarUpdated={handleAvatarUpdated}
                  loyaltyProfile={loyaltyProfile}
                />
                <PersonalInfo
                  userProfile={userProfile}
                  onEditClick={() => setEditProfileOpen(true)}
                />
                <BabyInfo
                  userProfile={userProfile}
                  onEditClick={() => setEditBabyInfoOpen(true)}
                  onOpenTracker={(id) => {
                    setActiveBabyId(id);
                    handleTabChange("baby-tracker");
                  }}
                />
                <SecurityAndSettings
                  hasPassword={hasPassword}
                  onChangePasswordClick={() => setChangePasswordOpen(true)}
                  notificationSettings={notificationSettings}
                  onNotificationToggle={handleNotificationToggle}
                />
              </div>
            )}
            
            {activeTab === "messages" && (
              <ProfileMessages 
                token={token} 
                pendingSupportOrder={pendingSupportOrder}
                clearPendingSupportOrder={() => setPendingSupportOrder(null)}
              />
            )}

            {activeTab === "address" && (
              <AddressList
                addresses={addresses}
                onAddClick={openNewAddressModal}
                onEditClick={handleOpenEditAddressForm}
                onDeleteClick={handleDeleteAddressClick}
                onSetDefaultClick={handleSetDefaultAddressClick}
              />
            )}

            {activeTab === "vouchers" && <VoucherSection token={token} />}

            {activeTab === "wallet" && (
              <WalletSection token={token} uid={userProfile.userId} />
            )}

            {activeTab === "loyalty" && (
              <LoyaltySection token={token} />
            )}

            {activeTab === "spending" && (
              <SpendingSection token={token} />
            )}

            {activeTab === "orders" && (
              <OrdersSection
                userId={userProfile.userId}
                token={token}
                initialOrderId={initialNotifId}
                onClearInitialOrderId={handleClearInitialId}
                onChangeTab={handleTabChange}
                onSupportOrder={(order) => {
                  setPendingSupportOrder(order);
                  handleTabChange("messages");
                }}
              />
            )}

            {activeTab === "alerts" && (
              <ProductAlertsSection token={token} />
            )}

            {activeTab === "notifications" && (
              <NotificationsSection
                token={token}
                initialSelectedId={initialNotifId}
                onClearInitialId={handleClearInitialId}
              />
            )}

            {activeTab === "reviews" && (
              <ReviewsSection
                userId={userProfile.userId}
                token={token}
              />
            )}

            {activeTab === "baby-tracker" && activeBabyId !== null && (
              <BabyTrackerSection 
                babyId={activeBabyId} 
                onBack={() => handleTabChange("profile")} 
                onUpdate={() => {
                  if (userProfile && token) fetchData(userProfile.userId, token);
                }}
              />
            )}

            {activeTab === "privacy" && <PrivacySection />}
          </main>
        </div>

      <EditProfileModal
        isOpen={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
        onSubmit={handleProfileUpdate}
        profileForm={profileForm}
        setProfileForm={setProfileForm}
        profileError={profileError}
      />

      <EditBabyInfoModal
        isOpen={editBabyInfoOpen}
        onClose={() => setEditBabyInfoOpen(false)}
        token={token}
        userProfile={userProfile}
        onRefreshProfile={() => {
          if (userProfile && token) {
            fetchData(userProfile.userId, token);
          }
        }}
      />

      <ChangePasswordModal
        isOpen={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
        onSubmit={handlePasswordChange}
        passwordForm={passwordForm}
        setPasswordForm={setPasswordForm}
        passwordError={passwordError}
        hasPassword={hasPassword}
      />

      <ProfileAddressModal
        isOpen={addressModalOpen}
        onClose={() => setAddressModalOpen(false)}
        onSubmit={handleAddressSubmit}
        isEditing={!!editingAddress}
        addressForm={addressForm}
        setAddressForm={setAddressForm}
        addressError={addressError}
        provinces={provinces}
        setProvinces={setProvinces}
        districts={districts}
        wards={wards}
        handleProvinceChange={handleProvinceChange}
        handleDistrictChange={handleDistrictChange}
        handleWardChange={handleWardChange}
        setDistricts={setDistricts}
        setWards={setWards}
      />

      {/* Confirm Delete Address Modal (Thay thế cho Modal mặc định của trình duyệt) */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div
            className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 duration-200 shrink-0"
            style={{ width: '384px', maxWidth: 'calc(100vw - 32px)' }}
          >
            <div className="flex items-center gap-2 text-rose-600 font-bold">
              <span className="material-symbols-outlined text-rose-500 shrink-0">delete</span>
              <h3 className="text-base md:text-lg text-slate-800 font-bold">Xác nhận xóa địa chỉ</h3>
            </div>
            <p className="text-xs md:text-sm text-slate-500 font-semibold leading-relaxed">
              Bạn có chắc chắn muốn xóa địa chỉ này? Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setAddressToDelete(null);
                }}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-50 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteAddress}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs transition-colors flex items-center gap-1 shadow-sm"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
