"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import { Loader } from "lucide-react";
import { Pagination } from "@/components/admin/shared/Pagination";
import { formatCurrency, formatPrivilegeDetailLines } from "@/lib/utils/formatters";
import { VoucherRedemptionConfig } from "@/components/admin/loyalty/VoucherRedemptionConfig";

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
  invoiceCode?: string;
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
  const [activeTab, setActiveTab] = useState<"dashboard" | "policies" | "tiers" | "voucher_redemptions" | "history" | "settings">("dashboard");
  const [subTab, setSubTab] = useState<"privileges" | "redeem">("privileges");
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
  const [privilegeName, setPrivilegeName] = useState("Voucher hàng tháng");
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
    if (activeTab === "voucher_redemptions") {
      fetchTiers();
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
    if (privilegeType === "BIRTHDAY_GIFT" && birthdayGiftType === "VOUCHER" && voucherMode === "EXISTING" && !birthdayVoucherCode) {
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
        configObj.mode = voucherMode;
        configObj.voucherCode = voucherMode === "CUSTOM" ? "BDAY" : birthdayVoucherCode;
        configObj.quantity = parseInt(birthdayQuantity.toString());
        configObj.validityDays = parseInt(validityDays.toString());
        if (voucherMode === "CUSTOM") {
          configObj.discountType = discountType;
          configObj.discountValue = parseFloat(discountValue.toString());
          configObj.maxDiscount = discountType === "PERCENT" ? parseFloat(maxDiscount.toString()) : 0;
          configObj.minOrderValue = parseFloat(minOrderValue.toString());
        }
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
            className="border border-error/30 text-error bg-error/5 hover:bg-error/10 px-5 py-2.5 rounded-[8px] font-bold text-xs flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">remove_circle</span> Thu hồi Đặc quyền / Điểm
          </button>
        </div>
      </header>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200 mb-6 overflow-x-auto gap-2" style={{ scrollbarWidth: "none" }}>
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`px-6 py-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${activeTab === "dashboard"
            ? "border-primary text-primary"
            : "border-transparent text-slate-500 hover:text-primary hover:border-primary/30"
            }`}
        >
          <span className="material-symbols-outlined text-[18px]">dashboard</span>
          Tổng quan
        </button>
        <button
          onClick={() => setActiveTab("policies")}
          className={`px-6 py-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${activeTab === "policies"
            ? "border-primary text-primary"
            : "border-transparent text-slate-500 hover:text-primary hover:border-primary/30"
            }`}
        >
          <span className="material-symbols-outlined text-[18px]">settings_suggest</span>
          Cơ chế Tích/Đổi
        </button>
        <button
          onClick={() => setActiveTab("tiers")}
          className={`px-6 py-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${activeTab === "tiers"
            ? "border-primary text-primary"
            : "border-transparent text-slate-500 hover:text-primary hover:border-primary/30"
            }`}
        >
          <span className="material-symbols-outlined text-[18px]">military_tech</span>
          Hạng & Đặc quyền
        </button>
        <button
          onClick={() => setActiveTab("voucher_redemptions")}
          className={`px-6 py-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${activeTab === "voucher_redemptions"
            ? "border-primary text-primary"
            : "border-transparent text-slate-500 hover:text-primary hover:border-primary/30"
            }`}
        >
          <span className="material-symbols-outlined text-[18px]">local_activity</span>
          Voucher Đổi Điểm
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-6 py-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${activeTab === "history"
            ? "border-primary text-primary"
            : "border-transparent text-slate-500 hover:text-primary hover:border-primary/30"
            }`}
        >
          <span className="material-symbols-outlined text-[18px]">history</span>
          Lịch sử & Logs
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`px-6 py-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${activeTab === "settings"
            ? "border-primary text-primary"
            : "border-transparent text-slate-500 hover:text-primary hover:border-primary/30"
            }`}
        >
          <span className="material-symbols-outlined text-[18px]">settings</span>
          Cấu hình
        </button>
      </div>

      {/* -------------------- TAB 1: DASHBOARD (Standard Bento Style) -------------------- */}
      {activeTab === "dashboard" && (
        <section className="space-y-md">
          {loadingStats ? (
            <div className="h-64 flex items-center justify-center bg-surface-container-lowest rounded-[8px] border border-outline-variant/20 shadow-sm">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : stats ? (
            <>
              {/* Dashboard Master Card */}
              <div className="bg-white rounded-[8px] border border-slate-100 shadow-sm w-full flex flex-col overflow-hidden animate-in fade-in duration-300">
                {/* Stats Grid */}
                <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-y md:divide-y-0 lg:divide-x divide-slate-100 border-b border-slate-100 bg-slate-50/30">
                {/* Issued */}
                <div className="px-6 py-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[8px] bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
                      <span className="material-symbols-outlined text-[20px]">military_tech</span>
                    </div>
                    <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Tổng điểm phát hành</span>
                  </div>
                  <span className="text-2xl font-extrabold text-slate-800">{stats.totalPointsIssued.toLocaleString()}đ</span>
                </div>

                {/* Spent */}
                <div className="px-6 py-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[8px] bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                      <span className="material-symbols-outlined text-[20px]">shopping_cart</span>
                    </div>
                    <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Điểm đã sử dụng</span>
                  </div>
                  <span className="text-2xl font-extrabold text-slate-800">{stats.totalPointsSpent.toLocaleString()}đ</span>
                </div>

                {/* Remaining */}
                <div className="px-6 py-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[8px] bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                      <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
                    </div>
                    <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Điểm tồn trong ví</span>
                  </div>
                  <span className="text-2xl font-extrabold text-slate-800">{stats.totalPointsRemaining.toLocaleString()}đ</span>
                </div>

                {/* Upgrade Rate */}
                <div className="px-6 py-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[8px] bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
                      <span className="material-symbols-outlined text-[20px]">trending_up</span>
                    </div>
                    <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Tỷ lệ thăng hạng</span>
                  </div>
                  <span className="text-2xl font-extrabold text-slate-800">{stats.upgradeRate}%</span>
                </div>

                {/* Voucher Usage Rate */}
                <div className="px-6 py-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[8px] bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                      <span className="material-symbols-outlined text-[20px]">local_activity</span>
                    </div>
                    <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Tỷ lệ sử dụng voucher</span>
                  </div>
                  <span className="text-2xl font-extrabold text-slate-800">{stats.voucherUsageRate}%</span>
                </div>

                {/* Revenue */}
                <div className="px-6 py-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[8px] bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                      <span className="material-symbols-outlined text-[20px]">monetization_on</span>
                    </div>
                    <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Doanh thu Loyalty</span>
                  </div>
                  <span className="text-2xl font-extrabold text-slate-800">{formatCurrency(stats.revenueFromLoyalty)}</span>
                </div>
              </div>

                {/* Members distributions & Leaderboard */}
                <div className="w-full grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
                {/* Member Distribution */}
                <div className="flex flex-col h-full">
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-800">Phân bố thành viên</h3>
                    <span className="material-symbols-outlined text-slate-400 text-[20px]">pie_chart</span>
                  </div>
                  <div className="p-6 space-y-5">
                    {stats.membersPerTier.map((item) => (
                      <div key={item.tierID} className="flex items-center justify-between group cursor-default">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-50 border border-slate-100 group-hover:scale-110 transition-transform">
                            <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: item.colorHex }} />
                          </div>
                          <span className="text-sm font-bold text-slate-600">{item.tierName}</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-base font-extrabold text-slate-800">{(item.count ?? 0).toLocaleString()}</span>
                          <span className="text-[10px] text-slate-400 font-semibold uppercase">khách</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Leaderboard */}
                <div className="lg:col-span-2 overflow-hidden flex flex-col h-full">
                  <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <h3 className="text-base font-bold text-slate-800">Bảng xếp hạng tích điểm cao nhất</h3>
                    <span className="material-symbols-outlined text-slate-400 text-[20px]">emoji_events</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                      <thead className="bg-white border-b border-slate-100">
                        <tr>
                          <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest w-[100px]">Hạng</th>
                          <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Khách hàng</th>
                          <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Điểm khả dụng</th>
                          <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Tổng tích lũy</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {stats.topCustomers.map((c) => (
                          <tr key={c.userID} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <span
                                className="px-3 py-1 rounded-[8px] text-[10px] font-bold text-white shadow-sm inline-block text-center min-w-[60px]"
                                style={{ backgroundColor: stats.membersPerTier.find(m => m.tierName === c.tierName)?.colorHex || "#64748b" }}
                              >
                                {c.tierName}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs shrink-0 overflow-hidden border border-slate-200">
                                  {c.avatar ? <img src={c.avatar} className="w-full h-full object-cover" /> : c.fullName.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-bold text-sm text-slate-800">{c.fullName}</p>
                                  <p className="text-[10px] text-slate-400 font-semibold">{c.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="font-bold text-sm text-slate-800">{c.availablePoints.toLocaleString()}</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="font-bold text-sm text-slate-400">{c.totalPoints.toLocaleString()}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                </div>
              </div>
            </>
          ) : (
            <div className="h-64 flex items-center justify-center bg-surface-container-lowest rounded-[8px] border border-outline-variant/20 shadow-sm text-on-surface-variant text-sm font-semibold">
              Không tìm thấy dữ liệu thống kê.
            </div>
          )}
        </section>
      )}

      {/* -------------------- TAB 2: POLICIES (Config Forms & Tables) -------------------- */}
      {activeTab === "policies" && (
        <section className="space-y-6">
          {loadingPolicies ? (
            <div className="h-64 flex items-center justify-center bg-white rounded-[8px] border border-slate-100 shadow-sm">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : (
            <div className="bg-white rounded-[8px] border border-slate-100 shadow-sm w-full grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
              {/* Accumulation Policies */}
              <div className="overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div>
                    <h3 className="text-lg text-slate-800 font-bold">Cơ chế tích điểm</h3>
                    <p className="text-slate-500 text-xs font-semibold mt-1">Cấu hình giá trị chuyển đổi từ VNĐ mua hàng sang điểm</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingEarnPolicy(null);
                      setShowEarnModal(true);
                    }}
                    className="bg-primary text-on-primary px-5 py-2.5 rounded-[8px] font-bold text-sm flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-sm cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">add_circle</span>
                    Thêm quy tắc
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  {earnPolicies.map((p) => (
                    <div key={p.policyID} className="p-5 border border-slate-100 rounded-[8px] flex items-center justify-between hover:border-slate-300 transition-all relative bg-white shadow-sm">
                      {p.isCampaign && (
                        <span className="absolute top-0 right-16 bg-rose-100 text-rose-700 text-[9px] font-bold px-3 py-1 rounded-b-lg uppercase tracking-wider">Campaign</span>
                      )}
                      <div>
                        <h4 className="text-sm text-slate-800 font-bold">{p.name}</h4>
                        <p className="text-xs text-slate-600 mt-1.5 font-medium">
                          Quy đổi: <strong className="text-emerald-600">{p.vndAmount.toLocaleString()}₫</strong> = <strong className="text-emerald-600">{p.pointsEarned} điểm</strong>
                          {p.isCampaign && ` (Hệ số: x${p.multiplier})`}
                        </p>
                        {(p.startDate || p.endDate) && (
                          <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                            Áp dụng: {p.startDate ? new Date(p.startDate).toLocaleDateString("vi-VN") : "Ngay bây giờ"} - {p.endDate ? new Date(p.endDate).toLocaleDateString("vi-VN") : "Hạn dài"}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => p.isCampaign && handleToggleEarn(p.policyID)}
                          disabled={!p.isCampaign}
                          className={`w-11 h-6 rounded-full transition-colors flex items-center p-1 ${!p.isCampaign ? "bg-secondary opacity-50 cursor-not-allowed" : "cursor-pointer"} ${(!p.isCampaign || p.isActive) ? "bg-secondary" : "bg-slate-200"}`}
                          title={!p.isCampaign ? "Không thể tắt chính sách mặc định" : ""}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${(!p.isCampaign || p.isActive) ? "translate-x-5" : ""}`} />
                        </button>
                        <button
                          onClick={() => {
                            setEditingEarnPolicy(p);
                            setShowEarnModal(true);
                          }}
                          className="w-8 h-8 rounded-[8px] flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        {p.isCampaign && (
                          <button
                            onClick={() => openConfirmDialog(
                              "Bạn có chắc chắn muốn xóa chính sách này?",
                              () => handleDeleteEarn(p.policyID)
                            )}
                            className="w-8 h-8 rounded-[8px] flex items-center justify-center text-rose-400 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
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
              <div className="overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div>
                    <h3 className="text-lg text-slate-800 font-bold">Cơ chế đổi điểm</h3>
                    <p className="text-slate-500 text-xs font-semibold mt-1">Quy định đổi điểm thành tiền giảm giá</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingRedeemPolicy(null);
                      setShowRedeemModal(true);
                    }}
                    className="bg-primary text-on-primary px-5 py-2.5 rounded-[8px] font-bold text-sm flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-sm cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">add_circle</span>
                    Thêm quy tắc
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  {redeemPolicies.map((p) => {
                    const isDefaultRedeem = p.tierID === null || p.tierID === 0 || p.name.includes("mặc định") || p.name.toLowerCase().includes("default");
                    return (
                      <div key={p.policyID} className="p-5 border border-slate-100 rounded-[8px] flex items-center justify-between hover:border-slate-300 transition-all relative bg-white shadow-sm">
                        {p.tierID && (
                          <span className="absolute top-0 right-16 bg-blue-100 text-blue-700 text-[9px] font-bold px-3 py-1 rounded-b-lg uppercase tracking-wider">Hạng: {p.tier?.tierName}</span>
                        )}
                        <div>
                          <h4 className="text-sm text-slate-800 font-bold">{p.name}</h4>
                          <p className="text-xs text-slate-600 mt-1.5 font-medium">
                            Quy đổi: <strong className="text-amber-600">{p.pointsToRedeem.toLocaleString()} điểm</strong> = <strong className="text-amber-600">-{p.discountVnd.toLocaleString()}₫</strong>
                          </p>
                          {(p.startDate || p.endDate) && (
                            <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                              Hiệu lực: {p.startDate ? new Date(p.startDate).toLocaleDateString("vi-VN") : "Ngay bây giờ"} - {p.endDate ? new Date(p.endDate).toLocaleDateString("vi-VN") : "Hạn dài"}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => !isDefaultRedeem && handleToggleRedeem(p.policyID)}
                            disabled={isDefaultRedeem}
                            className={`w-11 h-6 rounded-full transition-colors flex items-center p-1 ${isDefaultRedeem ? "bg-secondary opacity-50 cursor-not-allowed" : "cursor-pointer"} ${(isDefaultRedeem || p.isActive) ? "bg-secondary" : "bg-slate-200"}`}
                            title={isDefaultRedeem ? "Không thể tắt chính sách mặc định" : ""}
                          >
                            <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${(isDefaultRedeem || p.isActive) ? "translate-x-5" : ""}`} />
                          </button>
                          <button
                            onClick={() => {
                              setEditingRedeemPolicy(p);
                              setShowRedeemModal(true);
                            }}
                            className="w-8 h-8 rounded-[8px] flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          {!isDefaultRedeem && (
                            <button
                              onClick={() => openConfirmDialog(
                                "Bạn có chắc chắn muốn xóa chính sách này?",
                                () => handleDeleteRedeem(p.policyID)
                              )}
                              className="w-8 h-8 rounded-[8px] flex items-center justify-center text-rose-400 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
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
        <section className="space-y-6">
          {loadingTiers ? (
            <div className="h-64 flex items-center justify-center bg-white rounded-[8px] border border-slate-100 shadow-sm">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : (
            <div className="bg-white rounded-[8px] border border-slate-100 shadow-sm w-full grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
              {/* Tiers list */}
              <div className="lg:col-span-1 space-y-6 p-6 bg-slate-50/30">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-lg text-slate-800 font-bold">Hạng thành viên</h3>
                  <button
                    onClick={() => {
                      setEditingTier(null);
                      setShowTierModal(true);
                    }}
                    className="bg-primary text-on-primary px-5 py-2.5 rounded-[8px] font-bold text-sm flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-sm cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">add_circle</span>
                    Thêm mới
                  </button>
                </div>

                <div className="flex flex-col gap-3">
                  {tiers.map((t) => (
                    <div
                      key={t.tierID}
                      onClick={() => setSelectedTierForPrivileges(t.tierID)}
                      className={`p-3 rounded-[8px] border cursor-pointer transition-all flex items-center gap-3 relative overflow-hidden group shadow-sm hover:shadow-md ${selectedTierForPrivileges === t.tierID ? "border-primary ring-2 ring-primary/20 bg-primary/5" : "border-slate-200 bg-white hover:border-primary/30"}`}
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-[6px]" style={{ backgroundColor: t.colorHex }} />
                      <div className="pl-3 flex items-center gap-3 w-full min-w-0">
                        <span className="material-symbols-outlined text-[22px] shrink-0" style={{ color: t.colorHex }}>{cleanIconName(t.badgeIcon)}</span>
                        <div className="min-w-0">
                          <h4 className="text-base text-slate-800 font-bold truncate">{t.tierName}</h4>
                          <p className="text-sm text-slate-500 font-semibold">
                            {t.minPoints.toLocaleString()}đ
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detail Tier Panel */}
              <div className="lg:col-span-2 overflow-hidden flex flex-col animate-in fade-in duration-300 h-full">
                {(() => {
                  const activeTier = tiers.find(t => t.tierID === selectedTierForPrivileges);
                  return (
                    <>
                      <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                        <div>
                          <h3 className="text-lg text-slate-800 font-bold">Chi tiết Hạng thành viên</h3>
                          <p className="text-slate-500 text-sm font-semibold mt-1">
                            Đang chọn: <span className="text-primary font-bold">{activeTier?.tierName || "Chưa chọn"}</span>
                          </p>
                        </div>
                        {activeTier && (
                          <div className="flex items-center gap-3 shrink-0">
                            <button
                              onClick={() => handleToggleTier(activeTier.tierID)}
                              className={`w-11 h-6 rounded-full transition-colors flex items-center p-1 cursor-pointer ${activeTier.isActive ? "bg-secondary" : "bg-slate-200"}`}
                              title={activeTier.isActive ? "Đang hoạt động" : "Tạm khóa"}
                            >
                              <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${activeTier.isActive ? "translate-x-5" : ""}`} />
                            </button>
                            <button
                              onClick={() => {
                                setEditingTier(activeTier);
                                setShowTierModal(true);
                              }}
                              className="w-10 h-10 rounded-[8px] flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 bg-white border border-slate-200 shadow-sm cursor-pointer transition-colors"
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
                          <div className="flex border-b border-slate-100 bg-slate-50/50 p-1 gap-2 m-6 rounded-[8px] shadow-sm">
                            <button
                              onClick={() => setSubTab("privileges")}
                              className={`flex-1 py-2 text-center rounded-lg font-bold text-sm transition-all cursor-pointer ${subTab === "privileges"
                                ? "bg-primary text-on-primary shadow-sm"
                                : "text-slate-500 hover:bg-slate-100/50 hover:text-primary"
                                }`}
                            >
                              Đặc quyền
                            </button>
                            <button
                              onClick={() => setSubTab("redeem")}
                              className={`flex-1 py-2 text-center rounded-lg font-bold text-sm transition-all cursor-pointer ${subTab === "redeem"
                                ? "bg-primary text-on-primary shadow-sm"
                                : "text-slate-500 hover:bg-slate-100/50 hover:text-primary"
                                }`}
                            >
                              Đổi điểm riêng
                            </button>
                          </div>

                          {/* Sub-tab Content Area */}
                          <div className="px-6 pb-6 overflow-y-auto max-h-[400px]">
                            {/* Sub-tab 1: Privileges */}
                            {subTab === "privileges" && (
                              <div className="space-y-6">
                                <div className="flex justify-between items-center mb-2">
                                  <h4 className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Đặc quyền của hạng</h4>
                                  <button
                                    onClick={() => {
                                      setEditingPrivilege(null);
                                      setPrivilegeName("Voucher hàng tháng");
                                      setPrivilegeType("VOUCHER");
                                      setShowPrivilegeModal(true);
                                    }}
                                    className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 px-4 py-2 rounded-[8px] font-bold text-xs transition-all cursor-pointer shadow-sm"
                                  >
                                    + Thêm đặc quyền
                                  </button>
                                </div>

                                <div className="space-y-3">
                                  {privileges.length === 0 ? (
                                    <div className="text-center py-10 text-slate-400 font-bold text-sm">
                                      Chưa có đặc quyền nào được thiết lập.
                                    </div>
                                  ) : (
                                    privileges.map((p) => (
                                      <div key={p.privilegeID} className="p-4 border border-slate-100 rounded-[8px] flex items-center justify-between bg-white shadow-sm hover:border-slate-300 transition-all">
                                        <div>
                                          <h5 className="text-sm text-slate-800 font-bold">{p.name}</h5>
                                          <div className="flex gap-1.5 mt-1.5 items-center">
                                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 uppercase">{p.privilegeType}</span>
                                          </div>
                                          {p.value && (
                                            <ul className="text-xs text-slate-500 font-semibold mt-2 space-y-0.5 pl-4 list-disc">
                                              {formatPrivilegeDetailLines(p.privilegeType, p.value).map((line, idx) => (
                                                <li key={idx}>{line}</li>
                                              ))}
                                            </ul>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                          <button
                                            onClick={() => {
                                              setEditingPrivilege(p);
                                              setPrivilegeName(p.name);
                                              setPrivilegeType(p.privilegeType);
                                              setShowPrivilegeModal(true);
                                            }}
                                            className="w-8 h-8 rounded-[8px] flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                                          >
                                            <span className="material-symbols-outlined text-[16px]">edit</span>
                                          </button>
                                          <button
                                            onClick={() => openConfirmDialog(
                                              "Bạn có chắc chắn muốn xóa đặc quyền này?",
                                              () => handleDeletePrivilege(p.privilegeID)
                                            )}
                                            className="w-8 h-8 rounded-[8px] flex items-center justify-center text-rose-400 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
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
                              <div className="space-y-6">
                                <div className="flex justify-between items-center mb-2">
                                  <h4 className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Cơ chế đổi điểm riêng</h4>
                                  <button
                                    onClick={() => {
                                      setEditingRedeemPolicy(null);
                                      setShowRedeemModal(true);
                                    }}
                                    className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 px-4 py-2 rounded-[8px] font-bold text-xs transition-all cursor-pointer shadow-sm"
                                  >
                                    + Thêm quy tắc riêng
                                  </button>
                                </div>

                                <div className="space-y-3">
                                  {redeemPolicies.filter(p => p.tierID === selectedTierForPrivileges).length === 0 ? (
                                    <div className="text-center py-10 text-slate-400 font-bold text-sm">
                                      Chưa có cơ chế đổi điểm riêng. Sẽ áp dụng cơ chế đổi điểm mặc định.
                                    </div>
                                  ) : (
                                    redeemPolicies
                                      .filter(p => p.tierID === selectedTierForPrivileges)
                                      .map((p) => (
                                        <div key={p.policyID} className="p-4 border border-slate-100 rounded-[8px] flex items-center justify-between bg-white shadow-sm hover:border-slate-300 transition-all">
                                          <div>
                                            <h5 className="text-sm text-slate-800 font-bold">{p.name}</h5>
                                            <p className="text-xs text-slate-600 mt-1.5 font-medium">
                                              Quy đổi: <strong className="text-amber-600">{p.pointsToRedeem.toLocaleString()} điểm</strong> = <strong className="text-amber-600">-{p.discountVnd.toLocaleString()}₫</strong>
                                            </p>
                                          </div>
                                          <div className="flex items-center gap-2 shrink-0">
                                            <button
                                              onClick={() => handleToggleRedeem(p.policyID)}
                                              className={`w-9 h-5 rounded-full transition-colors flex items-center p-1 cursor-pointer ${p.isActive ? "bg-secondary" : "bg-slate-200"}`}
                                            >
                                              <div className={`w-3 h-3 bg-white rounded-full transition-transform shadow-sm ${p.isActive ? "translate-x-4" : ""}`} />
                                            </button>
                                            <button
                                              onClick={() => {
                                                setEditingRedeemPolicy(p);
                                                setShowRedeemModal(true);
                                              }}
                                              className="w-8 h-8 rounded-[8px] flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                                            >
                                              <span className="material-symbols-outlined text-[16px]">edit</span>
                                            </button>
                                            <button
                                              onClick={() => openConfirmDialog(
                                                "Bạn có chắc chắn muốn xóa chính sách này?",
                                                () => handleDeleteRedeem(p.policyID)
                                              )}
                                              className="w-8 h-8 rounded-[8px] flex items-center justify-center text-rose-400 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
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
                        <div className="text-center py-20 text-slate-400 font-bold text-sm flex-1 flex items-center justify-center">
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

      {/* -------------------- TAB 6: VOUCHER ĐỔI ĐIỂM (New Tab) -------------------- */}
      {activeTab === "voucher_redemptions" && (
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white rounded-[12px] shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">local_activity</span>
              Quản lý Voucher Đổi Điểm
            </h2>
            <p className="text-slate-500 text-sm mb-6">
              Thiết lập các voucher cho phép khách hàng đổi bằng điểm tích lũy. Bạn có thể gán voucher cho mọi hạng hoặc chỉ riêng một hạng cụ thể.
            </p>
            <VoucherRedemptionConfig 
              token={getHeaders().Authorization.replace("Bearer ", "")}
            />
          </div>
        </section>
      )}

      {/* -------------------- TAB 5: HISTORY & LOGS (Paginated Table) -------------------- */}
      {activeTab === "history" && (
        <section className="space-y-md">
          {/* History Master Card */}
          <div className="bg-white rounded-[8px] border border-slate-100 shadow-sm w-full flex flex-col overflow-hidden">
          {/* Sub-tabs Navigation inside History tab */}
          <div className="flex border-b border-slate-100 bg-slate-50/50 p-2 gap-2 shadow-sm">
            <button
              onClick={() => setHistorySubTab("points")}
              className={`flex-1 py-2 text-center rounded-lg font-bold text-sm transition-all cursor-pointer ${historySubTab === "points"
                ? "bg-white text-slate-800 shadow-sm border border-slate-200"
                : "text-slate-500 hover:bg-slate-100/50"
                }`}
            >
              Tích & Đổi điểm
            </button>
            <button
              onClick={() => setHistorySubTab("birthday")}
              className={`flex-1 py-2 text-center rounded-lg font-bold text-sm transition-all cursor-pointer ${historySubTab === "birthday"
                ? "bg-white text-slate-800 shadow-sm border border-slate-200"
                : "text-slate-500 hover:bg-slate-100/50"
                }`}
            >
              Quà sinh nhật
            </button>
            <button
              onClick={() => setHistorySubTab("audit")}
              className={`flex-1 py-2 text-center rounded-lg font-bold text-sm transition-all cursor-pointer ${historySubTab === "audit"
                ? "bg-white text-slate-800 shadow-sm border border-slate-200"
                : "text-slate-500 hover:bg-slate-100/50"
                }`}
            >
              Thay đổi hệ thống
            </button>
          </div>

          {/* Sub-tab 1: Points Transaction Log */}
          {historySubTab === "points" && (
            <div className="overflow-hidden flex flex-col">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800">Lịch sử tích/đổi điểm của khách hàng</h3>
              </div>

              {/* Filters */}
              <div className="p-6 border-b border-slate-100 flex flex-wrap items-center gap-4 bg-slate-50/50">
                <div className="relative min-w-[260px] flex-1">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                  <input
                    type="text"
                    placeholder="Tìm theo tên hoặc email khách hàng..."
                    value={filterSearch}
                    onChange={(e) => setFilterSearch(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-[8px] font-semibold text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>

                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-4 py-3 bg-white border border-slate-200 rounded-[8px] font-bold text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all min-w-[180px] cursor-pointer"
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
                  className="px-4 py-3 bg-white border border-slate-200 rounded-[8px] font-bold text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all min-w-[160px] cursor-pointer"
                >
                  <option value="">Hạng hiện tại</option>
                  {tiers.map(t => (
                    <option key={t.tierID} value={t.tierID}>{t.tierName}</option>
                  ))}
                </select>
              </div>

              <div className="overflow-x-auto flex-1">
                <table className="w-full border-collapse text-left">
                  <thead className="bg-slate-50/50 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Khách hàng</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Hạng</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Biến động</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Loại</th>
                      <th className="px-8 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Mô tả & Thời gian</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {loadingHistory ? (
                      <tr>
                        <td colSpan={5} className="text-center py-20">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
                        </td>
                      </tr>
                    ) : history.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-20 text-slate-400 font-bold text-sm">
                          Không tìm thấy lịch sử nào.
                        </td>
                      </tr>
                    ) : (
                      history.map((h) => {
                        const isExpanded = expandedHistoryId === h.historyID;
                        return (
                          <React.Fragment key={h.historyID}>
                            <tr className="hover:bg-slate-50/50 transition-colors group">
                              <td className="px-6 py-4">
                                <p className="font-bold text-sm text-slate-800">{h.fullName}</p>
                                <p className="text-[10px] text-slate-400 font-semibold">{h.email}</p>
                              </td>
                              <td className="px-6 py-4">
                                <span className="font-bold text-sm text-slate-600">{h.tierName}</span>
                              </td>
                              <td className={`px-6 py-4 text-right font-bold text-sm ${h.amount > 0 ? "text-emerald-600" : h.amount < 0 ? "text-error" : "text-slate-400"}`}>
                                {h.amount > 0 ? `+${h.amount.toLocaleString()}` : h.amount.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className={`px-2 py-0.5 rounded-[8px] text-[9px] font-bold ${h.transactionType === "EARN" ? "bg-emerald-100 text-emerald-700" :
                                  h.transactionType === "SPEND" ? "bg-amber-100 text-amber-700" :
                                    h.transactionType === "REVOKE" ? "bg-error/10 text-error" :
                                      "bg-slate-100 text-slate-600"
                                  }`}>
                                  {h.transactionType}
                                </span>
                              </td>
                              <td className="px-8 py-4 max-w-[220px]">
                                <p className="font-bold text-sm text-slate-800 truncate">{h.description}</p>
                                <div className="mt-1 flex items-center justify-between gap-2">
                                  <p className="text-[10px] text-slate-400 font-semibold">{new Date(h.createdAt).toLocaleString("vi-VN")}</p>
                                  <button
                                    type="button"
                                    onClick={() => setExpandedHistoryId(isExpanded ? null : h.historyID)}
                                    className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
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
                              <tr className="bg-slate-50/30">
                                <td colSpan={5} className="px-8 pb-4">
                                  <div className="p-4 rounded-[8px] border border-slate-100 bg-white shadow-sm mt-2">
                                    <div className="flex flex-wrap gap-4 text-xs text-slate-500 font-semibold">
                                      <span>Thời gian: {new Date(h.createdAt).toLocaleString("vi-VN")}</span>
                                      {(h.invoiceCode || h.invoiceID) && <span>Hóa đơn: #{h.invoiceCode || h.invoiceID}</span>}
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
            <div className="overflow-hidden flex flex-col">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Lịch sử nhận quà sinh nhật</h3>
                  <p className="text-xs text-slate-400 font-semibold mt-1">Danh sách thành viên nhận quà và trạng thái cấp phát hàng năm</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={handleTriggerBirthdayJob}
                    disabled={triggeringBirthdayJob}
                    className="border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 px-5 py-2.5 rounded-[8px] font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                    {triggeringBirthdayJob ? "Đang chạy Job..." : "Chạy Job sinh nhật hôm nay"}
                  </button>
                  <button
                    onClick={() => setShowManualBirthdayModal(true)}
                    className="bg-primary text-white px-5 py-2.5 rounded-[8px] font-bold text-xs flex items-center gap-1.5 hover:opacity-90 transition-all shadow-md cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">card_giftcard</span>
                    Phát quà thủ công
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="p-6 border-b border-slate-100 flex flex-wrap items-center gap-4 bg-slate-50/50">
                <div className="relative min-w-[260px] flex-1">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                  <input
                    type="text"
                    placeholder="Tìm kiếm thành viên..."
                    value={birthdaySearch}
                    onChange={(e) => setBirthdaySearch(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-[8px] font-semibold text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div className="overflow-x-auto flex-1">
                <table className="w-full border-collapse">
                  <thead className="bg-slate-50/50 border-b border-slate-100 text-left">
                    <tr>
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Thành viên</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Năm nhận</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Loại quà</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Giá trị quà</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Người phát</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Thời gian nhận</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-sm">
                    {loadingBirthdayLogs ? (
                      <tr>
                        <td colSpan={6} className="text-center py-20">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
                        </td>
                      </tr>
                    ) : birthdayLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-20 text-slate-400 font-bold">
                          Không tìm thấy lịch sử quà sinh nhật nào.
                        </td>
                      </tr>
                    ) : (
                      birthdayLogs.map((l) => (
                        <tr key={l.giftLogID} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-bold text-slate-800">{l.fullName}</p>
                            <p className="text-[10px] text-slate-400 font-semibold">{l.email}</p>
                          </td>
                          <td className="px-6 py-4 text-center font-bold text-slate-600">
                            {l.year}
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-0.5 rounded-[8px] text-[9px] font-bold bg-slate-100 text-slate-600 uppercase">
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
            <div className="glass-card rounded-[8px] shadow-sm border border-outline-variant/20 overflow-hidden bg-surface-container-lowest flex flex-col h-full">
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
                    <div key={l.logID} className="p-md border border-outline-variant/30 rounded-[8px] bg-surface-container-low/30 flex flex-col gap-2">
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
          </div>
        </section>
      )}

      {/* -------------------- TAB 6: SETTINGS (Loyalty Settings Configuration) -------------------- */}
      {activeTab === "settings" && (
        <section className="space-y-md animate-in fade-in duration-200">
          {loadingSettings ? (
            <div className="p-8 flex flex-col items-center justify-center bg-white rounded-[8px] border border-slate-100 shadow-sm w-full">
              <Loader className="animate-spin text-primary mb-2" size={24} />
              <span className="text-slate-400 font-bold text-xs">Đang tải cấu hình...</span>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-[8px] shadow-sm border border-slate-100 w-full animate-in fade-in duration-200">
              <form onSubmit={handleSaveSettings} className="space-y-6">
                {/* Reward Point Enable Toggle */}
                <div className="flex items-center justify-between p-6 bg-slate-50/50 rounded-[8px] border border-slate-100">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-700 block">Kích hoạt tặng điểm thưởng Loyalty</span>
                    <span className="text-[10px] text-slate-400 font-semibold block">Tự động tặng điểm khi người dùng viết đánh giá chất lượng sản phẩm</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
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
                  <>
                    {/* Settings parameters */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Basic Review Points */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase block tracking-wider">Thưởng đánh giá cơ bản (chỉ có chữ)</label>
                        <div className="relative">
                          <input
                            type="number"
                            value={loyaltySettings.reviewRewardPoints}
                            onChange={(e) => setLoyaltySettings({ ...loyaltySettings, reviewRewardPoints: parseInt(e.target.value) || 0 })}
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-[8px] font-semibold text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                          />
                          <span className="absolute inset-y-0 right-4 flex items-center text-[10px] font-bold text-slate-400 uppercase">điểm</span>
                        </div>
                      </div>

                      {/* Review with Image Points */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase block tracking-wider">Thưởng đánh giá có kèm HÌNH ẢNH</label>
                        <div className="relative">
                          <input
                            type="number"
                            value={loyaltySettings.reviewWithImageRewardPoints}
                            onChange={(e) => setLoyaltySettings({ ...loyaltySettings, reviewWithImageRewardPoints: parseInt(e.target.value) || 0 })}
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-[8px] font-semibold text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                          />
                          <span className="absolute inset-y-0 right-4 flex items-center text-[10px] font-bold text-slate-400 uppercase">điểm</span>
                        </div>
                      </div>

                      {/* Review with Video Points */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase block tracking-wider">Thưởng đánh giá có kèm VIDEO</label>
                        <div className="relative">
                          <input
                            type="number"
                            value={loyaltySettings.reviewWithVideoRewardPoints}
                            onChange={(e) => setLoyaltySettings({ ...loyaltySettings, reviewWithVideoRewardPoints: parseInt(e.target.value) || 0 })}
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-[8px] font-semibold text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                          />
                          <span className="absolute inset-y-0 right-4 flex items-center text-[10px] font-bold text-slate-400 uppercase">điểm</span>
                        </div>
                      </div>

                      {/* Minimum Character count */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase block tracking-wider">Số ký tự tối thiểu để nhận quà</label>
                        <div className="relative">
                          <input
                            type="number"
                            value={loyaltySettings.minimumReviewChars}
                            onChange={(e) => setLoyaltySettings({ ...loyaltySettings, minimumReviewChars: parseInt(e.target.value) || 0 })}
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-[8px] font-semibold text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                          />
                          <span className="absolute inset-y-0 right-4 flex items-center text-[10px] font-bold text-slate-400 uppercase">ký tự</span>
                        </div>
                      </div>

                      {/* Required Rating stars */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase block tracking-wider">Số sao tối thiểu để nhận quà</label>
                        <select
                          value={loyaltySettings.requiredRatingForReward}
                          onChange={(e) => setLoyaltySettings({ ...loyaltySettings, requiredRatingForReward: parseInt(e.target.value) })}
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-[8px] font-bold text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                        >
                          <option value="5">⭐ 5 Sao</option>
                          <option value="4">⭐ 4 Sao</option>
                          <option value="3">⭐ 3 Sao</option>
                          <option value="2">⭐ 2 Sao</option>
                          <option value="1">⭐ 1 Sao</option>
                        </select>
                      </div>

                      {/* Edit Time limit */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase block tracking-wider">Thời gian tối đa để chỉnh sửa đánh giá</label>
                        <div className="relative">
                          <input
                            type="number"
                            value={loyaltySettings.allowEditReviewTimeLimitMinutes}
                            onChange={(e) => setLoyaltySettings({ ...loyaltySettings, allowEditReviewTimeLimitMinutes: parseInt(e.target.value) || 0 })}
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-[8px] font-semibold text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                          />
                          <span className="absolute inset-y-0 right-4 flex items-center text-[10px] font-bold text-slate-400 uppercase">phút</span>
                        </div>
                      </div>

                      {/* Max Review days limit after order receipt */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase block tracking-wider">Số ngày tối đa để đánh giá sau khi mua</label>
                        <div className="relative">
                          <input
                            type="number"
                            value={loyaltySettings.maxReviewDaysAfterReceipt}
                            onChange={(e) => setLoyaltySettings({ ...loyaltySettings, maxReviewDaysAfterReceipt: parseInt(e.target.value) || 0 })}
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-[8px] font-semibold text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                          />
                          <span className="absolute inset-y-0 right-4 flex items-center text-[10px] font-bold text-slate-400 uppercase">ngày</span>
                        </div>
                      </div>

                      {/* Require Delivery Verification */}
                      <div className="space-y-2 flex flex-col justify-end">
                        <label className="flex items-center gap-2 select-none cursor-pointer border border-slate-200 p-3.5 rounded-[8px] bg-white hover:bg-slate-50 transition-colors">
                          <input
                            type="checkbox"
                            checked={loyaltySettings.requireDeliveryToReview}
                            onChange={(e) => setLoyaltySettings({ ...loyaltySettings, requireDeliveryToReview: e.target.checked })}
                            className="rounded border-slate-300 text-primary focus:ring-primary/20"
                          />
                          <span className="text-xs font-bold text-slate-600">Yêu cầu hoàn thành giao hàng mới được đánh giá</span>
                        </label>
                      </div>
                    </div>
                  </>
                )}

                {/* Save Button */}
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="w-full bg-primary hover:bg-primary/95 text-white py-3 rounded-[8px] font-bold text-sm hover:scale-[1.01] active:scale-95 transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2 mt-6 cursor-pointer"
                >
                  {savingSettings && <Loader className="animate-spin" size={16} />}
                  Lưu cấu hình cài đặt
                </button>
              </form>
            </div>
          )}
        </section>
      )}

      {/* -------------------- MODAL: CONFIRM ACTION -------------------- */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4 animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest border border-outline-variant/30 w-[calc(100vw-2rem)] md:w-[520px] lg:w-[620px] shrink-0 rounded-[8px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
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
                  className="px-lg py-md rounded-[8px] border border-outline-variant text-on-surface-variant hover:bg-surface-container-low font-bold text-xs cursor-pointer transition-colors"
                >
                  {confirmDialog.cancelLabel || "Hủy"}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDialog}
                  className="px-lg py-md rounded-[8px] bg-error text-on-error hover:opacity-90 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-md active:scale-95"
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
          <div className="bg-surface-container-lowest border border-outline-variant/30 w-[calc(100vw-2rem)] md:w-[620px] lg:w-[720px] h-[550px] max-h-[90vh] flex flex-col rounded-[8px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
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
                        className="w-full px-lg py-md bg-surface-container-low border-none rounded-[8px] focus:ring-2 focus:ring-primary/30 transition-all font-body-md text-on-surface cursor-pointer"
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
                          className="w-full px-lg py-md bg-surface-container-low border-none rounded-[8px] focus:ring-2 focus:ring-primary/30 transition-all font-body-md text-on-surface cursor-pointer"
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
                  className="px-lg py-md rounded-[8px] border border-outline-variant text-on-surface-variant hover:bg-surface-container-low font-bold text-xs cursor-pointer transition-colors"
                  disabled={submittingRevocation}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submittingRevocation || !revocationUserID || (revocationType === "VOUCHER" && !selectedUserVoucherId)}
                  className="px-lg py-md rounded-[8px] bg-error text-on-error hover:opacity-90 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-md active:scale-95 disabled:opacity-50"
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
          <div className="bg-white border border-slate-100 w-[calc(100vw-2rem)] md:w-[620px] lg:w-[720px] h-[520px] max-h-[90vh] flex flex-col rounded-[8px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 flex items-center justify-between border-b border-slate-100 bg-slate-50/50 shrink-0">
              <h3 className="text-xl text-slate-800 font-extrabold">
                {editingEarnPolicy ? "Cập nhật cơ chế tích điểm" : "Thêm cơ chế tích điểm mới"}
              </h3>
              <button
                onClick={() => {
                  setShowEarnModal(false);
                  setEditingEarnPolicy(null);
                }}
                className="w-10 h-10 rounded-full hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer text-slate-500 hover:text-slate-800"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveEarn} className="flex flex-col min-h-0 flex-1">
              <div className="p-6 space-y-6 overflow-y-auto flex-1">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 block mb-2">Tên chính sách</label>
                  <input
                    type="text"
                    name="name"
                    required
                    defaultValue={editingEarnPolicy?.name || ""}
                    placeholder="Ví dụ: Tích điểm mặc định, Tích điểm lễ Tết..."
                    className="w-full px-5 py-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-[8px] focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-400/10 outline-none transition-all text-sm font-semibold text-slate-800 placeholder-slate-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700 block mb-2">Số tiền mua hàng (VND)</label>
                    <input
                      type="number"
                      name="vndAmount"
                      required
                      min={1}
                      defaultValue={editingEarnPolicy?.vndAmount ?? 1000}
                      className="w-full px-5 py-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-[8px] focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-400/10 outline-none transition-all text-sm font-semibold text-slate-800 placeholder-slate-400"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700 block mb-2">Số điểm nhận được</label>
                    <input
                      type="number"
                      name="pointsEarned"
                      required
                      min={1}
                      defaultValue={editingEarnPolicy?.pointsEarned ?? 10}
                      className="w-full px-5 py-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-[8px] focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-400/10 outline-none transition-all text-sm font-semibold text-slate-800 placeholder-slate-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700 block mb-2">Loại chính sách</label>
                    <select
                      name="isCampaign"
                      defaultValue={editingEarnPolicy?.isCampaign ? "true" : "false"}
                      className="w-full px-5 py-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-[8px] focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-400/10 outline-none transition-all text-sm font-semibold text-slate-800 cursor-pointer"
                    >
                      <option value="false">Mặc định hệ thống</option>
                      <option value="true">Chiến dịch tạm thời</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700 block mb-2">Hệ số nhân (Campaign)</label>
                    <input
                      type="number"
                      step="0.01"
                      name="multiplier"
                      required
                      min="0.1"
                      defaultValue={editingEarnPolicy?.multiplier ?? 1.0}
                      className="w-full px-5 py-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-[8px] focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-400/10 outline-none transition-all text-sm font-semibold text-slate-800 placeholder-slate-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700 block mb-2">Ngày bắt đầu</label>
                    <input
                      type="date"
                      name="startDate"
                      defaultValue={editingEarnPolicy?.startDate ? editingEarnPolicy.startDate.split("T")[0] : ""}
                      className="w-full px-5 py-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-[8px] focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-400/10 outline-none transition-all text-sm font-semibold text-slate-800 placeholder-slate-400"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700 block mb-2">Ngày kết thúc</label>
                    <input
                      type="date"
                      name="endDate"
                      defaultValue={editingEarnPolicy?.endDate ? editingEarnPolicy.endDate.split("T")[0] : ""}
                      className="w-full px-5 py-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-[8px] focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-400/10 outline-none transition-all text-sm font-semibold text-slate-800 placeholder-slate-400"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 block mb-2">Trạng thái kích hoạt</label>
                  <select
                    name="isActive"
                    defaultValue={editingEarnPolicy?.isActive === false ? "false" : "true"}
                    className="w-full px-5 py-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-[8px] focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-400/10 outline-none transition-all text-sm font-semibold text-slate-800 cursor-pointer"
                  >
                    <option value="true">Đang kích hoạt</option>
                    <option value="false">Tạm khóa</option>
                  </select>
                </div>

              </div>

              <div className="p-6 flex justify-end gap-3 border-t border-slate-100 bg-slate-50/50 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowEarnModal(false);
                    setEditingEarnPolicy(null);
                  }}
                  className="px-6 py-2.5 rounded-[8px] bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800 font-bold text-sm transition-colors cursor-pointer border-none"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-[8px] bg-primary text-on-primary font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-sm hover:shadow-md cursor-pointer"
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
          <div className="bg-white border border-slate-100 w-[calc(100vw-2rem)] md:w-[620px] lg:w-[720px] h-[520px] max-h-[90vh] flex flex-col rounded-[8px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 flex items-center justify-between border-b border-slate-100 bg-slate-50/50 shrink-0">
              <h3 className="text-xl text-slate-800 font-extrabold">
                {editingRedeemPolicy ? "Cập nhật quy tắc đổi điểm" : "Thêm quy tắc đổi điểm mới"}
              </h3>
              <button
                onClick={() => {
                  setShowRedeemModal(false);
                  setEditingRedeemPolicy(null);
                }}
                className="w-10 h-10 rounded-full hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer text-slate-500 hover:text-slate-800"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveRedeem} className="flex flex-col min-h-0 flex-1">
              <div className="p-6 space-y-6 overflow-y-auto flex-1">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 block mb-2">Tên quy tắc</label>
                  <input
                    type="text"
                    name="name"
                    required
                    defaultValue={editingRedeemPolicy?.name || ""}
                    placeholder="Ví dụ: Đổi điểm mặc định, Tỷ lệ ưu đãi hạng Vàng..."
                    className="w-full px-5 py-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-[8px] focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-400/10 outline-none transition-all text-sm font-semibold text-slate-800 placeholder-slate-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700 block mb-2">Số điểm đổi</label>
                    <input
                      type="number"
                      name="pointsToRedeem"
                      required
                      min={1}
                      defaultValue={editingRedeemPolicy?.pointsToRedeem ?? 1}
                      className="w-full px-5 py-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-[8px] focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-400/10 outline-none transition-all text-sm font-semibold text-slate-800 placeholder-slate-400"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700 block mb-2">Tiền giảm được (VND)</label>
                    <input
                      type="number"
                      step="0.1"
                      name="discountVnd"
                      required
                      min={0.1}
                      defaultValue={editingRedeemPolicy?.discountVnd ?? 1}
                      className="w-full px-5 py-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-[8px] focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-400/10 outline-none transition-all text-sm font-semibold text-slate-800 placeholder-slate-400"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 block mb-2">Áp dụng cho hạng</label>
                  <select
                    name="tierID"
                    defaultValue={editingRedeemPolicy ? (editingRedeemPolicy.tierID || "") : (selectedTierForPrivileges || "")}
                    disabled={selectedTierForPrivileges !== null}
                    className="w-full px-5 py-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-[8px] focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-400/10 outline-none transition-all text-sm font-semibold text-slate-800 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
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
                    <label className="text-sm font-bold text-slate-700 block mb-2">Ngày bắt đầu</label>
                    <input
                      type="date"
                      name="startDate"
                      defaultValue={editingRedeemPolicy?.startDate ? editingRedeemPolicy.startDate.split("T")[0] : ""}
                      className="w-full px-5 py-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-[8px] focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-400/10 outline-none transition-all text-sm font-semibold text-slate-800 placeholder-slate-400"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700 block mb-2">Ngày kết thúc</label>
                    <input
                      type="date"
                      name="endDate"
                      defaultValue={editingRedeemPolicy?.endDate ? editingRedeemPolicy.endDate.split("T")[0] : ""}
                      className="w-full px-5 py-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-[8px] focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-400/10 outline-none transition-all text-sm font-semibold text-slate-800 placeholder-slate-400"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 block mb-2">Trạng thái hoạt động</label>
                  <select
                    name="isActive"
                    defaultValue={editingRedeemPolicy?.isActive === false ? "false" : "true"}
                    className="w-full px-5 py-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-[8px] focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-400/10 outline-none transition-all text-sm font-semibold text-slate-800 cursor-pointer"
                  >
                    <option value="true">Đang hoạt động</option>
                    <option value="false">Tạm khóa</option>
                  </select>
                </div>

              </div>

              <div className="p-6 flex justify-end gap-3 border-t border-slate-100 bg-slate-50/50 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowRedeemModal(false);
                    setEditingRedeemPolicy(null);
                  }}
                  className="px-6 py-2.5 rounded-[8px] bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800 font-bold text-sm transition-colors cursor-pointer border-none"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-[8px] bg-primary text-on-primary font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-sm hover:shadow-md cursor-pointer"
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
          <div className="bg-white border border-slate-100 w-[calc(100vw-2rem)] md:w-[620px] lg:w-[720px] h-[480px] max-h-[90vh] flex flex-col rounded-[8px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 flex items-center justify-between border-b border-slate-100 bg-slate-50/50 shrink-0">
              <h3 className="text-xl text-slate-800 font-extrabold">
                {editingTier ? "Chỉnh sửa hạng thành viên" : "Tạo hạng thành viên mới"}
              </h3>
              <button
                onClick={() => {
                  setShowTierModal(false);
                  setEditingTier(null);
                }}
                className="w-10 h-10 rounded-full hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer text-slate-500 hover:text-slate-800"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveTier} className="flex flex-col min-h-0 flex-1">
              <div className="p-6 space-y-6 overflow-y-auto flex-1">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 block mb-2">Tên hạng</label>
                  <input
                    type="text"
                    name="tierName"
                    required
                    defaultValue={editingTier?.tierName || ""}
                    placeholder="Ví dụ: Bạc, Vàng, Kim Cương..."
                    className="w-full px-5 py-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-[8px] focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-400/10 outline-none transition-all text-sm font-semibold text-slate-800 placeholder-slate-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 block mb-2">Ngưỡng điểm tối thiểu (Min Points)</label>
                  <input
                    type="number"
                    name="minPoints"
                    required
                    min={0}
                    defaultValue={editingTier?.minPoints ?? 0}
                    className="w-full px-5 py-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-[8px] focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-400/10 outline-none transition-all text-sm font-semibold text-slate-800 placeholder-slate-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700 block mb-2">Màu sắc hiển thị</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        name="colorHex"
                        defaultValue={editingTier?.colorHex || "#64748b"}
                        className="w-12 h-12 border border-slate-200 rounded-[8px] bg-slate-50 cursor-pointer p-1 shrink-0"
                      />
                      <input
                        type="text"
                        placeholder="#64748b"
                        name="colorHexText"
                        defaultValue={editingTier?.colorHex || "#64748b"}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-[8px] font-mono text-center text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700 block mb-2">Biểu tượng Huy hiệu</label>
                    <input
                      type="text"
                      name="badgeIcon"
                      required
                      defaultValue={editingTier ? cleanIconName(editingTier.badgeIcon) : "workspace_premium"}
                      placeholder="award_star, star, v.v."
                      className="w-full px-5 py-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-[8px] focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-400/10 outline-none transition-all text-sm font-semibold text-slate-800 placeholder-slate-400"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 block mb-2">Cho phép hoạt động</label>
                  <select
                    name="isActive"
                    defaultValue={editingTier?.isActive === false ? "false" : "true"}
                    className="w-full px-5 py-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-[8px] focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-400/10 outline-none transition-all text-sm font-semibold text-slate-800 cursor-pointer"
                  >
                    <option value="true">Cho phép thăng hạng</option>
                    <option value="false">Tạm ẩn/Khóa hạng</option>
                  </select>
                </div>

              </div>

              <div className="p-6 flex justify-end gap-3 border-t border-slate-100 bg-slate-50/50 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowTierModal(false);
                    setEditingTier(null);
                  }}
                  className="px-6 py-2.5 rounded-[8px] bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800 font-bold text-sm transition-colors cursor-pointer border-none"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-[8px] bg-primary text-on-primary font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-sm hover:shadow-md cursor-pointer"
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
          <div className="bg-white border border-slate-100 w-[calc(100vw-2rem)] md:w-[620px] lg:w-[720px] h-[650px] max-h-[90vh] flex flex-col rounded-[8px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 flex items-center justify-between border-b border-slate-100 bg-slate-50/50 shrink-0">
              <h3 className="text-xl text-slate-800 font-extrabold">
                {editingPrivilege ? "Chỉnh sửa đặc quyền" : "Thêm đặc quyền mới"}
              </h3>
              <button
                onClick={() => {
                  setShowPrivilegeModal(false);
                  setEditingPrivilege(null);
                }}
                className="w-10 h-10 rounded-full hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer text-slate-500 hover:text-slate-800"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSavePrivilege} className="flex flex-col min-h-0 flex-1">
              <div className="p-6 space-y-6 overflow-y-auto flex-1">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 block mb-2">Tên đặc quyền</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={privilegeName}
                    onChange={(e) => setPrivilegeName(e.target.value)}
                    placeholder="Ví dụ: Voucher hàng tháng Gold, Tặng xu sinh nhật..."
                    className="w-full px-5 py-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-[8px] focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-400/10 outline-none transition-all text-sm font-semibold text-slate-800 placeholder-slate-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700 block mb-2">Loại đặc quyền</label>
                    <select
                      value={privilegeType}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPrivilegeType(val);
                        const defaultNames: Record<string, string> = {
                          "VOUCHER": "Voucher hàng tháng",
                          "FREESHIP": "Miễn phí vận chuyển",
                          "DISCOUNT": "Giảm giá đơn hàng",
                          "CASHBACK": "Hoàn xu / tích lũy",
                          "SUPPORT": "Ưu tiên hỗ trợ",
                          "BIRTHDAY_GIFT": "Quà tặng sinh nhật"
                        };
                        setPrivilegeName(defaultNames[val] || "");
                      }}
                      className="w-full px-5 py-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-[8px] focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-400/10 outline-none transition-all text-sm font-semibold text-slate-800 cursor-pointer"
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
                    <label className="text-sm font-bold text-slate-700 block mb-2">Trạng thái đặc quyền</label>
                    <select
                      name="isActive"
                      defaultValue={editingPrivilege?.isActive === false ? "false" : "true"}
                      className="w-full px-5 py-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-[8px] focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-400/10 outline-none transition-all text-sm font-semibold text-slate-800 cursor-pointer"
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
                        <label className="text-sm font-bold text-slate-700 block mb-2 block">Chế độ Voucher</label>
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
                          <label className="text-sm font-bold text-slate-700 block mb-2">Chọn Voucher</label>
                          <select
                            value={voucherCode}
                            onChange={(e) => setVoucherCode(e.target.value)}
                            required
                            className="w-full px-5 py-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-[8px] focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-400/10 outline-none transition-all text-sm font-semibold text-slate-800 cursor-pointer"
                          >
                            <option value="">-- Chọn Voucher --</option>
                            {vouchers.map(v => (
                              <option key={v.voucherID} value={v.code}>{v.code} - {v.name}</option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <label className="text-sm font-bold text-slate-700 block mb-2">Tiền tố Mã Voucher</label>
                          <input
                            type="text"
                            required
                            placeholder="Ví dụ: VCGOLD"
                            value={voucherCode}
                            onChange={(e) => setVoucherCode(e.target.value.toUpperCase().replace(/\s/g, ""))}
                            className="w-full px-5 py-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-[8px] focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-400/10 outline-none transition-all text-sm font-semibold text-slate-800 placeholder-slate-400"
                          />
                          <span className="text-xs text-slate-500 font-medium block mt-0.5">
                            Hệ thống sẽ thêm đuôi tháng năm. Ví dụ: VCGOLD_M0626
                          </span>
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <label className="text-sm font-bold text-slate-700 block mb-2">Số lượng phát / tháng</label>
                        <input
                          type="number"
                          required
                          min={1}
                          value={quantity}
                          onChange={(e) => setQuantity(parseInt(e.target.value || "1"))}
                          className="w-full px-5 py-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-[8px] focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-400/10 outline-none transition-all text-sm font-semibold text-slate-800 placeholder-slate-400"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-sm font-bold text-slate-700 block mb-2">Thời hạn sử dụng (ngày)</label>
                        <input
                          type="number"
                          required
                          min={1}
                          value={validityDays}
                          onChange={(e) => setValidityDays(parseInt(e.target.value || "30"))}
                          className="w-full px-5 py-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-[8px] focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-400/10 outline-none transition-all text-sm font-semibold text-slate-800 placeholder-slate-400"
                        />
                        <span className="text-xs text-slate-500 font-medium block mt-0.5">
                          Số ngày voucher có hiệu lực kể từ lúc phát
                        </span>
                      </div>
                    </div>

                    {voucherMode === "CUSTOM" && (
                      <div className="grid grid-cols-2 gap-4 bg-surface-container-low/40 p-md rounded-[8px] border border-outline-variant/10 animate-in slide-in-from-top-2 duration-200">
                        <div className="space-y-1.5">
                          <label className="text-sm font-bold text-slate-700 block mb-2">Loại giảm giá</label>
                          <select
                            value={discountType}
                            onChange={(e) => setDiscountType(e.target.value)}
                            className="w-full px-5 py-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-[8px] focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-400/10 outline-none transition-all text-sm font-semibold text-slate-800 cursor-pointer"
                          >
                            <option value="PERCENT">Phần trăm (%)</option>
                            <option value="FIXED">Số tiền cố định (đ)</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-sm font-bold text-slate-700 block mb-2">Giá trị giảm</label>
                          <input
                            type="number"
                            required
                            min={1}
                            value={discountValue}
                            onChange={(e) => setDiscountValue(parseInt(e.target.value || "0"))}
                            className="w-full px-5 py-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-[8px] focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-400/10 outline-none transition-all text-sm font-semibold text-slate-800 placeholder-slate-400"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-sm font-bold text-slate-700 block mb-2">Giảm tối đa (đ)</label>
                          <input
                            type="number"
                            required={discountType === "PERCENT"}
                            disabled={discountType !== "PERCENT"}
                            value={maxDiscount}
                            onChange={(e) => setMaxDiscount(parseInt(e.target.value || "0"))}
                            className="w-full px-5 py-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-[8px] focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-400/10 outline-none transition-all text-sm font-semibold text-slate-800 placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-sm font-bold text-slate-700 block mb-2">Đơn tối thiểu (đ)</label>
                          <input
                            type="number"
                            required
                            min={0}
                            value={minOrderValue}
                            onChange={(e) => setMinOrderValue(parseInt(e.target.value || "0"))}
                            className="w-full px-5 py-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-[8px] focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-400/10 outline-none transition-all text-sm font-semibold text-slate-800 placeholder-slate-400"
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
                      <label className="text-sm font-bold text-slate-700 block mb-2">Số lượt / tháng</label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value || "1"))}
                        className="w-full px-5 py-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-[8px] focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-400/10 outline-none transition-all text-sm font-semibold text-slate-800 placeholder-slate-400"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-700 block mb-2">Hỗ trợ tối đa (VNĐ)</label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={maxSupport}
                        onChange={(e) => setMaxSupport(parseInt(e.target.value || "0"))}
                        className="w-full px-5 py-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-[8px] focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-400/10 outline-none transition-all text-sm font-semibold text-slate-800 placeholder-slate-400"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-700 block mb-2">Đơn tối thiểu (VNĐ)</label>
                      <input
                        type="number"
                        required
                        min={0}
                        value={minOrderValue}
                        onChange={(e) => setMinOrderValue(parseInt(e.target.value || "0"))}
                        className="w-full px-5 py-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-[8px] focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-400/10 outline-none transition-all text-sm font-semibold text-slate-800 placeholder-slate-400"
                      />
                    </div>
                  </div>
                )}

                {/* DYNAMIC FIELDS FOR DISCOUNT */}
                {privilegeType === "DISCOUNT" && (
                  <div className="grid grid-cols-3 gap-4 border-t border-outline-variant/20 pt-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-700 block mb-2">Loại giảm giá</label>
                      <select
                        value={discountType}
                        onChange={(e) => setDiscountType(e.target.value)}
                        className="w-full px-5 py-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-[8px] focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-400/10 outline-none transition-all text-sm font-semibold text-slate-800 cursor-pointer"
                      >
                        <option value="PERCENT">Phần trăm (%)</option>
                        <option value="FIXED">Số tiền cố định (đ)</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-700 block mb-2">Giá trị giảm</label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={discountValue}
                        onChange={(e) => setDiscountValue(parseInt(e.target.value || "0"))}
                        className="w-full px-5 py-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-[8px] focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-400/10 outline-none transition-all text-sm font-semibold text-slate-800 placeholder-slate-400"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-700 block mb-2">Giảm tối đa (đ)</label>
                      <input
                        type="number"
                        required={discountType === "PERCENT"}
                        disabled={discountType !== "PERCENT"}
                        value={maxDiscount}
                        onChange={(e) => setMaxDiscount(parseInt(e.target.value || "0"))}
                        className="w-full px-5 py-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-[8px] focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-400/10 outline-none transition-all text-sm font-semibold text-slate-800 placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                )}

                {/* DYNAMIC FIELDS FOR CASHBACK */}
                {privilegeType === "CASHBACK" && (
                  <div className="grid grid-cols-2 gap-4 border-t border-outline-variant/20 pt-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-700 block mb-2">Tỷ lệ hoàn xu (%)</label>
                      <input
                        type="number"
                        required
                        min={1}
                        max={100}
                        value={cashbackRate}
                        onChange={(e) => setCashbackRate(parseInt(e.target.value || "0"))}
                        className="w-full px-5 py-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-[8px] focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-400/10 outline-none transition-all text-sm font-semibold text-slate-800 placeholder-slate-400"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-700 block mb-2">Hoàn xu tối đa (xu/tháng)</label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={maxCashback}
                        onChange={(e) => setMaxCashback(parseInt(e.target.value || "0"))}
                        className="w-full px-5 py-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-[8px] focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-400/10 outline-none transition-all text-sm font-semibold text-slate-800 placeholder-slate-400"
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
                      <label className="text-sm font-bold text-slate-700 block mb-2">Loại quà tặng</label>
                      <select
                        value={birthdayGiftType}
                        onChange={(e) => setBirthdayGiftType(e.target.value)}
                        className="w-full px-5 py-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-[8px] focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-400/10 outline-none transition-all text-sm font-semibold text-slate-800 cursor-pointer"
                      >
                        <option value="VOUCHER">Voucher giảm giá</option>
                        <option value="POINTS">Điểm thưởng Loyalty</option>
                        <option value="COINS">Xu trong ví</option>
                        <option value="PHYSICAL">Quà tặng vật lý</option>
                      </select>
                    </div>

                    {birthdayGiftType === "VOUCHER" && (
                      <div className="space-y-4 animate-in fade-in duration-200">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-2 space-y-1.5">
                            <label className="text-sm font-bold text-slate-700 block mb-2 block">Chế độ Voucher</label>
                            <div className="flex gap-6 mt-1">
                              <label className="flex items-center gap-2 text-sm text-on-surface cursor-pointer font-medium">
                                <input
                                  type="radio"
                                  name="birthdayVoucherMode"
                                  value="EXISTING"
                                  checked={voucherMode === "EXISTING"}
                                  onChange={() => {
                                    setVoucherMode("EXISTING");
                                    setBirthdayVoucherCode("");
                                  }}
                                  className="w-4 h-4 text-primary bg-surface-container-low border-outline focus:ring-primary cursor-pointer"
                                />
                                Sử dụng Voucher có sẵn
                              </label>
                              <label className="flex items-center gap-2 text-sm text-on-surface cursor-pointer font-medium">
                                <input
                                  type="radio"
                                  name="birthdayVoucherMode"
                                  value="CUSTOM"
                                  checked={voucherMode === "CUSTOM"}
                                  onChange={() => {
                                    setVoucherMode("CUSTOM");
                                    setBirthdayVoucherCode("BDAY");
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
                              <label className="text-sm font-bold text-slate-700 block mb-2">Chọn Voucher sinh nhật</label>
                              <select
                                value={birthdayVoucherCode}
                                onChange={(e) => setBirthdayVoucherCode(e.target.value)}
                                required
                                className="w-full px-5 py-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-[8px] focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-400/10 outline-none transition-all text-sm font-semibold text-slate-800 cursor-pointer"
                              >
                                <option value="">-- Chọn Voucher --</option>
                                {vouchers.map(v => (
                                  <option key={v.voucherID} value={v.code}>{v.code} - {v.name}</option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              <label className="text-sm font-bold text-slate-700 block mb-2">Tiền tố Mã Voucher</label>
                              <div className="w-full px-5 py-3.5 bg-slate-100 border border-slate-200 rounded-[8px] text-sm font-semibold text-slate-600 flex items-center select-none">
                                BDAY
                              </div>
                              <span className="text-xs text-slate-500 font-medium block mt-0.5">
                                Hệ thống tự sinh mã bắt đầu bằng BDAY.
                              </span>
                            </div>
                          )}

                          <div className="space-y-1.5">
                            <label className="text-sm font-bold text-slate-700 block mb-2">Số lượng / người</label>
                            <input
                              type="number"
                              required
                              min={1}
                              value={birthdayQuantity}
                              onChange={(e) => setBirthdayQuantity(parseInt(e.target.value || "1"))}
                              className="w-full px-5 py-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-[8px] focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-400/10 outline-none transition-all text-sm font-semibold text-slate-800 placeholder-slate-400"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-sm font-bold text-slate-700 block mb-2">Thời hạn sử dụng (ngày)</label>
                            <input
                              type="number"
                              required
                              min={1}
                              value={validityDays}
                              onChange={(e) => setValidityDays(parseInt(e.target.value || "30"))}
                              className="w-full px-5 py-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-[8px] focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-400/10 outline-none transition-all text-sm font-semibold text-slate-800 placeholder-slate-400"
                            />
                            <span className="text-xs text-slate-500 font-medium block mt-0.5">
                              {voucherMode === "CUSTOM" ? "Hạn sử dụng tính từ lúc nhận quà." : "Áp dụng nếu voucher chọn chưa có ngày hết hạn cố định."}
                            </span>
                          </div>
                        </div>

                        {voucherMode === "CUSTOM" && (
                          <div className="grid grid-cols-2 gap-4 bg-surface-container-low/40 p-md rounded-[8px] border border-outline-variant/10 animate-in slide-in-from-top-2 duration-200">
                            <div className="space-y-1.5">
                              <label className="text-sm font-bold text-slate-700 block mb-2">Loại giảm giá</label>
                              <select
                                value={discountType}
                                onChange={(e) => setDiscountType(e.target.value)}
                                className="w-full px-5 py-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-[8px] focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-400/10 outline-none transition-all text-sm font-semibold text-slate-800 cursor-pointer"
                              >
                                <option value="PERCENT">Phần trăm (%)</option>
                                <option value="FIXED">Số tiền cố định (đ)</option>
                              </select>
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-sm font-bold text-slate-700 block mb-2">Giá trị giảm</label>
                              <input
                                type="number"
                                required
                                min={1}
                                value={discountValue}
                                onChange={(e) => setDiscountValue(parseInt(e.target.value || "0"))}
                                className="w-full px-5 py-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-[8px] focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-400/10 outline-none transition-all text-sm font-semibold text-slate-800 placeholder-slate-400"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-sm font-bold text-slate-700 block mb-2">Giảm tối đa (đ)</label>
                              <input
                                type="number"
                                required={discountType === "PERCENT"}
                                disabled={discountType !== "PERCENT"}
                                value={maxDiscount}
                                onChange={(e) => setMaxDiscount(parseInt(e.target.value || "0"))}
                                className="w-full px-5 py-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-[8px] focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-400/10 outline-none transition-all text-sm font-semibold text-slate-800 placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-sm font-bold text-slate-700 block mb-2">Đơn tối thiểu (đ)</label>
                              <input
                                type="number"
                                required
                                min={0}
                                value={minOrderValue}
                                onChange={(e) => setMinOrderValue(parseInt(e.target.value || "0"))}
                                className="w-full px-5 py-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-[8px] focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-400/10 outline-none transition-all text-sm font-semibold text-slate-800 placeholder-slate-400"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {birthdayGiftType === "POINTS" && (
                      <div className="space-y-1.5">
                        <label className="text-sm font-bold text-slate-700 block mb-2">Số điểm tặng</label>
                        <input
                          type="number"
                          required
                          min={1}
                          value={birthdayPoints}
                          onChange={(e) => setBirthdayPoints(parseInt(e.target.value || "1"))}
                          className="w-full px-5 py-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-[8px] focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-400/10 outline-none transition-all text-sm font-semibold text-slate-800 placeholder-slate-400"
                        />
                      </div>
                    )}

                    {birthdayGiftType === "COINS" && (
                      <div className="space-y-1.5">
                        <label className="text-sm font-bold text-slate-700 block mb-2">Số xu tặng</label>
                        <input
                          type="number"
                          required
                          min={1}
                          value={birthdayCoins}
                          onChange={(e) => setBirthdayCoins(parseInt(e.target.value || "1"))}
                          className="w-full px-5 py-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-[8px] focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-400/10 outline-none transition-all text-sm font-semibold text-slate-800 placeholder-slate-400"
                        />
                      </div>
                    )}

                    {birthdayGiftType === "PHYSICAL" && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-sm font-bold text-slate-700 block mb-2">Tên quà tặng vật lý</label>
                          <input
                            type="text"
                            required
                            value={birthdayGiftName}
                            onChange={(e) => setBirthdayGiftName(e.target.value)}
                            placeholder="Ví dụ: Bình nước giữ nhiệt"
                            className="w-full px-5 py-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-[8px] focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-400/10 outline-none transition-all text-sm font-semibold text-slate-800 placeholder-slate-400"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-bold text-slate-700 block mb-2">Mô tả chi tiết</label>
                          <input
                            type="text"
                            value={birthdayGiftDesc}
                            onChange={(e) => setBirthdayGiftDesc(e.target.value)}
                            placeholder="Mô tả quà tặng sinh nhật..."
                            className="w-full px-5 py-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-[8px] focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-400/10 outline-none transition-all text-sm font-semibold text-slate-800 placeholder-slate-400"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </div>

              <div className="p-6 flex justify-end gap-3 border-t border-slate-100 bg-slate-50/50 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowPrivilegeModal(false);
                    setEditingPrivilege(null);
                  }}
                  className="px-6 py-2.5 rounded-[8px] bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800 font-bold text-sm transition-colors cursor-pointer border-none"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-[8px] bg-primary text-on-primary font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-sm hover:shadow-md cursor-pointer"
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
          <div className="bg-white border border-slate-100 w-[calc(100vw-2rem)] md:w-[620px] lg:w-[720px] shrink-0 rounded-[8px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary">card_giftcard</span>
                </div>
                <h3 className="text-xl text-slate-800 font-extrabold">Phát quà sinh nhật thủ công</h3>
              </div>
              <button
                onClick={() => {
                  setShowManualBirthdayModal(false);
                  setManualBirthdayUserID("");
                  setManualBirthdayUserSearchTerm("");
                }}
                className="w-10 h-10 rounded-full hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer text-slate-500 hover:text-slate-800"
                disabled={submittingManualBirthday}
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleManualBirthdayIssue} className="p-6 space-y-6">
              <div className="p-sm bg-primary/5 rounded-lg text-xs font-semibold text-primary/80 border border-primary/20">
                Lưu ý: Hệ thống sẽ dựa trên đặc quyền quà tặng sinh nhật (BIRTHDAY_GIFT) đã được cấu hình cho hạng thành viên hiện tại của thành viên được chọn để phát quà tương ứng. Mỗi thành viên chỉ nhận quà tối đa 1 lần/năm.
              </div>

              {/* User search */}
              <div className="space-y-1.5 relative">
                <label className="text-sm font-bold text-slate-700 block mb-2">Tìm kiếm thành viên</label>
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
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-[8px] focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all text-sm font-semibold text-slate-800"
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
                        <p className="text-xs text-slate-500 font-medium font-semibold">{u.email} {u.phoneNumber && `- ${u.phoneNumber}`}</p>
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
                  className="px-6 py-2.5 rounded-[8px] bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800 font-bold text-sm transition-colors cursor-pointer border-none"
                  disabled={submittingManualBirthday}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submittingManualBirthday || !manualBirthdayUserID}
                  className="px-6 py-2.5 rounded-[8px] bg-primary text-on-primary font-bold text-sm flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-sm hover:shadow-md cursor-pointer disabled:opacity-50 disabled:scale-100"
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
