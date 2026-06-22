"use client";

import React, { useState, useEffect, useRef } from "react";
import * as signalR from "@microsoft/signalr";
import { toast } from "sonner";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const ChatProductCard = ({ data, onZoomImage }: { data: any, onZoomImage?: (url: string) => void }) => {
  const [adding, setAdding] = useState(false);
  
  const handleAddToCart = async () => {
    try {
      setAdding(true);
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) {
        toast.error("Vui lòng đăng nhập để thêm vào giỏ hàng");
        return;
      }
      const API_BASE = process.env.NEXT_PUBLIC_API_URL
        ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, "")
        : "http://localhost:5101";
        
      const res = await fetch(`${API_BASE}/api/cart/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          variantID: data.variantId || data.productId,
          quantity: 1
        })
      });
      const result = await res.json();
      if (result.success || res.ok) {
        toast.success(`Đã thêm ${data.name} vào giỏ hàng!`);
        window.dispatchEvent(new Event("cart_updated"));
      } else {
        toast.error(result.message || "Không thể thêm vào giỏ hàng");
      }
    } catch (e) {
      toast.error("Lỗi khi thêm vào giỏ hàng");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all my-2 w-full">
      <div 
        className="w-[70px] shrink-0 bg-slate-50 flex items-center justify-center p-1.5 border-r border-slate-100 self-stretch min-h-[70px] cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => onZoomImage && onZoomImage(data.imageUrl || '/assets/img/products/default-product.jpg')}
        title="Phóng to ảnh"
      >
        <img src={data.imageUrl || '/assets/img/products/default-product.jpg'} alt={data.name} className="max-h-[60px] max-w-full object-contain mix-blend-multiply" />
      </div>
      <div className="p-2 flex flex-col justify-center flex-1 min-w-0 gap-1.5">
        <h4 
          className="text-[12px] font-semibold text-slate-700 leading-[1.4] whitespace-normal break-words" 
          title={data.name}
        >
          {data.name}
        </h4>
        <div className="flex items-center justify-between">
          <span className="text-primary font-bold text-[13px] truncate pr-1">
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(data.price || 0)}
          </span>
          <button 
            onClick={handleAddToCart}
            disabled={adding}
            className="bg-primary/10 hover:bg-primary text-primary hover:text-white disabled:bg-slate-100 disabled:text-slate-400 p-1.5 rounded-lg transition-colors flex items-center justify-center shrink-0 active:scale-95"
            title="Thêm giỏ hàng"
          >
            {adding ? (
              <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></span>
            ) : (
              <span className="material-symbols-outlined text-[16px]">add_shopping_cart</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

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

  return {
    id: msg.id !== undefined ? msg.id : msg.Id,
    chatSessionId: msg.chatSessionId !== undefined ? msg.chatSessionId : msg.ChatSessionId,
    senderId: msg.senderId !== undefined ? msg.senderId : msg.SenderId,
    senderName: msg.senderName !== undefined ? msg.senderName : msg.SenderName,
    isFromAdmin: msg.isFromAdmin !== undefined ? msg.isFromAdmin : msg.IsFromAdmin,
    messageText: rawText || null,
    imageUrl: null,
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

export default function CustomerChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isAdminTyping, setIsAdminTyping] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerTab, setPickerTab] = useState<"emoji" | "sticker">("emoji");
  const [isAiMode, setIsAiMode] = useState(true);
  const [showEndChatModal, setShowEndChatModal] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hubConnectionRef = useRef<signalR.HubConnection | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, "")
    : "http://localhost:5101";

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    }
  }, [messages, isAdminTyping, isOpen]);

  // Auto-close after 15 minutes of inactivity
  useEffect(() => {
    if (!isStarted || !sessionId || isClosed) return;

    const timeout = setTimeout(() => {
      handleResetChat();
      toast.info("Cuộc trò chuyện đã tự động kết thúc do bạn không hoạt động trong 15 phút.");
    }, 15 * 60 * 1000);

    return () => clearTimeout(timeout);
  }, [messages, isStarted, sessionId, isClosed]);

  // Load existing session on mount
  useEffect(() => {
    const initSession = async () => {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      let savedSessionId = localStorage.getItem("chat_session_id");

      if (token) {
        // Authenticated user: verify/retrieve active session
        try {
          const res = await fetch(`${API_BASE}/api/chat/session`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({}),
          });
          const data = await res.json();
          if (data.success) {
            setSessionId(data.session.id);
            setIsClosed(data.session.isClosed);
            setIsStarted(true);
            loadMessages(data.session.id);
            setupSignalR(data.session.id);
          }
        } catch (e) {
          console.error("Lỗi khi kết nối phiên chat cho tài khoản đăng nhập", e);
        }
      } else if (savedSessionId) {
        // Guest user with saved session
        setSessionId(savedSessionId);
        setIsStarted(true);
        loadMessages(savedSessionId);
        setupSignalR(savedSessionId);
      }
    };

    initSession();

    return () => {
      if (hubConnectionRef.current) {
        hubConnectionRef.current.stop();
      }
    };
  }, []);

  const loadMessages = async (sid: string) => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const headers: HeadersInit = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE}/api/chat/session/${sid}/messages`, {
        headers,
      });
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages.map(normalizeMessage));
      }
    } catch (e) {
      console.error("Lỗi tải tin nhắn cũ", e);
    }
  };

  const setupSignalR = (sid: string) => {
    if (hubConnectionRef.current) {
      hubConnectionRef.current.stop();
    }

    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    const hubUrl = token
      ? `${API_BASE}/chatHub?access_token=${token}`
      : `${API_BASE}/chatHub`;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl)
      .withAutomaticReconnect()
      .build();

    connection.on("ReceiveMessage", (message: Message) => {
      const normalized = normalizeMessage(message);
      setMessages((prev) => {
        // Lọc bỏ tin nhắn tạm thời (optimistic update có id âm) khi nhận được tin nhắn thực
        const filtered = prev.filter(m => m.id > 0);
        if (filtered.some((m) => m.id === normalized.id)) return filtered;
        return [...filtered, normalized];
      });
      // Đánh dấu đã đọc ở client khi nhận tin nhắn trong khi đang mở chat
      if (isOpen && !normalized.isFromAdmin) {
        markAsRead(sid);
      }
    });

    connection.on("ReceiveTypingStatus", (senderName: string, isTyping: boolean) => {
      if (senderName === "Admin") {
        setIsAdminTyping(isTyping);
      }
    });

    connection.on("SessionClosed", (closedId: string) => {
      if (closedId === sid) {
        setIsClosed(true);
        toast.info("Cuộc trò chuyện đã được đóng bởi quản trị viên.");
      }
    });

    connection.on("CartUpdated", () => {
      // Dispatch a custom event so header cart updates if listening
      window.dispatchEvent(new Event("cart_updated"));
    });

    connection
      .start()
      .then(() => {
        connection.invoke("JoinRoom", sid);
        hubConnectionRef.current = connection;
      })
      .catch((err) => console.error("SignalR Connection Error: ", err));
  };

  const markAsRead = async (sid: string) => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const headers: HeadersInit = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      await fetch(`${API_BASE}/api/chat/session/${sid}/messages`, { headers });
    } catch (e) {
      console.error(e);
    }
  };

  const startGuestChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;

    try {
      const guestSessionId = crypto.randomUUID();
      const res = await fetch(`${API_BASE}/api/chat/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestSessionId,
          customerName: guestName,
        }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("chat_session_id", data.session.id);
        setSessionId(data.session.id);
        setIsStarted(true);
        setupSignalR(data.session.id);
      } else {
        toast.error("Không thể khởi động chat, vui lòng thử lại.");
      }
    } catch (e) {
      toast.error("Có lỗi xảy ra khi kết nối máy chủ.");
    }
  };

  // Thêm state hàng chờ cho AI
  const [aiMessageQueue, setAiMessageQueue] = useState<{ id: number, text: string }[]>([]);

  // Effect xử lý hàng chờ AI tuần tự
  useEffect(() => {
    if (isAiMode && aiMessageQueue.length > 0 && !isAdminTyping) {
      const nextItem = aiMessageQueue[0];
      processAiMessage(nextItem.id, nextItem.text);
    }
  }, [aiMessageQueue, isAdminTyping, isAiMode]);

  const processAiMessage = async (tempId: number, textToSend: string) => {
    try {
      setIsAdminTyping(true);
      
      const res = await fetch(`${API_BASE}/api/chatbot/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sessionId || "ai-session", message: textToSend }),
      });

      if (res.ok) {
        const data = await res.json();
        
        // Tạo tin nhắn AI
        const aiMsg: Message = {
          id: Date.now() + Math.random(),
          chatSessionId: sessionId || "ai-session",
          senderId: "ai",
          senderName: "LazPe AI",
          isFromAdmin: true,
          messageText: data.text,
          imageUrl: null,
          createdAt: new Date().toISOString()
        };

        // Cập nhật state: xóa trạng thái "Đang gửi" của tin nhắn user, thêm tin nhắn AI
        setMessages((prev) => {
          const updatedMessages = prev.map(m => m.id === tempId ? { ...m, id: Date.now() + Math.random() } : m);
          return [...updatedMessages, aiMsg];
        });
      } else {
        const errData = await res.json().catch(() => null);
        const errMsg = errData?.error || "AI không thể phản hồi lúc này.";
        toast.error(errMsg);
        // Gửi lỗi, xóa tin nhắn tạm
        setMessages((prev) => prev.filter(m => m.id !== tempId));
      }
    } catch (e) {
      toast.error("Lỗi kết nối AI.");
      setMessages((prev) => prev.filter(m => m.id !== tempId));
    } finally {
      setIsAdminTyping(false);
      // Xóa khỏi hàng chờ để xử lý câu tiếp theo
      setAiMessageQueue(prev => prev.slice(1));
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId && !isAiMode) return;
    if (!inputText.trim()) return;

    const tempId = -(Date.now() + Math.random());
    const tempMsg: Message = {
      id: tempId,
      chatSessionId: sessionId || "ai-session",
      senderId: null,
      senderName: guestName || "Khách hàng",
      isFromAdmin: false,
      messageText: inputText.trim(),
      imageUrl: null,
      createdAt: new Date().toISOString()
    };

    setMessages((prev) => [...prev, tempMsg]);

    const textToSend = inputText.trim();
    setInputText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    if (isAiMode) {
      // Cho vào hàng chờ, AI sẽ tự động xử lý tuần tự qua useEffect
      setAiMessageQueue(prev => [...prev, { id: tempId, text: textToSend }]);
      return;
    }

    const formData = new FormData();
    formData.append("messageText", textToSend);

    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const headers: HeadersInit = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE}/api/chat/session/${sessionId}/message`, {
        method: "POST",
        headers,
        body: formData,
      });

      const data = await res.json();
      if (!data.success) {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        toast.error(data.message || "Không thể gửi tin nhắn.");
      } else {
        if (isClosed) {
          setIsClosed(false);
        }
      }
    } catch (e) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      toast.error("Gửi tin nhắn thất bại. Vui lòng kiểm tra kết nối mạng.");
    }
  };

  const sendSticker = async (stickerUrl: string) => {
    if (!sessionId) return;

    const tempId = -(Date.now() + Math.random());
    const tempMsg: Message = {
      id: tempId,
      chatSessionId: sessionId,
      senderId: null,
      senderName: guestName || "Khách hàng",
      isFromAdmin: false,
      messageText: stickerUrl,
      imageUrl: null,
      createdAt: new Date().toISOString()
    };

    setMessages((prev) => [...prev, tempMsg]);
    setShowPicker(false);

    const formData = new FormData();
    formData.append("messageText", stickerUrl);

    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const headers: HeadersInit = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/api/chat/session/${sessionId}/message`, {
        method: "POST",
        headers,
        body: formData,
      });

      const data = await res.json();
      if (!data.success) {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        toast.error(data.message || "Không thể gửi sticker.");
      } else {
        if (isClosed) setIsClosed(false);
      }
    } catch (e) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      toast.error("Gửi sticker thất bại.");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);

    // Auto-resize logic
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;

    if (hubConnectionRef.current && sessionId) {
      hubConnectionRef.current.invoke(
        "SendTypingStatus",
        sessionId,
        guestName || "Khách hàng",
        e.target.value.length > 0
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (inputText.trim()) {
        handleSend(e as unknown as React.FormEvent);
      }
    }
  };

  const handleResetChat = async () => {
    setShowEndChatModal(false);
    localStorage.removeItem("chat_session_id");
    setSessionId(null);
    setIsClosed(false);
    setMessages([]);

    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (token) {
      try {
        const res = await fetch(`${API_BASE}/api/chat/session`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ forceNew: true }),
        });
        const data = await res.json();
        if (data.success) {
          setSessionId(data.session.id);
          setIsClosed(data.session.isClosed);
          setIsStarted(true);
          setupSignalR(data.session.id);
        }
      } catch (e) {
        toast.error("Không thể tạo cuộc trò chuyện mới.");
      }
    } else {
      setIsStarted(false);
    }
  };

  const toggleOpen = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState && sessionId) {
      markAsRead(sessionId);
    }
  };

  return (
    <>
      {/* FAB Button Premium Style */}
      <button
        onClick={toggleOpen}
        className={`fixed bottom-6 right-6 z-50 h-14 w-14 rounded-[16px] bg-gradient-to-tr from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white flex items-center justify-center shadow-lg shadow-primary/30 cursor-pointer transition-all duration-300 transform active:scale-95 ${isOpen ? "hidden sm:flex" : "flex"}`}
      >
        <span className="material-symbols-outlined text-[28px]">
          {isOpen ? "close" : "forum"}
        </span>
      </button>

      {/* Chat Window Container Premium Style */}
      {isOpen && (
        <div
          className="fixed bottom-0 right-0 sm:bottom-24 sm:right-6 z-[60] w-full sm:w-[460px] h-[100dvh] sm:h-[600px] sm:max-h-[85vh] bg-white sm:rounded-3xl sm:border border-slate-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 fade-in duration-300 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)]"
        >
          {/* Premium Gradient Header */}
          <div className="bg-gradient-to-r from-primary to-primary/90 text-white px-5 py-4 flex items-center justify-between select-none shadow-sm relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
            <div className="flex items-center gap-3 relative z-10">
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-base text-white">
                {isAiMode ? "AI" : "LP"}
              </div>
              <div>
                <h3 className="font-semibold text-base leading-tight">
                  {isAiMode ? "LazPe AI Assistant" : "Hỗ trợ LazPe"}
                </h3>
                <span className="text-xs text-blue-100 flex items-center gap-1.5 mt-0.5">
                  <span className="h-2 w-2 rounded-full bg-[#4eff8a] inline-block animate-pulse"></span>
                  Trực tuyến
                </span>
              </div>
            </div>

            {/* Header Action Icons */}
            <div className="flex items-center gap-1.5 text-white/90 relative z-10">
              <button
                onClick={() => setIsAiMode(!isAiMode)}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all ${isAiMode ? "bg-white text-primary border-white shadow-sm" : "bg-white/10 border-white/20 hover:bg-white/20"}`}
                title="Chuyển đổi chế độ AI / Nhân viên"
              >
                {isAiMode ? "AI Mode" : "Human"}
              </button>
              {isStarted && (
                <button
                  onClick={() => setShowEndChatModal(true)}
                  className="hover:text-white material-symbols-outlined rounded-full p-1 hover:bg-white/20 transition-colors cursor-pointer text-xl"
                  title="Kết thúc trò chuyện"
                >
                  delete
                </button>
              )}
              <button
                onClick={toggleOpen}
                className="hover:text-white material-symbols-outlined rounded-full p-1 hover:bg-white/20 transition-colors cursor-pointer text-xl"
              >
                close
              </button>
            </div>
          </div>

          {/* Messages Area Soft Background */}
          <div className="flex-1 bg-slate-50/80 backdrop-blur-md flex flex-col min-h-0 overflow-y-auto p-4 space-y-5" style={{ scrollbarWidth: "thin" }}>
            {!isStarted ? (
              /* Start Chat Form for Guest */
              <div className="flex-1 flex flex-col justify-center items-center text-center p-6 bg-white/60 backdrop-blur-lg rounded-3xl m-2 shadow-sm border border-white/50">
                <div className="w-20 h-20 bg-primary-container rounded-full flex items-center justify-center mb-5">
                  <span className="material-symbols-outlined text-on-primary-container text-4xl">forum</span>
                </div>
                <h4 className="font-extrabold text-slate-800 text-xl mb-2">Chào mừng đến LazPe</h4>
                <p className="text-sm text-slate-500 mb-6 max-w-[260px] leading-relaxed">
                  Vui lòng cho biết tên của bạn để bắt đầu trò chuyện trực tuyến với chúng tôi.
                </p>
                <form onSubmit={startGuestChat} className="w-full space-y-4">
                  <input
                    type="text"
                    required
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Nhập tên của bạn..."
                    className="w-full px-5 py-3.5 border-0 bg-white rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-slate-800 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-shadow"
                  />
                  <button
                    type="submit"
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-4 rounded-2xl text-sm transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-[0.98]"
                  >
                    Bắt đầu trò chuyện
                  </button>
                </form>
              </div>
            ) : (
              /* Message Thread */
              <>
                {messages.length === 0 ? (
                  <div className="text-center text-slate-500 py-10 text-xs bg-white/50 rounded-xl p-4">
                    Bắt đầu cuộc trò chuyện. Hãy gửi lời chào đến chúng tôi!
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isSystemMessage = msg.senderName === "Hệ thống";

                    if (isSystemMessage) {
                      return (
                        <div key={msg.id} className="w-full text-center my-2">
                          <span className="bg-slate-200/80 text-slate-600 text-[11px] px-3 py-1 rounded-full inline-block shadow-sm">
                            {msg.messageText}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${msg.isFromAdmin ? "items-start" : "items-end"}`}
                      >
                        <span className="text-[10px] text-slate-400 font-medium mb-1 px-1">
                          {msg.senderName} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>

                        <div
                          className={`max-w-[85%] rounded-[20px] px-4 py-2.5 text-[14px] leading-relaxed shadow-sm ${msg.isFromAdmin
                            ? "bg-white text-slate-700 rounded-tl-sm border border-slate-100/50"
                            : "bg-primary text-white rounded-tr-sm"
                            } ${msg.id < 0 ? "opacity-70" : ""} ${isMediaUrl(msg.messageText) ? "!bg-transparent !border-none !shadow-none !p-0" : ""}`}
                        >
                          {isMediaUrl(msg.messageText) ? (
                            <img
                              src={msg.messageText?.trim()}
                              alt="Sticker"
                              className="max-w-[140px] max-h-[140px] rounded-lg object-contain bg-transparent"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                          ) : (
                            msg.messageText && (
                              <div className="prose prose-sm prose-slate max-w-none break-words leading-relaxed">
                                <ReactMarkdown 
                                  remarkPlugins={[remarkGfm]}
                                  components={{
                                    code: ({ node, inline, className, children, ...props }: any) => {
                                      const match = /language-(\w+)/.exec(className || '');
                                      if (!inline && match && match[1] === 'product_card') {
                                        try {
                                          const data = JSON.parse(String(children).replace(/\n$/, ''));
                                          return <ChatProductCard data={data} onZoomImage={setZoomedImage} />;
                                        } catch (e) {
                                          return <code className={className} {...props}>{children}</code>;
                                        }
                                      }
                                      return <code className={className} {...props}>{children}</code>;
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
                {isAdminTyping && (
                  <div className="flex items-center gap-1 text-xs text-slate-500 py-1.5 pl-2 bg-white/40 rounded-full w-fit px-3 shadow-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-500 animate-bounce"></span>
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-500 animate-bounce delay-75"></span>
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-500 animate-bounce delay-150"></span>
                    <span className="ml-1 text-[11px] font-medium text-slate-600">
                      {isAiMode ? "LazPe AI đang suy nghĩ..." : "Nhân viên đang soạn tin..."}
                    </span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Footer Input Area Premium Style */}
          {isStarted && (
            isClosed ? (
              <div className="p-5 bg-white/90 backdrop-blur border-t border-slate-100 flex flex-col items-center gap-3 shrink-0">
                <p className="text-xs text-slate-500 font-semibold">Cuộc hội thoại đã kết thúc.</p>
                <button
                  type="button"
                  onClick={handleResetChat}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-4 rounded-2xl text-sm transition-all cursor-pointer text-center shadow-md active:scale-[0.98]"
                >
                  Bắt đầu cuộc chat mới
                </button>
              </div>
            ) : (
              <div className="bg-white/95 backdrop-blur-md border-t border-slate-100 flex flex-col shrink-0 relative pb-safe">


                {/* Text input form */}
                <form onSubmit={handleSend} className="px-4 pb-4 pt-1 flex items-end gap-2">
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    value={inputText}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Gửi tin nhắn..."
                    className="flex-1 px-4 py-3 bg-slate-50/80 border-0 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-800 resize-none max-h-[100px] overflow-y-auto min-h-[44px] leading-relaxed shadow-[inset_0_1px_3px_rgba(0,0,0,0.02)] transition-shadow"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className="text-primary hover:text-primary/80 disabled:text-slate-300 disabled:opacity-50 p-2 flex items-center justify-center cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-2xl font-bold">send</span>
                  </button>
                </form>
              </div>
            )
          )}

          {/* End Chat Confirm Modal Overlay */}
          {showEndChatModal && (
            <div className="absolute inset-0 bg-black/40 z-50 flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-white rounded-2xl w-[320px] shadow-2xl p-6 flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-3xl">delete_sweep</span>
                </div>
                <h3 className="font-bold text-lg text-slate-800 mb-2">Kết thúc trò chuyện?</h3>
                <p className="text-sm text-slate-500 mb-6">Bạn có chắc chắn muốn xóa lịch sử và kết thúc cuộc trò chuyện này không?</p>
                <div className="flex w-full gap-3">
                  <button 
                    onClick={() => setShowEndChatModal(false)}
                    className="flex-1 py-2.5 rounded-xl font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                  >
                    Hủy
                  </button>
                  <button 
                    onClick={() => handleResetChat()}
                    className="flex-1 py-2.5 rounded-xl font-medium bg-red-500 text-white hover:bg-red-600 transition-colors shadow-sm shadow-red-200"
                  >
                    Xác nhận
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Image Zoom Modal */}
          {zoomedImage && (
            <div 
              className="absolute inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 animate-in fade-in cursor-zoom-out"
              onClick={() => setZoomedImage(null)}
            >
              <button 
                className="absolute top-4 right-4 text-white hover:text-gray-300 p-2 material-symbols-outlined rounded-full bg-black/20 hover:bg-black/40 transition-colors"
                onClick={(e) => { e.stopPropagation(); setZoomedImage(null); }}
              >
                close
              </button>
              <img 
                src={zoomedImage} 
                alt="Zoomed" 
                className="max-w-full max-h-full object-contain rounded-xl shadow-2xl animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
        </div>
      )}
    </>
  );
}
