import React from "react";

interface ProductsHeroProps {
  sortParam: string | null;
}

export const ProductsHero: React.FC<ProductsHeroProps> = ({ sortParam }) => {
  let pageTitle = "Tất cả sản phẩm";
  let pageSubtitle = "Khám phá bộ sưu tập đồ chơi gỗ cao cấp, quần áo cotton mềm mại và những món quà tuyệt vời dành riêng cho thiên thần nhỏ của bạn tại LazPe.";

  if (sortParam === "bestseller") {
    pageTitle = "Sản phẩm bán chạy nhất";
    pageSubtitle = "Khám phá những món đồ được các mẹ và bé yêu thích nhất tại LazPe. Chất lượng cao cấp, thiết kế an toàn và đầy màu sắc cho tuổi thơ rực rỡ.";
  } else if (sortParam === "newest") {
    pageTitle = "Sản phẩm mới nhất";
    pageSubtitle = "Cập nhật những mẫu đồ chơi gỗ thông minh và trang phục cotton mới nhất cho bé yêu tại LazPe.";
  } else if (sortParam === "sale") {
    pageTitle = "Sản phẩm khuyến mãi";
    pageSubtitle = "Sở hữu những sản phẩm cao cấp cho bé với mức giá ưu đãi cực sốc chỉ có tại LazPe.";
  }

  return (
    <section className="bg-gradient-to-br from-[#ffd9de]/30 via-white to-white border-b border-slate-100 py-12 md:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto text-center relative z-10">
        <h1 className="font-headline-lg text-4xl md:text-5xl font-bold text-slate-900 tracking-tight mb-4">
          {pageTitle}
        </h1>
        <p className="max-w-2xl mx-auto font-body-lg text-base md:text-lg text-slate-600 leading-relaxed">
          {pageSubtitle}
        </p>
      </div>
    </section>
  );
};
