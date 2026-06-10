import React, { useState, useEffect } from "react";
import { Search, X, Loader } from "lucide-react";
import { fetchAdminProducts, AdminProductInfo } from "@/lib/features/products/productApi";
import { formatCurrency } from "@/lib/utils/formatters";
import Modal from "@/components/admin/ui/Modal";

interface ProductSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductSelect: (productId: number) => void;
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
    } catch (err) {
      console.error("Error fetching products for combo select:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-xl font-outfit"
    >
      <div className="flex items-center gap-3 border-b border-gray-100 dark:border-gray-800 pb-4 mb-4">
        <div className="w-10 h-10 rounded-full bg-brand-50 dark:bg-brand-500/15 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-brand-500 text-xl font-bold">add_circle</span>
        </div>
        <h3 className="text-lg font-bold text-gray-800 dark:text-white/90">
          Thêm sản phẩm vào Combo
        </h3>
      </div>

      {/* Search Input */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input 
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm sản phẩm theo tên hoặc mã..."
            className="w-full pl-11 pr-4 py-2.5 bg-transparent border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:border-brand-500 focus:ring-3 focus:ring-brand-500/10 text-sm font-semibold text-gray-800 dark:text-white/90 placeholder:text-gray-400 dark:placeholder:text-white/30 transition-all"
            autoFocus
          />
        </div>
      </div>

      {/* Products List */}
      <div className="overflow-y-auto space-y-3 pr-1 max-h-[350px] custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
            <Loader className="animate-spin text-brand-500 h-8 w-8 mb-3" />
            <p className="text-xs font-bold uppercase tracking-wider">Đang tải sản phẩm...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500 text-center">
            <span className="material-symbols-outlined text-4xl mb-2 text-gray-300 dark:text-gray-750">inventory</span>
            <p className="text-sm font-bold">Không tìm thấy sản phẩm nào</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Vui lòng thử từ khóa khác</p>
          </div>
        ) : (
          products.map((product) => (
            <div 
              key={product.productID}
              onClick={() => onProductSelect(product.productID)}
              className="flex items-center gap-4 p-3 border border-gray-100 dark:border-gray-800 hover:border-brand-500/50 hover:bg-brand-50/5 dark:hover:bg-brand-500/10 rounded-2xl cursor-pointer transition-all duration-200 group"
            >
              {/* Product Thumbnail */}
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 flex-shrink-0 flex items-center justify-center">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.productName} className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-gray-400 dark:text-gray-655">inventory_2</span>
                )}
              </div>
              
              {/* Product Text Details */}
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-800 dark:text-white/90 text-sm group-hover:text-brand-500 transition-colors line-clamp-1">
                  {product.productName}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                    Mã: {product.code || "N/A"}
                  </span>
                  <span className="h-3 w-px bg-gray-200 dark:bg-gray-850"></span>
                  <span className="text-[10px] font-bold text-brand-500 dark:text-brand-400 uppercase tracking-wide">
                    {product.categoryName || "Khác"}
                  </span>
                </div>
              </div>

              {/* Price & Action */}
              <div className="text-right shrink-0">
                <span className="font-bold text-gray-800 dark:text-white/90 text-sm">
                  {formatCurrency(product.price)}
                </span>
                <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase mt-0.5">
                  {product.variantCount > 0 ? `${product.variantCount} biến thể` : "Có sẵn"}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </Modal>
  );
};
