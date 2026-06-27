"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader, Wallet, Coins, ArrowDownToLine, History, Clock, CheckCircle2, XCircle, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "@/lib/toast";
import { 
  getUserProfile, 
  UserProfile,
  getMyWithdrawRequests,
  getBalanceHistory,
  createWithdrawRequest,
  WithdrawRequest,
  BalanceTransaction
} from "@/lib/api";

export function WalletSection({ token, uid }: { token: string; uid: string }) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  
  const [activeTab, setActiveTab] = useState<"history" | "withdraw">("history");
  
  const [transactions, setTransactions] = useState<BalanceTransaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawRequest[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [withdrawPage, setWithdrawPage] = useState(1);
  
  // Modal state
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({
    amount: "",
    bankName: "",
    bankAccount: "",
    bankOwnerName: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [bankDropdownOpen, setBankDropdownOpen] = useState(false);
  const bankDropdownRef = useRef<HTMLDivElement>(null);

  const BANK_LIST = [
    "Agribank", "Vietcombank", "VietinBank", "BIDV", "MBBank", "Techcombank",
    "VPBank", "ACB", "Sacombank", "TPBank", "HDBank", "VIB", "SHB", "MSB",
    "LPBank", "SeABank", "OCB", "Eximbank", "SCB", "Bac A Bank", "Nam A Bank",
    "PVcomBank", "VietABank", "NCB", "VietBank", "Kienlongbank", "Saigonbank",
    "PG Bank", "BaoViet Bank", "GPBank", "OceanBank", "CBBank", "Shinhan Bank",
    "HSBC", "Standard Chartered", "UOB", "Woori Bank", "Public Bank", "CIMB", "HLBank"
  ];

  const filteredBanks = BANK_LIST.filter(b =>
    b.toLowerCase().includes(withdrawForm.bankName.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (bankDropdownRef.current && !bankDropdownRef.current.contains(e.target as Node)) {
        setBankDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        // Load data in parallel
        const [prof, trans, withs] = await Promise.all([
          getUserProfile(uid, token),
          getBalanceHistory(token),
          getMyWithdrawRequests(token)
        ]);

        if (prof) setProfile(prof);
        setTransactions(trans);
        setWithdrawals(withs);
      } catch (error) {
        console.error("Error loading wallet data:", error);
        toast.error("Lỗi khi tải dữ liệu Ví");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [uid, token]);

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    const amount = parseInt(withdrawForm.amount);
    if (isNaN(amount) || amount < 10000) {
      toast.error("Số tiền rút tối thiểu là 10.000đ");
      return;
    }
    
    if (profile && amount > (profile.walletBalance || 0)) {
      toast.error("Số dư ví không đủ");
      return;
    }

    if (!withdrawForm.bankName || !withdrawForm.bankAccount || !withdrawForm.bankOwnerName) {
      toast.error("Vui lòng nhập đầy đủ thông tin ngân hàng");
      return;
    }

    setSubmitting(true);
    try {
      await createWithdrawRequest({
        amount,
        bankName: withdrawForm.bankName,
        bankAccount: withdrawForm.bankAccount,
        bankOwnerName: withdrawForm.bankOwnerName
      }, token);

      toast.success("Yêu cầu rút tiền đã được gửi thành công");
      setIsWithdrawModalOpen(false);
      setWithdrawForm({ amount: "", bankName: "", bankAccount: "", bankOwnerName: "" });

      // Refresh data
      const uid = JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "{}").userId || profile?.userId;
      const [prof, trans, withs] = await Promise.all([
        getUserProfile(uid, token),
        getBalanceHistory(token),
        getMyWithdrawRequests(token)
      ]);
      if (prof) setProfile(prof);
      setTransactions(trans);
      setWithdrawals(withs);

    } catch (error: any) {
      toast.error(error.message || "Có lỗi xảy ra khi gửi yêu cầu");
    } finally {
      setSubmitting(false);
    }
  };

  const formatVND = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader className="animate-spin text-rose-500 h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Wallet className="h-6 w-6 text-emerald-500" />
        <h1 className="text-xl font-bold text-slate-800">Ví LazPe của tôi</h1>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-6 text-white shadow-lg shadow-emerald-500/20 relative overflow-hidden">
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <div className="flex items-center gap-2 text-emerald-50 mb-1">
                <Wallet className="h-5 w-5" />
                <span className="font-semibold text-sm">Số dư Ví</span>
              </div>
              <div className="text-3xl font-black mt-2">
                {formatVND(profile?.walletBalance || 0)}
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => setIsWithdrawModalOpen(true)}
                className="bg-white text-emerald-600 font-bold py-2 px-4 rounded-lg shadow hover:bg-emerald-50 transition-colors flex items-center gap-2 text-sm"
              >
                <ArrowDownToLine className="h-4 w-4" /> Rút tiền
              </button>
            </div>
          </div>
          <div className="absolute -bottom-6 -right-6 text-white/10">
            <Wallet className="h-32 w-32" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-400 to-rose-500 rounded-xl p-6 text-white shadow-lg shadow-orange-500/20 relative overflow-hidden">
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <div className="flex items-center gap-2 text-orange-50 mb-1">
                <Coins className="h-5 w-5" />
                <span className="font-semibold text-sm">LazPe Coins</span>
              </div>
              <div className="text-3xl font-black mt-2">
                {(profile?.coinsBalance || 0).toLocaleString("vi-VN")} xu
              </div>
            </div>
            <div className="mt-6">
              <p className="text-xs text-orange-100">Coins được dùng để giảm giá trực tiếp khi thanh toán đơn hàng.</p>
            </div>
          </div>
          <div className="absolute -bottom-6 -right-6 text-white/10">
            <Coins className="h-32 w-32" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden mt-8">
        <div className="flex border-b border-slate-100">
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
              activeTab === "history" 
                ? "text-emerald-600 border-b-2 border-emerald-500 bg-emerald-50/30" 
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
          >
            <History className="h-4 w-4" /> Lịch sử biến động
          </button>
          <button
            onClick={() => setActiveTab("withdraw")}
            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
              activeTab === "withdraw" 
                ? "text-emerald-600 border-b-2 border-emerald-500 bg-emerald-50/30" 
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
          >
            <ArrowDownToLine className="h-4 w-4" /> Yêu cầu rút tiền
          </button>
        </div>

        <div className="p-0">
          {activeTab === "history" && (
            <div>
              <div className="divide-y divide-slate-100">
                {transactions.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    <FileText className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                    <p>Chưa có lịch sử giao dịch nào</p>
                  </div>
                ) : (
                  transactions
                    .slice((historyPage - 1) * 5, historyPage * 5)
                    .map((tx) => (
                      <div key={tx.transactionID || Math.random()} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-full ${tx.direction === 2 ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"}`}>
                            <Wallet className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 text-sm">{tx.reason}</p>
                            <p className="text-xs text-slate-500 mt-1">{formatDate(tx.createdAt)} • Nguồn: {tx.sourceType === 1 ? "Ví LazPe" : "LazPe Coins"}</p>
                          </div>
                        </div>
                        <div className={`font-black ${tx.direction === 2 ? "text-emerald-500" : "text-rose-500"}`}>
                          {tx.direction === 2 ? "+" : "-"}{tx.sourceType === 2 ? `${tx.amount.toLocaleString("vi-VN")} xu` : formatVND(tx.amount)}
                        </div>
                      </div>
                    ))
                )}
              </div>
              {transactions.length > 5 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-white">
                  <div className="flex flex-1 justify-between sm:hidden">
                    <button
                      onClick={() => setHistoryPage((prev) => Math.max(prev - 1, 1))}
                      disabled={historyPage === 1}
                      className="relative inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      Trang trước
                    </button>
                    <button
                      onClick={() => setHistoryPage((prev) => Math.min(prev + 1, Math.ceil(transactions.length / 5)))}
                      disabled={historyPage === Math.ceil(transactions.length / 5)}
                      className="relative ml-3 inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      Trang sau
                    </button>
                  </div>
                  <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs text-slate-700 font-semibold">
                        Hiển thị <span className="font-bold">{(historyPage - 1) * 5 + 1}</span> đến{" "}
                        <span className="font-bold">
                          {Math.min(historyPage * 5, transactions.length)}
                        </span>{" "}
                        trong tổng số <span className="font-bold">{transactions.length}</span> giao dịch
                      </p>
                    </div>
                    <div>
                      <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                        <button
                          onClick={() => setHistoryPage((prev) => Math.max(prev - 1, 1))}
                          disabled={historyPage === 1}
                          className="relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        {Array.from({ length: Math.ceil(transactions.length / 5) }).map((_, idx) => {
                          const pageNum = idx + 1;
                          const isCurrent = pageNum === historyPage;
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setHistoryPage(pageNum)}
                              className={`relative inline-flex items-center px-3.5 py-2 text-xs font-semibold focus:z-20 cursor-pointer ${
                                isCurrent
                                  ? "z-10 bg-emerald-600 text-white"
                                  : "text-slate-900 ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                        <button
                          onClick={() => setHistoryPage((prev) => Math.min(prev + 1, Math.ceil(transactions.length / 5)))}
                          disabled={historyPage === Math.ceil(transactions.length / 5)}
                          className="relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "withdraw" && (
            <div>
              <div className="divide-y divide-slate-100">
                {withdrawals.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    <FileText className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                    <p>Chưa có yêu cầu rút tiền nào</p>
                  </div>
                ) : (
                  withdrawals
                    .slice((withdrawPage - 1) * 5, withdrawPage * 5)
                    .map((req) => (
                      <div key={req.requestID} className="p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-bold text-slate-800">
                            {formatVND(req.amount)}
                          </div>
                          <div>
                            {req.status === "Pending" && <span className="flex items-center gap-1 text-xs font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded"><Clock className="h-3 w-3"/> Đang chờ</span>}
                            {req.status === "Approved" && <span className="flex items-center gap-1 text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded"><CheckCircle2 className="h-3 w-3"/> Đã duyệt</span>}
                            {req.status === "Rejected" && <span className="flex items-center gap-1 text-xs font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded"><XCircle className="h-3 w-3"/> Từ chối</span>}
                          </div>
                        </div>
                        <div className="text-sm text-slate-600">
                          Ngân hàng: <span className="font-semibold">{req.bankName}</span> - {req.bankAccount} ({req.bankOwnerName})
                        </div>
                        <div className="text-xs text-slate-500 mt-2 flex justify-between">
                          <span>Ngày tạo: {formatDate(req.createdAt)}</span>
                          {req.adminNote && <span className="text-rose-500">Ghi chú: {req.adminNote}</span>}
                        </div>
                      </div>
                    ))
                )}
              </div>
              {withdrawals.length > 5 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-white">
                  <div className="flex flex-1 justify-between sm:hidden">
                    <button
                      onClick={() => setWithdrawPage((prev) => Math.max(prev - 1, 1))}
                      disabled={withdrawPage === 1}
                      className="relative inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      Trang trước
                    </button>
                    <button
                      onClick={() => setWithdrawPage((prev) => Math.min(prev + 1, Math.ceil(withdrawals.length / 5)))}
                      disabled={withdrawPage === Math.ceil(withdrawals.length / 5)}
                      className="relative ml-3 inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-750 hover:bg-slate-50 disabled:opacity-50"
                    >
                      Trang sau
                    </button>
                  </div>
                  <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs text-slate-700 font-semibold">
                        Hiển thị <span className="font-bold">{(withdrawPage - 1) * 5 + 1}</span> đến{" "}
                        <span className="font-bold">
                          {Math.min(withdrawPage * 5, withdrawals.length)}
                        </span>{" "}
                        trong tổng số <span className="font-bold">{withdrawals.length}</span> yêu cầu
                      </p>
                    </div>
                    <div>
                      <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                        <button
                          onClick={() => setWithdrawPage((prev) => Math.max(prev - 1, 1))}
                          disabled={withdrawPage === 1}
                          className="relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        {Array.from({ length: Math.ceil(withdrawals.length / 5) }).map((_, idx) => {
                          const pageNum = idx + 1;
                          const isCurrent = pageNum === withdrawPage;
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setWithdrawPage(pageNum)}
                              className={`relative inline-flex items-center px-3.5 py-2 text-xs font-semibold focus:z-20 cursor-pointer ${
                                isCurrent
                                  ? "z-10 bg-emerald-600 text-white"
                                  : "text-slate-900 ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                        <button
                          onClick={() => setWithdrawPage((prev) => Math.min(prev + 1, Math.ceil(withdrawals.length / 5)))}
                          disabled={withdrawPage === Math.ceil(withdrawals.length / 5)}
                          className="relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Withdraw Modal */}
      {isWithdrawModalOpen && typeof document !== 'undefined' && (
        require('react-dom').createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-[12px] shadow-xl w-full max-w-2xl flex flex-col overflow-hidden relative animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-800">Yêu cầu rút tiền</h3>
                <button 
                  onClick={() => setIsWithdrawModalOpen(false)}
                  className="text-slate-400 hover:text-rose-500 transition-colors"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
              
              <form onSubmit={handleWithdrawSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Số tiền muốn rút (VNĐ)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={withdrawForm.amount}
                      onChange={(e) => setWithdrawForm({...withdrawForm, amount: e.target.value})}
                      placeholder="Tối thiểu 10.000đ"
                      className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">đ</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Số dư khả dụng: <span className="font-bold text-emerald-600">{formatVND(profile?.walletBalance || 0)}</span>
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div ref={bankDropdownRef} className="relative">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Tên ngân hàng</label>
                    <input
                      type="text"
                      value={withdrawForm.bankName}
                      onChange={(e) => {
                        setWithdrawForm({...withdrawForm, bankName: e.target.value});
                        setBankDropdownOpen(true);
                      }}
                      onFocus={() => setBankDropdownOpen(true)}
                      placeholder="Tìm hoặc chọn ngân hàng..."
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm"
                      required
                      autoComplete="off"
                    />
                    {bankDropdownOpen && filteredBanks.length > 0 && (
                      <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                        {filteredBanks.map((bank) => (
                          <button
                            key={bank}
                            type="button"
                            onClick={() => {
                              setWithdrawForm({...withdrawForm, bankName: bank});
                              setBankDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-emerald-50 hover:text-emerald-700 transition-colors ${
                              withdrawForm.bankName === bank ? "bg-emerald-50 text-emerald-700 font-bold" : "text-slate-700"
                            }`}
                          >
                            {bank}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Tên chủ tài khoản</label>
                    <input
                      type="text"
                      value={withdrawForm.bankOwnerName}
                      onChange={(e) => setWithdrawForm({...withdrawForm, bankOwnerName: e.target.value.toUpperCase()})}
                      placeholder="NGUYEN VAN A"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm uppercase"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Số tài khoản</label>
                  <input
                    type="text"
                    value={withdrawForm.bankAccount}
                    onChange={(e) => setWithdrawForm({...withdrawForm, bankAccount: e.target.value})}
                    placeholder="Nhập số tài khoản"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm"
                    required
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white font-bold py-3 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    {submitting ? <Loader className="animate-spin h-5 w-5" /> : <ArrowDownToLine className="h-5 w-5" />}
                    {submitting ? "Đang xử lý..." : "Xác nhận Rút tiền"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.getElementById('modal-root') || document.body
        )
      )}
    </div>
  );
}
