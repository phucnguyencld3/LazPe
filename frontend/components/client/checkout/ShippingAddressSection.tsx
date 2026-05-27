import React from "react";
import { MapPin, Plus, Pencil } from "lucide-react";
import { AddressItem } from "@/lib/api";

interface ShippingAddressSectionProps {
  selectedAddress: AddressItem | null;
  setAddressModalOpen: (open: boolean) => void;
  handleOpenNewAddressForm: () => void;
}

export const ShippingAddressSection: React.FC<ShippingAddressSectionProps> = ({
  selectedAddress,
  setAddressModalOpen,
  handleOpenNewAddressForm,
}) => {
  return (
    <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 transition-all duration-300 hover:shadow-md">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-sm">
            1
          </div>
          <h2 className="text-lg font-bold text-slate-800">Địa chỉ giao hàng</h2>
        </div>
        <button
          onClick={() => setAddressModalOpen(true)}
          className="flex items-center gap-1 text-sm font-semibold text-rose-500 hover:text-rose-600 transition-colors"
        >
          Thay đổi địa chỉ
        </button>
      </div>

      {/* Selected Address Card */}
      {selectedAddress ? (
        <div className="border border-rose-100 bg-rose-50/20 rounded-xl p-4 relative overflow-hidden transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-100/10 rounded-full -mr-8 -mt-8 pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="space-y-2 flex-grow">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-slate-800">{selectedAddress.recipientName}</span>
                <span className="text-slate-300">|</span>
                <span className="text-slate-600 font-medium">{selectedAddress.phoneNumber}</span>
                {selectedAddress.isDefault && (
                  <span className="bg-rose-100 text-rose-600 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    Mặc Định
                  </span>
                )}
              </div>
              
              <p className="text-slate-600 text-sm flex items-start">
                <MapPin className="h-4 w-4 text-rose-400 mr-2 flex-shrink-0 mt-0.5" />
                <span>
                  {selectedAddress.detailAddress}, {selectedAddress.ward}, {selectedAddress.district === selectedAddress.province ? selectedAddress.province : `${selectedAddress.district}, ${selectedAddress.province}`}
                </span>
              </p>
            </div>

            <button
              onClick={() => setAddressModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-rose-200 hover:border-rose-300 text-rose-500 hover:bg-rose-50 rounded-full text-xs font-bold transition-all bouncy-hover shrink-0"
            >
              <Pencil className="h-3.5 w-3.5" />
              <span>Đổi địa chỉ</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50/50">
          <MapPin className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm mb-4">Bạn chưa chọn hoặc chưa có địa chỉ giao hàng nào.</p>
          <button
            onClick={() => {
              setAddressModalOpen(true);
              handleOpenNewAddressForm();
            }}
            className="inline-flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white font-semibold text-sm px-4 py-2.5 rounded-lg shadow-sm hover:shadow transition-all bouncy-hover"
          >
            <Plus className="h-4 w-4" />
            Thêm địa chỉ mới
          </button>
        </div>
      )}
    </section>
  );
};
