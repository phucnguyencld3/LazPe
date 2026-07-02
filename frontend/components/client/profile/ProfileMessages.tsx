import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
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

interface ProfileMessagesProps {
  token: string | null;
  pendingSupportOrder?: any;
  clearPendingSupportOrder?: () => void;
}

export const ProfileMessages: React.FC<ProfileMessagesProps> = ({ token, pendingSupportOrder, clearPendingSupportOrder }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState("Đang kết nối...");
  const [userId, setUserId] = useState<string | null>(null);
  
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showOrderPicker, setShowOrderPicker] = useState(false);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hubConnectionRef = useRef<signalR.HubConnection | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, "")
    : "http://localhost:5101";

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    let uid = null;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      uid = payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] || payload.nameid;
      setUserId(uid);
    } catch (e) {
      console.error("Lỗi phân tích token", e);
    }

    const loadHistory = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/directmessage/history`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setMessages(data.messages);
        } else {
          toast.error("Không thể tải lịch sử tin nhắn");
        }
      } catch (err) {
        toast.error("Lỗi khi tải lịch sử");
      } finally {
        setLoading(false);
      }
    };

    loadHistory();

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE}/directMessageHub?access_token=${token}`, {
        transport: signalR.HttpTransportType.ServerSentEvents | signalR.HttpTransportType.LongPolling
      })
      .withAutomaticReconnect()
      .build();

    connection.on("ReceiveMessage", (message: Message) => {
      if (message.isFromAdmin) {
        toast.success("Bạn có tin nhắn mới từ Quản trị viên");
      }
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
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
        if (uid) {
          connection.invoke("JoinRoom", uid).catch(console.error);
        }
        hubConnectionRef.current = connection;
      })
      .catch(err => {
        setConnectionStatus("Lỗi kết nối");
        console.error("SignalR DM Connection Error: ", err);
      });

    return () => {
      connection.stop();
    };
  }, [token]);

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

    setInputText("");
    clearImage();
    
    // Reset textarea height after sending
    const textarea = document.querySelector('textarea');
    if (textarea) textarea.style.height = '42px';
    
    setMessages(prev => [...prev, {
      id: tempId,
      chatSessionId: `DM_${userId}`,
      senderId: userId,
      senderName: "Tôi",
      isFromAdmin: false,
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
      const res = await fetch(`${API_BASE}/api/directmessage/send`, {
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

    setMessages(prev => [...prev, {
      id: tempId,
      chatSessionId: `DM_${userId}`,
      senderId: userId,
      senderName: "Tôi",
      isFromAdmin: false,
      messageText: textToSend,
      imageUrl: null,
      createdAt: new Date().toISOString()
    }]);

    try {
      const res = await fetch(`${API_BASE}/api/directmessage/send`, {
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

  useEffect(() => {
    if (pendingSupportOrder && userId) {
      sendOrderCard(pendingSupportOrder);
      if (clearPendingSupportOrder) {
        clearPendingSupportOrder();
      }
    }
  }, [pendingSupportOrder, userId]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-3 flex flex-col h-[calc(100dvh-120px)] sm:h-[650px] sm:max-h-[calc(100vh-120px)] sticky top-24 animate-in fade-in duration-300">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
        <div>
          <h2 className="text-sm text-primary font-bold">Trò chuyện hỗ trợ</h2>
          <p className="text-[11px] text-on-surface-variant/70 mt-0">Lịch sử trò chuyện này sẽ được lưu giữ vĩnh viễn.</p>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-50 px-2 py-1 rounded-full border border-slate-200">
          <span className={`w-2 h-2 rounded-full ${connectionStatus === "Đã kết nối" ? "bg-emerald-500" : "bg-amber-500"}`}></span>
          {connectionStatus}
        </div>
      </div>

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden mb-4 space-y-4 bg-slate-50/50 rounded-2xl p-4 border border-slate-100 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <span className="material-symbols-outlined text-5xl mb-3 opacity-30">chat</span>
            <p className="font-semibold text-slate-500">Chưa có cuộc trò chuyện nào.</p>
            <p className="text-sm">Hãy gửi tin nhắn để được hỗ trợ nhanh nhất!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex ${!msg.isFromAdmin ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-2xl px-3 py-2 ${!msg.isFromAdmin ? "bg-blue-50/50 text-slate-800 border border-blue-100 rounded-br-sm shadow-sm" : "bg-white text-on-surface border border-slate-200 rounded-bl-sm shadow-sm"}`}>
                {msg.isFromAdmin && <div className="text-[11px] font-bold text-primary mb-0.5">Quản trị viên LazPe</div>}
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
                        <div className="w-[200px] sm:w-[240px] bg-white rounded-lg border border-slate-200 p-2 shadow-sm my-1" onClick={() => window.location.href = `/profile?tab=orders&id=${order.invoiceID}`}>
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
                                <span className="text-primary cursor-pointer hover:underline">Chi tiết</span>
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
          ))
        )}
      </div>

      <div className="relative">
        {showOrderPicker && (
          <div className="absolute bottom-full left-0 mb-2 w-full bg-white rounded-lg shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] border border-slate-100 p-3 z-40 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-semibold text-slate-700">Chọn đơn hàng cần hỗ trợ</h4>
              <button type="button" onClick={() => setShowOrderPicker(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-full p-1 transition-colors">
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
            {loadingOrders ? (
              <div className="flex justify-center py-6"><span className="material-symbols-outlined animate-spin text-primary text-[28px]">autorenew</span></div>
            ) : recentOrders.length === 0 ? (
              <div className="text-center text-sm text-slate-500 py-6">Không có đơn hàng nào gần đây</div>
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
                    <div key={order.invoiceID} className="shrink-0 w-[260px] border border-slate-200 rounded-lg p-2 snap-center bg-white flex gap-2 shadow-sm hover:border-primary/30 transition-colors">
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
                            className="text-[10px] bg-[#f05d40] text-white px-2.5 py-1.5 rounded font-medium hover:bg-[#d84d30] transition-colors active:scale-95"
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
          <div className="absolute bottom-full left-0 mb-2 p-2 bg-white rounded-lg shadow-md border border-slate-200">
            <div className="relative inline-block">
              <img src={imagePreview} alt="Preview" className="h-20 rounded object-contain" />
              <button type="button" onClick={clearImage} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            </div>
          </div>
        )}
        
        {showEmojiPicker && (
          <div className="absolute bottom-full right-0 mb-2 z-50 shadow-xl">
            <EmojiPicker onEmojiClick={onEmojiClick} />
          </div>
        )}

        <form onSubmit={handleSend} className="flex flex-col relative mt-2 p-1.5 border border-slate-200 rounded-2xl bg-white focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all shadow-sm">
          {/* Action Icons Row */}
          <div className="flex gap-1 items-center px-1 pb-1.5 mb-1 border-b border-slate-100">
            <button type="button" onClick={() => fileInputRef.current?.click()} className="text-slate-500 hover:text-primary hover:bg-slate-100 transition-colors p-1.5 rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">image</span>
            </button>
            
            <button 
              type="button" 
              onClick={async () => {
                if (!showOrderPicker && recentOrders.length === 0 && userId && token) {
                  setLoadingOrders(true);
                  try {
                    const res = await getUserOrders(userId, token, "all", "", 1, 15);
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
              title="Hỗ trợ đơn hàng"
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
          </div>
          
          <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleImageSelect} />

          {/* Input Row */}
          <div className="flex gap-2 items-end">
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
              placeholder="Nhập tin nhắn để được hỗ trợ..."
              className="flex-1 w-full bg-transparent px-3 py-2 text-sm font-body-md focus:outline-none resize-none max-h-[100px] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
              rows={1}
              style={{ minHeight: "40px" }}
            />
            <button
              type="submit"
              disabled={!inputText.trim() && !selectedImage}
              className="w-10 h-10 mb-0.5 shrink-0 flex items-center justify-center text-primary hover:bg-primary/10 rounded-xl disabled:text-slate-300 disabled:bg-transparent disabled:cursor-not-allowed transition-all active:scale-95 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[22px] pl-0.5">send</span>
            </button>
          </div>
        </form>
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
    </div>
  );
}
