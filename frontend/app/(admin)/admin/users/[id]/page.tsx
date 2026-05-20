"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createPortal } from "react-dom";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5101/api";

export default function UserDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
  const [lockReason, setLockReason] = useState("");
  const [lockDays, setLockDays] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [isLocking, setIsLocking] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      try {
        const res = await fetch(`${API_BASE_URL}/Users/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setUser(data.data);
        } else {
          console.error(data.message);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchUser();
  }, [id, router]);

  const handleLockUnlock = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    
    if (user?.isLocked) {
      try {
        const res = await fetch(`${API_BASE_URL}/Users/${id}/unlock`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setUser({ ...user, isLocked: false, status: true });
        } else {
            alert(data.message || "Lỗi mở khóa");
        }
      } catch (e) {
          console.error(e);
      }
    } else {
      setLockReason("");
      setLockDays(0);
      setIsLockModalOpen(true);
    }
  };

  const confirmLock = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setIsLocking(true);
    try {
        const res = await fetch(`${API_BASE_URL}/Users/${id}/lock`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: lockReason, lockoutDays: lockDays === 0 ? null : lockDays }),
        });
        const data = await res.json();
        if (data.success) {
          setUser({ ...user, isLocked: true, status: false });
          setIsLockModalOpen(false);
        } else {
          alert(data.message || "Lỗi khóa tài khoản");
        }
    } catch(e) {
        console.error(e);
    } finally {
        setIsLocking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[500px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <div className="font-label-md text-error text-center mt-xl">Không tìm thấy người dùng</div>;
  }

  return (
    <div className="max-w-5xl mx-auto pb-lg">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="group flex items-center gap-2 mb-lg text-on-surface-variant hover:text-primary transition-colors font-label-md"
      >
        <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">arrow_back</span>
        Quay lại quản lý chung
      </button>

      {/* Header Section / Hero Profile */}
      <section className="relative bg-surface-container-lowest rounded-xl p-lg shadow-xl shadow-primary/5 border border-primary-fixed/30 overflow-hidden mb-md">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-container/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        <div className="flex flex-col md:flex-row items-center gap-md relative z-10">
          <div className="relative">
            <div className="h-32 w-32 rounded-full overflow-hidden border-4 border-primary-container shadow-lg flex items-center justify-center bg-surface-variant">
              {user.avatar ? (
                <img src={user.avatar} alt="User Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-[48px] text-on-surface-variant">person</span>
              )}
            </div>
            {user.emailConfirmed && (
              <div className="absolute bottom-1 right-1 bg-secondary p-1 rounded-full border-2 border-white">
                <span className="material-symbols-outlined text-white text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              </div>
            )}
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-xs">
              {user.fullName || user.userName}
            </h2>
            <p className="font-body-md text-on-surface-variant flex items-center justify-center md:justify-start gap-2">
              <span className="material-symbols-outlined text-sm">mail</span>
              {user.email || "Chưa cập nhật email"}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-sm justify-center">
            <button className="bg-secondary text-on-secondary px-6 py-3 rounded-full font-label-md flex items-center gap-2 hover:scale-105 active:scale-95 transition-transform shadow-md">
              <span className="material-symbols-outlined text-sm">security</span>
              Quản lý phân quyền
            </button>
            <button
              onClick={handleLockUnlock}
              className={`${user.isLocked ? "bg-primary text-on-primary" : "bg-error-container text-on-error-container"} px-6 py-3 rounded-full font-label-md flex items-center gap-2 hover:scale-105 active:scale-95 transition-transform`}
            >
              <span className="material-symbols-outlined text-sm">{user.isLocked ? "lock_open" : "lock"}</span>
              {user.isLocked ? "Mở khóa tài khoản" : "Khóa tài khoản"}
            </button>
          </div>
        </div>
      </section>

      {/* Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
        {/* Basic Info Card */}
        <div className="bg-surface-container-lowest p-md rounded-xl shadow-sm border border-outline-variant/20">
          <h3 className="font-headline-md text-headline-md text-primary mb-md flex items-center gap-2">
            <span className="material-symbols-outlined">badge</span>
            Thông tin cơ bản
          </h3>
          <div className="space-y-md">
            <div className="flex flex-col gap-1">
              <span className="font-label-sm text-on-surface-variant uppercase tracking-wider">Họ tên</span>
              <span className="font-body-lg text-on-surface font-medium">{user.fullName || "N/A"}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-label-sm text-on-surface-variant uppercase tracking-wider">Tên người dùng</span>
              <span className="font-body-lg text-on-surface">{user.userName}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-label-sm text-on-surface-variant uppercase tracking-wider">Email</span>
              <span className="font-body-lg text-on-surface">{user.email || "N/A"}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-label-sm text-on-surface-variant uppercase tracking-wider">Số điện thoại</span>
              <span className="font-body-lg text-on-surface">{user.phoneNumber || "N/A"}</span>
            </div>
          </div>
        </div>

        {/* Account Status Card */}
        <div className="bg-surface-container-lowest p-md rounded-xl shadow-sm border border-outline-variant/20">
          <h3 className="font-headline-md text-headline-md text-primary mb-md flex items-center gap-2">
            <span className="material-symbols-outlined">account_box</span>
            Trạng thái hệ thống
          </h3>
          <div className="space-y-md">
            <div className="flex flex-col gap-1">
              <span className="font-label-sm text-on-surface-variant uppercase tracking-wider">Ngày đăng ký</span>
              <span className="font-body-lg text-on-surface">
                {user.registerDate ? new Date(user.registerDate).toLocaleString("vi-VN") : "N/A"}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-secondary-container/20 rounded-lg">
              <div className="flex flex-col gap-1">
                <span className="font-label-sm text-on-surface-variant uppercase tracking-wider">Trạng thái</span>
                {user.isLocked ? (
                  <span className="font-body-md text-error font-bold">Bị khóa</span>
                ) : (
                  <span className="font-body-md text-secondary font-bold">Đang hoạt động</span>
                )}
              </div>
              <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>
                {user.isLocked ? "cancel" : "check_circle"}
              </span>
            </div>
            <div className={`flex items-center justify-between p-3 ${user.emailConfirmed ? "bg-primary-container/10" : "bg-error-container/10"} rounded-lg`}>
              <div className="flex flex-col gap-1">
                <span className="font-label-sm text-on-surface-variant uppercase tracking-wider">Trạng thái email</span>
                <span className={`font-body-md font-bold ${user.emailConfirmed ? "text-primary" : "text-error"}`}>
                  {user.emailConfirmed ? "Đã xác minh" : "Chưa xác minh"}
                </span>
              </div>
              <span className={`material-symbols-outlined ${user.emailConfirmed ? "text-primary" : "text-error"}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                {user.emailConfirmed ? "verified_user" : "warning"}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-surface-container/20 rounded-lg">
              <div className="flex flex-col gap-1">
                <span className="font-label-sm text-on-surface-variant uppercase tracking-wider">Sai mật khẩu</span>
                <span className="font-body-md text-on-surface font-bold">{user.accessFailedCount || 0} lần</span>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant" style={{ fontVariationSettings: "'FILL' 1" }}>
                password
              </span>
            </div>
          </div>
        </div>

        {/* Role/Permissions Section */}
        <div className="md:col-span-2 bg-surface-container-lowest p-md rounded-xl shadow-sm border border-outline-variant/20">
          <div className="flex items-center justify-between mb-md">
            <h3 className="font-headline-md text-headline-md text-primary flex items-center gap-2">
              <span className="material-symbols-outlined">key</span>
              Vai trò &amp; Quyền hạn
            </h3>
            <button className="text-primary font-label-md hover:underline">Sửa quyền</button>
          </div>
          <div className="flex flex-wrap gap-sm">
            {user.roles?.length > 0 ? (
              user.roles.map((role: string, idx: number) => (
                <span
                  key={idx}
                  className="px-4 py-2 bg-primary-container/20 text-on-primary-container font-label-md rounded-full border border-primary-container/40"
                >
                  {role}
                </span>
              ))
            ) : (
              <span className="px-4 py-2 bg-surface-variant text-on-surface-variant font-label-md rounded-full border border-outline-variant/40">
                Người dùng cơ bản
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Lock Modal */}
      {isLockModalOpen && isMounted && createPortal(
        <div className="fixed inset-0 w-full h-full bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div 
            className="bg-surface-container-lowest p-lg rounded-xl shadow-2xl border border-outline-variant/20 shrink-0"
            style={{ width: "448px", maxWidth: "calc(100vw - 32px)" }}
          >
            <h3 className="font-headline-md text-headline-md text-error mb-sm font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-[28px]">lock</span> Khóa người dùng
            </h3>
            <p className="text-on-surface-variant font-body-md mb-md">Vui lòng nhập lý do khóa tài khoản này.</p>
            <div className="space-y-md my-md">
              <div>
                <label className="block text-label-sm font-bold text-on-surface-variant mb-xs">Lý do khóa</label>
                <textarea 
                  className="w-full p-sm rounded-lg border border-outline-variant bg-surface-container-low font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50" 
                  rows={3} 
                  placeholder="Vi phạm chính sách..."
                  value={lockReason} 
                  onChange={(e) => setLockReason(e.target.value)}
                  disabled={isLocking}
                />
              </div>
              <div>
                <label className="block text-label-sm font-bold text-on-surface-variant mb-xs">Số ngày khóa (0 = vĩnh viễn)</label>
                <input 
                  type="number" 
                  className="w-full p-sm rounded-lg border border-outline-variant bg-surface-container-low font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                  value={lockDays} 
                  onChange={(e) => setLockDays(Number(e.target.value))}
                  min={0}
                  disabled={isLocking}
                />
              </div>
            </div>
            <div className="flex justify-end gap-sm mt-lg">
              <button 
                onClick={() => setIsLockModalOpen(false)} 
                disabled={isLocking}
                className="px-md py-sm rounded-full font-label-md font-bold text-on-surface-variant hover:bg-surface-container transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button 
                onClick={confirmLock} 
                disabled={isLocking}
                className="px-md py-sm rounded-full font-label-md font-bold bg-error text-on-error hover:bg-[#93000a] shadow-sm transition-colors disabled:opacity-70 flex items-center gap-2"
              >
                {isLocking ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Đang xử lý...
                  </>
                ) : (
                  "Xác nhận khóa"
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
