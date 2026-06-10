import React from "react";
import { Pagination } from "../shared/Pagination";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/admin/ui/Table";
import Badge from "@/components/admin/ui/Badge";
import Button from "@/components/admin/ui/Button";

interface UserTableProps {
  users: any[];
  loading: boolean;
  page: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onRowClick: (id: string) => void;
}

export const UserTable: React.FC<UserTableProps> = ({
  users,
  loading,
  page,
  totalPages,
  totalCount,
  onPageChange,
  onRowClick,
}) => {
  return (
    <div className="bg-white dark:bg-gray-950 rounded-[2rem] border border-gray-150 dark:border-white/[0.05] shadow-theme-xs overflow-hidden font-outfit">
      <div className="overflow-x-auto">
        <Table className="border-none shadow-none rounded-none">
          <TableHeader className="bg-gray-50/50 dark:bg-white/[0.02] border-b border-gray-100 dark:border-gray-800">
            <TableRow>
              <TableCell isHeader>ID</TableCell>
              <TableCell isHeader>Họ và tên</TableCell>
              <TableCell isHeader>Liên hệ</TableCell>
              <TableCell isHeader className="text-center">Vai trò</TableCell>
              <TableCell isHeader className="text-center">Trạng thái</TableCell>
              <TableCell isHeader>Ngày tạo</TableCell>
              <TableCell isHeader className="text-right">Thao tác</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-500"></div>
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-gray-400 dark:text-gray-500">
                  Không có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              users.map((u: any) => (
                <TableRow 
                  key={u.id} 
                  onClick={() => onRowClick(u.id)}
                  className="cursor-pointer group"
                >
                  <TableCell className="text-xs font-bold text-gray-500 dark:text-gray-400">
                    #{u.id.substring(0, 8)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center border border-gray-200 dark:border-gray-800 overflow-hidden relative shrink-0">
                        {u.avatar ? (
                          <img src={u.avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-gray-400">person</span>
                        )}
                      </div>
                      <span className="font-bold text-gray-800 dark:text-white/90 text-sm group-hover:text-brand-500 transition-colors">
                        {u.fullName || u.userName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-gray-700 dark:text-gray-300 text-sm">{u.email || "N/A"}</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">{u.phoneNumber || "N/A"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge color="info" variant="light" size="sm">
                      {u.roles?.length > 0 ? u.roles[0] : "User"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge color={u.isLocked ? "error" : "success"} variant="light" size="sm">
                      <span className={`w-1.5 h-1.5 rounded-full ${u.isLocked ? "bg-error-500" : "bg-success-500"}`}></span>
                      {u.isLocked ? "Bị khóa" : "Hoạt động"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-bold text-gray-450 dark:text-gray-500">
                    {new Date(u.registerDate).toLocaleDateString("vi-VN")}
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <Button 
                        variant="icon" 
                        onClick={() => onRowClick(u.id)}
                        title="Xem chi tiết"
                      >
                        <span className="material-symbols-outlined text-lg">visibility</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {!loading && users.length > 0 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalCount}
          itemsPerPage={10}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
};

