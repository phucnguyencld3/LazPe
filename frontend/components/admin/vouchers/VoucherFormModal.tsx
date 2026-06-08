"use client";

import type { FormEvent } from "react";
import React, { useState, useEffect } from "react";
import { toast } from "@/lib/toast";
import {
  VoucherAdminInfo,
  CreateVoucherPayload,
  UpdateVoucherPayload,
  generateVoucherCode,
  createVoucher,
  updateVoucher
} from "@/lib/features/vouchers/voucherApi";

interface VoucherFormModalProps {
  voucher: VoucherAdminInfo | null; // null for Create, object for Edit
  token: string;
  onClose: () => void;
  onSaveSuccess: (message: string) => void;
}

export default function VoucherFormModal({
  voucher,
  token,
  onClose,
  onSaveSuccess
}: VoucherFormModalProps) {
  const isEditing = !!voucher;

  // Form states
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [discountType, setDiscountType] = useState<number>(1); // 1: %, 2: Tiền cố định
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [minOrderValue, setMinOrderValue] = useState<number>(0);
  const [maxDiscount, setMaxDiscount] = useState<number>(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [totalQuantity, setTotalQuantity] = useState<number>(1);
  const [status, setStatus] = useState(true);
  const [visibilityType, setVisibilityType] = useState<number>(1); // 1: Public, 2: Exclusive
  const [exclusiveType, setExclusiveType] = useState<number>(0); // 0: None, 1: ManualCode, 2: DirectAssign

  // Status indicators
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Initialize values when voucher changes
  useEffect(() => {
    if (voucher) {
      setCode(voucher.code);
      setName(voucher.name);
      setDiscountType(voucher.discountType);
      setDiscountValue(Number(voucher.discountValue));
      setMinOrderValue(Number(voucher.minOrderValue));
      setMaxDiscount(Number(voucher.maxDiscount));
      setStartDate(formatDateTimeLocal(voucher.startDate));
      setEndDate(formatDateTimeLocal(voucher.endDate));
      setTotalQuantity(voucher.totalQuantity);
      setStatus(voucher.status);
      setVisibilityType(voucher.visibilityType);
      setExclusiveType(voucher.exclusiveType);
    } else {
      // Clear for create mode
      setCode("");
      setName("");
      setDiscountType(1);
      setDiscountValue(0);
      setMinOrderValue(0);
      setMaxDiscount(0);
      
      // Default dates: start is now, end is 30 days from now
      const now = new Date();
      const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      setStartDate(formatDateTimeLocal(now.toISOString()));
      setEndDate(formatDateTimeLocal(thirtyDaysLater.toISOString()));
      
      setTotalQuantity(100);
      setStatus(true);
      setVisibilityType(1);
      setExclusiveType(0);
    }
    setValidationErrors({});
  }, [voucher]);

  // Handle auto-adjusting exclusiveType when visibility changes
  useEffect(() => {
    if (!voucher) {
      if (visibilityType === 1) {
        // Public: Only allow None or DirectAssign
        if (exclusiveType === 1) {
          setExclusiveType(0);
        }
      } else if (visibilityType === 2) {
        // Exclusive: Only allow ManualCode or DirectAssign
        if (exclusiveType === 0) {
          setExclusiveType(1);
        }
      }
    }
  }, [visibilityType, exclusiveType, voucher]);

  // Convert API ISO date string to YYYY-MM-DDTHH:MM
  const formatDateTimeLocal = (isoString: string): string => {
    if (!isoString) return "";
    try {
      const date = new Date(isoString);
      // offset timezone
      const tzoffset = date.getTimezoneOffset() * 60000; //offset in milliseconds
      const localISOTime = (new Date(date.getTime() - tzoffset))
        .toISOString()
        .slice(0, 16);
      return localISOTime;
    } catch (e) {
      return "";
    }
  };

  const handleGenerateCode = async () => {
    if (isEditing) return;
    try {
      setGenerating(true);
      const res = await generateVoucherCode(token);
      setCode(res.code);
      setValidationErrors(prev => {
        const next = { ...prev };
        delete next.code;
        return next;
      });
      toast.success("Sinh mã voucher tự động thành công!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Không thể tạo mã voucher.");
    } finally {
      setGenerating(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!code.trim()) {
      errors.code = "Mã voucher là bắt buộc.";
    } else if (code.trim().length < 3) {
      errors.code = "Mã voucher phải chứa ít nhất 3 ký tự.";
    } else if (!/^[A-Z0-9_-]+$/i.test(code)) {
      errors.code = "Mã chỉ được chứa chữ cái, số, gạch ngang và gạch dưới.";
    }

    if (!name.trim()) {
      errors.name = "Tên voucher là bắt buộc.";
    } else if (name.trim().length < 3) {
      errors.name = "Tên voucher phải chứa ít nhất 3 ký tự.";
    }

    if (discountValue <= 0) {
      errors.discountValue = "Giá trị giảm giá phải lớn hơn 0.";
    } else if (discountType === 1 && discountValue > 100) {
      errors.discountValue = "Giảm giá theo % không được vượt quá 100%.";
    }

    if (minOrderValue < 0) {
      errors.minOrderValue = "Giá trị đơn hàng tối thiểu không được âm.";
    }

    if (maxDiscount < 0) {
      errors.maxDiscount = "Giá trị giảm tối đa không được âm.";
    }

    if (!startDate) {
      errors.startDate = "Ngày bắt đầu là bắt buộc.";
    }

    if (!endDate) {
      errors.endDate = "Ngày kết thúc là bắt buộc.";
    }

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start >= end) {
        errors.endDate = "Ngày kết thúc phải diễn ra sau ngày bắt đầu.";
      }
    }

    if (totalQuantity < 1) {
      errors.totalQuantity = "Tổng số lượng phát hành tối thiểu là 1.";
    } else if (voucher && totalQuantity < voucher.usedQuantity) {
      errors.totalQuantity = `Tổng số lượng không thể nhỏ hơn số lượng đã dùng (${voucher.usedQuantity}).`;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.warning("Vui lòng kiểm tra lại các thông tin.");
      return;
    }

    try {
      setSubmitting(true);

      const formattedStartDate = new Date(startDate).toISOString();
      const formattedEndDate = new Date(endDate).toISOString();

      if (isEditing && voucher) {
        const payload: UpdateVoucherPayload = {
          name: name.trim(),
          discountType,
          discountValue,
          minOrderValue,
          maxDiscount: discountType === 2 ? 0 : maxDiscount, // fixed cash doesn't need max discount
          startDate: formattedStartDate,
          endDate: formattedEndDate,
          totalQuantity,
          status,
          visibilityType,
          exclusiveType
        };

        const res = await updateVoucher(token, voucher.voucherID, payload);
        onSaveSuccess(res.message || "Cập nhật voucher thành công!");
      } else {
        const payload: CreateVoucherPayload = {
          code: code.toUpperCase().trim(),
          name: name.trim(),
          discountType,
          discountValue,
          minOrderValue,
          maxDiscount: discountType === 2 ? 0 : maxDiscount,
          startDate: formattedStartDate,
          endDate: formattedEndDate,
          totalQuantity,
          status,
          visibilityType,
          exclusiveType
        };

        const res = await createVoucher(token, payload);
        onSaveSuccess(res.message || "Tạo voucher mới thành công!");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Đã xảy ra lỗi khi lưu thông tin.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl">
              {isEditing ? "edit_calendar" : "add_card"}
            </span>
            <h3 className="text-lg font-bold text-slate-800">
              {isEditing ? `Chỉnh sửa Voucher: ${voucher?.code}` : "Tạo Voucher Mới"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-650 hover:bg-slate-100 transition-all cursor-pointer"
            title="Đóng"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-8 py-6 space-y-6" style={{ scrollbarWidth: "thin" }}>
          
          {/* Main Info Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Voucher Code */}
            <div>
              <label className="block text-xs font-bold text-slate-450 uppercase mb-2">
                Mã Voucher <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex gap-2">
                <input
                  type="text"
                  required
                  disabled={isEditing}
                  value={code}
                  onChange={e => {
                    setCode(e.target.value.toUpperCase());
                    if (validationErrors.code) {
                      setValidationErrors(prev => {
                        const next = { ...prev };
                        delete next.code;
                        return next;
                      });
                    }
                  }}
                  placeholder="Ví dụ: HELLO2026"
                  className={`flex-1 px-4 py-2.5 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-bold text-slate-800 ${
                    isEditing ? "opacity-60 cursor-not-allowed border-slate-200" : validationErrors.code ? "border-rose-300" : "border-slate-200"
                  }`}
                />
                {!isEditing && (
                  <button
                    type="button"
                    onClick={handleGenerateCode}
                    disabled={generating}
                    className="px-3 rounded-xl border border-primary text-primary hover:bg-primary-container/20 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
                  >
                    {generating ? (
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-primary border-t-transparent"></div>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-sm">casino</span>
                        <span>Sinh mã</span>
                      </>
                    )}
                  </button>
                )}
              </div>
              {validationErrors.code && (
                <p className="text-[10px] text-rose-500 font-semibold mt-1">{validationErrors.code}</p>
              )}
            </div>

            {/* Voucher Name */}
            <div>
              <label className="block text-xs font-bold text-slate-455 uppercase mb-2">
                Tên chương trình Voucher <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => {
                  setName(e.target.value);
                  if (validationErrors.name) {
                    setValidationErrors(prev => {
                      const next = { ...prev };
                      delete next.name;
                      return next;
                    });
                  }
                }}
                placeholder="Ví dụ: Giảm giá hè rực rỡ"
                className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-semibold text-slate-800 ${
                  validationErrors.name ? "border-rose-300" : "border-slate-200"
                }`}
              />
              {validationErrors.name && (
                <p className="text-[10px] text-rose-500 font-semibold mt-1">{validationErrors.name}</p>
              )}
            </div>
          </div>

          {/* Discount Policy Section */}
          <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100/80 space-y-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide border-b border-slate-100 pb-2 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-slate-400">payments</span>
              Chính sách giảm giá
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Discount Type */}
              <div>
                <label className="block text-[11px] font-bold text-slate-450 uppercase mb-1.5">
                  Loại giảm giá
                </label>
                <select
                  disabled={isEditing}
                  value={discountType}
                  onChange={e => {
                    const val = Number(e.target.value);
                    setDiscountType(val);
                    setDiscountValue(0);
                    setMaxDiscount(0);
                  }}
                  className={`w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs font-semibold text-slate-700 ${
                    isEditing ? "opacity-60 cursor-not-allowed" : ""
                  }`}
                >
                  <option value={1}>Theo phần trăm (%)</option>
                  <option value={2}>Tiền cố định (đ)</option>
                </select>
              </div>

              {/* Discount Value */}
              <div>
                <label className="block text-[11px] font-bold text-slate-450 uppercase mb-1.5">
                  Giá trị giảm ({discountType === 1 ? "%" : "đ"}) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={discountType === 1 ? 100 : undefined}
                  disabled={isEditing}
                  value={discountValue || ""}
                  onChange={e => {
                    setDiscountValue(Number(e.target.value));
                    if (validationErrors.discountValue) {
                      setValidationErrors(prev => {
                        const next = { ...prev };
                        delete next.discountValue;
                        return next;
                      });
                    }
                  }}
                  placeholder={discountType === 1 ? "Ví dụ: 10" : "Ví dụ: 50000"}
                  className={`w-full px-3 py-2 bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs font-semibold text-slate-800 ${
                    isEditing ? "opacity-60 cursor-not-allowed border-slate-200" : validationErrors.discountValue ? "border-rose-300" : "border-slate-200"
                  }`}
                />
                {validationErrors.discountValue && (
                  <p className="text-[10px] text-rose-500 font-semibold mt-1">{validationErrors.discountValue}</p>
                )}
              </div>

              {/* Max Discount (Only for percentage) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-450 uppercase mb-1.5">
                  Mức giảm tối đa (đ)
                </label>
                <input
                  type="number"
                  disabled={discountType === 2 || isEditing}
                  value={discountType === 2 ? "" : maxDiscount || ""}
                  onChange={e => setMaxDiscount(Number(e.target.value))}
                  placeholder={discountType === 2 ? "Không áp dụng" : "Không giới hạn (0)"}
                  className={`w-full px-3 py-2 bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs font-semibold text-slate-800 ${
                    discountType === 2 || isEditing ? "opacity-60 cursor-not-allowed bg-slate-100 border-slate-200" : "border-slate-200"
                  }`}
                />
              </div>
            </div>

            {/* Min Order Value */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-450 uppercase mb-1.5">
                  Đơn hàng tối thiểu để áp dụng (đ)
                </label>
                <input
                  type="number"
                  value={minOrderValue || ""}
                  onChange={e => setMinOrderValue(Number(e.target.value))}
                  placeholder="Ví dụ: 150000 (0 nếu không yêu cầu)"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs font-semibold text-slate-800"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-450 uppercase mb-1.5">
                  Số lượng phát hành tối đa
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={totalQuantity || ""}
                  onChange={e => {
                    setTotalQuantity(Number(e.target.value));
                    if (validationErrors.totalQuantity) {
                      setValidationErrors(prev => {
                        const next = { ...prev };
                        delete next.totalQuantity;
                        return next;
                      });
                    }
                  }}
                  placeholder="Ví dụ: 100"
                  className={`w-full px-3 py-2 bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs font-semibold text-slate-800 ${
                    validationErrors.totalQuantity ? "border-rose-300" : "border-slate-200"
                  }`}
                />
                {validationErrors.totalQuantity && (
                  <p className="text-[10px] text-rose-500 font-semibold mt-1">{validationErrors.totalQuantity}</p>
                )}
              </div>
            </div>
          </div>

          {/* Visibility and Distribution settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Visibility Type */}
            <div>
              <label className="block text-xs font-bold text-slate-450 uppercase mb-2">
                Hiển thị Voucher
              </label>
              <select
                disabled={isEditing}
                value={visibilityType}
                onChange={e => setVisibilityType(Number(e.target.value))}
                className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-semibold text-slate-700 ${
                  isEditing ? "opacity-60 cursor-not-allowed" : ""
                }`}
              >
                <option value={1}>Public (Công khai cho mọi khách hàng thấy/lưu)</option>
                <option value={2}>Exclusive (Riêng tư/Độc quyền)</option>
              </select>
            </div>

            {/* Exclusive Type */}
            <div>
              <label className="block text-xs font-bold text-slate-450 uppercase mb-2">
                Hình thức phân phối độc quyền
              </label>
              <select
                disabled={isEditing}
                value={exclusiveType}
                onChange={e => setExclusiveType(Number(e.target.value))}
                className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-semibold text-slate-700 ${
                  isEditing ? "opacity-60 cursor-not-allowed" : ""
                }`}
              >
                {visibilityType === 1 ? (
                  <>
                    <option value={0}>Không độc quyền (Mặc định)</option>
                    <option value={2}>Phát trực tiếp vào ví toàn bộ người dùng mới/cũ</option>
                  </>
                ) : (
                  <>
                    <option value={1}>Nhập mã thủ công để kích hoạt (Ví dụ: Mã ẩn truyền thông)</option>
                    <option value={2}>Admin chỉ định phân phối trực tiếp vào ví user</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Time Validity Period */}
          <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100/80 space-y-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide border-b border-slate-100 pb-2 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-slate-400">schedule</span>
              Thời gian áp dụng
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Start Date */}
              <div>
                <label className="block text-[11px] font-bold text-slate-450 uppercase mb-1.5">
                  Ngày bắt đầu có hiệu lực <span className="text-rose-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  value={startDate}
                  onChange={e => {
                    setStartDate(e.target.value);
                    if (validationErrors.startDate) {
                      setValidationErrors(prev => {
                        const next = { ...prev };
                        delete next.startDate;
                        return next;
                      });
                    }
                  }}
                  className={`w-full px-3 py-2 bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs font-semibold text-slate-800 ${
                    validationErrors.startDate ? "border-rose-300" : "border-slate-200"
                  }`}
                />
                {validationErrors.startDate && (
                  <p className="text-[10px] text-rose-500 font-semibold mt-1">{validationErrors.startDate}</p>
                )}
              </div>

              {/* End Date */}
              <div>
                <label className="block text-[11px] font-bold text-slate-450 uppercase mb-1.5">
                  Ngày kết thúc hiệu lực <span className="text-rose-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  value={endDate}
                  onChange={e => {
                    setEndDate(e.target.value);
                    if (validationErrors.endDate) {
                      setValidationErrors(prev => {
                        const next = { ...prev };
                        delete next.endDate;
                        return next;
                      });
                    }
                  }}
                  className={`w-full px-3 py-2 bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs font-semibold text-slate-800 ${
                    validationErrors.endDate ? "border-rose-300" : "border-slate-200"
                  }`}
                />
                {validationErrors.endDate && (
                  <p className="text-[10px] text-rose-500 font-semibold mt-1">{validationErrors.endDate}</p>
                )}
              </div>
            </div>
          </div>

          {/* Active Status Toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
            <div>
              <p className="text-xs font-bold text-slate-800">Trạng thái hoạt động</p>
              <p className="text-[9px] text-slate-400 mt-0.5">
                Cho phép hệ thống kiểm tra và áp dụng voucher khi khách mua hàng.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={status}
                onChange={e => setStatus(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5.5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </form>

        {/* Modal Footer Actions */}
        <div className="px-8 py-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-5 py-2 rounded-full border border-slate-200 text-slate-550 hover:bg-slate-100 font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
          >
            Hủy bỏ
          </button>
          
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-2 rounded-full bg-primary text-on-primary font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-primary/20 hover:bg-primary/95 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div>
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">save</span>
                <span>{isEditing ? "Cập nhật" : "Tạo Voucher"}</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
