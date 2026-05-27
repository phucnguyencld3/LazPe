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
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset page when search term changes
  useEffect(() => setPage(1), [debouncedSearch]);

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
        setUsers(usersData.data);
        setTotalPages(usersData.pagination.totalPages);
        setTotalCount(usersData.pagination.totalCount);
      } catch (error) {
        console.error("Error fetching data:", error);
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
        <UserStats stats={stats} />
        
        <UserFilters 
          searchTerm={searchTerm} 
          onSearchChange={setSearchTerm} 
          onReset={resetSearch} 
        />
        
        <UserTable 
          users={users}
          loading={loading}
          page={page}
          totalPages={totalPages}
          totalCount={totalCount}
          onPageChange={setPage}
          onRowClick={goToDetails}
        />
      </div>
    </div>
  );
}