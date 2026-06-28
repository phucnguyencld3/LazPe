"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchUserStats, fetchUsers, UserStats as UserStatsType, exportUsersExcel } from "@/lib/features/users/userApi";
import { UserStats } from "@/components/admin/users/UserStats";
import { UserFilters } from "@/components/admin/users/UserFilters";
import { UserTable } from "@/components/admin/users/UserTable";
import { toast } from "@/lib/toast";

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<UserStatsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const handleExportExcel = async () => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return;

      setExporting(true);
      const blob = await exportUsersExcel(token, debouncedSearch);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `DanhSachTaiKhoan_${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success("Xuất file Excel thành công!");
    } catch (err: any) {
      console.error(err);
      toast.error("Không thể xuất file Excel.");
    } finally {
      setExporting(false);
    }
  };

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

  const goToChat = (id: string) => {
    router.push(`/admin/users/${id}/chat`);
  };

  return (
    <div className="w-full">
      {/* Header Section */}
      <header className="mb-lg flex items-center justify-between">
        <div>
          <h1 className="font-headline-md text-headline-md text-primary font-bold">Quản lý người dùng</h1>
          <p className="font-body-md text-body-md text-on-surface-variant/70">Theo dõi và kiểm soát tài khoản người dùng</p>
        </div>
        <button
          onClick={handleExportExcel}
          disabled={exporting}
          className="border border-emerald-600 text-emerald-600 px-5 py-2.5 rounded-[8px] font-bold text-xs flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all shadow-sm cursor-pointer disabled:opacity-50"
        >
          {exporting ? (
            <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-emerald-600 border-t-transparent"></div>
          ) : (
            <span className="material-symbols-outlined text-[18px]">file_export</span>
          )}
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
          onChatClick={goToChat}
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