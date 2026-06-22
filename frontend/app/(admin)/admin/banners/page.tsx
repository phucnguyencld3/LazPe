'use client';

import React, { useState, useEffect } from 'react';
import { Banner } from '@/types/banner';
import { BannerConfigBuilder } from '@/components/admin/banner/BannerConfigBuilder';
import { getValidToken } from '@/lib/utils/auth';
import { toast } from '@/lib/toast';

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const token = getValidToken();
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5101';
      const res = await fetch(`${baseUrl}/api/admin/banners`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBanners(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleSave = async (draft: Partial<Banner>) => {
    try {
      const token = getValidToken();
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5101';
      
      const isEdit = !!draft.id;
      const url = isEdit ? `${baseUrl}/api/admin/banners/draft/${draft.id}` : `${baseUrl}/api/admin/banners/draft`;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(draft)
      });

      if (res.ok) {
        toast.success(isEdit ? 'Cập nhật bản nháp thành công!' : 'Tạo bản nháp thành công!');
        fetchBanners();
        setSelectedBanner(null);
      } else {
        const errorText = await res.text();
        console.error("Save Draft Error:", errorText);
        toast.error(`Có lỗi xảy ra: ${errorText || res.statusText}`);
      }
    } catch (error: any) {
      console.error("Save Draft Exception:", error);
      toast.error(`Lỗi kết nối máy chủ: ${error.message}`);
    }
  };

  const handlePublish = async (bannerId: number) => {
    try {
      const token = getValidToken();
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5101';
      const res = await fetch(`${baseUrl}/api/admin/banners/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ bannerId })
      });

      if (res.ok) {
        toast.success('Đã Publish banner ra Client!');
        fetchBanners();
      } else {
        toast.error('Có lỗi xảy ra khi Publish.');
      }
    } catch (error) {
      toast.error('Lỗi kết nối máy chủ.');
    }
  };

  const handleDelete = async (bannerId: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa banner này?')) return;
    try {
      const token = getValidToken();
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5101';
      const res = await fetch(`${baseUrl}/api/admin/banners/${bannerId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        toast.success('Xóa banner thành công!');
        fetchBanners();
      } else {
        toast.error('Lỗi khi xóa banner.');
      }
    } catch (error) {
      toast.error('Lỗi kết nối máy chủ.');
    }
  };

  const getPositionLabel = (pos?: string) => {
    if (!pos) return 'Chưa xác định';
    switch (pos) {
      case 'home': return 'Banner chính (Top/Hero)';
      case 'left': return 'Cột bên (Sidebar)';
      case 'footer': return 'Chân trang (Footer)';
      case 'promo': return 'Khuyến mãi chung';
      case 'flash_sale': return 'Flash Sale';
      default: return pos;
    }
  };

  const getPageLabel = (page?: string) => {
    if (!page) return 'Chưa xác định';
    switch (page) {
      case 'global': return 'Toàn hệ thống';
      case 'home': return 'Trang chủ';
      case 'products': return 'Danh sách sản phẩm';
      case 'product_detail': return 'Chi tiết sản phẩm';
      case 'cart': return 'Giỏ hàng';
      case 'checkout': return 'Thanh toán';
      case 'profile': return 'Trang cá nhân';
      case 'combo': return 'Gói combo';
      default: return page;
    }
  };

  const getTypeLabel = (type?: string) => {
    if (!type) return 'Chưa xác định';
    switch (type) {
      case 'full_width': return 'Full Width';
      case 'grid': return 'Grid (Lưới)';
      case 'slideshow': return 'Carousel';
      case 'single': return 'Banner đơn';
      case 'double': return 'Banner đôi';
      case 'multi_col': return 'Nhiều cột';
      case 'popup': return 'Popup';
      case 'masonry': return 'Masonry';
      case 'floating': return 'Floating Promo';
      case 'stack': return 'Stack dọc';
      default: return type;
    }
  };

  if (loading && banners.length === 0) {
    return (
      <div className="w-full py-20 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mx-auto"></div>
        <p className="text-slate-400 mt-4 font-semibold text-sm">Đang tải danh sách banner...</p>
      </div>
    );
  }

  return (
    <main className="w-full pb-20 animate-in fade-in duration-300">
      {/* Header */}
      <header className="mb-lg flex items-center justify-between">
        <div>
          <h1 className="font-headline-md text-headline-md text-primary font-bold">Quản lý Banner</h1>
          <p className="font-body-md text-body-md text-on-surface-variant/70">
            {selectedBanner ? 'Cấu hình và thiết lập chi tiết banner hiển thị' : 'Quản lý các chiến dịch banner hiển thị trên hệ thống'}
          </p>
        </div>
        <div className="flex items-center gap-sm shrink-0">
          {!selectedBanner && (
            <button 
              onClick={() => setSelectedBanner({} as Banner)}
              className="bg-primary text-on-primary px-5 py-2.5 rounded-[8px] font-bold text-xs flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              Thêm mới Banner
            </button>
          )}
        </div>
      </header>

      {selectedBanner ? (
        <div className="mb-8">
          <button 
            onClick={() => setSelectedBanner(null)}
            className="mb-6 text-primary font-bold text-sm flex items-center gap-1.5 hover:underline cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Quay lại danh sách
          </button>
          <BannerConfigBuilder 
            initialBanner={selectedBanner} 
            existingBanners={banners}
            onSave={handleSave} 
            token={getValidToken() || undefined}
          />
        </div>
      ) : (
        <div className="bg-white rounded-[8px] shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50/55 border-b border-slate-100 text-[11px] font-bold text-slate-400 tracking-widest uppercase">
                  <th className="px-6 py-4 text-center w-[80px]">STT</th>
                  <th className="px-6 py-4">Tên Banner</th>
                  <th className="px-6 py-4 text-center">Trang áp dụng</th>
                  <th className="px-6 py-4 text-center">Vị trí hiển thị</th>
                  <th className="px-6 py-4 text-center">Loại bố cục</th>
                  <th className="px-6 py-4 text-center">Trạng thái</th>
                  <th className="px-6 py-4 text-center">Ngày cập nhật</th>
                  <th className="px-8 py-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {banners.map((banner, index) => (
                  <tr key={banner.id} className="hover:bg-slate-100/70 transition-all duration-200 group">
                    <td className="px-6 py-4 text-center text-xs font-semibold text-slate-400">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800 text-sm">
                      {banner.name}
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-semibold text-slate-600">
                      {getPageLabel(banner.page)}
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-semibold text-slate-600">
                      {getPositionLabel(banner.position)}
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-semibold text-slate-600">
                      {getTypeLabel(banner.type)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {banner.status === 'Published' ? (
                        <span className="text-emerald-600 text-xs font-bold inline-flex items-center gap-1.5 justify-center">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          Đã xuất bản
                        </span>
                      ) : (
                        <span className="text-slate-500 text-xs font-bold inline-flex items-center gap-1.5 justify-center">
                          <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                          Bản nháp
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-slate-500 font-semibold">
                      {new Date(banner.updatedAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-8 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button 
                          onClick={() => setSelectedBanner(banner)}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-primary hover:bg-primary-container/20 transition-all cursor-pointer"
                          title="Sửa Nháp"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button 
                          onClick={() => handlePublish(banner.id)}
                          disabled={banner.status === 'Published'}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                            banner.status === 'Published' 
                              ? 'text-slate-300 cursor-not-allowed' 
                              : 'text-secondary hover:bg-secondary-container/20 cursor-pointer'
                          }`}
                          title={banner.status === 'Published' ? 'Đã xuất bản' : 'Xuất bản banner'}
                        >
                          <span className="material-symbols-outlined text-[18px]">publish</span>
                        </button>
                        <button 
                          onClick={() => handleDelete(banner.id)}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-error hover:bg-error-container/20 transition-all cursor-pointer"
                          title="Xóa banner"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {banners.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-20">
                      <span className="material-symbols-outlined text-slate-300 text-5xl mb-2">view_carousel</span>
                      <p className="text-slate-400 font-bold text-sm">Chưa có banner nào. Hãy tạo mới một banner.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
