import React, { useState, useEffect } from "react";
import { X, Check, Plus, Pencil, AlertTriangle, Loader } from "lucide-react";
import { toast } from "@/lib/toast";
import { 
  AddressItem, 
  getProvinces, 
  getDistricts, 
  getWards, 
  createAddress, 
  updateAddress 
} from "@/lib/api";

interface AddressModalProps {
  userId: string;
  token: string;
  addressModalOpen: boolean;
  setAddressModalOpen: (open: boolean) => void;
  addresses: AddressItem[];
  selectedAddress: AddressItem | null;
  setSelectedAddress: (addr: AddressItem) => void;
  refreshAddresses: () => Promise<void>;
  normalizeName: (name: string) => string;
}

export const AddressModal: React.FC<AddressModalProps> = ({
  userId,
  token,
  addressModalOpen,
  setAddressModalOpen,
  addresses,
  selectedAddress,
  setSelectedAddress,
  refreshAddresses,
  normalizeName,
}) => {
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressItem | null>(null);
  
  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);
  
  const [addressFormError, setAddressFormError] = useState<string | null>(null);
  const [loadingGeoData, setLoadingGeoData] = useState(false);

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

  // Handle Province Change
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
      setLoadingGeoData(true);
      const data = await getDistricts(code, addressForm.apiVersion);
      if (data) {
        const dists = data.districts || [];
        setDistricts(dists);
        if (dists.length === 1) {
          const singleDist = dists[0];
          setAddressForm((prev) => ({
            ...prev,
            districtCode: singleDist.code,
            districtName: singleDist.name,
          }));
          
          // Fetch wards immediately
          const wardData = await getWards(singleDist.code, addressForm.apiVersion);
          if (wardData) {
            setWards(wardData.wards || []);
          }
        }
      }
    } catch (err) {
      console.error("Error loading districts:", err);
    } finally {
      setLoadingGeoData(false);
    }
  };

  // Handle District Change
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
      setLoadingGeoData(true);
      const data = await getWards(code, addressForm.apiVersion);
      if (data) {
        setWards(data.wards || []);
      }
    } catch (err) {
      console.error("Error loading wards:", err);
    } finally {
      setLoadingGeoData(false);
    }
  };

  // Handle Ward Change
  const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const name = e.target.options[e.target.selectedIndex].text;

    setAddressForm((prev) => ({
      ...prev,
      wardCode: code,
      wardName: name,
    }));
  };

  // Open New Address Form
  const handleOpenNewAddressForm = async () => {
    setShowNewAddressForm(true);
    setAddressFormError(null);
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
      setLoadingGeoData(true);
      const provList = await getProvinces("v2");
      if (provList) {
        setProvinces(provList);
      }
    } catch (err) {
      console.error("Error loading provinces:", err);
    } finally {
      setLoadingGeoData(false);
    }
  };

  // Open Edit Address Form
  const handleOpenEditAddressForm = async (address: AddressItem) => {
    setEditingAddress(address);
    setAddressFormError(null);
    setShowNewAddressForm(true);
    setLoadingGeoData(true);

    try {
      const apiVer = address.apiVersion || "v1";
      // Load provinces
      const provList = await getProvinces(apiVer);
      if (provList) {
        setProvinces(provList);
      }

      // Find province code by code or name
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
        detailAddress: address.detailAddress,
        isDefault: address.isDefault,
        apiVersion: apiVer
      });
    } catch (err) {
      console.error("Error setting edit address form:", err);
      toast.error("Không thể tải thông tin khu vực địa lý!");
    } finally {
      setLoadingGeoData(false);
    }
  };

  // Submit form
  const handleSaveNewAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !userId) return;

    if (!addressForm.recipientName || !addressForm.phoneNumber || !addressForm.detailAddress) {
      setAddressFormError("Vui lòng điền đầy đủ các trường thông tin bắt buộc!");
      return;
    }
    if (!addressForm.provinceCode || !addressForm.districtCode || !addressForm.wardCode) {
      setAddressFormError("Vui lòng chọn Tỉnh/Thành, Quận/Huyện và Phường/Xã!");
      return;
    }

    setAddressFormError(null);
    const payload = {
      userId: userId,
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

    try {
      setLoadingGeoData(true);
      let result;
      if (editingAddress) {
        result = await updateAddress(editingAddress.addressID, token, payload);
      } else {
        result = await createAddress(token, payload);
      }

      if (result.success) {
        toast.success(editingAddress ? "Cập nhật địa chỉ thành công!" : "Thêm địa chỉ mới thành công!");
        setShowNewAddressForm(false);
        setEditingAddress(null);
        await refreshAddresses();
      } else {
        setAddressFormError(result.message || "Có lỗi xảy ra khi lưu thông tin địa chỉ");
      }
    } catch (err) {
      console.error(err);
      setAddressFormError("Lỗi kết nối đến server");
    } finally {
      setLoadingGeoData(false);
    }
  };

  if (!addressModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
      {/* Background overlay */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={() => {
          setAddressModalOpen(false);
          setShowNewAddressForm(false);
        }}
      />

      {/* Modal Box */}
      <div className="relative bg-white rounded-2xl shadow-xl border border-slate-100 w-[calc(100%-2rem)] sm:w-[500px] min-w-[300px] shrink-0 max-h-[85vh] flex flex-col overflow-hidden transform transition-all z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-150 flex items-center justify-between flex-shrink-0">
          <h3 className="text-lg font-bold text-slate-800" id="modal-title">
            {showNewAddressForm ? (editingAddress ? "Chỉnh sửa địa chỉ giao hàng" : "Thêm địa chỉ giao hàng mới") : "Địa chỉ giao hàng của tôi"}
          </h3>
          <button
            type="button"
            className="bg-white hover:bg-slate-100 rounded-lg p-1.5 text-slate-400 hover:text-slate-700 transition-colors border border-slate-200"
            onClick={() => {
              setAddressModalOpen(false);
              setShowNewAddressForm(false);
            }}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-grow">
          
          {/* Form Add New Address */}
          {showNewAddressForm ? (
            <form onSubmit={handleSaveNewAddress} className="space-y-4">
              {addressFormError && (
                <div className="p-3 rounded-lg bg-rose-50 text-xs font-semibold text-rose-600 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  <span>{addressFormError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {/* Name */}
                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">
                    Tên người nhận <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.recipientName}
                    onChange={(e) => setAddressForm({ ...addressForm, recipientName: e.target.value })}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                
                {/* Phone */}
                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">
                    Số điện thoại <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={addressForm.phoneNumber}
                    onChange={(e) => setAddressForm({ ...addressForm, phoneNumber: e.target.value })}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
                    placeholder="0987654321"
                  />
                </div>
              </div>

              {/* Version Toggle */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">
                  Nguồn dữ liệu địa chỉ <span className="text-slate-400 font-normal normal-case">(Tùy chọn)</span>
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="apiVersion"
                      value="v2"
                      checked={addressForm.apiVersion === "v2"}
                      onChange={async (e) => {
                        const newVer = e.target.value;
                        setAddressForm(prev => ({ ...prev, apiVersion: newVer, provinceCode: "", districtCode: "", wardCode: "" }));
                        setDistricts([]);
                        setWards([]);
                        const provList = await getProvinces(newVer);
                        if (provList) setProvinces(provList);
                      }}
                      className="text-rose-500 focus:ring-rose-500"
                    />
                    <span className="text-sm font-medium text-slate-700">Phiên bản mới (V2)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="apiVersion"
                      value="v1"
                      checked={addressForm.apiVersion === "v1"}
                      onChange={async (e) => {
                        const newVer = e.target.value;
                        setAddressForm(prev => ({ ...prev, apiVersion: newVer, provinceCode: "", districtCode: "", wardCode: "" }));
                        setDistricts([]);
                        setWards([]);
                        const provList = await getProvinces(newVer);
                        if (provList) setProvinces(provList);
                      }}
                      className="text-rose-500 focus:ring-rose-500"
                    />
                    <span className="text-sm font-medium text-slate-700">Phiên bản cũ (V1)</span>
                  </label>
                </div>
              </div>

              {/* Geolocation Selects */}
              <div className="space-y-3">
                {/* Province */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">
                    Tỉnh / Thành phố <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={addressForm.provinceCode}
                    onChange={handleProvinceChange}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-rose-500 focus:border-rose-500 bg-white outline-none"
                  >
                    <option value="">Chọn Tỉnh / Thành phố</option>
                    {provinces.map((p) => (
                      <option key={p.code} value={p.code}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* District */}
                {districts.length > 1 && (
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">
                      Quận / Huyện <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={addressForm.districtCode}
                      onChange={handleDistrictChange}
                      disabled={!addressForm.provinceCode}
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-rose-500 focus:border-rose-500 bg-white outline-none disabled:bg-slate-50 disabled:text-slate-400"
                    >
                      <option value="">Chọn Quận / Huyện</option>
                      {districts.map((d) => (
                        <option key={d.code} value={d.code}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Ward */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">
                    Phường / Xã <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={addressForm.wardCode}
                    onChange={handleWardChange}
                    disabled={!addressForm.districtCode}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-rose-500 focus:border-rose-500 bg-white outline-none disabled:bg-slate-50 disabled:text-slate-400"
                  >
                    <option value="">Chọn Phường / Xã</option>
                    {wards.map((w) => (
                      <option key={w.code} value={w.code}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Detail Address */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">
                  Địa chỉ chi tiết (Số nhà, tên đường...) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={addressForm.detailAddress}
                  onChange={(e) => setAddressForm({ ...addressForm, detailAddress: e.target.value })}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
                  placeholder="Số 12, Ngõ 34 Đường ABC"
                />
              </div>

              {/* Is Default Checkbox */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={addressForm.isDefault}
                  onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                  className="rounded text-rose-500 focus:ring-rose-500"
                />
                <label htmlFor="isDefault" className="text-xs font-bold text-slate-600 cursor-pointer select-none">
                  Đặt làm địa chỉ mặc định
                </label>
              </div>

              {/* Submit Form Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewAddressForm(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loadingGeoData}
                  className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm"
                >
                  {loadingGeoData && <Loader className="animate-spin h-4 w-4" />}
                  <span>Lưu địa chỉ</span>
                </button>
              </div>
            </form>
          ) : (
            
            // Address list selection
            <div className="space-y-4">
              
              {/* Add Address button at top */}
              <button
                onClick={handleOpenNewAddressForm}
                className="w-full border-2 border-dashed border-rose-300 rounded-xl p-3 flex items-center justify-center gap-2 text-rose-500 hover:bg-rose-500/[0.02] transition-colors font-bold text-sm bouncy-hover"
              >
                <Plus className="h-4 w-4" />
                <span>Thêm địa chỉ giao hàng mới</span>
              </button>

              {/* List Items */}
              {addresses.length === 0 ? (
                <p className="text-center text-slate-400 py-6 text-sm">Bạn chưa cấu hình địa chỉ nào.</p>
              ) : (
                <div className="space-y-3 overflow-y-auto max-h-[40vh] pr-1">
                  {addresses.map((addr) => (
                    <div
                      key={addr.addressID}
                      onClick={() => {
                        setSelectedAddress(addr);
                        setAddressModalOpen(false);
                      }}
                      className={`border rounded-xl p-4 cursor-pointer transition-all ${
                        selectedAddress?.addressID === addr.addressID
                          ? "border-rose-500 bg-rose-500/[0.01]"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="space-y-1 flex-grow">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-slate-800 text-sm">{addr.recipientName}</span>
                            <span className="text-slate-300 text-xs">|</span>
                            <span className="text-slate-600 text-xs font-semibold">{addr.phoneNumber}</span>
                            {addr.isDefault && (
                              <span className="bg-rose-100 text-rose-600 text-[8px] px-1.5 py-0.5 rounded-full font-extrabold uppercase tracking-wide">
                                Mặc Định
                              </span>
                            )}
                          </div>
                          <p className="text-slate-500 text-xs leading-relaxed">
                            {addr.detailAddress}, {addr.ward}, {addr.district === addr.province ? addr.province : `${addr.district}, ${addr.province}`}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2.5 shrink-0">
                          {/* Nút sửa địa chỉ */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation(); // Ngăn chọn địa chỉ khi click nút sửa
                              handleOpenEditAddressForm(addr);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100"
                            title="Sửa địa chỉ"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>

                          {/* Selected Radio Indicator */}
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            selectedAddress?.addressID === addr.addressID
                              ? "border-rose-500 bg-rose-500 text-white"
                              : "border-slate-300"
                          }`}>
                            {selectedAddress?.addressID === addr.addressID && <Check className="h-3 w-3 stroke-[3]" />}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
