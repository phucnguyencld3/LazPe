export interface BlockedIp {
  id: string;
  ipAddress: string;
  reason: string;
  blockedAt: string;
  expiresAt: string | null;
  isActive: boolean;
  userId?: string | null;
  userEmail?: string | null;
  recentInvoices?: string[];
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5101/api";

export const getAllBlockedIps = async (token: string): Promise<BlockedIp[]> => {
  const res = await fetch(`${API_BASE_URL}/IpBlock`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await res.json();
  return data.success ? data.data : [];
};

export const blockIp = async (token: string, ipAddress: string, reason: string, durationDays: number = 30) => {
  const res = await fetch(`${API_BASE_URL}/IpBlock/block`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ ipAddress, reason, durationDays }),
  });
  return res.json();
};

export const unblockIp = async (token: string, ipAddress: string) => {
  const res = await fetch(`${API_BASE_URL}/IpBlock/unblock`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ ipAddress }),
  });
  return res.json();
};
