"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import { Loader } from "lucide-react";
import { Pagination } from "@/components/admin/shared/Pagination";
import { formatCurrency, formatPrivilegeDetailLines } from "@/lib/utils/formatters";

import Badge from "@/components/admin/ui/Badge";
import Button from "@/components/admin/ui/Button";
import { Card, StatsCard } from "@/components/admin/ui/Card";
import Input from "@/components/admin/ui/Input";
import Modal from "@/components/admin/ui/Modal";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/admin/ui/Table";
import TextArea from "@/components/admin/ui/TextArea";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5101/api";

interface TopCustomer {
  userID: string;
  fullName: string;
  email: string;
  avatar?: string;
  tierName: string;
  availablePoints: number;
  totalPoints: number;
}

interface TierDistribution {
  tierID: number;
  tierName: string;
  colorHex: string;
  count: number;
}

interface DashboardStats {
  totalPointsIssued: number;
  totalPointsSpent: number;
  totalPointsRemaining: number;
  membersPerTier: TierDistribution[];
  upgradeRate: number;
  voucherUsageRate: number;
  revenueFromLoyalty: number;
  topCustomers: TopCustomer[];
}

interface EarnPolicy {
  policyID: number;
  name: string;
  vndAmount: number;
  pointsEarned: number;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  isCampaign: boolean;
  multiplier: number;
  createdBy: string;
  createdAt: string;
}

interface RedeemPolicy {
  policyID: number;
  name: string;
  pointsToRedeem: number;
  discountVnd: number;
  tierID?: number;
  tier?: { tierName: string };
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
}

interface LoyaltyTier {
  tierID: number;
  tierName: string;
  minPoints: number;
  colorHex: string;
  badgeIcon: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Privilege {
  privilegeID: number;
  tierID: number;
  name: string;
  privilegeType: string; // VOUCHER, FREESHIP, DISCOUNT, CASHBACK, SUPPORT, BIRTHDAY_GIFT
  value?: string;
  isActive: boolean;
}

interface MonthlyVoucherConfig {
  voucherConfigID: number;
  tierID: number;
  tier?: { tierName: string };
  voucherCount: number;
  discountType: number; // 1: %, 2: cash
  discountValue: number;
  minOrderValue: number;
  maxDiscount: number;
  validityDays: number;
  isActive: boolean;
}

interface TransactionHistory {
  historyID: number;
  userID: string;
  fullName: string;
  email: string;
  tierName: string;
  transactionType: string;
  amount: number;
  invoiceID?: number;
  description: string;
  createdAt: string;
}

interface AuditLog {
  logID: number;
  action: string;
  actorEmail: string;
  entityName: string;
  entityID: string;
  oldValue?: string;
  newValue?: string;
  notes?: string;
  timestamp: string;
}

const cleanIconName = (iconStr: string): string => {
  const raw = iconStr || "workspace_premium";
  if (raw.includes("-")) {
    const parts = raw.split("-");
    const last = parts[parts.length - 1].trim();
    if (/^[a-zA-Z0-9_]+$/.test(last)) {
      return last;
    }
  }
  return raw;
};

const getAuditActionLabel = (action: string): string => {
  const labels: Record<string, string> = {
    CREATE_TIER: "Tạo hạng thành viên",
    UPDATE_TIER: "Cập nhật hạng thành viên",
    DELETE_TIER: "Xóa hạng thành viên",
    TOGGLE_TIER: "Bật/tắt hạng thành viên",
    CREATE_EARN_POLICY: "Tạo cơ chế tích điểm",
    UPDATE_EARN_POLICY: "Cập nhật cơ chế tích điểm",
    DELETE_EARN_POLICY: "Xóa cơ chế tích điểm",
    TOGGLE_EARN_POLICY: "Bật/tắt cơ chế tích điểm",
    CREATE_REDEEM_POLICY: "Tạo đổi điểm riêng",
    UPDATE_REDEEM_POLICY: "Cập nhật đổi điểm riêng",
    DELETE_REDEEM_POLICY: "Xóa đổi điểm riêng",
    TOGGLE_REDEEM_POLICY: "Bật/tắt đổi điểm riêng",
    CREATE_PRIVILEGE: "Tạo đặc quyền",
    UPDATE_PRIVILEGE: "Cập nhật đặc quyền",
    DELETE_PRIVILEGE: "Xóa đặc quyền",
    CREATE_VOUCHER_CONFIG: "Tạo cấu hình voucher tháng",
    UPDATE_VOUCHER_CONFIG: "Cập nhật cấu hình voucher tháng",
    DELETE_VOUCHER_CONFIG: "Xóa cấu hình voucher tháng",
  };

  return labels[action] || `Hành động: ${action}`;
};

export default function AdminLoyaltyPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"dashboard" | "policies" | "tiers" | "history" | "settings">("dashboard");
  const [subTab, setSubTab] = useState<"privileges" | "redeem" | "vouchers">("privileges");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // States for Settings Tab
  const [loyaltySettings, setLoyaltySettings] = useState<any>({
    enableReviewReward: true,
    reviewRewardPoints: 200,
    minimumReviewWords: 50,
    requiredRatingForReward: 5,
    allowMultipleRewardsPerProduct: false,
    reviewWithImageRewardPoints: 300,
    reviewWithVideoRewardPoints: 500,
    minimumReviewChars: 100,
    allowEditReviewTimeLimitMinutes: 30,
    maxReviewDaysAfterReceipt: 30,
    requireDeliveryToReview: true
  });
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // States for Policies Tab
  const [earnPolicies, setEarnPolicies] = useState<EarnPolicy[]>([]);
  const [redeemPolicies, setRedeemPolicies] = useState<RedeemPolicy[]>([]);
  const [loadingPolicies, setLoadingPolicies] = useState(false);
  const [showEarnModal, setShowEarnModal] = useState(false);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [editingEarnPolicy, setEditingEarnPolicy] = useState<EarnPolicy | null>(null);
  const [editingRedeemPolicy, setEditingRedeemPolicy] = useState<RedeemPolicy | null>(null);

  // States for Tiers Tab
  const [tiers, setTiers] = useState<LoyaltyTier[]>([]);
  const [loadingTiers, setLoadingTiers] = useState(false);
  const [selectedTierForPrivileges, setSelectedTierForPrivileges] = useState<number | null>(null);
  const [privileges, setPrivileges] = useState<Privilege[]>([]);
  const [showTierModal, setShowTierModal] = useState(false);
  const [editingTier, setEditingTier] = useState<LoyaltyTier | null>(null);
  const [showPrivilegeModal, setShowPrivilegeModal] = useState(false);
  const [editingPrivilege, setEditingPrivilege] = useState<Privilege | null>(null);

  // States for Vouchers (được quản lý bên trong Tiers tab)
  const [monthlyConfigs, setMonthlyConfigs] = useState<MonthlyVoucherConfig[]>([]);
  const [loadingConfigs, setLoadingConfigs] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState<MonthlyVoucherConfig | null>(null);
  const [triggeringJob, setTriggeringJob] = useState(false);

  // History Tab sub-tab & Birthday logs state
  const [historySubTab, setHistorySubTab] = useState<"points" | "birthday" | "audit">("points");
  const [birthdayLogs, setBirthdayLogs] = useState<any[]>([]);
  const [loadingBirthdayLogs, setLoadingBirthdayLogs] = useState(false);
  const [birthdayPage, setBirthdayPage] = useState(1);
  const [birthdayTotalPages, setBirthdayTotalPages] = useState(1);
  const [birthdayTotalItems, setBirthdayTotalItems] = useState(0);
  const [birthdaySearch, setBirthdaySearch] = useState("");
  const [triggeringBirthdayJob, setTriggeringBirthdayJob] = useState(false);
  const [showManualBirthdayModal, setShowManualBirthdayModal] = useState(false);
  const [manualBirthdayUserID, setManualBirthdayUserID] = useState("");
  const [manualBirthdayUserSearchTerm, setManualBirthdayUserSearchTerm] = useState("");
  const [submittingManualBirthday, setSubmittingManualBirthday] = useState(false);

  // States for Privilege Modal dynamic inputs
  const [privilegeType, setPrivilegeType] = useState("VOUCHER");
  const [voucherCode, setVoucherCode] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [maxSupport, setMaxSupport] = useState(30000);
  const [minOrderValue, setMinOrderValue] = useState(200000);
  const [discountType, setDiscountType] = useState("PERCENT");
  const [discountValue, setDiscountValue] = useState(10);
  const [maxDiscount, setMaxDiscount] = useState(100000);
  const [cashbackRate, setCashbackRate] = useState(5);
  const [maxCashback, setMaxCashback] = useState(50000);
  const [voucherMode, setVoucherMode] = useState<"EXISTING" | "CUSTOM">("EXISTING");
  const [validityDays, setValidityDays] = useState(30);

  // Birthday gift sub-states
  const [birthdayGiftType, setBirthdayGiftType] = useState("VOUCHER");
  const [birthdayVoucherCode, setBirthdayVoucherCode] = useState("");
  const [birthdayQuantity, setBirthdayQuantity] = useState(1);
  const [birthdayPoints, setBirthdayPoints] = useState(500);
  const [birthdayCoins, setBirthdayCoins] = useState(50000);
  const [birthdayGiftName, setBirthdayGiftName] = useState("");
  const [birthdayGiftDesc, setBirthdayGiftDesc] = useState("");

  const [vouchers, setVouchers] = useState<any[]>([]);

  // States for History Tab
  const [history, setHistory] = useState<TransactionHistory[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyTotalItems, setHistoryTotalItems] = useState(0);
  const [expandedHistoryId, setExpandedHistoryId] = useState<number | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    title?: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
  } | null>(null);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotalPages, setAuditTotalPages] = useState(1);
  const [auditTotalItems, setAuditTotalItems] = useState(0);

  // Filters for History
  const [filterSearch, setFilterSearch] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [filterTier, setFilterTier] = useState<string>("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  const openConfirmDialog = (message: string, onConfirm: () => void, options?: {
    title?: string;
    confirmLabel?: string;
    cancelLabel?: string;
  }) => {
    setConfirmDialog({ message, onConfirm, ...options });
  };

  const closeConfirmDialog = () => {
    setConfirmDialog(null);
  };

  const handleConfirmDialog = () => {
    const action = confirmDialog?.onConfirm;
    setConfirmDialog(null);
    action?.();
  };

  // Manual Revocation Form State
  const [revocationUserID, setRevocationUserID] = useState("");
  const [revocationAmount, setRevocationAmount] = useState(0);
  const [revocationReason, setRevocationReason] = useState("");
  const [submittingRevocation, setSubmittingRevocation] = useState(false);
  const [showRevocationModal, setShowRevocationModal] = useState(false);
  const [revocationType, setRevocationType] = useState<"POINTS" | "VOUCHER">("POINTS");
  const [userEarnTransactions, setUserEarnTransactions] = useState<any[]>([]);
  const [userUnusedVouchers, setUserUnusedVouchers] = useState<any[]>([]);
  const [selectedEarnTransactionId, setSelectedEarnTransactionId] = useState<string>("");
  const [selectedUserVoucherId, setSelectedUserVoucherId] = useState<string>("");
  const [loadingUserDetails, setLoadingUserDetails] = useState(false);

  // User search suggestion state
  const [userSuggestions, setUserSuggestions] = useState<any[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState("");

  const getHeaders = () => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  // 1. Fetch Stats
  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await fetch(`${API_BASE_URL}/AdminLoyalty/dashboard`, { headers: getHeaders() });
      if (res.ok) {
        const result = await res.json();
        if (result.success) setStats(result.data);
      }
    } catch (e) {
      console.error(e);
      toast.error("Không thể tải số liệu thống kê.");
    } finally {
      setLoadingStats(false);
    }
  };

  // 2. Fetch Policies
  const fetchPolicies = async () => {
    setLoadingPolicies(true);
    try {
      const resEarn = await fetch(`${API_BASE_URL}/AdminLoyalty/earn-policies`, { headers: getHeaders() });
      const resRedeem = await fetch(`${API_BASE_URL}/AdminLoyalty/redeem-policies`, { headers: getHeaders() });

      if (resEarn.ok) {
        const r = await resEarn.json();
        if (r.success) setEarnPolicies(r.data);
      }
      if (resRedeem.ok) {
        const r = await resRedeem.json();
        if (r.success) setRedeemPolicies(r.data);
      }
    } catch (e) {
      console.error(e);
      toast.error("Lỗi khi tải chính sách tích & đổi.");
    } finally {
      setLoadingPolicies(false);
    }
  };

  const fetchTiers = async () => {
    setLoadingTiers(true);
    try {
      const res = await fetch(`${API_BASE_URL}/AdminLoyalty/tiers`, { headers: getHeaders() });
      if (res.ok) {
        const r = await res.json();
        if (r.success) {
          setTiers(r.data);
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Lỗi khi tải danh sách hạng.");
    } finally {
      setLoadingTiers(false);
    }
  };

  const fetchPrivileges = async (tierId: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/AdminLoyalty/privileges/tier/${tierId}`, { headers: getHeaders() });
      if (res.ok) {
        const r = await res.json();
        if (r.success) setPrivileges(r.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 4. Fetch Monthly Configurations
  const fetchConfigs = async () => {
    setLoadingConfigs(true);
    try {
      const res = await fetch(`${API_BASE_URL}/AdminLoyalty/monthly-vouchers`, { headers: getHeaders() });
      if (res.ok) {
        const r = await res.json();
        if (r.success) setMonthlyConfigs(r.data);
      }
    } catch (e) {
      console.error(e);
      toast.error("Lỗi khi tải cấu hình voucher tháng.");
    } finally {
      setLoadingConfigs(false);
    }
  };

  // 5. Fetch History
  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const params = new URLSearchParams({
        page: historyPage.toString(),
        pageSize: "15",
        search: filterSearch,
        transactionType: filterType,
      });
      if (filterTier) params.append("tierId", filterTier);
      if (filterStartDate) params.append("startDate", filterStartDate);
      if (filterEndDate) params.append("endDate", filterEndDate);

      const res = await fetch(`${API_BASE_URL}/AdminLoyalty/history?${params.toString()}`, { headers: getHeaders() });
      if (res.ok) {
        const r = await res.json();
        if (r.success) {
          setHistory(r.data);
          setHistoryTotalPages(r.pagination.totalPages);
          setHistoryTotalItems(r.pagination.totalItems);
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Lỗi tải lịch sử giao dịch.");
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchAuditLogs = async () => {
    setLoadingAudit(true);
    try {
      const params = new URLSearchParams({
        page: auditPage.toString(),
        pageSize: "15",
      });
      const res = await fetch(`${API_BASE_URL}/AdminLoyalty/audit-logs?${params.toString()}`, { headers: getHeaders() });
      if (res.ok) {
        const r = await res.json();
        if (r.success) {
          setAuditLogs(r.data);
          setAuditTotalPages(r.pagination.totalPages);
          setAuditTotalItems(r.pagination.totalItems);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAudit(false);
    }
  };

  // Search user utility
  const handleUserSearch = async (kw: string) => {
    setUserSearchTerm(kw);
    if (kw.trim().length < 3) {
      setUserSuggestions([]);
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/vouchers/search-users?keyword=${encodeURIComponent(kw)}`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setUserSuggestions(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchVouchersList = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/vouchers`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setVouchers(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchBirthdayLogs = async () => {
    setLoadingBirthdayLogs(true);
    try {
      const params = new URLSearchParams({
        page: birthdayPage.toString(),
        pageSize: "15",
        search: birthdaySearch,
      });
      const res = await fetch(`${API_BASE_URL}/AdminLoyalty/birthday-gift-logs?${params.toString()}`, { headers: getHeaders() });
      if (res.ok) {
        const r = await res.json();
        if (r.success) {
          setBirthdayLogs(r.data);
          setBirthdayTotalPages(r.pagination.totalPages);
          setBirthdayTotalItems(r.pagination.totalItems);
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Lỗi tải lịch sử quà sinh nhật.");
    } finally {
      setLoadingBirthdayLogs(false);
    }
  };

  const handleTriggerBirthdayJob = async () => {
    if (triggeringBirthdayJob) return;
    setTriggeringBirthdayJob(true);
    try {
      const res = await fetch(`${API_BASE_URL}/AdminLoyalty/trigger-birthday-gift-job`, {
        method: "POST",
        headers: getHeaders(),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || "Chạy Job phát quà sinh nhật thành công!");
        fetchBirthdayLogs();
      } else {
        toast.error(data.message || "Kích hoạt job sinh nhật thất bại.");
      }
    } catch (e) {
      toast.error("Lỗi kết nối khi gửi yêu cầu.");
    } finally {
      setTriggeringBirthdayJob(false);
    }
  };

  const handleManualBirthdayIssue = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!manualBirthdayUserID) {
      toast.error("Vui lòng chọn thành viên nhận quà.");
      return;
    }
    setSubmittingManualBirthday(true);
    try {
      const res = await fetch(`${API_BASE_URL}/AdminLoyalty/issue-birthday-gift-manual`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ userID: manualBirthdayUserID }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Cấp phát quà sinh nhật thành công!");
        setShowManualBirthdayModal(false);
        setManualBirthdayUserID("");
        setManualBirthdayUserSearchTerm("");
        fetchBirthdayLogs();
      } else {
        toast.error(data.message || "Cấp phát quà sinh nhật thất bại.");
      }
    } catch (e) {
      toast.error("Lỗi kết nối khi gửi yêu cầu.");
    } finally {
      setSubmittingManualBirthday(false);
    }
  };

  const fetchSettings = async () => {
    setLoadingSettings(true);
    try {
      const res = await fetch(`${API_BASE_URL}/Loyalty/settings`, { headers: getHeaders() });
      if (res.ok) {
        const result = await res.json();
        if (result.success) setLoyaltySettings(result.data);
      }
    } catch (e) {
      console.error(e);
      toast.error("Không thể tải cấu hình Loyalty.");
    } finally {
      setLoadingSettings(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetch(`${API_BASE_URL}/Loyalty/settings`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(loyaltySettings),
      });
      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          toast.success("Cập nhật cấu hình thành công!");
          setLoyaltySettings(result.data);
        } else {
          toast.error(result.message || "Cập nhật thất bại.");
        }
      } else {
        toast.error("Cập nhật cấu hình thất bại.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Lỗi khi kết nối đến máy chủ.");
    } finally {
      setSavingSettings(false);
    }
  };

  useEffect(() => {
    if (activeTab === "dashboard") fetchStats();
    if (activeTab === "policies") fetchPolicies();
    if (activeTab === "settings") fetchSettings();
    if (activeTab === "tiers") {
      fetchTiers();
      fetchConfigs();
      fetchPolicies();
      fetchVouchersList();
    }
    if (activeTab === "history") {
      if (historySubTab === "points") {
        fetchHistory();
      } else if (historySubTab === "birthday") {
        fetchBirthdayLogs();
      } else if (historySubTab === "audit") {
        fetchAuditLogs();
      }
      fetchTiers();
    }
  }, [activeTab, historySubTab]);

  useEffect(() => {
    if (selectedTierForPrivileges) {
      fetchPrivileges(selectedTierForPrivileges);
    }
  }, [selectedTierForPrivileges]);

  useEffect(() => {
    if (activeTab === "history" && historySubTab === "points") {
      fetchHistory();
    }
  }, [historyPage, filterType, filterTier, filterSearch]);

  useEffect(() => {
    if (activeTab === "history" && historySubTab === "audit") {
      fetchAuditLogs();
    }
  }, [auditPage]);

  useEffect(() => {
    if (activeTab === "history" && historySubTab === "birthday") {
      fetchBirthdayLogs();
    }
  }, [birthdayPage, birthdaySearch]);

  useEffect(() => {
    if (editingPrivilege) {
      setPrivilegeType(editingPrivilege.privilegeType);
      if (editingPrivilege.value) {
        try {
          const val = JSON.parse(editingPrivilege.value);
          if (editingPrivilege.privilegeType === "VOUCHER") {
            setVoucherCode(val.voucherCode || "");
            setQuantity(val.quantity || 1);
            setVoucherMode(val.mode || "EXISTING");
            setValidityDays(val.validityDays || 30);
            if (val.mode === "CUSTOM") {
              setDiscountType(val.discountType || "PERCENT");
              setDiscountValue(val.discountValue || 0);
              setMaxDiscount(val.maxDiscount || 0);
              setMinOrderValue(val.minOrderValue || 0);
            }
          } else if (editingPrivilege.privilegeType === "FREESHIP") {
            setQuantity(val.quantity || 1);
            setMaxSupport(val.maxSupport || 0);
            setMinOrderValue(val.minOrderValue || 0);
          } else if (editingPrivilege.privilegeType === "DISCOUNT") {
            setDiscountType(val.discountType || "PERCENT");
            setDiscountValue(val.discountValue || 0);
            setMaxDiscount(val.maxDiscount || 0);
          } else if (editingPrivilege.privilegeType === "CASHBACK") {
            setCashbackRate(val.cashbackRate || 0);
            setMaxCashback(val.maxCashback || 0);
          } else if (editingPrivilege.privilegeType === "BIRTHDAY_GIFT") {
            setBirthdayGiftType(val.giftType || "VOUCHER");
            if (val.giftType === "VOUCHER") {
              setBirthdayVoucherCode(val.voucherCode || "");
              setBirthdayQuantity(val.quantity || 1);
            } else if (val.giftType === "POINTS") {
              setBirthdayPoints(val.points || 0);
            } else if (val.giftType === "COINS") {
              setBirthdayCoins(val.coins || 0);
            } else if (val.giftType === "PHYSICAL") {
              setBirthdayGiftName(val.giftName || "");
              setBirthdayGiftDesc(val.giftDesc || "");
            }
          }
        } catch (e) {
          console.error("Lỗi parse cấu hình đặc quyền:", e);
        }
      }
    } else {
      setPrivilegeType("VOUCHER");
      setVoucherCode("");
      setQuantity(1);
      setVoucherMode("EXISTING");
      setValidityDays(30);
      setMaxSupport(30000);
      setMinOrderValue(200000);
      setDiscountType("PERCENT");
      setDiscountValue(10);
      setMaxDiscount(100000);
      setCashbackRate(5);
      setMaxCashback(50000);
      setBirthdayGiftType("VOUCHER");
      setBirthdayVoucherCode("");
      setBirthdayQuantity(1);
      setBirthdayPoints(500);
      setBirthdayCoins(50000);
      setBirthdayGiftName("");
      setBirthdayGiftDesc("");
    }
  }, [editingPrivilege, showPrivilegeModal]);

  // Actions for Earn Policies
  const handleSaveEarn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const body = {
      name: data.get("name") as string,
      vndAmount: parseFloat(data.get("vndAmount") as string),
      pointsEarned: parseInt(data.get("pointsEarned") as string),
      startDate: data.get("startDate") ? new Date(data.get("startDate") as string).toISOString() : null,
      endDate: data.get("endDate") ? new Date(data.get("endDate") as string).toISOString() : null,
      isActive: data.get("isActive") === "true",
      isCampaign: data.get("isCampaign") === "true",
      multiplier: parseFloat(data.get("multiplier") as string || "1.0"),
    };

    try {
      const url = editingEarnPolicy
        ? `${API_BASE_URL}/AdminLoyalty/earn-policies/${editingEarnPolicy.policyID}`
        : `${API_BASE_URL}/AdminLoyalty/earn-policies`;
      const method = editingEarnPolicy ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success(editingEarnPolicy ? "Cập nhật chính sách thành công." : "Tạo chính sách tích điểm thành công.");
        setShowEarnModal(false);
        setEditingEarnPolicy(null);
        fetchPolicies();
      } else {
        const err = await res.json();
        toast.error(err.message || "Lỗi lưu chính sách.");
      }
    } catch (e) {
      toast.error("Lỗi lưu chính sách.");
    }
  };

  const handleToggleEarn = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/AdminLoyalty/earn-policies/${id}/toggle`, {
        method: "PUT",
        headers: getHeaders(),
      });
      if (res.ok) {
        toast.success("Đã cập nhật trạng thái chính sách.");
        fetchPolicies();
      }
    } catch (e) {
      toast.error("Cập nhật trạng thái thất bại.");
    }
  };

  const handleDeleteEarn = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/AdminLoyalty/earn-policies/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      if (res.ok) {
        toast.success("Đã xóa chính sách tích điểm.");
        fetchPolicies();
      }
    } catch (e) {
      toast.error("Xóa thất bại.");
    }
  };

  // Actions for Redeem Policies
  const handleSaveRedeem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const tierIdRaw = data.get("tierID") as string;
    const body = {
      name: data.get("name") as string,
      pointsToRedeem: parseInt(data.get("pointsToRedeem") as string),
      discountVnd: parseFloat(data.get("discountVnd") as string),
      tierID: tierIdRaw ? parseInt(tierIdRaw) : null,
      startDate: data.get("startDate") ? new Date(data.get("startDate") as string).toISOString() : null,
      endDate: data.get("endDate") ? new Date(data.get("endDate") as string).toISOString() : null,
      isActive: data.get("isActive") === "true",
    };

    try {
      const url = editingRedeemPolicy
        ? `${API_BASE_URL}/AdminLoyalty/redeem-policies/${editingRedeemPolicy.policyID}`
        : `${API_BASE_URL}/AdminLoyalty/redeem-policies`;
      const method = editingRedeemPolicy ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success(editingRedeemPolicy ? "Cập nhật chính sách thành công." : "Tạo chính sách đổi điểm thành công.");
        setShowRedeemModal(false);
        setEditingRedeemPolicy(null);
        fetchPolicies();
      } else {
        const err = await res.json();
        toast.error(err.message || "Lỗi lưu chính sách.");
      }
    } catch (e) {
      toast.error("Lỗi lưu chính sách.");
    }
  };

  const handleToggleRedeem = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/AdminLoyalty/redeem-policies/${id}/toggle`, {
        method: "PUT",
        headers: getHeaders(),
      });
      if (res.ok) {
        toast.success("Đã cập nhật trạng thái chính sách.");
        fetchPolicies();
      }
    } catch (e) {
      toast.error("Cập nhật trạng thái thất bại.");
    }
  };

  const handleDeleteRedeem = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/AdminLoyalty/redeem-policies/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      if (res.ok) {
        toast.success("Đã xóa chính sách quy đổi.");
        fetchPolicies();
      }
    } catch (e) {
      toast.error("Xóa thất bại.");
    }
  };

  // Actions for Tiers
  const handleSaveTier = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const body = {
      tierName: data.get("tierName") as string,
      minPoints: parseInt(data.get("minPoints") as string),
      colorHex: data.get("colorHex") as string,
      badgeIcon: data.get("badgeIcon") as string,
      isActive: data.get("isActive") === "true",
    };

    try {
      const url = editingTier
        ? `${API_BASE_URL}/AdminLoyalty/tiers/${editingTier.tierID}`
        : `${API_BASE_URL}/AdminLoyalty/tiers`;
      const method = editingTier ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success(editingTier ? "Cập nhật hạng thành công." : "Tạo hạng thành viên thành công.");
        setShowTierModal(false);
        setEditingTier(null);
        fetchTiers();
      }
    } catch (e) {
      toast.error("Lỗi khi lưu hạng thành viên.");
    }
  };

  const handleToggleTier = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/AdminLoyalty/tiers/${id}/toggle`, {
        method: "PUT",
        headers: getHeaders(),
      });
      if (res.ok) {
        toast.success("Đã thay đổi trạng thái hạng.");
        fetchTiers();
      }
    } catch (e) {
      toast.error("Cập nhật thất bại.");
    }
  };

  // Privileges management
  const handleSavePrivilege = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedTierForPrivileges) return;
    const data = new FormData(e.currentTarget);

    if (privilegeType === "VOUCHER" && !voucherCode) {
      toast.error(voucherMode === "EXISTING" ? "Vui lòng chọn Voucher." : "Vui lòng nhập tiền tố mã Voucher.");
      return;
    }
    if (privilegeType === "BIRTHDAY_GIFT" && birthdayGiftType === "VOUCHER" && !birthdayVoucherCode) {
      toast.error("Vui lòng chọn Voucher quà sinh nhật.");
      return;
    }

    let configObj: any = {};
    if (privilegeType === "VOUCHER") {
      configObj = {
        mode: voucherMode,
        voucherCode,
        quantity: parseInt(quantity.toString()),
        validityDays: parseInt(validityDays.toString())
      };
      if (voucherMode === "CUSTOM") {
        configObj.discountType = discountType;
        configObj.discountValue = parseFloat(discountValue.toString());
        configObj.maxDiscount = discountType === "PERCENT" ? parseFloat(maxDiscount.toString()) : 0;
        configObj.minOrderValue = parseFloat(minOrderValue.toString());
      }
    } else if (privilegeType === "FREESHIP") {
      configObj = {
        quantity: parseInt(quantity.toString()),
        maxSupport: parseFloat(maxSupport.toString()),
        minOrderValue: parseFloat(minOrderValue.toString())
      };
    } else if (privilegeType === "DISCOUNT") {
      configObj = {
        discountType,
        discountValue: parseFloat(discountValue.toString()),
        maxDiscount: discountType === "PERCENT" ? parseFloat(maxDiscount.toString()) : 0
      };
    } else if (privilegeType === "CASHBACK") {
      configObj = {
        cashbackRate: parseFloat(cashbackRate.toString()),
        maxCashback: parseFloat(maxCashback.toString())
      };
    } else if (privilegeType === "SUPPORT") {
      configObj = {};
    } else if (privilegeType === "BIRTHDAY_GIFT") {
      configObj.giftType = birthdayGiftType;
      if (birthdayGiftType === "VOUCHER") {
        configObj.voucherCode = birthdayVoucherCode;
        configObj.quantity = parseInt(birthdayQuantity.toString());
      } else if (birthdayGiftType === "POINTS") {
        configObj.points = parseInt(birthdayPoints.toString());
      } else if (birthdayGiftType === "COINS") {
        configObj.coins = parseInt(birthdayCoins.toString());
      } else if (birthdayGiftType === "PHYSICAL") {
        configObj.giftName = birthdayGiftName;
        configObj.giftDesc = birthdayGiftDesc;
      }
    }

    const body = {
      tierID: selectedTierForPrivileges,
      name: data.get("name") as string,
      privilegeType,
      value: JSON.stringify(configObj),
      isActive: data.get("isActive") === "true",
    };

    try {
      const url = editingPrivilege
        ? `${API_BASE_URL}/AdminLoyalty/privileges/${editingPrivilege.privilegeID}`
        : `${API_BASE_URL}/AdminLoyalty/privileges`;
      const method = editingPrivilege ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success(editingPrivilege ? "Cập nhật đặc quyền thành công." : "Thêm đặc quyền thành công.");
        setShowPrivilegeModal(false);
        setEditingPrivilege(null);
        fetchPrivileges(selectedTierForPrivileges);
      } else {
        const err = await res.json();
        toast.error(err.message || "Lỗi lưu đặc quyền.");
      }
    } catch (e) {
      toast.error("Lỗi lưu đặc quyền.");
    }
  };

  const handleDeletePrivilege = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/AdminLoyalty/privileges/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      if (res.ok && selectedTierForPrivileges) {
        toast.success("Đã xóa đặc quyền.");
        fetchPrivileges(selectedTierForPrivileges);
      }
    } catch (e) {
      toast.error("Xóa đặc quyền thất bại.");
    }
  };

  // Monthly Voucher Config Actions
  const handleSaveVoucherConfig = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const body = {
      voucherConfigID: editingConfig?.voucherConfigID || 0,
      tierID: parseInt(data.get("tierID") as string),
      voucherCount: parseInt(data.get("voucherCount") as string),
      discountType: parseInt(data.get("discountType") as string),
      discountValue: parseFloat(data.get("discountValue") as string),
      minOrderValue: parseFloat(data.get("minOrderValue") as string),
      maxDiscount: parseFloat(data.get("maxDiscount") as string || "0"),
      validityDays: parseInt(data.get("validityDays") as string),
      isActive: data.get("isActive") === "true",
    };

    // 1. Kiểm tra giới hạn voucher theo đặc quyền VOUCHER của hạng hiện tại
    const voucherPrivilege = privileges.find(
      p => p.privilegeType === "VOUCHER" && p.isActive
    );

    let maxAllowed = 0;
    if (voucherPrivilege && voucherPrivilege.value) {
      maxAllowed = parseInt(voucherPrivilege.value) || 0;
    }

    if (maxAllowed <= 0) {
      toast.error("Hạng thành viên này chưa được cấu hình đặc quyền nhận voucher hàng tháng, hoặc giới hạn voucher bằng 0. Vui lòng thêm đặc quyền VOUCHER cho hạng này trước.");
      return;
    }

    // 2. Tính tổng số lượng voucher đã cấu hình của hạng này (trừ cấu hình hiện tại đang sửa)
    const currentTotal = monthlyConfigs
      .filter(c => c.tierID === body.tierID && c.voucherConfigID !== body.voucherConfigID && c.isActive)
      .reduce((sum, c) => sum + c.voucherCount, 0);

    if (currentTotal + body.voucherCount > maxAllowed) {
      toast.error(`Tổng số lượng voucher cấu hình phát hàng tháng (${currentTotal + body.voucherCount}) vượt quá giới hạn đặc quyền của hạng này (Tối đa: ${maxAllowed}).`);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/AdminLoyalty/monthly-vouchers`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success("Lưu cấu hình voucher tự động thành công.");
        setShowConfigModal(false);
        setEditingConfig(null);
        fetchConfigs();
      } else {
        const err = await res.json();
        toast.error(err.message || "Lỗi khi lưu cấu hình.");
      }
    } catch (e) {
      toast.error("Lỗi lưu cấu hình.");
    }
  };

  const handleDeleteConfig = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/AdminLoyalty/monthly-vouchers/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      if (res.ok) {
        toast.success("Đã xóa cấu hình voucher thành công.");
        fetchConfigs();
      } else {
        toast.error("Xóa cấu hình thất bại.");
      }
    } catch (e) {
      toast.error("Lỗi kết nối khi xóa cấu hình.");
    }
  };

  const handleTriggerVoucherJob = async () => {
    if (triggeringJob) return;
    setTriggeringJob(true);
    try {
      const res = await fetch(`${API_BASE_URL}/AdminLoyalty/trigger-monthly-voucher-job`, {
        method: "POST",
        headers: getHeaders(),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || "Đã kích hoạt phát voucher hàng tháng thành công!");
        fetchConfigs(); // Refresh configs
        fetchHistory(); // Refresh history listing
      } else {
        toast.error(data.message || "Kích hoạt job thất bại.");
      }
    } catch (e) {
      toast.error("Lỗi kết nối khi gửi yêu cầu.");
    } finally {
      setTriggeringJob(false);
    }
  };

  // Points & Voucher Reclamation Action
  const selectUserForRevocation = async (userId: string, fullName: string, email: string) => {
    setRevocationUserID(userId);
    setUserSearchTerm(`${fullName} (${email})`);
    setUserSuggestions([]);

    // Clear previous selection
    setSelectedEarnTransactionId("");
    setSelectedUserVoucherId("");
    setRevocationAmount(0);
    setUserEarnTransactions([]);
    setUserUnusedVouchers([]);

    setLoadingUserDetails(true);
    try {
      // Fetch transactions
      const resTrans = await fetch(`${API_BASE_URL}/AdminLoyalty/users/${userId}/earn-transactions`, { headers: getHeaders() });
      if (resTrans.ok) {
        const data = await resTrans.json();
        if (data.success) setUserEarnTransactions(data.data);
      }

      // Fetch unused vouchers
      const resVouchers = await fetch(`${API_BASE_URL}/AdminLoyalty/users/${userId}/unused-vouchers`, { headers: getHeaders() });
      if (resVouchers.ok) {
        const data = await resVouchers.json();
        if (data.success) setUserUnusedVouchers(data.data);
      }
    } catch (e) {
      console.error("Lỗi khi tải chi tiết người dùng:", e);
      toast.error("Không thể tải lịch sử giao dịch và voucher của thành viên này.");
    } finally {
      setLoadingUserDetails(false);
    }
  };

  const handleManualRevocation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!revocationUserID) {
      toast.error("Vui lòng chọn thành viên.");
      return;
    }

    if (revocationType === "POINTS") {
      if (revocationAmount <= 0) {
        toast.error("Số điểm thu hồi phải lớn hơn 0.");
        return;
      }
      if (!revocationReason.trim()) {
        toast.error("Vui lòng cung cấp lý do thu hồi.");
        return;
      }

      setSubmittingRevocation(true);
      try {
        // Tìm xem giao dịch được chọn có InvoiceID không
        const selectedTrans = userEarnTransactions.find(t => t.historyID.toString() === selectedEarnTransactionId);
        const invoiceID = selectedTrans?.invoiceID || null;

        const res = await fetch(`${API_BASE_URL}/AdminLoyalty/revoke-points`, {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({
            userID: revocationUserID,
            amount: revocationAmount,
            reason: revocationReason,
            invoiceID: invoiceID,
          }),
        });

        const result = await res.json();
        if (res.ok && result.success) {
          toast.success(invoiceID ? `Thu hồi điểm theo đơn hàng #${invoiceID} thành công.` : "Thu hồi điểm thành công.");
          setRevocationUserID("");
          setUserSearchTerm("");
          setRevocationAmount(0);
          setRevocationReason("");
          setSelectedEarnTransactionId("");
          setShowRevocationModal(false);
          fetchHistory();
          fetchAuditLogs();
        } else {
          toast.error(result.message || "Thu hồi điểm thất bại.");
        }
      } catch (e) {
        toast.error("Lỗi kết nối khi gửi yêu cầu.");
      } finally {
        setSubmittingRevocation(false);
      }
    } else {
      // VOUCHER revocation
      if (!selectedUserVoucherId) {
        toast.error("Vui lòng chọn Voucher muốn thu hồi.");
        return;
      }
      if (!revocationReason.trim()) {
        toast.error("Vui lòng cung cấp lý do thu hồi.");
        return;
      }

      setSubmittingRevocation(true);
      try {
        const res = await fetch(`${API_BASE_URL}/vouchers/direct-assignments/${selectedUserVoucherId}`, {
          method: "DELETE",
          headers: getHeaders(),
        });

        const result = await res.json();
        if (res.ok) {
          toast.success("Thu hồi Voucher thành công.");
          setRevocationUserID("");
          setUserSearchTerm("");
          setRevocationAmount(0);
          setRevocationReason("");
          setSelectedUserVoucherId("");
          setShowRevocationModal(false);
          fetchHistory();
          fetchAuditLogs();
        } else {
          toast.error(result.message || "Thu hồi Voucher thất bại.");
        }
      } catch (e) {
        toast.error("Lỗi kết nối khi gửi yêu cầu.");
      } finally {
        setSubmittingRevocation(false);
      }
    }
  };

  return (
    <main className="w-full pb-20">
      {/* Title Header Section */}
      <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 font-outfit">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Chương trình Loyalty Program</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Thiết lập cơ chế tích điểm, đổi điểm, xếp hạng và đặc quyền thành viên</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Button
            onClick={() => {
              fetchTiers();
              setShowRevocationModal(true);
            }}
            variant="danger"
            className="flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">remove_circle</span> Thu hồi Đặc quyền / Điểm
          </Button>
        </div>
      </header>

      {/* Tabs Menu */}
      <div className="flex border-b border-gray-200 dark:border-white/10 mb-6 overflow-x-auto gap-2 scrollbar-none font-outfit">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`px-4 py-2.5 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === "dashboard"
              ? "border-brand-500 text-brand-500"
              : "border-transparent text-gray-500 hover:text-brand-500"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">dashboard</span>
          Tổng quan
        </button>
        <button
          onClick={() => setActiveTab("policies")}
          className={`px-4 py-2.5 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === "policies"
              ? "border-brand-500 text-brand-500"
              : "border-transparent text-gray-500 hover:text-brand-500"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">settings_suggest</span>
          Cơ chế Tích/Đổi
        </button>
        <button
          onClick={() => setActiveTab("tiers")}
          className={`px-4 py-2.5 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === "tiers"
              ? "border-brand-500 text-brand-500"
              : "border-transparent text-gray-500 hover:text-brand-500"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">military_tech</span>
          Hạng & Đặc quyền
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2.5 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === "history"
              ? "border-brand-500 text-brand-500"
              : "border-transparent text-gray-500 hover:text-brand-500"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">history</span>
          Lịch sử & Logs
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`px-4 py-2.5 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === "settings"
              ? "border-brand-500 text-brand-500"
              : "border-transparent text-gray-500 hover:text-brand-500"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">settings</span>
          Cấu hình
        </button>
      </div>

      {/* -------------------- TAB 1: DASHBOARD -------------------- */}
      {activeTab === "dashboard" && (
        <section className="space-y-6 font-outfit">
          {loadingStats ? (
            <div className="h-64 flex items-center justify-center bg-white dark:bg-white/[0.03] rounded-[2rem] border border-gray-100 dark:border-white/[0.05] shadow-theme-xs">
              <Loader className="animate-spin text-brand-500" size={32} />
            </div>
          ) : stats ? (
            <>
              {/* Bento Grid Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatsCard
                  title="Tổng điểm phát hành"
                  value={`${stats.totalPointsIssued.toLocaleString()}đ`}
                  icon={<span className="material-symbols-outlined text-[22px]">military_tech</span>}
                  iconBgColor="bg-brand-50 text-brand-500 dark:bg-brand-500/10"
                />

                <StatsCard
                  title="Điểm đã sử dụng"
                  value={`${stats.totalPointsSpent.toLocaleString()}đ`}
                  icon={<span className="material-symbols-outlined text-[22px]">shopping_cart</span>}
                  iconBgColor="bg-secondary-50 text-secondary-600 dark:bg-secondary-500/10"
                />

                <StatsCard
                  title="Điểm tồn trong ví"
                  value={`${stats.totalPointsRemaining.toLocaleString()}đ`}
                  icon={<span className="material-symbols-outlined text-[22px]">account_balance_wallet</span>}
                  iconBgColor="bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10"
                />
              </div>

              {/* Stats bento row 2 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatsCard
                  title="Tỷ lệ thăng hạng"
                  value={`${stats.upgradeRate}%`}
                  icon={<span className="material-symbols-outlined text-[22px]">trending_up</span>}
                  iconBgColor="bg-blue-50 text-blue-500 dark:bg-blue-500/10"
                />

                <StatsCard
                  title="Tỷ lệ sử dụng voucher"
                  value={`${stats.voucherUsageRate}%`}
                  icon={<span className="material-symbols-outlined text-[22px]">local_activity</span>}
                  iconBgColor="bg-warning-50 text-warning-600 dark:bg-warning-500/10"
                />

                <StatsCard
                  title="Doanh thu Loyalty"
                  value={formatCurrency(stats.revenueFromLoyalty)}
                  icon={<span className="material-symbols-outlined text-[22px]">monetization_on</span>}
                  iconBgColor="bg-success-50 text-success-600 dark:bg-success-500/10"
                />
              </div>

              {/* Members distributions & Leaderboard */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card title="Phân bố thành viên" className="flex flex-col">
                  <div className="space-y-4 py-2">
                    {stats.membersPerTier.map((item) => (
                      <div key={item.tierID} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.colorHex }} />
                          <span className="text-sm font-semibold text-gray-700 dark:text-white/80">{item.tierName}</span>
                        </div>
                        <span className="text-sm font-bold text-gray-800 dark:text-white">{(item.count ?? 0).toLocaleString()} khách</span>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card title="Bảng xếp hạng tích điểm cao nhất" className="lg:col-span-2 !p-0 overflow-hidden flex flex-col">
                  <div className="overflow-x-auto">
                    <Table className="!rounded-none border-0 shadow-none bg-transparent">
                      <TableHeader>
                        <TableRow>
                          <TableCell isHeader>Hạng</TableCell>
                          <TableCell isHeader>Khách hàng</TableCell>
                          <TableCell isHeader className="text-right">Điểm khả dụng</TableCell>
                          <TableCell isHeader className="text-right">Tổng tích lũy</TableCell>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stats.topCustomers.map((c) => (
                          <TableRow key={c.userID}>
                            <TableCell>
                              <span
                                className="px-2.5 py-1 rounded-xl text-[10px] font-bold text-white shadow-sm"
                                style={{ backgroundColor: stats.membersPerTier.find(m => m.tierName === c.tierName)?.colorHex || "#64748b" }}
                              >
                                {c.tierName}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center font-bold text-gray-600 dark:text-gray-300 text-xs shrink-0 overflow-hidden border border-gray-200 dark:border-white/5">
                                  {c.avatar ? <img src={c.avatar} className="w-full h-full object-cover" /> : c.fullName.charAt(0)}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-gray-800 dark:text-white/90">{c.fullName}</p>
                                  <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold">{c.email}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-bold text-sm text-brand-500">{c.availablePoints.toLocaleString()}</TableCell>
                            <TableCell className="text-right font-bold text-sm text-gray-850 dark:text-white/80">{c.totalPoints.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </Card>
              </div>
            </>
          ) : (
            <div className="h-64 flex items-center justify-center bg-white dark:bg-white/[0.03] rounded-[2rem] border border-gray-100 dark:border-white/[0.05] text-gray-400 dark:text-gray-500 text-sm font-bold">
              Không tìm thấy dữ liệu thống kê.
            </div>
          )}
        </section>
      )}

      {/* -------------------- TAB 2: POLICIES (Config Forms & Tables) -------------------- */}
      {activeTab === "policies" && (
        <section className="space-y-6 font-outfit">
          {loadingPolicies ? (
            <div className="h-64 flex items-center justify-center bg-white dark:bg-white/[0.03] rounded-[2rem] border border-gray-100 dark:border-white/[0.05] shadow-theme-xs">
              <Loader className="animate-spin text-brand-500" size={32} />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Accumulation Policies */}
              <Card
                title="Cơ chế tích điểm"
                className="flex flex-col"
                headerAction={
                  <Button
                    onClick={() => {
                      setEditingEarnPolicy(null);
                      setShowEarnModal(true);
                    }}
                    className="flex items-center gap-1.5"
                    size="sm"
                  >
                    <span className="material-symbols-outlined text-[16px]">add_circle</span>
                    Thêm quy tắc
                  </Button>
                }
              >
                <p className="-mt-3 mb-4 text-xs text-gray-500 dark:text-gray-400">Cấu hình giá trị chuyển đổi từ VNĐ mua hàng sang điểm</p>
                <div className="space-y-4">
                  {earnPolicies.map((p) => (
                    <div key={p.policyID} className="p-4 border border-gray-200 dark:border-white/10 rounded-[1.5rem] flex items-center justify-between hover:border-brand-500/50 dark:hover:border-brand-500/30 transition-all relative bg-gray-50/50 dark:bg-white/[0.01]">
                      {p.isCampaign && (
                        <span className="absolute top-0 right-16 bg-error-500 text-white text-[8px] font-bold px-2 py-0.5 rounded-b-md uppercase tracking-wider">Campaign</span>
                      )}
                      <div>
                        <h4 className="text-sm font-bold text-gray-800 dark:text-white">{p.name}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Quy đổi: <strong className="text-brand-500">{p.vndAmount.toLocaleString()}₫</strong> = <strong className="text-brand-500">{p.pointsEarned} điểm</strong>
                          {p.isCampaign && ` (Hệ số: x${p.multiplier})`}
                        </p>
                        {(p.startDate || p.endDate) && (
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 font-semibold">
                            Áp dụng: {p.startDate ? new Date(p.startDate).toLocaleDateString("vi-VN") : "Ngay bây giờ"} - {p.endDate ? new Date(p.endDate).toLocaleDateString("vi-VN") : "Hạn dài"}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => p.isCampaign && handleToggleEarn(p.policyID)}
                          disabled={!p.isCampaign}
                          className={`w-9 h-5 rounded-full transition-colors flex items-center p-0.5 ${!p.isCampaign ? "bg-brand-500 opacity-60 cursor-not-allowed" : "cursor-pointer bg-gray-200 dark:bg-white/10"} ${(!p.isCampaign || p.isActive) ? "bg-brand-500 dark:bg-brand-500" : ""}`}
                          title={!p.isCampaign ? "Không thể tắt chính sách mặc định" : ""}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow ${(!p.isCampaign || p.isActive) ? "translate-x-4" : ""}`} />
                        </button>
                        <button
                          onClick={() => {
                            setEditingEarnPolicy(p);
                            setShowEarnModal(true);
                          }}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5 cursor-pointer transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        {p.isCampaign && (
                          <button
                            onClick={() => openConfirmDialog(
                              "Bạn có chắc chắn muốn xóa chính sách này?",
                              () => handleDeleteEarn(p.policyID)
                            )}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10 cursor-pointer transition-colors"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Redemption Policies */}
              <Card
                title="Cơ chế đổi điểm"
                className="flex flex-col"
                headerAction={
                  <Button
                    onClick={() => {
                      setEditingRedeemPolicy(null);
                      setShowRedeemModal(true);
                    }}
                    className="flex items-center gap-1.5"
                    size="sm"
                  >
                    <span className="material-symbols-outlined text-[16px]">add_circle</span>
                    Thêm quy tắc
                  </Button>
                }
              >
                <p className="-mt-3 mb-4 text-xs text-gray-500 dark:text-gray-400">Quy định đổi điểm thành tiền giảm giá (hệ thống hoặc theo hạng)</p>
                <div className="space-y-4">
                  {redeemPolicies.map((p) => {
                    const isDefaultRedeem = p.tierID === null || p.tierID === 0 || p.name.includes("mặc định") || p.name.toLowerCase().includes("default");
                    return (
                      <div key={p.policyID} className="p-4 border border-gray-200 dark:border-white/10 rounded-[1.5rem] flex items-center justify-between hover:border-brand-500/50 dark:hover:border-brand-500/30 transition-all relative bg-gray-50/50 dark:bg-white/[0.01]">
                        {p.tierID && p.tier && (
                          <span className="absolute top-0 right-16 bg-indigo-500 text-white text-[8px] font-bold px-2 py-0.5 rounded-b-md uppercase tracking-wider">Hạng: {p.tier.tierName}</span>
                        )}
                        <div>
                          <h4 className="text-sm font-bold text-gray-800 dark:text-white">{p.name}</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Quy đổi: <strong className="text-brand-500">{p.pointsToRedeem.toLocaleString()} điểm</strong> = <strong className="text-brand-500">-{p.discountVnd.toLocaleString()}₫</strong>
                          </p>
                          {(p.startDate || p.endDate) && (
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 font-semibold">
                              Hiệu lực: {p.startDate ? new Date(p.startDate).toLocaleDateString("vi-VN") : "Ngay bây giờ"} - {p.endDate ? new Date(p.endDate).toLocaleDateString("vi-VN") : "Hạn dài"}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => !isDefaultRedeem && handleToggleRedeem(p.policyID)}
                            disabled={isDefaultRedeem}
                            className={`w-9 h-5 rounded-full transition-colors flex items-center p-0.5 ${isDefaultRedeem ? "bg-brand-500 opacity-60 cursor-not-allowed" : "cursor-pointer bg-gray-200 dark:bg-white/10"} ${(isDefaultRedeem || p.isActive) ? "bg-brand-500 dark:bg-brand-500" : ""}`}
                            title={isDefaultRedeem ? "Không thể tắt chính sách mặc định" : ""}
                          >
                            <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow ${(isDefaultRedeem || p.isActive) ? "translate-x-4" : ""}`} />
                          </button>
                          <button
                            onClick={() => {
                              setEditingRedeemPolicy(p);
                              setShowRedeemModal(true);
                            }}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5 cursor-pointer transition-colors"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          {!isDefaultRedeem && (
                            <button
                              onClick={() => openConfirmDialog(
                                "Bạn có chắc chắn muốn xóa chính sách này?",
                                () => handleDeleteRedeem(p.policyID)
                              )}
                              className="w-8 h-8 rounded-full flex items-center justify-center text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10 cursor-pointer transition-colors"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          )}
        </section>
      )}

      {/* -------------------- TAB 3: TIERS & PRIVILEGES (Card Layout) -------------------- */}
      {activeTab === "tiers" && (
        <section className="space-y-6 font-outfit">
          {loadingTiers ? (
            <div className="h-64 flex items-center justify-center bg-white dark:bg-white/[0.03] rounded-[2rem] border border-gray-100 dark:border-white/[0.05] shadow-theme-xs">
              <Loader className="animate-spin text-brand-500" size={32} />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Tiers list */}
              <div className="lg:col-span-1 space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-sm font-bold text-gray-800 dark:text-white/95 uppercase tracking-wider">Hạng thành viên</h3>
                  <Button
                    onClick={() => {
                      setEditingTier(null);
                      setShowTierModal(true);
                    }}
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">add_circle</span>
                    Thêm mới
                  </Button>
                </div>

                <div className="flex flex-col gap-3">
                  {tiers.map((t) => (
                    <div
                      key={t.tierID}
                      onClick={() => setSelectedTierForPrivileges(t.tierID)}
                      className={`px-4 py-4 rounded-[1.5rem] border cursor-pointer transition-all flex items-center gap-3 relative overflow-hidden group shadow-theme-xs hover:shadow-theme-sm ${
                        selectedTierForPrivileges === t.tierID
                          ? "border-brand-500 bg-brand-50/10 dark:bg-brand-500/5"
                          : "border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.02] hover:border-gray-300 dark:hover:border-white/20"
                      }`}
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-2.5" style={{ backgroundColor: t.colorHex }} />
                      <div className="pl-2 flex items-center gap-3 w-full min-w-0">
                        <span className="material-symbols-outlined text-[22px] shrink-0" style={{ color: t.colorHex }}>
                          {cleanIconName(t.badgeIcon)}
                        </span>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-gray-800 dark:text-white truncate">{t.tierName}</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold">
                            Tối thiểu: <span className="font-bold text-brand-500">{t.minPoints.toLocaleString()}đ</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detail Tier Panel */}
              <Card className="lg:col-span-2 !p-0 overflow-hidden flex flex-col animate-in fade-in duration-300">
                {(() => {
                  const activeTier = tiers.find(t => t.tierID === selectedTierForPrivileges);
                  return (
                    <>
                      <div className="p-6 border-b border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.01] flex items-center justify-between">
                        <div>
                          <h3 className="text-base font-bold text-gray-800 dark:text-white">Chi tiết Hạng thành viên</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-semibold">
                            Đang chọn: <span className="text-brand-500 font-bold">{activeTier?.tierName || "Chưa chọn"}</span>
                          </p>
                        </div>
                        {activeTier && (
                          <div className="flex items-center gap-3 shrink-0">
                            <button
                              onClick={() => handleToggleTier(activeTier.tierID)}
                              className={`w-9 h-5 rounded-full transition-colors flex items-center p-0.5 cursor-pointer bg-gray-200 dark:bg-white/10 ${activeTier.isActive ? "bg-brand-500 dark:bg-brand-500" : ""}`}
                              title={activeTier.isActive ? "Đang hoạt động" : "Tạm khóa"}
                            >
                              <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow ${activeTier.isActive ? "translate-x-4" : ""}`} />
                            </button>
                            <button
                              onClick={() => {
                                  setEditingTier(activeTier);
                                  setShowTierModal(true);
                              }}
                              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5 cursor-pointer border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 transition-colors"
                              title="Chỉnh sửa thông tin hạng"
                            >
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {selectedTierForPrivileges ? (
                        <>
                          {/* Sub-tabs Navigation */}
                          <div className="flex border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-1 gap-1">
                            <button
                              onClick={() => setSubTab("privileges")}
                              className={`flex-1 py-2 text-center rounded-xl font-bold text-xs transition-all cursor-pointer ${
                                subTab === "privileges"
                                  ? "bg-brand-500 text-white shadow-sm"
                                  : "text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-700 dark:hover:text-white"
                              }`}
                            >
                              Đặc quyền
                            </button>
                            <button
                              onClick={() => setSubTab("redeem")}
                              className={`flex-1 py-2 text-center rounded-xl font-bold text-xs transition-all cursor-pointer ${
                                subTab === "redeem"
                                  ? "bg-brand-500 text-white shadow-sm"
                                  : "text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-700 dark:hover:text-white"
                              }`}
                            >
                              Đổi điểm riêng
                            </button>
                          </div>

                          {/* Sub-tab Content Area */}
                          <div className="p-6 overflow-y-auto max-h-[350px]">
                            {/* Sub-tab 1: Privileges */}
                            {subTab === "privileges" && (
                              <div className="space-y-4">
                                <div className="flex justify-between items-center mb-2">
                                  <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Đặc quyền của hạng</h4>
                                  <Button
                                    onClick={() => {
                                      setEditingPrivilege(null);
                                      setShowPrivilegeModal(true);
                                    }}
                                    variant="secondary"
                                    size="sm"
                                  >
                                    + Thêm đặc quyền
                                  </Button>
                                </div>

                                <div className="space-y-3">
                                  {privileges.length === 0 ? (
                                    <div className="text-center py-10 text-gray-400 dark:text-gray-500 font-bold text-sm">
                                      Chưa có đặc quyền nào được thiết lập.
                                    </div>
                                  ) : (
                                    privileges.map((p) => (
                                      <div key={p.privilegeID} className="p-4 border border-gray-200 dark:border-white/10 rounded-[1.5rem] flex items-center justify-between bg-gray-50/50 dark:bg-white/[0.01] hover:border-brand-500/30 transition-all">
                                        <div className="min-w-0 pr-4">
                                          <h5 className="text-sm font-bold text-gray-800 dark:text-white">{p.name}</h5>
                                          <div className="flex gap-1.5 mt-1.5 items-center">
                                            <Badge color="primary" variant="light" size="sm">
                                              {p.privilegeType}
                                            </Badge>
                                          </div>
                                          {p.value && (
                                            <ul className="text-xs text-gray-500 dark:text-gray-400 font-semibold mt-2 space-y-1 pl-4 list-disc">
                                              {formatPrivilegeDetailLines(p.privilegeType, p.value).map((line, idx) => (
                                                <li key={idx}>{line}</li>
                                              ))}
                                            </ul>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                          <button
                                            onClick={() => {
                                              setEditingPrivilege(p);
                                              setShowPrivilegeModal(true);
                                            }}
                                            className="w-7 h-7 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5 cursor-pointer transition-colors"
                                          >
                                            <span className="material-symbols-outlined text-[16px]">edit</span>
                                          </button>
                                          <button
                                            onClick={() => openConfirmDialog(
                                              "Bạn có chắc chắn muốn xóa đặc quyền này?",
                                              () => handleDeletePrivilege(p.privilegeID)
                                            )}
                                            className="w-7 h-7 rounded-full flex items-center justify-center text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10 cursor-pointer transition-colors"
                                          >
                                            <span className="material-symbols-outlined text-[16px]">delete</span>
                                          </button>
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Sub-tab 2: Redeem Policies (Đổi điểm riêng) */}
                            {subTab === "redeem" && (
                              <div className="space-y-4">
                                <div className="flex justify-between items-center mb-2">
                                  <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Cơ chế đổi điểm riêng</h4>
                                  <Button
                                    onClick={() => {
                                      setEditingRedeemPolicy(null);
                                      setShowRedeemModal(true);
                                    }}
                                    variant="secondary"
                                    size="sm"
                                  >
                                    + Thêm quy tắc riêng
                                  </Button>
                                </div>

                                <div className="space-y-3">
                                  {redeemPolicies.filter(p => p.tierID === selectedTierForPrivileges).length === 0 ? (
                                    <div className="text-center py-10 text-gray-400 dark:text-gray-500 font-bold text-sm">
                                      Chưa có cơ chế đổi điểm riêng. Sẽ áp dụng cơ chế đổi điểm mặc định.
                                    </div>
                                  ) : (
                                    redeemPolicies
                                      .filter(p => p.tierID === selectedTierForPrivileges)
                                      .map((p) => (
                                        <div key={p.policyID} className="p-4 border border-gray-200 dark:border-white/10 rounded-[1.5rem] flex items-center justify-between bg-gray-50/50 dark:bg-white/[0.01] hover:border-brand-500/30 transition-all">
                                          <div>
                                            <h5 className="text-sm font-bold text-gray-800 dark:text-white">{p.name}</h5>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                              Quy đổi: <strong className="text-brand-500">{p.pointsToRedeem.toLocaleString()} điểm</strong> = <strong className="text-brand-500">-{p.discountVnd.toLocaleString()}₫</strong>
                                            </p>
                                          </div>
                                          <div className="flex items-center gap-2 shrink-0">
                                            <button
                                              onClick={() => handleToggleRedeem(p.policyID)}
                                              className={`w-9 h-5 rounded-full transition-colors flex items-center p-0.5 cursor-pointer bg-gray-200 dark:bg-white/10 ${p.isActive ? "bg-brand-500 dark:bg-brand-500" : ""}`}
                                            >
                                              <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow ${p.isActive ? "translate-x-4" : ""}`} />
                                            </button>
                                            <button
                                              onClick={() => {
                                                setEditingRedeemPolicy(p);
                                                setShowRedeemModal(true);
                                              }}
                                              className="w-7 h-7 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5 cursor-pointer transition-colors"
                                            >
                                              <span className="material-symbols-outlined text-[16px]">edit</span>
                                            </button>
                                            <button
                                              onClick={() => openConfirmDialog(
                                                "Bạn có chắc chắn muốn xóa chính sách này?",
                                                () => handleDeleteRedeem(p.policyID)
                                              )}
                                              className="w-7 h-7 rounded-full flex items-center justify-center text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10 cursor-pointer transition-colors"
                                            >
                                              <span className="material-symbols-outlined text-[16px]">delete</span>
                                            </button>
                                          </div>
                                        </div>
                                      ))
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-20 text-gray-400 dark:text-gray-500 font-bold text-sm flex-1 flex items-center justify-center">
                          Vui lòng chọn một hạng thành viên ở bên trái để quản lý chi tiết.
                        </div>
                      )}
                    </>
                  );
                })()}
              </Card>
            </div>
          )}
        </section>
      )}

      {/* -------------------- TAB 5: HISTORY & LOGS (Paginated Table) -------------------- */}
      {activeTab === "history" && (
        <section className="space-y-6 font-outfit">
          {/* Sub-tabs Navigation inside History tab */}
          <div className="flex border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-1 gap-1 max-w-2xl rounded-xl">
            <button
              onClick={() => setHistorySubTab("points")}
              className={`flex-1 py-2 text-center rounded-lg font-bold text-xs transition-all cursor-pointer ${
                historySubTab === "points"
                  ? "bg-brand-500 text-white shadow-sm"
                  : "text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-700 dark:hover:text-white"
              }`}
            >
              Tích & Đổi điểm
            </button>
            <button
              onClick={() => setHistorySubTab("birthday")}
              className={`flex-1 py-2 text-center rounded-lg font-bold text-xs transition-all cursor-pointer ${
                historySubTab === "birthday"
                  ? "bg-brand-500 text-white shadow-sm"
                  : "text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-700 dark:hover:text-white"
              }`}
            >
              Quà sinh nhật
            </button>
            <button
              onClick={() => setHistorySubTab("audit")}
              className={`flex-1 py-2 text-center rounded-lg font-bold text-xs transition-all cursor-pointer ${
                historySubTab === "audit"
                  ? "bg-brand-500 text-white shadow-sm"
                  : "text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-700 dark:hover:text-white"
              }`}
            >
              Thay đổi hệ thống
            </button>
          </div>

          {/* Sub-tab 1: Points Transaction Log */}
          {historySubTab === "points" && (
            <Card title="Lịch sử tích/đổi điểm của khách hàng" className="!p-0 overflow-hidden flex flex-col">
              {/* Filters */}
              <div className="p-4 border-b border-gray-200 dark:border-white/10 flex flex-wrap items-center gap-4 bg-gray-50/50 dark:bg-white/[0.01]">
                <div className="relative min-w-[200px] flex-1">
                  <Input
                    placeholder="Tìm khách hàng..."
                    value={filterSearch}
                    onChange={(e) => setFilterSearch(e.target.value)}
                    className="w-full"
                  />
                </div>

                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="h-11 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent text-sm text-gray-800 dark:text-white/90 px-4 py-2.5 focus:border-brand-500 focus:ring-3 focus:ring-brand-500/10 outline-none cursor-pointer"
                >
                  <option value="ALL">Tất cả giao dịch</option>
                  <option value="EARN">Tích điểm (EARN)</option>
                  <option value="SPEND">Đổi điểm (SPEND)</option>
                  <option value="REFUND">Hoàn điểm (REFUND)</option>
                  <option value="REVOKE">Thu hồi (REVOKE)</option>
                  <option value="BONUS">Thăng hạng (BONUS)</option>
                  <option value="RESET">Reset cuối kỳ (RESET)</option>
                </select>

                <select
                  value={filterTier}
                  onChange={(e) => setFilterTier(e.target.value)}
                  className="h-11 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent text-sm text-gray-800 dark:text-white/90 px-4 py-2.5 focus:border-brand-500 focus:ring-3 focus:ring-brand-500/10 outline-none cursor-pointer"
                >
                  <option value="">Hạng hiện tại</option>
                  {tiers.map(t => (
                    <option key={t.tierID} value={t.tierID}>{t.tierName}</option>
                  ))}
                </select>
              </div>

              <div className="overflow-x-auto flex-1">
                <Table className="!rounded-none border-0 shadow-none bg-transparent">
                  <TableHeader>
                    <TableRow>
                      <TableCell isHeader>Khách hàng</TableCell>
                      <TableCell isHeader>Hạng</TableCell>
                      <TableCell isHeader className="text-right">Biến động</TableCell>
                      <TableCell isHeader className="text-center">Loại</TableCell>
                      <TableCell isHeader>Mô tả & Thời gian</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingHistory ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-20">
                          <Loader className="animate-spin text-brand-500 mx-auto" size={24} />
                        </TableCell>
                      </TableRow>
                    ) : history.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-20 text-gray-400 dark:text-gray-500 font-bold text-sm">
                          Không tìm thấy lịch sử nào.
                        </TableCell>
                      </TableRow>
                    ) : (
                      history.map((h) => {
                        const isExpanded = expandedHistoryId === h.historyID;
                        const isEarn = h.transactionType === "EARN" || h.transactionType === "BONUS" || h.amount > 0;
                        const isRevoke = h.transactionType === "REVOKE";
                        
                        return (
                          <React.Fragment key={h.historyID}>
                            <TableRow>
                              <TableCell>
                                <p className="text-sm font-bold text-gray-800 dark:text-white">{h.fullName}</p>
                                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold">{h.email}</p>
                              </TableCell>
                              <TableCell className="text-sm text-gray-650 dark:text-white/70 font-semibold">
                                {h.tierName}
                              </TableCell>
                              <TableCell className={`text-right font-bold text-sm ${isEarn ? "text-success-600" : isRevoke ? "text-error-500" : "text-gray-650 dark:text-white/60"}`}>
                                {h.amount > 0 ? `+${h.amount.toLocaleString()}` : h.amount.toLocaleString()}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge 
                                  color={h.transactionType === "EARN" ? "success" : h.transactionType === "SPEND" ? "info" : h.transactionType === "REVOKE" ? "error" : "light"}
                                  variant="light"
                                  size="sm"
                                >
                                  {h.transactionType}
                                </Badge>
                              </TableCell>
                              <TableCell className="max-w-[220px]">
                                <p className="text-xs font-bold text-gray-800 dark:text-white truncate">{h.description}</p>
                                <div className="mt-1 flex items-center justify-between gap-2">
                                  <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold">{new Date(h.createdAt).toLocaleString("vi-VN")}</p>
                                  <button
                                    type="button"
                                    onClick={() => setExpandedHistoryId(isExpanded ? null : h.historyID)}
                                    className="text-[10px] font-bold text-brand-500 hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                                  >
                                    {isExpanded ? "Thu gọn" : "Chi tiết"}
                                    <span className="material-symbols-outlined text-[12px]">
                                      {isExpanded ? "expand_less" : "expand_more"}
                                    </span>
                                  </button>
                                </div>
                              </TableCell>
                            </TableRow>
                            {isExpanded && (
                              <TableRow className="bg-gray-50/50 dark:bg-white/[0.01]">
                                <TableCell colSpan={5} className="px-6 py-4">
                                  <div className="p-4 rounded-[1.5rem] border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 space-y-2">
                                    <div className="flex flex-wrap gap-4 text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">
                                      <span>Thời gian: {new Date(h.createdAt).toLocaleString("vi-VN")}</span>
                                      {h.invoiceID && <span>Hóa đơn: #{h.invoiceID}</span>}
                                      <span>Loại: {h.transactionType}</span>
                                    </div>
                                    <p className="text-xs font-bold text-gray-850 dark:text-white">Mô tả chi tiết</p>
                                    <p className="text-xs text-gray-650 dark:text-gray-400 leading-relaxed whitespace-pre-line break-words">{h.description}</p>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              <Pagination
                currentPage={historyPage}
                totalPages={historyTotalPages}
                totalItems={historyTotalItems}
                itemsPerPage={15}
                onPageChange={setHistoryPage}
              />
            </Card>
          )}

          {/* Sub-tab 2: Birthday Gift Logs */}
          {historySubTab === "birthday" && (
            <Card 
              title="Lịch sử nhận quà sinh nhật" 
              className="!p-0 overflow-hidden flex flex-col"
              headerAction={
                <div className="flex gap-2">
                  <Button
                    onClick={handleTriggerBirthdayJob}
                    disabled={triggeringBirthdayJob}
                    variant="outline"
                    className="flex items-center gap-1.5"
                    size="sm"
                  >
                    <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                    {triggeringBirthdayJob ? "Đang chạy Job..." : "Chạy Job sinh nhật hôm nay"}
                  </Button>
                  <Button
                    onClick={() => setShowManualBirthdayModal(true)}
                    className="flex items-center gap-1.5"
                    size="sm"
                  >
                    <span className="material-symbols-outlined text-[16px]">card_giftcard</span>
                    Phát quà thủ công
                  </Button>
                </div>
              }
            >
              <p className="-mt-3 mb-4 px-6 text-xs text-gray-500 dark:text-gray-400">Danh sách thành viên nhận quà và trạng thái cấp phát hàng năm</p>
              
              {/* Filters */}
              <div className="p-4 border-b border-gray-200 dark:border-white/10 flex flex-wrap items-center gap-4 bg-gray-50/50 dark:bg-white/[0.01]">
                <div className="relative min-w-[200px] flex-1">
                  <Input
                    placeholder="Tìm kiếm thành viên..."
                    value={birthdaySearch}
                    onChange={(e) => setBirthdaySearch(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="overflow-x-auto flex-1">
                <Table className="!rounded-none border-0 shadow-none bg-transparent">
                  <TableHeader>
                    <TableRow>
                      <TableCell isHeader>Thành viên</TableCell>
                      <TableCell isHeader className="text-center">Năm nhận</TableCell>
                      <TableCell isHeader>Loại quà</TableCell>
                      <TableCell isHeader>Giá trị quà</TableCell>
                      <TableCell isHeader>Người phát</TableCell>
                      <TableCell isHeader>Thời gian nhận</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingBirthdayLogs ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-20">
                          <Loader className="animate-spin text-brand-500 mx-auto" size={24} />
                        </TableCell>
                      </TableRow>
                    ) : birthdayLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-20 text-gray-400 dark:text-gray-500 font-bold text-sm">
                          Không tìm thấy lịch sử quà sinh nhật nào.
                        </TableCell>
                      </TableRow>
                    ) : (
                      birthdayLogs.map((l) => (
                        <TableRow key={l.giftLogID}>
                          <TableCell>
                            <p className="text-sm font-bold text-gray-800 dark:text-white">{l.fullName}</p>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold">{l.email}</p>
                          </TableCell>
                          <TableCell className="text-center font-bold text-brand-500 text-sm">
                            {l.year}
                          </TableCell>
                          <TableCell>
                            <Badge color="info" variant="light" size="sm">
                              {l.giftType}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm font-semibold text-gray-800 dark:text-white/90">
                            {l.giftValue}
                          </TableCell>
                          <TableCell className="text-xs font-semibold text-gray-650 dark:text-white/70">
                            {l.issuedBy}
                          </TableCell>
                          <TableCell className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(l.receivedAt).toLocaleString("vi-VN")}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <Pagination
                currentPage={birthdayPage}
                totalPages={birthdayTotalPages}
                totalItems={birthdayTotalItems}
                itemsPerPage={15}
                onPageChange={setBirthdayPage}
              />
            </Card>
          )}

          {/* Sub-tab 3: System Audit Logs */}
          {historySubTab === "audit" && (
            <Card title="Logs thay đổi hệ thống" className="!p-0 overflow-hidden flex flex-col h-full">
              <div className="p-6 space-y-4 flex-1 min-h-0 overflow-y-auto max-h-[500px]">
                {loadingAudit ? (
                  <div className="py-20 text-center">
                    <Loader className="animate-spin text-brand-500 mx-auto" size={24} />
                  </div>
                ) : auditLogs.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 dark:text-gray-500 font-bold text-sm">
                    Chưa ghi nhận hoạt động thay đổi nào.
                  </div>
                ) : (
                  auditLogs.map((l) => (
                    <div key={l.logID} className="p-4 border border-gray-200 dark:border-white/10 rounded-[1.5rem] bg-gray-50/50 dark:bg-white/[0.01] flex flex-col gap-2 hover:border-brand-500/30 transition-colors">
                      <div className="flex justify-between items-center text-xs font-bold text-brand-500">
                        <span>{getAuditActionLabel(l.action)}</span>
                        <span className="text-gray-400 dark:text-gray-500 font-semibold text-[10px]">{new Date(l.timestamp).toLocaleDateString("vi-VN")}</span>
                      </div>
                      <p className="text-sm font-bold text-gray-800 dark:text-white/95">
                        {l.notes || `Đối tượng: ${l.entityName} #${l.entityID}`}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold">Thực hiện: {l.actorEmail}</p>
                    </div>
                  ))
                )}
              </div>

              <Pagination
                currentPage={auditPage}
                totalPages={auditTotalPages}
                totalItems={auditTotalItems}
                itemsPerPage={15}
                onPageChange={setAuditPage}
              />
            </Card>
          )}
        </section>
      )}

      {/* -------------------- TAB 6: SETTINGS (Loyalty Settings Configuration) -------------------- */}
      {activeTab === "settings" && (
        <section className="space-y-6 font-outfit max-w-3xl">
          {loadingSettings ? (
            <div className="p-8 flex flex-col items-center justify-center bg-white dark:bg-white/[0.03] rounded-[2rem] border border-gray-150 dark:border-white/[0.05] shadow-theme-xs">
              <Loader className="animate-spin text-brand-500 mb-2" size={24} />
              <span className="text-gray-400 dark:text-gray-500 font-bold text-xs">Đang tải cấu hình...</span>
            </div>
          ) : (
            <Card title="Cấu hình tích điểm đánh giá">
              <form onSubmit={handleSaveSettings} className="space-y-6">
                {/* Reward Point Enable Toggle */}
                <div className="flex items-center justify-between p-5 bg-gray-50/50 dark:bg-white/[0.01] rounded-2xl border border-gray-150 dark:border-white/5">
                  <div className="space-y-0.5 pr-4">
                    <span className="text-sm font-bold text-gray-800 dark:text-white block">Kích hoạt tặng điểm thưởng Loyalty</span>
                    <span className="text-[11px] text-gray-400 dark:text-gray-550 block">Tự động tặng điểm khi người dùng viết đánh giá chất lượng sản phẩm</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLoyaltySettings({ ...loyaltySettings, enableReviewReward: !loyaltySettings.enableReviewReward })}
                    className={`w-9 h-5 rounded-full transition-colors flex items-center p-0.5 cursor-pointer bg-gray-200 dark:bg-white/10 ${loyaltySettings.enableReviewReward ? "bg-brand-500 dark:bg-brand-500" : ""}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow ${loyaltySettings.enableReviewReward ? "translate-x-4" : ""}`} />
                  </button>
                </div>

                {loyaltySettings.enableReviewReward && (
                  <>
                    {/* Settings parameters */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Basic Review Points */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase block tracking-wider">Thưởng đánh giá cơ bản (chữ)</label>
                        <div className="relative">
                          <Input
                            type="number"
                            value={loyaltySettings.reviewRewardPoints}
                            onChange={(e) => setLoyaltySettings({ ...loyaltySettings, reviewRewardPoints: parseInt(e.target.value) || 0 })}
                            className="pr-12"
                          />
                          <span className="absolute inset-y-0 right-4 flex items-center text-[10px] font-bold text-gray-400 uppercase pointer-events-none">điểm</span>
                        </div>
                      </div>

                      {/* Review with Image Points */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase block tracking-wider">Thưởng có kèm HÌNH ẢNH</label>
                        <div className="relative">
                          <Input
                            type="number"
                            value={loyaltySettings.reviewWithImageRewardPoints}
                            onChange={(e) => setLoyaltySettings({ ...loyaltySettings, reviewWithImageRewardPoints: parseInt(e.target.value) || 0 })}
                            className="pr-12"
                          />
                          <span className="absolute inset-y-0 right-4 flex items-center text-[10px] font-bold text-gray-400 uppercase pointer-events-none">điểm</span>
                        </div>
                      </div>

                      {/* Review with Video Points */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase block tracking-wider">Thưởng có kèm VIDEO</label>
                        <div className="relative">
                          <Input
                            type="number"
                            value={loyaltySettings.reviewWithVideoRewardPoints}
                            onChange={(e) => setLoyaltySettings({ ...loyaltySettings, reviewWithVideoRewardPoints: parseInt(e.target.value) || 0 })}
                            className="pr-12"
                          />
                          <span className="absolute inset-y-0 right-4 flex items-center text-[10px] font-bold text-gray-400 uppercase pointer-events-none">điểm</span>
                        </div>
                      </div>

                      {/* Minimum Character count */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase block tracking-wider">Ký tự tối thiểu nhận quà</label>
                        <div className="relative">
                          <Input
                            type="number"
                            value={loyaltySettings.minimumReviewChars}
                            onChange={(e) => setLoyaltySettings({ ...loyaltySettings, minimumReviewChars: parseInt(e.target.value) || 0 })}
                            className="pr-12"
                          />
                          <span className="absolute inset-y-0 right-4 flex items-center text-[10px] font-bold text-gray-400 uppercase pointer-events-none">ký tự</span>
                        </div>
                      </div>

                      {/* Required Rating stars */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase block tracking-wider">Số sao tối thiểu nhận quà</label>
                        <select
                          value={loyaltySettings.requiredRatingForReward}
                          onChange={(e) => setLoyaltySettings({ ...loyaltySettings, requiredRatingForReward: parseInt(e.target.value) })}
                          className="h-11 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent text-sm text-gray-800 dark:text-white px-4 py-2.5 focus:border-brand-500 focus:ring-3 focus:ring-brand-500/10 outline-none cursor-pointer font-bold"
                        >
                          <option value="5">⭐ 5 Sao</option>
                          <option value="4">⭐ 4 Sao</option>
                          <option value="3">⭐ 3 Sao</option>
                          <option value="2">⭐ 2 Sao</option>
                          <option value="1">⭐ 1 Sao</option>
                        </select>
                      </div>

                      {/* Edit Time limit */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase block tracking-wider">Thời gian tối đa để chỉnh sửa</label>
                        <div className="relative">
                          <Input
                            type="number"
                            value={loyaltySettings.allowEditReviewTimeLimitMinutes}
                            onChange={(e) => setLoyaltySettings({ ...loyaltySettings, allowEditReviewTimeLimitMinutes: parseInt(e.target.value) || 0 })}
                            className="pr-12"
                          />
                          <span className="absolute inset-y-0 right-4 flex items-center text-[10px] font-bold text-gray-400 uppercase pointer-events-none">phút</span>
                        </div>
                      </div>

                      {/* Max Review days limit after order receipt */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase block tracking-wider">Số ngày tối đa đánh giá sau nhận</label>
                        <div className="relative">
                          <Input
                            type="number"
                            value={loyaltySettings.maxReviewDaysAfterReceipt}
                            onChange={(e) => setLoyaltySettings({ ...loyaltySettings, maxReviewDaysAfterReceipt: parseInt(e.target.value) || 0 })}
                            className="pr-12"
                          />
                          <span className="absolute inset-y-0 right-4 flex items-center text-[10px] font-bold text-gray-400 uppercase pointer-events-none">ngày</span>
                        </div>
                      </div>

                      {/* Require Delivery Verification */}
                      <div className="space-y-1 flex flex-col justify-end">
                        <label className="flex items-center gap-2 select-none cursor-pointer border border-gray-200 dark:border-white/10 p-3 rounded-xl bg-white dark:bg-white/[0.02] hover:bg-gray-50 dark:hover:bg-white/5 transition-colors h-11">
                          <input
                            type="checkbox"
                            checked={loyaltySettings.requireDeliveryToReview}
                            onChange={(e) => setLoyaltySettings({ ...loyaltySettings, requireDeliveryToReview: e.target.checked })}
                            className="rounded border-gray-300 dark:border-gray-700 text-brand-500 focus:ring-brand-500/10 cursor-pointer"
                          />
                          <span className="text-xs font-bold text-gray-650 dark:text-gray-350">Yêu cầu hoàn thành giao hàng mới được đánh giá</span>
                        </label>
                      </div>
                    </div>
                  </>
                )}

                {/* Save Button */}
                <Button
                  type="submit"
                  disabled={savingSettings}
                  isLoading={savingSettings}
                  className="w-full mt-6"
                >
                  Lưu cấu hình cài đặt
                </Button>
              </form>
            </Card>
          )}
        </section>
      )}

      {/* -------------------- MODAL: CONFIRM ACTION -------------------- */}
      <Modal isOpen={confirmDialog !== null} onClose={closeConfirmDialog} showCloseButton={true} className="!max-w-md">
        {confirmDialog && (
          <div className="font-outfit p-1 text-center flex flex-col items-center">
            <div className="w-14 h-14 bg-error-50 dark:bg-error-500/10 text-error-500 rounded-full flex items-center justify-center mb-4 border border-error-100 dark:border-error-500/20">
              <span className="material-symbols-outlined text-2xl">warning</span>
            </div>
            <h3 className="text-base font-bold text-gray-800 dark:text-white/90">{confirmDialog.title || "Xác nhận thao tác"}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 px-1 leading-relaxed">
              {confirmDialog.message}
            </p>

            <div className="flex items-center gap-3 w-full mt-6">
              <Button
                onClick={closeConfirmDialog}
                variant="secondary"
                className="flex-1"
              >
                {confirmDialog.cancelLabel || "Hủy bỏ"}
              </Button>
              <Button
                onClick={handleConfirmDialog}
                variant="danger"
                className="flex-1"
              >
                {confirmDialog.confirmLabel || "Xác nhận"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* -------------------- MODAL: MANUAL REVOCATION (Points & Voucher Revocation) -------------------- */}
      <Modal
        isOpen={showRevocationModal}
        onClose={() => {
          setShowRevocationModal(false);
          setRevocationUserID("");
          setUserSearchTerm("");
          setRevocationAmount(0);
          setRevocationReason("");
          setSelectedEarnTransactionId("");
          setSelectedUserVoucherId("");
        }}
        showCloseButton={true}
        className="!max-w-2xl font-outfit"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-error-50 dark:bg-error-500/10 text-error-500 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[20px]">remove_circle</span>
          </div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">Thu hồi Đặc quyền / Điểm</h3>
        </div>

        <form onSubmit={handleManualRevocation} className="space-y-4">
          {/* Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block">Loại hình thu hồi</label>
            <div className="flex gap-6 mt-1">
              <label className="flex items-center gap-2 text-sm text-gray-750 dark:text-white/80 cursor-pointer font-bold select-none">
                <input
                  type="radio"
                  name="revocationType"
                  value="POINTS"
                  checked={revocationType === "POINTS"}
                  onChange={() => {
                    setRevocationType("POINTS");
                    setRevocationAmount(0);
                    setRevocationReason("");
                    setSelectedEarnTransactionId("");
                    setSelectedUserVoucherId("");
                  }}
                  className="w-4 h-4 text-brand-500 focus:ring-brand-500/10 cursor-pointer accent-brand-500"
                />
                Thu hồi Đặc quyền / Điểm
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-750 dark:text-white/80 cursor-pointer font-bold select-none">
                <input
                  type="radio"
                  name="revocationType"
                  value="VOUCHER"
                  checked={revocationType === "VOUCHER"}
                  onChange={() => {
                    setRevocationType("VOUCHER");
                    setRevocationAmount(0);
                    setRevocationReason("");
                    setSelectedEarnTransactionId("");
                    setSelectedUserVoucherId("");
                  }}
                  className="w-4 h-4 text-brand-500 focus:ring-brand-500/10 cursor-pointer accent-brand-500"
                />
                Thu hồi Voucher đặc quyền
              </label>
            </div>
          </div>

          {/* User search */}
          <div className="space-y-1.5 relative">
            <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Tìm kiếm thành viên</label>
            <div className="relative">
              <Input
                placeholder="Nhập tên, email hoặc SĐT..."
                value={userSearchTerm}
                onChange={(e) => handleUserSearch(e.target.value)}
              />
            </div>

            {/* Suggestions list */}
            {userSuggestions.length > 0 && (
              <div className="absolute top-16 left-0 right-0 z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                {userSuggestions.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => selectUserForRevocation(u.id, u.fullName, u.email)}
                    className="p-3 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer flex flex-col gap-0.5 border-b border-gray-100 dark:border-white/5 last:border-0"
                  >
                    <p className="text-xs font-bold text-gray-800 dark:text-white">{u.fullName}</p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold">{u.email} {u.phoneNumber && `- ${u.phoneNumber}`}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {revocationUserID && (
            <div className="p-3 bg-gray-50 dark:bg-white/[0.01] border border-gray-200 dark:border-white/5 rounded-xl text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center justify-between">
              <span>ID thành viên: {revocationUserID}</span>
              {loadingUserDetails && (
                <span className="text-brand-500 animate-pulse text-[11px]">Đang tải dữ liệu...</span>
              )}
            </div>
          )}

          {/* Conditional Fields for POINTS */}
          {revocationUserID && !loadingUserDetails && revocationType === "POINTS" && (
            <div className="space-y-4 border-t border-gray-150 dark:border-white/5 pt-4 animate-in fade-in duration-200">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Chọn lượt tích điểm hoặc đơn hàng</label>
                <select
                  value={selectedEarnTransactionId}
                  onChange={(e) => {
                    const valId = e.target.value;
                    setSelectedEarnTransactionId(valId);
                    if (valId) {
                      const trans = userEarnTransactions.find(t => t.historyID.toString() === valId);
                      if (trans) {
                        setRevocationAmount(Math.abs(trans.amount));
                        setRevocationReason(`Thu hồi điểm từ: ${trans.description}`);
                      }
                    } else {
                      setRevocationAmount(0);
                      setRevocationReason("");
                    }
                  }}
                  className="h-11 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent text-sm text-gray-800 dark:text-white/95 px-4 py-2.5 focus:border-brand-500 focus:ring-3 focus:ring-brand-500/10 outline-none cursor-pointer"
                >
                  <option value="">-- Thu hồi tự do (Không theo lượt tích điểm) --</option>
                  {userEarnTransactions.map(t => (
                    <option key={t.historyID} value={t.historyID}>
                      {t.amount} điểm - {t.description} ({new Date(t.createdAt).toLocaleDateString("vi-VN")})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Số điểm cần thu hồi</label>
                <Input
                  type="number"
                  required
                  min={1}
                  value={revocationAmount}
                  onChange={(e) => setRevocationAmount(parseInt(e.target.value) || 0)}
                  className="!text-error-600 font-bold"
                />
              </div>
            </div>
          )}

          {/* Conditional Fields for VOUCHER */}
          {revocationUserID && !loadingUserDetails && revocationType === "VOUCHER" && (
            <div className="space-y-4 border-t border-gray-150 dark:border-white/5 pt-4 animate-in fade-in duration-200">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Chọn Voucher muốn thu hồi</label>
                {userUnusedVouchers.length === 0 ? (
                  <div className="p-3 bg-gray-50 dark:bg-white/[0.01] border border-gray-200 dark:border-white/10 rounded-xl text-xs font-semibold text-gray-400 dark:text-gray-500">
                    Thành viên này không sở hữu voucher đặc quyền nào chưa sử dụng.
                  </div>
                ) : (
                  <select
                    value={selectedUserVoucherId}
                    onChange={(e) => {
                      const valId = e.target.value;
                      setSelectedUserVoucherId(valId);
                      if (valId) {
                        const uv = userUnusedVouchers.find(v => v.userVoucherID.toString() === valId);
                        if (uv) {
                          setRevocationReason(`Thu hồi voucher ${uv.voucherCode} (${uv.voucherName}) phát qua đặc quyền`);
                        }
                      } else {
                        setRevocationReason("");
                      }
                    }}
                    required
                    className="h-11 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent text-sm text-gray-800 dark:text-white/95 px-4 py-2.5 focus:border-brand-500 focus:ring-3 focus:ring-brand-500/10 outline-none cursor-pointer font-semibold"
                  >
                    <option value="">-- Chọn voucher trong ví --</option>
                    {userUnusedVouchers.map(uv => (
                      <option key={uv.userVoucherID} value={uv.userVoucherID}>
                        {uv.voucherCode} - {uv.voucherName} (Thu thập: {new Date(uv.collectedAt).toLocaleDateString("vi-VN")})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          )}

          {/* Reason */}
          {revocationUserID && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Lý do thu hồi</label>
              <TextArea
                required
                rows={3}
                value={revocationReason}
                onChange={(e) => setRevocationReason(e.target.value)}
                placeholder={revocationType === "POINTS" ? "Mô tả lý do thu hồi điểm..." : "Mô tả lý do thu hồi voucher..."}
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-white/10">
            <Button
              type="button"
              onClick={() => {
                setShowRevocationModal(false);
                setRevocationUserID("");
                setUserSearchTerm("");
                setRevocationAmount(0);
                setRevocationReason("");
                setSelectedEarnTransactionId("");
                setSelectedUserVoucherId("");
              }}
              variant="secondary"
              disabled={submittingRevocation}
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              variant="danger"
              disabled={submittingRevocation || !revocationUserID || (revocationType === "VOUCHER" && !selectedUserVoucherId)}
              isLoading={submittingRevocation}
            >
              Xác nhận thu hồi
            </Button>
          </div>
        </form>
      </Modal>

      {/* -------------------- MODAL: EARN POLICY FORM -------------------- */}
      <Modal
        isOpen={showEarnModal}
        onClose={() => {
          setShowEarnModal(false);
          setEditingEarnPolicy(null);
        }}
        showCloseButton={true}
        className="!max-w-2xl font-outfit"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-brand-50 dark:bg-brand-500/10 text-brand-500 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[20px]">settings_accessibility</span>
          </div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">
            {editingEarnPolicy ? "Cập nhật cơ chế tích điểm" : "Thêm cơ chế tích điểm mới"}
          </h3>
        </div>

        <form onSubmit={handleSaveEarn} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Tên chính sách</label>
            <Input
              type="text"
              name="name"
              required
              defaultValue={editingEarnPolicy?.name || ""}
              placeholder="Ví dụ: Tích điểm mặc định, Tích điểm lễ Tết..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Số tiền mua hàng (VND)</label>
              <Input
                type="number"
                name="vndAmount"
                required
                min={1}
                defaultValue={editingEarnPolicy?.vndAmount ?? 1000}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Số điểm nhận được</label>
              <Input
                type="number"
                name="pointsEarned"
                required
                min={1}
                defaultValue={editingEarnPolicy?.pointsEarned ?? 10}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Loại chính sách</label>
              <select
                name="isCampaign"
                defaultValue={editingEarnPolicy?.isCampaign ? "true" : "false"}
                className="h-11 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent text-sm text-gray-800 dark:text-white/95 px-4 py-2.5 focus:border-brand-500 focus:ring-3 focus:ring-brand-500/10 outline-none cursor-pointer font-semibold"
              >
                <option value="false">Mặc định hệ thống</option>
                <option value="true">Chiến dịch tạm thời</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Hệ số nhân (Campaign)</label>
              <Input
                type="number"
                step="0.01"
                name="multiplier"
                required
                min="0.1"
                defaultValue={editingEarnPolicy?.multiplier ?? 1.0}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Ngày bắt đầu</label>
              <Input
                type="date"
                name="startDate"
                defaultValue={editingEarnPolicy?.startDate ? editingEarnPolicy.startDate.split("T")[0] : ""}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Ngày kết thúc</label>
              <Input
                type="date"
                name="endDate"
                defaultValue={editingEarnPolicy?.endDate ? editingEarnPolicy.endDate.split("T")[0] : ""}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Trạng thái kích hoạt</label>
            <select
              name="isActive"
              defaultValue={editingEarnPolicy?.isActive === false ? "false" : "true"}
              className="h-11 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent text-sm text-gray-800 dark:text-white/95 px-4 py-2.5 focus:border-brand-500 focus:ring-3 focus:ring-brand-500/10 outline-none cursor-pointer font-semibold"
            >
              <option value="true">Đang kích hoạt</option>
              <option value="false">Tạm khóa</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-white/10">
            <Button
              type="button"
              onClick={() => {
                setShowEarnModal(false);
                setEditingEarnPolicy(null);
              }}
              variant="secondary"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
            >
              Lưu chính sách
            </Button>
          </div>
        </form>
      </Modal>

      {/* -------------------- MODAL: REDEEM POLICY FORM -------------------- */}
      <Modal
        isOpen={showRedeemModal}
        onClose={() => {
          setShowRedeemModal(false);
          setEditingRedeemPolicy(null);
        }}
        showCloseButton={true}
        className="!max-w-2xl font-outfit"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-brand-50 dark:bg-brand-500/10 text-brand-500 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[20px]">swap_horizontal_circle</span>
          </div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">
            {editingRedeemPolicy ? "Cập nhật quy tắc đổi điểm" : "Thêm quy tắc đổi điểm mới"}
          </h3>
        </div>

        <form onSubmit={handleSaveRedeem} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Tên quy tắc</label>
            <Input
              type="text"
              name="name"
              required
              defaultValue={editingRedeemPolicy?.name || ""}
              placeholder="Ví dụ: Đổi điểm mặc định, Tỷ lệ ưu đãi hạng Vàng..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Số điểm đổi</label>
              <Input
                type="number"
                name="pointsToRedeem"
                required
                min={1}
                defaultValue={editingRedeemPolicy?.pointsToRedeem ?? 1}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Tiền giảm được (VND)</label>
              <Input
                type="number"
                step="0.1"
                name="discountVnd"
                required
                min={0.1}
                defaultValue={editingRedeemPolicy?.discountVnd ?? 1}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Áp dụng cho hạng</label>
            <select
              name="tierID"
              defaultValue={editingRedeemPolicy ? (editingRedeemPolicy.tierID || "") : (selectedTierForPrivileges || "")}
              disabled={selectedTierForPrivileges !== null}
              className="h-11 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent text-sm text-gray-800 dark:text-white/95 px-4 py-2.5 focus:border-brand-500 focus:ring-3 focus:ring-brand-500/10 outline-none cursor-pointer font-semibold disabled:opacity-75 disabled:cursor-not-allowed"
            >
              <option value="">Áp dụng chung toàn hệ thống</option>
              {tiers.map(t => (
                <option key={t.tierID} value={t.tierID}>{t.tierName}</option>
              ))}
            </select>
            {selectedTierForPrivileges !== null && (
              <input
                type="hidden"
                name="tierID"
                value={editingRedeemPolicy ? (editingRedeemPolicy.tierID || "") : (selectedTierForPrivileges || "")}
              />
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Ngày bắt đầu</label>
              <Input
                type="date"
                name="startDate"
                defaultValue={editingRedeemPolicy?.startDate ? editingRedeemPolicy.startDate.split("T")[0] : ""}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Ngày kết thúc</label>
              <Input
                type="date"
                name="endDate"
                defaultValue={editingRedeemPolicy?.endDate ? editingRedeemPolicy.endDate.split("T")[0] : ""}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Trạng thái hoạt động</label>
            <select
              name="isActive"
              defaultValue={editingRedeemPolicy?.isActive === false ? "false" : "true"}
              className="h-11 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent text-sm text-gray-800 dark:text-white/95 px-4 py-2.5 focus:border-brand-500 focus:ring-3 focus:ring-brand-500/10 outline-none cursor-pointer font-semibold"
            >
              <option value="true">Đang hoạt động</option>
              <option value="false">Tạm khóa</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-white/10">
            <Button
              type="button"
              onClick={() => {
                setShowRedeemModal(false);
                setEditingRedeemPolicy(null);
              }}
              variant="secondary"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
            >
              Lưu quy tắc
            </Button>
          </div>
        </form>
      </Modal>

      {/* -------------------- MODAL: TIER CONFIG FORM -------------------- */}
      <Modal
        isOpen={showTierModal}
        onClose={() => {
          setShowTierModal(false);
          setEditingTier(null);
        }}
        showCloseButton={true}
        className="!max-w-2xl font-outfit"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-brand-50 dark:bg-brand-500/10 text-brand-500 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[20px]">workspace_premium</span>
          </div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">
            {editingTier ? "Chỉnh sửa hạng thành viên" : "Tạo hạng thành viên mới"}
          </h3>
        </div>

        <form onSubmit={handleSaveTier} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Tên hạng</label>
            <Input
              type="text"
              name="tierName"
              required
              defaultValue={editingTier?.tierName || ""}
              placeholder="Ví dụ: Bạc, Vàng, Kim Cương..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Ngưỡng điểm tối thiểu (Min Points)</label>
            <Input
              type="number"
              name="minPoints"
              required
              min={0}
              defaultValue={editingTier?.minPoints ?? 0}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Màu sắc hiển thị</label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  name="colorHex"
                  defaultValue={editingTier?.colorHex || "#64748b"}
                  className="w-10 h-10 border border-gray-300 dark:border-gray-700 rounded-lg bg-transparent cursor-pointer p-0 shrink-0"
                />
                <input
                  type="text"
                  placeholder="#64748b"
                  name="colorHexText"
                  defaultValue={editingTier?.colorHex || "#64748b"}
                  className="h-11 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent text-sm text-gray-850 dark:text-white/95 px-3 py-md font-mono text-center text-xs font-bold focus:border-brand-500 focus:ring-3 focus:ring-brand-500/10 outline-none"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Biểu tượng Huy hiệu</label>
              <Input
                type="text"
                name="badgeIcon"
                required
                defaultValue={editingTier ? cleanIconName(editingTier.badgeIcon) : "workspace_premium"}
                placeholder="award_star, star, v.v."
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Cho phép hoạt động</label>
            <select
              name="isActive"
              defaultValue={editingTier?.isActive === false ? "false" : "true"}
              className="h-11 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent text-sm text-gray-800 dark:text-white/95 px-4 py-2.5 focus:border-brand-500 focus:ring-3 focus:ring-brand-500/10 outline-none cursor-pointer font-semibold"
            >
              <option value="true">Cho phép thăng hạng</option>
              <option value="false">Tạm ẩn/Khóa hạng</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-white/10">
            <Button
              type="button"
              onClick={() => {
                setShowTierModal(false);
                setEditingTier(null);
              }}
              variant="secondary"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
            >
              Lưu hạng thành viên
            </Button>
          </div>
        </form>
      </Modal>

      {/* -------------------- MODAL: PRIVILEGE FORM -------------------- */}
      <Modal
        isOpen={showPrivilegeModal}
        onClose={() => {
          setShowPrivilegeModal(false);
          setEditingPrivilege(null);
        }}
        showCloseButton={true}
        className="!max-w-3xl font-outfit"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-brand-50 dark:bg-brand-500/10 text-brand-500 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[20px]">stars</span>
          </div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">
            {editingPrivilege ? "Chỉnh sửa đặc quyền" : "Thêm đặc quyền mới"}
          </h3>
        </div>

        <form onSubmit={handleSavePrivilege} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Tên đặc quyền</label>
            <Input
              type="text"
              name="name"
              required
              defaultValue={editingPrivilege?.name || ""}
              placeholder="Ví dụ: Voucher hàng tháng Gold, Tặng xu sinh nhật..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Loại đặc quyền</label>
              <select
                value={privilegeType}
                onChange={(e) => setPrivilegeType(e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent text-sm text-gray-800 dark:text-white/95 px-4 py-2.5 focus:border-brand-500 focus:ring-3 focus:ring-brand-500/10 outline-none cursor-pointer font-semibold"
              >
                <option value="VOUCHER">Voucher hàng tháng</option>
                <option value="FREESHIP">Miễn phí vận chuyển</option>
                <option value="DISCOUNT">Giảm giá đơn hàng</option>
                <option value="CASHBACK">Hoàn xu / tích lũy</option>
                <option value="SUPPORT">Ưu tiên hỗ trợ</option>
                <option value="BIRTHDAY_GIFT">Quà tặng sinh nhật</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Trạng thái đặc quyền</label>
              <select
                name="isActive"
                defaultValue={editingPrivilege?.isActive === false ? "false" : "true"}
                className="h-11 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent text-sm text-gray-800 dark:text-white/95 px-4 py-2.5 focus:border-brand-500 focus:ring-3 focus:ring-brand-500/10 outline-none cursor-pointer font-semibold"
              >
                <option value="true">Đang kích hoạt</option>
                <option value="false">Tạm ẩn</option>
              </select>
            </div>
          </div>

          {/* DYNAMIC FIELDS FOR VOUCHER */}
          {privilegeType === "VOUCHER" && (
            <div className="space-y-4 border-t border-gray-200 dark:border-white/10 pt-4 animate-in fade-in duration-200">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block">Chế độ Voucher</label>
                <div className="flex gap-6 mt-1">
                  <label className="flex items-center gap-2 text-sm text-gray-750 dark:text-white/80 cursor-pointer font-bold select-none">
                    <input
                      type="radio"
                      name="voucherMode"
                      value="EXISTING"
                      checked={voucherMode === "EXISTING"}
                      onChange={() => {
                        setVoucherMode("EXISTING");
                        setVoucherCode("");
                      }}
                      className="w-4 h-4 text-brand-500 focus:ring-brand-500/10 cursor-pointer accent-brand-500"
                    />
                    Sử dụng Voucher có sẵn
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-750 dark:text-white/80 cursor-pointer font-bold select-none">
                    <input
                      type="radio"
                      name="voucherMode"
                      value="CUSTOM"
                      checked={voucherMode === "CUSTOM"}
                      onChange={() => {
                        setVoucherMode("CUSTOM");
                        setVoucherCode("");
                      }}
                      className="w-4 h-4 text-brand-500 focus:ring-brand-500/10 cursor-pointer accent-brand-500"
                    />
                    Tạo Voucher riêng mới
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {voucherMode === "EXISTING" ? (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Chọn Voucher</label>
                    <select
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value)}
                      required
                      className="h-11 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent text-sm text-gray-800 dark:text-white/95 px-4 py-2.5 focus:border-brand-500 focus:ring-3 focus:ring-brand-500/10 outline-none cursor-pointer font-semibold"
                    >
                      <option value="">-- Chọn Voucher --</option>
                      {vouchers.map(v => (
                        <option key={v.voucherID} value={v.code}>{v.code} - {v.name}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Tiền tố Mã Voucher</label>
                    <Input
                      type="text"
                      required
                      placeholder="Ví dụ: VCGOLD"
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value.toUpperCase().replace(/\s/g, ""))}
                      hint="Hệ thống sẽ thêm đuôi tháng năm. Ví dụ: VCGOLD_M0626"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Số lượng phát / tháng</label>
                  <Input
                    type="number"
                    required
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value || "1"))}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Thời hạn sử dụng (ngày)</label>
                  <Input
                    type="number"
                    required
                    min={1}
                    value={validityDays}
                    onChange={(e) => setValidityDays(parseInt(e.target.value || "30"))}
                    hint="Số ngày voucher có hiệu lực kể từ lúc phát"
                  />
                </div>
              </div>

              {voucherMode === "CUSTOM" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-white/[0.02] p-4 rounded-2xl border border-gray-200 dark:border-white/5 animate-in slide-in-from-top-2 duration-200">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Loại giảm giá</label>
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value)}
                      className="h-11 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent text-sm text-gray-800 dark:text-white/95 px-4 py-2.5 focus:border-brand-500 focus:ring-3 focus:ring-brand-500/10 outline-none cursor-pointer font-semibold"
                    >
                      <option value="PERCENT">Phần trăm (%)</option>
                      <option value="FIXED">Số tiền cố định (đ)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Giá trị giảm</label>
                    <Input
                      type="number"
                      required
                      min={1}
                      value={discountValue}
                      onChange={(e) => setDiscountValue(parseInt(e.target.value || "0"))}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Giảm tối đa (đ)</label>
                    <Input
                      type="number"
                      required={discountType === "PERCENT"}
                      disabled={discountType !== "PERCENT"}
                      value={maxDiscount}
                      onChange={(e) => setMaxDiscount(parseInt(e.target.value || "0"))}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Đơn tối thiểu (đ)</label>
                    <Input
                      type="number"
                      required
                      min={0}
                      value={minOrderValue}
                      onChange={(e) => setMinOrderValue(parseInt(e.target.value || "0"))}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* DYNAMIC FIELDS FOR FREESHIP */}
          {privilegeType === "FREESHIP" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-gray-200 dark:border-white/10 pt-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Số lượt / tháng</label>
                <Input
                  type="number"
                  required
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value || "1"))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Hỗ trợ tối đa (VNĐ)</label>
                <Input
                  type="number"
                  required
                  min={1}
                  value={maxSupport}
                  onChange={(e) => setMaxSupport(parseInt(e.target.value || "0"))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Đơn tối thiểu (VNĐ)</label>
                <Input
                  type="number"
                  required
                  min={0}
                  value={minOrderValue}
                  onChange={(e) => setMinOrderValue(parseInt(e.target.value || "0"))}
                />
              </div>
            </div>
          )}

          {/* DYNAMIC FIELDS FOR DISCOUNT */}
          {privilegeType === "DISCOUNT" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-gray-200 dark:border-white/10 pt-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Loại giảm giá</label>
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value)}
                  className="h-11 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent text-sm text-gray-800 dark:text-white/95 px-4 py-2.5 focus:border-brand-500 focus:ring-3 focus:ring-brand-500/10 outline-none cursor-pointer font-semibold"
                >
                  <option value="PERCENT">Phần trăm (%)</option>
                  <option value="FIXED">Số tiền cố định (đ)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Giá trị giảm</label>
                <Input
                  type="number"
                  required
                  min={1}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(parseInt(e.target.value || "0"))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Giảm tối đa (đ)</label>
                <Input
                  type="number"
                  required={discountType === "PERCENT"}
                  disabled={discountType !== "PERCENT"}
                  value={maxDiscount}
                  onChange={(e) => setMaxDiscount(parseInt(e.target.value || "0"))}
                />
              </div>
            </div>
          )}

          {/* DYNAMIC FIELDS FOR CASHBACK */}
          {privilegeType === "CASHBACK" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-200 dark:border-white/10 pt-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Tỷ lệ hoàn xu (%)</label>
                <Input
                  type="number"
                  required
                  min={1}
                  max={100}
                  value={cashbackRate}
                  onChange={(e) => setCashbackRate(parseInt(e.target.value || "0"))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Hoàn xu tối đa (xu/tháng)</label>
                <Input
                  type="number"
                  required
                  min={1}
                  value={maxCashback}
                  onChange={(e) => setMaxCashback(parseInt(e.target.value || "0"))}
                />
              </div>
            </div>
          )}

          {/* DYNAMIC FIELDS FOR SUPPORT */}
          {privilegeType === "SUPPORT" && (
            <div className="p-4 bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 rounded-2xl text-xs font-semibold text-gray-500 dark:text-gray-400 border-t pt-4">
              Không cần cấu hình thông số. Hạng thành viên sở hữu đặc quyền này sẽ luôn được ưu tiên hỗ trợ trước.
            </div>
          )}

          {/* DYNAMIC FIELDS FOR BIRTHDAY GIFT */}
          {privilegeType === "BIRTHDAY_GIFT" && (
            <div className="space-y-4 border-t border-gray-200 dark:border-white/10 pt-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Loại quà tặng</label>
                <select
                  value={birthdayGiftType}
                  onChange={(e) => setBirthdayGiftType(e.target.value)}
                  className="h-11 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent text-sm text-gray-800 dark:text-white/95 px-4 py-2.5 focus:border-brand-500 focus:ring-3 focus:ring-brand-500/10 outline-none cursor-pointer font-semibold"
                >
                  <option value="VOUCHER">Voucher giảm giá</option>
                  <option value="POINTS">Điểm thưởng Loyalty</option>
                  <option value="COINS">Xu trong ví</option>
                  <option value="PHYSICAL">Quà tặng vật lý</option>
                </select>
              </div>

              {birthdayGiftType === "VOUCHER" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Chọn Voucher sinh nhật</label>
                    <select
                      value={birthdayVoucherCode}
                      onChange={(e) => setBirthdayVoucherCode(e.target.value)}
                      required
                      className="h-11 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent text-sm text-gray-800 dark:text-white/95 px-4 py-2.5 focus:border-brand-500 focus:ring-3 focus:ring-brand-500/10 outline-none cursor-pointer font-semibold"
                    >
                      <option value="">-- Chọn Voucher --</option>
                      {vouchers.map(v => (
                        <option key={v.voucherID} value={v.code}>{v.code} - {v.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Số lượng voucher</label>
                    <Input
                      type="number"
                      required
                      min={1}
                      value={birthdayQuantity}
                      onChange={(e) => setBirthdayQuantity(parseInt(e.target.value || "1"))}
                    />
                  </div>
                </div>
              )}

              {birthdayGiftType === "POINTS" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Số điểm tặng</label>
                  <Input
                    type="number"
                    required
                    min={1}
                    value={birthdayPoints}
                    onChange={(e) => setBirthdayPoints(parseInt(e.target.value || "1"))}
                  />
                </div>
              )}

              {birthdayGiftType === "COINS" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Số xu tặng</label>
                  <Input
                    type="number"
                    required
                    min={1}
                    value={birthdayCoins}
                    onChange={(e) => setBirthdayCoins(parseInt(e.target.value || "1"))}
                  />
                </div>
              )}

              {birthdayGiftType === "PHYSICAL" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Tên quà tặng vật lý</label>
                    <Input
                      type="text"
                      required
                      value={birthdayGiftName}
                      onChange={(e) => setBirthdayGiftName(e.target.value)}
                      placeholder="Ví dụ: Bình nước giữ nhiệt"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Mô tả chi tiết</label>
                    <Input
                      type="text"
                      value={birthdayGiftDesc}
                      onChange={(e) => setBirthdayGiftDesc(e.target.value)}
                      placeholder="Mô tả quà tặng sinh nhật..."
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-white/10">
            <Button
              type="button"
              onClick={() => {
                setShowPrivilegeModal(false);
                setEditingPrivilege(null);
              }}
              variant="secondary"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
            >
              Lưu đặc quyền
            </Button>
          </div>
        </form>
      </Modal>

      {/* -------------------- MODAL: MANUAL BIRTHDAY GIFT ISSUANCE -------------------- */}
      <Modal
        isOpen={showManualBirthdayModal}
        onClose={() => {
          setShowManualBirthdayModal(false);
          setManualBirthdayUserID("");
          setManualBirthdayUserSearchTerm("");
        }}
        showCloseButton={true}
        className="!max-w-2xl font-outfit"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-brand-50 dark:bg-brand-500/10 text-brand-500 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[20px]">card_giftcard</span>
          </div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">Phát quà sinh nhật thủ công</h3>
        </div>

        <form onSubmit={handleManualBirthdayIssue} className="space-y-4">
          <div className="p-3 bg-brand-500/5 dark:bg-brand-500/10 border border-brand-500/20 text-xs font-semibold text-brand-600 dark:text-brand-400 rounded-xl">
            Lưu ý: Hệ thống sẽ dựa trên đặc quyền quà tặng sinh nhật (BIRTHDAY_GIFT) đã được cấu hình cho hạng thành viên hiện tại của thành viên được chọn để phát quà tương ứng. Mỗi thành viên chỉ nhận quà tối đa 1 lần/năm.
          </div>

          {/* User search */}
          <div className="space-y-1.5 relative">
            <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Tìm kiếm thành viên</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-[18px]">person</span>
              <input
                type="text"
                placeholder="Nhập tên, email hoặc SĐT..."
                value={manualBirthdayUserSearchTerm}
                onChange={(e) => {
                  setManualBirthdayUserSearchTerm(e.target.value);
                  if (e.target.value.trim().length >= 3) {
                    fetch(`${API_BASE_URL}/vouchers/search-users?keyword=${encodeURIComponent(e.target.value)}`, { headers: getHeaders() })
                      .then(res => res.json())
                      .then(data => setUserSuggestions(data))
                      .catch(err => console.error(err));
                  } else {
                    setUserSuggestions([]);
                  }
                }}
                className="h-11 w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent text-sm text-gray-800 dark:text-white/90 focus:outline-none focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 placeholder:text-gray-400 transition-all"
              />
            </div>

            {/* Suggestions list */}
            {userSuggestions.length > 0 && (
              <div className="absolute top-16 left-0 right-0 z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                {userSuggestions.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => {
                      setManualBirthdayUserID(u.id);
                      setManualBirthdayUserSearchTerm(`${u.fullName} (${u.email})`);
                      setUserSuggestions([]);
                    }}
                    className="p-3 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer flex flex-col gap-0.5 border-b border-gray-100 dark:border-white/5 last:border-0"
                  >
                    <p className="text-xs font-bold text-gray-800 dark:text-white">{u.fullName}</p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold">{u.email} {u.phoneNumber && `- ${u.phoneNumber}`}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {manualBirthdayUserID && (
            <div className="p-3 bg-gray-50 dark:bg-white/[0.01] border border-gray-200 dark:border-white/5 rounded-xl text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
              ID thành viên đã chọn: {manualBirthdayUserID}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-white/10">
            <Button
              type="button"
              onClick={() => {
                setShowManualBirthdayModal(false);
                setManualBirthdayUserID("");
                setManualBirthdayUserSearchTerm("");
              }}
              variant="secondary"
              disabled={submittingManualBirthday}
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={submittingManualBirthday || !manualBirthdayUserID}
              isLoading={submittingManualBirthday}
            >
              Cấp phát quà
            </Button>
          </div>
        </form>
      </Modal>
    </main>
  );
}
