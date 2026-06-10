"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchUserStats, fetchUsers, UserStats as UserStatsType } from "@/lib/features/users/userApi";
import { UserStats } from "@/components/admin/users/UserStats";
import { UserFilters } from "@/components/admin/users/UserFilters";
import { UserTable } from "@/components/admin/users/UserTable";

import Button from "@/components/admin/ui/Button";

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
        const filteredList = (usersData.data || []).filter(
          (u: any) => !u.roles?.some((r: string) => r.toLowerCase() === "administrator" || r.toLowerCase() === "admin")
        );
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
    <div className="w-full pb-20 font-outfit">
      {/* Header Section */}
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-800 dark:text-white/90">
            Quản lý người dùng
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Theo dõi và kiểm soát tài khoản người dùng của hệ thống
          </p>
        </div>
        <Button
          variant="secondary"
          className="rounded-full font-bold text-xs"
          startIcon={<span className="material-symbols-outlined text-sm">file_export</span>}
        >
          Xuất dữ liệu
        </Button>
      </header>
      
      <div className="space-y-8">
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