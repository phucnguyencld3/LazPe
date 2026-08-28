"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function AdminUserChatPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  useEffect(() => {
    if (userId) {
      router.replace(`/admin/messages?user=${userId}`);
    }
  }, [userId, router]);

  return (
    <div className="p-12 text-center text-slate-500 font-bold">
      Đang chuyển hướng đến Tin nhắn Trực tiếp...
    </div>
  );
}
