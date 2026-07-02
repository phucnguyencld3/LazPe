export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5101/api";

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  lockedUsers: number;
  newUsersThisMonth: number;
}

export const fetchUserStats = async (token: string): Promise<UserStats> => {
  const res = await fetch(`${API_BASE_URL}/Users/statistics`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || "Failed to fetch stats");
  return data;
};

export const fetchUsers = async (token: string, search: string, page: number, pageSize: number = 10) => {
  const res = await fetch(`${API_BASE_URL}/Users?search=${search}&page=${page}&pageSize=${pageSize}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || "Failed to fetch users");
  return data;
};

export const exportUsersExcel = async (token: string, search: string = ""): Promise<Blob> => {
  const res = await fetch(`${API_BASE_URL}/Users/export-excel?search=${search}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Failed to export users Excel");
  return res.blob();
};
