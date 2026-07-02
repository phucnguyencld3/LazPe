const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5101/api";

export interface SecurityAuditLog {
  id: string;
  ipAddress: string;
  userId?: string;
  actionType: string;
  description: string;
  requestCount: number;
  createdAt: string;
}

export interface SecurityAuditLogResponse {
  success: boolean;
  data: SecurityAuditLog[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export const getSecurityAuditLogs = async (
  token: string,
  page: number = 1,
  pageSize: number = 50
): Promise<SecurityAuditLogResponse> => {
  const res = await fetch(`${API_URL}/SecurityAuditLog?page=${page}&pageSize=${pageSize}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch security audit logs");
  }

  return await res.json();
};
