"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { toast } from "@/lib/toast";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5101/api";

export default function UserDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  
  // States
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userPermissions, setUserPermissions] = useState<any[]>([]);
  const [allPermissions, setAllPermissions] = useState<any[]>([]);
  
  // Modals
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
  const [lockReason, setLockReason] = useState("");
  const [lockDays, setLockDays] = useState(0);
  const [lockType, setLockType] = useState<string>("permanent");
  const [reasonType, setReasonType] = useState<string>("policy");
  const [isLocking, setIsLocking] = useState(false);

  const [isPermModalOpen, setIsPermModalOpen] = useState(false);
  const [permSearchTerm, setPermSearchTerm] = useState("");
  const [togglingPermissionIds, setTogglingPermissionIds] = useState<number[]>([]);
  
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch initial details
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      try {
        setLoading(true);
        // 1. Fetch User details
        const userRes = await fetch(`${API_BASE_URL}/Users/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userData = await userRes.json();
        if (userData.success) {
          const u = userData.data;
          if (u.roles?.some((r: string) => r.toLowerCase() === "administrator" || r.toLowerCase() === "admin")) {
            toast.error("Không thể xem hoặc chỉnh sửa tài khoản Quản trị viên.");
            router.push("/admin/users");
            return;
          }
          setUser(u);
        } else {
          console.error(userData.message);
        }

        // 2. Fetch User Specific Permissions
        const userPermRes = await fetch(`${API_BASE_URL}/Permission/user/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userPermData = await userPermRes.json();
        if (userPermData.success) {
          setUserPermissions(userPermData.data);
        }

        // 3. Fetch All System Permissions
        const allPermRes = await fetch(`${API_BASE_URL}/Permission`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const allPermData = await allPermRes.json();
        if (allPermData.success) {
          const filteredPerms = allPermData.data.filter((p: any) => p.resource?.toLowerCase() !== "address");
          setAllPermissions(filteredPerms);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id, router]);

  // Handle Lock / Unlock user account
  const handleLockUnlock = async () => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
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
          toast.success("Mở khóa tài khoản thành công!");
        } else {
          toast.error(data.message || "Lỗi mở khóa");
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      setReasonType("policy");
      setLockReason("Vi phạm điều khoản dịch vụ");
      setLockDays(0);
      setLockType("permanent");
      setIsLockModalOpen(true);
    }
  };

  const confirmLock = async () => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
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
        toast.success("Khóa tài khoản thành công!");
      } else {
        toast.error(data.message || "Lỗi khóa tài khoản");
      }
    } catch(e) {
      console.error(e);
    } finally {
      setIsLocking(false);
    }
  };

  const handleReasonTypeChange = (val: string) => {
    setReasonType(val);
    if (val === "policy") {
      setLockReason("Vi phạm điều khoản dịch vụ");
    } else if (val === "spam") {
      setLockReason("Spam quảng cáo, tin nhắn rác");
    } else if (val === "fraud") {
      setLockReason("Hành vi gian lận, lừa đảo");
    } else if (val === "abusive") {
      setLockReason("Ngôn từ xúc phạm, thiếu văn hóa");
    } else if (val === "custom") {
      setLockReason("");
    }
  };
 
  // Toggle single permission for user (grant / revoke)
  const togglePermission = async (permission: any, isCurrentlyGranted: boolean) => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return;

    // Add to toggling set to show spinner
    setTogglingPermissionIds(prev => [...prev, permission.id]);

    try {
      const endpoint = isCurrentlyGranted ? "revoke" : "grant";
      const res = await fetch(`${API_BASE_URL}/Permission/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: id,
          permissionId: permission.id
        })
      });
      const data = await res.json();
      if (data.success) {
        // Update userPermissions state
        if (isCurrentlyGranted) {
          setUserPermissions(prev => prev.filter(p => p.id !== permission.id));
        } else {
          setUserPermissions(prev => [...prev, {
            id: permission.id,
            name: permission.name,
            description: permission.description,
            resource: permission.resource,
            action: permission.action
          }]);
        }
        toast.success(isCurrentlyGranted ? `Đã thu hồi quyền "${permission.name}"` : `Đã gán quyền "${permission.name}"`);
      } else {
        toast.error(data.message || `Lỗi khi thực hiện phân quyền`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Đã xảy ra lỗi kết nối");
    } finally {
      setTogglingPermissionIds(prev => prev.filter(pid => pid !== permission.id));
    }
  };

  // Group user permissions by Resource for detail list view
  const groupedUserPermissions = userPermissions.reduce((acc: any, curr: any) => {
    const resource = curr.resource || "Khác";
    if (!acc[resource]) {
      acc[resource] = [];
    }
    acc[resource].push(curr);
    return acc;
  }, {});

  // Group ALL system permissions by Resource for the editing modal
  const groupedAllPermissions = allPermissions.reduce((acc: any, curr: any) => {
    const resource = curr.resource || "Khác";
    if (!acc[resource]) {
      acc[resource] = [];
    }
    acc[resource].push(curr);
    return acc;
  }, {});

  const getResourceTitle = (resource: string) => {
    switch (resource.toLowerCase()) {
      case "user": return "Người dùng (User)";
      case "product": return "Sản phẩm (Product)";
      case "category": return "Danh mục (Category)";
      case "order": return "Đơn hàng (Order)";
      case "permission": return "Phân quyền (Permission)";
      case "admin": return "Quyền Admin (Admin)";
      case "bundle": return "Gói sản phẩm (Bundle)";
      case "supplier": return "Nhà cung cấp (Supplier)";
      case "report": return "Báo cáo (Report)";
      case "analytics": return "Thống kê (Analytics)";
      case "system": return "Hệ thống (System)";
      case "review": return "Đánh giá (Review)";
      case "address": return "Địa chỉ (Address)";
      default: return `Nhóm ${resource}`;
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
    <div className="w-full pb-lg">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="group flex items-center gap-2 mb-lg text-on-surface-variant hover:text-primary transition-colors font-label-md bg-transparent border-none cursor-pointer"
      >
        <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">arrow_back</span>
        Quay lại quản lý chung
      </button>

      {/* Header Section / Hero Profile */}
      <section className="relative bg-surface-container-lowest rounded-[8px] p-lg shadow-xl shadow-primary/5 border border-primary-fixed/30 overflow-hidden mb-md">
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
            <button
              onClick={() => router.push(`/admin/users/${id}/permissions`)}
              className="bg-secondary text-on-secondary px-6 py-3 rounded-[8px] font-label-md flex items-center gap-2 hover:scale-105 active:scale-95 transition-transform shadow-md"
            >
              <span className="material-symbols-outlined text-sm">security</span>
              Quản lý phân quyền
            </button>
            <button
              onClick={handleLockUnlock}
              className={`${user.isLocked ? "bg-primary text-on-primary" : "bg-error-container text-on-error-container"} px-6 py-3 rounded-[8px] font-label-md flex items-center gap-2 hover:scale-105 active:scale-95 transition-transform`}
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
        <div className="bg-surface-container-lowest p-md rounded-[8px] shadow-sm border border-outline-variant/20">
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
        <div className="bg-surface-container-lowest p-md rounded-[8px] shadow-sm border border-outline-variant/20">
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
        <div className="md:col-span-2 bg-surface-container-lowest p-md rounded-[8px] shadow-sm border border-outline-variant/20">
          <div className="flex items-center justify-between mb-md border-b border-outline-variant/20 pb-sm">
            <h3 className="font-headline-md text-headline-md text-primary flex items-center gap-2">
              <span className="material-symbols-outlined">key</span>
              Vai trò &amp; Quyền hạn của Người dùng
            </h3>
            <button
              onClick={() => router.push(`/admin/users/${id}/permissions`)}
              className="text-primary font-label-md font-bold hover:underline bg-transparent border-none cursor-pointer"
            >
              Sửa quyền
            </button>
          </div>

          {/* User Roles */}
          <div className="mb-md">
            <h4 className="font-label-sm text-[12px] uppercase text-on-surface-variant/80 tracking-wider mb-sm font-bold">
              Vai trò hệ thống (Roles)
            </h4>
            <div className="flex flex-wrap gap-sm">
              {user.roles?.length > 0 ? (
                user.roles.map((role: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-4 py-2 bg-primary-container/20 text-on-primary-container font-label-md rounded-[8px] border border-primary-container/40 font-bold"
                  >
                    {role}
                  </span>
                ))
              ) : (
                <span className="px-4 py-2 bg-surface-variant text-on-surface-variant font-label-md rounded-[8px] border border-outline-variant/40">
                  Người dùng cơ bản (User)
                </span>
              )}
            </div>
          </div>

          {/* User Permissions */}
          <div>
            <h4 className="font-label-sm text-[12px] uppercase text-on-surface-variant/80 tracking-wider mb-sm font-bold">
              Quyền hạn chi tiết được cấp (Permissions)
            </h4>
            {userPermissions.length === 0 ? (
              <p className="text-on-surface-variant/70 text-xs italic">
                Chưa gán quyền hạn cụ thể nào. Tài khoản này chỉ chạy theo quyền mặc định của vai trò hệ thống.
              </p>
            ) : (
              <div className="space-y-sm">
                {Object.keys(groupedUserPermissions).map((resource) => (
                  <div key={resource} className="p-xs bg-surface-container-low rounded-lg border border-outline-variant/10">
                    <span className="font-label-sm text-[11px] font-bold text-secondary uppercase px-sm py-0.5 block">
                      {getResourceTitle(resource)}
                    </span>
                    <div className="flex flex-wrap gap-xs p-sm">
                      {groupedUserPermissions[resource].map((perm: any) => (
                        <span
                          key={perm.id}
                          className="px-sm py-1 bg-surface-container-lowest text-on-surface border border-outline-variant/30 text-xs rounded-lg font-medium shadow-sm cursor-help"
                          title={perm.description}
                        >
                          {perm.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lock Modal */}
      {isLockModalOpen && isMounted && createPortal(
        <div className="fixed inset-0 w-full h-full bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div 
            className="bg-white rounded-[8px] border border-slate-100 shadow-2xl p-6 w-[448px] max-w-[calc(100vw-32px)] shrink-0 animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex items-center gap-2.5 text-rose-600 mb-2">
              <span className="material-symbols-outlined text-[24px]">lock</span>
              <h3 className="text-lg font-bold text-slate-800">Khóa tài khoản</h3>
            </div>
            <p className="text-slate-500 text-xs font-semibold mb-4 leading-relaxed">
              Vui lòng nhập lý do và thời gian tạm khóa cho tài khoản này. Người dùng sẽ không thể đăng nhập trong thời gian bị khóa.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Lý do khóa tài khoản</label>
                <select 
                  value={reasonType} 
                  onChange={(e) => handleReasonTypeChange(e.target.value)}
                  disabled={isLocking}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-semibold text-slate-700"
                >
                  <option value="policy">Vi phạm điều khoản dịch vụ</option>
                  <option value="spam">Spam quảng cáo, tin nhắn rác</option>
                  <option value="fraud">Hành vi gian lận, lừa đảo</option>
                  <option value="abusive">Ngôn từ xúc phạm, thiếu văn hóa</option>
                  <option value="custom">Khác (Tự nhập lý do)</option>
                </select>

                {reasonType === "custom" && (
                  <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Nhập lý do chi tiết <span className="text-rose-500">*</span></label>
                    <textarea 
                      className="w-full px-4 py-2.5 rounded-[8px] border border-slate-200 bg-white font-semibold text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50 min-h-[70px]" 
                      rows={2} 
                      placeholder="Nhập lý do khóa cụ thể..."
                      value={lockReason} 
                      onChange={(e) => setLockReason(e.target.value)}
                      disabled={isLocking}
                    />
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Thời hạn khóa tài khoản</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Vĩnh viễn", value: "permanent", days: 0 },
                    { label: "1 ngày", value: "1", days: 1 },
                    { label: "3 ngày", value: "3", days: 3 },
                    { label: "7 ngày (1 tuần)", value: "7", days: 7 },
                    { label: "30 ngày (1 tháng)", value: "30", days: 30 },
                    { label: "Tùy chỉnh", value: "custom", days: -1 },
                  ].map((preset) => {
                    const isActive = preset.value === "custom" 
                      ? !["permanent", "1", "3", "7", "30"].includes(lockType)
                      : lockType === preset.value;
                    return (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => {
                          setLockType(preset.value);
                          if (preset.days !== -1) {
                            setLockDays(preset.days);
                          } else {
                            setLockDays(prev => prev === 0 || [1,3,7,30].includes(prev) ? 5 : prev);
                          }
                        }}
                        className={`py-2 px-1 text-xs font-bold rounded-[8px] border text-center transition-all cursor-pointer ${
                          isActive
                            ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                            : "bg-white text-slate-650 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
                
                {lockType === "custom" && (
                  <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Số ngày khóa cụ thể</label>
                    <div className="relative flex items-center">
                      <input 
                        type="number" 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-[8px] font-semibold text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50"
                        value={lockDays} 
                        onChange={(e) => setLockDays(Math.max(1, Number(e.target.value)))}
                        min={1}
                        disabled={isLocking}
                      />
                      <span className="absolute right-4 text-xs font-bold text-slate-400">ngày</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6 border-t border-slate-100 pt-4">
              <button 
                onClick={() => setIsLockModalOpen(false)} 
                disabled={isLocking}
                className="px-5 py-2.5 rounded-[8px] text-xs font-bold text-slate-500 hover:bg-slate-50 border border-slate-200 transition-all cursor-pointer disabled:opacity-50"
              >
                Hủy
              </button>
              <button 
                onClick={confirmLock} 
                disabled={isLocking}
                className="px-6 py-2.5 rounded-[8px] text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all cursor-pointer disabled:opacity-70 flex items-center gap-1.5"
              >
                {isLocking ? (
                  <>
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div>
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">lock</span>
                    <span>Xác nhận khóa</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Permissions Edit Modal */}
      {isPermModalOpen && isMounted && createPortal(
        <div className="fixed inset-0 w-full h-full bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div 
            className="bg-surface-container-lowest rounded-[8px] shadow-2xl border border-outline-variant/20 flex flex-col"
            style={{ width: "640px", height: "80vh", maxHeight: "800px", maxWidth: "calc(100vw - 32px)" }}
          >
            {/* Modal Header */}
            <div className="p-lg border-b border-outline-variant/30 flex items-center justify-between">
              <div>
                <h3 className="font-headline-md text-headline-md text-primary font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined">security</span>
                  Phân quyền: {user.fullName || user.userName}
                </h3>
                <p className="text-xs text-on-surface-variant/80 font-body-md mt-1">
                  Đánh dấu để gán quyền hoặc bỏ đánh dấu để thu hồi quyền ngay lập tức.
                </p>
              </div>
              <button
                onClick={() => setIsPermModalOpen(false)}
                className="material-symbols-outlined p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors border-none bg-transparent cursor-pointer"
              >
                close
              </button>
            </div>

            {/* Modal Filter */}
            <div className="px-lg py-sm bg-surface-container-low border-b border-outline-variant/10 flex items-center relative">
              <span className="material-symbols-outlined text-on-surface-variant absolute left-[36px]">search</span>
              <input
                type="text"
                placeholder="Tìm kiếm quyền (VD: Read, Create, User...)"
                value={permSearchTerm}
                onChange={(e) => setPermSearchTerm(e.target.value)}
                className="w-full pl-xl pr-md py-sm bg-surface-container-lowest border border-outline-variant/30 rounded-lg text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 font-body-md"
              />
              {permSearchTerm && (
                <button
                  onClick={() => setPermSearchTerm("")}
                  className="material-symbols-outlined text-[18px] text-on-surface-variant hover:text-primary absolute right-[36px] bg-transparent border-none cursor-pointer"
                >
                  clear
                </button>
              )}
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-lg space-y-md" style={{ scrollbarWidth: "thin" }}>
              {Object.keys(groupedAllPermissions).map((resource) => {
                // Filter permissions in this group
                const filteredGroupPerms = groupedAllPermissions[resource].filter((perm: any) =>
                  perm.name.toLowerCase().includes(permSearchTerm.toLowerCase()) ||
                  (perm.description && perm.description.toLowerCase().includes(permSearchTerm.toLowerCase()))
                );

                if (filteredGroupPerms.length === 0) return null;

                return (
                  <div key={resource} className="bg-surface-container-low rounded-[8px] p-md border border-outline-variant/10">
                    <h4 className="font-label-sm text-sm text-secondary font-bold border-b border-outline-variant/20 pb-xs mb-sm uppercase">
                      {getResourceTitle(resource)}
                    </h4>
                    <div className="space-y-sm">
                      {filteredGroupPerms.map((perm: any) => {
                        const isGranted = userPermissions.some(up => up.id === perm.id);
                        const isToggling = togglingPermissionIds.includes(perm.id);

                        return (
                          <div
                            key={perm.id}
                            className={`flex items-start justify-between p-sm rounded-lg border transition-all ${
                              isGranted 
                                ? "bg-primary-container/10 border-primary/20" 
                                : "bg-surface-container-lowest border-outline-variant/20 hover:bg-surface-container/50"
                            }`}
                          >
                            <div className="flex items-start gap-sm flex-1 pr-sm">
                              <div className="relative flex items-center mt-[3px]">
                                <input
                                  type="checkbox"
                                  id={`perm-${perm.id}`}
                                  checked={isGranted}
                                  disabled={isToggling}
                                  onChange={() => togglePermission(perm, isGranted)}
                                  className="w-4 h-4 rounded text-primary focus:ring-primary border-outline accent-primary cursor-pointer disabled:opacity-50"
                                />
                                {isToggling && (
                                  <div className="absolute inset-0 bg-transparent flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-3 w-3 border border-primary border-t-transparent"></div>
                                  </div>
                                )}
                              </div>
                              <label
                                htmlFor={`perm-${perm.id}`}
                                className={`text-xs font-bold font-label-md cursor-pointer select-none flex-1 ${
                                  isGranted ? "text-primary" : "text-on-surface"
                                }`}
                              >
                                {perm.name}
                                <span className="block font-body-md text-[11px] text-on-surface-variant/80 font-normal mt-0.5">
                                  {perm.description || "Không có mô tả chi tiết"}
                                </span>
                              </label>
                            </div>
                            <span className="px-sm py-0.5 bg-surface-variant text-[10px] text-on-surface-variant rounded-full font-bold uppercase shrink-0">
                              {perm.action}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Empty state inside modal */}
              {allPermissions.length > 0 &&
                Object.keys(groupedAllPermissions).every(
                  resource =>
                    groupedAllPermissions[resource].filter(
                      (p: any) =>
                        p.name.toLowerCase().includes(permSearchTerm.toLowerCase()) ||
                        (p.description && p.description.toLowerCase().includes(permSearchTerm.toLowerCase()))
                    ).length === 0
                ) && (
                  <p className="text-center text-on-surface-variant/60 font-body-md py-10">
                    Không tìm thấy quyền hạn nào khớp với "{permSearchTerm}"
                  </p>
                )}
            </div>

            {/* Modal Footer */}
            <div className="p-md border-t border-outline-variant/30 bg-surface-container-low flex justify-end">
              <button
                onClick={() => setIsPermModalOpen(false)}
                className="px-lg py-sm rounded-full font-bold font-label-md bg-primary text-on-primary hover:bg-[#7b444e] shadow-sm transition-colors hover:scale-105 active:scale-95"
              >
                Hoàn tất &amp; Đóng
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
