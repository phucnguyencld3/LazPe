import React from "react";
import { Trash2 } from "lucide-react";
import { AddressItem } from "@/lib/api";

interface AddressListProps {
  addresses: AddressItem[];
  onAddClick: () => void;
  onEditClick: (address: AddressItem) => void;
  onDeleteClick: (addressId: number) => void;
  onSetDefaultClick: (addressId: number) => void;
}

export function AddressList({ addresses, onAddClick, onEditClick, onDeleteClick, onSetDefaultClick }: AddressListProps) {
  return (
    <section className="bg-white rounded-[10px] p-5 shadow-sm border border-slate-100/60">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 pb-3 border-b border-slate-100">
        <h2 className="text-[13px] font-bold text-slate-800 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-base">location_on</span> Địa chỉ giao hàng
        </h2>
        <button
          onClick={onAddClick}
          className="bg-primary hover:bg-primary/90 text-white px-3.5 py-1.5 rounded-[6px] font-bold flex items-center gap-1.5 active:scale-95 shadow-sm text-[11px] transition-all"
        >
          <span className="material-symbols-outlined text-[13px] font-bold">add</span> Thêm địa chỉ mới
        </button>
      </div>

      <div className="space-y-3 pt-1">
        {addresses.length > 0 ? (
          addresses.map((address) => (
            <div
              key={address.addressID}
              className={`border rounded-[8px] p-3.5 flex flex-col md:flex-row justify-between gap-3 relative overflow-hidden transition-all duration-200 group ${address.isDefault
                  ? "border-primary/30 bg-primary/5 shadow-sm"
                  : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm"
                }`}
            >
              {address.isDefault && (
                <div className="absolute top-0 right-0 bg-primary text-white px-2 py-0.5 rounded-bl-[6px] text-[9px] font-black uppercase tracking-wider shadow-sm">
                  Mặc định
                </div>
              )}

              <div className="space-y-1.5 pr-12">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-primary text-[13px]">{address.recipientName}</span>
                  <span className="text-[10px] text-primary/80 font-bold bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded-[4px]">
                    {address.phoneNumber}
                  </span>
                </div>
                <p className="text-slate-500 text-[11px] font-medium leading-relaxed">
                  {address.detailAddress}
                  <br />
                  {address.ward}, {address.district}, {address.province}
                  {address.apiVersion === "v1" && (
                    <span className="ml-2 text-[9px] bg-slate-200 text-slate-600 px-1 py-0.5 rounded uppercase font-bold">V1</span>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2 md:flex-col md:items-end justify-end mt-1 md:mt-0 border-t md:border-t-0 pt-2.5 md:pt-0 border-slate-100">
                <div className="flex gap-1.5">
                  <button
                    onClick={() => onEditClick(address)}
                    className="p-1 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-[4px] transition-colors"
                    title="Chỉnh sửa địa chỉ"
                  >
                    <span className="material-symbols-outlined text-[15px]">edit</span>
                  </button>
                  {!address.isDefault && (
                    <button
                      onClick={() => onDeleteClick(address.addressID)}
                      className="p-1 text-slate-400 hover:text-error hover:bg-error-container rounded-[4px] transition-colors"
                      title="Xóa địa chỉ"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
                {!address.isDefault && (
                  <button
                    onClick={() => onSetDefaultClick(address.addressID)}
                    className="text-[10px] font-bold text-slate-500 hover:text-primary hover:bg-primary/10 px-2 py-0.5 rounded-[4px] mt-1 transition-colors"
                  >
                    Đặt làm mặc định
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 bg-slate-50/50 rounded-[8px] border border-dashed border-slate-200">
            <span className="material-symbols-outlined text-3xl text-slate-300 mb-1">location_off</span>
            <p className="text-slate-500 font-bold text-[12px]">Bạn chưa có địa chỉ giao hàng nào.</p>
            <p className="text-[10px] text-slate-400 mt-1">Thêm địa chỉ ngay để thanh toán nhanh chóng hơn!</p>
          </div>
        )}
      </div>
    </section>
  );
}
