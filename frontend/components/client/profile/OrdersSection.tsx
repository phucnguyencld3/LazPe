import React, { useState, useEffect } from "react";
import { getUserOrders } from "@/lib/api";
import { toast } from "@/lib/toast";
import { Loader } from "lucide-react";

interface OrdersSectionProps {
  userId: string;
  token: string;
}

export function OrdersSection({ userId, token }: OrdersSectionProps) {
  const [activeTab, setActiveTab] = useState<"all" | "0" | "2" | "4" | "5">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrders = async () => {
      setLoading(true);
      try {
        const data = await getUserOrders(userId, token);
        if (data) {
          setOrders(data);
        }
      } catch (err) {
        console.error("Error loading user orders:", err);
        toast.error("Không thể tải danh sách đơn hàng.");
      } finally {
        setLoading(false);
      }
    };
    
    if (userId && token) {
      loadOrders();
    }
  }, [userId, token]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
  };

  const getStatusBadge = (statusCode: number) => {
    switch (statusCode) {
      case 0:
        return (
          <span className="px-3 py-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-full">
            Chờ xử lý
          </span>
        );
      case 1:
        return (
          <span className="px-3 py-1 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-full">
            Đã xác nhận
          </span>
        );
      case 2:
        return (
          <span className="px-3 py-1 text-xs font-bold text-sky-700 bg-sky-50 border border-sky-200 rounded-full">
            Đang vận chuyển
          </span>
        );
      case 3:
        return (
          <span className="px-3 py-1 text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200 rounded-full">
            Đang giao hàng
          </span>
        );
      case 4:
        return (
          <span className="px-3 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full">
            Hoàn thành
          </span>
        );
      case 5:
        return (
          <span className="px-3 py-1 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-full">
            Đã hủy
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-full">
            Không rõ
          </span>
        );
    }
  };

  const filteredOrders = orders.filter((order) => {
    // Filter by tab
    let matchesTab = true;
    if (activeTab === "0") {
      matchesTab = order.statusCode === 0 || order.statusCode === 1;
    } else if (activeTab === "2") {
      matchesTab = order.statusCode === 2 || order.statusCode === 3;
    } else if (activeTab === "4") {
      matchesTab = order.statusCode === 4;
    } else if (activeTab === "5") {
      matchesTab = order.statusCode === 5;
    }
    
    // Filter by search query
    const matchesSearch = searchQuery.trim() === "" ||
      order.invoiceID.toString().includes(searchQuery) ||
      (order.invoiceDetails && order.invoiceDetails.some((item: any) => 
        item.productName.toLowerCase().includes(searchQuery.toLowerCase())
      ));
      
    return matchesTab && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-slate-100 shadow-sm">
        <Loader className="animate-spin text-primary mb-4" size={36} />
        <p className="text-slate-500 font-medium">Đang tải danh sách đơn hàng...</p>
      </div>
    );
  }

  return (
    <section className="bg-white rounded-xl p-lg shadow-[0_20px_40px_rgba(135,78,88,0.06)] border border-slate-100">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-md pb-3 border-b border-slate-100">
        <h2 className="font-headline-md text-xl font-bold text-primary flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">shopping_bag</span> Đơn mua của tôi
        </h2>
      </div>

      {/* Search Input */}
      <div className="mb-6 relative">
        <input
          type="text"
          placeholder="Tìm kiếm theo mã đơn hàng, tên sản phẩm..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-primary text-sm font-semibold"
        />
        <span className="material-symbols-outlined absolute left-3 top-3 text-slate-400 text-lg">
          search
        </span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100 mb-6 overflow-x-auto scrollbar-none gap-2">
        {(
          [
            { id: "all", label: "Tất cả" },
            { id: "0", label: "Chờ xử lý" },
            { id: "2", label: "Vận chuyển" },
            { id: "4", label: "Hoàn thành" },
            { id: "5", label: "Đã hủy" },
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
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-md">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <div
              key={order.invoiceID}
              className="border border-slate-100 rounded-2xl overflow-hidden hover:shadow-md transition-shadow bg-white"
            >
              {/* Card Header */}
              <div className="bg-slate-50/50 px-5 py-3.5 border-b border-slate-100 flex flex-wrap justify-between items-center gap-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-slate-600 text-lg">store</span>
                  <span className="font-bold text-slate-700 text-sm">LazPe Store</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-400">Mã đơn: #{order.invoiceID}</span>
                  {getStatusBadge(order.statusCode)}
                </div>
              </div>

              {/* Product list */}
              <div className="p-5 divide-y divide-slate-100">
                {order.invoiceDetails && order.invoiceDetails.map((item: any, idx: number) => (
                  <div key={idx} className="flex gap-4 py-3 first:pt-0 last:pb-0">
                    {/* Product Image */}
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.productName}
                        className="w-16 h-16 rounded-xl object-cover shadow-sm flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/10 to-primary/20 flex flex-shrink-0 items-center justify-center text-primary font-bold text-base shadow-sm">
                        LazPe
                      </div>
                    )}

                    <div className="flex-1 flex flex-col md:flex-row justify-between gap-2">
                      <div className="space-y-1">
                        <h4 className="font-bold text-slate-800 text-sm md:text-base line-clamp-1">
                          {item.productName}
                        </h4>
                        {item.variantName && (
                          <p className="text-xs text-slate-400 font-semibold">{item.variantName}</p>
                        )}
                        <p className="text-xs text-slate-500 font-bold">Số lượng: x{item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-primary text-sm md:text-base">
                          {formatPrice(item.unitPrice)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order total & CTA */}
              <div className="bg-slate-50/20 px-5 py-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="text-xs text-slate-400">
                  Ngày mua: {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                </div>

                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4 w-full sm:w-auto">
                  <div className="text-sm font-semibold text-slate-700">
                    Tổng thanh toán:{" "}
                    <span className="text-lg font-bold text-primary">
                      {formatPrice(order.totalPrice + order.shippingFee)}
                    </span>
                  </div>

                  <div className="flex gap-2 w-full sm:w-auto justify-end">
                    {order.statusCode === 4 && (
                      <button
                        onClick={() => toast.success("Đang mở form đánh giá sản phẩm")}
                        className="bg-primary hover:bg-primary/95 text-white px-4 py-2 rounded-lg font-bold text-xs bouncy-hover active:scale-95 transition-transform"
                      >
                        Đánh giá
                      </button>
                    )}
                    {order.statusCode === 0 && order.payMethodCode === 2 && (
                      <button
                        onClick={() => toast.success("Đang kết nối lại cổng thanh toán VNPay...")}
                        className="bg-primary hover:bg-primary/95 text-white px-4 py-2 rounded-lg font-bold text-xs bouncy-hover active:scale-95 transition-transform"
                      >
                        Thanh toán lại
                      </button>
                    )}
                    {(order.statusCode === 4 || order.statusCode === 5) && (
                      <button
                        onClick={() => toast.success("Đã thêm sản phẩm vào giỏ hàng")}
                        className="border border-primary text-primary hover:bg-primary/5 px-4 py-2 rounded-lg font-bold text-xs transition-colors"
                      >
                        Mua lại
                      </button>
                    )}
                    <button
                      onClick={() => toast.info(`Đơn hàng #${order.invoiceID} - Phương thức thanh toán: ${order.payMethod}`)}
                      className="border border-slate-200 text-slate-600 hover:bg-slate-50 px-4 py-2 rounded-lg font-bold text-xs transition-colors"
                    >
                      Chi tiết
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">receipt_long</span>
            <p className="text-slate-500 font-semibold text-sm">Chưa có đơn hàng nào trong mục này.</p>
          </div>
        )}
      </div>
    </section>
  );
}
