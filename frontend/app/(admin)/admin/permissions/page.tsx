"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { fetchPermissions, API_BASE_URL } from "@/lib/features/permissions/permissionApi";
import { PermissionSummaryCards } from "@/components/admin/permissions/PermissionSummaryCards";
import { PermissionRoleTemplatesTab } from "@/components/admin/permissions/PermissionRoleTemplatesTab";
import { PermissionUsersTab } from "@/components/admin/permissions/PermissionUsersTab";

export default function PermissionCenterPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search and Pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Tabs
  const [activeTab, setActiveTab] = useState<"users" | "templates">("users");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  // Fetch data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return router.push("/login");

      try {
        const perms = await fetchPermissions(token);
        setPermissions(perms);

        const usersRes = await fetch(`${API_BASE_URL}/Users?search=${debouncedSearch}&page=${page}&pageSize=10&onlyWithPermissions=true`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const usersData = await usersRes.json();
        if (usersData.success) {
          setUsers(usersData.data);
          setTotalPages(usersData.pagination.totalPages);
          setTotalCount(usersData.pagination.totalCount);
        }
      } catch (err) {
        console.error("Error fetching permission center data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [page, debouncedSearch, router]);

  const resetSearch = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setPage(1);
  };

  // Grouped Permissions
  const groupedPermissions = useMemo(() => {
    return permissions.reduce((acc: any, curr: any) => {
      const resource = curr.resource || "Khác";
      if (!acc[resource]) acc[resource] = [];
      acc[resource].push(curr);
      return acc;
    }, {});
  }, [permissions]);

  // Stats
  const totalSystemPermissions = permissions.length;
  const totalGroups = Object.keys(groupedPermissions).length;

  return (
    <div className="w-full pb-lg animate-fadeIn">
      {/* Header Section */}
      <header className="mb-lg">
        <h1 className="font-headline-md text-headline-md text-primary font-bold">Trung tâm Phân quyền</h1>
        <p className="font-body-md text-body-md text-on-surface-variant/70">
          Thiết lập quyền truy cập chi tiết và vai trò bảo mật cho toàn bộ nhân sự hệ thống.
        </p>
      </header>

      <PermissionSummaryCards
        totalSystemPermissions={totalSystemPermissions}
        totalGroups={totalGroups}
      />

      {/* Tabs Menu */}
      <div className="flex bg-slate-50 p-1.5 rounded-[8px] w-fit mb-6 shadow-inner border border-slate-100">
        <button
          onClick={() => setActiveTab("users")}
          className={`px-6 py-2.5 font-bold text-sm flex items-center gap-2 rounded-[8px] transition-all cursor-pointer ${activeTab === "users"
              ? "bg-white text-primary shadow-sm"
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/50"
            }`}
        >
          <span className="material-symbols-outlined text-[18px]">manage_accounts</span>
          Phân quyền tài khoản ({totalCount})
        </button>
        <button
          onClick={() => setActiveTab("templates")}
          className={`px-6 py-2.5 font-bold text-sm flex items-center gap-2 rounded-[8px] transition-all cursor-pointer ${activeTab === "templates"
              ? "bg-white text-primary shadow-sm"
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/50"
            }`}
        >
          <span className="material-symbols-outlined text-[18px]">settings_suggest</span>
          Quản lý Gói Quyền
        </button>
      </div>

      {activeTab === "users" ? (
        <PermissionUsersTab
          users={users}
          loading={loading}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          resetSearch={resetSearch}
          page={page}
          totalPages={totalPages}
          totalCount={totalCount}
          setPage={setPage}
        />
      ) : (
        <PermissionRoleTemplatesTab showHeader={false} />
      )}
    </div>
  );
}
