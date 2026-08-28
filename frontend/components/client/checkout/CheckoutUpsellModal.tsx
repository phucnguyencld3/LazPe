import React from "react";
import { X, ShoppingCart } from "lucide-react";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils/formatters";

export interface UpsellProduct {
  variantID: number;
  productID: number;
  productName: string;
  variantName: string;
  imageUrl: string;
  unitPrice: number;
  originalPrice: number;
  discountPercent: number;
  stock: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (variantId: number, quantity: number) => void;
  products: UpsellProduct[];
  isAddingToCart: boolean;
}

export const CheckoutUpsellModal: React.FC<Props> = ({ isOpen, onClose, onAddToCart, products, isAddingToCart }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 flex justify-between items-start border-b">
          <div>
            <h2 className="text-2xl font-bold text-indigo-900 mb-1 flex items-center gap-2">
              <ShoppingCart className="text-indigo-600" />
              Chờ đã! Đừng bỏ lỡ ưu đãi này
            </h2>
            <p className="text-sm text-indigo-700/80">Khách hàng khác cũng thường mua kèm các sản phẩm dưới đây</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 bg-white/50 hover:bg-white rounded-full text-gray-500 hover:text-gray-900 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-6 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {products.map(p => (
              <div key={p.variantID} className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col hover:shadow-lg transition-shadow duration-300 group">
                <div className="relative w-full aspect-square mb-4 rounded-lg overflow-hidden bg-gray-50">
                  <Image 
                    src={p.imageUrl && p.imageUrl.trim() !== "" ? p.imageUrl : "/images/placeholder.jpg"} 
                    alt={p.productName} 
                    fill 
                    className="object-contain p-2 group-hover:scale-105 transition-transform duration-500" 
                    sizes="(max-width: 768px) 100vw, 33vw"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/images/placeholder.jpg";
                    }}
                  />
                  {p.discountPercent > 0 && (
                    <div className="absolute top-2 right-2 bg-rose-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                      -{Math.round(p.discountPercent)}%
                    </div>
                  )}
                </div>
                
                <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 min-h-[40px] leading-snug mb-1 group-hover:text-indigo-600 transition-colors">
                  {p.productName}
                </h3>
                
                <p className="text-xs text-gray-500 mb-3 bg-gray-50 inline-block px-2 py-1 rounded w-fit">
                  {p.variantName}
                </p>
                
                <div className="mt-auto flex items-end justify-between mb-4">
                  <div>
                    <p className="text-rose-600 font-bold text-lg">{formatCurrency(p.unitPrice)}</p>
                    {p.discountPercent > 0 && (
                      <p className="text-xs text-gray-400 line-through">{formatCurrency(p.originalPrice)}</p>
                    )}
                  </div>
                </div>
                
                <button 
                  onClick={() => onAddToCart(p.variantID, 1)}
                  disabled={isAddingToCart}
                  className="w-full bg-indigo-50 text-indigo-700 font-medium text-sm py-2.5 rounded-lg hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-50"
                >
                  {isAddingToCart ? "Đang thêm..." : "Thêm vào giỏ"}
                </button>
              </div>
            ))}
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t flex justify-end">
          <button 
            onClick={onClose} 
            className="px-6 py-2.5 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors shadow-sm"
          >
            Bỏ qua & Thanh toán ngay
          </button>
        </div>
        
      </div>
    </div>
  );
};
