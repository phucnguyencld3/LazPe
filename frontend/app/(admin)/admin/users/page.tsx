"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5101/api";

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchData();
  }, [page]);

  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    try {
      // Fetch stats
      const statsRes = await fetch(`${API_BASE_URL}/Users/statistics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const statsData = await statsRes.json();
      if (statsData.success) {
        setStats(statsData);
      }

      // Fetch users list
      const usersRes = await fetch(`${API_BASE_URL}/Users?search=${searchTerm}&page=${page}&pageSize=10`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const usersData = await usersRes.json();
      if (usersData.success) {
        setUsers(usersData.data);
        setTotalPages(usersData.pagination.totalPages);
        setTotalCount(usersData.pagination.totalCount);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setPage(1);
      fetchData();
    }
  };

  const goToDetails = (id: string) => {
    router.push(`/admin/users/${id}`);
  };

  return (
    <div className="w-full">
      {/* Header Section */}
      <header className="mb-lg flex items-center justify-between">
        <div>
          <h1 className="font-headline-md text-headline-md text-primary font-bold">Quản lý người dùng</h1>
          <p className="font-body-md text-body-md text-on-surface-variant/70">Theo dõi và kiểm soát tài khoản người dùng</p>
        </div>
        <button className="bg-primary text-on-primary px-lg py-md rounded-full font-label-md text-label-md flex items-center gap-xs hover:scale-105 active:scale-95 transition-all shadow-md font-bold">
          <span className="material-symbols-outlined">file_export</span>
          Xuất dữ liệu
        </button>
      </header>
      
      <div className="space-y-lg">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter">
          <div className="glass-card p-lg rounded-xl shadow-sm hover:shadow-md transition-shadow bg-surface-container-lowest border border-outline-variant/20">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-label-md text-label-md text-on-surface-variant font-bold">Tổng người dùng</p>
                <h3 className="font-display-lg text-display-lg text-primary mt-xs">{stats?.totalUsers || 0}</h3>
              </div>
              <div className="p-sm bg-primary-container/20 rounded-lg">
                <span className="material-symbols-outlined text-primary text-[28px]">groups</span>
              </div>
            </div>
            <div className="mt-sm flex items-center gap-xs text-secondary">
              <span className="material-symbols-outlined text-sm">trending_up</span>
              <span className="text-xs font-bold">+12% tháng này</span>
            </div>
          </div>
          <div className="glass-card p-lg rounded-xl shadow-sm hover:shadow-md transition-shadow bg-surface-container-lowest border border-outline-variant/20">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-label-md text-label-md text-on-surface-variant font-bold">Đang hoạt động</p>
                <h3 className="font-display-lg text-display-lg text-secondary mt-xs">{stats?.activeUsers || 0}</h3>
              </div>
              <div className="p-sm bg-secondary-container/20 rounded-lg">
                <span className="material-symbols-outlined text-secondary text-[28px]">check_circle</span>
              </div>
            </div>
          </div>
          <div className="glass-card p-lg rounded-xl shadow-sm hover:shadow-md transition-shadow bg-surface-container-lowest border border-outline-variant/20">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-label-md text-label-md text-on-surface-variant font-bold">Bị khóa</p>
                <h3 className="font-display-lg text-display-lg text-error mt-xs">{stats?.lockedUsers || 0}</h3>
              </div>
              <div className="p-sm bg-error-container/20 rounded-lg">
                <span className="material-symbols-outlined text-error text-[28px]">block</span>
              </div>
            </div>
          </div>
          <div className="glass-card p-lg rounded-xl shadow-sm hover:shadow-md transition-shadow bg-surface-container-lowest border border-outline-variant/20">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-label-md text-label-md text-on-surface-variant font-bold">Mới (Tháng này)</p>
                <h3 className="font-display-lg text-display-lg text-tertiary mt-xs">{stats?.newUsersThisMonth || 0}</h3>
              </div>
              <div className="p-sm bg-tertiary-container/20 rounded-lg">
                <span className="material-symbols-outlined text-tertiary text-[28px]">person_add</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="glass-card p-md rounded-xl shadow-sm bg-surface-container-lowest border border-outline-variant/20">
          <div className="flex flex-wrap items-center gap-md">
            <div className="flex-1 relative min-w-[300px]">
              <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
              <input
                className="w-full pl-xl pr-md py-md bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary/30 transition-all font-body-md text-on-surface"
                placeholder="Tìm kiếm theo tên, email, SĐT... (Nhấn Enter)"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearch}
              />
            </div>
            <select className="bg-surface-container-low border-none rounded-lg px-lg py-md font-label-md text-on-surface focus:ring-2 focus:ring-primary/30 min-w-[180px]">
              <option value="">Trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="locked">Bị khóa</option>
            </select>
            <button 
              onClick={() => { setSearchTerm(""); setPage(1); fetchData(); }} 
              className="text-primary font-label-md text-label-md font-bold hover:underline px-md py-md"
            >
              Đặt lại
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="glass-card rounded-xl shadow-sm overflow-hidden border border-outline-variant/20 bg-surface-container-lowest">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-primary-container/10 border-b border-outline-variant/30 text-left">
                <tr>
                  <th className="px-lg py-md font-label-md text-label-md text-primary font-bold">ID</th>
                  <th className="px-lg py-md font-label-md text-label-md text-primary font-bold">Họ và tên</th>
                  <th className="px-lg py-md font-label-md text-label-md text-primary font-bold">Liên hệ</th>
                  <th className="px-lg py-md font-label-md text-label-md text-primary font-bold text-center">Vai trò</th>
                  <th className="px-lg py-md font-label-md text-label-md text-primary font-bold text-center">Trạng thái</th>
                  <th className="px-lg py-md font-label-md text-label-md text-primary font-bold">Ngày tạo</th>
                  <th className="px-lg py-md font-label-md text-label-md text-primary font-bold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-on-surface-variant font-body-md">Không có dữ liệu</td>
                  </tr>
                ) : (
                  users.map((u: any) => (
                    <tr 
                      key={u.id} 
                      onClick={() => goToDetails(u.id)}
                      className="hover:bg-primary-container/10 transition-colors cursor-pointer group"
                    >
                      <td className="px-lg py-md font-body-md text-body-md text-on-surface-variant">#{u.id.substring(0, 8)}</td>
                      <td className="px-lg py-md">
                        <div className="flex items-center gap-sm">
                          <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center border border-primary-container overflow-hidden relative">
                            {u.avatar ? (
                              <img src={u.avatar} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                              <span className="material-symbols-outlined text-on-surface-variant">person</span>
                            )}
                          </div>
                          <span className="font-label-md text-label-md text-on-surface font-bold">{u.fullName || u.userName}</span>
                        </div>
                      </td>
                      <td className="px-lg py-md">
                        <div className="flex flex-col">
                          <span className="font-body-md text-body-md text-on-surface-variant">{u.email || "N/A"}</span>
                          <span className="text-xs text-on-surface-variant/60">{u.phoneNumber || "N/A"}</span>
                        </div>
                      </td>
                      <td className="px-lg py-md text-center">
                        <span className="px-sm py-1 bg-tertiary-container/30 text-on-tertiary-container rounded-full text-xs font-bold">
                          {u.roles?.length > 0 ? u.roles[0] : "User"}
                        </span>
                      </td>
                      <td className="px-lg py-md text-center">
                        {u.isLocked ? (
                           <span className="bg-error-container text-on-error-container px-sm py-1 rounded-full text-xs font-bold inline-flex items-center gap-1">
                             <span className="w-1.5 h-1.5 bg-error rounded-full"></span> Bị khóa
                           </span>
                        ) : (
                           <span className="bg-secondary-container text-on-secondary-container px-sm py-1 rounded-full text-xs font-bold inline-flex items-center gap-1">
                             <span className="w-1.5 h-1.5 bg-secondary rounded-full"></span> Hoạt động
                           </span>
                        )}
                      </td>
                      <td className="px-lg py-md font-body-md text-body-md text-on-surface-variant">
                        {new Date(u.registerDate).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="px-lg py-md text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-sm">
                          <button onClick={() => goToDetails(u.id)} className="p-xs text-on-surface-variant hover:text-primary transition-colors">
                            <span className="material-symbols-outlined">visibility</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {!loading && users.length > 0 && (
            <div className="p-lg bg-surface-container-lowest border-t border-outline-variant/20 flex flex-col md:flex-row items-center justify-between gap-md">
              <p className="font-label-md text-label-md text-on-surface-variant">
                Đang hiển thị trang <span className="font-bold text-primary">{page}</span> / <span className="font-bold text-primary">{totalPages}</span> (Tổng {totalCount})
              </p>
              <div className="flex items-center gap-sm">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant/30 text-on-surface-variant hover:bg-primary-container/10 transition-colors disabled:opacity-50"
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <button 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant/30 text-on-surface-variant hover:bg-primary-container/10 transition-colors disabled:opacity-50"
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}