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
    <section className="bg-white rounded-xl p-lg shadow-[0_20px_40px_rgba(135,78,88,0.06)] border border-slate-100">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-md pb-3 border-b border-slate-100">
        <h2 className="font-headline-md text-xl font-bold text-primary flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">location_on</span> Địa chỉ giao hàng
        </h2>
        <button
          onClick={onAddClick}
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
              className={`border-2 rounded-2xl p-5 flex flex-col md:flex-row justify-between gap-md relative overflow-hidden transition-all duration-200 ${address.isDefault
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
                  <br />
                  {address.ward}, {address.district}, {address.province}
                  {address.apiVersion === "v1" && (
                    <span className="ml-2 text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded uppercase font-bold">V1</span>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2 md:flex-col md:items-end justify-end mt-2 md:mt-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                <div className="flex gap-2">
                  <button
                    onClick={() => onEditClick(address)}
                    className="p-2 text-primary hover:bg-primary-container rounded-full transition-colors"
                    title="Chỉnh sửa địa chỉ"
                  >
                    <span className="material-symbols-outlined text-lg">edit</span>
                  </button>
                  {!address.isDefault && (
                    <button
                      onClick={() => onDeleteClick(address.addressID)}
                      className="p-2 text-error hover:bg-error-container hover:text-error rounded-full transition-colors"
                      title="Xóa địa chỉ"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
                {!address.isDefault && (
                  <button
                    onClick={() => onSetDefaultClick(address.addressID)}
                    className="text-xs font-bold text-primary hover:underline px-3 py-1.5 rounded-full hover:bg-primary-container/20 mt-1"
                  >
                    Thiết lập mặc định
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10 bg-surface-container-low rounded-2xl border border-dashed border-slate-300">
            <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">location_off</span>
            <p className="text-on-surface-variant font-medium">Bạn chưa có địa chỉ giao hàng nào.</p>
            <p className="text-sm text-slate-500 mt-1">Thêm địa chỉ ngay để thanh toán nhanh chóng hơn!</p>
          </div>
        )}
      </div>
    </section>
  );
}
