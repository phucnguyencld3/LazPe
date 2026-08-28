/* eslint-disable */
"use client";

import React, { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import * as signalR from "@microsoft/signalr";
import { toast } from "sonner";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const AdminChatProductCard = ({ data, onZoomImage }: { data: any, onZoomImage?: (url: string) => void }) => {
  return (
    <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all my-2" style={{ width: '100%', maxWidth: '384px' }}>
      <div 
        className="shrink-0 bg-slate-50 flex items-center justify-center p-2 border-r border-slate-100 self-stretch cursor-pointer hover:opacity-80 transition-opacity"
        style={{ width: '80px', minWidth: '80px' }}
        onClick={() => onZoomImage && onZoomImage(data.imageUrl || '/assets/img/products/default-product.jpg')}
        title="Phóng to ảnh"
      >
        <img src={data.imageUrl || '/assets/img/products/default-product.jpg'} alt={data.name} className="max-w-full object-contain mix-blend-multiply" style={{ maxHeight: '60px' }} />
      </div>
      <div className="p-2 flex flex-col justify-center flex-1 min-w-0 gap-1">
        <h4 
          className="text-xs font-semibold text-slate-700 leading-snug whitespace-normal break-words" 
          title={data.name}
        >
          {data.name}
        </h4>
        <div className="flex items-center justify-between mt-1">
          <span className="text-primary font-bold text-sm truncate pr-1">
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(data.price || 0)}
          </span>
          <div className="text-[10px] text-slate-400 font-medium px-2 py-0.5 bg-slate-100 rounded">
            Sản phẩm
          </div>
        </div>
      </div>
    </div>
  );
};

interface ChatSession {
  id: string;
  userId: string | null;
  customerName: string;
  adminId: string | null;
  adminName: string | null;
  createdAt: string;
  updatedAt: string;
  isClosed: boolean;
  isWaitingForSupport: boolean;
  lastMessageText: string | null;
  unreadByAdmin: number;
  unreadByCustomer: number;
}

interface CustomerChatGroup {
  customerId: string;
  customerName: string;
  latestSession: ChatSession;
  recentSessions: ChatSession[];
  unreadCount: number;
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

const AdminChatOrderCard = ({ msgText, onZoomImage }: { msgText: string, onZoomImage?: (url: string) => void }) => {
  try {
    const jsonStr = msgText.replace(/^(__ORDER_CARD__|ORDER_CARD)::/, "");
    const order = JSON.parse(jsonStr);
    const statusColor = order.status === "Đã hủy" ? "bg-rose-50 text-rose-600 border-rose-200" : order.status === "Đã giao" ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-amber-50 text-amber-600 border-amber-200";

    return (
      <div 
        className="w-full max-w-[340px] bg-white rounded-xl border border-slate-200 p-3 shadow-sm hover:shadow-md transition-all my-1 cursor-pointer hover:border-primary/50 group"
        onClick={() => window.open(`/admin/orders/${order.invoiceID}`, '_blank')}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
            <span className="material-symbols-outlined text-sm text-primary">receipt_long</span>
            Mã đơn: #{order.invoiceCode || order.invoiceID}
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColor}`}>
            {order.status || "Đang xử lý"}
          </span>
        </div>
        
        <div className="flex gap-3 items-center">
          <img 
            src={order.imageUrl || '/assets/img/products/default-product.jpg'} 
            alt="Product" 
            className="w-14 h-14 object-cover rounded-lg border border-slate-100 shrink-0 bg-slate-50" 
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

const AdminChatCompensationCard = ({ msgText }: { msgText: string }) => {
  try {
    const jsonStr = msgText.replace(/^(__COMPENSATION__|COMPENSATION)::/, "");
    const comp = JSON.parse(jsonStr);

    return (
      <div className="w-full max-w-[300px] bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/80 rounded-xl p-3 shadow-sm my-1">
        <div className="flex items-center gap-2 mb-2 border-b border-amber-200/50 pb-2">
          <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
            <span className="material-symbols-outlined text-lg">
              {comp.type === 'voucher' ? 'local_activity' : 'stars'}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-amber-900 truncate">Bồi thường sự cố</div>
            <div className="text-[10px] text-amber-700">Mã đơn: #{comp.invoiceCode || comp.invoiceId}</div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur rounded-lg p-2 text-center border border-amber-200/60 shadow-inner">
          <div className="text-sm font-extrabold text-amber-600">
            {comp.type === 'voucher' 
              ? `Voucher giảm ${comp.discountType === 1 ? comp.amount + '%' : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(comp.amount || 0)}` 
              : `+${(comp.amount || 0).toLocaleString('vi-VN')} Điểm thưởng`}
          </div>
          {comp.type === 'voucher' && comp.voucherCode && (
            <div className="text-[10px] text-slate-500 mt-0.5 font-mono font-bold tracking-wider">
              {comp.voucherCode}
            </div>
          )}
        </div>
        {comp.reason && (
          <div className="text-[11px] text-slate-600 mt-2 italic line-clamp-2 bg-amber-100/40 p-1.5 rounded text-center">
            "{comp.reason}"
          </div>
        )}
      </div>
    );
  } catch (e) {
    return <div className="text-xs text-rose-500 font-medium">Tin nhắn thẻ bồi thường bị lỗi</div>;
  }
};

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

function AdminChatsContent() {
  const searchParams = useSearchParams();
  const sessionParam = searchParams.get("session");
  const userParam = searchParams.get("user");

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "closed">("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentAdmin, setCurrentAdmin] = useState<{ id: string; fullName: string } | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerTab, setPickerTab] = useState<"emoji" | "sticker">("emoji");
  const [connectionStatus, setConnectionStatus] = useState<string>("Đang kết nối...");
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hubConnectionRef = useRef<signalR.HubConnection | null>(null);
  const selectedSessionRef = useRef<ChatSession | null>(null);

  // Auto-sync selectedSession to ref for use inside SignalR callbacks
  useEffect(() => {
    selectedSessionRef.current = selectedSession;
  }, [selectedSession]);

  const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5101").replace(/\/api$/, "");

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load chat sessions on mount & setup SignalR
  useEffect(() => {
    loadSessions();
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
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success && data.user) {
        setCurrentAdmin({ id: data.user.id, fullName: data.user.fullName });
      }
    } catch (e) {
      console.error("Lỗi lấy thông tin admin", e);
    }
  };

  const loadSessions = async () => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${API_BASE}/api/chat/admin/sessions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success && data.sessions) {
        setSessions(data.sessions);

        // Tự động mở phiên chat nếu có query parameter ?session=xxx hoặc ?user=xxx
        const targetId = sessionParam || (userParam ? `DM_${userParam}` : null);
        if (targetId) {
          const target = data.sessions.find((s: ChatSession) => s.id === targetId || s.userId === userParam);
          if (target) {
            setSelectedSession(target);
            loadMessages(target.id);
          }
        }
      }
    } catch (e) {
      toast.error("Không thể tải danh sách cuộc trò chuyện.");
    }
  };

  const loadMessages = async (sid: string) => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${API_BASE}/api/chat/session/${sid}/messages`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages.map(normalizeMessage));
        
        // Cập nhật lại unreadByAdmin của session này cục bộ
        setSessions(prev => 
          prev.map(s => s.id === sid ? { ...s, unreadByAdmin: 0 } : s)
        );
      }
    } catch (e) {
      toast.error("Không thể tải lịch sử tin nhắn.");
    }
  };

  const setupSignalR = async (token: string) => {
    if (hubConnectionRef.current) {
      await hubConnectionRef.current.stop();
    }

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE}/chatHub?access_token=${token}`, {
        // Force SSE/LongPolling to bypass Cloudflare/Antivirus WebSocket frame corruption (Opcode 11)
        transport: signalR.HttpTransportType.ServerSentEvents | signalR.HttpTransportType.LongPolling
      })
      .withAutomaticReconnect()
      .build();

    // Set ref immediately so other functions know connection exists
    hubConnectionRef.current = connection;

    connection.on("ReceiveMessage", (message: Message) => {
      const normalized = normalizeMessage(message);
      
      // Update messages if the message belongs to the currently selected room
      if (selectedSessionRef.current && selectedSessionRef.current.id === normalized.chatSessionId) {
        setMessages(prev => {
          const filtered = prev.filter(m => m.id > 0);
          if (filtered.some(m => m.id === normalized.id)) return filtered;
          return [...filtered, normalized];
        });
        
        if (!normalized.isFromAdmin) {
          markAsRead(normalized.chatSessionId);
        }
      }

      // Update session list unread counts
      loadSessions();
    });

    connection.on("UpdateAdminSessions", () => {
      loadSessions();
    });

    connection.onreconnected(() => {
      setConnectionStatus("Đã kết nối");
      if (selectedSessionRef.current) {
        connection.invoke("JoinRoom", selectedSessionRef.current.id).catch(console.error);
      }
    });
    
    connection.onreconnecting(() => {
      setConnectionStatus("Đang kết nối lại...");
    });
    
    connection.onclose(() => {
      setConnectionStatus("Mất kết nối");
    });

    connection
      .start()
      .then(() => {
        setConnectionStatus("Đã kết nối");
        // If a session was already selected during connection startup, join it now
        if (selectedSessionRef.current) {
          connection.invoke("JoinRoom", selectedSessionRef.current.id).catch(console.error);
        }
      })
      .catch(err => {
        setConnectionStatus("Lỗi kết nối");
        console.error("Admin SignalR Connection Error: ", err);
      });
  };

  const markAsRead = async (sid: string) => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return;
      await fetch(`${API_BASE}/api/chat/session/${sid}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (e) {
      console.error(e);
    }
  };

  const selectRoom = async (session: ChatSession) => {
    const conn = hubConnectionRef.current;
    
    // Leave previous room if exists
    if (conn && selectedSession) {
      if (conn.state === signalR.HubConnectionState.Connected) {
        try {
          await conn.invoke("LeaveRoom", selectedSession.id);
        } catch (e) {
          console.error("LeaveRoom Error:", e);
        }
      }
    }
    
    setSelectedSession(session);
    loadMessages(session.id);
    
    // Join new room
    if (conn && conn.state === signalR.HubConnectionState.Connected) {
      try {
        await conn.invoke("JoinRoom", session.id);
      } catch (e) {
        console.error("JoinRoom Error:", e);
      }
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSession) return;
    if (!inputText.trim()) return;

    const isDifferentAdminSupporting = !!(selectedSession.adminId && currentAdmin && selectedSession.adminId !== currentAdmin.id);
    const isNoAdminSupporting = !selectedSession.adminId;
    if (selectedSession.isClosed || isDifferentAdminSupporting || isNoAdminSupporting) {
      toast.error("Bạn không thể gửi tin nhắn lúc này.");
      return;
    }

    // --- OPTIMISTIC UI UPDATE ---
    const tempId = -Date.now();
    const tempMsg: Message = {
      id: tempId,
      chatSessionId: selectedSession.id,
      senderId: currentAdmin?.id || null,
      senderName: currentAdmin?.fullName || "Quản trị viên",
      isFromAdmin: true,
      messageText: inputText.trim(),
      imageUrl: null,
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, tempMsg]);

    const textToSend = inputText.trim();

    setInputText("");

    const formData = new FormData();
    formData.append("messageText", textToSend);

    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${API_BASE}/api/chat/session/${selectedSession.id}/message`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!data.success) {
        setMessages(prev => prev.filter(m => m.id !== tempId));
        toast.error(data.message || "Không thể gửi tin nhắn.");
      } else {
        // Cập nhật id thật từ server để xóa trạng thái Đang gửi
        setMessages(prev => prev.map(m => m.id === tempId ? normalizeMessage(data.message) : m));
        
        if (!selectedSession.adminId && currentAdmin) {
          setSelectedSession(prev => prev ? { ...prev, adminId: currentAdmin.id, adminName: currentAdmin.fullName } : null);
        }
      }
    } catch (e) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      toast.error("Gửi tin nhắn lỗi.");
    }
  };

  const sendSticker = async (stickerUrl: string) => {
    if (!selectedSession) return;

    const isDifferentAdminSupporting = !!(selectedSession.adminId && currentAdmin && selectedSession.adminId !== currentAdmin.id);
    const isNoAdminSupporting = !selectedSession.adminId;
    if (selectedSession.isClosed || isDifferentAdminSupporting || isNoAdminSupporting) {
      toast.error("Bạn không thể gửi tin nhắn lúc này.");
      return;
    }

    const tempId = -Date.now();
    const tempMsg: Message = {
      id: tempId,
      chatSessionId: selectedSession.id,
      senderId: currentAdmin?.id || null,
      senderName: currentAdmin?.fullName || "Quản trị viên",
      isFromAdmin: true,
      messageText: stickerUrl,
      imageUrl: null,
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, tempMsg]);
    setShowPicker(false);

    const formData = new FormData();
    formData.append("messageText", stickerUrl);

    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${API_BASE}/api/chat/session/${selectedSession.id}/message`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (!data.success) {
        setMessages(prev => prev.filter(m => m.id !== tempId));
        toast.error(data.message || "Không thể gửi sticker.");
      } else {
        // Cập nhật id thật từ server
        setMessages(prev => prev.map(m => m.id === tempId ? normalizeMessage(data.message) : m));
        if (!selectedSession.adminId && currentAdmin) {
          setSelectedSession(prev => prev ? { ...prev, adminId: currentAdmin.id, adminName: currentAdmin.fullName } : null);
        }
      }
    } catch (e) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      toast.error("Gửi sticker thất bại.");
    }
  };

  const closeRoom = async () => {
    if (!selectedSession) return;

    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${API_BASE}/api/chat/admin/session/${selectedSession.id}/close`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Đã đóng cuộc hội thoại.");
        setSelectedSession(prev => prev ? { ...prev, isClosed: true } : null);
        loadSessions();
      }
    } catch (e) {
      toast.error("Lỗi khi đóng cuộc hội thoại.");
    }
  };
  const endSupport = async () => {
    if (!selectedSession) return;

    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${API_BASE}/api/chat/session/${selectedSession.id}/end-support`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Đã kết thúc hỗ trợ trực tiếp. Trợ lý AI sẽ tiếp quản.");
        setSelectedSession(prev => prev ? { ...prev, adminId: null, adminName: null, isWaitingForSupport: false } : null);
        loadSessions();
      } else {
        toast.error(data.message || "Lỗi khi kết thúc hỗ trợ.");
      }
    } catch (e) {
      toast.error("Lỗi mạng khi kết thúc hỗ trợ.");
    }
  };

  const claimRoom = async () => {
    if (!selectedSession) return;

    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${API_BASE}/api/chat/admin/session/${selectedSession.id}/claim`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Đã nhận hỗ trợ cuộc chat này.");
        setSelectedSession(prev => prev ? { ...prev, adminId: data.adminId, adminName: data.adminName, isWaitingForSupport: false } : null);
        loadSessions();
        loadMessages(selectedSession.id);
      } else {
        toast.error(data.message || "Không thể nhận hỗ trợ cuộc chat.");
      }
    } catch (e) {
      toast.error("Lỗi khi nhận cuộc chat.");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;

    if (val.includes("/xinchao") && selectedSession && currentAdmin) {
      const shortcutText = `Xin chào anh chị ${selectedSession.customerName}, Em là ${currentAdmin.fullName} xin được hỗ trợ mình ạ. Mình có vấn đề gì cần em hỗ trợ không ạ?`;
      val = val.replace("/xinchao", shortcutText);
    }

    setInputText(val);
    if (hubConnectionRef.current && selectedSession) {
      hubConnectionRef.current.invoke(
        "SendTypingStatus",
        selectedSession.id,
        "Admin",
        val.length > 0
      );
    }
  };

  // Nhóm các phiên chat theo Khách hàng
  const filteredGroups = useMemo(() => {
    const groups: Record<string, CustomerChatGroup> = {};
    
    sessions.forEach(session => {
      const customerId = session.userId || session.customerName; // Fallback to name if anonymous
      
      if (!groups[customerId]) {
        groups[customerId] = {
          customerId,
          customerName: session.customerName,
          latestSession: session,
          recentSessions: [session],
          unreadCount: session.unreadByAdmin || 0
        };
      } else {
        const group = groups[customerId];
        group.recentSessions.push(session);
        group.unreadCount += (session.unreadByAdmin || 0);

        const currentLatestTime = new Date(group.latestSession.updatedAt).getTime();
        const thisSessionTime = new Date(session.updatedAt).getTime();
        
        if (thisSessionTime > currentLatestTime) {
          group.latestSession = session;
        }
      }
    });

    Object.values(groups).forEach(g => {
      // Sort recent sessions DESC by updatedAt
      g.recentSessions.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      // Keep only top 3
      g.recentSessions = g.recentSessions.slice(0, 3);
    });

    let arr = Object.values(groups).sort((a, b) => 
      new Date(b.latestSession.updatedAt).getTime() - new Date(a.latestSession.updatedAt).getTime()
    );

    const query = searchQuery.toLowerCase();
    arr = arr.filter(g => {
      const matchesSearch = g.customerName.toLowerCase().includes(query) || 
                            (g.latestSession.lastMessageText && g.latestSession.lastMessageText.toLowerCase().includes(query));
      
      if (filter === "active") return matchesSearch && !g.latestSession.isClosed;
      if (filter === "closed") return matchesSearch && g.latestSession.isClosed;
      return matchesSearch;
    });

    return arr;
  }, [sessions, filter, searchQuery]);

  const currentCustomerSessions = useMemo(() => {
    if (!selectedSession) return [];
    const customerId = selectedSession.userId || selectedSession.customerName;
    const customerSessions = sessions.filter(s => (s.userId || s.customerName) === customerId);
    customerSessions.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return customerSessions.slice(0, 3);
  }, [selectedSession, sessions]);

  const isDifferentAdminSupporting = !!(selectedSession?.adminId && currentAdmin && selectedSession.adminId !== currentAdmin.id);
  const isNoAdminSupporting = !selectedSession?.adminId;
  const isChatInputDisabled = !!(selectedSession?.isClosed || isDifferentAdminSupporting || isNoAdminSupporting);

  return (
    <div className="flex w-full flex-1 bg-white rounded-[8px] overflow-hidden border border-slate-200 min-h-0">
      {/* Left panel: Sessions list */}
      <div className="w-80 border-r border-slate-200 flex flex-col bg-slate-50 shrink-0">
        {/* Search & Filter */}
        <div className="p-4 border-b border-slate-200 space-y-3 shrink-0">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-lg">search</span>
            <input
              type="text"
              placeholder="Tìm khách hàng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-full focus:outline-none focus:border-primary text-slate-800"
            />
          </div>

          <div className="flex bg-slate-200/60 p-0.5 rounded-full text-xs">
            <button
              onClick={() => setFilter("active")}
              className={`flex-1 py-1.5 rounded-full font-semibold transition-all cursor-pointer ${
                filter === "active" ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Chờ hỗ trợ
            </button>
            <button
              onClick={() => setFilter("closed")}
              className={`flex-1 py-1.5 rounded-full font-semibold transition-all cursor-pointer ${
                filter === "closed" ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Đã đóng
            </button>
            <button
              onClick={() => setFilter("all")}
              className={`flex-1 py-1.5 rounded-full font-semibold transition-all cursor-pointer ${
                filter === "all" ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Tất cả
            </button>
          </div>
        </div>

        {/* Sessions list */}
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
          {filteredGroups.length === 0 ? (
            <div className="text-center text-slate-400 py-10 text-sm">
              Không tìm thấy khách hàng nào.
            </div>
          ) : (
            filteredGroups.map(group => {
              const isSelected = selectedSession && group.recentSessions.some(s => s.id === selectedSession.id);
              return (
                <div key={group.customerId} className="mb-2">
                  <div
                    onClick={() => {
                      if (!isSelected) selectRoom(group.latestSession);
                    }}
                    className={`p-4 mx-2 mt-2 rounded-[8px] flex items-start gap-3 cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? "bg-primary/10 border border-primary/20 shadow-sm"
                        : "hover:bg-slate-100/80 bg-white border border-transparent"
                    }`}
                  >
                    <div className={`relative h-11 w-11 rounded-full flex items-center justify-center font-bold text-base shrink-0 ${
                      isSelected ? "bg-primary text-white shadow-md shadow-primary/20" : "bg-slate-200 text-slate-500"
                    }`}>
                      {group.customerName.charAt(0).toUpperCase()}
                      {group.latestSession.isWaitingForSupport && !group.latestSession.isClosed && (
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-warning border-2 border-white rounded-full animate-pulse"></span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className={`font-bold text-sm truncate ${isSelected ? "text-primary" : "text-slate-700"}`}>
                          {group.customerName}
                        </h4>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">
                          {new Date(group.latestSession.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 truncate mb-1">
                        {isMediaUrl(group.latestSession.lastMessageText) ? (
                          <span className="flex items-center gap-1 italic"><span className="material-symbols-outlined text-[14px]">image</span> Hình ảnh/Sticker</span>
                        ) : group.latestSession.lastMessageText?.startsWith("ORDER_CARD::") || group.latestSession.lastMessageText?.startsWith("__ORDER_CARD__::") ? (
                          <span className="flex items-center gap-1 font-medium text-slate-700"><span className="material-symbols-outlined text-[14px] text-amber-600">receipt_long</span> Thẻ đơn hàng</span>
                        ) : group.latestSession.lastMessageText?.startsWith("COMPENSATION::") || group.latestSession.lastMessageText?.startsWith("__COMPENSATION__::") ? (
                          <span className="flex items-center gap-1 font-medium text-amber-600"><span className="material-symbols-outlined text-[14px]">stars</span> Thẻ bồi thường</span>
                        ) : (
                          group.latestSession.lastMessageText || "Chưa có tin nhắn"
                        )}
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded flex items-center gap-1 ${
                          group.latestSession.isClosed ? "bg-slate-200 text-slate-500" :
                          group.latestSession.adminId 
                            ? (group.latestSession.adminId === currentAdmin?.id ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600")
                            : (group.latestSession.isWaitingForSupport ? "bg-warning/20 text-warning-dark" : "bg-blue-100 text-blue-600")
                        }`}>
                          {group.latestSession.isClosed ? "Đã đóng" :
                          group.latestSession.adminId 
                            ? (group.latestSession.adminId === currentAdmin?.id ? "Bạn đang hỗ trợ" : group.latestSession.adminName)
                            : (group.latestSession.isWaitingForSupport ? "Chờ hỗ trợ" : "AI đang hỗ trợ")}
                        </span>
                        {group.unreadCount > 0 && (
                          <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                            {group.unreadCount > 99 ? '99+' : group.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {isSelected && group.recentSessions.length > 1 && (
                    <div className="mx-4 mt-1 px-3 py-2 bg-slate-50 rounded-b-[8px] border-x border-b border-slate-200/60 shadow-inner">
                      <div className="text-[10px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Lịch sử trò chuyện</div>
                      <div className="flex flex-col gap-1">
                        {group.recentSessions.map((s, idx) => (
                          <div
                            key={s.id}
                            onClick={(e) => { e.stopPropagation(); selectRoom(s); }}
                            className={`px-3 py-1.5 rounded cursor-pointer text-xs flex justify-between items-center transition-colors ${
                              selectedSession?.id === s.id 
                                ? "bg-white border border-primary/30 text-primary font-bold shadow-sm" 
                                : "hover:bg-slate-200/50 text-slate-600 border border-transparent"
                            }`}
                          >
                            <span className="truncate pr-2">{idx === 0 ? "Mới nhất" : `Trước đó (${idx})`}</span>
                            <span className={`text-[10px] shrink-0 ${selectedSession?.id === s.id ? "text-primary/70" : "text-slate-400"}`}>
                              {new Date(s.updatedAt).toLocaleDateString('vi-VN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right panel: Chat detail */}
      <div className="flex-1 min-w-0 flex flex-col bg-slate-50">
        {selectedSession ? (
          <>
            {/* Header info */}
            <div className="bg-white border-b border-slate-200 p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-base">
                  {selectedSession.customerName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">{selectedSession.customerName}</h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!selectedSession.isClosed ? (
                  selectedSession.adminId === currentAdmin?.id ? (
                    <button
                      onClick={endSupport}
                      className="flex items-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold px-3 py-2 rounded-[8px] cursor-pointer transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">cancel</span>
                      Kết thúc hội thoại
                    </button>
                  ) : null
                ) : (
                  <span className="text-xs bg-slate-200 text-slate-600 font-semibold px-3 py-2 rounded-[8px]">
                    Cuộc trò chuyện đã đóng
                  </span>
                )}
              </div>
            </div>

            {/* Claim/Staff Status Banner */}
            {!selectedSession.isClosed && (
              <div className="px-4 py-3 bg-white border-b border-slate-100 text-xs flex justify-between items-center shrink-0">
                {!selectedSession.adminId ? (
                  selectedSession.isWaitingForSupport ? (
                    <div className="bg-warning-container border border-warning/20 text-on-warning-container p-3 rounded-[8px] w-full flex items-center justify-between shadow-sm">
                      <span className="flex items-center gap-2 font-semibold">
                        <span className="material-symbols-outlined text-warning">warning</span>
                        Khách hàng đang yêu cầu nhân viên hỗ trợ!
                      </span>
                      <button
                        onClick={claimRoom}
                        className="bg-warning hover:bg-warning/90 text-on-warning font-bold py-1.5 px-4 rounded-[8px] text-xs transition-colors cursor-pointer shadow-sm bouncy-hover"
                      >
                        Nhận hỗ trợ
                      </button>
                    </div>
                  ) : (
                    <div className="bg-slate-100 border border-slate-200 text-slate-500 p-3 rounded-[8px] w-full flex items-center justify-center gap-2 font-medium">
                      <span className="material-symbols-outlined text-sm">smart_toy</span>
                      Trợ lý AI đang tiếp quản cuộc trò chuyện này.
                    </div>
                  )
                ) : selectedSession.adminId === currentAdmin?.id ? (
                  <div className="bg-success-container border border-success/20 text-on-success-container p-3 rounded-[8px] w-full flex items-center gap-2 font-medium">
                    <span className="material-symbols-outlined text-success">check_circle</span>
                    Bạn đang hỗ trợ khách hàng này.
                  </div>
                ) : (
                  <div className="bg-error-container border border-error/20 text-on-error-container p-3 rounded-[8px] w-full flex items-center gap-2 font-medium">
                    <span className="material-symbols-outlined text-error">lock</span>
                    Cuộc chat này đang được nhận hỗ trợ bởi nhân viên: <strong className="underline">{selectedSession.adminName}</strong>
                  </div>
                )}
              </div>
            )}

            {/* Messages area Zalo Style Background */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-surface-container-lowest" style={{ scrollbarWidth: "thin" }}>
              {messages.length === 0 ? (
                <div className="text-center text-slate-500 py-10 text-xs bg-white/40 rounded-[8px] p-4">
                  Không có tin nhắn nào trong phòng này.
                </div>
              ) : (
                messages.map(msg => {
                  const isSystem = msg.senderName === "Hệ thống";
                  
                  if (isSystem) {
                    return (
                      <div key={msg.id} className="w-full flex justify-center my-2 select-none">
                        <span className="text-slate-500 text-[11px] italic">
                          {msg.messageText}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${msg.isFromAdmin ? "items-end" : "items-start"}`}
                    >
                      <span className="text-[10px] text-slate-400 font-medium mb-1 px-1">
                        {msg.senderName} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <div
                        className={`max-w-[85%] rounded-[20px] px-4 py-2.5 text-[14px] leading-relaxed shadow-sm ${
                          msg.isFromAdmin
                            ? "bg-sky-50 text-slate-800 border border-sky-200 rounded-tr-sm"
                            : "bg-white text-slate-700 rounded-tl-sm border border-slate-100/50"
                        } ${msg.id < 0 ? "opacity-75" : ""} ${isMediaUrl(msg.messageText) ? "!bg-transparent !border-none !shadow-none !p-0" : ""}`}
                      >
                        {msg.imageUrl && (
                          <div className="mb-2">
                            <img 
                              src={msg.imageUrl} 
                              alt="Hình ảnh gửi" 
                              className="max-w-[220px] max-h-[220px] rounded-xl object-cover cursor-pointer hover:opacity-90 transition-opacity border border-slate-200 shadow-sm"
                              onClick={() => setZoomedImage(msg.imageUrl)}
                            />
                          </div>
                        )}

                        {isMediaUrl(msg.messageText) ? (
                          <img
                            src={msg.messageText?.trim()}
                            alt="Sticker"
                            className="max-w-[140px] max-h-[140px] rounded-lg object-contain bg-transparent"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        ) : msg.messageText?.startsWith("ORDER_CARD::") || msg.messageText?.startsWith("__ORDER_CARD__::") ? (
                          <AdminChatOrderCard msgText={msg.messageText} onZoomImage={setZoomedImage} />
                        ) : msg.messageText?.startsWith("COMPENSATION::") || msg.messageText?.startsWith("__COMPENSATION__::") ? (
                          <AdminChatCompensationCard msgText={msg.messageText} />
                        ) : (
                          msg.messageText && (
                            <div className={`prose prose-sm max-w-none break-words leading-relaxed [&>p]:mb-0`}>
                              <ReactMarkdown 
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                  pre: ({ children }: any) => <>{children}</>,
                                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                  code: ({ node, inline, className, children, ...props }: any) => {
                                    if (!inline) {
                                      try {
                                        const textContent = Array.isArray(children) ? children.join('') : String(children);
                                        const cleanText = textContent.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
                                        const data = JSON.parse(cleanText);
                                        if (data && typeof data === 'object' && !Array.isArray(data) && data.name) {
                                          return <div className="my-2" style={{ width: '100%' }}><AdminChatProductCard data={data} onZoomImage={setZoomedImage} /></div>;
                                        }
                                      } catch (e: any) {
                                        return <div className="my-2 w-full bg-red-500 text-white p-4 font-bold rounded-lg break-words">PARSE ERROR: {e.message} | TEXT: {String(children).substring(0, 100)}</div>;
                                      }
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
                        <span className="text-[10px] text-primary italic mt-1 px-2 animate-pulse font-medium">
                          Đang gửi...
                        </span>
                      )}
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Zalo Style Input Area */}
            <div className="bg-white border-t border-slate-200 flex flex-col shrink-0 relative">
              {/* Emoji/Sticker Picker Popup */}
              {showPicker && (
                <div className="absolute bottom-full left-4 mb-2 w-80 h-72 bg-white rounded-[8px] shadow-2xl border border-slate-200 flex flex-col z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
                  {/* Picker Tabs */}
                  <div className="flex border-b border-slate-100 text-xs shrink-0 select-none">
                    <button
                      type="button"
                      onClick={() => setPickerTab("emoji")}
                      className={`flex-1 py-2 font-bold cursor-pointer transition-colors ${
                        pickerTab === "emoji" ? "text-primary border-b-2 border-primary" : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      Biểu cảm
                    </button>
                    <button
                      type="button"
                      onClick={() => setPickerTab("sticker")}
                      className={`flex-1 py-2 font-bold cursor-pointer transition-colors ${
                        pickerTab === "sticker" ? "text-primary border-b-2 border-primary" : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      Sticker / GIF
                    </button>
                  </div>

                  {/* Picker Body */}
                  <div className="flex-1 overflow-y-auto p-3" style={{ scrollbarWidth: "thin" }}>
                    {pickerTab === "emoji" ? (
                      <div className="grid grid-cols-8 gap-2 text-xl select-none">
                        {EMOJIS.map((emoji, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setInputText((prev) => prev + emoji);
                            }}
                            className="hover:bg-slate-100 rounded p-1 flex items-center justify-center cursor-pointer transition-colors active:scale-90"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-3">
                        {STICKERS.map((sticker, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => sendSticker(sticker.url)}
                            className="hover:bg-slate-50 p-1 rounded-lg border border-slate-100 flex flex-col items-center justify-center cursor-pointer transition-all active:scale-95 group"
                          >
                            <img
                              src={sticker.url}
                              alt={sticker.name}
                              className="w-14 h-14 object-contain rounded-md"
                            />
                            <span className="text-[10px] text-slate-500 mt-1 truncate max-w-full group-hover:text-primary">
                              {sticker.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Zalo Options Toolbar */}
              <div className="flex items-center justify-between px-4 py-1.5 border-b border-slate-100 text-slate-400 select-none">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPicker(!showPicker)}
                    disabled={isChatInputDisabled}
                    className={`hover:text-primary hover:bg-slate-100 p-1.5 rounded transition-colors material-symbols-outlined text-lg cursor-pointer ${
                      showPicker ? "text-primary bg-slate-100" : "text-slate-400"
                    } ${isChatInputDisabled ? "opacity-50 cursor-not-allowed hover:text-slate-400 hover:bg-transparent" : ""}`}
                    title="Cảm xúc & Sticker"
                  >
                    sentiment_satisfied
                  </button>
                  
                  {/* Phím tắt trả lời nhanh */}
                  {!isChatInputDisabled && currentAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        setInputText(`Xin chào anh chị ${selectedSession.customerName}, Em là ${currentAdmin.fullName} xin được hỗ trợ mình ạ. Mình có vấn đề gì cần em hỗ trợ không ạ?`);
                      }}
                      className="flex items-center gap-1.5 text-xs text-primary hover:bg-primary/5 px-2.5 py-1 rounded border border-primary/20 font-semibold transition-colors cursor-pointer ml-2"
                    >
                      <span className="material-symbols-outlined text-sm">bolt</span>
                      Chào khách (/xinchao)
                    </button>
                  )}
                </div>
              </div>

              {/* Text input form */}
              <form onSubmit={handleSend} className="p-3 flex items-center gap-3">
                <input
                  type="text"
                  value={inputText}
                  onChange={handleInputChange}
                  disabled={isChatInputDisabled}
                  placeholder={
                    selectedSession.isClosed
                      ? "Cuộc hội thoại đã đóng"
                      : isDifferentAdminSupporting
                      ? `Nhân viên khác (${selectedSession.adminName}) đang nhận hỗ trợ`
                      : isNoAdminSupporting
                      ? "Bạn cần Nhận hỗ trợ để có thể nhắn tin"
                      : "Nhập tin nhắn..."
                  }
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-[8px] text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-slate-800 disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
                <button
                  type="submit"
                  disabled={isChatInputDisabled || !inputText.trim()}
                  className="bg-primary hover:bg-primary/95 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-full h-10 w-10 flex items-center justify-center shadow-md cursor-pointer transition-colors shrink-0"
                >
                  <span className="material-symbols-outlined text-lg">send</span>
                </button>
              </form>
            </div>

            {/* Image Zoom Modal */}
            {zoomedImage && (
              <div 
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
                onClick={() => setZoomedImage(null)}
              >
                <div className="relative max-w-4xl max-h-[90vh] flex items-center justify-center">
                  <button 
                    onClick={() => setZoomedImage(null)}
                    className="absolute -top-12 right-0 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-colors"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                  <img 
                    src={zoomedImage} 
                    alt="Zoomed" 
                    className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            )}
          </>
        ) : (
          /* Placeholder */
          <div className="flex-1 flex flex-col justify-center items-center text-slate-400 p-8 w-full">
            <span className="material-symbols-outlined text-6xl text-slate-300 mb-3 animate-pulse">
              chat_bubble
            </span>
            <h3 className="font-bold text-slate-700 text-lg mb-1">
              Trung tâm Chăm sóc khách hàng
            </h3>
            <p className="text-sm max-w-[400px] text-center text-slate-500">
              Hãy chọn một cuộc hội thoại từ danh sách bên trái để xem nội dung và bắt đầu hỗ trợ khách hàng.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminChatsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500 font-medium">Đang tải Trung tâm CSKH...</div>}>
      <AdminChatsContent />
    </Suspense>
  );
}
