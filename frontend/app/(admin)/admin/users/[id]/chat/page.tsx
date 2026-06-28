"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import * as signalR from "@microsoft/signalr";
import { toast } from "@/lib/toast";

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

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const textToSend = inputText.trim();
    setInputText("");
    
    // Reset textarea height after sending
    const textarea = document.querySelector('textarea');
    if (textarea) textarea.style.height = '42px';

    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    const tempId = -(Date.now());
    
    setMessages(prev => [...prev, {
      id: tempId,
      chatSessionId: `DM_${userId}`,
      senderId: null,
      senderName: "Tôi",
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
        body: JSON.stringify({ messageText: textToSend })
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

  useEffect(() => {
    // Khoá cuộn màn hình ngoài (chỉ cho phép cuộn nội dung chat)
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  return (
    <div className="w-full flex flex-col h-[calc(117.65vh-160px)] bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm animate-in fade-in duration-300">
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
                  <div className="text-sm font-body-md whitespace-pre-wrap break-words leading-snug">{msg.messageText}</div>
                  <div className={`text-[10px] mt-1 text-right text-slate-400`}>
                    {new Date(msg.createdAt).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-3 bg-white border-t border-slate-100">
        <form onSubmit={handleSend} className="flex gap-2 items-center relative">
          <textarea
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              e.target.style.height = "42px";
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.altKey) {
                e.preventDefault();
                handleSend(e as unknown as React.FormEvent);
              }
            }}
            placeholder="Nhập tin nhắn..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm font-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none max-h-[82px] transition-shadow transition-colors [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            rows={1}
            style={{ minHeight: "42px" }}
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="w-10 h-10 flex items-center justify-center text-primary hover:bg-slate-100 rounded-xl disabled:text-slate-300 disabled:bg-transparent disabled:cursor-not-allowed transition-all active:scale-95 shrink-0"
          >
            <span className="material-symbols-outlined text-[22px] pl-0.5">send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
