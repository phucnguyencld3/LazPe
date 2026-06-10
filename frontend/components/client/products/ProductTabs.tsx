import React, { useState } from "react";
import { Truck, RotateCcw, ShieldCheck } from "lucide-react";
import { Product } from "@/types";
import { ProductReviews } from "./ProductReviews";

interface ProductTabsProps {
  product: Product;
  parsedSpecs: [string, any][] | null;
  fallbackSpecs: [string, string][];
}

export const ProductTabs: React.FC<ProductTabsProps> = ({
  product,
  parsedSpecs,
  fallbackSpecs,
}) => {
  const [activeTab, setActiveTab] = useState<"description" | "specifications" | "shipping" | "reviews">("description");

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mb-12">
      {/* Tab Headers */}
      <div className="border-b border-slate-100 bg-slate-50/50 px-6 sm:px-8 py-4 flex gap-6">
        <button
          onClick={() => setActiveTab("description")}
          className={`pb-2 text-sm font-bold border-b-2 transition-all ${
            activeTab === "description"
              ? "border-primary text-primary"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          Mô tả sản phẩm
        </button>
        <button
          onClick={() => setActiveTab("specifications")}
          className={`pb-2 text-sm font-bold border-b-2 transition-all ${
            activeTab === "specifications"
              ? "border-primary text-primary"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          Thông số kỹ thuật
        </button>
        <button
          onClick={() => setActiveTab("shipping")}
          className={`pb-2 text-sm font-bold border-b-2 transition-all ${
            activeTab === "shipping"
              ? "border-primary text-primary"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          Chính sách giao nhận
        </button>
        <button
          onClick={() => setActiveTab("reviews")}
          className={`pb-2 text-sm font-bold border-b-2 transition-all ${
            activeTab === "reviews"
              ? "border-primary text-primary"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          Đánh giá ({product.ratingCount || 0})
        </button>
      </div>

      {/* Tab Contents */}
      <div className="p-6 sm:p-8 text-slate-600 text-sm leading-relaxed min-h-[160px]">
        {activeTab === "description" && (
          <div className="whitespace-pre-line">
            {product.description && !(product.description.trim().startsWith("{") && product.description.trim().endsWith("}")) ? (
              product.description
            ) : (
              <div>
                Sản phẩm cao cấp chất lượng vượt trội của hãng sản xuất được làm từ nguyên liệu cao cấp, đáp ứng hoàn toàn các tiêu chuẩn kỹ thuật nghiêm ngặt về chất lượng và độ an toàn sức khỏe. Thiết kế thông minh đem lại hiệu năng tối đa cùng độ bền lý tưởng trong suốt quá trình sử dụng.
              </div>
            )}
          </div>
        )}

        {/* Specifications JSON parsed Table */}
        {activeTab === "specifications" && (
          <div className="max-w-2xl">
            <table className="min-w-full divide-y divide-slate-200 border border-slate-100 rounded-lg overflow-hidden">
              <tbody className="divide-y divide-slate-100 bg-white">
                {(parsedSpecs || fallbackSpecs).map(([key, value]) => (
                  <tr key={key} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-500 bg-slate-50/50 w-1/3">
                      {key}
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {typeof value === "object" ? JSON.stringify(value) : String(value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "shipping" && (
          <ul className="space-y-4 max-w-[32rem]">
            <li className="flex items-start gap-3">
              <Truck size={18} className="text-green-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800 block">Vận chuyển siêu tốc</strong>
                <span>Giao hàng tận nơi toàn quốc từ 2 - 4 ngày làm việc. Miễn phí vận chuyển cho đơn hàng lớn.</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <RotateCcw size={18} className="text-blue-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800 block">Đổi trả dễ dàng</strong>
                <span>Hỗ trợ chính sách đổi trả/hoàn tiền nhanh chóng trong vòng 7 ngày nếu có lỗi do nhà sản xuất.</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <ShieldCheck size={18} className="text-amber-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800 block">Bảo hành 12 tháng</strong>
                <span>Bảo hành chính hãng 12 tháng liên tục. Đội ngũ chăm sóc khách hàng phản hồi trong 24h.</span>
              </div>
            </li>
          </ul>
        )}

        {activeTab === "reviews" && (
          <ProductReviews productId={product.id} />
        )}
      </div>
    </div>
  );
};
