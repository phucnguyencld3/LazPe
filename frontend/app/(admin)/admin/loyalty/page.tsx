"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import { Pagination } from "@/components/admin/shared/Pagination";
import { formatCurrency, formatPrivilegeDetailLines } from "@/lib/utils/formatters";

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
  const [loyaltySettings, setLoyaltySettings] = useState<{
    enableReviewReward: boolean;
    reviewRewardPoints: number;
    minimumReviewWords: number;
    requiredRatingForReward: number;
    allowMultipleRewardsPerProduct: boolean;
  }>({
    enableReviewReward: true,
    reviewRewardPoints: 200,
    minimumReviewWords: 50,
    requiredRatingForReward: 5,
    allowMultipleRewardsPerProduct: false
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
      <header className="mb-lg flex items-center justify-between">
        <div>
          <h1 className="font-headline-md text-headline-md text-primary font-bold">Chương trình Loyalty Program</h1>
          <p className="font-body-md text-body-md text-on-surface-variant/70">Thiết lập cơ chế tích điểm, đổi điểm, xếp hạng và đặc quyền thành viên</p>
        </div>
        <div className="flex items-center gap-sm shrink-0">
          <button
            onClick={() => {
              fetchTiers();
              setShowRevocationModal(true);
            }}
            className="border border-error/30 text-error bg-error/5 hover:bg-error/10 px-lg py-md rounded-full font-label-md text-label-md flex items-center gap-xs hover:scale-102 active:scale-95 transition-all font-bold cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">remove_circle</span> Thu hồi Đặc quyền / Điểm
          </button>
        </div>
      </header>

      {/* Tabs Menu */}
      <div className="flex border-b border-outline-variant/30 mb-md overflow-x-auto gap-2" style={{ scrollbarWidth: "none" }}>
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`px-lg py-md font-label-md text-label-md font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${activeTab === "dashboard"
            ? "border-primary text-primary"
            : "border-transparent text-on-surface-variant/70 hover:text-primary"
            }`}
        >
          <span className="material-symbols-outlined text-sm">dashboard</span>
          Tổng quan
        </button>
        <button
          onClick={() => setActiveTab("policies")}
          className={`px-lg py-md font-label-md text-label-md font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${activeTab === "policies"
            ? "border-primary text-primary"
            : "border-transparent text-on-surface-variant/70 hover:text-primary"
            }`}
        >
          <span className="material-symbols-outlined text-sm">settings_suggest</span>
          Cơ chế Tích/Đổi
        </button>
        <button
          onClick={() => setActiveTab("tiers")}
          className={`px-lg py-md font-label-md text-label-md font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${activeTab === "tiers"
            ? "border-primary text-primary"
            : "border-transparent text-on-surface-variant/70 hover:text-primary"
            }`}
        >
          <span className="material-symbols-outlined text-sm">military_tech</span>
          Hạng & Đặc quyền
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-lg py-md font-label-md text-label-md font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${activeTab === "history"
            ? "border-primary text-primary"
            : "border-transparent text-on-surface-variant/70 hover:text-primary"
            }`}
        >
          <span className="material-symbols-outlined text-sm">history</span>
          Lịch sử & Logs
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`px-lg py-md font-label-md text-label-md font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${activeTab === "settings"
            ? "border-primary text-primary"
            : "border-transparent text-on-surface-variant/70 hover:text-primary"
            }`}
        >
          <span className="material-symbols-outlined text-sm">settings</span>
          Cấu hình
        </button>
      </div>

      {/* -------------------- TAB 1: DASHBOARD (Standard Bento Style) -------------------- */}
      {activeTab === "dashboard" && (
        <section className="space-y-md">
          {loadingStats ? (
            <div className="h-64 flex items-center justify-center bg-surface-container-lowest rounded-xl border border-outline-variant/20 shadow-sm">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : stats ? (
            <>
              {/* Bento Grid Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
                {/* Issued */}
                <div className="glass-card p-lg rounded-xl shadow-sm hover:shadow-md transition-shadow bg-surface-container-lowest border border-outline-variant/20 flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-label-md text-label-md text-on-surface-variant font-bold">Tổng điểm phát hành</p>
                      <h3 className="font-display-lg text-display-lg text-primary mt-xs">{stats.totalPointsIssued.toLocaleString()}đ</h3>
                    </div>
                    <div className="p-sm bg-primary-container/20 rounded-lg shrink-0">
                      <span className="material-symbols-outlined text-primary text-[28px]">military_tech</span>
                    </div>
                  </div>
                </div>

                {/* Spent */}
                <div className="glass-card p-lg rounded-xl shadow-sm hover:shadow-md transition-shadow bg-surface-container-lowest border border-outline-variant/20 flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-label-md text-label-md text-on-surface-variant font-bold">Điểm đã sử dụng</p>
                      <h3 className="font-display-lg text-display-lg text-secondary mt-xs">{stats.totalPointsSpent.toLocaleString()}đ</h3>
                    </div>
                    <div className="p-sm bg-secondary-container/20 rounded-lg shrink-0">
                      <span className="material-symbols-outlined text-secondary text-[28px]">shopping_cart</span>
                    </div>
                  </div>
                </div>

                {/* Remaining */}
                <div className="glass-card p-lg rounded-xl shadow-sm hover:shadow-md transition-shadow bg-surface-container-lowest border border-outline-variant/20 flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-label-md text-label-md text-on-surface-variant font-bold">Điểm tồn trong ví</p>
                      <h3 className="font-display-lg text-display-lg text-tertiary mt-xs">{stats.totalPointsRemaining.toLocaleString()}đ</h3>
                    </div>
                    <div className="p-sm bg-tertiary-container/20 rounded-lg shrink-0">
                      <span className="material-symbols-outlined text-tertiary text-[28px]">account_balance_wallet</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats bento row 2 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
                <div className="glass-card p-lg rounded-xl shadow-sm hover:shadow-md transition-shadow bg-surface-container-lowest border border-outline-variant/20 flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-label-md text-label-md text-on-surface-variant font-bold">Tỷ lệ thăng hạng</p>
                      <h3 className="font-display-lg text-display-lg text-primary mt-xs">{stats.upgradeRate}%</h3>
                    </div>
                    <div className="p-sm bg-primary-container/20 rounded-lg shrink-0">
                      <span className="material-symbols-outlined text-primary text-[28px]">trending_up</span>
                    </div>
                  </div>
                </div>

                <div className="glass-card p-lg rounded-xl shadow-sm hover:shadow-md transition-shadow bg-surface-container-lowest border border-outline-variant/20 flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-label-md text-label-md text-on-surface-variant font-bold">Tỷ lệ sử dụng voucher</p>
                      <h3 className="font-display-lg text-display-lg text-secondary mt-xs">{stats.voucherUsageRate}%</h3>
                    </div>
                    <div className="p-sm bg-secondary-container/20 rounded-lg shrink-0">
                      <span className="material-symbols-outlined text-secondary text-[28px]">local_activity</span>
                    </div>
                  </div>
                </div>

                <div className="glass-card p-lg rounded-xl shadow-sm hover:shadow-md transition-shadow bg-surface-container-lowest border border-outline-variant/20 flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-label-md text-label-md text-on-surface-variant font-bold">Doanh thu Loyalty</p>
                      <h3 className="font-display-lg text-display-lg text-tertiary mt-xs">{formatCurrency(stats.revenueFromLoyalty)}</h3>
                    </div>
                    <div className="p-sm bg-tertiary-container/20 rounded-lg shrink-0">
                      <span className="material-symbols-outlined text-tertiary text-[28px]">monetization_on</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Members distributions & Leaderboard */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
                <div className="glass-card p-lg rounded-xl border border-outline-variant/20 shadow-sm bg-surface-container-lowest flex flex-col">
                  <div className="border-b border-outline-variant/20 pb-4 mb-4">
                    <h3 className="font-headline-md text-on-surface font-bold">Phân bố thành viên</h3>
                  </div>
                  <div className="space-y-4 flex-1 flex flex-col justify-center">
                    {stats.membersPerTier.map((item) => (
                      <div key={item.tierID} className="flex items-center justify-between">
                        <div className="flex items-center gap-sm">
                          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.colorHex }} />
                          <span className="font-label-md text-label-md text-on-surface-variant font-bold">{item.tierName}</span>
                        </div>
                        <span className="font-body-md text-body-md text-on-surface font-bold">{(item.count ?? 0).toLocaleString()} khách</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-2 glass-card rounded-xl border border-outline-variant/20 shadow-sm overflow-hidden bg-surface-container-lowest">
                  <div className="p-md border-b border-outline-variant/20 bg-primary-container/5">
                    <h3 className="font-headline-md text-on-surface font-bold">Bảng xếp hạng tích điểm cao nhất</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead className="bg-primary-container/10 border-b border-outline-variant/30 text-left">
                        <tr>
                          <th className="px-lg py-md font-label-md text-label-md text-primary font-bold">Hạng</th>
                          <th className="px-lg py-md font-label-md text-label-md text-primary font-bold">Khách hàng</th>
                          <th className="px-lg py-md font-label-md text-label-md text-primary font-bold text-right">Điểm khả dụng</th>
                          <th className="px-lg py-md font-label-md text-label-md text-primary font-bold text-right">Tổng tích lũy</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/20">
                        {stats.topCustomers.map((c) => (
                          <tr key={c.userID} className="hover:bg-primary-container/10 transition-colors group">
                            <td className="px-lg py-md">
                              <span
                                className="px-3 py-1 rounded-full text-[10px] font-bold text-white shadow-sm"
                                style={{ backgroundColor: stats.membersPerTier.find(m => m.tierName === c.tierName)?.colorHex || "#64748b" }}
                              >
                                {c.tierName}
                              </span>
                            </td>
                            <td className="px-lg py-md">
                              <div className="flex items-center gap-sm">
                                <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center font-bold text-on-surface-variant text-xs shrink-0 overflow-hidden border border-outline-variant/20">
                                  {c.avatar ? <img src={c.avatar} className="w-full h-full object-cover" /> : c.fullName.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-label-md text-label-md text-on-surface font-bold">{c.fullName}</p>
                                  <p className="text-[10px] text-on-surface-variant/60 font-semibold">{c.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-lg py-md text-right font-body-md text-body-md text-primary font-bold">{c.availablePoints.toLocaleString()}</td>
                            <td className="px-lg py-md text-right font-body-md text-body-md text-on-surface font-bold">{c.totalPoints.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="h-64 flex items-center justify-center bg-surface-container-lowest rounded-xl border border-outline-variant/20 shadow-sm text-on-surface-variant text-sm font-semibold">
              Không tìm thấy dữ liệu thống kê.
            </div>
          )}
        </section>
      )}

      {/* -------------------- TAB 2: POLICIES (Config Forms & Tables) -------------------- */}
      {activeTab === "policies" && (
        <section className="space-y-md">
          {loadingPolicies ? (
            <div className="h-64 flex items-center justify-center bg-surface-container-lowest rounded-xl border border-outline-variant/20 shadow-sm">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
              {/* Accumulation Policies */}
              <div className="glass-card rounded-xl border border-outline-variant/20 shadow-sm overflow-hidden bg-surface-container-lowest flex flex-col">
                <div className="p-md border-b border-outline-variant/20 flex items-center justify-between bg-primary-container/5">
                  <div>
                    <h3 className="font-headline-md text-on-surface font-bold">Cơ chế tích điểm</h3>
                    <p className="text-on-surface-variant/60 text-xs font-semibold mt-xs">Cấu hình giá trị chuyển đổi từ VNĐ mua hàng sang điểm</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingEarnPolicy(null);
                      setShowEarnModal(true);
                    }}
                    className="bg-primary text-on-primary px-lg py-md rounded-full font-label-md text-label-md flex items-center gap-xs hover:scale-105 active:scale-95 transition-all shadow-md font-bold cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">add_circle</span>
                    Thêm quy tắc
                  </button>
                </div>

                <div className="p-md space-y-md">
                  {earnPolicies.map((p) => (
                    <div key={p.policyID} className="p-md border border-outline-variant/30 rounded-xl flex items-center justify-between hover:border-primary/50 transition-all relative bg-surface-container-low/30">
                      {p.isCampaign && (
                        <span className="absolute top-0 right-16 bg-error text-on-error text-[8px] font-bold px-2 py-0.5 rounded-b-md uppercase">Campaign</span>
                      )}
                      <div>
                        <h4 className="font-label-md text-label-md text-on-surface font-bold">{p.name}</h4>
                        <p className="text-xs text-on-surface-variant/70 mt-1">
                          Quy đổi: <strong className="text-primary">{p.vndAmount.toLocaleString()}₫</strong> = <strong className="text-primary">{p.pointsEarned} điểm</strong>
                          {p.isCampaign && ` (Hệ số: x${p.multiplier})`}
                        </p>
                        {(p.startDate || p.endDate) && (
                          <p className="text-[10px] text-on-surface-variant/50 mt-1 font-semibold">
                            Áp dụng: {p.startDate ? new Date(p.startDate).toLocaleDateString("vi-VN") : "Ngay bây giờ"} - {p.endDate ? new Date(p.endDate).toLocaleDateString("vi-VN") : "Hạn dài"}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => p.isCampaign && handleToggleEarn(p.policyID)}
                          disabled={!p.isCampaign}
                          className={`w-9 h-5 rounded-full transition-colors flex items-center p-0.5 ${!p.isCampaign ? "bg-secondary opacity-70 cursor-not-allowed" : "cursor-pointer"} ${(!p.isCampaign || p.isActive) ? "bg-secondary" : "bg-outline-variant/50"}`}
                          title={!p.isCampaign ? "Không thể tắt chính sách mặc định" : ""}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow ${(!p.isCampaign || p.isActive) ? "translate-x-4" : ""}`} />
                        </button>
                        <button
                          onClick={() => {
                            setEditingEarnPolicy(p);
                            setShowEarnModal(true);
                          }}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-variant/20 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        {p.isCampaign && (
                          <button
                            onClick={() => openConfirmDialog(
                              "Bạn có chắc chắn muốn xóa chính sách này?",
                              () => handleDeleteEarn(p.policyID)
                            )}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-error hover:bg-error-container/20 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Redemption Policies */}
              <div className="glass-card rounded-xl border border-outline-variant/20 shadow-sm overflow-hidden bg-surface-container-lowest flex flex-col">
                <div className="p-md border-b border-outline-variant/20 flex items-center justify-between bg-primary-container/5">
                  <div>
                    <h3 className="font-headline-md text-on-surface font-bold">Cơ chế đổi điểm</h3>
                    <p className="text-on-surface-variant/60 text-xs font-semibold mt-xs">Quy định đổi điểm thành tiền giảm giá (hệ thống hoặc theo hạng)</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingRedeemPolicy(null);
                      setShowRedeemModal(true);
                    }}
                    className="bg-primary text-on-primary px-lg py-md rounded-full font-label-md text-label-md flex items-center gap-xs hover:scale-105 active:scale-95 transition-all shadow-md font-bold cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">add_circle</span>
                    Thêm quy tắc
                  </button>
                </div>

                <div className="p-md space-y-md">
                  {redeemPolicies.map((p) => {
                    const isDefaultRedeem = p.tierID === null || p.tierID === 0 || p.name.includes("mặc định") || p.name.toLowerCase().includes("default");
                    return (
                      <div key={p.policyID} className="p-md border border-outline-variant/30 rounded-xl flex items-center justify-between hover:border-primary/50 transition-all relative bg-surface-container-low/30">
                        {p.tierID && (
                          <span className="absolute top-0 right-16 bg-secondary text-on-secondary text-[8px] font-bold px-2 py-0.5 rounded-b-md uppercase">Hạng: {p.tier?.tierName}</span>
                        )}
                        <div>
                          <h4 className="font-label-md text-label-md text-on-surface font-bold">{p.name}</h4>
                          <p className="text-xs text-on-surface-variant/70 mt-1">
                            Quy đổi: <strong className="text-primary">{p.pointsToRedeem.toLocaleString()} điểm</strong> = <strong className="text-primary">-{p.discountVnd.toLocaleString()}₫</strong>
                          </p>
                          {(p.startDate || p.endDate) && (
                            <p className="text-[10px] text-on-surface-variant/50 mt-1 font-semibold">
                              Hiệu lực: {p.startDate ? new Date(p.startDate).toLocaleDateString("vi-VN") : "Ngay bây giờ"} - {p.endDate ? new Date(p.endDate).toLocaleDateString("vi-VN") : "Hạn dài"}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => !isDefaultRedeem && handleToggleRedeem(p.policyID)}
                            disabled={isDefaultRedeem}
                            className={`w-9 h-5 rounded-full transition-colors flex items-center p-0.5 ${isDefaultRedeem ? "bg-secondary opacity-70 cursor-not-allowed" : "cursor-pointer"} ${(isDefaultRedeem || p.isActive) ? "bg-secondary" : "bg-outline-variant/50"}`}
                            title={isDefaultRedeem ? "Không thể tắt chính sách mặc định" : ""}
                          >
                            <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow ${(isDefaultRedeem || p.isActive) ? "translate-x-4" : ""}`} />
                          </button>
                          <button
                            onClick={() => {
                              setEditingRedeemPolicy(p);
                              setShowRedeemModal(true);
                            }}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-variant/20 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          {!isDefaultRedeem && (
                            <button
                              onClick={() => openConfirmDialog(
                                "Bạn có chắc chắn muốn xóa chính sách này?",
                                () => handleDeleteRedeem(p.policyID)
                              )}
                              className="w-8 h-8 rounded-full flex items-center justify-center text-error hover:bg-error-container/20 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* -------------------- TAB 3: TIERS & PRIVILEGES (Card Layout) -------------------- */}
      {activeTab === "tiers" && (
        <section className="space-y-md">
          {loadingTiers ? (
            <div className="h-64 flex items-center justify-center bg-surface-container-lowest rounded-xl border border-outline-variant/20 shadow-sm">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
              {/* Tiers list */}
              <div className="lg:col-span-1 space-y-md">
                <div className="flex items-center justify-between px-2">
                  <h3 className="font-label-md text-on-surface font-bold text-lg">Hạng thành viên</h3>
                  <button
                    onClick={() => {
                      setEditingTier(null);
                      setShowTierModal(true);
                    }}
                    className="bg-primary text-on-primary px-md py-sm rounded-full font-label-md text-label-md flex items-center gap-xs hover:scale-105 active:scale-95 transition-all shadow-md font-bold cursor-pointer text-sm"
                  >
                    <span className="material-symbols-outlined text-base">add_circle</span>
                    Thêm mới
                  </button>
                </div>

                <div className="flex flex-col gap-sm">
                  {tiers.map((t) => (
                    <div
                      key={t.tierID}
                      onClick={() => setSelectedTierForPrivileges(t.tierID)}
                      className={`px-sm py-sm rounded-[5px] border cursor-pointer transition-all flex items-center gap-sm relative overflow-hidden group shadow-sm hover:shadow-md ${selectedTierForPrivileges === t.tierID ? "border-primary ring-2 ring-primary/20 bg-surface-container-lowest" : "border-outline-variant/20 bg-surface-container-low/30 hover:border-outline-variant/60"}`}
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-2" style={{ backgroundColor: t.colorHex }} />
                      <div className="pl-2 flex items-center gap-sm w-full min-w-0">
                        <span className="material-symbols-outlined text-[22px] shrink-0" style={{ color: t.colorHex }}>{cleanIconName(t.badgeIcon)}</span>
                        <div className="min-w-0">
                          <h4 className="font-label-md text-label-md text-on-surface font-bold text-base truncate">{t.tierName}</h4>
                          <p className="text-sm text-on-surface-variant/60 font-semibold">
                            {t.minPoints.toLocaleString()}đ
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detail Tier Panel */}
              <div className="lg:col-span-2 glass-card rounded-xl shadow-sm border border-outline-variant/20 overflow-hidden bg-surface-container-lowest flex flex-col animate-in fade-in duration-300">
                {(() => {
                  const activeTier = tiers.find(t => t.tierID === selectedTierForPrivileges);
                  return (
                    <>
                      <div className="p-md border-b border-outline-variant/20 bg-primary-container/5 flex items-center justify-between">
                        <div>
                          <h3 className="font-headline-md text-on-surface font-bold text-lg">Chi tiết Hạng thành viên</h3>
                          <p className="text-on-surface-variant/60 text-base font-semibold mt-xs">
                            Đang chọn: <span className="text-primary font-bold">{activeTier?.tierName || "Chưa chọn"}</span>
                          </p>
                        </div>
                        {activeTier && (
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => handleToggleTier(activeTier.tierID)}
                              className={`w-11 h-6 rounded-full transition-colors flex items-center p-0.5 cursor-pointer ${activeTier.isActive ? "bg-secondary" : "bg-outline-variant/50"}`}
                              title={activeTier.isActive ? "Đang hoạt động" : "Tạm khóa"}
                            >
                              <div className={`w-5 h-5 bg-white rounded-full transition-transform shadow ${activeTier.isActive ? "translate-x-5" : ""}`} />
                            </button>
                            <button
                              onClick={() => {
                                setEditingTier(activeTier);
                                setShowTierModal(true);
                              }}
                              className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-variant/20 cursor-pointer border border-outline-variant/20 shadow-sm bg-surface-container-low"
                              title="Chỉnh sửa thông tin hạng"
                            >
                              <span className="material-symbols-outlined text-[20px]">edit</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {selectedTierForPrivileges ? (
                        <>
                          {/* Sub-tabs Navigation */}
                          <div className="flex border-b border-outline-variant/20 bg-surface-container-low/20 p-1 gap-1">
                            <button
                              onClick={() => setSubTab("privileges")}
                              className={`flex-1 py-2 text-center rounded-lg font-bold text-sm md:text-base transition-all cursor-pointer ${subTab === "privileges"
                                ? "bg-primary text-on-primary shadow-sm"
                                : "text-on-surface-variant/70 hover:bg-surface-container-low hover:text-on-surface"
                                }`}
                            >
                              Đặc quyền
                            </button>
                            <button
                              onClick={() => setSubTab("redeem")}
                              className={`flex-1 py-2 text-center rounded-lg font-bold text-sm md:text-base transition-all cursor-pointer ${subTab === "redeem"
                                ? "bg-primary text-on-primary shadow-sm"
                                : "text-on-surface-variant/70 hover:bg-surface-container-low hover:text-on-surface"
                                }`}
                            >
                              Đổi điểm riêng
                            </button>
                          </div>

                          {/* Sub-tab Content Area */}
                          <div className="p-md overflow-y-auto max-h-[320px]">
                            {/* Sub-tab 1: Privileges */}
                            {subTab === "privileges" && (
                              <div className="space-y-md">
                                <div className="flex justify-between items-center mb-sm">
                                  <h4 className="font-label-md text-on-surface-variant font-bold uppercase tracking-wider text-xs">Đặc quyền của hạng</h4>
                                  <button
                                    onClick={() => {
                                      setEditingPrivilege(null);
                                      setShowPrivilegeModal(true);
                                    }}
                                    className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 px-4 py-2 rounded-full font-bold text-xs transition-all cursor-pointer"
                                  >
                                    + Thêm đặc quyền
                                  </button>
                                </div>

                                <div className="space-y-sm">
                                  {privileges.length === 0 ? (
                                    <div className="text-center py-10 text-on-surface-variant/50 font-bold text-base">
                                      Chưa có đặc quyền nào được thiết lập.
                                    </div>
                                  ) : (
                                    privileges.map((p) => (
                                      <div key={p.privilegeID} className="p-sm border border-outline-variant/30 rounded-lg flex items-center justify-between bg-surface-container-low/30 hover:border-primary/30 transition-all">
                                        <div>
                                          <h5 className="font-label-md text-label-md text-on-surface font-bold text-base">{p.name}</h5>
                                          <div className="flex gap-1.5 mt-1 items-center">
                                            <span className="px-1.5 py-0.5 rounded-full text-sm font-bold bg-primary-container/20 text-on-primary-container uppercase">{p.privilegeType}</span>
                                          </div>
                                          {p.value && (
                                            <ul className="text-xs text-on-surface-variant/60 font-semibold mt-1.5 space-y-0.5 pl-4 list-disc">
                                              {formatPrivilegeDetailLines(p.privilegeType, p.value).map((line, idx) => (
                                                <li key={idx}>{line}</li>
                                              ))}
                                            </ul>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                          <button
                                            onClick={() => {
                                              setEditingPrivilege(p);
                                              setShowPrivilegeModal(true);
                                            }}
                                            className="w-6 h-6 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-variant/20 cursor-pointer"
                                          >
                                            <span className="material-symbols-outlined text-[14px]">edit</span>
                                          </button>
                                          <button
                                            onClick={() => openConfirmDialog(
                                              "Bạn có chắc chắn muốn xóa đặc quyền này?",
                                              () => handleDeletePrivilege(p.privilegeID)
                                            )}
                                            className="w-6 h-6 rounded-full flex items-center justify-center text-error hover:bg-error-container/20 cursor-pointer"
                                          >
                                            <span className="material-symbols-outlined text-[14px]">delete</span>
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
                              <div className="space-y-md">
                                <div className="flex justify-between items-center mb-sm">
                                  <h4 className="font-label-md text-on-surface-variant font-bold uppercase tracking-wider text-xs">Cơ chế đổi điểm riêng</h4>
                                  <button
                                    onClick={() => {
                                      setEditingRedeemPolicy(null);
                                      setShowRedeemModal(true);
                                    }}
                                    className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 px-4 py-2 rounded-full font-bold text-xs transition-all cursor-pointer"
                                  >
                                    + Thêm quy tắc riêng
                                  </button>
                                </div>

                                <div className="space-y-sm">
                                  {redeemPolicies.filter(p => p.tierID === selectedTierForPrivileges).length === 0 ? (
                                    <div className="text-center py-10 text-on-surface-variant/50 font-bold text-base">
                                      Chưa có cơ chế đổi điểm riêng. Sẽ áp dụng cơ chế đổi điểm mặc định.
                                    </div>
                                  ) : (
                                    redeemPolicies
                                      .filter(p => p.tierID === selectedTierForPrivileges)
                                      .map((p) => (
                                        <div key={p.policyID} className="p-sm border border-outline-variant/30 rounded-lg flex items-center justify-between bg-surface-container-low/30 hover:border-primary/30 transition-all">
                                          <div>
                                            <h5 className="font-label-md text-label-md text-on-surface font-bold text-base">{p.name}</h5>
                                            <p className="text-base text-on-surface-variant/70 mt-1 font-semibold">
                                              Quy đổi: <strong className="text-primary">{p.pointsToRedeem.toLocaleString()} điểm</strong> = <strong className="text-primary">-{p.discountVnd.toLocaleString()}₫</strong>
                                            </p>
                                          </div>
                                          <div className="flex items-center gap-1 shrink-0">
                                            <button
                                              onClick={() => handleToggleRedeem(p.policyID)}
                                              className={`w-8 h-4 rounded-full transition-colors flex items-center p-0.5 cursor-pointer ${p.isActive ? "bg-secondary" : "bg-outline-variant/50"}`}
                                            >
                                              <div className={`w-3 h-3 bg-white rounded-full transition-transform shadow ${p.isActive ? "translate-x-3.5" : ""}`} />
                                            </button>
                                            <button
                                              onClick={() => {
                                                setEditingRedeemPolicy(p);
                                                setShowRedeemModal(true);
                                              }}
                                              className="w-6 h-6 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-variant/20 cursor-pointer"
                                            >
                                              <span className="material-symbols-outlined text-[14px]">edit</span>
                                            </button>
                                            <button
                                              onClick={() => openConfirmDialog(
                                                "Bạn có chắc chắn muốn xóa chính sách này?",
                                                () => handleDeleteRedeem(p.policyID)
                                              )}
                                              className="w-6 h-6 rounded-full flex items-center justify-center text-error hover:bg-error-container/20 cursor-pointer"
                                            >
                                              <span className="material-symbols-outlined text-[14px]">delete</span>
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
                        <div className="text-center py-20 text-on-surface-variant/60 font-bold text-sm flex-1 flex items-center justify-center">
                          Vui lòng chọn một hạng thành viên ở bên trái để quản lý chi tiết.
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </section>
      )}

      {/* -------------------- TAB 5: HISTORY & LOGS (Paginated Table) -------------------- */}
      {activeTab === "history" && (
        <section className="space-y-md">
          {/* Sub-tabs Navigation inside History tab */}
          <div className="flex border-b border-outline-variant/20 bg-surface-container-low/20 p-1 gap-1 max-w-2xl">
            <button
              onClick={() => setHistorySubTab("points")}
              className={`flex-1 py-2 text-center rounded-lg font-bold text-sm md:text-base transition-all cursor-pointer ${historySubTab === "points"
                ? "bg-primary text-on-primary shadow-sm"
                : "text-on-surface-variant/70 hover:bg-surface-container-low hover:text-on-surface"
                }`}
            >
              Tích & Đổi điểm
            </button>
            <button
              onClick={() => setHistorySubTab("birthday")}
              className={`flex-1 py-2 text-center rounded-lg font-bold text-sm md:text-base transition-all cursor-pointer ${historySubTab === "birthday"
                ? "bg-primary text-on-primary shadow-sm"
                : "text-on-surface-variant/70 hover:bg-surface-container-low hover:text-on-surface"
                }`}
            >
              Quà sinh nhật
            </button>
            <button
              onClick={() => setHistorySubTab("audit")}
              className={`flex-1 py-2 text-center rounded-lg font-bold text-sm md:text-base transition-all cursor-pointer ${historySubTab === "audit"
                ? "bg-primary text-on-primary shadow-sm"
                : "text-on-surface-variant/70 hover:bg-surface-container-low hover:text-on-surface"
                }`}
            >
              Thay đổi hệ thống
            </button>
          </div>

          {/* Sub-tab 1: Points Transaction Log */}
          {historySubTab === "points" && (
            <div className="glass-card rounded-xl shadow-sm border border-outline-variant/20 overflow-hidden bg-surface-container-lowest flex flex-col">
              <div className="p-md border-b border-outline-variant/20 bg-primary-container/5">
                <h3 className="font-headline-md text-on-surface font-bold">Lịch sử tích/đổi điểm của khách hàng</h3>
              </div>

              {/* Filters */}
              <div className="p-md border-b border-outline-variant/20 flex flex-wrap items-center gap-md bg-surface-container-low/30">
                <div className="relative min-w-[200px] flex-1">
                  <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
                  <input
                    type="text"
                    placeholder="Tìm khách hàng..."
                    value={filterSearch}
                    onChange={(e) => setFilterSearch(e.target.value)}
                    className="w-full pl-xl pr-md py-md bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary/30 transition-all font-body-md text-on-surface"
                  />
                </div>

                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="bg-surface-container-low border-none rounded-lg px-lg py-md font-label-md text-on-surface focus:ring-2 focus:ring-primary/30 cursor-pointer"
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
                  className="bg-surface-container-low border-none rounded-lg px-lg py-md font-label-md text-on-surface focus:ring-2 focus:ring-primary/30 cursor-pointer"
                >
                  <option value="">Hạng hiện tại</option>
                  {tiers.map(t => (
                    <option key={t.tierID} value={t.tierID}>{t.tierName}</option>
                  ))}
                </select>
              </div>

              <div className="overflow-x-auto flex-1">
                <table className="w-full border-collapse">
                  <thead className="bg-primary-container/10 border-b border-outline-variant/30 text-left">
                    <tr>
                      <th className="px-lg py-md font-label-md text-label-md text-primary font-bold">Khách hàng</th>
                      <th className="px-lg py-md font-label-md text-label-md text-primary font-bold">Hạng</th>
                      <th className="px-lg py-md font-label-md text-label-md text-primary font-bold text-right">Biến động</th>
                      <th className="px-lg py-md font-label-md text-label-md text-primary font-bold text-center">Loại</th>
                      <th className="px-lg py-md font-label-md text-label-md text-primary font-bold">Mô tả & Thời gian</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    {loadingHistory ? (
                      <tr>
                        <td colSpan={5} className="text-center py-20">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
                        </td>
                      </tr>
                    ) : history.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-20 text-on-surface-variant/60 font-bold text-sm">
                          Không tìm thấy lịch sử nào.
                        </td>
                      </tr>
                    ) : (
                      history.map((h) => {
                        const isExpanded = expandedHistoryId === h.historyID;
                        return (
                          <React.Fragment key={h.historyID}>
                            <tr className="hover:bg-primary-container/10 transition-colors group">
                              <td className="px-lg py-md">
                                <p className="font-label-md text-label-md text-on-surface font-bold">{h.fullName}</p>
                                <p className="text-[10px] text-on-surface-variant/60 font-semibold">{h.email}</p>
                              </td>
                              <td className="px-lg py-md font-body-md text-body-md text-on-surface-variant font-bold">
                                {h.tierName}
                              </td>
                              <td className={`px-lg py-md text-right font-bold text-sm ${h.amount > 0 ? "text-emerald-600" : h.amount < 0 ? "text-error" : "text-on-surface-variant/50"}`}>
                                {h.amount > 0 ? `+${h.amount.toLocaleString()}` : h.amount.toLocaleString()}
                              </td>
                              <td className="px-lg py-md text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${h.transactionType === "EARN" ? "bg-secondary-container/20 text-on-secondary-container" :
                                  h.transactionType === "SPEND" ? "bg-tertiary-container/30 text-on-tertiary-container" :
                                    h.transactionType === "REVOKE" ? "bg-error-container text-on-error-container" :
                                      "bg-surface-container-high text-on-surface-variant"
                                  }`}>
                                  {h.transactionType}
                                </span>
                              </td>
                              <td className="px-lg py-md max-w-[220px]">
                                <p className="font-label-md text-label-md text-on-surface font-bold truncate">{h.description}</p>
                                <div className="mt-1 flex items-center justify-between gap-2">
                                  <p className="text-[10px] text-on-surface-variant/60 font-semibold">{new Date(h.createdAt).toLocaleString("vi-VN")}</p>
                                  <button
                                    type="button"
                                    onClick={() => setExpandedHistoryId(isExpanded ? null : h.historyID)}
                                    className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
                                  >
                                    {isExpanded ? "Thu gọn" : "Xem chi tiết"}
                                    <span className="material-symbols-outlined text-[14px]">
                                      {isExpanded ? "expand_less" : "expand_more"}
                                    </span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr className="bg-surface-container-lowest">
                                <td colSpan={5} className="px-lg pb-md">
                                  <div className="p-md rounded-lg border border-outline-variant/20 bg-surface-container-low/30">
                                    <div className="flex flex-wrap gap-4 text-xs text-on-surface-variant/70 font-semibold">
                                      <span>Thời gian: {new Date(h.createdAt).toLocaleString("vi-VN")}</span>
                                      {h.invoiceID && <span>Hóa đơn: #{h.invoiceID}</span>}
                                      <span>Loại: {h.transactionType}</span>
                                    </div>
                                    <p className="mt-2 text-sm font-bold text-on-surface">Mô tả</p>
                                    <p className="text-sm text-on-surface-variant/80 whitespace-pre-line break-words">{h.description}</p>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <Pagination
                currentPage={historyPage}
                totalPages={historyTotalPages}
                totalItems={historyTotalItems}
                itemsPerPage={15}
                onPageChange={setHistoryPage}
              />
            </div>
          )}

          {/* Sub-tab 2: Birthday Gift Logs */}
          {historySubTab === "birthday" && (
            <div className="glass-card rounded-xl shadow-sm border border-outline-variant/20 overflow-hidden bg-surface-container-lowest flex flex-col">
              <div className="p-md border-b border-outline-variant/20 bg-primary-container/5 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="font-headline-md text-on-surface font-bold">Lịch sử nhận quà sinh nhật</h3>
                  <p className="text-on-surface-variant/60 text-xs font-semibold mt-xs">Danh sách thành viên nhận quà và trạng thái cấp phát hàng năm</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={handleTriggerBirthdayJob}
                    disabled={triggeringBirthdayJob}
                    className="border border-primary/30 text-primary bg-primary/5 hover:bg-primary/10 px-lg py-md rounded-full font-label-md text-label-md flex items-center gap-xs font-bold cursor-pointer disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                    {triggeringBirthdayJob ? "Đang chạy Job..." : "Chạy Job sinh nhật hôm nay"}
                  </button>
                  <button
                    onClick={() => setShowManualBirthdayModal(true)}
                    className="bg-primary text-on-primary px-lg py-md rounded-full font-label-md text-label-md flex items-center gap-xs hover:scale-105 active:scale-95 transition-all shadow-md font-bold cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">card_giftcard</span>
                    Phát quà thủ công
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="p-md border-b border-outline-variant/20 flex flex-wrap items-center gap-md bg-surface-container-low/30">
                <div className="relative min-w-[200px] flex-1">
                  <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
                  <input
                    type="text"
                    placeholder="Tìm kiếm thành viên..."
                    value={birthdaySearch}
                    onChange={(e) => setBirthdaySearch(e.target.value)}
                    className="w-full pl-xl pr-md py-md bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary/30 transition-all font-body-md text-on-surface"
                  />
                </div>
              </div>

              <div className="overflow-x-auto flex-1">
                <table className="w-full border-collapse">
                  <thead className="bg-primary-container/10 border-b border-outline-variant/30 text-left">
                    <tr>
                      <th className="px-lg py-md font-label-md text-label-md text-primary font-bold">Thành viên</th>
                      <th className="px-lg py-md font-label-md text-label-md text-primary font-bold text-center">Năm nhận</th>
                      <th className="px-lg py-md font-label-md text-label-md text-primary font-bold">Loại quà</th>
                      <th className="px-lg py-md font-label-md text-label-md text-primary font-bold">Giá trị quà</th>
                      <th className="px-lg py-md font-label-md text-label-md text-primary font-bold">Người phát</th>
                      <th className="px-lg py-md font-label-md text-label-md text-primary font-bold">Thời gian nhận</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20 text-sm">
                    {loadingBirthdayLogs ? (
                      <tr>
                        <td colSpan={6} className="text-center py-20">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
                        </td>
                      </tr>
                    ) : birthdayLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-20 text-on-surface-variant/60 font-bold">
                          Không tìm thấy lịch sử quà sinh nhật nào.
                        </td>
                      </tr>
                    ) : (
                      birthdayLogs.map((l) => (
                        <tr key={l.giftLogID} className="hover:bg-primary-container/10 transition-colors">
                          <td className="px-lg py-md">
                            <p className="font-bold text-on-surface">{l.fullName}</p>
                            <p className="text-[10px] text-on-surface-variant/60 font-semibold">{l.email}</p>
                          </td>
                          <td className="px-lg py-md text-center font-bold text-primary">
                            {l.year}
                          </td>
                          <td className="px-lg py-md">
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-secondary-container/20 text-on-secondary-container uppercase">
                              {l.giftType}
                            </span>
                          </td>
                          <td className="px-lg py-md font-semibold text-on-surface">
                            {l.giftValue}
                          </td>
                          <td className="px-lg py-md font-medium text-on-surface-variant/80">
                            {l.issuedBy}
                          </td>
                          <td className="px-lg py-md text-on-surface-variant/60">
                            {new Date(l.receivedAt).toLocaleString("vi-VN")}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <Pagination
                currentPage={birthdayPage}
                totalPages={birthdayTotalPages}
                totalItems={birthdayTotalItems}
                itemsPerPage={15}
                onPageChange={setBirthdayPage}
              />
            </div>
          )}

          {/* Sub-tab 3: System Audit Logs */}
          {historySubTab === "audit" && (
            <div className="glass-card rounded-xl shadow-sm border border-outline-variant/20 overflow-hidden bg-surface-container-lowest flex flex-col h-full">
              <div className="p-md border-b border-outline-variant/20 bg-primary-container/5">
                <h3 className="font-headline-md text-on-surface font-bold">Logs thay đổi hệ thống</h3>
              </div>

              <div className="p-md space-y-md flex-1 min-h-0 overflow-y-auto">
                {loadingAudit ? (
                  <div className="py-20 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
                  </div>
                ) : auditLogs.length === 0 ? (
                  <div className="text-center py-10 text-on-surface-variant/60 font-bold text-sm">
                    Chưa ghi nhận hoạt động thay đổi nào.
                  </div>
                ) : (
                  auditLogs.map((l) => (
                    <div key={l.logID} className="p-md border border-outline-variant/30 rounded-xl bg-surface-container-low/30 flex flex-col gap-2">
                      <div className="flex justify-between items-center text-sm font-bold text-primary">
                        <span>{getAuditActionLabel(l.action)}</span>
                        <span className="text-on-surface-variant/60 font-semibold text-xs">{new Date(l.timestamp).toLocaleDateString("vi-VN")}</span>
                      </div>
                      <p className="font-label-md text-label-md text-on-surface font-bold text-base">
                        {l.notes || `Đối tượng: ${l.entityName} #${l.entityID}`}
                      </p>
                      <p className="text-sm text-on-surface-variant/70 font-semibold">Thực hiện: {l.actorEmail}</p>
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
            </div>
          )}
        </section>
      )}

      {/* -------------------- TAB 6: SETTINGS (Loyalty Settings Configuration) -------------------- */}
      {activeTab === "settings" && (
        <section className="space-y-md animate-in fade-in duration-200">
          {loadingSettings ? (
            <div className="h-64 flex items-center justify-center bg-surface-container-lowest rounded-xl border border-outline-variant/20 shadow-sm">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : (
            <form onSubmit={handleSaveSettings} className="glass-card rounded-xl shadow-sm border border-outline-variant/20 overflow-hidden bg-surface-container-lowest max-w-3xl">
              <div className="p-md border-b border-outline-variant/20 bg-primary-container/5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary">reviews</span>
                </div>
                <div>
                  <h3 className="font-headline-md text-on-surface font-bold text-lg">Cấu hình thưởng điểm Đánh giá</h3>
                  <p className="text-xs text-on-surface-variant/70 font-semibold">Quy định điểm thưởng khi khách hàng đánh giá sản phẩm</p>
                </div>
              </div>

              <div className="p-md space-y-lg">
                {/* Enable Switch */}
                <div className="flex items-center justify-between p-md bg-surface-container-low/30 rounded-xl border border-outline-variant/20">
                  <div className="space-y-1">
                    <span className="font-label-lg text-on-surface font-bold text-sm block">Kích hoạt chương trình thưởng đánh giá</span>
                    <span className="text-xs text-on-surface-variant/70 font-semibold">Bật/tắt việc cộng điểm thưởng khi khách hàng viết đánh giá sản phẩm</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={loyaltySettings.enableReviewReward}
                      onChange={(e) => setLoyaltySettings({ ...loyaltySettings, enableReviewReward: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                {loyaltySettings.enableReviewReward && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-md animate-in fade-in duration-200">
                    {/* Points */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">Số điểm thưởng</label>
                      <input
                        type="number"
                        min="1"
                        value={loyaltySettings.reviewRewardPoints}
                        onChange={(e) => setLoyaltySettings({ ...loyaltySettings, reviewRewardPoints: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-lg focus:ring-2 focus:ring-primary/30 transition-all font-body-md text-on-surface font-semibold"
                        required
                      />
                      <p className="text-[10px] text-on-surface-variant/60 font-semibold">Số điểm Loyalty cộng vào ví khách hàng</p>
                    </div>

                    {/* Minimum Words */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">Số từ tối thiểu</label>
                      <input
                        type="number"
                        min="10"
                        value={loyaltySettings.minimumReviewWords}
                        onChange={(e) => setLoyaltySettings({ ...loyaltySettings, minimumReviewWords: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-lg focus:ring-2 focus:ring-primary/30 transition-all font-body-md text-on-surface font-semibold"
                        required
                      />
                      <p className="text-[10px] text-on-surface-variant/60 font-semibold">Chiều dài tối thiểu của bình luận (chuẩn tiếng Việt)</p>
                    </div>

                    {/* Required Rating */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">Yêu cầu số sao tối thiểu</label>
                      <select
                        value={loyaltySettings.requiredRatingForReward}
                        onChange={(e) => setLoyaltySettings({ ...loyaltySettings, requiredRatingForReward: parseInt(e.target.value) || 5 })}
                        className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-lg focus:ring-2 focus:ring-primary/30 transition-all font-body-md text-on-surface font-semibold"
                      >
                        <option value={5}>⭐⭐⭐⭐⭐ 5 Sao</option>
                        <option value={4}>⭐⭐⭐⭐ 4 Sao hoặc hơn</option>
                        <option value={3}>⭐⭐⭐ 3 Sao hoặc hơn</option>
                        <option value={2}>⭐⭐ 2 Sao hoặc hơn</option>
                        <option value={1}>⭐ 1 Sao hoặc hơn</option>
                      </select>
                      <p className="text-[10px] text-on-surface-variant/60 font-semibold">Chỉ cộng điểm khi đạt mức sao tối thiểu này</p>
                    </div>

                    {/* Allow Multiple Rewards */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">Cơ chế nhận thưởng nhiều lần</label>
                      <div className="flex items-center gap-3 p-3 bg-surface-container-low/50 rounded-lg border border-outline-variant/20 mt-1">
                        <input
                          type="checkbox"
                          id="allowMultipleRewards"
                          checked={loyaltySettings.allowMultipleRewardsPerProduct}
                          onChange={(e) => setLoyaltySettings({ ...loyaltySettings, allowMultipleRewardsPerProduct: e.target.checked })}
                          className="w-4 h-4 text-primary bg-surface-container-low border-outline focus:ring-primary rounded cursor-pointer"
                        />
                        <label htmlFor="allowMultipleRewards" className="text-xs font-bold text-on-surface cursor-pointer select-none">
                          Nhận thưởng nhiều lần trên 1 sản phẩm
                        </label>
                      </div>
                      <p className="text-[10px] text-on-surface-variant/60 font-semibold mt-1">Nếu tắt, mỗi sản phẩm trong lịch sử mua hàng chỉ được cộng thưởng đánh giá 1 lần duy nhất</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-md flex justify-end gap-3 border-t border-outline-variant/20 bg-surface-container-lowest">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-lg py-md rounded-full bg-primary text-on-primary hover:bg-primary/95 shadow-md shadow-primary/10 transition-all font-bold text-xs cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {savingSettings ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-on-primary"></div>
                      Đang lưu cấu hình...
                    </>
                  ) : (
                    "Lưu cấu hình"
                  )}
                </button>
              </div>
            </form>
          )}
        </section>
      )}

      {/* -------------------- MODAL: CONFIRM ACTION -------------------- */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4 animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest border border-outline-variant/30 w-[calc(100vw-2rem)] md:w-[520px] lg:w-[620px] shrink-0 rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-md flex items-center justify-between border-b border-outline-variant/20 bg-primary-container/5">
              <h3 className="text-lg font-headline-md text-on-surface font-bold">{confirmDialog.title || "Xác nhận thao tác"}</h3>
              <button
                onClick={closeConfirmDialog}
                className="w-8 h-8 rounded-full hover:bg-surface-container-low flex items-center justify-center transition-colors cursor-pointer text-on-surface-variant"
                aria-label="Đóng"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-md space-y-md">
              <p className="text-sm text-on-surface-variant/80 font-semibold">{confirmDialog.message}</p>
              <div className="flex justify-end gap-3 pt-md border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={closeConfirmDialog}
                  className="px-lg py-md rounded-full border border-outline-variant text-on-surface-variant hover:bg-surface-container-low font-bold text-xs cursor-pointer transition-colors"
                >
                  {confirmDialog.cancelLabel || "Hủy"}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDialog}
                  className="px-lg py-md rounded-full bg-error text-on-error hover:opacity-90 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-md active:scale-95"
                >
                  {confirmDialog.confirmLabel || "Xác nhận"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- MODAL: MANUAL REVOCATION (Points & Voucher Revocation) -------------------- */}
      {showRevocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4 animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest border border-outline-variant/30 w-[calc(100vw-2rem)] md:w-[620px] lg:w-[720px] h-[550px] max-h-[90vh] flex flex-col rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-md flex items-center justify-between border-b border-outline-variant/20 bg-primary-container/5 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-error-container text-on-error-container flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-error">remove_circle</span>
                </div>
                <h3 className="text-lg font-headline-md text-on-surface font-bold">Thu hồi Đặc quyền / Điểm</h3>
              </div>
              <button
                onClick={() => {
                  setShowRevocationModal(false);
                  setRevocationUserID("");
                  setUserSearchTerm("");
                  setRevocationAmount(0);
                  setRevocationReason("");
                  setSelectedEarnTransactionId("");
                  setSelectedUserVoucherId("");
                }}
                className="w-8 h-8 rounded-full hover:bg-surface-container-low flex items-center justify-center transition-colors cursor-pointer text-on-surface-variant"
                disabled={submittingRevocation}
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleManualRevocation} className="flex flex-col min-h-0 flex-1">
              <div className="p-md space-y-md overflow-y-auto flex-1">
                {/* Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">Loại hình thu hồi</label>
                  <div className="flex gap-6 mt-1">
                    <label className="flex items-center gap-2 text-sm text-on-surface cursor-pointer font-medium">
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
                        className="w-4 h-4 text-primary bg-surface-container-low border-outline focus:ring-primary cursor-pointer"
                      />
                      Thu hồi Đặc quyền / Điểm
                    </label>
                    <label className="flex items-center gap-2 text-sm text-on-surface cursor-pointer font-medium">
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
                        className="w-4 h-4 text-primary bg-surface-container-low border-outline focus:ring-primary cursor-pointer"
                      />
                      Thu hồi Voucher đặc quyền
                    </label>
                  </div>
                </div>

                {/* User search */}
                <div className="space-y-1.5 relative">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Tìm kiếm thành viên</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">person</span>
                    <input
                      type="text"
                      placeholder="Nhập tên, email hoặc SĐT..."
                      value={userSearchTerm}
                      onChange={(e) => handleUserSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary/30 transition-all font-body-md text-on-surface"
                    />
                  </div>

                  {/* Suggestions list */}
                  {userSuggestions.length > 0 && (
                    <div className="absolute top-16 left-0 right-0 z-50 bg-surface-container-lowest border border-outline-variant rounded-md shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                      {userSuggestions.map((u) => (
                        <div
                          key={u.id}
                          onClick={() => selectUserForRevocation(u.id, u.fullName, u.email)}
                          className="p-3 hover:bg-surface-container-low cursor-pointer flex flex-col gap-0.5 border-b border-outline-variant last:border-0"
                        >
                          <p className="font-label-md text-on-surface text-xs font-bold">{u.fullName}</p>
                          <p className="text-[10px] text-on-surface-variant/70 font-semibold">{u.email} {u.phoneNumber && `- ${u.phoneNumber}`}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {revocationUserID && (
                  <div className="p-3 bg-surface-container-low border border-outline-variant rounded-lg text-[10px] font-bold text-on-surface-variant uppercase tracking-widest flex items-center justify-between">
                    <span>ID thành viên: {revocationUserID}</span>
                    {loadingUserDetails && (
                      <span className="text-primary animate-pulse text-[11px]">Đang tải dữ liệu...</span>
                    )}
                  </div>
                )}

                {/* Conditional Fields for POINTS */}
                {revocationUserID && !loadingUserDetails && revocationType === "POINTS" && (
                  <div className="space-y-md border-t border-outline-variant/20 pt-4 animate-in fade-in duration-200">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Chọn lượt tích điểm hoặc đơn hàng</label>
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
                        className="w-full px-lg py-md bg-surface-container-low border-none rounded-full focus:ring-2 focus:ring-primary/30 transition-all font-body-md text-on-surface cursor-pointer"
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
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Số điểm cần thu hồi</label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={revocationAmount}
                        onChange={(e) => setRevocationAmount(parseInt(e.target.value || "0"))}
                        className="w-full px-4 py-3 bg-surface-container-low border-none rounded-lg font-bold text-sm text-error outline-none focus:ring-2 focus:ring-error/20 focus:border-error transition-all"
                      />
                    </div>
                  </div>
                )}

                {/* Conditional Fields for VOUCHER */}
                {revocationUserID && !loadingUserDetails && revocationType === "VOUCHER" && (
                  <div className="space-y-md border-t border-outline-variant/20 pt-4 animate-in fade-in duration-200">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Chọn Voucher muốn thu hồi</label>
                      {userUnusedVouchers.length === 0 ? (
                        <div className="p-3 bg-surface-container-low/50 border border-outline-variant/10 rounded-lg text-xs font-semibold text-on-surface-variant/70">
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
                          className="w-full px-lg py-md bg-surface-container-low border-none rounded-full focus:ring-2 focus:ring-primary/30 transition-all font-body-md text-on-surface cursor-pointer"
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
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Lý do thu hồi</label>
                    <textarea
                      required
                      rows={3}
                      value={revocationReason}
                      onChange={(e) => setRevocationReason(e.target.value)}
                      placeholder={revocationType === "POINTS" ? "Mô tả lý do thu hồi điểm..." : "Mô tả lý do thu hồi voucher..."}
                      className="w-full px-4 py-3 bg-surface-container-low border-none rounded-lg font-semibold text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                    />
                  </div>
                )}
              </div>

              <div className="p-md flex justify-end gap-3 border-t border-outline-variant/20 bg-surface-container-lowest shrink-0">
                <button
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
                  className="px-lg py-md rounded-full border border-outline-variant text-on-surface-variant hover:bg-surface-container-low font-bold text-xs cursor-pointer transition-colors"
                  disabled={submittingRevocation}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submittingRevocation || !revocationUserID || (revocationType === "VOUCHER" && !selectedUserVoucherId)}
                  className="px-lg py-md rounded-full bg-error text-on-error hover:opacity-90 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                  {submittingRevocation ? "Đang xử lý..." : "Xác nhận thu hồi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------- MODAL: EARN POLICY FORM -------------------- */}
      {showEarnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4 animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest border border-outline-variant/30 w-[calc(100vw-2rem)] md:w-[620px] lg:w-[720px] h-[520px] max-h-[90vh] flex flex-col rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-md flex items-center justify-between border-b border-outline-variant/20 bg-primary-container/5 shrink-0">
              <h3 className="text-lg font-headline-md text-on-surface font-bold">
                {editingEarnPolicy ? "Cập nhật cơ chế tích điểm" : "Thêm cơ chế tích điểm mới"}
              </h3>
              <button
                onClick={() => {
                  setShowEarnModal(false);
                  setEditingEarnPolicy(null);
                }}
                className="w-8 h-8 rounded-full hover:bg-surface-container-low flex items-center justify-center transition-colors cursor-pointer text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveEarn} className="flex flex-col min-h-0 flex-1">
              <div className="p-md space-y-md overflow-y-auto flex-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Tên chính sách</label>
                  <input
                    type="text"
                    name="name"
                    required
                    defaultValue={editingEarnPolicy?.name || ""}
                    placeholder="Ví dụ: Tích điểm mặc định, Tích điểm lễ Tết..."
                    className="w-full px-lg py-md bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary/30 transition-all font-body-md text-on-surface"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Số tiền mua hàng (VND)</label>
                    <input
                      type="number"
                      name="vndAmount"
                      required
                      min={1}
                      defaultValue={editingEarnPolicy?.vndAmount ?? 1000}
                      className="w-full px-lg py-md bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary/30 transition-all font-body-md text-on-surface"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Số điểm nhận được</label>
                    <input
                      type="number"
                      name="pointsEarned"
                      required
                      min={1}
                      defaultValue={editingEarnPolicy?.pointsEarned ?? 10}
                      className="w-full px-lg py-md bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary/30 transition-all font-body-md text-on-surface"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Loại chính sách</label>
                    <select
                      name="isCampaign"
                      defaultValue={editingEarnPolicy?.isCampaign ? "true" : "false"}
                      className="w-full px-lg py-md bg-surface-container-low border-none rounded-full focus:ring-2 focus:ring-primary/30 transition-all font-body-md text-on-surface cursor-pointer"
                    >
                      <option value="false">Mặc định hệ thống</option>
                      <option value="true">Chiến dịch tạm thời</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Hệ số nhân (Campaign)</label>
                    <input
                      type="number"
                      step="0.01"
                      name="multiplier"
                      required
                      min="0.1"
                      defaultValue={editingEarnPolicy?.multiplier ?? 1.0}
                      className="w-full px-lg py-md bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary/30 transition-all font-body-md text-on-surface"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Ngày bắt đầu</label>
                    <input
                      type="date"
                      name="startDate"
                      defaultValue={editingEarnPolicy?.startDate ? editingEarnPolicy.startDate.split("T")[0] : ""}
                      className="w-full px-lg py-md bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary/30 transition-all font-body-md text-on-surface"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Ngày kết thúc</label>
                    <input
                      type="date"
                      name="endDate"
                      defaultValue={editingEarnPolicy?.endDate ? editingEarnPolicy.endDate.split("T")[0] : ""}
                      className="w-full px-lg py-md bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary/30 transition-all font-body-md text-on-surface"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Trạng thái kích hoạt</label>
                  <select
                    name="isActive"
                    defaultValue={editingEarnPolicy?.isActive === false ? "false" : "true"}
                    className="w-full px-lg py-md bg-surface-container-low border-none rounded-full focus:ring-2 focus:ring-primary/30 transition-all font-body-md text-on-surface cursor-pointer"
                  >
                    <option value="true">Đang kích hoạt</option>
                    <option value="false">Tạm khóa</option>
                  </select>
                </div>

              </div>

              <div className="p-md flex justify-end gap-3 border-t border-outline-variant/20 bg-surface-container-lowest shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowEarnModal(false);
                    setEditingEarnPolicy(null);
                  }}
                  className="px-lg py-md rounded-full border border-outline-variant/30 text-on-surface hover:bg-surface-container-low transition-colors font-bold text-xs cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-lg py-md rounded-full bg-primary text-on-primary hover:bg-primary/95 shadow-md shadow-primary/10 transition-all font-bold text-xs cursor-pointer"
                >
                  Lưu chính sách
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------- MODAL: REDEEM POLICY FORM -------------------- */}
      {showRedeemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4 animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest border border-outline-variant/30 w-[calc(100vw-2rem)] md:w-[620px] lg:w-[720px] h-[520px] max-h-[90vh] flex flex-col rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-md flex items-center justify-between border-b border-outline-variant/20 bg-primary-container/5 shrink-0">
              <h3 className="text-lg font-headline-md text-on-surface font-bold">
                {editingRedeemPolicy ? "Cập nhật quy tắc đổi điểm" : "Thêm quy tắc đổi điểm mới"}
              </h3>
              <button
                onClick={() => {
                  setShowRedeemModal(false);
                  setEditingRedeemPolicy(null);
                }}
                className="w-8 h-8 rounded-full hover:bg-surface-container-low flex items-center justify-center transition-colors cursor-pointer text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveRedeem} className="flex flex-col min-h-0 flex-1">
              <div className="p-md space-y-md overflow-y-auto flex-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Tên quy tắc</label>
                  <input
                    type="text"
                    name="name"
                    required
                    defaultValue={editingRedeemPolicy?.name || ""}
                    placeholder="Ví dụ: Đổi điểm mặc định, Tỷ lệ ưu đãi hạng Vàng..."
                    className="w-full px-lg py-md bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary/30 transition-all font-body-md text-on-surface"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Số điểm đổi</label>
                    <input
                      type="number"
                      name="pointsToRedeem"
                      required
                      min={1}
                      defaultValue={editingRedeemPolicy?.pointsToRedeem ?? 1}
                      className="w-full px-lg py-md bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary/30 transition-all font-body-md text-on-surface"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Tiền giảm được (VND)</label>
                    <input
                      type="number"
                      step="0.1"
                      name="discountVnd"
                      required
                      min={0.1}
                      defaultValue={editingRedeemPolicy?.discountVnd ?? 1}
                      className="w-full px-lg py-md bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary/30 transition-all font-body-md text-on-surface"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Áp dụng cho hạng</label>
                  <select
                    name="tierID"
                    defaultValue={editingRedeemPolicy ? (editingRedeemPolicy.tierID || "") : (selectedTierForPrivileges || "")}
                    disabled={selectedTierForPrivileges !== null}
                    className="w-full px-lg py-md bg-surface-container-low border-none rounded-full focus:ring-2 focus:ring-primary/30 transition-all font-body-md text-on-surface cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Ngày bắt đầu</label>
                    <input
                      type="date"
                      name="startDate"
                      defaultValue={editingRedeemPolicy?.startDate ? editingRedeemPolicy.startDate.split("T")[0] : ""}
                      className="w-full px-lg py-md bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary/30 transition-all font-body-md text-on-surface"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Ngày kết thúc</label>
                    <input
                      type="date"
                      name="endDate"
                      defaultValue={editingRedeemPolicy?.endDate ? editingRedeemPolicy.endDate.split("T")[0] : ""}
                      className="w-full px-lg py-md bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary/30 transition-all font-body-md text-on-surface"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Trạng thái hoạt động</label>
                  <select
                    name="isActive"
                    defaultValue={editingRedeemPolicy?.isActive === false ? "false" : "true"}
                    className="w-full px-lg py-md bg-surface-container-low border-none rounded-full focus:ring-2 focus:ring-primary/30 transition-all font-body-md text-on-surface cursor-pointer"
                  >
                    <option value="true">Đang hoạt động</option>
                    <option value="false">Tạm khóa</option>
                  </select>
                </div>

              </div>

              <div className="p-md flex justify-end gap-3 border-t border-outline-variant/20 bg-surface-container-lowest shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowRedeemModal(false);
                    setEditingRedeemPolicy(null);
                  }}
                  className="px-lg py-md rounded-full border border-outline-variant/30 text-on-surface hover:bg-surface-container-low font-bold text-xs cursor-pointer transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-lg py-md rounded-full bg-primary text-on-primary hover:bg-primary/95 shadow-md shadow-primary/10 transition-all font-bold text-xs cursor-pointer"
                >
                  Lưu quy tắc
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------- MODAL: TIER CONFIG FORM -------------------- */}
      {showTierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4 animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest border border-outline-variant/30 w-[calc(100vw-2rem)] md:w-[620px] lg:w-[720px] h-[480px] max-h-[90vh] flex flex-col rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-md flex items-center justify-between border-b border-outline-variant/20 bg-primary-container/5 shrink-0">
              <h3 className="text-lg font-headline-md text-on-surface font-bold">
                {editingTier ? "Chỉnh sửa hạng thành viên" : "Tạo hạng thành viên mới"}
              </h3>
              <button
                onClick={() => {
                  setShowTierModal(false);
                  setEditingTier(null);
                }}
                className="w-8 h-8 rounded-full hover:bg-surface-container-low flex items-center justify-center transition-colors cursor-pointer text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveTier} className="flex flex-col min-h-0 flex-1">
              <div className="p-md space-y-md overflow-y-auto flex-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Tên hạng</label>
                  <input
                    type="text"
                    name="tierName"
                    required
                    defaultValue={editingTier?.tierName || ""}
                    placeholder="Ví dụ: Bạc, Vàng, Kim Cương..."
                    className="w-full px-lg py-md bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary/30 transition-all font-body-md text-on-surface"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Ngưỡng điểm tối thiểu (Min Points)</label>
                  <input
                    type="number"
                    name="minPoints"
                    required
                    min={0}
                    defaultValue={editingTier?.minPoints ?? 0}
                    className="w-full px-lg py-md bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary/30 transition-all font-body-md text-on-surface"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Màu sắc hiển thị</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        name="colorHex"
                        defaultValue={editingTier?.colorHex || "#64748b"}
                        className="w-10 h-10 border border-outline-variant/30 rounded-lg bg-transparent cursor-pointer p-0 shrink-0"
                      />
                      <input
                        type="text"
                        placeholder="#64748b"
                        name="colorHexText"
                        defaultValue={editingTier?.colorHex || "#64748b"}
                        className="w-full px-3 py-md bg-surface-container-low border-none rounded-lg font-mono text-center text-xs font-bold text-on-surface focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Biểu tượng Huy hiệu</label>
                    <input
                      type="text"
                      name="badgeIcon"
                      required
                      defaultValue={editingTier ? cleanIconName(editingTier.badgeIcon) : "workspace_premium"}
                      placeholder="award_star, star, v.v."
                      className="w-full px-lg py-md bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary/30 transition-all font-body-md text-on-surface"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Cho phép hoạt động</label>
                  <select
                    name="isActive"
                    defaultValue={editingTier?.isActive === false ? "false" : "true"}
                    className="w-full px-lg py-md bg-surface-container-low border-none rounded-full focus:ring-2 focus:ring-primary/30 transition-all font-body-md text-on-surface cursor-pointer"
                  >
                    <option value="true">Cho phép thăng hạng</option>
                    <option value="false">Tạm ẩn/Khóa hạng</option>
                  </select>
                </div>

              </div>

              <div className="p-md flex justify-end gap-3 border-t border-outline-variant/20 bg-surface-container-lowest shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowTierModal(false);
                    setEditingTier(null);
                  }}
                  className="px-lg py-md rounded-full border border-outline-variant/30 text-on-surface hover:bg-surface-container-low font-bold text-xs cursor-pointer transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-lg py-md rounded-full bg-primary text-on-primary hover:bg-primary/95 shadow-md shadow-primary/10 transition-all font-bold text-xs cursor-pointer"
                >
                  Lưu hạng thành viên
                </button>
              </div>
            </form>
          </div>
        </div>
      )}      {/* -------------------- MODAL: PRIVILEGE FORM -------------------- */}
      {showPrivilegeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4 animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest border border-outline-variant/30 w-[calc(100vw-2rem)] md:w-[620px] lg:w-[720px] h-[650px] max-h-[90vh] flex flex-col rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-md flex items-center justify-between border-b border-outline-variant/20 bg-primary-container/5 shrink-0">
              <h3 className="text-lg font-headline-md text-on-surface font-bold">
                {editingPrivilege ? "Chỉnh sửa đặc quyền" : "Thêm đặc quyền mới"}
              </h3>
              <button
                onClick={() => {
                  setShowPrivilegeModal(false);
                  setEditingPrivilege(null);
                }}
                className="w-8 h-8 rounded-full hover:bg-surface-container-low flex items-center justify-center transition-colors cursor-pointer text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSavePrivilege} className="flex flex-col min-h-0 flex-1">
              <div className="p-md space-y-md overflow-y-auto flex-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Tên đặc quyền</label>
                  <input
                    type="text"
                    name="name"
                    required
                    defaultValue={editingPrivilege?.name || ""}
                    placeholder="Ví dụ: Voucher hàng tháng Gold, Tặng xu sinh nhật..."
                    className="w-full px-lg py-md bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary/30 transition-all font-body-md text-on-surface"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Loại đặc quyền</label>
                    <select
                      value={privilegeType}
                      onChange={(e) => setPrivilegeType(e.target.value)}
                      className="w-full px-lg py-md bg-surface-container-low border-none rounded-full focus:ring-2 focus:ring-primary/30 transition-all font-body-md text-on-surface cursor-pointer"
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
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Trạng thái đặc quyền</label>
                    <select
                      name="isActive"
                      defaultValue={editingPrivilege?.isActive === false ? "false" : "true"}
                      className="w-full px-lg py-md bg-surface-container-low border-none rounded-full focus:ring-2 focus:ring-primary/30 transition-all font-body-md text-on-surface cursor-pointer"
                    >
                      <option value="true">Đang kích hoạt</option>
                      <option value="false">Tạm ẩn</option>
                    </select>
                  </div>
                </div>

                {/* DYNAMIC FIELDS FOR VOUCHER */}
                {privilegeType === "VOUCHER" && (
                  <div className="space-y-4 border-t border-outline-variant/20 pt-4 animate-in fade-in duration-200">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2 space-y-1.5">
                        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">Chế độ Voucher</label>
                        <div className="flex gap-6 mt-1">
                          <label className="flex items-center gap-2 text-sm text-on-surface cursor-pointer font-medium">
                            <input
                              type="radio"
                              name="voucherMode"
                              value="EXISTING"
                              checked={voucherMode === "EXISTING"}
                              onChange={() => {
                                setVoucherMode("EXISTING");
                                setVoucherCode("");
                              }}
                              className="w-4 h-4 text-primary bg-surface-container-low border-outline focus:ring-primary cursor-pointer"
                            />
                            Sử dụng Voucher có sẵn
                          </label>
                          <label className="flex items-center gap-2 text-sm text-on-surface cursor-pointer font-medium">
                            <input
                              type="radio"
                              name="voucherMode"
                              value="CUSTOM"
                              checked={voucherMode === "CUSTOM"}
                              onChange={() => {
                                setVoucherMode("CUSTOM");
                                setVoucherCode("");
                              }}
                              className="w-4 h-4 text-primary bg-surface-container-low border-outline focus:ring-primary cursor-pointer"
                            />
                            Tạo Voucher riêng mới
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {voucherMode === "EXISTING" ? (
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Chọn Voucher</label>
                          <select
                            value={voucherCode}
                            onChange={(e) => setVoucherCode(e.target.value)}
                            required
                            className="w-full px-lg py-md bg-surface-container-low border-none rounded-full focus:ring-2 focus:ring-primary/30 transition-all font-body-md text-on-surface cursor-pointer"
                          >
                            <option value="">-- Chọn Voucher --</option>
                            {vouchers.map(v => (
                              <option key={v.voucherID} value={v.code}>{v.code} - {v.name}</option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Tiền tố Mã Voucher</label>
                          <input
                            type="text"
                            required
                            placeholder="Ví dụ: VCGOLD"
                            value={voucherCode}
                            onChange={(e) => setVoucherCode(e.target.value.toUpperCase().replace(/\s/g, ""))}
                            className="w-full px-lg py-md bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary/30 transition-all font-body-md text-on-surface"
                          />
                          <span className="text-[10px] text-on-surface-variant/70 block mt-0.5">
                            Hệ thống sẽ thêm đuôi tháng năm. Ví dụ: VCGOLD_M0626
                          </span>
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Số lượng phát / tháng</label>
                        <input
                          type="number"
                          required
                          min={1}
                          value={quantity}
                          onChange={(e) => setQuantity(parseInt(e.target.value || "1"))}
                          className="w-full px-lg py-md bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary/30 transition-all font-body-md text-on-surface"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Thời hạn sử dụng (ngày)</label>
                        <input
                          type="number"
                          required
                          min={1}
                          value={validityDays}
                          onChange={(e) => setValidityDays(parseInt(e.target.value || "30"))}
                          className="w-full px-lg py-md bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary/30 transition-all font-body-md text-on-surface"
                        />
                        <span className="text-[10px] text-on-surface-variant/70 block mt-0.5">
                          Số ngày voucher có hiệu lực kể từ lúc phát
                        </span>
                      </div>
                    </div>

                    {voucherMode === "CUSTOM" && (
                      <div className="grid grid-cols-2 gap-4 bg-surface-container-low/40 p-md rounded-xl border border-outline-variant/10 animate-in slide-in-from-top-2 duration-200">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Loại giảm giá</label>
                          <select
                            value={discountType}
                            onChange={(e) => setDiscountType(e.target.value)}
                            className="w-full px-lg py-md bg-surface-container-low border-none rounded-full focus:ring-2 focus:ring-primary/30 transition-all font-body-md text-on-surface cursor-pointer"
                          >
                            <option value="PERCENT">Phần trăm (%)</option>
                            <option value="FIXED">Số tiền cố định (đ)</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Giá trị giảm</label>
                          <input
                            type="number"
                            required
                            min={1}
                            value={discountValue}
                            onChange={(e) => setDiscountValue(parseInt(e.target.value || "0"))}
                            className="w-full px-lg py-md bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary/30 transition-all font-body-md text-on-surface"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Giảm tối đa (đ)</label>
                          <input
                            type="number"
                            required={discountType === "PERCENT"}
                            disabled={discountType !== "PERCENT"}
                            value={maxDiscount}
                            onChange={(e) => setMaxDiscount(parseInt(e.target.value || "0"))}
                            className="w-full px-lg py-md bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary/30 transition-all font-body-md text-on-surface disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Đơn tối thiểu (đ)</label>
                          <input
                            type="number"
                            required
                            min={0}
                            value={minOrderValue}
                            onChange={(e) => setMinOrderValue(parseInt(e.target.value || "0"))}
                            className="w-full px-lg py-md bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary/30 transition-all font-body-md text-on-surface"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* DYNAMIC FIELDS FOR FREESHIP */}
                {privilegeType === "FREESHIP" && (
                  <div className="grid grid-cols-3 gap-4 border-t border-outline-variant/20 pt-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Số lượt / tháng</label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value || "1"))}
                        className="w-full px-lg py-md bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary/30 transition-all font-body-md text-on-surface"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Hỗ trợ tối đa (VNĐ)</label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={maxSupport}
                        onChange={(e) => setMaxSupport(parseInt(e.target.value || "0"))}
                        className="w-full px-lg py-md bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary/30 transition-all font-body-md text-on-surface"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Đơn tối thiểu (VNĐ)</label>
                      <input
                        type="number"
                        required
                        min={0}
                        value={minOrderValue}
                        onChange={(e) => setMinOrderValue(parseInt(e.target.value || "0"))}
                        className="w-full px-lg py-md bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary/30 transition-all font-body-md text-on-surface"
                      />
                    </div>
                  </div>
                )}

                {/* DYNAMIC FIELDS FOR DISCOUNT */}
                {privilegeType === "DISCOUNT" && (
                  <div className="grid grid-cols-3 gap-4 border-t border-outline-variant/20 pt-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Loại giảm giá</label>
                      <select
                        value={discountType}
                        onChange={(e) => setDiscountType(e.target.value)}
                        className="w-full px-lg py-md bg-surface-container-low border-none rounded-full focus:ring-2 focus:ring-primary/30 transition-all font-body-md text-on-surface cursor-pointer"
                      >
                        <option value="PERCENT">Phần trăm (%)</option>
                        <option value="FIXED">Số tiền cố định (đ)</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Giá trị giảm</label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={discountValue}
                        onChange={(e) => setDiscountValue(parseInt(e.target.value || "0"))}
                        className="w-full px-lg py-md bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary/30 transition-all font-body-md text-on-surface"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Giảm tối đa (đ)</label>
                      <input
                        type="number"
                        required={discountType === "PERCENT"}
                        disabled={discountType !== "PERCENT"}
                        value={maxDiscount}
                        onChange={(e) => setMaxDiscount(parseInt(e.target.value || "0"))}
                        className="w-full px-lg py-md bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary/30 transition-all font-body-md text-on-surface disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                )}

                {/* DYNAMIC FIELDS FOR CASHBACK */}
                {privilegeType === "CASHBACK" && (
                  <div className="grid grid-cols-2 gap-4 border-t border-outline-variant/20 pt-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Tỷ lệ hoàn xu (%)</label>
                      <input
                        type="number"
                        required
                        min={1}
                        max={100}
                        value={cashbackRate}
                        onChange={(e) => setCashbackRate(parseInt(e.target.value || "0"))}
                        className="w-full px-lg py-md bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary/30 transition-all font-body-md text-on-surface"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Hoàn xu tối đa (xu/tháng)</label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={maxCashback}
                        onChange={(e) => setMaxCashback(parseInt(e.target.value || "0"))}
                        className="w-full px-lg py-md bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary/30 transition-all font-body-md text-on-surface"
                      />
                    </div>
                  </div>
                )}

                {/* DYNAMIC FIELDS FOR SUPPORT */}
                {privilegeType === "SUPPORT" && (
                  <div className="p-sm bg-surface-container-low border border-outline-variant/20 rounded-lg text-xs font-semibold text-on-surface-variant/80 border-t pt-4">
                    Không cần cấu hình thông số. Hạng thành viên sở hữu đặc quyền này sẽ luôn được ưu tiên hỗ trợ trước.
                  </div>
                )}

                {/* DYNAMIC FIELDS FOR BIRTHDAY GIFT */}
                {privilegeType === "BIRTHDAY_GIFT" && (
                  <div className="space-y-4 border-t border-outline-variant/20 pt-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Loại quà tặng</label>
                      <select
                        value={birthdayGiftType}
                        onChange={(e) => setBirthdayGiftType(e.target.value)}
                        className="w-full px-lg py-md bg-surface-container-low border-none rounded-full focus:ring-2 focus:ring-primary/30 transition-all font-body-md text-on-surface cursor-pointer"
                      >
                        <option value="VOUCHER">Voucher giảm giá</option>
                        <option value="POINTS">Điểm thưởng Loyalty</option>
                        <option value="COINS">Xu trong ví</option>
                        <option value="PHYSICAL">Quà tặng vật lý</option>
                      </select>
                    </div>

                    {birthdayGiftType === "VOUCHER" && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Chọn Voucher sinh nhật</label>
                          <select
                            value={birthdayVoucherCode}
                            onChange={(e) => setBirthdayVoucherCode(e.target.value)}
                            required
                            className="w-full px-lg py-md bg-surface-container-low border-none rounded-full focus:ring-2 focus:ring-primary/30 transition-all font-body-md text-on-surface cursor-pointer"
                          >
                            <option value="">-- Chọn Voucher --</option>
                            {vouchers.map(v => (
                              <option key={v.voucherID} value={v.code}>{v.code} - {v.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Số lượng voucher</label>
                          <input
                            type="number"
                            required
                            min={1}
                            value={birthdayQuantity}
                            onChange={(e) => setBirthdayQuantity(parseInt(e.target.value || "1"))}
                            className="w-full px-lg py-md bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary/30 transition-all font-body-md text-on-surface"
                          />
                        </div>
                      </div>
                    )}

                    {birthdayGiftType === "POINTS" && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Số điểm tặng</label>
                        <input
                          type="number"
                          required
                          min={1}
                          value={birthdayPoints}
                          onChange={(e) => setBirthdayPoints(parseInt(e.target.value || "1"))}
                          className="w-full px-lg py-md bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary/30 transition-all font-body-md text-on-surface"
                        />
                      </div>
                    )}

                    {birthdayGiftType === "COINS" && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Số xu tặng</label>
                        <input
                          type="number"
                          required
                          min={1}
                          value={birthdayCoins}
                          onChange={(e) => setBirthdayCoins(parseInt(e.target.value || "1"))}
                          className="w-full px-lg py-md bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary/30 transition-all font-body-md text-on-surface"
                        />
                      </div>
                    )}

                    {birthdayGiftType === "PHYSICAL" && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Tên quà tặng vật lý</label>
                          <input
                            type="text"
                            required
                            value={birthdayGiftName}
                            onChange={(e) => setBirthdayGiftName(e.target.value)}
                            placeholder="Ví dụ: Bình nước giữ nhiệt"
                            className="w-full px-lg py-md bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary/30 transition-all font-body-md text-on-surface"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Mô tả chi tiết</label>
                          <input
                            type="text"
                            value={birthdayGiftDesc}
                            onChange={(e) => setBirthdayGiftDesc(e.target.value)}
                            placeholder="Mô tả quà tặng sinh nhật..."
                            className="w-full px-lg py-md bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary/30 transition-all font-body-md text-on-surface"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </div>

              <div className="p-md flex justify-end gap-3 border-t border-outline-variant/20 bg-surface-container-lowest shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowPrivilegeModal(false);
                    setEditingPrivilege(null);
                  }}
                  className="px-lg py-md rounded-full border border-outline-variant/30 text-on-surface hover:bg-surface-container-low font-bold text-xs cursor-pointer transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-lg py-md rounded-full bg-primary text-on-primary hover:bg-primary/95 shadow-md shadow-primary/10 transition-all font-bold text-xs cursor-pointer"
                >
                  Lưu đặc quyền
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------- MODAL: MANUAL BIRTHDAY GIFT ISSUANCE -------------------- */}
      {showManualBirthdayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4 animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest border border-outline-variant/30 w-[calc(100vw-2rem)] md:w-[620px] lg:w-[720px] shrink-0 rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-md flex items-center justify-between border-b border-outline-variant/20 bg-primary-container/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary">card_giftcard</span>
                </div>
                <h3 className="text-lg font-headline-md text-on-surface font-bold">Phát quà sinh nhật thủ công</h3>
              </div>
              <button
                onClick={() => {
                  setShowManualBirthdayModal(false);
                  setManualBirthdayUserID("");
                  setManualBirthdayUserSearchTerm("");
                }}
                className="w-8 h-8 rounded-full hover:bg-surface-container-low flex items-center justify-center transition-colors cursor-pointer text-on-surface-variant"
                disabled={submittingManualBirthday}
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleManualBirthdayIssue} className="p-md space-y-md">
              <div className="p-sm bg-primary/5 rounded-lg text-xs font-semibold text-primary/80 border border-primary/20">
                Lưu ý: Hệ thống sẽ dựa trên đặc quyền quà tặng sinh nhật (BIRTHDAY_GIFT) đã được cấu hình cho hạng thành viên hiện tại của thành viên được chọn để phát quà tương ứng. Mỗi thành viên chỉ nhận quà tối đa 1 lần/năm.
              </div>

              {/* User search */}
              <div className="space-y-1.5 relative">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Tìm kiếm thành viên</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">person</span>
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
                    className="w-full pl-10 pr-4 py-3 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary/30 transition-all font-body-md text-on-surface"
                  />
                </div>

                {/* Suggestions list */}
                {userSuggestions.length > 0 && (
                  <div className="absolute top-16 left-0 right-0 z-50 bg-surface-container-lowest border border-outline-variant rounded-md shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                    {userSuggestions.map((u) => (
                      <div
                        key={u.id}
                        onClick={() => {
                          setManualBirthdayUserID(u.id);
                          setManualBirthdayUserSearchTerm(`${u.fullName} (${u.email})`);
                          setUserSuggestions([]);
                        }}
                        className="p-3 hover:bg-surface-container-low cursor-pointer flex flex-col gap-0.5 border-b border-outline-variant last:border-0"
                      >
                        <p className="font-label-md text-on-surface text-xs font-bold">{u.fullName}</p>
                        <p className="text-[10px] text-on-surface-variant/70 font-semibold">{u.email} {u.phoneNumber && `- ${u.phoneNumber}`}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {manualBirthdayUserID && (
                <div className="p-3 bg-surface-container-low border border-outline-variant rounded-lg text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                  ID thành viên đã chọn: {manualBirthdayUserID}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-md border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => {
                    setShowManualBirthdayModal(false);
                    setManualBirthdayUserID("");
                    setManualBirthdayUserSearchTerm("");
                  }}
                  className="px-lg py-md rounded-full border border-outline-variant text-on-surface-variant hover:bg-surface-container-low font-bold text-xs cursor-pointer transition-colors"
                  disabled={submittingManualBirthday}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submittingManualBirthday || !manualBirthdayUserID}
                  className="px-lg py-md rounded-full bg-primary text-on-primary hover:opacity-90 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                  {submittingManualBirthday ? "Đang xử lý..." : "Cấp phát quà"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
