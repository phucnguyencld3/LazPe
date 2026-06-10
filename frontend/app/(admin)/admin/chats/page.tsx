"use client";

import React, { useState, useEffect, useRef } from "react";
import * as signalR from "@microsoft/signalr";
import { toast } from "sonner";
import Button from "@/components/admin/ui/Button";
import Badge from "@/components/admin/ui/Badge";
import Input from "@/components/admin/ui/Input";

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

  const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5101").replace(/\/api$/, "");

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

  const getAvatarColors = (name: string) => {
    const chars = name ? name.trim().toUpperCase() : "KH";
    const code = chars.charCodeAt(0) || 0;
    switch (code % 3) {
      case 0:
        return "bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400";
      case 1:
        return "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-400";
      case 2:
      default:
        return "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-orange-400";
    }
  };

  return (
    <div className="flex w-full flex-1 bg-white dark:bg-white/[0.03] rounded-2xl overflow-hidden border border-gray-200 dark:border-white/[0.05] min-h-[600px] font-outfit shadow-theme-xs">
      {/* Left panel: Sessions list */}
      <div className="w-80 border-r border-gray-200 dark:border-white/[0.05] flex flex-col bg-gray-50/50 dark:bg-white/[0.01] shrink-0">
        {/* Search & Filter */}
        <div className="p-4 border-b border-gray-200 dark:border-white/[0.05] space-y-3">
          <div className="relative group">
            <Input
              placeholder="Tìm khách hàng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 h-9 text-xs rounded-full"
            />
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base group-focus-within:text-brand-500 transition-colors pointer-events-none">
              search
            </span>
          </div>

          <div className="flex bg-gray-150 dark:bg-white/5 p-0.5 rounded-full text-[11px] font-semibold">
            <button
              onClick={() => setFilter("active")}
              className={`flex-1 py-1.5 rounded-full font-bold transition-all cursor-pointer ${
                filter === "active" ? "bg-white dark:bg-gray-800 text-brand-500 shadow-theme-xs" : "text-gray-500 hover:text-gray-900 dark:text-gray-450 dark:hover:text-white"
              }`}
            >
              Chờ hỗ trợ
            </button>
            <button
              onClick={() => setFilter("closed")}
              className={`flex-1 py-1.5 rounded-full font-bold transition-all cursor-pointer ${
                filter === "closed" ? "bg-white dark:bg-gray-800 text-brand-500 shadow-theme-xs" : "text-gray-500 hover:text-gray-900 dark:text-gray-450 dark:hover:text-white"
              }`}
            >
              Đã đóng
            </button>
            <button
              onClick={() => setFilter("all")}
              className={`flex-1 py-1.5 rounded-full font-bold transition-all cursor-pointer ${
                filter === "all" ? "bg-white dark:bg-gray-800 text-brand-500 shadow-theme-xs" : "text-gray-500 hover:text-gray-900 dark:text-gray-450 dark:hover:text-white"
              }`}
            >
              Tất cả
            </button>
          </div>
        </div>

        {/* Sessions list */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredSessions.length === 0 ? (
            <div className="text-center text-gray-400 dark:text-gray-500 py-10 text-sm">
              Không tìm thấy cuộc trò chuyện nào.
            </div>
          ) : (
            filteredSessions.map(session => (
              <div
                key={session.id}
                onClick={() => selectRoom(session)}
                className={`p-4 border-b border-gray-100 dark:border-white/5 flex items-start gap-3 cursor-pointer transition-colors duration-200 ${
                  selectedSession?.id === session.id
                    ? "bg-brand-50/40 dark:bg-brand-500/5 border-l-4 border-brand-500"
                    : "hover:bg-gray-50/50 dark:hover:bg-white/[0.01] bg-white dark:bg-gray-900"
                }`}
              >
                <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${getAvatarColors(session.customerName)}`}>
                  {session.customerName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <h4 className="font-semibold text-gray-800 dark:text-white/90 text-sm truncate pr-2">
                      {session.customerName}
                    </h4>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 shrink-0">
                      {new Date(session.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-450 truncate mb-1">
                    {session.lastMessageText || "[Không có tin nhắn]"}
                  </p>
                  
                  <div className="flex items-center gap-1.5">
                    {session.isClosed ? (
                      <Badge color="light" variant="light" size="sm">Đã đóng</Badge>
                    ) : (
                      <Badge color="success" variant="light" size="sm">Hoạt động</Badge>
                    )}

                    {session.unreadByAdmin > 0 && (
                      <span className="ml-auto bg-error-500 text-white text-[10px] font-bold h-4 min-w-4 px-1 rounded-full flex items-center justify-center">
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
      <div className="flex-1 min-w-0 flex flex-col bg-gray-50/30 dark:bg-white/[0.01]">
        {selectedSession ? (
          <>
            {/* Header info */}
            <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-white/5 p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className={`h-11 w-11 rounded-full flex items-center justify-center font-bold text-base ${getAvatarColors(selectedSession.customerName)}`}>
                  {selectedSession.customerName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 dark:text-white/90 text-base">{selectedSession.customerName}</h3>
                  <span className="text-xs text-gray-450 dark:text-gray-500 flex items-center gap-1">
                    ID: {selectedSession.id}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!selectedSession.isClosed ? (
                  <Button
                    onClick={closeRoom}
                    variant="danger"
                    size="sm"
                    className="font-bold rounded-full"
                    startIcon={<span className="material-symbols-outlined text-[16px]">cancel</span>}
                  >
                    Đóng cuộc chat
                  </Button>
                ) : (
                  <Badge color="light" variant="light" size="md">
                    Cuộc trò chuyện đã đóng
                  </Badge>
                )}
              </div>
            </div>

            {/* Claim/Staff Status Banner */}
            {!selectedSession.isClosed && (
              <div className="px-4 py-2 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-white/5 text-xs flex justify-between items-center shrink-0">
                {!selectedSession.adminId ? (
                  <div className="bg-warning-50 dark:bg-warning-500/10 border border-warning-100 dark:border-warning-500/20 text-warning-800 dark:text-warning-400 p-2.5 rounded-lg w-full flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className="material-symbols-outlined text-sm">warning</span>
                      Chưa có nhân viên nhận hỗ trợ cuộc chat này.
                    </span>
                    <Button
                      onClick={claimRoom}
                      variant="primary"
                      size="sm"
                      className="!py-1.5 !px-3 font-bold text-[11px] rounded-full"
                    >
                      Nhận hỗ trợ
                    </Button>
                  </div>
                ) : selectedSession.adminId === currentAdmin?.id ? (
                  <div className="bg-success-50 dark:bg-success-500/10 border border-success-100 dark:border-success-500/20 text-success-800 dark:text-success-400 p-2.5 rounded-lg w-full flex items-center gap-1.5 font-medium">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    Bạn đang hỗ trợ khách hàng này.
                  </div>
                ) : (
                  <div className="bg-error-50 dark:bg-error-500/10 border border-error-100 dark:border-error-500/20 text-error-800 dark:text-error-450 p-2.5 rounded-lg w-full flex items-center gap-1.5 font-medium">
                    <span className="material-symbols-outlined text-sm">lock</span>
                    Cuộc chat này đang được nhận hỗ trợ bởi nhân viên: <strong className="underline">{selectedSession.adminName}</strong>
                  </div>
                )}
              </div>
            )}

            {/* Messages area Zalo Style Background */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-gray-100 dark:bg-gray-950 custom-scrollbar">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400 py-10 text-xs bg-white/40 dark:bg-white/[0.02] rounded-xl p-4">
                  Không có tin nhắn nào trong phòng này.
                </div>
              ) : (
                messages.map(msg => {
                  const isSystem = msg.senderName === "Hệ thống";
                  
                  if (isSystem) {
                    return (
                      <div key={msg.id} className="w-full flex justify-center my-2 select-none">
                        <span className="bg-gray-255/90 dark:bg-white/5 text-gray-600 dark:text-gray-400 text-[11px] px-3 py-1 rounded-full shadow-theme-xs">
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
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 mb-0.5 px-1 font-medium">
                        {msg.senderName} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <div
                        className={`max-w-[70%] rounded-2xl p-3 text-sm shadow-theme-xs ${
                          msg.isFromAdmin
                            ? "bg-brand-500 text-white rounded-tr-none"
                            : "bg-white dark:bg-gray-900 text-gray-800 dark:text-white/90 rounded-tl-none border border-gray-100 dark:border-white/5"
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
                        <span className="text-[9px] text-brand-550 italic mt-0.5 px-1 animate-pulse">
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
            <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-white/5 flex flex-col shrink-0 relative">
              {/* Emoji/Sticker Picker Popup */}
              {showPicker && (
                <div className="absolute bottom-full left-4 mb-2 w-80 h-72 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-250 dark:border-white/5 flex flex-col z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200 font-outfit">
                  {/* Picker Tabs */}
                  <div className="flex border-b border-gray-100 dark:border-white/5 text-xs shrink-0 select-none">
                    <button
                      type="button"
                      onClick={() => setPickerTab("emoji")}
                      className={`flex-1 py-2 font-bold cursor-pointer transition-colors ${
                        pickerTab === "emoji" ? "text-brand-500 border-b-2 border-brand-500" : "text-gray-500 hover:text-gray-900 dark:text-gray-450 dark:hover:text-white"
                      }`}
                    >
                      Biểu cảm
                    </button>
                    <button
                      type="button"
                      onClick={() => setPickerTab("sticker")}
                      className={`flex-1 py-2 font-bold cursor-pointer transition-colors ${
                        pickerTab === "sticker" ? "text-brand-500 border-b-2 border-brand-500" : "text-gray-500 hover:text-gray-900 dark:text-gray-450 dark:hover:text-white"
                      }`}
                    >
                      Sticker / GIF
                    </button>
                  </div>

                  {/* Picker Body */}
                  <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                    {pickerTab === "emoji" ? (
                      <div className="grid grid-cols-8 gap-2 text-xl select-none">
                        {EMOJIS.map((emoji, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setInputText((prev) => prev + emoji);
                            }}
                            className="hover:bg-gray-100 dark:hover:bg-white/5 rounded p-1 flex items-center justify-center cursor-pointer transition-colors active:scale-90"
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
                            className="hover:bg-gray-50 dark:hover:bg-white/[0.02] p-1 rounded-lg border border-gray-100 dark:border-white/5 flex flex-col items-center justify-center cursor-pointer transition-all active:scale-95 group"
                          >
                            <img
                              src={sticker.url}
                              alt={sticker.name}
                              className="w-14 h-14 object-contain rounded-md"
                            />
                            <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 truncate max-w-full group-hover:text-brand-500">
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
              <div className="flex items-center justify-between px-4 py-1.5 border-b border-gray-100 dark:border-white/5 text-gray-400 dark:text-gray-500 select-none">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPicker(!showPicker)}
                    className={`hover:text-brand-500 hover:bg-gray-150 dark:hover:bg-white/5 p-1.5 rounded transition-colors material-symbols-outlined text-lg cursor-pointer ${
                      showPicker ? "text-brand-500 bg-gray-150 dark:bg-white/5" : "text-gray-400 dark:text-gray-500"
                    }`}
                    title="Cảm xúc & Sticker"
                  >
                    sentiment_satisfied
                  </button>
                  
                  {/* Phím tắt trả lời nhanh */}
                  {!selectedSession.isClosed && !isDifferentAdminSupporting && currentAdmin && (
                    <Button
                      type="button"
                      onClick={() => {
                        setInputText(`Xin chào anh chị ${selectedSession.customerName}, Em là ${currentAdmin.fullName} xin được hỗ trợ mình ạ. Mình có vấn đề gì cần em hỗ trợ không ạ?`);
                      }}
                      variant="outline"
                      size="sm"
                      className="!py-1 !px-2.5 rounded font-bold text-[11px] ml-2"
                      startIcon={<span className="material-symbols-outlined text-[13px]">bolt</span>}
                    >
                      Chào khách (/xinchao)
                    </Button>
                  )}
                </div>
              </div>

              {/* Text input form */}
              <form onSubmit={handleSend} className="p-3 flex items-center gap-3 font-outfit">
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
                  className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-white/5 rounded-full text-sm focus:outline-none focus:border-brand-500 dark:focus:border-brand-800 focus:ring-1 focus:ring-brand-500/20 text-gray-800 dark:text-white/90 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                />
                <button
                  type="submit"
                  disabled={isChatInputDisabled || !inputText.trim()}
                  className="bg-brand-500 hover:bg-brand-600 disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:text-gray-400 text-white rounded-full h-10 w-10 flex items-center justify-center shadow-md hover:shadow-lg cursor-pointer transition-all shrink-0 active:scale-95"
                >
                  <span className="material-symbols-outlined text-lg">send</span>
                </button>
              </form>
            </div>
          </>
        ) : (
          /* Placeholder */
          <div className="flex-1 flex flex-col justify-center items-center text-gray-400 dark:text-gray-500 p-8 w-full">
            <span className="material-symbols-outlined text-6xl text-gray-200 dark:text-gray-800 mb-3 animate-pulse">
              chat_bubble
            </span>
            <h3 className="font-bold text-gray-700 dark:text-white/80 text-lg mb-1">
              Trung tâm Chăm sóc khách hàng
            </h3>
            <p className="text-sm max-w-[400px] text-center text-gray-500 dark:text-gray-450 leading-relaxed">
              Hãy chọn một cuộc hội thoại từ danh sách bên trái để xem nội dung và bắt đầu hỗ trợ khách hàng.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
