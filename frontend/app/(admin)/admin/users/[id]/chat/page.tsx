"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { useParams, useRouter } from "next/navigation";
import * as signalR from "@microsoft/signalr";
import { toast } from "@/lib/toast";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import { getUserOrders } from "@/lib/api";

interface Message {
  id: number;
  chatSessionId: string;
  senderId: string | null;
  senderName: string;
  isFromAdmin: boolean;
  messageText: string;
  imageUrl: string | null;
  createdAt: string;
}

export default function AdminUserChatPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState("Đang kết nối...");
  const [clientUser, setClientUser] = useState<any>(null);
  
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showOrderPicker, setShowOrderPicker] = useState(false);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compensation States
  const [showCompensateModal, setShowCompensateModal] = useState(false);
  const [compensateTab, setCompensateTab] = useState<"voucher" | "points">("voucher");
  const [exclusiveVouchers, setExclusiveVouchers] = useState<any[]>([]);
  const [selectedCompensateInvoice, setSelectedCompensateInvoice] = useState<any>(null);
  const [compensatePoints, setCompensatePoints] = useState<number>(0);
  const [compensateReason, setCompensateReason] = useState("");
  const [selectedVoucherId, setSelectedVoucherId] = useState<number>(0);
  const [voucherMode, setVoucherMode] = useState<"select" | "create">("select");
  const [newVoucherDiscount, setNewVoucherDiscount] = useState<number>(0);
  const [newVoucherDiscountType, setNewVoucherDiscountType] = useState<number>(2); // 2: Tiền mặt, 1: %
  const [newVoucherMaxDiscount, setNewVoucherMaxDiscount] = useState<number>(0);
  const [isCompensating, setIsCompensating] = useState(false);
  const [orderSearchQuery, setOrderSearchQuery] = useState("");

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hubConnectionRef = useRef<signalR.HubConnection | null>(null);

  const complainedOrders = useMemo(() => {
    const map = new Map();
    const compensatedOrders = new Set();

    messages.forEach(m => {
      if (m.messageText?.startsWith("__COMPENSATION__::")) {
        try {
          const comp = JSON.parse(m.messageText.replace("__COMPENSATION__::", ""));
          if (comp.invoiceId) {
            compensatedOrders.add(comp.invoiceId);
          }
        } catch (e) {}
      }
    });

    messages.forEach(m => {
      if (m.messageText?.startsWith("__ORDER_CARD__::")) {
        try {
          const p = JSON.parse(m.messageText.replace("__ORDER_CARD__::", ""));
          if (!map.has(p.invoiceID) && !compensatedOrders.has(p.invoiceID)) {
            map.set(p.invoiceID, {
              invoiceID: p.invoiceID,
              invoiceCode: p.invoiceCode,
              totalPrice: p.totalPrice,
              invoiceDetails: [{ productName: p.productName }]
            });
          }
        } catch (e) {}
      }
    });
    return Array.from(map.values());
  }, [messages]);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, "")
    : "http://localhost:5101";

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!userId) return;

    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const loadData = async () => {
      try {
        // Fetch user info
        const userRes = await fetch(`${API_BASE}/api/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const userData = await userRes.json();
        if (userData.success) {
          setClientUser(userData.data);
        }

        // Fetch history
        const res = await fetch(`${API_BASE}/api/directmessage/admin/${userId}/history`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setMessages(data.messages);
        } else {
          toast.error("Không thể tải lịch sử tin nhắn");
        }
      } catch (err) {
        toast.error("Lỗi khi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };

    loadData();

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE}/directMessageHub?access_token=${token}`, {
        transport: signalR.HttpTransportType.ServerSentEvents | signalR.HttpTransportType.LongPolling
      })
      .withAutomaticReconnect()
      .build();

    connection.on("ReceiveMessage", (message: Message) => {
      if (!message.isFromAdmin) {
        toast.success("Có tin nhắn mới từ khách hàng");
      }
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
        // Loại bỏ tin nhắn tạm thời nếu có
        const next = prev.filter(m => m.id > 0 || m.messageText !== message.messageText);
        return [...next, message];
      });
    });

    connection.onreconnected(() => setConnectionStatus("Đã kết nối"));
    connection.onreconnecting(() => setConnectionStatus("Đang kết nối lại..."));
    connection.onclose(() => setConnectionStatus("Mất kết nối"));

    connection.start()
      .then(() => {
        setConnectionStatus("Đã kết nối");
        connection.invoke("JoinRoom", userId).catch(console.error);
        hubConnectionRef.current = connection;
      })
      .catch(err => {
        setConnectionStatus("Lỗi kết nối");
        console.error("SignalR DM Connection Error: ", err);
      });

    return () => {
      connection.stop();
    };
  }, [userId]);

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setInputText((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !selectedImage) return;

    const textToSend = inputText.trim();
    const fileToSend = selectedImage;
    const localPreviewUrl = imagePreview;
    const tempId = -(Date.now());
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");

    setInputText("");
    clearImage();
    
    // Reset textarea height after sending
    const textarea = document.querySelector('textarea');
    if (textarea) textarea.style.height = '42px';
    
    setMessages(prev => [...prev, {
      id: tempId,
      chatSessionId: `DM_${userId}`,
      senderId: null, // Admin sender id is not strictly needed for UI immediate display
      senderName: "Quản trị viên",
      isFromAdmin: true,
      messageText: textToSend,
      imageUrl: localPreviewUrl,
      createdAt: new Date().toISOString()
    }]);

    let uploadedImageUrl = null;

    if (fileToSend) {
      const formData = new FormData();
      formData.append("file", fileToSend);
      try {
        const uploadRes = await fetch(`${API_BASE}/api/upload/chat-image`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData
        });
        const uploadData = await uploadRes.json();
        if (uploadData.success) {
          uploadedImageUrl = uploadData.url;
        } else {
          toast.error(uploadData.message || "Lỗi upload ảnh");
          setMessages(prev => prev.filter(m => m.id !== tempId));
          return;
        }
      } catch (err) {
        toast.error("Lỗi mạng khi upload ảnh");
        setMessages(prev => prev.filter(m => m.id !== tempId));
        return;
      }
    }

    try {
      const res = await fetch(`${API_BASE}/api/directmessage/admin/${userId}/send`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ messageText: textToSend, imageUrl: uploadedImageUrl })
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => prev.map(m => m.id === tempId ? data.message : m));
      } else {
        setMessages(prev => prev.filter(m => m.id !== tempId));
        toast.error(data.message || "Không thể gửi tin nhắn");
      }
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      toast.error("Lỗi gửi tin nhắn");
    }
  };

  const sendOrderCard = async (order: any) => {
    const detail = order.invoiceDetails?.[0];
    const imageUrl = detail?.imageUrl || detail?.variant?.imageUrl || detail?.productImage || detail?.product?.images?.[0]?.imageUrl || "https://res.cloudinary.com/dtn8b2hve/image/upload/v1720108341/Product/placeholder.png";
    const productName = detail?.productName || detail?.product?.name || `Đơn hàng #${order.invoiceID}`;
    const itemsCount = order.invoiceDetails?.length || 1;
    
    let statusText = "Đang xử lý";
    if (order.status === "Pending" || order.status === 0) statusText = "Chờ xử lý";
    if (order.status === "Completed" || order.status === 3) statusText = "Đã giao";
    if (order.status === "Cancelled" || order.status === 4) statusText = "Đã hủy";

    const payload = {
      invoiceID: order.invoiceID,
      invoiceCode: order.invoiceCode,
      productName: productName,
      imageUrl: imageUrl,
      itemsCount: itemsCount,
      totalPrice: order.totalPrice,
      status: statusText
    };

    const textToSend = `__ORDER_CARD__::${JSON.stringify(payload)}`;
    const tempId = -(Date.now());
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");

    setMessages(prev => [...prev, {
      id: tempId,
      chatSessionId: `DM_${userId}`,
      senderId: null,
      senderName: "Admin",
      isFromAdmin: true,
      messageText: textToSend,
      imageUrl: null,
      createdAt: new Date().toISOString()
    }]);

    try {
      const res = await fetch(`${API_BASE}/api/directmessage/admin/${userId}/send`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ messageText: textToSend, imageUrl: null })
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => prev.map(m => m.id === tempId ? data.message : m));
      } else {
        setMessages(prev => prev.filter(m => m.id !== tempId));
        toast.error(data.message || "Không thể gửi tin nhắn");
      }
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      toast.error("Lỗi gửi tin nhắn");
    }
    setShowOrderPicker(false);
  };

  const handleCompensateSubmit = async () => {
    if (!selectedCompensateInvoice) {
      toast.error("Vui lòng chọn đơn hàng khiếu nại");
      return;
    }
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    setIsCompensating(true);

    try {
      let compensationType = "";
      let amountValue = 0;
      let textToSend = "";

      if (compensateTab === "voucher") {
        let finalVoucherId = selectedVoucherId;

        if (voucherMode === "create") {
          if (newVoucherDiscount <= 0 || (newVoucherDiscountType === 1 && newVoucherDiscount > 100)) {
            toast.error("Vui lòng nhập mức giảm giá hợp lệ.");
            setIsCompensating(false);
            return;
          }
          if (newVoucherDiscountType === 1 && newVoucherMaxDiscount <= 0) {
            toast.error("Vui lòng nhập mức giảm tối đa.");
            setIsCompensating(false);
            return;
          }

          // Gọi API tạo voucher mới
          const createRes = await fetch(`${API_BASE}/api/vouchers`, {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}` 
            },
            body: JSON.stringify({
              name: `Bồi thường mã đơn ${selectedCompensateInvoice.invoiceCode}`,
              code: `BT${Date.now()}`,
              discountValue: newVoucherDiscount,
              discountType: newVoucherDiscountType,
              minOrderValue: 0,
              maxDiscount: newVoucherDiscountType === 1 ? newVoucherMaxDiscount : newVoucherDiscount,
              totalQuantity: 1,
              status: true,
              startDate: new Date().toISOString(),
              endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              visibilityType: 2, // 2: Exclusive
              exclusiveType: 2,  // 2: DirectAssign
              voucherType: 1,    // 1: ProductDiscount
              isFreeShipping: false,
              maxShippingDiscount: 0,
              usageLimitPerUser: 1
            })
          });
          const createData = await createRes.json();
          if (createRes.ok) {
            finalVoucherId = createData.voucher?.voucherID || createData.id || createData.voucher?.id;
            amountValue = newVoucherDiscount;
            if (!finalVoucherId) {
              toast.error("Tạo voucher thành công nhưng không lấy được ID.");
              setIsCompensating(false);
              return;
            }
          } else {
            toast.error(createData.message || "Không thể tạo voucher mới.");
            setIsCompensating(false);
            return;
          }
        } else {
          if (!selectedVoucherId) {
            toast.error("Vui lòng chọn voucher để bồi thường");
            setIsCompensating(false);
            return;
          }
          const selectedVoucher = exclusiveVouchers.find(v => v.voucherID === selectedVoucherId);
          amountValue = selectedVoucher?.discountValue || 0;
        }

        // Gọi API assign voucher
        const res = await fetch(`${API_BASE}/api/vouchers/assign-direct`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            voucherID: finalVoucherId,
            userIDs: [userId]
          })
        });
        const data = await res.json();
        if (!res.ok || data.success === false) {
          toast.error(data.message || "Lỗi khi cấp voucher bồi thường");
          setIsCompensating(false);
          return;
        }

        let payloadDiscountType = 0;
        if (voucherMode === "create") {
          payloadDiscountType = newVoucherDiscountType;
        } else {
          const selectedVoucher = exclusiveVouchers.find(v => v.voucherID === selectedVoucherId);
          payloadDiscountType = (selectedVoucher?.discountType === 'Percentage' || selectedVoucher?.discountType === 1) ? 1 : 0;
        }
        
        compensationType = "voucher";
        
        textToSend = `__COMPENSATION__::${JSON.stringify({
          type: "voucher",
          invoiceId: selectedCompensateInvoice.invoiceID,
          invoiceCode: selectedCompensateInvoice.invoiceCode,
          amount: amountValue,
          discountType: payloadDiscountType,
          reason: compensateReason,
          voucherCode: (exclusiveVouchers.find(v => v.voucherID === selectedVoucherId)?.code || "")
        })}`;
        
      } else {
        if (compensatePoints <= 0) {
          toast.error("Vui lòng nhập số điểm hợp lệ");
          setIsCompensating(false);
          return;
        }
        // Gọi API bồi thường điểm
        const res = await fetch(`${API_BASE}/api/adminloyalty/compensate-points`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            userID: userId,
            invoiceID: selectedCompensateInvoice.invoiceID,
            amount: compensatePoints,
            reason: compensateReason
          })
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          toast.error(data.message || "Lỗi khi cấp điểm bồi thường");
          setIsCompensating(false);
          return;
        }
        
        compensationType = "points";
        amountValue = compensatePoints;
        
        textToSend = `__COMPENSATION__::${JSON.stringify({
          type: "points",
          invoiceId: selectedCompensateInvoice.invoiceID,
          invoiceCode: selectedCompensateInvoice.invoiceCode,
          amount: amountValue,
          reason: compensateReason
        })}`;
      }

      // Gửi tin nhắn
      const tempId = -(Date.now());
      setMessages(prev => [...prev, {
        id: tempId,
        chatSessionId: `DM_${userId}`,
        senderId: null,
        senderName: "Admin",
        isFromAdmin: true,
        messageText: textToSend,
        imageUrl: null,
        createdAt: new Date().toISOString()
      }]);

      const sendRes = await fetch(`${API_BASE}/api/directmessage/admin/${userId}/send`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ messageText: textToSend, imageUrl: null })
      });
      const sendData = await sendRes.json();
      if (sendData.success) {
        setMessages(prev => prev.map(m => m.id === tempId ? sendData.message : m));
        toast.success("Bồi thường thành công!");
        setShowCompensateModal(false);
        setSelectedCompensateInvoice(null);
        setCompensatePoints(0);
        setCompensateReason("");
        setSelectedVoucherId(0);
        setNewVoucherDiscount(0);
        setNewVoucherMaxDiscount(0);
        setVoucherMode("select");
      } else {
        setMessages(prev => prev.filter(m => m.id !== tempId));
        toast.error("Bồi thường thành công nhưng lỗi gửi tin nhắn.");
      }

    } catch (e) {
      console.error(e);
      toast.error("Có lỗi xảy ra khi xử lý bồi thường.");
    } finally {
      setIsCompensating(false);
    }
  };

  useEffect(() => {
    // Khoá cuộn màn hình ngoài (chỉ cho phép cuộn nội dung chat)
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  return (
    <div className="w-full flex flex-col h-[calc(100dvh-160px)] lg:h-[calc(117.65vh-160px)] bg-white lg:rounded-2xl border border-slate-200 overflow-hidden shadow-sm animate-in fade-in duration-300">
      <div className="flex items-center justify-between p-3 border-b border-slate-100 bg-white">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition text-slate-500 shrink-0">
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                {clientUser?.avatar ? (
                  <img src={clientUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-slate-400 text-[20px]">person</span>
                )}
              </div>
              <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-white ${connectionStatus === "Đã kết nối" ? "bg-emerald-500" : "bg-amber-500"}`}></span>
            </div>
            
            <div>
              <h2 className="font-bold text-slate-800 text-sm">{clientUser?.fullName || clientUser?.userName || "Đang tải..."}</h2>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                {clientUser?.email && <span>{clientUser.email}</span>}
                {clientUser?.email && <span>•</span>}
                <span className={connectionStatus === "Đã kết nối" ? "text-emerald-600 font-medium" : "text-amber-600 font-medium"}>{connectionStatus}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden p-4 bg-slate-50/50 space-y-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <span className="material-symbols-outlined text-4xl mb-3 opacity-30">chat</span>
            <p className="font-semibold text-slate-500 text-sm">Chưa có tin nhắn nào.</p>
            <p className="text-[12px] mt-1">Hãy gửi lời chào đến {clientUser?.fullName || "người dùng"}!</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const showAvatar = !msg.isFromAdmin && (index === 0 || messages[index - 1].isFromAdmin);
            
            return (
              <div key={msg.id} className={`flex ${msg.isFromAdmin ? "justify-end" : "justify-start gap-2"}`}>
                {!msg.isFromAdmin && (
                  <div className={`w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden shrink-0 mt-auto ${showAvatar ? 'opacity-100' : 'opacity-0'}`}>
                    {clientUser?.avatar ? (
                      <img src={clientUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-slate-400 text-[12px]">person</span>
                    )}
                  </div>
                )}
                <div className={`max-w-[70%] rounded-2xl px-3 py-2 ${msg.isFromAdmin ? "bg-blue-50/50 text-slate-800 border border-blue-100 rounded-br-sm shadow-sm" : "bg-white text-slate-800 border border-slate-200 rounded-bl-sm shadow-sm"}`}>
                  {msg.imageUrl && (
                    <div className="mb-2">
                      <img 
                        src={msg.imageUrl} 
                        alt="Chat attachment" 
                        className="rounded-lg max-w-[200px] max-h-[200px] object-contain cursor-pointer hover:opacity-90 transition-opacity" 
                        onClick={() => setZoomedImage(msg.imageUrl)}
                      />
                    </div>
                  )}
                {msg.messageText?.startsWith("__ORDER_CARD__::") ? (
                  (() => {
                    try {
                      const order = JSON.parse(msg.messageText.replace("__ORDER_CARD__::", ""));
                      const statusColor = order.status === "Đã hủy" ? "text-red-500" : order.status === "Đã giao" ? "text-green-500" : "text-orange-500";
                      return (
                        <div className="w-[200px] sm:w-[240px] bg-white rounded-lg border border-slate-200 p-2 shadow-sm my-1 cursor-pointer hover:border-primary/50 transition-colors" onClick={() => window.open(`/admin/orders/${order.invoiceID}`, '_blank')}>
                          <div className="flex gap-2">
                            <img src={order.imageUrl} alt="Product" className="w-14 h-14 object-cover rounded border border-slate-100" />
                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                              <div className="text-[11px] font-medium text-slate-800 truncate" title={order.productName}>
                                {order.productName}
                              </div>
                              <div className="text-[10px] text-slate-500 truncate mt-0.5">
                                {order.itemsCount} Sản phẩm, Tổng: {order.totalPrice?.toLocaleString('vi-VN')}đ
                              </div>
                              <div className="text-[10px] font-medium mt-1 flex justify-between items-center">
                                <span className={statusColor}>{order.status}</span>
                                <span className="text-primary cursor-pointer hover:underline">Xem đơn</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    } catch (e) {
                      return <div className="text-sm font-body-md whitespace-pre-wrap break-words leading-snug">Tin nhắn bị lỗi</div>;
                    }
                  })()
                ) : msg.messageText?.startsWith("__COMPENSATION__::") ? (
                  (() => {
                    try {
                      const comp = JSON.parse(msg.messageText.replace("__COMPENSATION__::", ""));
                      return (
                        <div className="w-[220px] sm:w-[260px] my-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                              <span className="material-symbols-outlined text-amber-600 text-lg">
                                {comp.type === 'voucher' ? 'local_activity' : 'stars'}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-amber-900 truncate">Bồi thường sự cố</div>
                              <div className="text-[10px] text-amber-700">Mã đơn: {comp.invoiceCode}</div>
                            </div>
                          </div>
                          <div className="bg-white/60 rounded-lg p-2 text-center border border-amber-100/50">
                            <div className="text-sm font-bold text-amber-600">
                              {comp.type === 'voucher' ? `Voucher giảm ${comp.discountType === 1 ? comp.amount + '%' : comp.amount.toLocaleString('vi-VN') + 'đ'}` : `+${comp.amount.toLocaleString()} Điểm`}
                            </div>
                            {comp.type === 'voucher' && comp.voucherCode && (
                              <div className="text-[10px] text-slate-500 mt-0.5 font-mono">{comp.voucherCode}</div>
                            )}
                          </div>
                          {comp.reason && (
                            <div className="text-[10px] text-slate-600 mt-2 italic line-clamp-2">
                              "{comp.reason}"
                            </div>
                          )}
                        </div>
                      );
                    } catch (e) {
                      return <div className="text-sm font-body-md">Tin nhắn bồi thường bị lỗi</div>;
                    }
                  })()
                ) : (
                  msg.messageText && <div className="text-sm font-body-md whitespace-pre-wrap break-words leading-snug">{msg.messageText}</div>
                )}
                <div className={`text-[10px] mt-1 text-right text-slate-400`}>
                    {new Date(msg.createdAt).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="relative">
        {showOrderPicker && (
          <div className="absolute bottom-full left-0 mb-2 w-full bg-white rounded-lg shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] border border-slate-100 p-3 z-40 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-semibold text-slate-700">Gợi ý đơn hàng cho khách</h4>
              <button type="button" onClick={() => setShowOrderPicker(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-full p-1 transition-colors">
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
            {loadingOrders ? (
              <div className="flex justify-center py-6"><span className="material-symbols-outlined animate-spin text-primary text-[28px]">autorenew</span></div>
            ) : recentOrders.length === 0 ? (
              <div className="text-center text-sm text-slate-500 py-6">Khách hàng chưa có đơn hàng nào gần đây</div>
            ) : (
              <div className="flex overflow-x-auto gap-3 pb-2 snap-x [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">
                {recentOrders.map(order => {
                  const detail = order.invoiceDetails?.[0];
                  // Extract image safely
                  const imageUrl = detail?.imageUrl || detail?.variant?.imageUrl || detail?.productImage || detail?.product?.images?.[0]?.imageUrl || "https://res.cloudinary.com/dtn8b2hve/image/upload/v1720108341/Product/placeholder.png";
                  const productName = detail?.productName || detail?.product?.name || `Đơn hàng #${order.invoiceID}`;
                  const itemsCount = order.invoiceDetails?.length || 1;
                  
                  // Status
                  let statusText = "Đang xử lý";
                  let statusColor = "text-orange-500";
                  if (order.status === "Pending") statusText = "Chờ xử lý";
                  if (order.status === 0) statusText = "Chờ xử lý";
                  if (order.status === "Completed") { statusText = "Đã giao"; statusColor = "text-green-500"; }
                  if (order.status === 3) { statusText = "Đã giao"; statusColor = "text-green-500"; }
                  if (order.status === "Cancelled") { statusText = "Đã hủy"; statusColor = "text-red-500"; }
                  if (order.status === 4) { statusText = "Đã hủy"; statusColor = "text-red-500"; }
                  
                  return (
                    <div key={order.invoiceID} className="shrink-0 w-[260px] border border-slate-200 rounded-lg p-2 snap-center bg-white flex gap-2 shadow-sm hover:border-blue-500/30 transition-colors">
                      <img src={imageUrl} alt="Product" className="w-16 h-16 object-cover rounded border border-slate-100" />
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div className="text-xs font-medium text-slate-800 truncate" title={productName}>
                          {productName}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate mt-0.5">
                          {itemsCount} Sản phẩm, Tổng: {order.totalPrice?.toLocaleString('vi-VN')}đ
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span className={`text-[10px] font-medium ${statusColor}`}>{statusText}</span>
                          <button 
                            type="button"
                            onClick={() => sendOrderCard(order)}
                            className="text-[10px] bg-blue-500 text-white px-2.5 py-1.5 rounded font-medium hover:bg-blue-600 transition-colors active:scale-95"
                          >
                            Gửi thẻ đơn hàng
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        {imagePreview && (
          <div className="absolute bottom-full left-0 mb-2 p-2 bg-white rounded-lg shadow-md border border-slate-200 ml-3">
            <div className="relative inline-block">
              <img src={imagePreview} alt="Preview" className="h-20 rounded object-contain" />
              <button type="button" onClick={clearImage} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            </div>
          </div>
        )}
        
        {showEmojiPicker && (
          <div className="absolute bottom-full left-10 mb-2 z-50 shadow-xl">
            <EmojiPicker onEmojiClick={onEmojiClick} />
          </div>
        )}

        <div className="p-2 bg-slate-50 border-t border-slate-100">
          <form onSubmit={handleSend} className="flex flex-col relative bg-white border border-slate-200 rounded-xl focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all shadow-sm p-1.5">
            {/* Action Icons Row */}
            <div className="flex gap-1 items-center px-1 pb-1.5 mb-1 border-b border-slate-100">
              <button type="button" onClick={() => fileInputRef.current?.click()} className="text-slate-500 hover:text-primary hover:bg-slate-100 transition-colors p-1.5 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px]">image</span>
              </button>
              
              <button 
                type="button" 
                onClick={async () => {
                  if (!showOrderPicker && recentOrders.length === 0 && userId) {
                    setLoadingOrders(true);
                    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
                    try {
                      const res = await getUserOrders(userId, token || "", "all", "", 1, 15);
                      if (res && res.items) setRecentOrders(res.items);
                    } catch (e) {
                      console.error(e);
                    } finally {
                      setLoadingOrders(false);
                    }
                  }
                  setShowOrderPicker(!showOrderPicker);
                  setShowEmojiPicker(false);
                }} 
                className={`text-slate-500 hover:text-primary hover:bg-slate-100 transition-colors p-1.5 rounded-lg flex items-center justify-center ${showOrderPicker ? 'text-primary bg-primary/5' : ''}`}
                title="Gợi ý đơn hàng"
              >
                <span className="material-symbols-outlined text-[22px]">receipt_long</span>
              </button>

              <button 
                type="button" 
                onClick={() => {
                  setShowEmojiPicker(!showEmojiPicker);
                  setShowOrderPicker(false);
                }} 
                className="text-slate-500 hover:text-primary hover:bg-slate-100 transition-colors p-1.5 rounded-lg flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[22px]">sentiment_satisfied</span>
              </button>

              <button 
                type="button" 
                onClick={async () => {
                  if (recentOrders.length === 0 && userId) {
                    setLoadingOrders(true);
                    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
                    try {
                      const res = await getUserOrders(userId, token || "", "all", "", 1, 15);
                      if (res && res.items) setRecentOrders(res.items);
                      
                      const vRes = await fetch(`${API_BASE}/api/vouchers/exclusive-direct`, {
                        headers: { Authorization: `Bearer ${token}` }
                      });
                      const vData = await vRes.json();
                      if (vData) setExclusiveVouchers(vData);
                      
                    } catch (e) {
                      console.error(e);
                    } finally {
                      setLoadingOrders(false);
                    }
                  } else {
                     if (exclusiveVouchers.length === 0) {
                        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
                        try {
                           const vRes = await fetch(`${API_BASE}/api/vouchers/exclusive-direct`, {
                             headers: { Authorization: `Bearer ${token}` }
                           });
                           const vData = await vRes.json();
                           if (vData) setExclusiveVouchers(vData);
                        } catch (e) {
                           console.error(e);
                        }
                     }
                  }
                  setShowCompensateModal(true);
                  setShowOrderPicker(false);
                  setShowEmojiPicker(false);
                }} 
                className="text-slate-500 hover:text-primary hover:bg-slate-100 transition-colors p-1.5 rounded-lg flex items-center justify-center"
                title="Bồi thường Khách hàng"
              >
                <span className="material-symbols-outlined text-[22px]">redeem</span>
              </button>
            </div>

            <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleImageSelect} />

            {/* Input Row */}
            <div className="flex gap-2 items-end px-1 pb-1">
              <textarea
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  e.target.style.height = "40px";
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !e.altKey) {
                    e.preventDefault();
                    handleSend(e as unknown as React.FormEvent);
                  }
                }}
                placeholder="Nhập tin nhắn..."
                className="flex-1 w-full bg-transparent px-3 py-2 text-sm font-body-md focus:outline-none resize-none max-h-[100px] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                rows={1}
                style={{ minHeight: "40px" }}
              />
              <button
                type="submit"
                disabled={!inputText.trim() && !selectedImage}
                className="w-10 h-10 mb-0.5 flex items-center justify-center text-primary hover:bg-primary/10 rounded-xl disabled:text-slate-300 disabled:bg-transparent disabled:cursor-not-allowed transition-all active:scale-95 shrink-0"
              >
                <span className="material-symbols-outlined text-[22px] pl-0.5">send</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Image Zoom Modal with Gallery */}
      {zoomedImage && typeof document !== "undefined" && createPortal(
        <div 
          className="fixed inset-0 z-[99999] flex bg-[#0f0f0f] animate-in fade-in duration-200"
        >
          {/* Main Image Area */}
          <div className="flex-1 flex items-center justify-center p-4 relative" onClick={() => setZoomedImage(null)}>
            <img 
              src={zoomedImage} 
              alt="Zoomed image" 
              className="max-w-full max-h-full object-contain shadow-2xl cursor-zoom-out"
              onClick={(e) => {
                 e.stopPropagation();
                 setZoomedImage(null);
              }}
            />
            <button 
              className="absolute top-4 left-4 text-white hover:text-red-400 transition-colors p-2 bg-black/50 hover:bg-black/80 rounded-full flex items-center justify-center z-10"
              onClick={(e) => {
                e.stopPropagation();
                setZoomedImage(null);
              }}
            >
              <span className="material-symbols-outlined text-[28px]">close</span>
            </button>
          </div>

          {/* Right Sidebar Gallery */}
          <div className="w-28 bg-[#1a1a1a] border-l border-[#2a2a2a] flex flex-col h-full shrink-0 shadow-xl">
            <div className="py-3 text-center border-b border-[#2a2a2a]">
              <h3 className="text-white font-medium text-[12px]">Tất cả ảnh</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2 [&::-webkit-scrollbar]:hidden">
              {messages.filter(m => m.imageUrl).reverse().map((msg, i, arr) => {
                const currentDate = new Date(msg.createdAt).toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit' });
                const prevDate = i > 0 ? new Date(arr[i-1].createdAt).toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit' }) : null;
                const isSelected = msg.imageUrl === zoomedImage;

                return (
                  <React.Fragment key={msg.id}>
                    {currentDate !== prevDate && (
                      <div className="text-[#888] text-[10px] font-medium text-center pt-2 pb-1">{currentDate}</div>
                    )}
                    <div 
                      className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all group bg-[#111] aspect-square ${isSelected ? 'border-primary' : 'border-transparent hover:border-[#444]'}`}
                      onClick={() => setZoomedImage(msg.imageUrl)}
                    >
                      <img src={msg.imageUrl!} className="w-full h-full object-contain" alt="Gallery item" />
                      {isSelected && <div className="absolute inset-0 bg-primary/10"></div>}
                      {!isSelected && <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors"></div>}
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}

      {showCompensateModal && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]" style={{ width: '100%', maxWidth: '850px' }}>
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">redeem</span>
                Bồi thường Khách hàng
              </h3>
              <button onClick={() => setShowCompensateModal(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 p-1 rounded-full transition-colors">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
            
            <div className="flex-1 flex flex-col md:flex-row min-h-0">
              {/* Cột trái: Bước 1: Chọn Đơn Hàng */}
              <div className="w-full md:w-[45%] p-5 border-b md:border-b-0 md:border-r border-slate-100 overflow-y-auto">
                <div className="mb-2">
                  <label className="block text-sm font-medium text-slate-700">1. Chọn đơn hàng khiếu nại <span className="text-red-500">*</span></label>
                  <p className="text-[11px] text-slate-500 italic mt-0.5">Lưu ý: Mỗi đơn hàng chỉ được bồi thường tối đa 1 lần</p>
                </div>
                <div className="relative mb-3">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
                  <input
                    type="text"
                    placeholder="Tìm theo mã đơn hàng..."
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-shadow"
                    value={orderSearchQuery}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                  />
                </div>
                {complainedOrders.length > 0 ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {complainedOrders
                      .filter(order => {
                        if (!orderSearchQuery.trim()) return true;
                        const code = (order.invoiceCode || order.invoiceID.toString()).toLowerCase();
                        return code.includes(orderSearchQuery.trim().toLowerCase());
                      })
                      .map(order => (
                      <div 
                        key={order.invoiceID} 
                        onClick={() => setSelectedCompensateInvoice(order)}
                        className={`p-2 border rounded-lg cursor-pointer transition-colors ${selectedCompensateInvoice?.invoiceID === order.invoiceID ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-primary/30'}`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-sm text-slate-700">Mã đơn {order.invoiceCode}</span>
                          <span className="text-xs text-primary font-semibold">{order.totalPrice.toLocaleString('vi-VN')} đ</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1 line-clamp-1">
                          {order.invoiceDetails?.[0]?.productName || 'Không có tên sản phẩm'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-slate-500 border border-slate-200 p-3 rounded-lg bg-slate-50">Khách hàng chưa có khiếu nại đơn hàng nào.</div>
                )}
              </div>

              {/* Cột phải: Bước 2 và Lý do */}
              <div className="w-full md:w-[55%] p-5 overflow-y-auto bg-slate-50/30">
                {selectedCompensateInvoice ? (
                  <>
                    <div className="mb-5">
                      <label className="block text-sm font-medium text-slate-700 mb-2">2. Hình thức bồi thường</label>
                      <div className="flex border border-slate-200 rounded-lg overflow-hidden mb-4 bg-white">
                        <button 
                          className={`flex-1 py-2 text-sm font-medium transition-colors ${compensateTab === 'voucher' ? 'bg-primary/10 text-primary border-b-2 border-primary' : 'text-slate-600 hover:bg-slate-50'}`}
                          onClick={() => setCompensateTab("voucher")}
                        >
                          Tặng Voucher
                        </button>
                        <button 
                          className={`flex-1 py-2 text-sm font-medium transition-colors border-l border-slate-100 ${compensateTab === 'points' ? 'bg-primary/10 text-primary border-b-2 border-primary' : 'text-slate-600 hover:bg-slate-50'}`}
                          onClick={() => setCompensateTab("points")}
                        >
                          Tặng Điểm
                        </button>
                      </div>

                    {compensateTab === "voucher" ? (
                      <div className="space-y-4">
                        <div className="flex gap-4 border-b border-slate-100 pb-3">
                          <label className="flex items-center gap-1.5 text-sm cursor-pointer group">
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${voucherMode === "select" ? "border-primary bg-primary" : "border-slate-300"}`}>
                              {voucherMode === "select" && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                            </div>
                            <input type="radio" className="hidden" checked={voucherMode === "select"} onChange={() => setVoucherMode("select")} />
                            <span className={`transition-colors ${voucherMode === "select" ? "text-primary font-medium" : "text-slate-600 group-hover:text-slate-800"}`}>Chọn có sẵn</span>
                          </label>
                          <label className="flex items-center gap-1.5 text-sm cursor-pointer group">
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${voucherMode === "create" ? "border-primary bg-primary" : "border-slate-300"}`}>
                              {voucherMode === "create" && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                            </div>
                            <input type="radio" className="hidden" checked={voucherMode === "create"} onChange={() => setVoucherMode("create")} />
                            <span className={`transition-colors ${voucherMode === "create" ? "text-primary font-medium" : "text-slate-600 group-hover:text-slate-800"}`}>Tạo voucher mới</span>
                          </label>
                        </div>

                        {voucherMode === "select" ? (
                          <div className="animate-in fade-in slide-in-from-top-1">
                            <select 
                              className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white"
                            value={selectedVoucherId}
                            onChange={(e) => setSelectedVoucherId(Number(e.target.value))}
                          >
                            <option value={0}>-- Chọn Voucher Độc quyền --</option>
                            {exclusiveVouchers.map(v => (
                              <option key={v.voucherID} value={v.voucherID}>
                                {v.name} - {v.discountType === 'Percentage' || v.discountType === 1 ? `Giảm ${v.discountValue}%` : `Giảm ${v.discountValue.toLocaleString()}đ`} (Còn {v.remainingQuantity})
                              </option>
                            ))}
                          </select>
                          {exclusiveVouchers.length === 0 && (
                            <p className="text-xs text-red-500 mt-1">Không có voucher bồi thường (Exclusive/DirectAssign) nào khả dụng.</p>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-4 p-4 border border-blue-100 bg-blue-50/30 rounded-xl animate-in fade-in slide-in-from-top-1">
                          <div>
                            <label className="block text-[13px] font-medium text-slate-700 mb-2">Loại giảm giá</label>
                            <div className="flex gap-5">
                              <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                                <input type="radio" checked={newVoucherDiscountType === 2} onChange={() => setNewVoucherDiscountType(2)} className="accent-primary" />
                                <span className="text-slate-600">Tiền mặt (đ)</span>
                              </label>
                              <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                                <input type="radio" checked={newVoucherDiscountType === 1} onChange={() => setNewVoucherDiscountType(1)} className="accent-primary" />
                                <span className="text-slate-600">Phần trăm (%)</span>
                              </label>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[13px] font-medium text-slate-700 mb-1">
                                {newVoucherDiscountType === 2 ? "Mức giảm (đ)" : "Mức giảm (%)"}
                              </label>
                              <input
                                type="number"
                                min={1}
                                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white"
                                placeholder={newVoucherDiscountType === 2 ? "VD: 20000" : "VD: 10"}
                                value={newVoucherDiscount || ''}
                                onChange={(e) => setNewVoucherDiscount(Number(e.target.value))}
                              />
                            </div>
                            
                            {newVoucherDiscountType === 1 && (
                              <div className="animate-in fade-in">
                                <label className="block text-[13px] font-medium text-slate-700 mb-1">Giảm tối đa (đ)</label>
                                <input
                                  type="number"
                                  min={1}
                                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white"
                                  placeholder="VD: 50000"
                                  value={newVoucherMaxDiscount || ''}
                                  onChange={(e) => setNewVoucherMaxDiscount(Number(e.target.value))}
                                />
                              </div>
                            )}
                          </div>
                          
                          <p className="text-xs text-slate-500 mt-1">Voucher sẽ được tạo với thời hạn 30 ngày và tự động gửi thẳng cho khách.</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="animate-in fade-in slide-in-from-top-1 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <input 
                          type="number" 
                          min={1}
                          className="flex-1 border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                          placeholder="Nhập số điểm..."
                          value={compensatePoints || ''}
                          onChange={(e) => setCompensatePoints(Number(e.target.value))}
                        />
                        <span className="text-sm text-slate-600 font-medium">Điểm</span>
                      </div>
                      <p className="text-[13px] text-slate-500 flex justify-between mt-3">
                        <span>Giới hạn: 50% đơn hàng</span>
                        <span className="font-semibold text-primary">Tối đa: {Math.floor(selectedCompensateInvoice.totalPrice * 0.5).toLocaleString()} điểm</span>
                      </p>
                      {compensatePoints > selectedCompensateInvoice.totalPrice * 0.5 && (
                         <p className="text-xs text-red-500 mt-2 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">error</span> Số điểm vượt quá giới hạn cho phép!</p>
                      )}
                    </div>
                  )}
                    </div>

                  <div className="mt-5">
                    <label className="block text-sm font-medium text-slate-700 mb-2">3. Lý do bồi thường</label>
                    <textarea 
                      className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none h-20 bg-white"
                      placeholder="Nhập ghi chú nguyên nhân để lưu trữ (bắt buộc)..."
                      value={compensateReason}
                      onChange={(e) => setCompensateReason(e.target.value)}
                    ></textarea>
                  </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-60">
                    <span className="material-symbols-outlined text-[48px] mb-2">redeem</span>
                    <p className="text-sm font-medium">Vui lòng chọn đơn hàng ở bên trái trước</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-white">
              <button 
                onClick={() => setShowCompensateModal(false)}
                className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
              >
                Đóng
              </button>
              <button 
                onClick={handleCompensateSubmit}
                disabled={isCompensating || !selectedCompensateInvoice || (compensateTab === 'voucher' && !selectedVoucherId && voucherMode === 'select') || (compensateTab === 'points' && (compensatePoints <= 0 || compensatePoints > selectedCompensateInvoice.totalPrice * 0.5))}
                className="px-5 py-2.5 text-sm font-medium text-white bg-primary hover:bg-primary/90 disabled:bg-primary/50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2 shadow-sm"
              >
                {isCompensating ? <span className="material-symbols-outlined animate-spin text-[18px]">sync</span> : <span className="material-symbols-outlined text-[18px]">send</span>}
                Xác nhận Bồi thường
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
