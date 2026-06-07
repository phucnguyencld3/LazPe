import React from "react";
import Link from "next/link";
import { Trash2, Plus, Minus } from "lucide-react";
import { CartInfo, CartDetailInfo } from "@/lib/api";

interface CartItemListProps {
  cart: CartInfo;
  checkedDetails: Record<number, boolean>;
  isAllChecked: () => boolean;
  handleToggleAllChecks: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleToggleCheck: (detailId: number) => void;
  handleRemoveSelectedItems: () => void;
  handleClearAllCart: () => void;
  handleUpdateQuantity: (detail: CartDetailInfo, newQty: number) => void;
  handleRemoveItem: (cartDetailId: number) => void;
}

export const CartItemList: React.FC<CartItemListProps> = ({
  cart,
  checkedDetails,
  isAllChecked,
  handleToggleAllChecks,
  handleToggleCheck,
  handleRemoveSelectedItems,
  handleClearAllCart,
  handleUpdateQuantity,
  handleRemoveItem,
}) => {
  return (
    <div className="lg:col-span-8 space-y-md">
      {/* Bulk Actions Bar */}
      <div className="bg-white p-5 rounded-2xl flex justify-between items-center shadow-sm border border-slate-100">
        <label className="flex items-center gap-sm cursor-pointer group">
          <input
            type="checkbox"
            checked={isAllChecked()}
            onChange={handleToggleAllChecks}
            className="w-5 h-5 rounded border-slate-300 text-rose-500 focus:ring-rose-500/20 accent-rose-500 transition-all cursor-pointer"
          />
          <span className="font-bold text-slate-800 group-hover:text-rose-500 transition-colors text-sm">
            Chọn tất cả ({cart.cartDetails.length})
          </span>
        </label>
        <div className="flex gap-4">
          <button
            onClick={handleRemoveSelectedItems}
            className="flex items-center gap-1.5 text-slate-500 hover:text-rose-500 transition-colors font-bold text-xs"
          >
            <Trash2 size={14} />
            Xóa mục đã chọn
          </button>
          <button
            onClick={handleClearAllCart}
            className="flex items-center gap-1.5 text-slate-400 hover:text-rose-500 transition-colors font-bold text-xs border-l border-slate-200 pl-4"
          >
            Xóa sạch giỏ hàng
          </button>
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-sm">
        {cart.cartDetails.map((detail) => {
          const isChecked = !!checkedDetails[detail.cartDetailID];
          
          // Product or Bundle info resolution
          const isBundle = !!detail.bundleID;
          const name = isBundle ? detail.bundle?.name : detail.product?.name;
          const price = detail.unitPrice;
          const image = isBundle ? detail.bundle?.imageUrl : detail.variant?.imageUrl || detail.product?.imageUrl;
          const subtext = isBundle 
            ? "Gói Combo sản phẩm" 
            : `Phân loại: ${detail.variant?.color || "Tiêu chuẩn"}${detail.variant?.size ? ` - Cỡ: ${detail.variant.size}` : ""}`;

          return (
            <div
              key={detail.cartDetailID}
              className={`bg-white p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row gap-md items-center group transition-all border ${
                isChecked 
                  ? "border-rose-200 bg-rose-500/[0.02]" 
                  : "border-slate-100 hover:border-slate-200"
              }`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => handleToggleCheck(detail.cartDetailID)}
                className="w-5 h-5 rounded border-slate-300 text-rose-500 focus:ring-rose-500/20 accent-rose-500 shrink-0 transition-all cursor-pointer"
              />
              
              {/* Product Image */}
              <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-100 border border-slate-100 shrink-0 relative">
                {image ? (
                  <img
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    alt="Ảnh sản phẩm"
                    src={image}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 text-xs">
                    Không có ảnh
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="flex-grow space-y-1 text-center sm:text-left">
                <h3 className="font-bold text-lg text-slate-800 hover:text-rose-500 transition-colors">
                  {isBundle ? (
                    name
                  ) : (
                    <Link href={`/products/${detail.product?.productID || detail.variant?.variantID}`}>
                      {name}
                    </Link>
                  )}
                </h3>
                <p className="text-on-surface-variant text-xs font-semibold bg-slate-50 px-2 py-0.5 rounded inline-block">
                  {subtext}
                </p>
                <p className="text-rose-500 font-extrabold text-base pt-1">
                  ₫{price.toLocaleString("vi-VN")}
                </p>
              </div>

              {/* Quantity & Delete Actions */}
              <div className="flex items-center gap-md shrink-0 w-full sm:w-auto justify-between sm:justify-start pt-4 sm:pt-0 border-t sm:border-t-0 border-dashed border-slate-100 mt-3 sm:mt-0">
                <div className="flex items-center bg-slate-100 rounded-full p-1 border border-slate-200">
                  <button
                    onClick={() => handleUpdateQuantity(detail, detail.quantity - 1)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white hover:bg-slate-50 border border-slate-200 shadow-sm text-rose-500 transition-all active:scale-90"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="w-10 text-center font-bold text-slate-800 text-sm">
                    {detail.quantity}
                  </span>
                  <button
                    onClick={() => handleUpdateQuantity(detail, detail.quantity + 1)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white hover:bg-slate-50 border border-slate-200 shadow-sm text-rose-500 transition-all active:scale-90"
                  >
                    <Plus size={12} />
                  </button>
                </div>
                
                <button
                  onClick={() => handleRemoveItem(detail.cartDetailID)}
                  className="material-symbols-outlined text-slate-400 hover:text-rose-500 p-2 hover:bg-rose-50 rounded-full transition-all active:scale-90"
                >
                  delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
