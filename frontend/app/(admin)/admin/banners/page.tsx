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

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const token = getValidToken();
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5101';
      const res = await fetch(`${baseUrl}/api/admin/banners`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        cache: 'no-store'
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
    // Client-side validation
    if (!draft.name?.trim()) {
      toast.error('Lỗi dữ liệu', { description: 'Tên banner không được để trống.' });
      return;
    }
    if (!draft.type) {
      toast.error('Lỗi dữ liệu', { description: 'Vui lòng chọn Bố cục hiển thị.' });
      return;
    }
    if (!draft.position) {
      toast.error('Lỗi dữ liệu', { description: 'Vui lòng chọn Vị trí hiển thị.' });
      return;
    }

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
        try {
          const errObj = JSON.parse(errorText);
          if (errObj.errors) {
            const errorMessages = Object.values(errObj.errors).flat().join(', ');
            toast.error('Lỗi kiểm tra dữ liệu', { description: errorMessages });
            return;
          }
          if (errObj.message) {
            toast.error('Lỗi từ máy chủ', { description: errObj.message });
            return;
          }
        } catch (e) {
          // Fallback if not JSON
        }
        toast.error('Lỗi lưu bản nháp', { description: res.statusText || 'Không thể lưu banner' });
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
    toast('Bạn có chắc chắn muốn xóa banner này?', {
      description: 'Hành động này không thể hoàn tác.',
      action: {
        label: 'Xóa ngay',
        onClick: async () => {
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
        }
      },
      cancel: { label: 'Hủy', onClick: () => {} }
    });
  };

  const filteredBanners = banners.filter(banner => {
    const matchesSearch = banner.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'published') return matchesSearch && banner.status === 'Published';
    if (statusFilter === 'draft') return matchesSearch && banner.status !== 'Published';
    
    return matchesSearch;
  });

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
            initialBanner={{
              ...selectedBanner,
              layoutConfig: selectedBanner.draftConfig || selectedBanner.layoutConfig
            }}
            existingBanners={banners}
            onSave={handleSave} 
            token={getValidToken() || undefined}
          />
        </div>
      ) : (
        <>
          {/* Stats Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Total */}
            <div className="bg-white px-5 py-4 rounded-[8px] shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[8px] bg-primary-container/20 flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined text-[20px]">view_carousel</span>
                </div>
                <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Tổng số Banner</span>
              </div>
              <span className="text-2xl font-extrabold text-slate-800">{banners.length}</span>
            </div>

            {/* Published */}
            <div className="bg-white px-5 py-4 rounded-[8px] shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[8px] bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                  <span className="material-symbols-outlined text-[20px]">publish</span>
                </div>
                <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Đang hiển thị</span>
              </div>
              <span className="text-2xl font-extrabold text-slate-800">
                {banners.filter(b => b.status === 'Published').length}
              </span>
            </div>

            {/* Drafts */}
            <div className="bg-white px-5 py-4 rounded-[8px] shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[8px] bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                  <span className="material-symbols-outlined text-[20px]">edit_document</span>
                </div>
                <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Bản nháp</span>
              </div>
              <span className="text-2xl font-extrabold text-slate-800">
                {banners.filter(b => b.status !== 'Published').length}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-[8px] shadow-sm border border-slate-100 overflow-hidden">
            {/* Search, filters block */}
            <div className="p-6 border-b border-slate-100 flex flex-wrap items-center gap-4 bg-slate-50/50">
              <div className="flex-1 min-w-[260px] relative">
                <span className="material-symbols-outlined text-slate-400 text-lg absolute left-4.5 top-1/2 -translate-y-1/2">
                  search
                </span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm kiếm banner theo tên..."
                  className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-[8px] font-semibold text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-4 py-3 bg-white border border-slate-200 rounded-[8px] font-bold text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all min-w-[165px] cursor-pointer"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="published">Đang hiển thị (Published)</option>
                <option value="draft">Bản nháp (Draft)</option>
              </select>

              {(searchTerm || statusFilter !== "all") && (
                <button
                  onClick={() => { setSearchTerm(""); setStatusFilter("all"); }}
                  className="px-6 py-3 text-slate-500 font-bold text-sm rounded-[8px] hover:bg-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">clear</span>
                  Xóa bộ lọc
                </button>
              )}
            </div>

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
                {filteredBanners.map((banner, index) => (
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
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-emerald-600 text-xs font-bold inline-flex items-center gap-1.5 justify-center">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            Đã xuất bản
                          </span>
                          {banner.hasUnpublishedChanges && (
                            <span className="text-[10px] text-amber-500 font-semibold bg-amber-50 px-1.5 py-0.5 rounded">Có nháp mới</span>
                          )}
                        </div>
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
                          disabled={banner.status === 'Published' && !banner.hasUnpublishedChanges}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                            (banner.status === 'Published' && !banner.hasUnpublishedChanges)
                              ? 'text-slate-300 cursor-not-allowed' 
                              : 'text-amber-500 hover:bg-amber-50 cursor-pointer'
                          }`}
                          title={banner.status === 'Published' && banner.hasUnpublishedChanges ? 'Xuất bản bản nháp' : 'Xuất bản'}
                        >
                          <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
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
                {filteredBanners.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-20 bg-slate-50/30">
                      <span className="material-symbols-outlined text-slate-200 text-6xl mb-3 block">search_off</span>
                      <p className="text-slate-500 font-bold text-sm">Không tìm thấy banner nào</p>
                      <p className="text-slate-400 text-xs mt-1">Hãy thử thay đổi điều kiện lọc hoặc tạo mới một banner.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
