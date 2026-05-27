"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { fetchPermissions, API_BASE_URL } from "@/lib/features/permissions/permissionApi";
import { PermissionSummaryCards } from "@/components/admin/permissions/PermissionSummaryCards";
import { PermissionDefinitionsTab } from "@/components/admin/permissions/PermissionDefinitionsTab";
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
  const [activeTab, setActiveTab] = useState<"users" | "definitions">("users");

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

        const usersRes = await fetch(`${API_BASE_URL}/Users?search=${debouncedSearch}&page=${page}&pageSize=10`, {
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
      <div className="flex border-b border-outline-variant/30 mb-md">
        <button
          onClick={() => setActiveTab("users")}
          className={`px-lg py-md font-label-md text-label-md font-bold flex items-center gap-2 border-b-2 transition-all ${activeTab === "users"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant/70 hover:text-primary"
            }`}
        >
          <span className="material-symbols-outlined text-sm">manage_accounts</span>
          Phân quyền tài khoản ({totalCount})
        </button>
        <button
          onClick={() => setActiveTab("definitions")}
          className={`px-lg py-md font-label-md text-label-md font-bold flex items-center gap-2 border-b-2 transition-all ${activeTab === "definitions"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant/70 hover:text-primary"
            }`}
        >
          <span className="material-symbols-outlined text-sm">rule</span>
          Danh sách quyền hệ thống ({totalSystemPermissions})
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
        <PermissionDefinitionsTab groupedPermissions={groupedPermissions} />
      )}
    </div>
  );
}
