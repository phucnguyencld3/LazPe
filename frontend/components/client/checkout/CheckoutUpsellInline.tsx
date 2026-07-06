import React, { useState, useEffect } from "react";
import { Sparkles, Loader, ShoppingBag, Plus, ChevronDown, ChevronUp } from "lucide-react";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils/formatters";
import { API_BASE_URL } from "@/lib/api";
import { toast } from "@/lib/toast";

interface UpsellProduct {
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
  onUpsellAdded: () => void;
}

export const CheckoutUpsellInline: React.FC<Props> = ({ onUpsellAdded }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [products, setProducts] = useState<UpsellProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<number | null>(null);

  useEffect(() => {
    fetchUpsells();
  }, []);

  const fetchUpsells = async () => {
    try {
      setLoading(true);
      const userToken = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (userToken) {
        const res = await fetch(`${API_BASE_URL}/upsell/checkout-suggestions`, {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        });
        if (res.ok) {
          const suggestions = await res.json();
          setProducts(suggestions || []);
        }
      }
    } catch (e) {
      console.error("Error fetching upsells:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (variantId: number) => {
    setAddingId(variantId);
    try {
      const userToken = localStorage.getItem("token") || sessionStorage.getItem("token");
      const userJson = localStorage.getItem("user") || sessionStorage.getItem("user");
      const userId = userJson ? JSON.parse(userJson).id || JSON.parse(userJson).userId : null;
      
      const payload = {
        userId: userId,
        variantId: variantId,
        quantity: 1,
        source: "checkout_upsell"
      };
      
      const res = await fetch(`${API_BASE_URL}/Cart/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`
        },
        body: JSON.stringify(payload),
      });
      
      const resData = await res.json();
      if (res.ok && resData.success) {
        toast.success("Đã thêm vào đơn hàng!");
        
        // Add to selectedCartDetailIds
        const newDetail = resData.data.cartDetails.find((cd: any) => cd.variantID === variantId);
        if (newDetail) {
          const currentSelectedStr = localStorage.getItem("selectedCartDetailIds");
          let currentSelected = currentSelectedStr ? JSON.parse(currentSelectedStr) : [];
          if (!currentSelected.includes(newDetail.cartDetailID)) {
             currentSelected.push(newDetail.cartDetailID);
             localStorage.setItem("selectedCartDetailIds", JSON.stringify(currentSelected));
          }
        }
        
        // Remove product from upsell list locally
        setProducts(prev => prev.filter(p => p.variantID !== variantId));
        
        onUpsellAdded();
      } else {
        toast.error(resData.message || "Không thể thêm sản phẩm");
      }
    } catch (e) {
      console.error(e);
      toast.error("Lỗi khi thêm sản phẩm");
    } finally {
      setAddingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <Loader className="animate-spin text-rose-500" size={20} />
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <div className="border-t border-slate-100 bg-rose-50/30">
      <div 
        className="px-6 py-3 flex justify-between items-center cursor-pointer hover:bg-rose-50/50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="text-rose-500" size={18} />
          <span className="font-bold text-sm text-slate-800">Deal sốc mua kèm</span>
          <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">Hot</span>
        </div>
        <button className="text-slate-400 hover:text-slate-600">
          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>
      
      {isOpen && (
        <div className="px-6 pb-4 space-y-3">
          {products.map(p => (
            <div key={p.variantID} className="flex gap-3 items-center bg-white border border-rose-100 p-2 rounded-xl shadow-sm">
              <div className="relative w-14 h-14 bg-slate-50 rounded-lg overflow-hidden shrink-0 border border-slate-100">
                <Image 
                  src={p.imageUrl || "/images/placeholder.jpg"} 
                  alt={p.productName} 
                  fill 
                  className="object-cover" 
                />
              </div>
              
              <div className="flex-grow min-w-0">
                <h4 className="text-xs font-semibold text-slate-700 truncate">{p.productName}</h4>
                <p className="text-[10px] text-slate-500 truncate mb-0.5">{p.variantName}</p>
                <div className="flex items-center gap-2">
                  <span className="text-rose-600 font-bold text-xs">{formatCurrency(p.unitPrice)}</span>
                  {p.discountPercent > 0 && (
                    <span className="text-[10px] text-slate-400 line-through">{formatCurrency(p.originalPrice)}</span>
                  )}
                </div>
              </div>
              
              <button 
                onClick={() => handleAdd(p.variantID)}
                disabled={addingId === p.variantID}
                className="shrink-0 w-8 h-8 flex items-center justify-center bg-rose-50 text-rose-600 rounded-full hover:bg-rose-500 hover:text-white transition-colors disabled:opacity-50"
              >
                {addingId === p.variantID ? (
                  <Loader className="animate-spin" size={14} />
                ) : (
                  <Plus size={16} />
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
