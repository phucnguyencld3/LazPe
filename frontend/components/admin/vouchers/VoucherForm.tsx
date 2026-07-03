"use client";

import type { FormEvent } from "react";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import {
  VoucherAdminInfo,
  CreateVoucherPayload,
  UpdateVoucherPayload,
  generateVoucherCode,
  createVoucher,
  updateVoucher
} from "@/lib/features/vouchers/voucherApi";

interface VoucherFormProps {
  voucher: VoucherAdminInfo | null; // null for Create, object for Edit
  token: string;
}

export default function VoucherForm({
  voucher,
  token
}: VoucherFormProps) {
  const router = useRouter();
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
  const [voucherType, setVoucherType] = useState<number>(1); // 1: ProductDiscount, 2: ShippingDiscount
  const [isFreeShipping, setIsFreeShipping] = useState(false);
  const [maxShippingDiscount, setMaxShippingDiscount] = useState<number | null>(null);
  const [usageLimitPerUser, setUsageLimitPerUser] = useState<number>(1);

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
      setVoucherType(voucher.voucherType || 1);
      setIsFreeShipping(voucher.isFreeShipping || false);
      setMaxShippingDiscount(voucher.maxShippingDiscount !== null ? Number(voucher.maxShippingDiscount) : null);
      setUsageLimitPerUser(voucher.usageLimitPerUser || 1);
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
      setVoucherType(1);
      setIsFreeShipping(false);
      setMaxShippingDiscount(null);
      setUsageLimitPerUser(1);
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

    if (voucherType === 2 && isFreeShipping) {
      // Free shipping has no discount value requirements
    } else {
      if (discountValue <= 0) {
        errors.discountValue = "Giá trị giảm giá phải lớn hơn 0.";
      } else if (discountType === 1 && discountValue > 100) {
        errors.discountValue = "Giảm giá theo % không được vượt quá 100%.";
      }
    }

    if (minOrderValue < 0) {
      errors.minOrderValue = "Giá trị đơn hàng tối thiểu không được âm.";
    }

    if (maxDiscount < 0) {
      errors.maxDiscount = "Giá trị giảm tối đa không được âm.";
    }

    if (voucherType === 2 && !isFreeShipping) {
      if (maxShippingDiscount !== null && maxShippingDiscount < 0) {
        errors.maxShippingDiscount = "Mức giảm phí ship tối đa không được âm.";
      }
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

    if (usageLimitPerUser < 1) {
      errors.usageLimitPerUser = "Giới hạn sử dụng mỗi người tối thiểu là 1.";
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

      const calculatedDiscountType = (voucherType === 2 && isFreeShipping) ? 1 : discountType;
      const calculatedDiscountValue = (voucherType === 2 && isFreeShipping) ? 100 : discountValue;
      const calculatedMaxDiscount = discountType === 2 ? 0 : maxDiscount;

      if (isEditing && voucher) {
        const payload: UpdateVoucherPayload = {
          name: name.trim(),
          discountType: calculatedDiscountType,
          discountValue: calculatedDiscountValue,
          minOrderValue,
          maxDiscount: calculatedMaxDiscount,
          startDate: formattedStartDate,
          endDate: formattedEndDate,
          totalQuantity,
          status,
          visibilityType,
          exclusiveType,
          voucherType,
          isFreeShipping,
          maxShippingDiscount: (voucherType === 2 && !isFreeShipping) ? maxShippingDiscount : null,
          usageLimitPerUser
        };

        const res = await updateVoucher(token, voucher.voucherID, payload);
        toast.success(res.message || "Cập nhật voucher thành công!");
        router.push("/admin/vouchers");
      } else {
        const payload: CreateVoucherPayload = {
          code: code.toUpperCase().trim(),
          name: name.trim(),
          discountType: calculatedDiscountType,
          discountValue: calculatedDiscountValue,
          minOrderValue,
          maxDiscount: calculatedMaxDiscount,
          startDate: formattedStartDate,
          endDate: formattedEndDate,
          totalQuantity,
          status,
          visibilityType,
          exclusiveType,
          voucherType,
          isFreeShipping,
          maxShippingDiscount: (voucherType === 2 && !isFreeShipping) ? maxShippingDiscount : null,
          usageLimitPerUser
        };

        const res = await createVoucher(token, payload);
        toast.success(res.message || "Tạo voucher mới thành công!");
        router.push("/admin/vouchers");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Đã xảy ra lỗi khi lưu thông tin.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm w-full flex flex-col overflow-hidden animate-in fade-in duration-300">

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
            type="button"
            onClick={() => router.push("/admin/vouchers")}
            className="pr-4 pl-3 py-2 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            title="Quay lại"
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span> Quay lại
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Cột trái: Thông tin cơ bản & Phân phối */}
            <div className="space-y-5">

              {/* Thông tin cơ bản */}
              <div className="bg-slate-50/30 p-5 rounded-2xl border border-slate-100/80 space-y-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide border-b border-slate-100 pb-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-slate-400">info</span>
                  Thông tin cơ bản
                </h4>

                {/* Voucher Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-455 uppercase mb-2">
                    Loại Voucher
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      disabled={isEditing}
                      onClick={() => {
                        setVoucherType(1);
                        setIsFreeShipping(false);
                      }}
                      className={`py-2 px-4 rounded-xl border font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 ${
                        voucherType === 1
                          ? "bg-primary text-on-primary border-primary"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">local_mall</span>
                      Giảm sản phẩm
                    </button>
                    <button
                      type="button"
                      disabled={isEditing}
                      onClick={() => setVoucherType(2)}
                      className={`py-2 px-4 rounded-xl border font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 ${
                        voucherType === 2
                          ? "bg-primary text-on-primary border-primary"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">local_shipping</span>
                      Giảm phí ship
                    </button>
                  </div>
                </div>

                {/* Voucher Code */}
                <div>
                  <label className="block text-xs font-bold text-slate-455 uppercase mb-2">
                    Mã Voucher <span className="text-rose-500">*</span>
                  </label>
                  
                  {isEditing ? (
                    <div className="flex items-center justify-between p-3.5 bg-gradient-to-r from-slate-50 to-slate-100/50 border border-slate-200 rounded-2xl shadow-sm">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                          <span className="material-symbols-outlined text-[18px]">vpn_key</span>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">Mã voucher cố định</p>
                          <p className="text-sm font-extrabold text-slate-800 tracking-wider font-mono select-all cursor-pointer" title="Nhấn để bôi đen">{code}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(code);
                            toast.success("Đã sao chép mã voucher vào bộ nhớ tạm!");
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-white border border-transparent hover:border-slate-150 transition-all cursor-pointer flex items-center justify-center"
                          title="Sao chép mã"
                        >
                          <span className="material-symbols-outlined text-[16px]">content_copy</span>
                        </button>
                        <span 
                          className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-bold text-slate-500 border border-slate-200 flex items-center gap-1"
                          title="Mã voucher không thể thay đổi sau khi tạo"
                        >
                          <span className="material-symbols-outlined text-[12px]">lock</span>
                          Cố định
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
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
                        placeholder="Nhập mã voucher (Ví dụ: APPSUMMER)"
                        className={`flex-grow px-4 py-2.5 bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-semibold uppercase text-slate-800 ${
                          validationErrors.code ? "border-rose-300" : "border-slate-200"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={handleGenerateCode}
                        disabled={generating}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border border-slate-200 shrink-0 cursor-pointer disabled:opacity-50"
                      >
                        {generating ? (
                          <div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-sm">casino</span>
                            <span>Sinh mã</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
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
                    className={`w-full px-4 py-2.5 bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-semibold text-slate-800 ${validationErrors.name ? "border-rose-300" : "border-slate-200"
                      }`}
                  />
                  {validationErrors.name && (
                    <p className="text-[10px] text-rose-500 font-semibold mt-1">{validationErrors.name}</p>
                  )}
                </div>
              </div>

              {/* Cấu hình phân phối */}
              <div className="bg-slate-50/30 p-5 rounded-2xl border border-slate-100/80 space-y-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide border-b border-slate-100 pb-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-slate-400">visibility</span>
                  Cấu hình phân phối
                </h4>

                {/* Visibility Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-455 uppercase mb-2">
                    Hiển thị Voucher
                  </label>
                  <select
                    value={visibilityType}
                    onChange={e => setVisibilityType(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs font-semibold text-slate-700"
                  >
                    <option value={1}>Công khai (Cho mọi khách hàng thấy/lưu)</option>
                    <option value={2}>Riêng tư (Độc quyền)</option>
                  </select>
                </div>

                {/* Exclusive Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-455 uppercase mb-2">
                    Hình thức phân phối độc quyền
                  </label>
                  <select
                    value={exclusiveType}
                    onChange={e => setExclusiveType(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs font-semibold text-slate-700"
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

            </div>

            {/* Cột phải: Chính sách giảm giá & Thời gian áp dụng */}
            <div className="space-y-5">

              {/* Chính sách giảm giá */}
              <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100/80 space-y-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide border-b border-slate-100 pb-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-slate-400">payments</span>
                  Chính sách giảm giá
                </h4>

                {voucherType === 2 && (
                  <div className="flex items-center justify-between p-3.5 bg-sky-50/50 border border-sky-100 rounded-xl">
                    <div>
                      <p className="text-xs font-bold text-sky-805">Miễn phí vận chuyển (Free Shipping)</p>
                      <p className="text-[9px] text-sky-600 mt-0.5">
                        Tự động giảm 100% toàn bộ phí vận chuyển của đơn hàng.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isFreeShipping}
                        onChange={e => {
                          setIsFreeShipping(e.target.checked);
                          if (e.target.checked) {
                            setDiscountType(1);
                            setDiscountValue(100);
                            setMaxDiscount(0);
                            setMaxShippingDiscount(null);
                          }
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5.5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-sky-600"></div>
                    </label>
                  </div>
                )}

                {!(voucherType === 2 && isFreeShipping) ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Discount Type */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-455 uppercase mb-1.5">
                        Loại giảm giá
                      </label>
                      <select
                        value={discountType}
                        onChange={e => {
                          const val = Number(e.target.value);
                          setDiscountType(val);
                          setDiscountValue(0);
                          setMaxDiscount(0);
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs font-semibold text-slate-700"
                      >
                        <option value={1}>Theo phần trăm (%)</option>
                        <option value={2}>Tiền cố định (đ)</option>
                      </select>
                    </div>

                    {/* Discount Value */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-455 uppercase mb-1.5">
                        Giá trị giảm ({discountType === 1 ? "%" : "đ"}) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min={1}
                        max={discountType === 1 ? 100 : undefined}
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
                        className={`w-full px-3 py-2 bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs font-semibold text-slate-855 ${validationErrors.discountValue ? "border-rose-300" : "border-slate-200"
                          }`}
                      />
                      {validationErrors.discountValue && (
                        <p className="text-[10px] text-rose-500 font-semibold mt-1">{validationErrors.discountValue}</p>
                      )}
                    </div>

                    {/* Max Discount (Only for percentage) */}
                    <div>
                      {voucherType === 1 ? (
                        <>
                          <label className="block text-[11px] font-bold text-slate-455 uppercase mb-1.5">
                            Mức giảm tối đa (đ)
                          </label>
                          <input
                            type="number"
                            disabled={discountType === 2}
                            value={discountType === 2 ? "" : maxDiscount || ""}
                            onChange={e => setMaxDiscount(Number(e.target.value))}
                            placeholder={discountType === 2 ? "Không áp dụng" : "Không giới hạn (0)"}
                            className={`w-full px-3 py-2 bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs font-semibold text-slate-855 ${discountType === 2 ? "opacity-60 cursor-not-allowed bg-slate-100 border-slate-200" : "border-slate-200"
                              }`}
                          />
                        </>
                      ) : (
                        <>
                          <label className="block text-[11px] font-bold text-slate-455 uppercase mb-1.5">
                            Mức giảm ship tối đa (đ)
                          </label>
                          <input
                            type="number"
                            disabled={discountType === 2}
                            value={discountType === 2 ? "" : maxShippingDiscount || ""}
                            onChange={e => setMaxShippingDiscount(e.target.value ? Number(e.target.value) : null)}
                            placeholder={discountType === 2 ? "Không áp dụng" : "Không giới hạn"}
                            className={`w-full px-3 py-2 bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs font-semibold text-slate-855 ${discountType === 2 ? "opacity-60 cursor-not-allowed bg-slate-100 border-slate-200" : "border-slate-200"
                              }`}
                          />
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-center text-xs text-slate-500 font-semibold">
                    Đã chọn Miễn phí vận chuyển. Tự động giảm 100% phí ship gốc.
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Min Order Value */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-455 uppercase mb-1.5">
                      Đơn hàng tối thiểu (đ)
                    </label>
                    <input
                      type="number"
                      value={minOrderValue || ""}
                      onChange={e => setMinOrderValue(Number(e.target.value))}
                      placeholder="Ví dụ: 150000 (0 nếu không yêu cầu)"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs font-semibold text-slate-855"
                    />
                  </div>

                  {/* Total Quantity */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-455 uppercase mb-1.5">
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
                      className={`w-full px-3 py-2 bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs font-semibold text-slate-855 ${validationErrors.totalQuantity ? "border-rose-300" : "border-slate-200"
                        }`}
                    />
                    {validationErrors.totalQuantity && (
                      <p className="text-[10px] text-rose-500 font-semibold mt-1">{validationErrors.totalQuantity}</p>
                    )}
                  </div>

                  {/* Usage Limit Per User */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-455 uppercase mb-1.5">
                      Giới hạn dùng/Người
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={usageLimitPerUser || ""}
                      onChange={e => {
                        setUsageLimitPerUser(Number(e.target.value));
                        if (validationErrors.usageLimitPerUser) {
                          setValidationErrors(prev => {
                            const next = { ...prev };
                            delete next.usageLimitPerUser;
                            return next;
                          });
                        }
                      }}
                      placeholder="Ví dụ: 1"
                      className={`w-full px-3 py-2 bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs font-semibold text-slate-855 ${validationErrors.usageLimitPerUser ? "border-rose-300" : "border-slate-200"
                        }`}
                    />
                    {validationErrors.usageLimitPerUser && (
                      <p className="text-[10px] text-rose-500 font-semibold mt-1">{validationErrors.usageLimitPerUser}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Thời gian áp dụng */}
              <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100/80 space-y-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide border-b border-slate-100 pb-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-slate-400">schedule</span>
                  Thời gian áp dụng
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      className={`w-full px-3 py-2 bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs font-semibold text-slate-855 ${validationErrors.startDate ? "border-rose-300" : "border-slate-200"
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
                      className={`w-full px-3 py-2 bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs font-semibold text-slate-855 ${validationErrors.endDate ? "border-rose-300" : "border-slate-200"
                        }`}
                    />
                    {validationErrors.endDate && (
                      <p className="text-[10px] text-rose-500 font-semibold mt-1">{validationErrors.endDate}</p>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </form>

        {/* Modal Footer Actions */}
        <div className="px-8 py-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push("/admin/vouchers")}
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
  );
}
