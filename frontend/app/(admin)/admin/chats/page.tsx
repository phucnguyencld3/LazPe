"use client";

import React, { useState, useEffect, useRef } from "react";
import * as signalR from "@microsoft/signalr";
import { toast } from "sonner";

interface ChatSession {
  id: string;
  userId: string | null;
  customerName: string;
  adminId: string | null;
  adminName: string | null;
  createdAt: string;
  updatedAt: string;
  isClosed: boolean;
  lastMessageText: string | null;
  unreadByAdmin: number;
  unreadByCustomer: number;
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

export default function AdminChatsPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "closed">("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentAdmin, setCurrentAdmin] = useState<{ id: string; fullName: string } | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerTab, setPickerTab] = useState<"emoji" | "sticker">("emoji");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hubConnectionRef = useRef<signalR.HubConnection | null>(null);

  const API_BASE = "http://localhost:5101";

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load chat sessions on mount & setup SignalR
  useEffect(() => {
    loadSessions();
    setupSignalR();
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
      if (data.success) {
        setSessions(data.sessions);
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

  const setupSignalR = () => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE}/chatHub?access_token=${token}`)
      .withAutomaticReconnect()
      .build();

    connection.on("ReceiveMessage", (message: Message) => {
      const normalized = normalizeMessage(message);
      // Nếu tin nhắn thuộc phòng đang chọn
      setSelectedSession(curr => {
        if (curr && curr.id === normalized.chatSessionId) {
          setMessages(prev => {
            // Lọc bỏ tin nhắn tạm có ID âm khi nhận tin nhắn chính thức từ SignalR
            const filtered = prev.filter(m => m.id > 0);
            if (filtered.some(m => m.id === normalized.id)) return filtered;
            return [...filtered, normalized];
          });
          // Đánh dấu đã đọc trên server
          markAsRead(normalized.chatSessionId);
        }
        return curr;
      });

      // Cập nhật danh sách session
      loadSessions();
    });

    connection.on("UpdateAdminSessions", () => {
      loadSessions();
    });

    connection
      .start()
      .then(() => {
        hubConnectionRef.current = connection;
      })
      .catch(err => console.error("Admin SignalR Connection Error: ", err));
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

  const selectRoom = (session: ChatSession) => {
    setSelectedSession(session);
    loadMessages(session.id);
    if (hubConnectionRef.current) {
      if (selectedSession) {
        hubConnectionRef.current.invoke("LeaveRoom", selectedSession.id);
      }
      hubConnectionRef.current.invoke("JoinRoom", session.id);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSession) return;
    if (!inputText.trim()) return;

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
        setSelectedSession(prev => prev ? { ...prev, adminId: data.adminId, adminName: data.adminName } : null);
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

  // Lọc và Tìm kiếm phòng chat
  const filteredSessions = sessions.filter(s => {
    const matchesSearch = s.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (s.lastMessageText && s.lastMessageText.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (filter === "active") return matchesSearch && !s.isClosed;
    if (filter === "closed") return matchesSearch && s.isClosed;
    return matchesSearch;
  });

  const isDifferentAdminSupporting = !!(selectedSession?.adminId && currentAdmin && selectedSession.adminId !== currentAdmin.id);
  const isChatInputDisabled = !!(selectedSession?.isClosed || isDifferentAdminSupporting);

  return (
    <div className="flex w-full flex-1 bg-white rounded-2xl overflow-hidden border border-slate-200 min-h-0">
      {/* Left panel: Sessions list */}
      <div className="w-80 border-r border-slate-200 flex flex-col bg-slate-50 shrink-0">
        {/* Search & Filter */}
        <div className="p-4 border-b border-slate-200 space-y-3">
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
          {filteredSessions.length === 0 ? (
            <div className="text-center text-slate-400 py-10 text-sm">
              Không tìm thấy cuộc trò chuyện nào.
            </div>
          ) : (
            filteredSessions.map(session => (
              <div
                key={session.id}
                onClick={() => selectRoom(session)}
                className={`p-4 border-b border-slate-100 flex items-start gap-3 cursor-pointer transition-colors duration-200 ${
                  selectedSession?.id === session.id
                    ? "bg-primary/5 border-l-4 border-primary"
                    : "hover:bg-slate-100/50 bg-white"
                }`}
              >
                <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                  {session.customerName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <h4 className="font-semibold text-slate-800 text-sm truncate pr-2">
                      {session.customerName}
                    </h4>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {new Date(session.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate mb-1">
                    {session.lastMessageText || "[Không có tin nhắn]"}
                  </p>
                  
                  <div className="flex items-center gap-1.5">
                    {session.isClosed ? (
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium">Đã đóng</span>
                    ) : (
                      <span className="text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded font-medium">Hoạt động</span>
                    )}

                    {session.unreadByAdmin > 0 && (
                      <span className="ml-auto bg-rose-500 text-white text-[10px] font-bold h-4 min-w-4 px-1 rounded-full flex items-center justify-center">
                        {session.unreadByAdmin}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
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
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    ID: {selectedSession.id}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!selectedSession.isClosed ? (
                  <button
                    onClick={closeRoom}
                    className="flex items-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold px-3 py-2 rounded-full cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">cancel</span>
                    Đóng cuộc chat
                  </button>
                ) : (
                  <span className="text-xs bg-slate-200 text-slate-600 font-semibold px-3 py-2 rounded-full">
                    Cuộc trò chuyện đã đóng
                  </span>
                )}
              </div>
            </div>

            {/* Claim/Staff Status Banner */}
            {!selectedSession.isClosed && (
              <div className="px-4 py-2 bg-white border-b text-xs flex justify-between items-center shrink-0">
                {!selectedSession.adminId ? (
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 p-2.5 rounded-lg w-full flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className="material-symbols-outlined text-sm">warning</span>
                      Chưa có nhân viên nhận hỗ trợ cuộc chat này.
                    </span>
                    <button
                      onClick={claimRoom}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-1 px-3 rounded-full text-[11px] transition-colors cursor-pointer"
                    >
                      Nhận hỗ trợ
                    </button>
                  </div>
                ) : selectedSession.adminId === currentAdmin?.id ? (
                  <div className="bg-green-50 border border-green-200 text-green-800 p-2.5 rounded-lg w-full flex items-center gap-1.5 font-medium">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    Bạn đang hỗ trợ khách hàng này.
                  </div>
                ) : (
                  <div className="bg-rose-50 border border-rose-200 text-rose-800 p-2.5 rounded-lg w-full flex items-center gap-1.5 font-medium">
                    <span className="material-symbols-outlined text-sm">lock</span>
                    Cuộc chat này đang được nhận hỗ trợ bởi nhân viên: <strong className="underline">{selectedSession.adminName}</strong>
                  </div>
                )}
              </div>
            )}

            {/* Messages area Zalo Style Background */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-[#e2e9f1]" style={{ scrollbarWidth: "thin" }}>
              {messages.length === 0 ? (
                <div className="text-center text-slate-500 py-10 text-xs bg-white/40 rounded-xl p-4">
                  Không có tin nhắn nào trong phòng này.
                </div>
              ) : (
                messages.map(msg => {
                  const isSystem = msg.senderName === "Hệ thống";
                  
                  if (isSystem) {
                    return (
                      <div key={msg.id} className="w-full flex justify-center my-2 select-none">
                        <span className="bg-slate-200/90 text-slate-600 text-[11px] px-3 py-1 rounded-full shadow-sm">
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
                      <span className="text-[10px] text-slate-500 mb-0.5 px-1">
                        {msg.senderName} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <div
                        className={`max-w-[70%] rounded-2xl p-3 text-sm shadow-sm ${
                          msg.isFromAdmin
                            ? "bg-[#cce4ff] text-[#081c36] rounded-tr-none"
                            : "bg-white text-slate-800 rounded-tl-none border border-slate-100/30"
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
              <div ref={messagesEndRef} />
            </div>

            {/* Zalo Style Input Area */}
            <div className="bg-white border-t border-slate-200 flex flex-col shrink-0 relative">
              {/* Emoji/Sticker Picker Popup */}
              {showPicker && (
                <div className="absolute bottom-full left-4 mb-2 w-80 h-72 bg-white rounded-xl shadow-2xl border border-slate-200 flex flex-col z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
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
                    className={`hover:text-primary hover:bg-slate-100 p-1.5 rounded transition-colors material-symbols-outlined text-lg cursor-pointer ${
                      showPicker ? "text-primary bg-slate-100" : "text-slate-400"
                    }`}
                    title="Cảm xúc & Sticker"
                  >
                    sentiment_satisfied
                  </button>
                  
                  {/* Phím tắt trả lời nhanh */}
                  {!selectedSession.isClosed && !isDifferentAdminSupporting && currentAdmin && (
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
                      : "Nhập tin nhắn..."
                  }
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-slate-800 disabled:bg-slate-100 disabled:cursor-not-allowed"
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
