import React, { useState, useEffect, useRef } from "react";
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

interface ProfileMessagesProps {
  token: string | null;
}

export const ProfileMessages: React.FC<ProfileMessagesProps> = ({ token }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState("Đang kết nối...");
  const [userId, setUserId] = useState<string | null>(null);
  
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

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const textToSend = inputText.trim();
    setInputText("");
    
    // Reset textarea height after sending
    const textarea = document.querySelector('textarea');
    if (textarea) textarea.style.height = '42px';

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

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-3 sm:p-4 flex flex-col h-[650px] max-h-[calc(100vh-120px)] sticky top-24 animate-in fade-in duration-300">
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
                <div className="text-sm font-body-md whitespace-pre-wrap break-words leading-snug">{msg.messageText}</div>
                <div className={`text-[10px] mt-1 text-right ${!msg.isFromAdmin ? "text-slate-400" : "text-slate-400"}`}>
                  {new Date(msg.createdAt).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

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
          placeholder="Nhập tin nhắn để được hỗ trợ..."
          className="flex-1 w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm font-body-md focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 resize-none max-h-[82px] transition-shadow transition-colors shadow-sm [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          rows={1}
          style={{ minHeight: "42px" }}
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="w-10 h-10 shrink-0 flex items-center justify-center text-primary hover:bg-slate-100 rounded-xl disabled:text-slate-300 disabled:bg-transparent disabled:cursor-not-allowed transition-all active:scale-95 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[22px] pl-0.5">send</span>
        </button>
      </form>
    </div>
  );
}
