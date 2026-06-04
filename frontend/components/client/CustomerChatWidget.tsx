"use client";

import React, { useState, useEffect, useRef } from "react";
import * as signalR from "@microsoft/signalr";
import { toast } from "sonner";

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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hubConnectionRef = useRef<signalR.HubConnection | null>(null);

  const API_BASE = "http://localhost:5101";

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAdminTyping]);

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

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId) return;
    if (!inputText.trim()) return;

    // --- OPTIMISTIC UI UPDATE ---
    const tempId = -Date.now();
    const tempMsg: Message = {
      id: tempId,
      chatSessionId: sessionId,
      senderId: null,
      senderName: guestName || "Khách hàng",
      isFromAdmin: false,
      messageText: inputText.trim(),
      imageUrl: null,
      createdAt: new Date().toISOString()
    };

    // Thêm tin nhắn tạm vào danh sách ngay lập tức để tạo cảm giác phản hồi tức thì
    setMessages((prev) => [...prev, tempMsg]);

    const textToSend = inputText.trim();

    // Reset các trường nhập liệu trên giao diện ngay lập tức
    setInputText("");

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
        // Nếu lỗi, xóa tin nhắn tạm và thông báo
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

    const tempId = -Date.now();
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (hubConnectionRef.current && sessionId) {
      hubConnectionRef.current.invoke(
        "SendTypingStatus",
        sessionId,
        guestName || "Khách hàng",
        e.target.value.length > 0
      );
    }
  };

  const handleResetChat = async () => {
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
      {/* FAB Button Zalo Style */}
      <button
        onClick={toggleOpen}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-[#0068ff] hover:bg-[#0056d6] text-white flex items-center justify-center shadow-lg cursor-pointer bouncy-hover transition-transform duration-300 transform active:scale-95"
        style={{
          boxShadow: "0 8px 24px rgba(0, 104, 255, 0.3)",
        }}
      >
        <span className="material-symbols-outlined text-3xl">
          {isOpen ? "close" : "sms"}
        </span>
      </button>

      {/* Chat Window Container Zalo Style (Tăng kích thước to hơn) */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-6 z-50 w-[430px] max-w-[95vw] h-[610px] max-h-[85vh] bg-[#f4f6f9] rounded-2xl border border-slate-200/80 flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300 shadow-2xl"
          style={{
            boxShadow: "0 12px 40px rgba(0, 0, 0, 0.16)",
          }}
        >
          {/* Zalo Blue Header */}
          <div className="bg-[#0068ff] text-white px-4 py-3.5 flex items-center justify-between select-none">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-base text-white">
                LP
              </div>
              <div>
                <h3 className="font-semibold text-base leading-tight">Hỗ trợ LazPe</h3>
                <span className="text-xs text-blue-100 flex items-center gap-1.5 mt-0.5">
                  <span className="h-2 w-2 rounded-full bg-[#4eff8a] inline-block animate-pulse"></span>
                  Trực tuyến
                </span>
              </div>
            </div>

            {/* Header Action Icons */}
            <div className="flex items-center gap-2 text-white/90">
              <span className="material-symbols-outlined hover:text-white p-1 hover:bg-white/10 rounded-full transition-colors cursor-pointer text-xl">phone</span>
              <span className="material-symbols-outlined hover:text-white p-1 hover:bg-white/10 rounded-full transition-colors cursor-pointer text-xl">videocam</span>
              <button
                onClick={toggleOpen}
                className="hover:text-white material-symbols-outlined rounded-full p-1 hover:bg-white/10 transition-colors cursor-pointer text-xl"
              >
                close
              </button>
            </div>
          </div>

          {/* Messages Area Zalo Gray-Blue Background */}
          <div className="flex-1 bg-[#e2e9f1] flex flex-col min-h-0 overflow-y-auto p-4 space-y-4" style={{ scrollbarWidth: "thin" }}>
            {!isStarted ? (
              /* Start Chat Form for Guest */
              <div className="flex-1 flex flex-col justify-center items-center text-center p-6 bg-white rounded-2xl m-2 shadow-sm">
                <span className="material-symbols-outlined text-[#0068ff] text-6xl mb-4">chat</span>
                <h4 className="font-bold text-slate-800 text-lg mb-2">Chào mừng bạn đến với LazPe</h4>
                <p className="text-sm text-slate-500 mb-6 max-w-[260px]">
                  Vui lòng cho biết tên của bạn để bắt đầu trò chuyện trực tuyến với chúng tôi.
                </p>
                <form onSubmit={startGuestChat} className="w-full space-y-4">
                  <input
                    type="text"
                    required
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Nhập tên của bạn..."
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#0068ff] focus:ring-2 focus:ring-blue-500/20 bg-white text-slate-800"
                  />
                  <button
                    type="submit"
                    className="w-full bg-[#0068ff] hover:bg-[#0056d6] text-white font-bold py-3 px-4 rounded-xl text-sm transition-colors cursor-pointer shadow-md shadow-blue-500/10"
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
                        <span className="text-[10px] text-slate-500 mb-0.5 px-1.5">
                          {msg.senderName} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>

                        <div
                          className={`max-w-[80%] rounded-2xl p-3 text-[14px] leading-relaxed shadow-sm ${msg.isFromAdmin
                            ? "bg-white text-slate-800 rounded-tl-sm border border-slate-100/30"
                            : "bg-[#cce4ff] text-[#081c36] rounded-tr-sm"
                            } ${msg.id < 0 ? "opacity-75" : ""} ${isMediaUrl(msg.messageText) ? "!bg-transparent !border-none !shadow-none" : ""}`}
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
                            msg.messageText && <p className="whitespace-pre-wrap">{msg.messageText}</p>
                          )}
                        </div>
                        {msg.id < 0 && (
                          <span className="text-[9px] text-[#0068ff] italic mt-0.5 px-1 animate-pulse">
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
                    <span className="ml-1 text-[11px] font-medium text-slate-600">Nhân viên đang soạn tin...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Footer Input Area Zalo Style */}
          {isStarted && (
            isClosed ? (
              <div className="p-4 bg-white border-t border-slate-200 flex flex-col items-center gap-2 shrink-0">
                <p className="text-xs text-slate-500 font-medium">Cuộc hội thoại đã được đóng.</p>
                <button
                  type="button"
                  onClick={handleResetChat}
                  className="w-full bg-[#0068ff] hover:bg-[#0056d6] text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-colors cursor-pointer text-center shadow-md shadow-blue-500/10"
                >
                  Bắt đầu cuộc chat mới
                </button>
              </div>
            ) : (
              <div className="bg-white border-t border-slate-200 flex flex-col shrink-0 relative">
                {/* Emoji/Sticker Picker Popup */}
                {showPicker && (
                  <div className="absolute bottom-full right-4 mb-2 w-80 h-72 bg-white rounded-xl shadow-2xl border border-slate-200 flex flex-col z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
                    {/* Picker Tabs */}
                    <div className="flex border-b border-slate-100 text-xs shrink-0 select-none">
                      <button
                        type="button"
                        onClick={() => setPickerTab("emoji")}
                        className={`flex-1 py-2 font-bold cursor-pointer transition-colors ${pickerTab === "emoji" ? "text-[#0068ff] border-b-2 border-[#0068ff]" : "text-slate-500 hover:text-slate-900"
                          }`}
                      >
                        Biểu cảm
                      </button>
                      <button
                        type="button"
                        onClick={() => setPickerTab("sticker")}
                        className={`flex-1 py-2 font-bold cursor-pointer transition-colors ${pickerTab === "sticker" ? "text-[#0068ff] border-b-2 border-[#0068ff]" : "text-slate-500 hover:text-slate-900"
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
                                // giữ trạng thái không đóng picker ngay để chọn được nhiều emoji
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
                              <span className="text-[10px] text-slate-500 mt-1 truncate max-w-full group-hover:text-[#0068ff]">
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
                <div className="flex items-center gap-3 px-3 py-1.5 border-b border-slate-100 text-slate-400">
                  <button
                    type="button"
                    onClick={() => setShowPicker(!showPicker)}
                    className={`hover:text-[#0068ff] hover:bg-slate-100 p-1.5 rounded-full transition-colors material-symbols-outlined text-xl cursor-pointer ${showPicker ? "text-[#0068ff] bg-slate-100" : ""
                      }`}
                    title="Cảm xúc & Sticker"
                  >
                    sentiment_satisfied
                  </button>
                </div>

                {/* Text input form */}
                <form onSubmit={handleSend} className="p-3 flex items-center gap-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={handleInputChange}
                    placeholder="Nhập tin nhắn..."
                    className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:border-[#0068ff] focus:ring-1 focus:ring-blue-500/10 text-slate-800"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className="text-[#0068ff] hover:text-[#0056d6] disabled:text-slate-300 disabled:opacity-50 p-2 flex items-center justify-center cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-2xl font-bold">send</span>
                  </button>
                </form>
              </div>
            )
          )}
        </div>
      )}
    </>
  );
}
