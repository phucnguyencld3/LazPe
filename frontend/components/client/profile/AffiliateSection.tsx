"use client";

import React, { useEffect, useState } from "react";
import { getAffiliateDashboard, getAffiliateLinks, registerAffiliate, AffiliateDashboardStats, AffiliateLink } from "@/lib/api";
import { toast } from "@/lib/toast";

interface Props {
  token: string;
}

export default function AffiliateSection({ token }: Props) {
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [stats, setStats] = useState<AffiliateDashboardStats | null>(null);
  const [links, setLinks] = useState<AffiliateLink[]>([]);
  const [agreed, setAgreed] = useState(false);
  const [newProductId, setNewProductId] = useState("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getAffiliateDashboard(token);
      if (data && data.monthlyRevenue !== undefined) {
        setIsRegistered(true);
        setStats(data);
        
        const myLinks = await getAffiliateLinks(token);
        setLinks(myLinks);
      } else {
        setIsRegistered(false);
      }
    } catch (error) {
      console.error(error);
      setIsRegistered(false);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!agreed) {
      toast.error("Vui lòng đồng ý với điều khoản");
      return;
    }
    const res = await registerAffiliate(token);
    if (res.success) {
      toast.success("Đăng ký thành công!");
      fetchData(); // Reload
    } else {
      toast.error(res.message || "Đăng ký thất bại");
    }
  };

  const handleGenerateLink = async () => {
    if (!newProductId) {
      toast.error("Vui lòng nhập ID sản phẩm");
      return;
    }
    const productId = parseInt(newProductId);
    if (isNaN(productId) || productId <= 0) {
      toast.error("ID sản phẩm không hợp lệ");
      return;
    }

    setGenerating(true);
    try {
      const res = await generateAffiliateLink(token, productId);
      if (res.success) {
        toast.success("Tạo link thành công!");
        setNewProductId("");
        // Tải lại danh sách link
        const myLinks = await getAffiliateLinks(token);
        setLinks(myLinks);
      } else {
        toast.error(res.message || "Tạo link thất bại");
      }
    } catch (e) {
      console.error(e);
      toast.error("Lỗi kết nối");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-[12px] p-6 shadow-sm border border-slate-100 flex items-center justify-center h-48">
        <span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span>
      </div>
    );
  }

  if (!isRegistered) {
    return (
      <div className="bg-white rounded-[12px] p-6 shadow-sm border border-slate-100 max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-primary text-3xl">campaign</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Đăng ký Affiliate Marketing</h2>
          <p className="text-slate-500 text-sm">
            Tham gia chương trình Tiếp thị liên kết của LazPe để nhận phần thưởng hấp dẫn khi giới thiệu sản phẩm.
          </p>
        </div>

        <div className="bg-slate-50 rounded-[10px] p-4 mb-6">
          <h3 className="font-bold text-slate-700 text-sm mb-3">Quyền lợi của bạn:</h3>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
              Nhận voucher cực hot khi đạt doanh số tháng
            </li>
            <li className="flex gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
              Tích luỹ điểm Affiliate Point đổi quà
            </li>
            <li className="flex gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
              Theo dõi dễ dàng qua Dashboard trực quan
            </li>
          </ul>
        </div>

        <label className="flex items-start gap-2 cursor-pointer mb-6">
          <input 
            type="checkbox" 
            className="mt-1 w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
          />
          <span className="text-sm text-slate-600">
            Tôi đồng ý với <a href="#" className="text-primary hover:underline">Điều khoản & Điều kiện</a> của chương trình Tiếp thị liên kết LazPe.
          </span>
        </label>

        <button 
          onClick={handleRegister}
          disabled={!agreed}
          className={`w-full py-3 rounded-full font-bold text-white transition-all ${
            agreed ? "bg-primary hover:shadow-md hover:shadow-primary/30" : "bg-slate-300 cursor-not-allowed"
          }`}
        >
          Trở thành đối tác Affiliate
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-primary to-orange-400 rounded-[12px] p-5 text-white shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-white/80">payments</span>
            <span className="font-medium text-sm text-white/90">Doanh thu tháng này</span>
          </div>
          <div className="text-2xl font-bold">
            {stats?.monthlyRevenue?.toLocaleString('vi-VN')}đ
          </div>
        </div>
        <div className="bg-white border border-slate-100 rounded-[12px] p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-slate-400">history</span>
            <span className="font-medium text-sm text-slate-500">Tổng doanh thu trọn đời</span>
          </div>
          <div className="text-xl font-bold text-slate-800">
            {stats?.lifetimeRevenue?.toLocaleString('vi-VN')}đ
          </div>
        </div>
        <div className="bg-white border border-slate-100 rounded-[12px] p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-yellow-500">star</span>
            <span className="font-medium text-sm text-slate-500">Điểm Affiliate</span>
          </div>
          <div className="text-xl font-bold text-slate-800">
            {stats?.affiliatePoint?.toLocaleString('vi-VN')} điểm
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-50 border border-slate-100 rounded-[12px] p-4 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-slate-500 font-medium">Lượt click link</p>
            <p className="text-lg font-bold text-slate-800">{stats?.totalClicks || 0}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
            <span className="material-symbols-outlined text-blue-500">touch_app</span>
          </div>
        </div>
        <div className="bg-slate-50 border border-slate-100 rounded-[12px] p-4 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-slate-500 font-medium">Đơn hàng thành công</p>
            <p className="text-lg font-bold text-slate-800">{stats?.totalConversions || 0}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
            <span className="material-symbols-outlined text-green-500">shopping_bag</span>
          </div>
        </div>
      </div>

      {/* Milestones Progress */}
      {stats?.milestones && stats.milestones.length > 0 && (
        <div className="bg-white rounded-[12px] p-5 shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">emoji_events</span>
            Tiến trình đạt Voucher tháng
          </h3>
          <div className="space-y-4">
            {stats.milestones.map((ms) => {
              const progress = Math.min((stats.monthlyRevenue / ms.requiredRevenue) * 100, 100);
              return (
                <div key={ms.milestoneId} className="space-y-2">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-sm font-bold text-slate-700">{ms.voucherName}</p>
                      <p className="text-xs text-slate-500">Mốc: {ms.requiredRevenue.toLocaleString('vi-VN')}đ</p>
                    </div>
                    {ms.isAchieved ? (
                      <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">Đã nhận thưởng</span>
                    ) : (
                      <span className="text-xs font-medium text-slate-500">{progress.toFixed(1)}%</span>
                    )}
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${ms.isAchieved ? "bg-green-500" : "bg-primary"}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Affiliate Links List */}
      <div className="bg-white rounded-[12px] p-5 shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-3">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">link</span>
            Link giới thiệu của bạn
          </h3>
          <div className="flex items-center gap-2">
            <input 
              type="number" 
              placeholder="Nhập ID sản phẩm..." 
              value={newProductId}
              onChange={(e) => setNewProductId(e.target.value)}
              className="border border-slate-200 rounded-[8px] px-3 py-1.5 text-sm focus:outline-none focus:border-primary w-40"
            />
            <button 
              onClick={handleGenerateLink}
              disabled={generating}
              className={`bg-primary hover:bg-primary-dark text-white text-sm font-bold py-1.5 px-3 rounded-[8px] flex items-center gap-1 transition-colors ${generating ? "opacity-70 cursor-not-allowed" : ""}`}
            >
              <span className="material-symbols-outlined text-[16px]">{generating ? "progress_activity" : "add_link"}</span>
              {generating ? "Đang tạo..." : "Tạo Link"}
            </button>
          </div>
        </div>

        {links.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-[8px] border border-dashed border-slate-200">
            <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">link_off</span>
            <p className="text-sm text-slate-500">Bạn chưa tạo link tiếp thị nào.</p>
            <p className="text-xs text-slate-400 mt-1">Hãy nhập ID sản phẩm ở trên hoặc tạo từ trang chi tiết sản phẩm nhé!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {links.map((link) => (
              <div key={link.affiliateLinkCode} className="flex gap-3 p-3 rounded-[8px] border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors">
                <img src={link.productImage || "/placeholder.png"} alt={link.productName} className="w-16 h-16 rounded-[6px] object-cover bg-white" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-slate-800 line-clamp-1 mb-1">{link.productName}</h4>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">touch_app</span> {link.clickCount}</span>
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">shopping_bag</span> {link.conversionCount}</span>
                    <span className="font-bold text-primary ml-auto">{link.revenue.toLocaleString('vi-VN')}đ</span>
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      readOnly 
                      value={link.fullUrl} 
                      className="flex-1 text-xs px-2 py-1 bg-white border border-slate-200 rounded text-slate-600 focus:outline-none"
                    />
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(link.fullUrl);
                        toast.success("Đã copy link!");
                      }}
                      className="text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1 rounded font-medium transition-colors whitespace-nowrap"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
