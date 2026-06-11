import React, { useState, useEffect } from "react";
import { toast } from "@/lib/toast";
import { getUserVouchers, activateVoucherCode } from "@/lib/api";
import { Loader } from "lucide-react";

interface Voucher {
  id: string;
  code: string;
  title: string;
  description: string;
  minSpend: number;
  expiryDate: string;
  type: "discount" | "shipping" | "cashback";
  status: "unused" | "used" | "expired";
}

interface VoucherSectionProps {
  token: string;
}

export function VoucherSection({ token }: VoucherSectionProps) {
  const [activeTab, setActiveTab] = useState<"all" | "unused" | "used" | "expired">("unused");
  const [searchCode, setSearchCode] = useState("");
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadVouchers = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const data = await getUserVouchers(token);
        if (data) {
          const mapped = data.map((v: any): Voucher => {
            const code = v.voucherCode || v.code || "";
            
            let type: "discount" | "shipping" | "cashback" = "discount";
            const upperCode = code.toUpperCase();
            if (upperCode.includes("SHIP") || upperCode.includes("SHIPPING") || upperCode.includes("FREESHIP")) {
              type = "shipping";
            } else if (upperCode.includes("XU") || upperCode.includes("CASHBACK") || upperCode.includes("COIN")) {
              type = "cashback";
            }

            let title = v.voucherName || "";
            if (!title) {
              if (v.discountType === 1) {
                title = `Giảm ${v.discountValue}%`;
              } else {
                title = `Giảm ${new Intl.NumberFormat("vi-VN").format(v.discountValue)}₫`;
              }
            }

            let description = "";
            if (v.discountType === 1) {
              description = `Giảm ${v.discountValue}% đơn hàng, tối đa ${new Intl.NumberFormat("vi-VN").format(v.maxDiscount)}₫`;
            } else {
              description = `Giảm ${new Intl.NumberFormat("vi-VN").format(v.discountValue)}₫ cho đơn hàng`;
            }

            let status: "unused" | "used" | "expired" = "unused";
            const rawStatus = (v.status || "").toLowerCase();
            if (rawStatus === "used") {
              status = "used";
            } else if (rawStatus === "expired") {
              status = "expired";
            }

            return {
              id: String(v.userVoucherID || v.voucherID),
              code: code,
              title: title,
              description: description,
              minSpend: v.minOrderValue || 0,
              expiryDate: v.endDate ? v.endDate.split("T")[0] : "",
              type: type,
              status: status,
            };
          });
          setVouchers(mapped);
        }
      } catch (err) {
        console.error("Error loading vouchers:", err);
        toast.error("Không thể tải danh sách voucher.");
      } finally {
        setLoading(false);
      }
    };

    loadVouchers();
  }, [token]);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCode.trim()) {
      toast.error("Vui lòng nhập mã voucher");
      return;
    }

    const exists = vouchers.find(v => v.code.toLowerCase() === searchCode.trim().toLowerCase());
    if (exists && exists.status === "unused") {
      toast.info("Voucher này đã có sẵn trong ví của bạn.");
      return;
    }

    try {
      const result = await activateVoucherCode(token, searchCode.trim().toUpperCase());
      if (result.success) {
        toast.success(result.message || "Lưu voucher thành công!");
        setSearchCode("");
        // Reload vouchers
        const data = await getUserVouchers(token);
        if (data) {
          const mapped = data.map((v: any): Voucher => {
            const code = v.voucherCode || v.code || "";
            let type: "discount" | "shipping" | "cashback" = "discount";
            const upperCode = code.toUpperCase();
            if (upperCode.includes("SHIP") || upperCode.includes("SHIPPING") || upperCode.includes("FREESHIP")) {
              type = "shipping";
            } else if (upperCode.includes("XU") || upperCode.includes("CASHBACK") || upperCode.includes("COIN")) {
              type = "cashback";
            }

            let title = v.voucherName || "";
            if (!title) {
              if (v.discountType === 1) {
                title = `Giảm ${v.discountValue}%`;
              } else {
                title = `Giảm ${new Intl.NumberFormat("vi-VN").format(v.discountValue)}₫`;
              }
            }

            let description = "";
            if (v.discountType === 1) {
              description = `Giảm ${v.discountValue}% đơn hàng, tối đa ${new Intl.NumberFormat("vi-VN").format(v.maxDiscount)}₫`;
            } else {
              description = `Giảm ${new Intl.NumberFormat("vi-VN").format(v.discountValue)}₫ cho đơn hàng`;
            }

            let status: "unused" | "used" | "expired" = "unused";
            const rawStatus = (v.status || "").toLowerCase();
            if (rawStatus === "used") {
              status = "used";
            } else if (rawStatus === "expired") {
              status = "expired";
            }

            return {
              id: String(v.userVoucherID || v.voucherID),
              code: code,
              title: title,
              description: description,
              minSpend: v.minOrderValue || 0,
              expiryDate: v.endDate ? v.endDate.split("T")[0] : "",
              type: type,
              status: status,
            };
          });
          setVouchers(mapped);
        }
      } else {
        toast.error(result.message || "Không thể kích hoạt voucher này.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Đã xảy ra lỗi kết nối.");
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Đã copy mã: ${code}`);
  };

  const filteredVouchers = vouchers.filter((v) => {
    if (activeTab === "all") return true;
    return v.status === activeTab;
  });

  const getVoucherIcon = (type: Voucher["type"]) => {
    switch (type) {
      case "shipping":
        return <span className="material-symbols-outlined text-3xl text-secondary">local_shipping</span>;
      case "cashback":
        return <span className="material-symbols-outlined text-3xl text-amber-500">monetization_on</span>;
      default:
        return <span className="material-symbols-outlined text-3xl text-primary">sell</span>;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
  };

  if (loading) {
    return (
      <section className="bg-white rounded-xl p-lg shadow-[0_20px_40px_rgba(135,78,88,0.06)] border border-slate-100 min-h-[300px] flex flex-col items-center justify-center">
        <Loader className="animate-spin text-primary mb-3" size={40} />
        <p className="text-slate-500 font-bold text-sm">Đang tải danh sách voucher...</p>
      </section>
    );
  }

  return (
    <section className="bg-white rounded-[10px] p-6 shadow-[0_20px_40px_rgba(135,78,88,0.06)] border border-slate-100">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-3 border-b border-slate-100">
        <h2 className="font-headline-md text-xl font-bold text-primary flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">confirmation_number</span> Voucher của tôi
        </h2>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="mb-6 flex gap-3 max-w-[32rem]">
        <input
          type="text"
          placeholder="Nhập mã voucher tại đây..."
          value={searchCode}
          onChange={(e) => setSearchCode(e.target.value)}
          className="flex-1 px-4 py-2.5 rounded-[10px] border border-slate-200 focus:outline-none focus:border-primary text-sm font-semibold"
        />
        <button
          type="submit"
          className="bg-primary hover:bg-primary/95 text-white px-6 py-2.5 rounded-[10px] font-bold text-sm bouncy-hover active:scale-95 transition-transform flex-shrink-0 whitespace-nowrap"
        >
          Áp dụng
        </button>
      </form>

      {/* Tabs */}
      <div className="flex border-b border-slate-100 mb-6 overflow-x-auto scrollbar-none gap-2">
        {(
          [
            { id: "unused", label: "Chưa sử dụng" },
            { id: "used", label: "Đã sử dụng" },
            { id: "expired", label: "Hết hiệu lực" },
            { id: "all", label: "Tất cả" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-3 px-4 text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-slate-500 hover:text-primary"
            }`}
          >
            {tab.label} ({vouchers.filter(v => tab.id === "all" ? true : v.status === tab.id).length})
          </button>
        ))}
      </div>

      {/* Voucher List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredVouchers.length > 0 ? (
          filteredVouchers.map((voucher) => (
            <div
              key={voucher.id}
              className={`flex border rounded-[10px] overflow-hidden relative group transition-all duration-200 ${
                voucher.status === "unused"
                  ? "border-slate-200 hover:border-primary/50 hover:shadow-md"
                  : "border-slate-100 bg-slate-50/50 opacity-60"
              }`}
            >
              {/* Left Wing (Coupon Head) */}
              <div
                className={`w-24 flex flex-col items-center justify-center border-r border-dashed border-slate-200 relative flex-shrink-0 ${
                  voucher.status === "unused"
                    ? voucher.type === "shipping"
                      ? "bg-secondary/5"
                      : voucher.type === "cashback"
                      ? "bg-amber-50"
                      : "bg-primary/5"
                    : "bg-slate-100"
                }`}
              >
                {getVoucherIcon(voucher.type)}
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-2">
                  {voucher.type === "shipping" ? "Vận chuyển" : voucher.type === "cashback" ? "Hoàn xu" : "Giảm giá"}
                </span>

                {/* Dotted dividers top & bottom */}
                <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white rounded-full border border-slate-200"></div>
                <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white rounded-full border border-slate-200"></div>
              </div>

              {/* Right Wing (Coupon Body) */}
              <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-bold text-slate-800 text-sm md:text-base pr-2 line-clamp-1 flex-1" title={voucher.title}>
                      {voucher.title}
                    </span>
                    <span
                      onClick={() => voucher.status === "unused" && handleCopyCode(voucher.code)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer select-none transition-colors border flex-shrink-0 ${
                        voucher.status === "unused"
                          ? "bg-primary-container text-on-primary-container border-primary-container hover:bg-primary hover:text-white"
                          : "bg-slate-200 text-slate-500 border-slate-200"
                      }`}
                    >
                      {voucher.code}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed min-h-[36px]">
                    {voucher.description}
                  </p>
                </div>

                <div className="mt-4 flex justify-between items-end gap-2">
                  <div className="text-[10px] text-slate-400 space-y-0.5 flex-1 min-w-0">
                    <p className="truncate">
                      Đơn tối thiểu:{" "}
                      {voucher.minSpend > 0
                        ? formatPrice(voucher.minSpend)
                        : "Không giới hạn"}
                    </p>
                    <p className="truncate">HSD: {formatDate(voucher.expiryDate)}</p>
                  </div>

                  {voucher.status === "unused" ? (
                    <button
                      onClick={() => handleCopyCode(voucher.code)}
                      className="text-xs font-bold text-primary border border-primary px-3.5 py-1.5 rounded-lg hover:bg-primary hover:text-white transition-colors flex-shrink-0"
                    >
                      Dùng Ngay
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-slate-400 uppercase flex-shrink-0">
                      {voucher.status === "used" ? "Đã dùng" : "Hết hạn"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 text-center py-12 bg-slate-50 rounded-[10px] border border-dashed border-slate-200">
            <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">confirmation_number</span>
            <p className="text-slate-500 font-semibold text-sm">Không tìm thấy voucher phù hợp.</p>
          </div>
        )}
      </div>
    </section>
  );
}
