import React from "react";
import { getProvinces, getDistricts, getWards } from "@/lib/api";
import { SearchableSelect } from "@/components/client/common/SearchableSelect";

interface ProfileAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isEditing: boolean;
  addressForm: any;
  setAddressForm: React.Dispatch<React.SetStateAction<any>>;
  addressError: string | null;
  provinces: any[];
  setProvinces: React.Dispatch<React.SetStateAction<any[]>>;
  districts: any[];
  wards: any[];
  handleProvinceChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  handleDistrictChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  handleWardChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  setDistricts: React.Dispatch<React.SetStateAction<any[]>>;
  setWards: React.Dispatch<React.SetStateAction<any[]>>;
}

export function ProfileAddressModal({
  isOpen,
  onClose,
  onSubmit,
  isEditing,
  addressForm,
  setAddressForm,
  addressError,
  provinces,
  setProvinces,
  districts,
  wards,
  handleProvinceChange,
  handleDistrictChange,
  handleWardChange,
  setDistricts,
  setWards
}: ProfileAddressModalProps) {
  const onProvinceSelect = async (code: string, name: string) => {
    setAddressForm((prev: any) => ({
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
    if (code) {
      try {
        const data = await getDistricts(code, addressForm.apiVersion);
        if (data && data.districts) {
          setDistricts(data.districts);
        }
      } catch (err) {
        console.error("Error loading districts:", err);
      }
    }
  };

  const onDistrictSelect = async (code: string, name: string) => {
    setAddressForm((prev: any) => ({
      ...prev,
      districtCode: code,
      districtName: name,
      wardCode: "",
      wardName: "",
    }));
    setWards([]);
    if (code) {
      try {
        const data = await getWards(code, addressForm.apiVersion);
        if (data && data.wards) {
          setWards(data.wards);
        }
      } catch (err) {
        console.error("Error loading wards:", err);
      }
    }
  };

  const onWardSelect = (code: string, name: string) => {
    setAddressForm((prev: any) => ({
      ...prev,
      wardCode: code,
      wardName: name,
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
      <div className="w-full max-w-[700px] flex flex-col bg-white rounded-[12px] shadow-xl my-4 overflow-hidden border border-slate-100">
        <div className="flex justify-between items-center p-5 border-b border-slate-100/80 bg-white">
          <h3 className="font-bold text-[15px] text-slate-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
            {isEditing ? "Cập nhật địa chỉ nhận hàng" : "Thêm địa chỉ giao nhận mới"}
          </h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 hover:bg-slate-100 p-1.5 rounded-md flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
        
        <form onSubmit={onSubmit} className="p-5 space-y-4">
          {addressError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-[8px] text-[12px] font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">error</span>
              {addressError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-3.5">
            {/* Left Column: Contact Information */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="font-bold text-[12px] text-slate-700 ml-1">Tên người nhận</label>
                <input
                  type="text"
                  required
                  value={addressForm.recipientName}
                  onChange={(e) => setAddressForm({ ...addressForm, recipientName: e.target.value })}
                  placeholder="Họ tên người nhận hàng"
                  className="w-full px-3.5 py-2.5 rounded-[8px] bg-slate-50 border-slate-200 text-slate-800 focus:ring-primary focus:border-primary border focus:outline-none text-[13px] font-semibold transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-[12px] text-slate-700 ml-1">Số điện thoại nhận hàng</label>
                <input
                  type="tel"
                  required
                  value={addressForm.phoneNumber}
                  onChange={(e) => setAddressForm({ ...addressForm, phoneNumber: e.target.value })}
                  placeholder="Số điện thoại nhận cuộc gọi giao hàng"
                  className="w-full px-3.5 py-2.5 rounded-[8px] bg-slate-50 border-slate-200 text-slate-800 focus:ring-primary focus:border-primary border focus:outline-none text-[13px] font-semibold transition-colors"
                />
              </div>

              {/* Version Toggle */}
              <div className="space-y-2 pt-1">
                <label className="font-bold text-[12px] text-slate-700 ml-1">
                  Nguồn dữ liệu địa chỉ <span className="text-slate-400 font-normal text-[10px]">(Tùy chọn)</span>
                </label>
                <div className="flex flex-col gap-2 px-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="apiVersionProfile"
                      value="v2"
                      checked={addressForm.apiVersion === "v2"}
                      onChange={async (e) => {
                        const newVer = e.target.value;
                        setAddressForm((prev: any) => ({ ...prev, apiVersion: newVer, provinceCode: "", districtCode: "", wardCode: "" }));
                        setDistricts([]);
                        setWards([]);
                        const provList = await getProvinces(newVer);
                        if (provList) setProvinces(provList);
                      }}
                      className="text-primary focus:ring-primary w-4 h-4"
                    />
                    <span className="text-[12px] font-semibold text-slate-700">Địa chỉ hành chính mới (V2)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="apiVersionProfile"
                      value="v1"
                      checked={addressForm.apiVersion === "v1"}
                      onChange={async (e) => {
                        const newVer = e.target.value;
                        setAddressForm((prev: any) => ({ ...prev, apiVersion: newVer, provinceCode: "", districtCode: "", wardCode: "" }));
                        setDistricts([]);
                        setWards([]);
                        const provList = await getProvinces(newVer);
                        if (provList) setProvinces(provList);
                      }}
                      className="text-primary focus:ring-primary w-4 h-4"
                    />
                    <span className="text-[12px] font-semibold text-slate-700">Địa chỉ hành chính cũ (V1)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Right Column: Address Selectors */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="font-bold text-[12px] text-slate-700 ml-1">Tỉnh / Thành phố</label>
                <SearchableSelect
                  options={provinces}
                  value={addressForm.provinceCode}
                  onChange={onProvinceSelect}
                  placeholder="-- Chọn Tỉnh/Thành --"
                  searchPlaceholder="Tìm kiếm tỉnh/thành..."
                  accentColor="primary"
                />
              </div>

              {districts.length > 0 && (
                <div className="space-y-1.5">
                  <label className="font-bold text-[12px] text-slate-700 ml-1">Quận / Huyện</label>
                  <SearchableSelect
                    options={districts}
                    value={addressForm.districtCode}
                    onChange={onDistrictSelect}
                    placeholder="-- Chọn Quận/Huyện --"
                    searchPlaceholder="Tìm kiếm quận/huyện..."
                    disabled={!addressForm.provinceCode}
                    accentColor="primary"
                  />
                </div>
              )}

              {wards.length > 0 && (
                <div className="space-y-1.5">
                  <label className="font-bold text-[12px] text-slate-700 ml-1">Phường / Xã</label>
                  <SearchableSelect
                    options={wards}
                    value={addressForm.wardCode}
                    onChange={onWardSelect}
                    placeholder="-- Chọn Phường/Xã --"
                    searchPlaceholder="Tìm kiếm phường/xã..."
                    disabled={!addressForm.districtCode}
                    accentColor="primary"
                  />
                </div>
              )}
            </div>

            {/* Span both columns: Detail Address & default checkbox */}
            <div className="md:col-span-2 space-y-3.5 pt-1">
              <div className="space-y-1.5">
                <label className="font-bold text-[12px] text-slate-700 ml-1">Địa chỉ chi tiết</label>
                <textarea
                  required
                  value={addressForm.detailAddress}
                  onChange={(e) => setAddressForm({ ...addressForm, detailAddress: e.target.value })}
                  placeholder="Số nhà, tên đường..."
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-[8px] bg-slate-50 border-slate-200 text-slate-800 focus:ring-primary focus:border-primary border focus:outline-none resize-none text-[13px] font-semibold transition-colors"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addressForm.isDefault}
                    onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                    className="w-4 h-4 rounded text-primary focus:ring-primary border-slate-300"
                  />
                  <span className="text-[12px] font-semibold text-slate-700">Đặt làm địa chỉ mặc định</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-5 mt-2 justify-end border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-slate-200 rounded-[8px] font-bold text-[13px] text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-primary text-white rounded-[8px] font-bold text-[13px] hover:bg-primary/95 transition-all shadow-sm active:scale-95"
            >
              {isEditing ? "Cập nhật" : "Lưu địa chỉ"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
