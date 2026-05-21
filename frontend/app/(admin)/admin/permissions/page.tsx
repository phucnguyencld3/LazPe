"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5101/api";

export default function PermissionCenterPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [activeTab, setActiveTab] = useState<"users" | "definitions">("users");

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset page when search term changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  // Fetch data when page or debounced search changes
  useEffect(() => {
    fetchData();
  }, [page, debouncedSearch]);

  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    try {
      // 1. Fetch system permissions
      const permRes = await fetch(`${API_BASE_URL}/Permission`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const permData = await permRes.json();
      if (permData.success) {
        setPermissions(permData.data);
      }

      // 2. Fetch users
      const usersRes = await fetch(`${API_BASE_URL}/Users?search=${debouncedSearch}&page=${page}&pageSize=10`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const usersData = await usersRes.json();
      if (usersData.success) {
        setUsers(usersData.data);
        setTotalPages(usersData.pagination.totalPages);
        setTotalCount(usersData.pagination.totalCount);
      }
    } catch (error) {
      console.error("Error fetching permission center data:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetSearch = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setPage(1);
  };

  // Group permissions by resource for the definitions tab
  const groupedPermissions = permissions.reduce((acc: any, curr: any) => {
    const resource = curr.resource || "Khác";
    if (!acc[resource]) {
      acc[resource] = [];
    }
    acc[resource].push(curr);
    return acc;
  }, {});

  const getResourceTitle = (resource: string) => {
    switch (resource.toLowerCase()) {
      case "user": return "Quản lý Người dùng (User)";
      case "product": return "Quản lý Sản phẩm (Product)";
      case "category": return "Quản lý Danh mục (Category)";
      case "order": return "Quản lý Đơn hàng (Order)";
      case "permission": return "Quản lý Phân quyền (Permission)";
      case "admin": return "Quyền Quản trị viên (Admin)";
      case "bundle": return "Quản lý Gói sản phẩm (Bundle)";
      case "supplier": return "Quản lý Nhà cung cấp (Supplier)";
      case "report": return "Xem Báo cáo (Report)";
      case "analytics": return "Phân tích số liệu (Analytics)";
      case "system": return "Cấu hình Hệ thống (System)";
      case "review": return "Quản lý Đánh giá (Review)";
      case "address": return "Quản lý Địa chỉ (Address)";
      default: return `Nhóm ${resource}`;
    }
  };

  const getResourceIcon = (resource: string) => {
    switch (resource.toLowerCase()) {
      case "user": return "group";
      case "product": return "inventory_2";
      case "category": return "category";
      case "order": return "shopping_cart";
      case "permission": return "key";
      case "admin": return "security";
      case "bundle": return "inbox";
      case "supplier": return "local_shipping";
      case "report": return "analytics";
      case "analytics": return "bar_chart";
      case "system": return "settings";
      case "review": return "star";
      case "address": return "location_on";
      default: return "extension";
    }
  };

  // Counts for statistics cards
  const totalSystemPermissions = permissions.length;
  const totalGroups = Object.keys(groupedPermissions).length;
  const adminUsersCount = users.filter((u: any) => 
    u.roles?.some((r: string) => r === "Admin" || r === "Staff")
  ).length;

  return (
    <div className="w-full pb-lg">
      {/* Header Section */}
      <header className="mb-lg">
        <h1 className="font-headline-md text-headline-md text-primary font-bold">Trung tâm Phân quyền</h1>
        <p className="font-body-md text-body-md text-on-surface-variant/70">
          Thiết lập quyền truy cập chi tiết và vai trò bảo mật cho toàn bộ nhân sự hệ thống.
        </p>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter mb-lg">
        {/* Card 1 */}
        <div className="p-lg rounded-xl bg-surface-container-lowest border border-outline-variant/20 shadow-sm flex items-start justify-between">
          <div>
            <p className="font-label-md text-label-md text-on-surface-variant font-bold">Tổng số quyền hệ thống</p>
            <h3 className="font-display-lg text-display-lg text-primary mt-xs">{totalSystemPermissions}</h3>
            <p className="text-xs text-on-surface-variant/60 mt-xs">Được định nghĩa trong cơ sở dữ liệu</p>
          </div>
          <div className="p-sm bg-primary-container/20 rounded-lg">
            <span className="material-symbols-outlined text-primary text-[28px]">vpn_key</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="p-lg rounded-xl bg-surface-container-lowest border border-outline-variant/20 shadow-sm flex items-start justify-between">
          <div>
            <p className="font-label-md text-label-md text-on-surface-variant font-bold">Nhóm tài nguyên phân quyền</p>
            <h3 className="font-display-lg text-display-lg text-secondary mt-xs">{totalGroups}</h3>
            <p className="text-xs text-on-surface-variant/60 mt-xs">Mô-đun chức năng được bảo vệ</p>
          </div>
          <div className="p-sm bg-secondary-container/20 rounded-lg">
            <span className="material-symbols-outlined text-secondary text-[28px]">grid_view</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="p-lg rounded-xl bg-surface-container-lowest border border-outline-variant/20 shadow-sm flex items-start justify-between">
          <div>
            <p className="font-label-md text-label-md text-on-surface-variant font-bold">Vai trò trong trang này</p>
            <h3 className="font-display-lg text-display-lg text-tertiary mt-xs">Admin / Staff / User</h3>
            <p className="text-xs text-on-surface-variant/60 mt-xs">Theo chuẩn phân quyền ASP.NET Identity</p>
          </div>
          <div className="p-sm bg-tertiary-container/20 rounded-lg">
            <span className="material-symbols-outlined text-tertiary text-[28px]">shield</span>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-outline-variant/30 mb-md">
        <button
          onClick={() => setActiveTab("users")}
          className={`px-lg py-md font-label-md text-label-md font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "users"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant/70 hover:text-primary"
          }`}
        >
          <span className="material-symbols-outlined text-sm">manage_accounts</span>
          Phân quyền tài khoản ({totalCount})
        </button>
        <button
          onClick={() => setActiveTab("definitions")}
          className={`px-lg py-md font-label-md text-label-md font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "definitions"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant/70 hover:text-primary"
          }`}
        >
          <span className="material-symbols-outlined text-sm">rule</span>
          Danh sách quyền hệ thống ({totalSystemPermissions})
        </button>
      </div>

      {/* Content based on Active Tab */}
      {activeTab === "users" ? (
        <div className="space-y-md animate-fadeIn">
          {/* User Search & Filter */}
          <div className="p-md rounded-xl bg-surface-container-lowest border border-outline-variant/20 shadow-sm flex flex-wrap items-center gap-md">
            <div className="flex-1 relative min-w-[300px]">
              <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
              <input
                className="w-full pl-xl pr-md py-md bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary/30 transition-all font-body-md text-on-surface"
                placeholder="Tìm tên, email người dùng để phân quyền..."
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={resetSearch}
              className="text-primary font-label-md text-label-md font-bold hover:underline px-md py-md"
            >
              Đặt lại
            </button>
          </div>

          {/* User Table */}
          <div className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-primary-container/10 border-b border-outline-variant/30 text-left">
                  <tr>
                    <th className="px-lg py-md font-label-md text-label-md text-primary font-bold">Người dùng</th>
                    <th className="px-lg py-md font-label-md text-label-md text-primary font-bold text-center">Vai trò hệ thống</th>
                    <th className="px-lg py-md font-label-md text-label-md text-primary font-bold text-center">Trạng thái</th>
                    <th className="px-lg py-md font-label-md text-label-md text-primary font-bold text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-10 text-on-surface-variant font-body-md">
                        Không tìm thấy người dùng phù hợp.
                      </td>
                    </tr>
                  ) : (
                    users.map((u: any) => (
                      <tr
                        key={u.id}
                        onClick={() => router.push(`/admin/users/${u.id}`)}
                        className="hover:bg-primary-container/5 transition-colors cursor-pointer group"
                      >
                        <td className="px-lg py-md">
                          <div className="flex items-center gap-sm">
                            <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center border border-primary-container overflow-hidden relative">
                              {u.avatar ? (
                                <img src={u.avatar} alt="Avatar" className="w-full h-full object-cover" />
                              ) : (
                                <span className="material-symbols-outlined text-on-surface-variant">person</span>
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-label-md text-label-md text-on-surface font-bold">
                                {u.fullName || u.userName}
                              </span>
                              <span className="text-xs text-on-surface-variant/70">{u.email || "N/A"}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-lg py-md text-center">
                          <div className="flex justify-center gap-xs flex-wrap">
                            {u.roles?.length > 0 ? (
                              u.roles.map((role: string, idx: number) => {
                                const isAdminRole = role === "Admin";
                                const isStaffRole = role === "Staff";
                                return (
                                  <span
                                    key={idx}
                                    className={`px-sm py-1 rounded-full text-xs font-bold ${
                                      isAdminRole
                                        ? "bg-primary-container text-on-primary-container border border-primary/20"
                                        : isStaffRole
                                        ? "bg-secondary-container text-on-secondary-container border border-secondary/20"
                                        : "bg-surface-variant text-on-surface-variant border border-outline-variant/30"
                                    }`}
                                  >
                                    {role}
                                  </span>
                                );
                              })
                            ) : (
                              <span className="px-sm py-1 bg-surface-variant text-on-surface-variant/75 rounded-full text-xs">
                                User
                              </span>
                            )}
                          </div>
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
                        <td className="px-lg py-md text-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => router.push(`/admin/users/${u.id}`)}
                            className="bg-primary text-on-primary hover:bg-[#7b444e] px-md py-sm rounded-full font-label-md text-xs font-bold flex items-center gap-1 ml-auto shadow-sm hover:scale-105 active:scale-95 transition-all"
                          >
                            <span className="material-symbols-outlined text-[14px]">shield</span>
                            Phân quyền chi tiết
                          </button>
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
                  Hiển thị trang <span className="font-bold text-primary">{page}</span> / <span className="font-bold text-primary">{totalPages}</span> (Tổng {totalCount} người dùng)
                </p>
                <div className="flex items-center gap-sm">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant/30 text-on-surface-variant hover:bg-primary-container/10 transition-colors disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined">chevron_left</span>
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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
      ) : (
        <div className="space-y-md animate-fadeIn">
          {/* Permission Definitions Tabs / Categorized List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
            {Object.keys(groupedPermissions).map((resource) => (
              <div
                key={resource}
                className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 p-md shadow-sm"
              >
                <h3 className="font-headline-md text-[18px] text-primary font-bold flex items-center gap-2 border-b border-outline-variant/30 pb-sm mb-sm">
                  <span className="material-symbols-outlined">{getResourceIcon(resource)}</span>
                  {getResourceTitle(resource)}
                </h3>
                <div className="space-y-sm max-h-[300px] overflow-y-auto pr-xs">
                  {groupedPermissions[resource].map((perm: any) => (
                    <div
                      key={perm.id}
                      className="p-sm bg-surface-container-low rounded-lg flex items-start justify-between hover:bg-secondary-container/10 transition-colors border border-outline-variant/10"
                    >
                      <div className="flex flex-col gap-xs flex-1">
                        <span className="font-label-md text-xs font-bold text-on-surface flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                          {perm.name}
                        </span>
                        <p className="text-xs text-on-surface-variant/80 font-body-md pl-sm">
                          {perm.description || "Không có mô tả"}
                        </p>
                      </div>
                      <span className="px-sm py-0.5 bg-surface-variant text-[10px] text-on-surface-variant rounded-full font-bold uppercase">
                        {perm.action}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
