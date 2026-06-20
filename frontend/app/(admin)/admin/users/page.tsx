"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchUserStats, fetchUsers, UserStats as UserStatsType } from "@/lib/features/users/userApi";
import { UserStats } from "@/components/admin/users/UserStats";
import { UserFilters } from "@/components/admin/users/UserFilters";
import { UserTable } from "@/components/admin/users/UserTable";

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<UserStatsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset page when search term changes
  useEffect(() => setPage(1), [debouncedSearch, statusFilter]);

  // Fetch data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return router.push("/login");

      try {
        const statsData = await fetchUserStats(token);
        setStats(statsData);

        const usersData = await fetchUsers(token, debouncedSearch, page);
        const filteredList = (usersData.data || []).filter((u: any) => {
          // Remove admins
          if (u.roles?.some((r: string) => r.toLowerCase() === "administrator" || r.toLowerCase() === "admin")) {
            return false;
          }
          // Filter by status
          if (statusFilter === "active" && u.isLocked) return false;
          if (statusFilter === "locked" && !u.isLocked) return false;
          
          return true;
        });

        setUsers(filteredList);
        setTotalPages(usersData.pagination.totalPages);
        setTotalCount(usersData.pagination.totalCount - (usersData.data.length - filteredList.length));
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [page, debouncedSearch, statusFilter, router]);

  const resetSearch = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setStatusFilter("all");
    setPage(1);
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
        <button className="border border-primary text-primary px-5 py-2.5 rounded-[8px] font-bold text-xs flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all shadow-sm cursor-pointer">
          <span className="material-symbols-outlined text-[18px]">file_export</span>
          Xuất dữ liệu
        </button>
      </header>
      
      <div className="space-y-lg">
        <UserStats stats={stats} />
        
        <UserTable 
          users={users}
          loading={loading}
          page={page}
          totalPages={totalPages}
          totalCount={totalCount}
          onPageChange={setPage}
          onRowClick={goToDetails}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onReset={resetSearch}
        />
      </div>
    </div>
  );
}