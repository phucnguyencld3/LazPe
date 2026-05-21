"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createPortal } from "react-dom";

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
  const [isLocking, setIsLocking] = useState(false);

  const [isPermModalOpen, setIsPermModalOpen] = useState(false);
  const [permSearchTerm, setPermSearchTerm] = useState("");
  const [togglingPermissionIds, setTogglingPermissionIds] = useState<number[]>([]);
  
  const [isMounted, setIsMounted] = useState(false);
=======
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
  const [lockReason, setLockReason] = useState("");
  const [lockDays, setLockDays] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [isLocking, setIsLocking] = useState(false);
>>>>>>> origin/feature/aboutus-privacy

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
          setUser(userData.data);
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
          setAllPermissions(allPermData.data);
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
      } else {
        alert(data.message || "Lỗi khóa tài khoản");
      }
    } catch(e) {
      console.error(e);
    } finally {
      setIsLocking(false);
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
      } else {
        alert(data.message || `Lỗi khi thực hiện phân quyền`);
      }
    } catch (err) {
      console.error(err);
      alert("Đã xảy ra lỗi kết nối");
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
    <div className="max-w-5xl mx-auto pb-lg">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="group flex items-center gap-2 mb-lg text-on-surface-variant hover:text-primary transition-colors font-label-md bg-transparent border-none cursor-pointer"
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
            <button
              onClick={() => setIsPermModalOpen(true)}
              className="bg-secondary text-on-secondary px-6 py-3 rounded-full font-label-md flex items-center gap-2 hover:scale-105 active:scale-95 transition-transform shadow-md"
            >
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
          <div className="flex items-center justify-between mb-md border-b border-outline-variant/20 pb-sm">
            <h3 className="font-headline-md text-headline-md text-primary flex items-center gap-2">
              <span className="material-symbols-outlined">key</span>
              Vai trò &amp; Quyền hạn của Người dùng
            </h3>
            <button
              onClick={() => setIsPermModalOpen(true)}
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
                    className="px-4 py-2 bg-primary-container/20 text-on-primary-container font-label-md rounded-full border border-primary-container/40 font-bold"
                  >
                    {role}
                  </span>
                ))
              ) : (
                <span className="px-4 py-2 bg-surface-variant text-on-surface-variant font-label-md rounded-full border border-outline-variant/40">
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

      {/* Permissions Edit Modal */}
      {isPermModalOpen && isMounted && createPortal(
        <div className="fixed inset-0 w-full h-full bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div 
            className="bg-surface-container-lowest rounded-xl shadow-2xl border border-outline-variant/20 flex flex-col"
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
                  <div key={resource} className="bg-surface-container-low rounded-xl p-md border border-outline-variant/10">
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
