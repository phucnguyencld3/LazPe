"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";

interface User {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  avatar: string;
  status: boolean;
  isLocked: boolean;
  roles: string[];
  registerDate: string;
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  lockedUsers: number;
  newUsersThisMonth: number;
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  // Modals
  const [lockModalOpen, setLockModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [lockReason, setLockReason] = useState("");
  const [lockoutDays, setLockoutDays] = useState(7);
  
  // Mounted state for portal
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset page on new search
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5101/api/Users?page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(debouncedSearch)}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
        setTotalCount(data.pagination.totalCount);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }, [page, pageSize, debouncedSearch]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5101/api/Users/statistics", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchUsers(), fetchStats()]).finally(() => setLoading(false));
  }, [fetchUsers]);

  const handleToggleStatus = async (userId: string) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`http://localhost:5101/api/Users/${userId}/toggle-status`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      fetchUsers();
      fetchStats();
    } catch (error) {
      console.error("Error toggling user status:", error);
    }
  };

  const handleLockUser = async () => {
    if (!lockReason.trim()) {
      alert("Vui lòng nhập lý do khóa tài khoản!");
      return;
    }
    if (!selectedUserId) {
      alert("Lỗi: Không tìm thấy ID người dùng.");
      return;
    }
    
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5101/api/Users/${selectedUserId}/lock`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason: lockReason, lockoutDays: lockoutDays })
      });
      
      const data = await res.json().catch(() => null);
      
      if (res.ok && data?.success !== false) {
        setLockModalOpen(false);
        setLockReason("");
        setSelectedUserId(null);
        fetchUsers();
        fetchStats();
        alert("Đã khóa tài khoản thành công!");
      } else {
        alert(data?.message || "Có lỗi xảy ra khi khóa tài khoản. Vui lòng kiểm tra quyền hoặc thử lại.");
      }
    } catch (error) {
      console.error("Error locking user:", error);
      alert("Lỗi kết nối đến máy chủ.");
    }
  };

  const handleUnlockUser = async (userId: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5101/api/Users/${userId}/unlock`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success !== false) {
        fetchUsers();
        fetchStats();
        alert("Đã mở khóa tài khoản thành công!");
      } else {
        alert(data?.message || "Có lỗi xảy ra khi mở khóa tài khoản.");
      }
    } catch (error) {
      console.error("Error unlocking user:", error);
      alert("Lỗi kết nối đến máy chủ.");
    }
  };

  const handleExport = () => {
    alert("Chức năng xuất dữ liệu chưa được kết nối API Backend do không tìm thấy API.");
    console.log("Exporting data...");
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  const filteredUsers = users.filter(user => {
    if (statusFilter === "active" && user.isLocked) return false;
    if (statusFilter === "locked" && !user.isLocked) return false;
    if (roleFilter && !user.roles?.includes(roleFilter)) return false;
    return true;
  });

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header Section */}
      <header className="h-20 bg-surface flex items-center justify-between px-md md:px-margin-desktop shadow-[0px_4px_20px_rgba(255,182,193,0.1)] sticky top-0 z-10">
        <div>
          <h1 className="font-headline-md text-headline-md text-primary">Quản lý người dùng</h1>
          <p className="font-body-md text-body-md text-on-surface-variant/70">Theo dõi và kiểm soát tài khoản người dùng</p>
        </div>
      </header>

      <div className="p-md md:p-margin-desktop space-y-lg overflow-y-auto">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter">
          <div className="bg-white/80 backdrop-blur-md border border-primary-container/20 p-lg rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-label-md text-on-surface-variant">Tổng người dùng</p>
                <h3 className="font-display-lg text-primary mt-xs">{stats?.totalUsers || 0}</h3>
              </div>
              <div className="p-sm bg-primary-container/20 rounded-lg">
                <span className="material-symbols-outlined text-primary">groups</span>
              </div>
            </div>
            <div className="mt-sm flex items-center gap-xs text-secondary">
              <span className="material-symbols-outlined text-sm">trending_up</span>
              <span className="text-xs font-bold">Cập nhật liên tục</span>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-md border border-primary-container/20 p-lg rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-label-md text-on-surface-variant">Đang hoạt động</p>
                <h3 className="font-display-lg text-secondary mt-xs">{stats?.activeUsers || 0}</h3>
              </div>
              <div className="p-sm bg-secondary-container/20 rounded-lg">
                <span className="material-symbols-outlined text-secondary">check_circle</span>
              </div>
            </div>
            <div className="mt-sm flex items-center gap-xs text-on-surface-variant">
              <span className="text-xs font-bold">Trạng thái ổn định</span>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-md border border-primary-container/20 p-lg rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-label-md text-on-surface-variant">Bị khóa</p>
                <h3 className="font-display-lg text-error mt-xs">{stats?.lockedUsers || 0}</h3>
              </div>
              <div className="p-sm bg-error-container/20 rounded-lg">
                <span className="material-symbols-outlined text-error">block</span>
              </div>
            </div>
            <div className="mt-sm flex items-center gap-xs text-error">
              <span className="text-xs font-bold">Cần theo dõi</span>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-md border border-primary-container/20 p-lg rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-label-md text-on-surface-variant">Mới (Tháng này)</p>
                <h3 className="font-display-lg text-tertiary mt-xs">{stats?.newUsersThisMonth || 0}</h3>
              </div>
              <div className="p-sm bg-tertiary-container/20 rounded-lg">
                <span className="material-symbols-outlined text-tertiary">person_add</span>
              </div>
            </div>
            <div className="mt-sm flex items-center gap-xs text-tertiary">
              <span className="material-symbols-outlined text-sm">bolt</span>
              <span className="text-xs font-bold">Tăng trưởng</span>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white/80 backdrop-blur-md border border-primary-container/20 p-md rounded-xl shadow-sm">
          <div className="flex flex-wrap items-center gap-md">
            <div className="flex-1 relative min-w-[300px]">
              <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
              <input
                className="w-full pl-xl pr-md py-md bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary/30 transition-all font-body-md"
                placeholder="Tìm kiếm theo tên, email..."
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="bg-surface-container-low border-none rounded-lg px-lg py-md font-label-md focus:ring-2 focus:ring-primary/30 min-w-[150px]"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="locked">Bị khóa</option>
            </select>
            <select
              className="bg-surface-container-low border-none rounded-lg px-lg py-md font-label-md focus:ring-2 focus:ring-primary/30 min-w-[150px]"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">Vai trò</option>
              <option value="Admin">Quản trị viên</option>
              <option value="User">Người dùng thường</option>
            </select>
            <button 
              className="text-primary font-label-md hover:underline px-md py-md"
              onClick={() => { setSearch(""); setStatusFilter(""); setRoleFilter(""); }}
            >
              Đặt lại
            </button>
            <button
              onClick={handleExport}
              className="bg-primary text-on-primary px-lg py-md rounded-lg font-label-md flex items-center gap-xs hover:scale-105 active:scale-95 transition-all shadow-md ml-auto whitespace-nowrap"
            >
              <span className="material-symbols-outlined">file_export</span>
              Xuất dữ liệu
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white/80 backdrop-blur-md rounded-xl shadow-sm overflow-x-auto border border-outline-variant/20">
          {loading ? (
            <div className="p-xl flex justify-center items-center">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <table className="w-full border-collapse whitespace-nowrap">
              <thead className="bg-primary-container/10 border-b border-outline-variant/30 text-left">
                <tr>
                  <th className="px-lg py-md font-label-md text-primary">Họ và tên</th>
                  <th className="px-lg py-md font-label-md text-primary text-center">Vai trò</th>
                  <th className="px-lg py-md font-label-md text-primary text-center">Trạng thái</th>
                  <th className="px-lg py-md font-label-md text-primary">Ngày tham gia</th>
                  <th className="px-lg py-md font-label-md text-primary text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-lg py-xl text-center text-on-surface-variant">Không tìm thấy người dùng nào</td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-primary-container/5 transition-colors group">
                      <td className="px-lg py-md">
                        <div className="flex items-center gap-sm">
                          <div className="w-10 h-10 rounded-full shrink-0 bg-surface-container flex items-center justify-center border border-primary-container overflow-hidden">
                            {user.avatar && user.avatar.trim() !== "" ? (
                              <>
                                <img 
                                  src={user.avatar.trim()} 
                                  alt={user.fullName || "User Avatar"}
                                  className="w-full h-full object-cover" 
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    if (e.currentTarget.nextElementSibling) {
                                      (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'block';
                                    }
                                  }}
                                />
                                <span className="material-symbols-outlined text-primary hidden">person</span>
                              </>
                            ) : (
                              <span className="material-symbols-outlined text-primary">person</span>
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-label-md text-on-surface font-bold truncate max-w-[200px]">{user.fullName || "Người dùng ẩn danh"}</span>
                            <span className="text-xs text-on-surface-variant/70 truncate max-w-[200px]">{user.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-lg py-md text-center">
                        <div className="flex justify-center gap-1">
                          {user.roles?.length ? user.roles.map(role => (
                            <span key={role} className="px-sm py-1 bg-surface-container-highest text-on-surface-variant rounded-full text-xs font-bold inline-block">
                              {role}
                            </span>
                          )) : (
                            <span className="px-sm py-1 bg-surface-container-highest text-on-surface-variant rounded-full text-xs font-bold inline-block">
                              User
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-lg py-md text-center">
                        {!user.isLocked ? (
                          <span className="bg-[#aeedd5] text-[#0d503f] px-sm py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 shrink-0">
                            <span className="w-1.5 h-1.5 bg-secondary rounded-full"></span> Hoạt động
                          </span>
                        ) : (
                          <span className="bg-[#ffdad6] text-[#93000a] px-sm py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 shrink-0">
                            <span className="w-1.5 h-1.5 bg-error rounded-full"></span> Bị khóa
                          </span>
                        )}
                      </td>
                      <td className="px-lg py-md font-body-md text-on-surface-variant">
                        {new Date(user.registerDate).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="px-lg py-md text-right">
                        <div className="flex items-center justify-end gap-sm shrink-0">
                          <button 
                            className="p-xs text-on-surface-variant hover:text-primary transition-colors"
                            title="Đổi trạng thái"
                            onClick={() => handleToggleStatus(user.id)}
                          >
                            <span className="material-symbols-outlined">swap_horiz</span>
                          </button>
                          
                          {!user.isLocked ? (
                            <button 
                              className="p-xs text-on-surface-variant hover:text-error transition-colors"
                              title="Khóa tài khoản"
                              onClick={() => {
                                setSelectedUserId(user.id);
                                setLockModalOpen(true);
                              }}
                            >
                              <span className="material-symbols-outlined">lock</span>
                            </button>
                          ) : (
                            <button 
                              className="p-xs text-secondary hover:opacity-80 transition-colors"
                              title="Mở khóa tài khoản"
                              onClick={() => handleUnlockUser(user.id)}
                            >
                              <span className="material-symbols-outlined">lock_open</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* Pagination */}
          <div className="p-lg bg-surface border-t border-outline-variant/20 flex flex-col md:flex-row items-center justify-between gap-md">
            <p className="font-label-md text-on-surface-variant">
              Đang hiển thị <span className="font-bold text-primary">{totalCount > 0 ? (page - 1) * pageSize + 1 : 0} - {Math.min(page * pageSize, totalCount)}</span> trong số <span className="font-bold text-primary">{totalCount}</span> người dùng
            </p>
            <div className="flex items-center gap-sm">
              <button 
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant/30 text-on-surface-variant hover:bg-primary-container/10 transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              
              <span className="font-bold px-md">{page} / {totalPages || 1}</span>
              
              <button 
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant/30 text-on-surface-variant hover:bg-primary-container/10 transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lock User Modal using Portal */}
      {mounted && lockModalOpen && createPortal(
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-md backdrop-blur-sm" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}>
          <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-outline-variant/30 flex flex-col" style={{ width: '90%', maxWidth: '450px', minWidth: '320px', backgroundColor: 'white' }}>
            <div className="p-md border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-lowest">
              <h3 className="font-headline-md text-error flex items-center gap-sm font-bold text-lg">
                <span className="material-symbols-outlined">block</span>
                Khóa Tài Khoản
              </h3>
              <button onClick={() => setLockModalOpen(false)} className="text-on-surface-variant hover:text-error transition-colors p-1 rounded-full hover:bg-error-container/20 flex items-center justify-center">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-md space-y-md bg-white">
              <div className="flex flex-col gap-2">
                <label className="block font-label-md text-black font-bold">Lý do khóa</label>
                <textarea 
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-sm focus:ring-2 focus:ring-error/50 outline-none font-body-md text-black resize-none min-h-[100px]"
                  rows={3}
                  value={lockReason}
                  onChange={(e) => setLockReason(e.target.value)}
                  placeholder="Nhập lý do khóa tài khoản này..."
                  style={{ color: 'black' }}
                ></textarea>
              </div>
              <div className="flex flex-col gap-2 mt-4">
                <label className="block font-label-md text-black font-bold">Thời gian khóa (Ngày)</label>
                <input 
                  type="number" 
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-sm focus:ring-2 focus:ring-error/50 outline-none font-body-md text-black"
                  value={lockoutDays}
                  onChange={(e) => setLockoutDays(parseInt(e.target.value) || 0)}
                  min={1}
                  style={{ color: 'black' }}
                />
              </div>
            </div>
            <div className="p-md bg-gray-50 flex justify-end gap-sm border-t border-gray-200 mt-auto">
              <button 
                onClick={() => setLockModalOpen(false)}
                className="px-md py-sm rounded-lg font-bold text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors"
              >
                Hủy
              </button>
              <button 
                onClick={handleLockUser}
                className="px-md py-sm rounded-lg font-bold bg-error text-white hover:opacity-90 transition-colors"
              >
                Xác nhận Khóa
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}