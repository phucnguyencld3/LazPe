import React, { useState, useEffect } from "react";
import { Search, X, Loader } from "lucide-react";
import { fetchAdminProducts, AdminProductInfo } from "@/lib/features/products/productApi";
import { formatCurrency } from "@/lib/utils/formatters";
import { toast } from "@/lib/toast";

interface ProductSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductSelect: (productId: number, productSlug?: string) => void;
  token: string;
}

export const ProductSelectModal: React.FC<ProductSelectModalProps> = ({
  isOpen,
  onClose,
  onProductSelect,
  token,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<AdminProductInfo[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    
    const delayDebounce = setTimeout(() => {
      loadProducts();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm, isOpen]);

  const loadProducts = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await fetchAdminProducts(token, 1, 15, searchTerm, null, true);
      setProducts(data.products || []);
    } catch (err: any) {
      console.error("Error fetching products for combo select:", err);
      toast.error(err?.message || "Không thể tải danh sách sản phẩm.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        style={{ width: "550px", maxWidth: "100%", height: "550px", maxHeight: "90vh" }}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2 text-primary">
            <span className="material-symbols-outlined font-bold text-xl">add_circle</span>
            <h3 className="text-lg font-bold text-slate-800">Thêm sản phẩm vào Combo</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-5 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm sản phẩm theo tên hoặc mã..."
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder-slate-400"
              autoFocus
            />
          </div>
        </div>

        {/* Products List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3 scrollbar-thin">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader className="animate-spin text-primary h-8 w-8 mb-3" />
              <p className="text-xs font-bold uppercase tracking-wider">Đang tải sản phẩm...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-center">
              <span className="material-symbols-outlined text-4xl mb-2 text-slate-300">inventory</span>
              <p className="text-sm font-bold">Không tìm thấy sản phẩm nào</p>
              <p className="text-xs text-slate-400 mt-1">Vui lòng thử từ khóa khác</p>
            </div>
          ) : (
            products.map((product) => (
              <div 
                key={product.productID}
                onClick={() => {
                  const slugify = (str: string) => {
                    return str
                      .toLowerCase()
                      .normalize('NFD')
                      .replace(/[\u0300-\u036f]/g, '')
                      .replace(/đ/g, 'd')
                      .replace(/[^a-z0-9 -]/g, '')
                      .replace(/\s+/g, '-')
                      .replace(/-+/g, '-');
                  };
                  const finalSlug = product.slug || slugify(product.productName);
                  onProductSelect(product.productID, finalSlug);
                }}
                className="flex items-center gap-4 p-3 border border-slate-100 rounded-2xl hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-all duration-200 group"
              >
                {/* Product Thumbnail */}
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 flex-shrink-0 flex items-center justify-center">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.productName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-slate-400">inventory_2</span>
                  )}
                </div>
                
                {/* Product Text Details */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-800 text-sm group-hover:text-primary transition-colors line-clamp-1">
                    {product.productName}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                      Mã: {product.code || "N/A"}
                    </span>
                    <span className="h-3 w-px bg-slate-200"></span>
                    <span className="text-[10px] font-bold text-secondary uppercase tracking-wide">
                      {product.categoryName || "Khác"}
                    </span>
                  </div>
                </div>

                {/* Price & Action */}
                <div className="text-right shrink-0">
                  <span className="font-bold text-slate-700 text-sm">
                    {formatCurrency(product.price)}
                  </span>
                  <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">
                    {product.variantCount > 0 ? `${product.variantCount} biến thể` : "Có sẵn"}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
