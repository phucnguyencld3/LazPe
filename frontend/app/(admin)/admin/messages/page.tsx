/* eslint-disable */
"use client";

import React, { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import * as signalR from "@microsoft/signalr";
import { toast } from "sonner";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getUserOrders } from "@/lib/api";

// --- Messenger Card Components ---

const MessengerOrderCard = ({ msgText, onZoomImage }: { msgText: string, onZoomImage?: (url: string) => void }) => {
  try {
    const jsonStr = msgText.replace(/^(__ORDER_CARD__|ORDER_CARD)::/, "");
    const order = JSON.parse(jsonStr);
    const statusColor = order.status === "Đã hủy" 
      ? "bg-rose-50 text-rose-600 border-rose-200" 
      : order.status === "Đã giao" 
      ? "bg-emerald-50 text-emerald-600 border-emerald-200" 
      : "bg-amber-50 text-amber-600 border-amber-200";

    return (
      <div 
        className="w-full max-w-[340px] bg-white rounded-2xl border border-slate-200 p-3.5 shadow-sm hover:shadow-md transition-all my-1.5 cursor-pointer hover:border-primary/60 group text-slate-800 text-left"
        onClick={() => window.open(`/admin/orders/${order.invoiceID}`, '_blank')}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <span className="material-symbols-outlined text-base text-primary">receipt_long</span>
            Mã đơn: #{order.invoiceCode || order.invoiceID}
          </span>
          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${statusColor}`}>
            {order.status || "Đang xử lý"}
          </span>
        </div>
        
        <div className="flex gap-3 items-center">
          <img 
            src={order.imageUrl || '/assets/img/products/default-product.jpg'} 
            alt="Product" 
            className="w-14 h-14 object-cover rounded-xl border border-slate-100 shrink-0 bg-slate-50" 
            onClick={(e) => {
              if (onZoomImage && order.imageUrl) {
                e.stopPropagation();
                onZoomImage(order.imageUrl);
              }
            }}
          />
          <div className="flex-1 min-w-0 flex flex-col justify-between">
            <h5 className="text-xs font-semibold text-slate-800 line-clamp-2 leading-snug group-hover:text-primary transition-colors" title={order.productName}>
              {order.productName}
            </h5>
            <div className="text-[11px] text-slate-500 mt-1 flex justify-between items-center">
              <span>{order.itemsCount || 1} sản phẩm</span>
              <span className="font-bold text-rose-600">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalPrice || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (e) {
    return <div className="text-xs text-rose-500 font-medium">Tin nhắn thẻ đơn hàng bị lỗi</div>;
  }
};

const MessengerCompensationCard = ({ msgText }: { msgText: string }) => {
  try {
    const jsonStr = msgText.replace(/^(__COMPENSATION__|COMPENSATION)::/, "");
    const comp = JSON.parse(jsonStr);

    return (
      <div className="w-full max-w-[320px] bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100/60 border border-amber-200/90 rounded-2xl p-3.5 shadow-sm my-1.5 text-left">
        <div className="flex items-center gap-2.5 mb-2.5 border-b border-amber-200/60 pb-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 text-white flex items-center justify-center shrink-0 shadow-sm">
            <span className="material-symbols-outlined text-lg">
              {comp.type === 'voucher' ? 'local_activity' : 'stars'}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-amber-950 truncate">Bồi thường sự cố</div>
            <div className="text-[10px] text-amber-700 font-medium">Mã đơn: #{comp.invoiceCode || comp.invoiceId}</div>
          </div>
        </div>
        <div className="bg-white/90 backdrop-blur rounded-xl p-2.5 text-center border border-amber-200/80 shadow-inner">
          <div className="text-sm font-extrabold text-amber-600">
            {comp.type === 'voucher' 
              ? `Voucher giảm ${comp.discountType === 1 ? comp.amount + '%' : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(comp.amount || 0)}` 
              : `+${(comp.amount || 0).toLocaleString('vi-VN')} Điểm thưởng`}
          </div>
          {comp.type === 'voucher' && comp.voucherCode && (
            <div className="text-[10px] text-slate-500 mt-1 font-mono font-bold tracking-widest bg-amber-50/80 py-0.5 px-2 rounded w-fit mx-auto border border-amber-200/40">
              {comp.voucherCode}
            </div>
          )}
        </div>
        {comp.reason && (
          <div className="text-[11px] text-slate-600 mt-2 italic line-clamp-2 bg-amber-100/50 p-2 rounded-lg text-center">
            "{comp.reason}"
          </div>
        )}
      </div>
    );
  } catch (e) {
    return <div className="text-xs text-rose-500 font-medium">Tin nhắn thẻ bồi thường bị lỗi</div>;
  }
};

const MessengerProductCard = ({ data, onZoomImage }: { data: any, onZoomImage?: (url: string) => void }) => {
  return (
    <div className="flex bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all my-2 w-full max-w-[340px] text-left">
      <div 
        className="shrink-0 bg-slate-50 flex items-center justify-center p-2 border-r border-slate-100 self-stretch cursor-pointer hover:opacity-80 transition-opacity"
        style={{ width: '80px', minWidth: '80px' }}
        onClick={() => onZoomImage && onZoomImage(data.imageUrl || '/assets/img/products/default-product.jpg')}
        title="Phóng to ảnh"
      >
        <img src={data.imageUrl || '/assets/img/products/default-product.jpg'} alt={data.name} className="max-w-full object-contain mix-blend-multiply" style={{ maxHeight: '60px' }} />
      </div>
      <div className="p-2.5 flex flex-col justify-center flex-1 min-w-0 gap-1">
        <h4 className="text-xs font-semibold text-slate-800 leading-snug line-clamp-2" title={data.name}>
          {data.name}
        </h4>
        <div className="flex items-center justify-between mt-1">
          <span className="text-primary font-bold text-sm truncate pr-1">
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(data.price || 0)}
          </span>
          <span className="text-[10px] text-slate-400 font-medium px-2 py-0.5 bg-slate-100 rounded-full">
            Sản phẩm
          </span>
        </div>
      </div>
    </div>
  );
};

// --- Interfaces ---

interface CustomerUser {
  id: string;
  fullName: string;
  email: string;
  avatar?: string;
  lastMessageText?: string;
  updatedAt?: string;
  unreadCount?: number;
}

interface Message {
  id: number;
  chatSessionId: string;
  senderId: string | null;
  senderName: string;
  isFromAdmin: boolean;
  messageText: string | null;
  imageUrl: string | null;
  createdAt: string;
}

const normalizeMessage = (msg: any): Message => {
  if (!msg) return msg;
  const rawText = msg.messageText !== undefined ? msg.messageText : msg.MessageText;
  const rawImg = msg.imageUrl !== undefined ? msg.imageUrl : (msg.ImageUrl !== undefined ? msg.ImageUrl : null);

  return {
    id: msg.id !== undefined ? msg.id : msg.Id,
    chatSessionId: msg.chatSessionId !== undefined ? msg.chatSessionId : msg.ChatSessionId,
    senderId: msg.senderId !== undefined ? msg.senderId : msg.SenderId,
    senderName: msg.senderName !== undefined ? msg.senderName : msg.SenderName,
    isFromAdmin: msg.isFromAdmin !== undefined ? msg.isFromAdmin : msg.IsFromAdmin,
    messageText: rawText || null,
    imageUrl: rawImg || null,
    createdAt: msg.createdAt !== undefined ? msg.createdAt : msg.CreatedAt
  };
};

const isMediaUrl = (text: string | null): boolean => {
  if (!text) return false;
  const trimmed = text.trim();
  return trimmed.startsWith("http://") || trimmed.startsWith("https://") ? 
         (/\.(jpeg|jpg|gif|png|webp|svg)($|\?)/i.test(trimmed) || trimmed.includes("giphy.com/media") || trimmed.includes("media.tenor.com")) : false;
};

const EMOJIS = [
  "😀", "😁", "😂", "🤣", "😃", "😄", "😅", "😆", "😉", "😊", "😋", "😎", "😍", "😘", "🥰", "😗", 
  "😙", "😚", "☺️", "🙂", "🤗", "🤔", "🫣", "🤭", "🫢", "🫡", "🤨", "😐", "😑", "😶", "🫥", "😏", 
  "😒", "🙄", "😬", "🤥", "😌", "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕", "🤢", "🤮", "🤧", "🥵", 
  "🥶", "🥴", "😵", "😵‍💫", "🤯", "🤠", "🥳", "🥸", "😎", "🤓", "🧐", "😕", "😟", "🙁", "☹️", "😮", 
  "😯", "😲", "😳", "🥺", "🥹", "😦", "😧", "😨", "😰", "😥", "😢", "😭", "😱", "😖", "😣", "😞", 
  "😓", "😩", "😫", "🥱", "😤", "😡", "😠", "🤬", "😈", "👿", "💀", "☠️", "💩", "🤡", "👹", "👺", 
  "👻", "👽", "👾", "🤖", "😺", "😸", "😹", "😻", "😼", "😽", "🙀", "😿", "😾", "👋", "👍", "👎", 
  "🙌", "👏", "🤝", "🙏", "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "💔", "❣️", "💕", "💞"
];

const STICKERS = [
  { name: "Xin chào", url: "https://media.giphy.com/media/3oz8xAFtqo0LGR2UXm/giphy.gif" },
  { name: "Yêu thích", url: "https://media.giphy.com/media/LpDbTWtG2vHRI27n7n/giphy.gif" },
  { name: "Cảm ơn", url: "https://media.giphy.com/media/26FLdmIp6wJr91JAI/giphy.gif" },
  { name: "Nhảy múa", url: "https://media.giphy.com/media/13CoXDiaCcC2EA/giphy.gif" },
  { name: "Khóc nhè", url: "https://media.giphy.com/media/10tIqpQmgOIGAL/giphy.gif" },
  { name: "Vỗ tay", url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExaG96cTVpZ3ZidW5pOWg3ZnY5YjNmYmF5azg4MHgyaXAwZmZ6ZWt3ZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/C9x8gX02SnMIoAClQt/giphy.gif" }
];

function AdminMessengerContent() {
  const searchParams = useSearchParams();
  const userParam = searchParams.get("user");
  const router = useRouter();

  const [customers, setCustomers] = useState<CustomerUser[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentAdmin, setCurrentAdmin] = useState<{ id: string; fullName: string } | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerTab, setPickerTab] = useState<"emoji" | "sticker">("emoji");
  const [connectionStatus, setConnectionStatus] = useState<string>("Đang kết nối...");
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // Order picker & Attachment state
  const [showOrderPicker, setShowOrderPicker] = useState(false);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compensation Modal state
  const [showCompensateModal, setShowCompensateModal] = useState(false);
  const [compensateTab, setCompensateTab] = useState<"voucher" | "points">("voucher");
  const [exclusiveVouchers, setExclusiveVouchers] = useState<any[]>([]);
  const [selectedCompensateInvoice, setSelectedCompensateInvoice] = useState<any>(null);
  const [compensatePoints, setCompensatePoints] = useState<number>(0);
  const [compensateReason, setCompensateReason] = useState("");
  const [selectedVoucherId, setSelectedVoucherId] = useState<number>(0);
  const [voucherMode, setVoucherMode] = useState<"select" | "create">("select");
  const [newVoucherDiscount, setNewVoucherDiscount] = useState<number>(0);
  const [newVoucherDiscountType, setNewVoucherDiscountType] = useState<number>(2);
  const [newVoucherMaxDiscount, setNewVoucherMaxDiscount] = useState<number>(0);
  const [isCompensating, setIsCompensating] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hubConnectionRef = useRef<signalR.HubConnection | null>(null);
  const selectedCustomerRef = useRef<CustomerUser | null>(null);

  useEffect(() => {
    selectedCustomerRef.current = selectedCustomer;
  }, [selectedCustomer]);

  const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5101").replace(/\/api$/, "");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    loadCustomers();
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (token) {
      setupSignalR(token);
    }
    fetchCurrentAdmin();

    return () => {
      if (hubConnectionRef.current) {
        hubConnectionRef.current.stop();
      }
    };
  }, []);

  const fetchCurrentAdmin = async () => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${API_BASE}/api/Authentication/current-user`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.user) {
        setCurrentAdmin({ id: data.user.id, fullName: data.user.fullName });
      }
    } catch (e) {
      console.error("Lỗi lấy thông tin admin", e);
    }
  };

  const loadCustomers = async () => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return;

      // Load sessions from /api/chat/admin/sessions to extract customer list
      const res = await fetch(`${API_BASE}/api/chat/admin/sessions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.sessions) {
        // Map sessions into CustomerUser objects (only for registered users or named sessions)
        const custMap = new Map<string, CustomerUser>();
        
        data.sessions.forEach((s: any) => {
          const uid = s.userId || s.id.replace("DM_", "");
          if (uid && !custMap.has(uid)) {
            custMap.set(uid, {
              id: uid,
              fullName: s.customerName || "Khách hàng",
              email: s.userId ? `ID: ${s.userId.substring(0, 8)}...` : "Khách vãng lai",
              avatar: s.customerAvatar,
              lastMessageText: s.lastMessageText,
              updatedAt: s.updatedAt,
              unreadCount: s.unreadByAdmin || 0
            });
          }
        });

        const list = Array.from(custMap.values());
        list.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
        setCustomers(list);

        // Auto select specified user or first customer
        if (userParam) {
          const target = list.find(c => c.id === userParam);
          if (target) {
            selectCustomer(target);
          } else {
            // Fetch single user details if not in session list
            fetchUserDetails(userParam);
          }
        } else if (list.length > 0 && !selectedCustomerRef.current) {
          selectCustomer(list[0]);
        }
      }
    } catch (e) {
      toast.error("Không thể tải danh sách cuộc trò chuyện Messenger.");
    }
  };

  const fetchUserDetails = async (uid: string) => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${API_BASE}/api/users/${uid}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.data) {
        const u = data.data;
        const cust: CustomerUser = {
          id: u.id,
          fullName: u.fullName || u.userName || "Khách hàng",
          email: u.email || "",
          avatar: u.avatar
        };
        setCustomers(prev => [cust, ...prev.filter(c => c.id !== u.id)]);
        selectCustomer(cust);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadMessages = async (userId: string) => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${API_BASE}/api/directmessage/admin/${userId}/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages.map(normalizeMessage));
        
        // Reset unread count locally
        setCustomers(prev => prev.map(c => c.id === userId ? { ...c, unreadCount: 0 } : c));
      }
    } catch (e) {
      toast.error("Không thể tải lịch sử tin nhắn Messenger.");
    }
  };

  const setupSignalR = async (token: string) => {
    if (hubConnectionRef.current) {
      await hubConnectionRef.current.stop();
    }

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE}/directMessageHub?access_token=${token}`, {
        transport: signalR.HttpTransportType.ServerSentEvents | signalR.HttpTransportType.LongPolling
      })
      .withAutomaticReconnect()
      .build();

    hubConnectionRef.current = connection;

    connection.on("ReceiveMessage", (message: Message) => {
      const normalized = normalizeMessage(message);
      
      const currentCust = selectedCustomerRef.current;
      if (currentCust && (normalized.chatSessionId === `DM_${currentCust.id}` || normalized.senderId === currentCust.id)) {
        setMessages(prev => {
          const filtered = prev.filter(m => m.id > 0);
          if (filtered.some(m => m.id === normalized.id)) return filtered;
          return [...filtered, normalized];
        });
      }

      loadCustomers();
    });

    connection.onreconnected(() => setConnectionStatus("Đã kết nối"));
    connection.onreconnecting(() => setConnectionStatus("Đang kết nối lại..."));
    connection.onclose(() => setConnectionStatus("Mất kết nối"));

    connection
      .start()
      .then(() => {
        setConnectionStatus("Đã kết nối");
        if (selectedCustomerRef.current) {
          connection.invoke("JoinRoom", selectedCustomerRef.current.id).catch(console.error);
        }
      })
      .catch(err => {
        setConnectionStatus("Lỗi kết nối");
        console.error("SignalR Connection Error: ", err);
      });
  };

  const selectCustomer = (cust: CustomerUser) => {
    setSelectedCustomer(cust);
    loadMessages(cust.id);
    setShowOrderPicker(false);

    if (hubConnectionRef.current && hubConnectionRef.current.state === signalR.HubConnectionState.Connected) {
      hubConnectionRef.current.invoke("JoinRoom", cust.id).catch(console.error);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !inputText.trim()) return;

    const tempId = -Date.now();
    const textToSend = inputText.trim();

    const tempMsg: Message = {
      id: tempId,
      chatSessionId: `DM_${selectedCustomer.id}`,
      senderId: currentAdmin?.id || null,
      senderName: currentAdmin?.fullName || "Quản trị viên",
      isFromAdmin: true,
      messageText: textToSend,
      imageUrl: null,
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, tempMsg]);
    setInputText("");

    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${API_BASE}/api/directmessage/admin/${selectedCustomer.id}/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ messageText: textToSend, imageUrl: null }),
      });

      const data = await res.json();
      if (!data.success) {
        setMessages(prev => prev.filter(m => m.id !== tempId));
        toast.error(data.message || "Không thể gửi tin nhắn.");
      } else {
        setMessages(prev => prev.map(m => m.id === tempId ? normalizeMessage(data.message) : m));
      }
    } catch (e) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      toast.error("Gửi tin nhắn thất bại.");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !selectedCustomer) return;
    const file = e.target.files[0];
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return;

    const tempId = -Date.now();
    const localPreviewUrl = URL.createObjectURL(file);

    setMessages(prev => [...prev, {
      id: tempId,
      chatSessionId: `DM_${selectedCustomer.id}`,
      senderId: currentAdmin?.id || null,
      senderName: currentAdmin?.fullName || "Quản trị viên",
      isFromAdmin: true,
      messageText: null,
      imageUrl: localPreviewUrl,
      createdAt: new Date().toISOString()
    }]);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch(`${API_BASE}/api/upload/chat-image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const uploadData = await uploadRes.json();
      
      if (uploadData.success && uploadData.url) {
        const sendRes = await fetch(`${API_BASE}/api/directmessage/admin/${selectedCustomer.id}/send`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify({ messageText: null, imageUrl: uploadData.url })
        });
        const sendData = await sendRes.json();
        if (sendData.success) {
          setMessages(prev => prev.map(m => m.id === tempId ? normalizeMessage(sendData.message) : m));
        }
      } else {
        setMessages(prev => prev.filter(m => m.id !== tempId));
        toast.error("Tải ảnh thất bại.");
      }
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      toast.error("Lỗi khi gửi ảnh.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const sendSticker = async (stickerUrl: string) => {
    if (!selectedCustomer) return;

    const tempId = -Date.now();
    const tempMsg: Message = {
      id: tempId,
      chatSessionId: `DM_${selectedCustomer.id}`,
      senderId: currentAdmin?.id || null,
      senderName: currentAdmin?.fullName || "Quản trị viên",
      isFromAdmin: true,
      messageText: stickerUrl,
      imageUrl: null,
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, tempMsg]);
    setShowPicker(false);

    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${API_BASE}/api/directmessage/admin/${selectedCustomer.id}/send`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ messageText: stickerUrl, imageUrl: null }),
      });

      const data = await res.json();
      if (!data.success) {
        setMessages(prev => prev.filter(m => m.id !== tempId));
        toast.error(data.message || "Không thể gửi sticker.");
      } else {
        setMessages(prev => prev.map(m => m.id === tempId ? normalizeMessage(data.message) : m));
      }
    } catch (e) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      toast.error("Gửi sticker thất bại.");
    }
  };

  const sendOrderCard = async (order: any) => {
    if (!selectedCustomer) return;
    const detail = order.invoiceDetails?.[0];
    const imageUrl = detail?.imageUrl || detail?.variant?.imageUrl || detail?.productImage || detail?.product?.images?.[0]?.imageUrl || "/assets/img/products/default-product.jpg";
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
    const tempId = -Date.now();
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");

    setMessages(prev => [...prev, {
      id: tempId,
      chatSessionId: `DM_${selectedCustomer.id}`,
      senderId: currentAdmin?.id || null,
      senderName: currentAdmin?.fullName || "Quản trị viên",
      isFromAdmin: true,
      messageText: textToSend,
      imageUrl: null,
      createdAt: new Date().toISOString()
    }]);

    try {
      const res = await fetch(`${API_BASE}/api/directmessage/admin/${selectedCustomer.id}/send`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ messageText: textToSend, imageUrl: null }),
      });

      const data = await res.json();
      if (data.success) {
        setMessages(prev => prev.map(m => m.id === tempId ? normalizeMessage(data.message) : m));
      } else {
        setMessages(prev => prev.filter(m => m.id !== tempId));
        toast.error("Không thể gửi thẻ đơn hàng.");
      }
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      toast.error("Lỗi gửi thẻ đơn hàng.");
    }
    setShowOrderPicker(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;

    if (val.includes("/xinchao") && selectedCustomer && currentAdmin) {
      const shortcutText = `Xin chào ${selectedCustomer.fullName}, em là ${currentAdmin.fullName} thuộc bộ phận CSKH LazPe xin được hỗ trợ anh/chị ạ!`;
      val = val.replace("/xinchao", shortcutText);
    }

    setInputText(val);
  };

  const filteredCustomers = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return customers.filter(c => c.fullName.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
  }, [customers, searchQuery]);

  return (
    <div className="flex w-full flex-1 bg-white rounded-[8px] overflow-hidden border border-slate-200 min-h-0 select-none">
      
      {/* ========================================================================= */}
      {/* LEFT SIDEBAR: MESSENGER 1-1 CUSTOMER LIST                                 */}
      {/* ========================================================================= */}
      <div className="w-56 md:w-64 border-r border-slate-200/80 flex flex-col bg-white shrink-0">
        
        {/* Messenger Header Title */}
        <div className="p-3 pb-2 border-b border-slate-100 flex flex-col gap-2 shrink-0">
          <div className="flex items-center justify-between">
            <h1 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
              Tin nhắn Trực tiếp
            </h1>
            <div className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${connectionStatus === "Đã kết nối" ? "bg-emerald-500" : "bg-amber-500 animate-ping"}`} title={connectionStatus}></span>
            </div>
          </div>

          {/* Search Customer Bar */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-2.5 top-2 text-slate-400 text-base">search</span>
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-100/80 border border-transparent rounded-full focus:outline-none focus:bg-white focus:border-primary/40 focus:ring-2 focus:ring-primary/10 text-slate-800 transition-all placeholder:text-slate-400 font-medium"
            />
          </div>
        </div>

        {/* Customer List Scroll Area */}
        <div className="flex-1 overflow-y-auto p-1.5 space-y-1" style={{ scrollbarWidth: "thin" }}>
          {filteredCustomers.length === 0 ? (
            <div className="text-center text-slate-400 py-12 text-xs flex flex-col items-center">
              <span className="material-symbols-outlined text-3xl mb-1 text-slate-300">forum</span>
              Chưa có cuộc trò chuyện nào.
            </div>
          ) : (
            filteredCustomers.map(cust => {
              const isSelected = selectedCustomer?.id === cust.id;
              
              return (
                <div
                  key={cust.id}
                  onClick={() => {
                    if (!isSelected) selectCustomer(cust);
                  }}
                  className={`p-2 rounded-xl flex items-center gap-2.5 cursor-pointer transition-all duration-150 relative ${
                    isSelected
                      ? "bg-primary/10 border border-primary/20 shadow-sm"
                      : "hover:bg-slate-100/80 bg-white"
                  }`}
                >
                  {/* Customer Avatar */}
                  <div className="relative shrink-0">
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-sm shadow-sm overflow-hidden ${
                      isSelected ? "bg-primary text-white" : "bg-gradient-to-tr from-rose-500 to-pink-500 text-white"
                    }`}>
                      {cust.avatar ? (
                        <img src={cust.avatar} alt={cust.fullName} className="w-full h-full object-cover" />
                      ) : (
                        cust.fullName.charAt(0).toUpperCase()
                      )}
                    </div>
                  </div>

                  {/* Customer Info & Message Preview */}
                  <div className="flex-1 min-w-0 pr-1">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h4 className={`font-bold text-sm truncate ${isSelected ? "text-primary" : "text-slate-900"}`}>
                        {cust.fullName}
                      </h4>
                      {cust.updatedAt && (
                        <span className="text-[10px] text-slate-400 font-medium shrink-0 ml-1">
                          {new Date(cust.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-1">
                      <div className={`text-xs truncate ${(cust.unreadCount || 0) > 0 ? "font-extrabold text-slate-900" : "text-slate-500"}`}>
                        {isMediaUrl(cust.lastMessageText || null) ? (
                          <span className="flex items-center gap-1 italic text-slate-500"><span className="material-symbols-outlined text-sm">image</span> Hình ảnh/Sticker</span>
                        ) : cust.lastMessageText?.startsWith("ORDER_CARD::") || cust.lastMessageText?.startsWith("__ORDER_CARD__::") ? (
                          <span className="flex items-center gap-1 font-semibold text-amber-600"><span className="material-symbols-outlined text-sm">receipt_long</span> Thẻ đơn hàng</span>
                        ) : cust.lastMessageText?.startsWith("COMPENSATION::") || cust.lastMessageText?.startsWith("__COMPENSATION__::") ? (
                          <span className="flex items-center gap-1 font-semibold text-amber-600"><span className="material-symbols-outlined text-sm">stars</span> Thẻ bồi thường</span>
                        ) : (
                          cust.lastMessageText || "Bắt đầu nhắn tin 1-1"
                        )}
                      </div>

                      {(cust.unreadCount || 0) > 0 && (
                        <span className="bg-primary text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-sm shrink-0">
                          {cust.unreadCount! > 99 ? '99+' : cust.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT MAIN VIEW: MESSENGER CHAT ROOM                                      */}
      {/* ========================================================================= */}
      <div className="flex-1 min-w-0 flex flex-col bg-slate-50/50">
        {selectedCustomer ? (
          <>
            {/* Messenger Chat Header */}
            <div className="bg-white border-b border-slate-200/80 p-3.5 px-6 flex items-center justify-between shrink-0 shadow-xs z-10">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center font-bold text-lg shadow-sm overflow-hidden">
                  {selectedCustomer.avatar ? (
                    <img src={selectedCustomer.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    selectedCustomer.fullName.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base leading-tight">
                    {selectedCustomer.fullName}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-emerald-600 mt-0.5 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Đang hoạt động
                  </div>
                </div>
              </div>

              {/* Toolbar Actions */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    if (!showOrderPicker && recentOrders.length === 0) {
                      setLoadingOrders(true);
                      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
                      try {
                        const res = await getUserOrders(selectedCustomer.id, token || "", "all", "", 1, 15);
                        if (res && res.items) setRecentOrders(res.items);
                      } catch (e) {
                        console.error(e);
                      } finally {
                        setLoadingOrders(false);
                      }
                    }
                    setShowOrderPicker(!showOrderPicker);
                  }}
                  className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl transition-colors cursor-pointer"
                  title="Gửi thẻ đơn hàng"
                >
                  <span className="material-symbols-outlined text-sm text-primary">receipt_long</span>
                  <span className="hidden sm:inline">Gửi đơn hàng</span>
                </button>

                <button
                  onClick={() => router.push(`/admin/users/${selectedCustomer.id}`)}
                  className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl transition-colors cursor-pointer"
                  title="Xem hồ sơ người dùng"
                >
                  <span className="material-symbols-outlined text-sm">person</span>
                  <span className="hidden sm:inline">Hồ sơ KH</span>
                </button>
              </div>
            </div>

            {/* Messenger Order Card Picker Panel */}
            {showOrderPicker && (
              <div className="bg-white border-b border-slate-200 p-3.5 px-6 shadow-md animate-in slide-in-from-top-2 duration-200 z-20">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-primary">receipt_long</span>
                    Chọn đơn hàng của {selectedCustomer.fullName} để gửi thẻ:
                  </h4>
                  <button onClick={() => setShowOrderPicker(false)} className="text-slate-400 hover:text-slate-600 p-1">
                    <span className="material-symbols-outlined text-base">close</span>
                  </button>
                </div>

                {loadingOrders ? (
                  <div className="py-4 text-center text-xs text-slate-400">Đang tải danh sách đơn hàng...</div>
                ) : recentOrders.length === 0 ? (
                  <div className="py-4 text-center text-xs text-slate-400">Khách hàng chưa có đơn hàng nào gần đây.</div>
                ) : (
                  <div className="flex gap-3 overflow-x-auto pb-2 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">
                    {recentOrders.map(order => {
                      const detail = order.invoiceDetails?.[0];
                      const imageUrl = detail?.imageUrl || detail?.variant?.imageUrl || detail?.productImage || detail?.product?.images?.[0]?.imageUrl || "/assets/img/products/default-product.jpg";
                      const productName = detail?.productName || detail?.product?.name || `Đơn hàng #${order.invoiceID}`;

                      return (
                        <div key={order.invoiceID} className="shrink-0 w-64 border border-slate-200 rounded-xl p-2.5 bg-slate-50 flex gap-2.5 items-center hover:border-primary transition-colors">
                          <img src={imageUrl} alt="" className="w-12 h-12 object-cover rounded-lg border border-slate-200 shrink-0 bg-white" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-slate-800 truncate">{productName}</div>
                            <div className="text-[10px] text-slate-500 truncate mt-0.5">#{order.invoiceCode || order.invoiceID} • {order.totalPrice?.toLocaleString('vi-VN')}đ</div>
                            <button
                              onClick={() => sendOrderCard(order)}
                              className="mt-1 text-[10px] bg-primary text-white px-2.5 py-1 rounded-lg font-bold hover:bg-primary/90 transition-all cursor-pointer"
                            >
                              Gửi thẻ
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Messenger Message Thread Area */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/70" style={{ scrollbarWidth: "thin" }}>
              {messages.length === 0 ? (
                <div className="text-center text-slate-400 py-16 text-xs bg-white/60 rounded-2xl p-6 border border-slate-200/50 max-w-md mx-auto shadow-xs">
                  <span className="material-symbols-outlined text-4xl mb-2 text-slate-300">chat</span>
                  <p className="font-bold text-slate-600 text-sm">Chưa có tin nhắn nào</p>
                  <p className="text-slate-400 mt-1">Hãy bắt đầu trao đổi trực tiếp với {selectedCustomer.fullName}!</p>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const showAvatar = !msg.isFromAdmin && (index === 0 || messages[index - 1].isFromAdmin);

                  return (
                    <div
                      key={msg.id}
                      className={`flex items-end gap-2 ${msg.isFromAdmin ? "justify-end" : "justify-start"}`}
                    >
                      {/* Customer Avatar on Left */}
                      {!msg.isFromAdmin && (
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-tr from-rose-400 to-pink-500 text-white flex items-center justify-center font-bold text-xs shrink-0 mb-1 overflow-hidden ${showAvatar ? 'opacity-100' : 'opacity-0'}`}>
                          {selectedCustomer.avatar ? (
                            <img src={selectedCustomer.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            msg.senderName.charAt(0).toUpperCase()
                          )}
                        </div>
                      )}

                      <div className={`flex flex-col max-w-[78%] ${msg.isFromAdmin ? "items-end" : "items-start"}`}>
                        <span className="text-[10px] text-slate-400 font-medium mb-1 px-1">
                          {msg.senderName} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>

                        <div
                          className={`rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed shadow-xs ${
                            msg.isFromAdmin
                              ? "bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-tr-xs"
                              : "bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs"
                          } ${msg.id < 0 ? "opacity-75" : ""} ${isMediaUrl(msg.messageText) ? "!bg-transparent !border-none !shadow-none !p-0" : ""}`}
                        >
                          {/* Image Attachment */}
                          {msg.imageUrl && (
                            <div className="mb-2">
                              <img 
                                src={msg.imageUrl} 
                                alt="Attachment" 
                                className="max-w-[240px] max-h-[240px] rounded-xl object-cover cursor-pointer hover:opacity-90 transition-opacity border border-slate-200/50 shadow-sm"
                                onClick={() => setZoomedImage(msg.imageUrl)}
                              />
                            </div>
                          )}

                          {/* Media / Sticker */}
                          {isMediaUrl(msg.messageText) ? (
                            <img
                              src={msg.messageText?.trim()}
                              alt="Sticker"
                              className="max-w-[150px] max-h-[150px] rounded-xl object-contain bg-transparent"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                          ) : msg.messageText?.startsWith("ORDER_CARD::") || msg.messageText?.startsWith("__ORDER_CARD__::") ? (
                            <MessengerOrderCard msgText={msg.messageText} onZoomImage={setZoomedImage} />
                          ) : msg.messageText?.startsWith("COMPENSATION::") || msg.messageText?.startsWith("__COMPENSATION__::") ? (
                            <MessengerCompensationCard msgText={msg.messageText} />
                          ) : (
                            msg.messageText && (
                              <div className={`prose prose-sm max-w-none break-words leading-relaxed [&>p]:mb-0 ${msg.isFromAdmin ? 'prose-invert' : 'prose-slate'}`}>
                                <ReactMarkdown 
                                  remarkPlugins={[remarkGfm]}
                                  components={{
                                    pre: ({ children }: any) => <>{children}</>,
                                    code: ({ node, inline, className, children, ...props }: any) => {
                                      if (!inline) {
                                        try {
                                          const textContent = Array.isArray(children) ? children.join('') : String(children);
                                          const cleanText = textContent.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
                                          const data = JSON.parse(cleanText);
                                          if (data && typeof data === 'object' && !Array.isArray(data) && data.name) {
                                            return <div className="my-2" style={{ width: '100%' }}><MessengerProductCard data={data} onZoomImage={setZoomedImage} /></div>;
                                          }
                                        } catch (e: any) {}
                                        return (
                                          <div className="my-2 w-full bg-slate-800 text-slate-200 p-3 rounded-lg overflow-x-auto text-xs font-mono">
                                            <code className={className} {...props}>{children}</code>
                                          </div>
                                        );
                                      }
                                      return <code className={`${className} bg-black/10 px-1 py-0.5 rounded text-[0.9em]`} {...props}>{children}</code>;
                                    },
                                    img: ({ node, ...props }) => (
                                      <img
                                        {...props}
                                        className="max-w-[200px] h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity border border-slate-200 mt-2 shadow-sm"
                                        onClick={() => setZoomedImage(typeof props.src === 'string' ? props.src : null)}
                                        alt={props.alt || "Image"}
                                      />
                                    )
                                  }}
                                >
                                  {msg.messageText}
                                </ReactMarkdown>
                              </div>
                            )
                          )}
                        </div>

                        {msg.id < 0 && (
                          <span className="text-[10px] text-primary italic mt-1 px-1 animate-pulse font-medium">
                            Đang gửi...
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Messenger Input Toolbar & Footer */}
            <div className="bg-white border-t border-slate-200/80 flex flex-col shrink-0 relative p-3 px-6 gap-2">
              
              {/* Sticker / Emoji Picker Popup */}
              {showPicker && (
                <div className="absolute bottom-full left-6 mb-2 w-80 h-72 bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <div className="flex border-b border-slate-100 text-xs shrink-0 select-none">
                    <button
                      type="button"
                      onClick={() => setPickerTab("emoji")}
                      className={`flex-1 py-2.5 font-bold cursor-pointer transition-colors ${
                        pickerTab === "emoji" ? "text-primary border-b-2 border-primary" : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      Biểu cảm
                    </button>
                    <button
                      type="button"
                      onClick={() => setPickerTab("sticker")}
                      className={`flex-1 py-2.5 font-bold cursor-pointer transition-colors ${
                        pickerTab === "sticker" ? "text-primary border-b-2 border-primary" : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      Sticker / GIF
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-3" style={{ scrollbarWidth: "thin" }}>
                    {pickerTab === "emoji" ? (
                      <div className="grid grid-cols-8 gap-1.5 text-xl select-none">
                        {EMOJIS.map((emoji, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setInputText((prev) => prev + emoji)}
                            className="hover:bg-slate-100 rounded p-1 flex items-center justify-center cursor-pointer transition-colors active:scale-90"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        {STICKERS.map((sticker, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => sendSticker(sticker.url)}
                            className="hover:bg-slate-50 p-1.5 rounded-xl border border-slate-100 flex flex-col items-center justify-center cursor-pointer transition-all active:scale-95 group"
                          >
                            <img src={sticker.url} alt={sticker.name} className="w-14 h-14 object-contain rounded-md" />
                            <span className="text-[10px] text-slate-500 mt-1 truncate max-w-full group-hover:text-primary">{sticker.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Form Input Row */}
              <form onSubmit={handleSend} className="flex items-center gap-2">
                
                {/* Image Upload Icon */}
                <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleImageUpload} />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-slate-500 hover:text-primary hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                  title="Gửi ảnh đính kèm"
                >
                  <span className="material-symbols-outlined text-2xl">image</span>
                </button>

                {/* Emoji / Sticker Icon */}
                <button
                  type="button"
                  onClick={() => setShowPicker(!showPicker)}
                  className={`p-2 rounded-full transition-colors cursor-pointer ${
                    showPicker ? "text-primary bg-primary/10" : "text-slate-500 hover:text-primary hover:bg-slate-100"
                  }`}
                  title="Cảm xúc & Sticker"
                >
                  <span className="material-symbols-outlined text-2xl">sentiment_satisfied</span>
                </button>

                {/* Shortcut Greeting */}
                {currentAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setInputText(`Xin chào ${selectedCustomer.fullName}, em là ${currentAdmin.fullName} thuộc bộ phận CSKH LazPe xin được hỗ trợ anh/chị ạ!`);
                    }}
                    className="hidden lg:flex items-center gap-1 text-xs text-primary hover:bg-primary/10 px-3 py-1.5 rounded-full border border-primary/30 font-bold transition-all cursor-pointer shrink-0"
                  >
                    <span className="material-symbols-outlined text-sm">bolt</span>
                    Chào khách (/xinchao)
                  </button>
                )}

                {/* Input Text Area */}
                <input
                  type="text"
                  value={inputText}
                  onChange={handleInputChange}
                  placeholder={`Nhập tin nhắn với ${selectedCustomer.fullName}...`}
                  className="flex-1 px-5 py-3 bg-slate-100/90 border border-transparent rounded-full text-sm focus:outline-none focus:bg-white focus:border-primary/40 focus:ring-2 focus:ring-primary/10 text-slate-900 transition-all font-medium"
                />

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="bg-primary hover:bg-primary/90 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-full h-11 w-11 flex items-center justify-center shadow-md cursor-pointer transition-all active:scale-95 shrink-0"
                  title="Gửi tin nhắn"
                >
                  <span className="material-symbols-outlined text-xl">send</span>
                </button>
              </form>
            </div>

            {/* Image Zoom Lightbox */}
            {zoomedImage && (
              <div 
                className="fixed inset-0 bg-black/70 backdrop-blur-xs z-[9999] flex items-center justify-center p-4"
                onClick={() => setZoomedImage(null)}
              >
                <div className="relative max-w-4xl max-h-[90vh] flex items-center justify-center">
                  <button 
                    onClick={() => setZoomedImage(null)}
                    className="absolute -top-12 right-0 w-10 h-10 bg-white/20 hover:bg-white/40 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-colors"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                  <img 
                    src={zoomedImage} 
                    alt="Zoomed" 
                    className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            )}
          </>
        ) : (
          /* Empty Room Placeholder */
          <div className="flex-1 flex flex-col justify-center items-center text-slate-400 p-8 w-full">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
              <span className="material-symbols-outlined text-4xl">forum</span>
            </div>
            <h3 className="font-extrabold text-slate-800 text-xl mb-1">
              Trung tâm Tin nhắn Trực tiếp Trọn đời
            </h3>
            <p className="text-sm max-w-md text-center text-slate-500 leading-relaxed">
              Chọn một khách hàng từ danh sách bên trái để nhắn tin trực tiếp không hết hạn.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminMessagesPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-500 font-bold">Đang tải Tin nhắn Trực tiếp LazPe...</div>}>
      <AdminMessengerContent />
    </Suspense>
  );
}
