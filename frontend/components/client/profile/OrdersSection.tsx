import React, { useState, useEffect } from "react";
import { getUserOrders, retryVnPayPayment, markOrderCompleted } from "@/lib/api";
import { toast } from "@/lib/toast";
import { Loader, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from "lucide-react";
import { OrderDetailView } from "./OrderDetailView";

interface OrdersSectionProps {
  userId: string;
  token: string;
  initialOrderId?: number | null;
  onClearInitialOrderId?: () => void;
  onChangeTab?: (tabId: string) => void;
}

export function OrdersSection({
  userId,
  token,
  initialOrderId,
  onClearInitialOrderId,
  onChangeTab
}: OrdersSectionProps) {
  const [activeTab, setActiveTab] = useState<"all" | "0" | "2" | "3" | "5">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState<Record<number, boolean>>({});
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 5;

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery]);

  const toggleOrderExpand = (orderId: number) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  useEffect(() => {
    if (initialOrderId) {
      // If initialized with an order ID (e.g. from notification click), open details directly
      setSelectedOrderId(initialOrderId);
      setActiveTab("all");
      if (onClearInitialOrderId) {
        onClearInitialOrderId();
      }
    }
  }, [initialOrderId]);

  // Handle VNPay payment status from URL redirect
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const paymentStatus = params.get("payment");
      const errorCode = params.get("code");

      if (paymentStatus === "failed") {
        let msg = "Thanh toán thất bại hoặc đã bị hủy.";
        if (errorCode === "24") {
          msg = "Giao dịch đã được hủy theo yêu cầu của bạn.";
        } else if (errorCode) {
          switch (errorCode) {
            case "09":
              msg = "Thẻ/Tài khoản của bạn chưa đăng ký dịch vụ Internet Banking.";
              break;
            case "11":
              msg = "Giao dịch không thành công do đã hết hạn chờ thanh toán.";
              break;
            case "12":
              msg = "Thẻ/Tài khoản của bạn bị khóa hoặc bị lỗi.";
              break;
            case "51":
              msg = "Tài khoản của bạn không đủ số dư để thực hiện giao dịch.";
              break;
            default:
              msg = `Đã xảy ra lỗi trong quá trình thanh toán (Mã lỗi: ${errorCode}).`;
              break;
          }
        }
        toast.error(msg);

        // Clean up URL parameters so toast doesn't show again on refresh
        const url = new URL(window.location.href);
        url.searchParams.delete("payment");
        url.searchParams.delete("code");
        window.history.replaceState({}, "", url.pathname + url.search);
      }
    }
  }, []);

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

  useEffect(() => {
    if (userId && token) {
      loadOrders();
    }
  }, [userId, token]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
  };

  // Sync with Backend OrderStatus Enum:
  // 0: Pending (Chờ xác nhận), 1: Confirmed (Đã xác nhận), 2: Shipped (Đang giao hàng / Đang vận chuyển), 
  // 3: Completed (Hoàn tất), 4: CancelRequested (Yêu cầu hủy), 5: Cancelled (Đã hủy)
  const getStatusBadge = (statusCode: number) => {
    switch (statusCode) {
      case 0:
        return (
          <span className="px-2 py-0.5 text-[9px] font-black uppercase text-amber-700 bg-amber-50 border border-amber-200/60 rounded-[4px]">
            Chờ xác nhận
          </span>
        );
      case 1:
        return (
          <span className="px-2 py-0.5 text-[9px] font-black uppercase text-blue-700 bg-blue-50 border border-blue-200/60 rounded-[4px]">
            Đã xác nhận
          </span>
        );
      case 2:
        return (
          <span className="px-2 py-0.5 text-[9px] font-black uppercase text-sky-700 bg-sky-50 border border-sky-200/60 rounded-[4px]">
            Đang vận chuyển
          </span>
        );
      case 3:
        return (
          <span className="px-2 py-0.5 text-[9px] font-black uppercase text-emerald-700 bg-emerald-50 border border-emerald-200/60 rounded-[4px]">
            Hoàn thành
          </span>
        );
      case 4:
        return (
          <span className="px-2 py-0.5 text-[9px] font-black uppercase text-rose-700 bg-rose-50 border border-rose-200/60 rounded-[4px]">
            Chờ duyệt hủy
          </span>
        );
      case 5:
        return (
          <span className="px-2 py-0.5 text-[9px] font-black uppercase text-rose-800 bg-rose-50 border border-rose-300/60 rounded-[4px]">
            Đã hủy
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-[9px] font-black uppercase text-slate-700 bg-slate-50 border border-slate-200/60 rounded-[4px]">
            Không rõ
          </span>
        );
    }
  };

  const handleRetryPayment = async (orderId: number) => {
    setActionLoading(true);
    toast.loading("Đang kết nối lại cổng thanh toán VNPay...");
    try {
      const res = await retryVnPayPayment(orderId, token);
      toast.dismiss();
      if (res.success && res.paymentUrl) {
        toast.success("Kết nối thành công! Đang chuyển hướng...");
        window.location.href = res.paymentUrl;
      } else {
        toast.error(res.message || "Tạo liên kết thanh toán lại thất bại.");
      }
    } catch (err) {
      toast.dismiss();
      console.error("Error retrying payment:", err);
      toast.error("Lỗi kết nối mạng.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmReceived = async (orderId: number) => {
    setActionLoading(true);
    try {
      const res = await markOrderCompleted(orderId, token);
      if (res && res.success) {
        toast.success("Đã xác nhận nhận hàng thành công!");
        loadOrders();
      } else {
        toast.error(res?.message || "Có lỗi xảy ra khi xác nhận.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối.");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    // Filter by tab
    let matchesTab = true;
    if (activeTab === "0") {
      // Chờ xử lý: Chờ xác nhận (0) hoặc Đã xác nhận (1)
      matchesTab = order.statusCode === 0 || order.statusCode === 1;
    } else if (activeTab === "2") {
      // Vận chuyển: Đang giao hàng (2)
      matchesTab = order.statusCode === 2;
    } else if (activeTab === "3") {
      // Hoàn thành: Hoàn tất (3)
      matchesTab = order.statusCode === 3;
    } else if (activeTab === "5") {
      // Đã hủy: Yêu cầu hủy (4) hoặc Đã hủy (5)
      matchesTab = order.statusCode === 5 || order.statusCode === 4;
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
      <div className="flex flex-col items-center justify-center min-h-[300px] bg-white rounded-[10px] border border-slate-100/60 shadow-sm p-5">
        <Loader className="animate-spin text-primary mb-3" size={32} />
        <p className="text-slate-500 font-bold text-[12px]">Đang tải danh sách đơn hàng...</p>
      </div>
    );
  }

  // If an order details is selected, render the OrderDetailView component
  if (selectedOrderId !== null) {
    return (
      <OrderDetailView
        orderId={selectedOrderId}
        token={token}
        onBack={() => setSelectedOrderId(null)}
        onStatusUpdated={loadOrders}
        onChangeTab={onChangeTab}
      />
    );
  }

  return (
    <section className="bg-white rounded-[10px] p-5 shadow-sm border border-slate-100/60 w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 pb-3 border-b border-slate-100">
        <h2 className="text-[13px] font-bold text-slate-800 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-base">shopping_bag</span> Đơn mua của tôi
        </h2>
      </div>

      {/* Search Input */}
      <div className="mb-5 relative w-full">
        <input
          type="text"
          placeholder="Tìm kiếm theo mã đơn hàng, tên sản phẩm..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full min-w-0 pl-10 pr-4 py-2.5 rounded-[8px] border border-slate-200/80 focus:outline-none focus:border-primary text-[13px] font-semibold transition-colors shadow-sm"
        />
        <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[20px]">
          search
        </span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100 mb-6 overflow-x-auto scrollbar-none w-full">
        {(
          [
            { id: "all", label: "Tất cả" },
            { id: "0", label: "Chờ xử lý" },
            { id: "2", label: "Vận chuyển" },
            { id: "3", label: "Hoàn thành" },
            { id: "5", label: "Đã hủy" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 px-2 text-[12px] sm:text-[13px] font-bold border-b-2 whitespace-nowrap text-center transition-all ${activeTab === tab.id
              ? "border-primary text-primary"
              : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-md">
        {filteredOrders.length > 0 ? (
          (() => {
            const totalPages = Math.ceil(filteredOrders.length / pageSize);
            const paginatedOrders = filteredOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

            return (
              <>
                {paginatedOrders.map((order) => {
                  const isVnPay = order.payMethodCode === 3 || order.payMethodCode === 2 || order.payMethod?.includes("VNPay") || order.payMethod?.includes("Ví điện tử");
                  const canRetry = order.statusCode === 0 && isVnPay;

                  return (
                    <div
                      key={order.invoiceID}
                      className="border border-slate-100/80 rounded-[8px] overflow-hidden hover:shadow-sm transition-shadow bg-white mb-4"
                    >
                      {/* Card Header */}
                      <div className="bg-slate-50/50 px-4 py-2.5 border-b border-slate-100/80 flex flex-wrap justify-between items-center gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-slate-500 text-base">store</span>
                          <span className="font-bold text-slate-700 text-[12px]">LazPe Store</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold text-slate-400">Mã đơn: #{order.invoiceCode || order.invoiceID}</span>
                          {getStatusBadge(order.statusCode)}
                        </div>
                      </div>

                      {/* Product list */}
                      <div className="p-3 divide-y divide-slate-100/60">
                        {(() => {
                          const details = order.invoiceDetails || [];
                          const isExpanded = !!expandedOrders[order.invoiceID];
                          const displayedDetails = isExpanded ? details : details.slice(0, 1);

                          return (
                            <>
                              {displayedDetails.map((item: any, idx: number) => {
                                const isGift = item.unitPrice === 0;
                                return (
                                <div key={idx} className={`flex gap-3 py-1.5 px-2 rounded-[6px] first:mt-0 last:mb-0 transition-colors ${isGift ? 'bg-emerald-50/40 border border-emerald-100/50' : 'bg-transparent'}`}>
                                  {/* Product Image */}
                                  {item.imageUrl ? (
                                    <img
                                      src={item.imageUrl}
                                      alt={item.productName}
                                      className={`w-10 h-10 rounded-[6px] object-cover shadow-sm flex-shrink-0 border ${isGift ? 'border-emerald-200/50' : 'border-slate-100/60'}`}
                                    />
                                  ) : (
                                    <div className={`w-10 h-10 rounded-[6px] bg-gradient-to-br flex flex-shrink-0 items-center justify-center font-bold text-[10px] shadow-sm ${isGift ? 'from-emerald-100 to-emerald-200 text-emerald-600' : 'from-primary/10 to-primary/20 text-primary'}`}>
                                      LazPe
                                    </div>
                                  )}

                                  <div className="flex-1 flex flex-col md:flex-row justify-between gap-1.5 min-w-0">
                                    <div className="space-y-0.5 min-w-0 flex-1">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <h4 className={`font-bold text-[12px] md:text-[13px] line-clamp-1 min-w-0 ${isGift ? 'text-emerald-800' : 'text-slate-800'}`}>
                                          {item.productName}
                                        </h4>
                                        {isGift && (
                                          <span className="px-1.5 py-0.5 bg-emerald-500 text-white text-[8px] font-bold rounded-[4px] tracking-widest leading-none shrink-0 uppercase shadow-sm">
                                            Quà
                                          </span>
                                        )}
                                      </div>
                                      {item.variantName && (
                                        <p className={`text-[10px] font-semibold line-clamp-1 ${isGift ? 'text-emerald-600' : 'text-slate-400'}`}>{item.variantName}</p>
                                      )}
                                      <p className="text-[10px] text-slate-500 font-bold">Số lượng: x{item.quantity}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <span className={`font-bold text-[12px] md:text-[13px] ${isGift ? 'text-emerald-500' : 'text-primary'}`}>
                                        {isGift ? '0 đ' : formatPrice(item.unitPrice)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )})}

                              {details.length > 1 && (
                                <div className="pt-2 flex justify-center border-t border-slate-50">
                                  <button
                                    onClick={() => toggleOrderExpand(order.invoiceID)}
                                    className="text-[10px] font-bold text-slate-500 hover:text-primary transition-colors flex items-center gap-1 py-1 px-3 bg-slate-50 hover:bg-slate-100/80 rounded-full"
                                  >
                                    {isExpanded ? (
                                      <>
                                        Thu gọn <ChevronUp size={12} />
                                      </>
                                    ) : (
                                      <>
                                        Xem thêm {details.length - 1} sản phẩm <ChevronDown size={12} />
                                      </>
                                    )}
                                  </button>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>

                      {/* Order total & CTA */}
                      <div className="bg-slate-50/20 px-4 py-3 border-t border-slate-100/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div className="text-[11px] font-semibold text-slate-400">
                          Ngày mua: {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                        </div>

                        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 w-full sm:w-auto">
                          <div className="text-[12px] font-bold text-slate-600">
                            Thành tiền:{" "}
                            <span className="text-[14px] font-black text-primary ml-1">
                              {formatPrice(order.totalPrice + order.shippingFee - (order.shippingDiscountAmount || 0))}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
                            {order.statusCode === 3 && (
                              <button
                                onClick={() => {
                                  if (onChangeTab) {
                                    onChangeTab("reviews");
                                  } else {
                                    toast.success("Đang mở form đánh giá sản phẩm");
                                  }
                                }}
                                className="bg-primary hover:bg-primary/90 text-white px-3.5 py-1.5 rounded-[6px] font-bold text-[11px] active:scale-95 transition-all shadow-sm cursor-pointer"
                              >
                                Đánh giá
                              </button>
                            )}
                            {order.statusCode === 2 && (
                              <button
                                onClick={() => handleConfirmReceived(order.invoiceID)}
                                disabled={actionLoading}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-[6px] font-bold text-[11px] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm cursor-pointer"
                              >
                                Đã nhận hàng
                              </button>
                            )}
                            {canRetry && (
                              <button
                                onClick={() => handleRetryPayment(order.invoiceID)}
                                className="bg-primary hover:bg-primary/90 text-white px-3.5 py-1.5 rounded-[6px] font-bold text-[11px] active:scale-95 transition-all shadow-sm"
                                disabled={actionLoading}
                              >
                                Thanh toán lại
                              </button>
                            )}
                            {(order.statusCode === 3 || order.statusCode === 5) && (
                              <button
                                onClick={() => toast.success("Đã thêm sản phẩm vào giỏ hàng")}
                                className="border border-primary/30 bg-primary/5 text-primary hover:bg-primary hover:text-white px-3.5 py-1.5 rounded-[6px] font-bold text-[11px] transition-colors"
                              >
                                Mua lại
                              </button>
                            )}
                            <button
                              onClick={() => setSelectedOrderId(order.invoiceID)}
                              className="border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 px-3.5 py-1.5 rounded-[6px] font-bold text-[11px] transition-colors"
                            >
                              Chi tiết
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex justify-between items-center pt-4 text-xs font-bold text-slate-500 border-t border-slate-100 mt-6">
                    <span>
                      Hiển thị {paginatedOrders.length} trên tổng số {filteredOrders.length} đơn hàng
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <span className="text-slate-800">
                        Trang {currentPage} / {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            );
          })()
        ) : (
          <div className="text-center py-12 bg-slate-50 rounded-[10px] border border-dashed border-slate-200">
            <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">receipt_long</span>
            <p className="text-slate-500 font-semibold text-sm">Chưa có đơn hàng nào trong mục này.</p>
          </div>
        )}
      </div>
    </section>
  );
}
