import React, { useState, useEffect } from "react";
import { toast } from "@/lib/toast";
import { Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils/formatters";

interface VoucherRedemptionConfigProps {
  token: string;
}

export function VoucherRedemptionConfig({ token }: VoucherRedemptionConfigProps) {
  const API_URL = (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL !== 'undefined') ? process.env.NEXT_PUBLIC_API_URL : "http://localhost:5101/api";

  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [tiers, setTiers] = useState<{tierID: number, tierName: string}[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [voucherMode, setVoucherMode] = useState<"EXISTING" | "NEW">("EXISTING");
  
  const [newVoucherData, setNewVoucherData] = useState({
    code: "",
    name: "Voucher đổi điểm",
    voucherType: 1,
    isFreeShipping: false,
    discountType: 2,
    discountValue: 10000,
    minOrderValue: 0,
    maxDiscount: 10000,
    maxShippingDiscount: 0,
    totalQuantity: 100
  });
  
  const [formData, setFormData] = useState({
    id: 0,
    voucherID: 0,
    pointCost: 1000,
    tierID: null as number | null,
    limitPerUserPerPeriod: 1,
    totalQuotaPerPeriod: 100,
    resetCycle: 1,
    resetDayOfMonth: 1,
    isActive: true,
  });

  useEffect(() => {
    fetchConfigs();
    fetchVouchers();
    fetchTiers();
  }, []);

  const getHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  });

  const fetchTiers = async () => {
    try {
      const res = await fetch(`${API_URL}/AdminLoyalty/tiers`, {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setTiers(data.data);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/loyalty/voucher-redemptions`, {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setConfigs(data.data || []);
      }
    } catch (e) {
      console.error(e);
      toast.error("Lỗi khi tải cấu hình voucher đổi điểm");
    } finally {
      setLoading(false);
    }
  };

  const fetchVouchers = async () => {
    try {
      const res = await fetch(`${API_URL}/vouchers`, {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setVouchers(data.filter((v: any) => v.isActive));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let finalVoucherID = formData.voucherID;
      
      if (voucherMode === "NEW" && formData.id === 0) {
        const voucherRes = await fetch(`${API_URL}/vouchers`, {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({
            Code: newVoucherData.code,
            Name: newVoucherData.name,
            DiscountType: newVoucherData.discountType,
            DiscountValue: newVoucherData.discountValue,
            MinOrderValue: newVoucherData.minOrderValue,
            MaxDiscount: newVoucherData.maxDiscount,
            TotalQuantity: newVoucherData.totalQuantity,
            Status: true,
            StartDate: new Date().toISOString(),
            EndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
            VisibilityType: 3,
            ExclusiveType: 0,
            VoucherType: newVoucherData.voucherType,
            IsFreeShipping: newVoucherData.isFreeShipping,
            MaxShippingDiscount: newVoucherData.maxShippingDiscount,
            UsageLimitPerUser: formData.limitPerUserPerPeriod
          })
        });
        
        if (!voucherRes.ok) {
          const err = await voucherRes.json();
          toast.error(err.message || "Lỗi khi tạo voucher mới");
          return;
        }
        
        const voucherData = await voucherRes.json();
        finalVoucherID = voucherData.voucher?.voucherID || voucherData.voucher?.voucherId || voucherData.voucher?.id;
        if (!finalVoucherID) {
            toast.error("Không lấy được ID của voucher vừa tạo");
            return;
        }
        // Background fetch to update dropdown
        fetchVouchers();
      }

      const isUpdate = formData.id > 0;
      const url = isUpdate 
        ? `${API_URL}/admin/loyalty/voucher-redemptions/${formData.id}`
        : `${API_URL}/admin/loyalty/voucher-redemptions`;
      
      const method = isUpdate ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify({
          ...formData,
          voucherID: finalVoucherID,
        }),
      });

      if (res.ok) {
        toast.success(isUpdate ? "Cập nhật thành công!" : "Tạo cấu hình mới thành công!");
        setShowModal(false);
        fetchConfigs();
      } else {
        const err = await res.json();
        toast.error(err.message || "Lưu thất bại.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Lỗi kết nối máy chủ");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa cấu hình này?")) return;
    try {
      const res = await fetch(`${API_URL}/admin/loyalty/voucher-redemptions/${id}`, {
        method: "DELETE",
        headers: getHeaders()
      });
      if (res.ok) {
        toast.success("Đã xóa cấu hình thành công");
        fetchConfigs();
      }
    } catch (e) {
      console.error(e);
      toast.error("Lỗi khi xóa cấu hình");
    }
  };

  const openEdit = (item: any) => {
    setFormData({
      id: item.id,
      voucherID: item.voucherId || item.voucherID,
      pointCost: item.pointCost,
      tierID: item.tierId || item.tierID,
      limitPerUserPerPeriod: item.limitPerUserPerPeriod,
      totalQuotaPerPeriod: item.totalQuotaPerPeriod,
      resetCycle: item.resetCycle,
      resetDayOfMonth: item.resetDayOfMonth || 1,
      isActive: item.isActive,
    });
    setShowModal(true);
  };

  const openCreate = () => {
    setVoucherMode("EXISTING");
    setFormData({
      id: 0,
      voucherID: vouchers.length > 0 ? vouchers[0].voucherID : 0,
      pointCost: 1000,
      tierID: null,
      limitPerUserPerPeriod: 1,
      totalQuotaPerPeriod: 100,
      resetCycle: 1,
      resetDayOfMonth: 1,
      isActive: true,
    });
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h4 className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">
          Cấu hình Voucher Đổi Điểm
        </h4>
        <button
          onClick={openCreate}
          className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 px-4 py-2 rounded-[8px] font-bold text-xs transition-all cursor-pointer shadow-sm"
        >
          + Thêm cấu hình voucher
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="animate-spin h-6 w-6 text-primary" />
        </div>
      ) : configs.length === 0 ? (
        <div className="text-center py-10 text-slate-400 font-bold text-sm">
          Chưa có voucher nào được cấu hình cho hạng này.
        </div>
      ) : (
        <div className="space-y-3">
          {configs.map((c) => (
            <div key={c.id} className="p-4 border border-slate-100 rounded-[8px] flex items-center justify-between bg-white shadow-sm hover:border-slate-300 transition-all">
              <div>
                <h5 className="text-sm text-slate-800 font-bold">
                  {c.voucher?.code} - {c.voucher?.name || c.voucher?.description}
                  {(c.tierId || c.tierID) ? (
                    <span className="ml-2 px-2 py-0.5 text-[10px] bg-amber-100 text-amber-700 rounded-full font-bold">
                      Hạng: {tiers.find((t: any) => (t.tierId || t.tierID) === (c.tierId || c.tierID))?.tierName || (c.tierId || c.tierID)}
                    </span>
                  ) : (
                    <span className="ml-2 px-2 py-0.5 text-[10px] bg-slate-100 text-slate-600 rounded-full font-bold">
                      Mọi hạng
                    </span>
                  )}
                </h5>
                <p className="text-xs text-slate-600 mt-1.5 font-medium">
                  Điểm đổi: <strong className="text-rose-600">{c.pointCost.toLocaleString()} điểm</strong> | 
                  Chu kỳ: <strong>{c.resetCycle === 1 ? "Hàng tháng" : (c.resetCycle === 0 ? "Không reset" : c.resetCycle)}</strong>
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Giới hạn: {c.limitPerUserPerPeriod} lần/chu kỳ/user | 
                  Tổng ngân sách: {c.totalQuotaPerPeriod} voucher/chu kỳ
                </p>
                <div className="mt-1">
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${c.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {c.isActive ? 'Đang hoạt động' : 'Tạm khóa'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => openEdit(c)}
                  className="w-8 h-8 rounded-[8px] flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="w-8 h-8 rounded-[8px] flex items-center justify-center text-rose-400 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
          <div className="bg-white border border-slate-100 w-[calc(100vw-2rem)] md:w-[600px] shrink-0 rounded-[8px] shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between">
              <h3 className="text-lg font-bold text-slate-800">
                {formData.id > 0 ? "Cập nhật cấu hình Voucher" : "Thêm Voucher Đổi Điểm"}
              </h3>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                {formData.id === 0 && (
                  <div className="flex gap-2 mb-2 p-1 bg-slate-100 rounded-[8px]">
                    <button
                      type="button"
                      onClick={() => setVoucherMode("EXISTING")}
                      className={`flex-1 py-2 text-sm font-bold rounded-[6px] transition-all ${voucherMode === "EXISTING" ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                    >
                      Chọn Voucher có sẵn
                    </button>
                    <button
                      type="button"
                      onClick={() => setVoucherMode("NEW")}
                      className={`flex-1 py-2 text-sm font-bold rounded-[6px] transition-all ${voucherMode === "NEW" ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                    >
                      Tạo Voucher mới
                    </button>
                  </div>
                )}

                {voucherMode === "EXISTING" || formData.id > 0 ? (
                  <div>
                    <label className="text-sm font-bold text-slate-700 block mb-2">Chọn Voucher gốc</label>
                    <select 
                      required
                      value={formData.voucherID}
                      onChange={e => setFormData({...formData, voucherID: parseInt(e.target.value)})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-[8px]"
                    >
                      <option value={0}>-- Chọn Voucher --</option>
                      {vouchers.map(v => (
                        <option key={v.voucherID} value={v.voucherID}>
                          {v.code} - Giảm {v.discountType === 'Fixed' || v.discountType === 2 ? formatCurrency(v.discountValue) : v.discountValue + '%'}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="p-4 border border-blue-100 bg-blue-50/30 rounded-[8px] space-y-4">
                    <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px]">add_circle</span>
                      Thông tin Voucher mới
                    </h4>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Tên Voucher</label>
                      <input type="text" required value={newVoucherData.name} onChange={e => setNewVoucherData({...newVoucherData, name: e.target.value})} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-[6px] text-sm" placeholder="VD: Giảm 20k cho thành viên" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Loại Voucher</label>
                        <select value={newVoucherData.voucherType} onChange={e => {
                          const vType = parseInt(e.target.value);
                          setNewVoucherData({...newVoucherData, voucherType: vType, isFreeShipping: false, discountType: vType === 2 ? 2 : newVoucherData.discountType});
                        }} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-[6px] text-sm">
                          <option value={1}>Giảm giá sản phẩm</option>
                          <option value={2}>Giảm phí vận chuyển</option>
                        </select>
                      </div>
                      
                      {newVoucherData.voucherType === 2 && (
                        <div className="flex items-center mt-6">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={newVoucherData.isFreeShipping}
                              onChange={e => {
                                const checked = e.target.checked;
                                setNewVoucherData({
                                  ...newVoucherData, 
                                  isFreeShipping: checked,
                                  discountType: checked ? 1 : 2,
                                  discountValue: checked ? 100 : newVoucherData.discountValue,
                                  maxDiscount: 0
                                });
                              }}
                              className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                            />
                            <span className="text-sm font-bold text-sky-700">Miễn phí toàn bộ phí Ship (Free Shipping)</span>
                          </label>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {!(newVoucherData.voucherType === 2 && newVoucherData.isFreeShipping) && (
                        <>
                          <div>
                            <label className="text-xs font-bold text-slate-700 block mb-1">Loại giảm giá</label>
                            <select value={newVoucherData.discountType} onChange={e => setNewVoucherData({...newVoucherData, discountType: parseInt(e.target.value)})} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-[6px] text-sm">
                              <option value={2}>Số tiền (VNĐ)</option>
                              <option value={1}>Phần trăm (%)</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-bold text-slate-700 block mb-1">Mức giảm</label>
                            <input type="number" required min={1} value={newVoucherData.discountValue} onChange={e => setNewVoucherData({...newVoucherData, discountValue: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-[6px] text-sm" />
                          </div>
                        </>
                      )}
                      
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Đơn tối thiểu</label>
                        <input type="number" required min={0} value={newVoucherData.minOrderValue} onChange={e => setNewVoucherData({...newVoucherData, minOrderValue: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-[6px] text-sm" />
                      </div>
                      
                      {newVoucherData.discountType === 1 && !newVoucherData.isFreeShipping ? (
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">Giảm tối đa</label>
                          <input type="number" required min={1} value={newVoucherData.maxDiscount} onChange={e => setNewVoucherData({...newVoucherData, maxDiscount: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-[6px] text-sm" />
                        </div>
                      ) : (
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">Số lượng phát hành</label>
                          <input type="number" required min={1} value={newVoucherData.totalQuantity} onChange={e => setNewVoucherData({...newVoucherData, totalQuantity: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-[6px] text-sm" />
                        </div>
                      )}
                    </div>
                    {newVoucherData.discountType === 1 && !newVoucherData.isFreeShipping && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">Số lượng phát hành</label>
                          <input type="number" required min={1} value={newVoucherData.totalQuantity} onChange={e => setNewVoucherData({...newVoucherData, totalQuantity: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-[6px] text-sm" />
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-2">Áp dụng cho hạng</label>
                  <select 
                    value={formData.tierID || ""}
                    onChange={e => setFormData({...formData, tierID: e.target.value ? parseInt(e.target.value) : null})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-[8px]"
                  >
                    <option value="">-- Mọi hạng --</option>
                    {tiers.map((t: any) => (
                      <option key={t.tierId || t.tierID} value={t.tierId || t.tierID}>
                        {t.tierName}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-bold text-slate-700 block mb-2">Điểm đổi (Point Cost)</label>
                    <input 
                      type="number" required min={1}
                      value={formData.pointCost}
                      onChange={e => setFormData({...formData, pointCost: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-[8px]"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-slate-700 block mb-2">Giới hạn User/Chu kỳ</label>
                    <input 
                      type="number" required min={1}
                      value={formData.limitPerUserPerPeriod}
                      onChange={e => setFormData({...formData, limitPerUserPerPeriod: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-[8px]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-bold text-slate-700 block mb-2">Chu kỳ reset</label>
                    <select 
                      value={formData.resetCycle}
                      onChange={e => setFormData({...formData, resetCycle: parseInt(e.target.value)})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-[8px]"
                    >
                      <option value={0}>Không bao giờ</option>
                      <option value={1}>Hàng tháng</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-slate-700 block mb-2">Tổng số lượng/Chu kỳ</label>
                    <input 
                      type="number" required min={1}
                      value={formData.totalQuotaPerPeriod}
                      onChange={e => setFormData({...formData, totalQuotaPerPeriod: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-[8px]"
                    />
                  </div>
                </div>
                
                <label className="flex items-center gap-2 cursor-pointer mt-2">
                  <input 
                    type="checkbox" 
                    checked={formData.isActive}
                    onChange={e => setFormData({...formData, isActive: e.target.checked})}
                    className="w-4 h-4 text-primary"
                  />
                  <span className="text-sm font-bold text-slate-700">Đang hoạt động</span>
                </label>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 rounded-[8px] bg-slate-100 text-slate-600 font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-[8px] bg-primary text-white font-bold"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
