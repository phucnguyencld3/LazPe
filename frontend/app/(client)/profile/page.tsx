"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader } from "lucide-react";
import { toast } from "@/lib/toast";
import {
  getUserProfile,
  updateUserProfile,
  changePassword,
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

import { ProfileHeader } from "@/components/client/profile/ProfileHeader";
import { PersonalInfo } from "@/components/client/profile/PersonalInfo";
import { AddressList } from "@/components/client/profile/AddressList";
import { SecurityAndSettings } from "@/components/client/profile/SecurityAndSettings";
import { EditProfileModal } from "@/components/client/profile/modals/EditProfileModal";
import { ChangePasswordModal } from "@/components/client/profile/modals/ChangePasswordModal";
import { ProfileAddressModal } from "@/components/client/profile/modals/ProfileAddressModal";

export default function ProfilePage() {
  const router = useRouter();

  // States
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);

  // Modals States
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressItem | null>(null);

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

    fetchData(userId, savedToken);
  }, []);

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
      }

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
      const result = await changePassword(userProfile.userId, token, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      if (result.success) {
        toast.success("Đổi mật khẩu thành công!");
        setChangePasswordOpen(false);
        setPasswordForm({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
      } else {
        setPasswordError(result.message || "Đổi mật khẩu thất bại");
      }
    } catch (err) {
      console.error(err);
      setPasswordError("Lỗi kết nối đến server");
    }
  };

  const handleNotificationToggle = (key: keyof typeof notificationSettings) => {
    const updated = { ...notificationSettings, [key]: !notificationSettings[key] };
    setNotificationSettings(updated);
    localStorage.setItem("notification_settings", JSON.stringify(updated));
    toast.success("Đã cập nhật cài đặt thông báo!");
  };

  const handleAvatarUpdated = (newAvatarUrl: string) => {
    if (userProfile) {
      setUserProfile({ ...userProfile, avatar: newAvatarUrl });
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

    if (!addressForm.provinceCode || !addressForm.districtCode || !addressForm.wardCode) {
      setAddressError("Vui lòng chọn đầy đủ Tỉnh/Thành, Quận/Huyện và Phường/Xã");
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

  const handleDeleteAddressClick = async (addressId: number) => {
    if (!token || !userProfile) return;
    if (window.confirm("Bạn có chắc chắn muốn xóa địa chỉ này?")) {
      const result = await deleteAddress(addressId, token);
      if (result.success) {
        toast.success("Xóa địa chỉ thành công");
        const addressList = await getUserAddresses(userProfile.userId, token);
        if (addressList) setAddresses(addressList);
      } else {
        toast.error(result.message || "Không thể xóa địa chỉ");
      }
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
    <div className="min-h-screen bg-surface py-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ProfileHeader 
          userProfile={userProfile} 
          token={token} 
          onAvatarUpdated={handleAvatarUpdated} 
        />

        <div className="mt-lg grid grid-cols-1 lg:grid-cols-3 gap-lg">
          <div className="lg:col-span-2 space-y-lg">
            <PersonalInfo 
              userProfile={userProfile} 
              onEditClick={() => setEditProfileOpen(true)} 
            />
            <AddressList 
              addresses={addresses} 
              onAddClick={openNewAddressModal} 
              onEditClick={handleOpenEditAddressForm} 
              onDeleteClick={handleDeleteAddressClick} 
              onSetDefaultClick={handleSetDefaultAddressClick} 
            />
          </div>

          <SecurityAndSettings 
            onChangePasswordClick={() => setChangePasswordOpen(true)} 
            notificationSettings={notificationSettings} 
            onNotificationToggle={handleNotificationToggle} 
            onSupportChatClick={() => toast.info("Tính năng hỗ trợ đang được phát triển!")} 
          />
        </div>
      </div>

      <EditProfileModal 
        isOpen={editProfileOpen} 
        onClose={() => setEditProfileOpen(false)} 
        onSubmit={handleProfileUpdate} 
        profileForm={profileForm} 
        setProfileForm={setProfileForm} 
        profileError={profileError} 
      />

      <ChangePasswordModal 
        isOpen={changePasswordOpen} 
        onClose={() => setChangePasswordOpen(false)} 
        onSubmit={handlePasswordChange} 
        passwordForm={passwordForm} 
        setPasswordForm={setPasswordForm} 
        passwordError={passwordError} 
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
    </div>
  );
}
