"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, Calendar, Upload, Loader, Image as ImageIcon, Sparkles } from "lucide-react";
import { toast } from "@/lib/toast";
import { adminGetNotifications, adminUpdateNotification, adminGetTemplates } from "@/lib/api";
import TiptapEditor from "@/components/admin/shared/TiptapEditor";

const BUILT_IN_TEMPLATES = [
  {
    id: "builtin_1",
    templateName: "[Khuyến mãi] Siêu Sale Giảm 50%",
    templateCode: "BUILTIN_SALE50",
    templateContent: "Chào {FullName},\n\nLazPe gửi tặng bạn voucher {VoucherCode} giảm giá cực sốc 50% cho đơn hàng tiếp theo.\n\nÁp dụng cho tất cả danh mục sản phẩm từ hôm nay đến hết tuần. Mua sắm ngay!"
  },
  {
    id: "builtin_2",
    templateName: "[Chào mừng] Khách hàng mới đăng ký",
    templateCode: "BUILTIN_WELCOME",
    templateContent: "Chúc mừng {FullName} đã đăng ký tài khoản thành công tại LazPe!\n\nChúng tôi gửi tặng bạn mã giảm giá {VoucherCode} giảm 10% áp dụng cho đơn hàng đầu tiên của bạn.\n\nChúc bạn có những trải nghiệm mua sắm tuyệt vời cùng LazPe!"
  },
  {
    id: "builtin_3",
    templateName: "[Thành viên] Chúc mừng thăng hạng",
    templateCode: "BUILTIN_TIER_UP",
    templateContent: "Chúc mừng thành viên {FullName}!\n\nBạn đã tích lũy đủ điểm và thăng hạng thành công lên mức hạng {TierName}.\n\nLazPe đã gửi các voucher đặc quyền thăng hạng vào ví của bạn. Khám phá các ưu đãi đặc quyền của bạn ngay tại trang cá nhân!"
  },
  {
    id: "builtin_4",
    templateName: "[Hệ thống] Bảo trì nâng cấp dịch vụ",
    templateCode: "BUILTIN_MAINTENANCE",
    templateContent: "Kính gửi quý khách hàng,\n\nHệ thống LazPe sẽ tiến hành bảo trì định kỳ từ 01:00 đến 03:00 sáng ngày mai để nâng cấp hiệu năng và chất lượng dịch vụ.\n\nTrong thời gian này, các tính năng thanh toán có thể bị gián đoạn. Rất mong quý khách thông cảm cho sự bất tiện này!"
  },
  {
    id: "builtin_5",
    templateName: "[Sinh nhật] Quà tặng sinh nhật khách hàng",
    templateCode: "BUILTIN_BIRTHDAY",
    templateContent: "Chúc mừng sinh nhật {FullName}!\n\nNhân ngày đặc biệt này, LazPe xin gửi lời chúc tốt đẹp nhất và tặng riêng bạn voucher đặc biệt {VoucherCode} giảm 15% cho toàn bộ giỏ hàng.\n\nVoucher có hiệu lực trong vòng 30 ngày. Chúc bạn có một ngày sinh nhật thật ấm áp và ý nghĩa!"
  }
];

export default function EditCampaignPage() {
  const router = useRouter();
  const params = useParams();
  const idStr = params.id as string;
  const notifId = parseInt(idStr, 10);
  
  // State
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTab, setPreviewTab] = useState<"list" | "detail">("list");

  const [form, setForm] = useState({
    title: "",
    shortDescription: "",
    content: "",
    thumbnailImage: "",
    bannerImage: "",
    type: "System",
    customTypeName: "",
    priority: "Medium",
    actionType: "None",
    actionUrl: "",
    targetType: "All",
    targetValue: "",
    isPinned: false,
    sendOption: "now",
    publishDate: "",
    publishTime: ""
  });

  // Local helper states for Target values
  const [selectedTiers, setSelectedTiers] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedCondition, setSelectedCondition] = useState("noorders");
  const [specificUserIds, setSpecificUserIds] = useState("");

  useEffect(() => {
    const savedToken = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!savedToken) {
      window.location.replace("/login");
      return;
    }
    setToken(savedToken);
    
    if (isNaN(notifId)) {
      toast.error("Mã thông báo không hợp lệ");
      router.push("/admin/notifications");
      return;
    }

    loadInitialData(savedToken);
  }, [notifId]);

  const loadInitialData = async (authToken: string) => {
    setFetching(true);
    try {
      // Fetch templates
      const templateData = await adminGetTemplates(authToken);
      const dbTemplates = templateData || [];
      setTemplates([...BUILT_IN_TEMPLATES, ...dbTemplates]);

      // Fetch campaigns and find ours
      const campaignList = await adminGetNotifications(authToken);
      if (campaignList) {
        const camp = campaignList.find((c) => c.id === notifId);
        if (camp) {
          if (camp.status === "Sent") {
            toast.error("Không thể chỉnh sửa thông báo đã được gửi thành công");
            router.push("/admin/notifications");
            return;
          }

          let sendOpt = "now";
          let pDate = "";
          let pTime = "";
          
          if (camp.status === "Scheduled" && camp.publishedAt) {
            sendOpt = "schedule";
            const dateObj = new Date(camp.publishedAt);
            pDate = dateObj.toISOString().split("T")[0];
            pTime = dateObj.toTimeString().split(" ")[0].substring(0, 5);
          }

          const isCustomType = camp.type === 5 || camp.type === "Custom";

          setForm({
            title: camp.title,
            shortDescription: camp.shortDescription,
            content: camp.content,
            thumbnailImage: camp.thumbnailImage || "",
            bannerImage: camp.bannerImage || "",
            type: isCustomType ? "Custom" : camp.typeName,
            customTypeName: isCustomType ? camp.typeName : "",
            priority: camp.priorityName,
            actionType: camp.actionTypeName,
            actionUrl: camp.actionUrl || "",
            targetType: camp.targetTypeName,
            targetValue: camp.targetValue || "",
            isPinned: camp.isPinned,
            sendOption: sendOpt,
            publishDate: pDate,
            publishTime: pTime
          });

          // Prepopulate targeting helper states
          if (camp.targetTypeName === "LoyaltyTier" && camp.targetValue) {
            setSelectedTiers(camp.targetValue.split(","));
          } else if (camp.targetTypeName === "Role" && camp.targetValue) {
            setSelectedRoles(camp.targetValue.split(","));
          } else if (camp.targetTypeName === "Condition" && camp.targetValue) {
            setSelectedCondition(camp.targetValue);
          } else if (camp.targetTypeName === "SpecificUsers" && camp.targetValue) {
            setSpecificUserIds(camp.targetValue);
          }
        } else {
          toast.error("Không tìm thấy thông báo cần sửa");
          router.push("/admin/notifications");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi tải thông báo");
    } finally {
      setFetching(false);
    }
  };

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tplId = e.target.value;
    setSelectedTemplateId(tplId);
    if (!tplId) return;

    const tpl = templates.find(t => t.id.toString() === tplId);
    if (tpl) {
      setForm(prev => ({
        ...prev,
        content: tpl.templateContent
      }));
      toast.success(`Đã áp dụng mẫu: ${tpl.templateName}`);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: "thumbnailImage" | "bannerImage") => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "polystation/notifications");

    try {
      toast.success("Đang tải ảnh lên Cloudinary...");
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5101/api";
      const response = await fetch(`${API_BASE_URL}/Upload/image`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();
      if (response.ok && result.success) {
        setForm(prev => ({
          ...prev,
          [field]: result.url
        }));
        toast.success("Tải ảnh lên thành công!");
      } else {
        toast.error(result.message || "Tải ảnh lên thất bại");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi upload ảnh");
    }
  };

  const getCompiledTargetValue = () => {
    if (form.targetType === "LoyaltyTier") {
      return selectedTiers.join(",");
    }
    if (form.targetType === "Role") {
      return selectedRoles.join(",");
    }
    if (form.targetType === "Condition") {
      return selectedCondition;
    }
    if (form.targetType === "SpecificUsers") {
      return specificUserIds;
    }
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (!form.title || !form.shortDescription || !form.content) {
      toast.error("Vui lòng nhập đầy đủ Tiêu đề, Mô tả ngắn và Nội dung!");
      return;
    }

    setLoading(true);

    try {
      const compiledTargetValue = getCompiledTargetValue();
      
      let publishedAt: string | null = null;
      if (form.sendOption === "schedule" && form.publishDate && form.publishTime) {
        publishedAt = new Date(`${form.publishDate}T${form.publishTime}`).toISOString();
      }

      const payload = {
        title: form.title,
        shortDescription: form.shortDescription,
        content: form.content,
        thumbnailImage: form.thumbnailImage || null,
        bannerImage: form.bannerImage || null,
        type: parseInt(getTypeEnum(form.type)),
        customTypeName: form.type === "Custom" ? form.customTypeName : null,
        priority: parseInt(getPriorityEnum(form.priority)),
        actionType: parseInt(getActionTypeEnum(form.actionType)),
        actionUrl: form.actionUrl || null,
        targetType: parseInt(getTargetTypeEnum(form.targetType)),
        targetValue: compiledTargetValue || null,
        isPinned: form.isPinned,
        publishedAt: publishedAt,
        expiredAt: null
      };

      const result = await adminUpdateNotification(token, notifId, payload);
      if (result.success) {
        toast.success("Cập nhật chiến dịch thông báo thành công!");
        router.push("/admin/notifications");
      } else {
        toast.error(result.message || "Cập nhật chiến dịch thất bại");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi kết nối hệ thống");
    } finally {
      setLoading(false);
    }
  };

  const getTypeEnum = (val: string) => {
    const map: any = { "System": "0", "Promotion": "1", "Order": "2", "Membership": "3", "RewardPoints": "4", "Custom": "5" };
    return map[val] || "0";
  };

  const getPriorityEnum = (val: string) => {
    const map: any = { "Low": "0", "Medium": "1", "High": "2", "Critical": "3" };
    return map[val] || "1";
  };

  const getActionTypeEnum = (val: string) => {
    const map: any = { "None": "0", "Product": "1", "Voucher": "2", "Order": "3", "Membership": "4", "Promotion": "5", "CustomUrl": "6" };
    return map[val] || "0";
  };

  const getTargetTypeEnum = (val: string) => {
    const map: any = { "All": "0", "LoyaltyTier": "1", "Role": "2", "SpecificUsers": "3", "Condition": "4" };
    return map[val] || "0";
  };

  // Tiptap handles editor insertions internally

  if (fetching) {
    return (
      <div className="min-h-screen bg-slate-50 py-24 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-rose-500 mx-auto mb-3"></div>
          <p className="text-xs text-slate-500 font-semibold">Đang tải thông tin chiến dịch...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <Link
        href="/admin/notifications"
        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-xs font-bold w-fit transition-colors"
      >
        <ArrowLeft size={16} /> Quay lại danh sách chiến dịch
      </Link>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-8 space-y-6">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Chỉnh sửa Chiến dịch Thông báo</h2>
          <p className="text-xs text-slate-400 font-semibold mt-1">Cập nhật nội dung hoặc thay đổi lịch gửi của thông báo</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Tiêu đề thông báo *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ví dụ: Siêu Sale Giữa Tháng 50%!"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-rose-400 focus:bg-white text-slate-800"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Mô tả ngắn hiển thị *</label>
              <input
                type="text"
                value={form.shortDescription}
                onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
                placeholder="Mô tả tóm tắt hiển thị ở danh sách notification..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-rose-400 focus:bg-white text-slate-800"
                required
              />
            </div>
          </div>

          {/* Quick Template Selector */}
          <div className="space-y-1.5 p-4 bg-rose-50/20 border border-rose-100/50 rounded-2xl">
            <label className="text-xs font-bold text-rose-500 flex items-center gap-1.5">
              <Sparkles size={14} /> Chọn mẫu thông báo nhanh
            </label>
            <select
              value={selectedTemplateId}
              onChange={handleTemplateChange}
              className="w-full mt-1.5 px-3 py-2 bg-white border border-rose-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-rose-400 text-slate-700"
            >
              <option value="">-- Chọn mẫu thông báo có sẵn --</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.templateName} ({t.templateCode})</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Nội dung chi tiết thông báo *</label>
            <TiptapEditor
              value={form.content}
              onChange={(html) => setForm(prev => ({ ...prev, content: html }))}
              token={token}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Ảnh Thumbnail (Hiển thị ở danh sách)</label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center bg-slate-50 flex-shrink-0">
                  {form.thumbnailImage ? (
                    <img src={form.thumbnailImage} alt="Thumbnail Preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="text-slate-400" size={24} />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={form.thumbnailImage}
                    onChange={(e) => setForm({ ...form, thumbnailImage: e.target.value })}
                    placeholder="Nhập URL ảnh hoặc tải tệp lên..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-rose-400 focus:bg-white text-slate-800"
                  />
                  <label className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-[10px] font-bold flex items-center gap-1 w-fit cursor-pointer transition-colors">
                    <Upload size={12} /> Tải file ảnh lên
                    <input type="file" onChange={(e) => handleFileUpload(e, "thumbnailImage")} className="hidden" accept="image/*" />
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Ảnh Banner lớn (Hiển thị ở trang chi tiết)</label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center bg-slate-50 flex-shrink-0">
                  {form.bannerImage ? (
                    <img src={form.bannerImage} alt="Banner Preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="text-slate-400" size={24} />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={form.bannerImage}
                    onChange={(e) => setForm({ ...form, bannerImage: e.target.value })}
                    placeholder="Nhập URL ảnh hoặc tải tệp lên..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-rose-400 focus:bg-white text-slate-800"
                  />
                  <label className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-[10px] font-bold flex items-center gap-1 w-fit cursor-pointer transition-colors">
                    <Upload size={12} /> Tải file ảnh lên
                    <input type="file" onChange={(e) => handleFileUpload(e, "bannerImage")} className="hidden" accept="image/*" />
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Loại thông báo</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-rose-400 text-slate-700"
              >
                <option value="System">Hệ thống (Bảo trì, tính năng)</option>
                <option value="Promotion">Khuyến mãi (Voucher, Flash Sale)</option>
                <option value="Order">Đơn hàng (Đang giao, Hóa đơn)</option>
                <option value="Membership">Thành viên (Thăng hạng, Privilege)</option>
                <option value="RewardPoints">Điểm thưởng (Tích điểm, Đổi điểm)</option>
                <option value="Custom">Tùy chỉnh (Nhập tên loại thông báo riêng)</option>
              </select>
              
              {form.type === "Custom" && (
                <input
                  type="text"
                  placeholder="Nhập tên loại thông báo tự chọn (Ví dụ: Giao hàng, Bảo hành...)"
                  value={form.customTypeName || ""}
                  onChange={(e) => setForm({ ...form, customTypeName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-rose-400 focus:bg-white text-slate-800 mt-2 animate-in slide-in-from-top-1 duration-200"
                  required
                />
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Độ ưu tiên</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-rose-400 text-slate-700"
              >
                <option value="Low">Thấp</option>
                <option value="Medium">Trung bình</option>
                <option value="High">Cao</option>
                <option value="Critical">Khẩn cấp</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Hành động khi nhấn</label>
              <select
                value={form.actionType}
                onChange={(e) => setForm({ ...form, actionType: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-rose-400 text-slate-700"
              >
                <option value="None">Không điều hướng</option>
                <option value="Product">Trang chi tiết Sản phẩm</option>
                <option value="Voucher">Trang nhận Voucher</option>
                <option value="Order">Trang Lịch sử đơn hàng</option>
                <option value="Membership">Trang Thành viên Loyalty</option>
                <option value="Promotion">Trang khuyến mãi</option>
                <option value="CustomUrl">Liên kết URL tùy chọn</option>
              </select>
            </div>

            {form.actionType !== "None" && (
              <div className="space-y-1.5 animate-in fade-in duration-150">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {form.actionType === "Product" ? "Mã ID Sản phẩm (ProductId) *" : 
                   form.actionType === "CustomUrl" ? "Đường dẫn URL liên kết *" : "Tham số / Link bổ sung"}
                </label>
                <input
                  type="text"
                  value={form.actionUrl}
                  onChange={(e) => setForm({ ...form, actionUrl: e.target.value })}
                  placeholder={form.actionType === "Product" ? "Ví dụ: 12" : "Ví dụ: https://my-link.com"}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-rose-400 focus:bg-white text-slate-800"
                  required={form.actionType === "Product" || form.actionType === "CustomUrl"}
                />
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Đối tượng nhận thông báo *</label>
              <select
                value={form.targetType}
                onChange={(e) => setForm({ ...form, targetType: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-rose-400 text-slate-700"
              >
                <option value="All">Tất cả khách hàng</option>
                <option value="LoyaltyTier">Theo hạng thành viên Loyalty</option>
                <option value="Role">Theo vai trò phân quyền (Role)</option>
                <option value="SpecificUsers">Theo danh sách User ID cụ thể</option>
                <option value="Condition">Theo hành động / điều kiện hệ thống</option>
              </select>
            </div>

            {form.targetType === "LoyaltyTier" && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 flex flex-wrap gap-4 animate-in fade-in duration-200">
                <span className="block text-xs font-bold text-slate-600 w-full mb-1">Chọn các hạng thành viên nhận tin:</span>
                {["Bronze", "Silver", "Gold", "Platinum", "Diamond"].map(tier => (
                  <label key={tier} className="flex items-center gap-2 cursor-pointer font-semibold text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={selectedTiers.includes(tier)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedTiers([...selectedTiers, tier]);
                        else setSelectedTiers(selectedTiers.filter(t => t !== tier));
                      }}
                      className="w-4 h-4 rounded border-slate-200 text-rose-500 focus:ring-rose-400"
                    />
                    {tier === "Bronze" ? "Đồng (Bronze)" : tier === "Silver" ? "Bạc (Silver)" : tier === "Gold" ? "Vàng (Gold)" : tier === "Platinum" ? "Bạch Kim (Platinum)" : "Kim Cương (Diamond)"}
                  </label>
                ))}
              </div>
            )}

            {form.targetType === "Role" && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 flex flex-wrap gap-4 animate-in fade-in duration-200">
                <span className="block text-xs font-bold text-slate-600 w-full mb-1">Chọn các vai trò nhận tin:</span>
                {["Customer", "Staff", "Admin"].map(role => (
                  <label key={role} className="flex items-center gap-2 cursor-pointer font-semibold text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={selectedRoles.includes(role)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedRoles([...selectedRoles, role]);
                        else setSelectedRoles(selectedRoles.filter(r => r !== role));
                      }}
                      className="w-4 h-4 rounded border-slate-200 text-rose-500 focus:ring-rose-400"
                    />
                    {role}
                  </label>
                ))}
              </div>
            )}

            {form.targetType === "Condition" && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 animate-in fade-in duration-200">
                <label className="block text-xs font-bold text-slate-600 mb-2">Chọn điều kiện lọc thông minh:</label>
                <select
                  value={selectedCondition}
                  onChange={(e) => setSelectedCondition(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-rose-400 text-slate-700"
                >
                  <option value="noorders">Khách hàng chưa mua hàng lần nào</option>
                  <option value="hasorders">Khách hàng đã từng mua hàng</option>
                  <option value="haspoints">Khách hàng có số dư điểm tích lũy &gt; 0</option>
                  <option value="tierexpiring">Khách hàng sắp hết hạn hạng thành viên trong vòng 7 ngày</option>
                </select>
              </div>
            )}

            {form.targetType === "SpecificUsers" && (
              <div className="space-y-1.5 animate-in fade-in duration-200">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Danh sách User IDs nhận tin (Ngăn cách bằng dấu phẩy)</label>
                <textarea
                  rows={2}
                  value={specificUserIds}
                  onChange={(e) => setSpecificUserIds(e.target.value)}
                  placeholder="Ví dụ: a2c18d9f-..., b9d0124c-..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-1 focus:ring-rose-400 focus:bg-white text-slate-800"
                  required
                />
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-4">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Lịch phát hành thông báo</label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-700">
                  <input
                    type="radio"
                    name="send-opt"
                    checked={form.sendOption === "now"}
                    onChange={() => setForm({ ...form, sendOption: "now" })}
                    className="w-4 h-4 text-rose-500 focus:ring-rose-400"
                  />
                  Gửi ngay lập tức (Realtime)
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-700">
                  <input
                    type="radio"
                    name="send-opt"
                    checked={form.sendOption === "schedule"}
                    onChange={() => setForm({ ...form, sendOption: "schedule" })}
                    className="w-4 h-4 text-rose-500 focus:ring-rose-400"
                  />
                  Lên lịch gửi tự động
                </label>
              </div>
            </div>

            {form.sendOption === "schedule" && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-wrap gap-4 animate-in fade-in duration-200">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500">Ngày gửi *</label>
                  <input
                    type="date"
                    value={form.publishDate}
                    onChange={(e) => setForm({ ...form, publishDate: e.target.value })}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-rose-400 text-slate-700"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500">Giờ gửi *</label>
                  <input
                    type="time"
                    value={form.publishTime}
                    onChange={(e) => setForm({ ...form, publishTime: e.target.value })}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-rose-400 text-slate-700"
                    required
                  />
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center gap-2">
            <input
              type="checkbox"
              id="notif-pinned"
              checked={form.isPinned}
              onChange={(e) => setForm({ ...form, isPinned: e.target.checked })}
              className="w-4 h-4 rounded border-slate-200 text-rose-500 focus:ring-rose-400"
            />
            <label htmlFor="notif-pinned" className="text-xs font-bold text-slate-700 flex items-center gap-1 cursor-pointer">
              Ghim thông báo này lên đầu danh sách của khách hàng
            </label>
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => router.push("/admin/notifications")}
              className="px-5 py-3 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="px-5 py-3 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors flex items-center gap-1"
            >
              <Sparkles size={14} className="text-rose-500" /> Xem trước
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 disabled:opacity-50 active:scale-95 shadow-md shadow-rose-500/10 transition-all"
            >
              {loading ? (
                <>
                  <Loader className="animate-spin" size={14} /> Đang lưu...
                </>
              ) : (
                <>
                  <Save size={14} /> Cập nhật chiến dịch
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Preview Modal */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setPreviewOpen(false)}
          />
          
          {/* Preview Container */}
          <div className="bg-slate-50 rounded-3xl w-full max-w-[640px] shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] relative z-10 transform scale-100 transition-all duration-300 animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 bg-white flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">Xem trước thông báo (Khách hàng thấy)</h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Hiển thị mô phỏng trên thiết device của khách hàng</p>
              </div>
              <button 
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Toggle tabs */}
            <div className="bg-white border-b border-slate-100 px-5 py-2.5 flex gap-2">
              <button
                type="button"
                onClick={() => setPreviewTab("list")}
                className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all ${
                  previewTab === "list" 
                    ? "bg-rose-500 text-white shadow-sm" 
                    : "bg-slate-50 text-slate-600 hover:text-rose-500 hover:bg-slate-100"
                }`}
              >
                Giao diện Danh sách (Inbox list)
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab("detail")}
                className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all ${
                  previewTab === "detail" 
                    ? "bg-rose-500 text-white shadow-sm" 
                    : "bg-slate-50 text-slate-600 hover:text-rose-500 hover:bg-slate-100"
                }`}
              >
                Giao diện Chi tiết (Popup detail)
              </button>
            </div>

            {/* Simulated Content Area */}
            <div className="p-6 overflow-y-auto flex-1">
              {previewTab === "list" ? (
                /* SIMULATED INBOX ITEM */
                <div className="max-w-[450px] mx-auto bg-white rounded-2xl p-4 border border-rose-200 bg-rose-50/10 shadow-[0_4px_12px_rgba(135,78,88,0.02)] relative flex gap-4">
                  {/* Pin badge simulation */}
                  {form.isPinned && (
                    <span className="absolute top-0 left-6 -translate-y-1/2 bg-rose-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-sm flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[8px] font-bold">push_pin</span>
                      Ghim
                    </span>
                  )}

                  {/* Thumbnail */}
                  <div className={`w-10 h-10 rounded-xl border flex-shrink-0 flex items-center justify-center relative overflow-hidden bg-rose-50 text-rose-600 border-rose-100`}>
                    {form.thumbnailImage ? (
                      <img src={form.thumbnailImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-base">
                        {form.type === "System" ? "settings" : form.type === "Promotion" ? "campaign" : form.type === "Order" ? "local_shipping" : form.type === "Membership" ? "military_tech" : "stars"}
                      </span>
                    )}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs text-slate-800 line-clamp-1 leading-snug font-bold text-slate-900">
                        {form.title || "Tiêu đề thông báo"}
                      </h3>
                      <span className="w-1.5 h-1.5 bg-rose-500 rounded-full flex-shrink-0"></span>
                    </div>
                    
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                      {form.shortDescription || "Mô tả ngắn gọn về thông báo này..."}
                    </p>
                    
                    <div className="flex items-center gap-2 mt-2 text-[9px] text-slate-400 font-bold">
                      <span>{new Date().toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" })}</span>
                      <span>•</span>
                      <span className="uppercase tracking-wider text-[8px]">{form.type}</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* SIMULATED DETAIL VIEW */
                <div className="max-w-[500px] mx-auto bg-white rounded-2xl border border-slate-100 shadow-[0_12px_24px_rgba(135,78,88,0.04)] overflow-hidden">
                  {/* Banner Image */}
                  {form.bannerImage && (
                    <div className="w-full h-36 bg-slate-100 overflow-hidden relative border-b border-slate-100">
                      <img
                        src={form.bannerImage}
                        alt="Banner"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Body Wrapper */}
                  <div className="p-5 space-y-4">
                    {/* Tags */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border bg-rose-50 text-rose-600 border-rose-100`}>
                        {form.type}
                      </span>
                      {(form.priority === "Critical" || form.priority === "High") && (
                        <span className="bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded-lg text-[8px] font-bold uppercase tracking-wider">
                          Quan trọng
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h2 className="text-base font-extrabold text-slate-800 leading-tight">
                      {form.title || "Tiêu đề thông báo"}
                    </h2>

                    {/* Short Description */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100/50">
                      <p className="text-slate-600 text-[11px] font-semibold leading-relaxed">
                        {form.shortDescription || "Mô tả ngắn gọn về thông báo này..."}
                      </p>
                    </div>

                    {/* Editor Content */}
                    <div 
                      className="tiptap prose prose-slate max-w-none text-slate-700 text-xs leading-relaxed mb-4 whitespace-pre-line border-t border-slate-100 pt-3"
                      dangerouslySetInnerHTML={{ __html: form.content || "<p className='text-slate-400 italic'>Chưa nhập nội dung chi tiết...</p>" }}
                    />

                    {/* Action Button */}
                    {form.actionType !== "None" && form.actionUrl && (
                      <div className="pt-3 border-t border-slate-100 flex justify-end">
                        <button
                          type="button"
                          className="px-4 py-2 bg-rose-500 text-white rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all"
                        >
                          {form.actionType === "Product" ? "Xem sản phẩm" : form.actionType === "Voucher" ? "Nhận Voucher ngay" : form.actionType === "Order" ? "Xem chi tiết đơn hàng" : form.actionType === "Membership" ? "Xem hạng thành viên" : form.actionType === "Promotion" ? "Xem chương trình khuyến mãi" : "Đi đến liên kết"}
                          <span className="material-symbols-outlined text-[10px] font-bold">open_in_new</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-white flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all active:scale-95"
              >
                Đóng xem trước
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
