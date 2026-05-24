"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader, User, Trash2, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import {
  getUserProfile,
  updateUserProfile,
  changePassword,
  uploadAvatar,
  getUserAddresses,
  getProvinces,
  getDistricts,
  getWards,
  createAddress,
  updateAddress,
  setDefaultAddress,
  deleteAddress,
  UserProfile,
  AddressItem,
  normalizeName
} from "@/lib/api";

interface Province {
  code: string;
  name: string;
}

interface District {
  code: string;
  name: string;
}

interface Ward {
  code: string;
  name: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  // Modals / Forms States
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressItem | null>(null);

  // Profile Edit fields
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    dateOfBirth: "",
  });

  // Change Password fields
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  // Address form fields
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
  });

  // Notifications State (Mocked in localStorage for persistence)
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    orderUpdates: true,
    promotions: false,
  });

  // Status Alerts
  const [addressError, setAddressError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Auto clear alerts
  const showAlert = (type: "success" | "error", text: string) => {
    if (type === "success") {
      toast.success(text);
    } else {
      toast.error(text);
    }
  };

  // Check auth and load initial data
  useEffect(() => {
    const savedToken = localStorage.getItem("token") || sessionStorage.getItem("token");
    const savedUserJson = localStorage.getItem("user") || sessionStorage.getItem("user");

    if (!savedToken || !savedUserJson) {
      router.push("/login");
      return;
    }

    setToken(savedToken);
    
    // Load local notification settings if any
    const savedNotifs = localStorage.getItem("notification_settings");
    if (savedNotifs) {
      try {
        setNotificationSettings(JSON.parse(savedNotifs));
      } catch (e) {
        console.error(e);
      }
    }

    const parsedUser = JSON.parse(savedUserJson);
    const userId = parsedUser.id || parsedUser.userId;

    if (!userId) {
      router.push("/login");
      return;
    }

    // Fetch details
    fetchData(userId, savedToken);
  }, []);

  const fetchData = async (userId: string, authToken: string) => {
    setLoading(true);
    try {
      // 1. Fetch user profile via api helper
      const profileData = await getUserProfile(userId, authToken);
      if (profileData) {
        setUserProfile(profileData);
        setProfileForm({
          fullName: profileData.fullName,
          email: profileData.email,
          phoneNumber: profileData.phoneNumber || "",
          dateOfBirth: profileData.dateOfBirth ? profileData.dateOfBirth.split("T")[0] : "",
        });
      } else {
        console.error("Failed to load user profile");
      }

      // 2. Fetch shipping addresses via api helper
      const addressList = await getUserAddresses(userId, authToken);
      if (addressList) {
        setAddresses(addressList);
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
        phoneNumber: profileForm.phoneNumber,
        dateOfBirth: profileForm.dateOfBirth ? new Date(profileForm.dateOfBirth).toISOString() : null,
        avatar: userProfile.avatar, // keep existing avatar URL
      });

      if (result.success) {
        showAlert("success", "Cập nhật thông tin cá nhân thành công!");
        
        // Refresh local details
        const updatedProfile = {
          ...userProfile,
          fullName: profileForm.fullName,
          email: profileForm.email,
          phoneNumber: profileForm.phoneNumber,
          dateOfBirth: profileForm.dateOfBirth ? new Date(profileForm.dateOfBirth).toISOString() : undefined,
        };
        setUserProfile(updatedProfile);

        // Update the stored user info for Header/Layout sync
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
      } else {
        setProfileError(result.message || "Không thể cập nhật thông tin cá nhân");
      }
    } catch (err) {
      console.error(err);
      setProfileError("Lỗi kết nối đến server");
    }
  };

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
      showAlert("error", "Chỉ chấp nhận file ảnh (JPG, PNG, GIF)");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showAlert("error", "File ảnh không được vượt quá 2MB");
      return;
    }

    setUploadingAvatar(true);

    try {
      const result = await uploadAvatar(userProfile.userId, token, file);
      if (result.success && result.data) {
        showAlert("success", "Cập nhật ảnh đại diện thành công!");
        const newAvatarUrl = result.data; // URL returned by controller
        setUserProfile((prev) => prev ? { ...prev, avatar: newAvatarUrl } : null);

        // Update stored session user object
        const savedUserJson = localStorage.getItem("user") || sessionStorage.getItem("user");
        if (savedUserJson) {
          const userObj = JSON.parse(savedUserJson);
          userObj.avatar = newAvatarUrl;
          if (localStorage.getItem("user")) {
            localStorage.setItem("user", JSON.stringify(userObj));
          } else {
            sessionStorage.setItem("user", JSON.stringify(userObj));
          }
        }
      } else {
        showAlert("error", result.message || "Không thể tải lên ảnh đại diện");
      }
    } catch (err) {
      console.error(err);
      showAlert("error", "Có lỗi xảy ra khi upload avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile || !token) return;

    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      setPasswordError("Mật khẩu mới và xác nhận mật khẩu không khớp!");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError("Mật khẩu mới phải chứa ít nhất 6 ký tự!");
      return;
    }

    setPasswordError(null);
    try {
      const result = await changePassword(userProfile.userId, token, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmNewPassword: passwordForm.confirmNewPassword,
      });

      if (result.success) {
        showAlert("success", "Đổi mật khẩu thành công!");
        setPasswordForm({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
        setChangePasswordOpen(false);
      } else {
        setPasswordError(result.message || "Mật khẩu hiện tại không chính xác hoặc có lỗi xảy ra");
      }
    } catch (err) {
      console.error(err);
      setPasswordError("Lỗi kết nối đến server");
    }
  };

  // Open Address Modal for Create or Update
  const openAddressModal = async (address: AddressItem | null = null) => {
    setEditingAddress(address);
    setAddressError(null);

    // Initial provinces load
    let provList: any[] = [];
    try {
      const list = await getProvinces();
      if (list) {
        provList = list;
        setProvinces(list);
      }
    } catch (err) {
      console.error("Error loading provinces:", err);
    }

    if (address) {
      // Setup edit state with self-healing matching
      // Find province code by code or name
      let matchedProvince = null;
      if (address.provinceCode) {
        matchedProvince = provList?.find((p) => String(p.code) === String(address.provinceCode));
      }
      if (!matchedProvince && address.province) {
        matchedProvince = provList?.find((p) => normalizeName(p.name) === normalizeName(address.province));
      }
      const provCode = matchedProvince?.code || "";
      const provName = matchedProvince?.name || address.province;

      let distList: any[] = [];
      let matchedDistrict: any = null;
      if (provCode) {
        try {
          const distData = await getDistricts(provCode);
          distList = distData?.districts || [];
          setDistricts(distList);
          
          if (address.districtCode) {
            matchedDistrict = distList.find((d) => String(d.code) === String(address.districtCode));
          }
          if (!matchedDistrict && address.district) {
            matchedDistrict = distList.find((d) => normalizeName(d.name) === normalizeName(address.district));
          }
        } catch (err) {
          console.error("Error loading districts:", err);
        }
      }
      const distCode = matchedDistrict?.code || "";
      const distName = matchedDistrict?.name || address.district;

      let wardList: any[] = [];
      let matchedWard: any = null;
      if (distCode) {
        try {
          const wardData = await getWards(distCode);
          wardList = wardData?.wards || [];
          setWards(wardList);
          
          if (address.wardCode) {
            matchedWard = wardList.find((w: any) => String(w.code) === String(address.wardCode));
          }
          if (!matchedWard && address.ward) {
            matchedWard = wardList.find((w: any) => normalizeName(w.name) === normalizeName(address.ward));
          }
        } catch (err) {
          console.error("Error loading wards:", err);
        }
      }
      const wardCode = matchedWard?.code || "";
      const wardName = matchedWard?.name || address.ward;

      setAddressForm({
        recipientName: address.recipientName,
        phoneNumber: address.phoneNumber,
        provinceCode: provCode,
        provinceName: provName,
        districtCode: distCode,
        districtName: distName,
        wardCode: wardCode,
        wardName: wardName,
        detailAddress: address.detailAddress,
        isDefault: address.isDefault,
      });
      setDistricts(distList);
      setWards(wardList);
    } else {
      // Clear state for create
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
      });
      setDistricts([]);
      setWards([]);
    }
    setAddressModalOpen(true);
  };

  const handleProvinceChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const name = e.target.options[e.target.selectedIndex].text;
    
    setAddressForm((prev) => ({
      ...prev,
      provinceCode: code,
      provinceName: name,
      districtCode: "",
      districtName: "",
      wardCode: "",
      wardName: "",
    }));
    setDistricts([]);
    setWards([]);

    if (!code) return;

    try {
      const data = await getDistricts(code);
      if (data) {
        // API returns { districts: [], name, code }
        setDistricts(data.districts || []);
      }
    } catch (err) {
      console.error("Error loading districts:", err);
    }
  };

  const handleDistrictChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const name = e.target.options[e.target.selectedIndex].text;

    setAddressForm((prev) => ({
      ...prev,
      districtCode: code,
      districtName: name,
      wardCode: "",
      wardName: "",
    }));
    setWards([]);

    if (!code) return;

    try {
      const data = await getWards(code);
      if (data) {
        // API returns { wards: [], name, code }
        setWards(data.wards || []);
      }
    } catch (err) {
      console.error("Error loading wards:", err);
    }
  };

  const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const name = e.target.options[e.target.selectedIndex].text;

    setAddressForm((prev) => ({
      ...prev,
      wardCode: code,
      wardName: name,
    }));
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile || !token) return;

    // Check if dropdown codes/names are selected
    if (!addressForm.provinceCode || !addressForm.districtCode || !addressForm.wardCode) {
      setAddressError("Vui lòng chọn đầy đủ Tỉnh/Thành, Quận/Huyện và Phường/Xã");
      return;
    }

    setAddressError(null);

    const payload = {
      userId: userProfile.userId,
      recipientName: addressForm.recipientName,
      phoneNumber: addressForm.phoneNumber,
      provinceCode: addressForm.provinceCode || "0",
      provinceName: addressForm.provinceName,
      districtCode: addressForm.districtCode || "0",
      districtName: addressForm.districtName,
      wardCode: addressForm.wardCode || "0",
      wardName: addressForm.wardName,
      detailAddress: addressForm.detailAddress,
      isDefault: addressForm.isDefault,
    };

    try {
      let result;
      if (editingAddress) {
        result = await updateAddress(editingAddress.addressID, token, payload);
      } else {
        result = await createAddress(token, payload);
      }

      if (result.success) {
        showAlert("success", editingAddress ? "Cập nhật địa chỉ thành công!" : "Thêm địa chỉ mới thành công!");
        setAddressModalOpen(false);
        // Refresh address list
        fetchData(userProfile.userId, token);
      } else {
        setAddressError(result.message || "Có lỗi xảy ra khi xử lý thông tin địa chỉ");
      }
    } catch (err) {
      console.error(err);
      setAddressError("Lỗi kết nối đến server");
    }
  };

  const handleSetDefaultAddress = async (addressId: number) => {
    if (!userProfile || !token) return;

    try {
      const result = await setDefaultAddress(addressId, token);
      if (result.success) {
        showAlert("success", "Đặt địa chỉ mặc định thành công!");
        fetchData(userProfile.userId, token);
      } else {
        showAlert("error", result.message || "Không thể thiết lập địa chỉ mặc định");
      }
    } catch (err) {
      console.error(err);
      showAlert("error", "Lỗi kết nối");
    }
  };

  const handleDeleteAddress = async (addressId: number) => {
    if (!userProfile || !token) return;
    if (!confirm("Bạn có chắc chắn muốn xóa địa chỉ này?")) return;

    try {
      const result = await deleteAddress(addressId, token);
      if (result.success) {
        showAlert("success", "Xóa địa chỉ thành công!");
        fetchData(userProfile.userId, token);
      } else {
        showAlert("error", result.message || "Không thể xóa địa chỉ");
      }
    } catch (err) {
      console.error(err);
      showAlert("error", "Lỗi kết nối");
    }
  };

  // Toggle notification switches locally
  const handleNotificationToggle = (key: keyof typeof notificationSettings) => {
    const updated = {
      ...notificationSettings,
      [key]: !notificationSettings[key],
    };
    setNotificationSettings(updated);
    localStorage.setItem("notification_settings", JSON.stringify(updated));
    showAlert("success", "Cài đặt thông báo đã được lưu tạm thời. Đang chờ kết nối API cài đặt.");
  };

  // Support Chat Click
  const handleSupportChat = () => {
    toast.info("Hệ thống chăm sóc khách hàng LazPe Care (Chat) sẽ sớm khả dụng 24/7 để phục vụ bạn!");
  };

  // Formatting utility for date
  const formatDateVietnamese = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const months = [
      "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
      "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
    ];
    return `${date.getDate()} ${months[date.getMonth()]}, ${date.getFullYear()}`;
  };

  // General date display format
  const formatDob = (dateStr?: string) => {
    if (!dateStr) return "Chưa cập nhật";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`;
  };

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[calc(100vh-200px)] py-20 bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader className="animate-spin text-primary" size={40} />
          <p className="text-on-surface-variant font-label-md">Đang tải thông tin tài khoản...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[calc(100vh-200px)] py-20 bg-background text-center">
        <div>
          <HelpCircle size={48} className="mx-auto text-primary mb-4" />
          <h2 className="text-xl font-bold text-primary mb-2">Không tìm thấy thông tin tài khoản</h2>
          <p className="text-on-surface-variant mb-6">Vui lòng thử đăng nhập lại.</p>
          <button onClick={() => router.push("/login")} className="bg-primary text-white px-6 py-2.5 rounded-full font-bold">
            Đăng nhập
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background text-on-surface font-body-md min-h-screen pb-24 relative">
      {/* Main Page Grid */}
      <div className="max-w-[1440px] mx-auto px-margin-mobile md:px-margin-desktop py-lg space-y-lg">
        
        {/* Header Section: Identity */}
        <section className="flex flex-col md:flex-row items-center gap-lg bg-white rounded-xl p-lg shadow-[0_20px_40px_rgba(135,78,88,0.06)]">
          <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary-container shadow-lg relative bg-slate-100 flex items-center justify-center">
              {uploadingAvatar ? (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                  <Loader className="animate-spin text-white" size={24} />
                </div>
              ) : null}
              {userProfile.avatar ? (
                <img
                  className="w-full h-full object-cover"
                  alt="Ảnh đại diện người dùng"
                  src={userProfile.avatar}
                />
              ) : (
                <User size={48} className="text-slate-400" />
              )}
            </div>
            <button className="absolute bottom-0 right-0 bg-primary text-white p-2.5 rounded-full shadow-md active:scale-90 transition-transform flex items-center justify-center">
              <span className="material-symbols-outlined text-sm font-bold">edit</span>
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
            <h1 className="font-headline-lg text-3xl font-bold text-primary tracking-tight">{userProfile.fullName}</h1>
            <p className="font-body-lg text-on-surface-variant">{userProfile.email}</p>
            
            {/* Badges / Trove Points (Mocked client side features) */}
            <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-sm pt-2">
              <span className="px-4 py-1.5 bg-secondary-container text-on-secondary-container rounded-full text-label-sm font-bold shadow-sm">
                Thành viên Gold
              </span>
              <span className="px-4 py-1.5 bg-primary-container text-on-primary-container rounded-full text-label-sm font-bold shadow-sm">
                124 Trove Points
              </span>
            </div>
          </div>
        </section>

        {/* Content Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg items-start">
          
          {/* Left/Middle Column (Personal Info & Addresses) */}
          <div className="lg:col-span-2 space-y-lg">
            
            {/* Section 1: Personal Info */}
            <section className="bg-white rounded-xl p-lg shadow-[0_20px_40px_rgba(135,78,88,0.06)] border border-slate-100">
              <div className="flex justify-between items-center mb-md pb-3 border-b border-slate-100">
                <h2 className="font-headline-md text-xl font-bold text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">person</span> Thông tin cá nhân
                </h2>
                <button
                  onClick={() => setEditProfileOpen(true)}
                  className="text-primary font-bold flex items-center gap-1 hover:underline active:scale-95 transition-all text-sm py-1.5 px-3 rounded-full hover:bg-primary-container/20"
                >
                  <span className="material-symbols-outlined text-sm font-bold">edit</span> Chỉnh sửa
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-md pt-2">
                <div className="space-y-xs">
                  <label className="text-label-sm text-on-surface-variant font-semibold px-1 text-xs uppercase tracking-wider block">Họ và Tên</label>
                  <div className="bg-surface-container-low p-4 rounded-xl font-semibold text-slate-800 border border-slate-100/50">{userProfile.fullName}</div>
                </div>
                <div className="space-y-xs">
                  <label className="text-label-sm text-on-surface-variant font-semibold px-1 text-xs uppercase tracking-wider block">Số điện thoại</label>
                  <div className="bg-surface-container-low p-4 rounded-xl font-semibold text-slate-800 border border-slate-100/50">
                    {userProfile.phoneNumber || "Chưa cập nhật"}
                  </div>
                </div>
                <div className="space-y-xs">
                  <label className="text-label-sm text-on-surface-variant font-semibold px-1 text-xs uppercase tracking-wider block">Email đăng nhập</label>
                  <div className="bg-surface-container-low p-4 rounded-xl font-semibold text-slate-800 border border-slate-100/50">{userProfile.email}</div>
                </div>
                <div className="space-y-xs">
                  <label className="text-label-sm text-on-surface-variant font-semibold px-1 text-xs uppercase tracking-wider block">Ngày sinh</label>
                  <div className="bg-surface-container-low p-4 rounded-xl font-semibold text-slate-800 border border-slate-100/50">
                    {formatDob(userProfile.dateOfBirth)}
                  </div>
                </div>
                <div className="space-y-xs md:col-span-2">
                  <label className="text-label-sm text-on-surface-variant font-semibold px-1 text-xs uppercase tracking-wider block">Ngày tham gia hệ thống</label>
                  <div className="bg-surface-container-low p-4 rounded-xl font-semibold text-slate-800 border border-slate-100/50 flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary font-bold text-lg">verified_user</span>
                    Thành viên LazPe từ {formatDateVietnamese(userProfile.registerDate)}
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2: Shipping Addresses */}
            <section className="bg-white rounded-xl p-lg shadow-[0_20px_40px_rgba(135,78,88,0.06)] border border-slate-100">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-md pb-3 border-b border-slate-100">
                <h2 className="font-headline-md text-xl font-bold text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">location_on</span> Địa chỉ giao hàng
                </h2>
                <button
                  onClick={() => openAddressModal(null)}
                  className="bg-primary hover:bg-primary/95 text-white px-5 py-2.5 rounded-full font-bold flex items-center gap-2 bouncy-hover active:scale-95 shadow-md shadow-primary/10 text-sm transition-transform"
                >
                  <span className="material-symbols-outlined text-sm font-bold">add</span> Thêm địa chỉ mới
                </button>
              </div>

              <div className="space-y-md pt-2">
                {addresses.length > 0 ? (
                  addresses.map((address) => (
                    <div
                      key={address.addressID}
                      className={`border-2 rounded-2xl p-5 flex flex-col md:flex-row justify-between gap-md relative overflow-hidden transition-all duration-200 ${
                        address.isDefault
                          ? "border-primary-container bg-primary-container/5"
                          : "border-slate-200 bg-white hover:border-primary/50"
                      }`}
                    >
                      {address.isDefault && (
                        <div className="absolute top-0 right-0 bg-primary text-white px-4 py-1.5 rounded-bl-xl text-label-sm font-bold text-xs uppercase tracking-wide">
                          Mặc định
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-primary text-lg">{address.recipientName}</span>
                          <span className="text-xs text-on-surface-variant font-semibold bg-slate-100 px-2 py-0.5 rounded">
                            {address.phoneNumber}
                          </span>
                        </div>
                        <p className="text-on-surface-variant text-sm font-medium">
                          {address.detailAddress}
                        </p>
                        <p className="text-on-surface-variant text-sm font-medium">
                          {address.ward}, {address.district}, {address.province}
                        </p>
                      </div>

                      <div className="flex items-end gap-3 mt-4 md:mt-0 flex-wrap">
                        {!address.isDefault && (
                          <button
                            onClick={() => handleSetDefaultAddress(address.addressID)}
                            className="text-secondary font-bold text-xs flex items-center gap-1 hover:underline transition-all py-1.5 px-3 rounded-full hover:bg-secondary-container/30"
                          >
                            Đặt mặc định
                          </button>
                        )}
                        <button
                          onClick={() => openAddressModal(address)}
                          className="text-primary font-bold text-xs flex items-center gap-1 hover:underline transition-all py-1.5 px-3 rounded-full hover:bg-primary-container/30"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDeleteAddress(address.addressID)}
                          className="text-error font-bold text-xs flex items-center gap-1 hover:underline transition-all py-1.5 px-3 rounded-full hover:bg-red-50"
                        >
                          <Trash2 size={12} /> Xóa
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 bg-surface-container-low rounded-2xl border border-dashed border-slate-200">
                    <p className="text-on-surface-variant font-medium">Bạn chưa lưu địa chỉ nhận hàng nào.</p>
                    <p className="text-xs text-slate-400 mt-1">Hãy thêm địa chỉ mới để đặt hàng thuận tiện hơn.</p>
                  </div>
                )}
              </div>
            </section>

          </div>

          {/* Right Column (Security, Support, Settings) */}
          <aside className="space-y-lg">
            
            {/* Security Section */}
            <section className="bg-white rounded-xl p-lg shadow-[0_20px_40px_rgba(135,78,88,0.06)] border border-slate-100">
              <h2 className="font-headline-md text-xl font-bold text-primary flex items-center gap-2 mb-md pb-2 border-b border-slate-100">
                <span className="material-symbols-outlined text-primary text-xl">security</span> Bảo mật & Cài đặt
              </h2>
              
              <button
                onClick={() => setChangePasswordOpen(true)}
                className="w-full flex items-center justify-between p-4 bg-surface-container-low rounded-xl hover:bg-surface-container-high transition-colors group border border-slate-100"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary font-bold">lock</span>
                  <span className="font-bold text-sm text-slate-800">Đổi Mật Khẩu</span>
                </div>
                <span className="material-symbols-outlined text-slate-400 group-hover:translate-x-1 transition-transform">
                  chevron_right
                </span>
              </button>

              {/* Notification Toggles */}
              <div className="mt-lg pt-lg border-t border-slate-100 space-y-4">
                <h3 className="font-bold text-primary uppercase tracking-wider text-[11px] mb-2">Cài đặt nhận thông báo</h3>
                
                {/* Email Toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">Thông báo qua Email</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.emailNotifications}
                      onChange={() => handleNotificationToggle("emailNotifications")}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                {/* Orders Update Toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">Cập nhật đơn hàng</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.orderUpdates}
                      onChange={() => handleNotificationToggle("orderUpdates")}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                {/* Promotions Toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">Ưu đãi & Khuyến mãi</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.promotions}
                      onChange={() => handleNotificationToggle("promotions")}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
            </section>

            {/* Need Help Card */}
            <section className="bg-white rounded-xl p-lg shadow-[0_20px_40px_rgba(135,78,88,0.06)] border border-slate-100">
              <h3 className="font-headline-md text-xl font-bold text-secondary mb-2">Bạn cần hỗ trợ?</h3>
              <p className="text-sm text-on-surface-variant font-medium mb-5">
                Đội ngũ LazPe Care luôn sẵn sàng hỗ trợ giải đáp mọi thắc mắc của bạn về đơn hàng và tài khoản 24/7.
              </p>
              <button
                onClick={handleSupportChat}
                className="w-full bg-secondary hover:bg-secondary/95 text-white py-3 rounded-full font-bold bouncy-hover shadow-md shadow-secondary/10 transition-transform active:scale-95 text-sm"
              >
                Nhắn tin với hỗ trợ viên
              </button>
            </section>

          </aside>

        </div>

      </div>

      {/* MODAL 1: Edit Profile */}
      {editProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-[500px] flex flex-col bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-primary text-white p-6">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-white">edit</span> Chỉnh sửa thông tin cá nhân
              </h3>
            </div>
            <form onSubmit={handleProfileUpdate} className="p-6 space-y-4">
              {profileError && (
                <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
                  {profileError}
                </div>
              )}
              
              <div className="space-y-1">
                <label className="font-bold text-sm text-slate-700 ml-1">Họ và Tên</label>
                <input
                  type="text"
                  required
                  value={profileForm.fullName}
                  onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border-slate-200 text-slate-800 focus:ring-primary focus:border-primary border focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-sm text-slate-700 ml-1">Số điện thoại</label>
                <input
                  type="tel"
                  value={profileForm.phoneNumber}
                  onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border-slate-200 text-slate-800 focus:ring-primary focus:border-primary border focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-sm text-slate-700 ml-1">Email đăng nhập</label>
                <input
                  type="email"
                  disabled
                  value={profileForm.email}
                  className="w-full px-4 py-3 rounded-xl bg-slate-100 border-slate-200 text-slate-400 border focus:outline-none cursor-not-allowed"
                />
                <span className="text-[11px] text-slate-400 italic ml-1">* Không thể thay đổi email đăng nhập hệ thống.</span>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-sm text-slate-700 ml-1">Ngày sinh</label>
                <input
                  type="date"
                  disabled
                  value={profileForm.dateOfBirth}
                  className="w-full px-4 py-3 rounded-xl bg-slate-100 border-slate-200 text-slate-400 border focus:outline-none cursor-not-allowed"
                />
                <span className="text-[11px] text-slate-400 italic ml-1">* Không thể thay đổi ngày sinh đã đăng ký.</span>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditProfileOpen(false)}
                  className="flex-1 py-3 border border-slate-200 rounded-full font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-primary text-white rounded-full font-bold hover:bg-primary/95 transition-colors shadow-md shadow-primary/10"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Change Password */}
      {changePasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-[500px] flex flex-col bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-primary text-white p-6">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-white">lock</span> Đổi mật khẩu tài khoản
              </h3>
            </div>
            <form onSubmit={handlePasswordChange} className="p-6 space-y-4">
              {passwordError && (
                <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
                  {passwordError}
                </div>
              )}
              
              <div className="space-y-1">
                <label className="font-bold text-sm text-slate-700 ml-1">Mật khẩu hiện tại</label>
                <input
                  type="password"
                  required
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  placeholder="Nhập mật khẩu hiện tại"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border-slate-200 text-slate-800 focus:ring-primary focus:border-primary border focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-sm text-slate-700 ml-1">Mật khẩu mới</label>
                <input
                  type="password"
                  required
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder="Tối thiểu 6 ký tự"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border-slate-200 text-slate-800 focus:ring-primary focus:border-primary border focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-sm text-slate-700 ml-1">Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  required
                  value={passwordForm.confirmNewPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmNewPassword: e.target.value })}
                  placeholder="Nhập lại mật khẩu mới"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border-slate-200 text-slate-800 focus:ring-primary focus:border-primary border focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setChangePasswordOpen(false);
                    setPasswordForm({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
                  }}
                  className="flex-1 py-3 border border-slate-200 rounded-full font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-primary text-white rounded-full font-bold hover:bg-primary/95 transition-colors shadow-md shadow-primary/10"
                >
                  Đổi mật khẩu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Add / Edit Shipping Address */}
      {addressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-[500px] flex flex-col bg-white rounded-2xl shadow-xl my-8 overflow-hidden">
            <div className="bg-primary text-white p-6">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-white">location_on</span>
                {editingAddress ? "Cập nhật địa chỉ nhận hàng" : "Thêm địa chỉ giao nhận mới"}
              </h3>
            </div>
            <form onSubmit={handleAddressSubmit} className="p-6 space-y-4">
              {addressError && (
                <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
                  {addressError}
                </div>
              )}

              <div className="space-y-1">
                <label className="font-bold text-sm text-slate-700 ml-1">Tên người nhận</label>
                <input
                  type="text"
                  required
                  value={addressForm.recipientName}
                  onChange={(e) => setAddressForm({ ...addressForm, recipientName: e.target.value })}
                  placeholder="Họ tên người nhận hàng"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border-slate-200 text-slate-800 focus:ring-primary focus:border-primary border focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-sm text-slate-700 ml-1">Số điện thoại nhận hàng</label>
                <input
                  type="tel"
                  required
                  value={addressForm.phoneNumber}
                  onChange={(e) => setAddressForm({ ...addressForm, phoneNumber: e.target.value })}
                  placeholder="Số điện thoại nhận cuộc gọi giao hàng"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border-slate-200 text-slate-800 focus:ring-primary focus:border-primary border focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-sm text-slate-700 ml-1">Tỉnh / Thành phố</label>
                <select
                  required
                  value={addressForm.provinceCode}
                  onChange={handleProvinceChange}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border-slate-200 text-slate-800 focus:ring-primary focus:border-primary border focus:outline-none"
                >
                  <option value="">-- Chọn Tỉnh/Thành --</option>
                  {provinces.map((prov) => (
                    <option key={prov.code} value={prov.code}>{prov.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-sm text-slate-700 ml-1">Quận / Huyện</label>
                <select
                  required
                  disabled={!addressForm.provinceCode}
                  value={addressForm.districtCode}
                  onChange={handleDistrictChange}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border-slate-200 text-slate-800 focus:ring-primary focus:border-primary border focus:outline-none disabled:opacity-60"
                >
                  <option value="">-- Chọn Quận/Huyện --</option>
                  {districts.map((dist) => (
                    <option key={dist.code} value={dist.code}>{dist.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-sm text-slate-700 ml-1">Phường / Xã</label>
                <select
                  required
                  disabled={!addressForm.districtCode}
                  value={addressForm.wardCode}
                  onChange={handleWardChange}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border-slate-200 text-slate-800 focus:ring-primary focus:border-primary border focus:outline-none disabled:opacity-60"
                >
                  <option value="">-- Chọn Phường/Xã --</option>
                  {wards.map((w) => (
                    <option key={w.code} value={w.code}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-sm text-slate-700 ml-1">Địa chỉ chi tiết</label>
                <input
                  type="text"
                  required
                  value={addressForm.detailAddress}
                  onChange={(e) => setAddressForm({ ...addressForm, detailAddress: e.target.value })}
                  placeholder="Số nhà, ngõ ngách, tên đường..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border-slate-200 text-slate-800 focus:ring-primary focus:border-primary border focus:outline-none"
                />
              </div>

              <div className="flex items-center pt-2 ml-1">
                <input
                  id="defaultAddress"
                  type="checkbox"
                  checked={addressForm.isDefault}
                  onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                />
                <label htmlFor="defaultAddress" className="ml-2 font-bold text-sm text-slate-700 cursor-pointer select-none">
                  Đặt làm địa chỉ nhận hàng mặc định
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddressModalOpen(false)}
                  className="flex-1 py-3 border border-slate-200 rounded-full font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-primary text-white rounded-full font-bold hover:bg-primary/95 transition-colors shadow-md shadow-primary/10"
                >
                  {editingAddress ? "Cập nhật" : "Lưu địa chỉ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
