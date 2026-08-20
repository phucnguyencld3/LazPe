'use client';

import React, { useState } from 'react';
import { Banner, BannerFloatingConfig } from '@/types/banner';
import { toast } from '@/lib/toast';

interface BannerFormProps {
  formData: Partial<Banner>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<Banner>>>;
  existingBanners?: Banner[];
  token?: string;
  onSave?: (banner: Partial<Banner>) => void;
  onOpenProductModal: (index: number) => void;
  previewMode?: 'desktop' | 'laptop' | 'tablet' | 'mobile';
}

export function BannerForm({
  formData,
  setFormData,
  existingBanners,
  token,
  onSave,
  onOpenProductModal,
  previewMode = 'desktop'
}: BannerFormProps) {
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({ ...formData, type: e.target.value as any });
  };

  const handleImageUpload = async (file: File, index: number) => {
    if (!token) {
      toast.error("Bạn cần đăng nhập để tải ảnh lên.", {
        description: "Vui lòng kiểm tra lại phiên đăng nhập."
      });
      return;
    }
    
    // Kiểm tra định dạng file
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
    if (!file.type || !allowedTypes.includes(file.type)) {
      toast.error("Chỉ hỗ trợ file ảnh JPG, PNG, GIF, WebP");
      return;
    }

    // Kiểm tra dung lượng (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("File ảnh không được vượt quá 10MB");
      return;
    }
    
    setUploadingIndex(index);
    try {
      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('folder', 'banners');
      
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5101/api";
      const res = await fetch(`${API_BASE_URL}/Upload/banner`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: uploadData
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        handleItemChange(index, 'imageUrl', data.url);
      } else {
        toast.error(data.message || "Tải ảnh thất bại");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối khi tải ảnh");
    } finally {
      setUploadingIndex(null);
    }
  };

  const normalizeRoute = (input: string) => {
    const trimmed = input.trim();
    if (!trimmed) return '';
    const lower = trimmed.toLowerCase();
    if (lower === 'product' || lower === '/product') return '/products';
    if (lower === 'category' || lower === '/category') return '/categories';
    if (lower === 'promotion' || lower === '/promotion') return '/promotions';
    if (lower.startsWith('/')) return trimmed; // Use as-is
    if (lower.startsWith('http')) return trimmed; // absolute URL
    return `/${trimmed.replace(/\s+/g, '-')}`; // slugify simple terms
  };

  const handleRedirectChange = (index: number, field: string, value: any) => {
    const newItems = [...(formData.layoutConfig?.items || [])];
    const item = newItems[index];
    const redirect = item.redirect || { enabled: true, type: 'page' };
    
    const updatedRedirect = { ...redirect, [field]: value };
    
    if (field === 'value' && (updatedRedirect.type === 'custom' || updatedRedirect.type === 'page')) {
      updatedRedirect.resolved_url = normalizeRoute(value as string);
    }
    
    newItems[index] = { 
      ...item, 
      redirect: updatedRedirect,
      redirectUrl: updatedRedirect.resolved_url || item.redirectUrl
    };
    setFormData({
      ...formData,
      layoutConfig: { ...formData.layoutConfig!, items: newItems }
    });
  };

  const handleFloatingConfigChange = (field: string, value: any) => {
    const fc = { ...(formData.layoutConfig?.floatingConfig || {}) } as any;
    
    // Check if we are modifying a device-specific position
    if (['anchor', 'offsetX', 'offsetY'].includes(field)) {
      // Map 'laptop' to 'desktop' config for simplicity
      const modeKey = (previewMode === 'laptop' ? 'desktop' : previewMode) + 'Position';
      
      const currentPos = fc[modeKey] || {
        anchor: fc.anchor || 'bottom-right',
        offsetX: fc.offsetX || 20,
        offsetY: fc.offsetY || 20
      };
      
      fc[modeKey] = { ...currentPos, [field]: value };
    } else {
      fc[field] = value;
    }
    
    setFormData({
      ...formData,
      layoutConfig: {
        ...formData.layoutConfig!,
        floatingConfig: fc
      }
    });
  };

  const handleAddItem = () => {
    const newItems = [...(formData.layoutConfig?.items || [])];
    newItems.push({
      imageUrl: 'https://placehold.co/800x400?text=New+Banner',
      altText: 'New Banner',
      order: newItems.length
    });
    setFormData({
      ...formData,
      layoutConfig: { ...formData.layoutConfig!, items: newItems }
    });
  };

  const handleItemChange = (index: number, field: string, value: string) => {
    const newItems = [...(formData.layoutConfig?.items || [])];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({
      ...formData,
      layoutConfig: { ...formData.layoutConfig!, items: newItems }
    });
  };

  const handleDeleteItem = (index: number) => {
    toast('Bạn có chắc muốn xóa ảnh này?', {
      description: 'Hành động này không thể hoàn tác sau khi lưu.',
      action: {
        label: 'Xóa ngay',
        onClick: () => {
          const newItems = [...(formData.layoutConfig?.items || [])];
          newItems.splice(index, 1);
          setFormData({
            ...formData,
            layoutConfig: { ...formData.layoutConfig!, items: newItems }
          });
          toast.success('Đã xóa ảnh tạm thời');
        }
      },
      cancel: {
        label: 'Hủy',
        onClick: () => {}
      }
    });
  };

  return (
    <div className="w-full lg:w-[350px] xl:w-[450px] shrink-0 bg-white p-6 md:p-8 rounded-[8px] shadow-sm border border-slate-100">
      <h2 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3 uppercase tracking-wider mb-5 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary text-[20px]">settings</span>
        Cấu hình Banner
      </h2>
      
      <div className="mb-5 space-y-1">
        <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block ml-1">Tên Banner</label>
        <input 
          type="text" 
          className="w-full px-4 py-3 rounded-[8px] bg-slate-50 border border-slate-200 text-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white focus:outline-none font-semibold text-sm placeholder-slate-400 transition-all"
          value={formData.name || ''} 
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          placeholder="Nhập tên banner..."
        />
      </div>

      <div className="mb-5 space-y-1">
        <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block ml-1">Bố cục hiển thị (Display Layout)</label>
        <select 
          className="w-full px-4 py-3 rounded-[8px] bg-slate-50 border border-slate-200 text-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white focus:outline-none font-semibold text-sm transition-all cursor-pointer"
          value={formData.type || 'slideshow'}
          onChange={handleTypeChange}
        >
          <option value="slideshow">Carousel (Slideshow)</option>
          <option value="full_width">Full Width</option>
          <option value="grid">Grid (Lưới)</option>
          <option value="single">Banner đơn</option>
          <option value="double">Banner đôi</option>
          <option value="multi_col">Banner nhiều cột</option>
          <option value="stack">Stack dọc</option>
          <option value="masonry">Masonry</option>
          <option value="popup">Popup</option>
          <option value="floating">Floating Promo Banner</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block ml-1">Trang áp dụng</label>
          <select 
            className="w-full px-4 py-3 rounded-[8px] bg-slate-50 border border-slate-200 text-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white focus:outline-none font-semibold text-sm transition-all cursor-pointer"
            value={formData.position === 'home' || formData.position === 'footer' ? 'global' : (formData.page || 'home')}
            disabled={formData.position === 'home' || formData.position === 'footer'}
            onChange={(e) => {
              const newPage = e.target.value;
              setFormData({...formData, page: newPage});
              
              if (existingBanners) {
                const existing = existingBanners.find(b => b.position === formData.position && b.page === newPage);
                if (existing && existing.id !== formData.id) {
                  toast('Đã có banner tồn tại ở trang này', {
                    description: 'Bạn có muốn tải dữ liệu của banner đó lên để chỉnh sửa không?',
                    action: { label: 'Tải lên', onClick: () => setFormData(existing) }
                  });
                }
              }
            }}
          >
            <option value="global">Toàn hệ thống (Global)</option>
            <option value="home">Trang chủ (Home)</option>
            <option value="products">Danh sách SP</option>
            <option value="product_detail">Chi tiết SP</option>
            <option value="cart">Giỏ hàng</option>
            <option value="checkout">Thanh toán</option>
            <option value="profile">Trang cá nhân</option>
            <option value="combo">Combo</option>
          </select>
        </div>
        
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block ml-1">Vị trí hiển thị</label>
          <select 
            className="w-full px-4 py-3 rounded-[8px] bg-slate-50 border border-slate-200 text-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white focus:outline-none font-semibold text-sm transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            value={formData.position || 'home'}
            disabled={formData.type === 'popup' || formData.type === 'floating'}
            onChange={(e) => {
              const newPos = e.target.value;
              let newPage = formData.page;
              
              if (newPos === 'home' || newPos === 'footer') {
                newPage = 'global';
              } else if (formData.page === 'global') {
                // Thoát khỏi 'global' khi không còn ở home/footer để tránh kẹt
                newPage = 'home';
              }
              
              if (existingBanners) {
                const existing = existingBanners.find(b => b.position === newPos && b.page === newPage);
                if (existing && existing.id !== formData.id) {
                  toast('Đã có banner tồn tại ở vị trí này', {
                    description: 'Bạn có muốn tải dữ liệu của banner đó lên để chỉnh sửa không?',
                    action: {
                      label: 'Tải lên',
                      onClick: () => setFormData(existing)
                    },
                    duration: 8000
                  });
                  return;
                }
              }
              setFormData({...formData, position: newPos, page: newPage});
            }}
          >
            <optgroup label="Vị trí giao diện">
              <option value="home">Banner chính (Top/Hero)</option>
              <option value="left">Cột bên (Sidebar)</option>
              <option value="footer">Chân trang (Footer)</option>
            </optgroup>
            <optgroup label="Khu vực nội dung">
              <option value="promo">Banner khuyến mãi chung</option>
              <option value="flash_sale">Banner Flash Sale</option>
            </optgroup>
          </select>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px]">photo_library</span>
            Danh sách hình ảnh
          </h3>
          <button 
            onClick={handleAddItem}
            className="px-3 py-2 bg-primary/10 hover:bg-primary/15 text-primary rounded-[8px] font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            Thêm ảnh
          </button>
        </div>

        {formData.type === 'floating' && (
          <div className="mb-6 bg-rose-50/50 p-4 rounded-[8px] border border-rose-100">
            <h3 className="text-xs font-bold text-rose-800 mb-3 uppercase tracking-wider flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">layers</span>
              Vị trí cho {previewMode === 'mobile' ? 'Điện thoại' : previewMode === 'tablet' ? 'Máy tính bảng' : 'Máy tính'}
            </h3>
            
            {(() => {
              const fc = formData.layoutConfig?.floatingConfig || {} as any;
              const modeKey = (previewMode === 'laptop' ? 'desktop' : previewMode) + 'Position';
              const pos = fc[modeKey] || {
                anchor: fc.anchor || 'bottom-right',
                offsetX: fc.offsetX || 20,
                offsetY: fc.offsetY || 20
              };
              
              return (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Vị trí neo (Anchor)</label>
                      <select 
                        className="w-full px-3 py-2 rounded-[8px] bg-white border border-slate-200 text-xs focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer"
                        value={pos.anchor}
                        onChange={(e) => handleFloatingConfigChange('anchor', e.target.value)}
                      >
                        <option value="top-left">Top Left</option>
                        <option value="top-right">Top Right</option>
                        <option value="center">Center</option>
                        <option value="bottom-left">Bottom Left</option>
                        <option value="bottom-right">Bottom Right</option>
                        <option value="custom">Tùy chỉnh (Custom)</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2 mt-5">
                      <input 
                        type="checkbox" 
                        id="fc_closeable"
                        checked={fc.closeable !== false}
                        onChange={(e) => handleFloatingConfigChange('closeable', e.target.checked)}
                        className="w-4 h-4 text-primary focus:ring-primary border-slate-300 rounded"
                      />
                      <label htmlFor="fc_closeable" className="text-xs font-bold text-slate-700">Có nút Đóng [X]</label>
                    </div>
                  </div>
                  
                  {pos.anchor !== 'center' && (
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">Khoảng cách X ({pos.anchor === 'custom' ? '%' : 'px'})</label>
                        <input type="number" step="any" className="w-full px-3 py-2 rounded-[8px] border border-slate-200 text-xs focus:ring-1 focus:ring-primary focus:outline-none" 
                          value={pos.offsetX || 0}
                          onChange={(e) => handleFloatingConfigChange('offsetX', parseFloat(e.target.value) || 0)} />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">Khoảng cách Y ({pos.anchor === 'custom' ? '%' : 'px'})</label>
                        <input type="number" step="any" className="w-full px-3 py-2 rounded-[8px] border border-slate-200 text-xs focus:ring-1 focus:ring-primary focus:outline-none" 
                          value={pos.offsetY || 0}
                          onChange={(e) => handleFloatingConfigChange('offsetY', parseFloat(e.target.value) || 0)} />
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
            
            {formData.layoutConfig?.floatingConfig?.closeable !== false && (
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="fc_session"
                  checked={formData.layoutConfig?.floatingConfig?.closeSession || false}
                  onChange={(e) => handleFloatingConfigChange('closeSession', e.target.checked)}
                  className="w-4 h-4 text-primary focus:ring-primary border-slate-300 rounded"
                />
                <label htmlFor="fc_session" className="text-[11px] text-slate-600 font-semibold">Lưu trạng thái đóng theo Session (không hiện lại khi đã tắt)</label>
              </div>
            )}
          </div>
        )}

        {(!formData.layoutConfig?.items || formData.layoutConfig.items.length === 0) && (
          <div className="text-center py-8 mb-4 border-2 border-dashed border-slate-200 rounded-[8px] bg-slate-50">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-slate-100 text-slate-300">
              <span className="material-symbols-outlined text-[28px]">image</span>
            </div>
            <p className="text-xs font-bold text-slate-500 mb-4">Chưa có hình ảnh nào</p>
            <button 
              onClick={handleAddItem}
              className="px-4 py-2 bg-primary text-on-primary rounded-[8px] font-bold text-xs shadow-md hover:scale-105 active:scale-95 transition-all inline-flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              Thêm ảnh banner
            </button>
          </div>
        )}

        {formData.layoutConfig?.items?.map((item, idx) => (
          <div key={idx} className="p-4 rounded-[8px] mb-4 bg-white border border-slate-200 shadow-sm flex flex-col gap-3 relative">
            <div className="absolute -top-3 -right-2 flex items-center gap-1">
              <div className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-[4px] border border-slate-200 shadow-sm">#{idx + 1}</div>
              <button 
                onClick={() => handleDeleteItem(idx)}
                className="bg-white text-rose-500 hover:bg-rose-50 hover:text-rose-600 border border-slate-200 shadow-sm px-2 py-1 rounded-[4px] text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                title="Xóa ảnh này"
              >
                <span className="material-symbols-outlined text-[14px]">delete</span>
                Xóa
              </button>
            </div>
            <div 
              className="relative border-2 border-dashed border-slate-200 rounded-[8px] bg-white hover:bg-slate-50 transition-colors flex items-center justify-center overflow-hidden min-h-[120px] mt-1"
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={(e) => {
                e.preventDefault(); e.stopPropagation();
                const file = e.dataTransfer.files[0];
                if (file && file.type.startsWith('image/')) {
                  handleImageUpload(file, idx);
                }
              }}
            >
              {item.imageUrl ? (
                <>
                  <img src={item.imageUrl} alt="preview" className="absolute inset-0 w-full h-full object-contain opacity-20" />
                  <div className="relative z-10 w-full p-3 flex flex-col gap-2 bg-white/80 backdrop-blur-sm">
                    <input 
                      type="text" 
                      placeholder="Image URL" 
                      className="w-full px-3 py-2 rounded-[8px] bg-white border border-slate-200 text-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none text-xs font-semibold shadow-sm"
                      value={item.imageUrl}
                      onChange={(e) => handleItemChange(idx, 'imageUrl', e.target.value)}
                    />
                    <label className="cursor-pointer flex items-center justify-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-[8px] transition-colors w-max">
                      {uploadingIndex === idx ? (
                        <span className="material-symbols-outlined text-[16px] animate-spin text-primary -scale-x-100">sync</span>
                      ) : (
                        <span className="material-symbols-outlined text-[16px]">cloud_upload</span>
                      )}
                      {uploadingIndex === idx ? 'Đang tải lên...' : 'Tải ảnh khác lên'}
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleImageUpload(e.target.files[0], idx);
                          }
                          e.target.value = '';
                        }}
                      />
                    </label>
                  </div>
                </>
              ) : (
                <div className="w-full p-4 flex flex-col items-center justify-center text-center gap-2">
                  {uploadingIndex === idx ? (
                    <span className="material-symbols-outlined text-[28px] animate-spin text-primary mb-1 -scale-x-100">sync</span>
                  ) : (
                    <span className="material-symbols-outlined text-[28px] text-slate-300 mb-1">image</span>
                  )}
                  <div className="text-xs text-slate-500">
                    Kéo thả ảnh vào đây, hoặc{' '}
                    <label className="text-primary font-bold cursor-pointer hover:underline">
                      chọn file
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) handleImageUpload(e.target.files[0], idx);
                        }}
                      />
                    </label>
                  </div>
                  <p className="text-[10px] text-slate-400">hoặc dán URL vào ô bên dưới</p>
                  <input 
                    type="text" 
                    placeholder="Dán Image URL..." 
                    className="w-full max-w-sm mt-1 px-3 py-1.5 rounded-[8px] border border-slate-200 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                    value={item.imageUrl}
                    onChange={(e) => handleItemChange(idx, 'imageUrl', e.target.value)}
                  />
                </div>
              )}
            </div>
            
            <div className="bg-white p-3 rounded-[8px] border border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-600 uppercase">Điều hướng (Redirect)</span>
                <select 
                  className="px-2 py-1 text-xs font-bold text-slate-700 border border-slate-200 rounded-[8px] bg-slate-50 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 cursor-pointer"
                  value={item.redirect?.type || 'page'}
                  onChange={(e) => handleRedirectChange(idx, 'type', e.target.value)}
                >
                  <option value="none">Không điều hướng</option>
                  <option value="page">Đường dẫn / Tên trang</option>
                  <option value="product">Chọn sản phẩm</option>
                  <option value="custom">URL Tuỳ chỉnh (Ngoài)</option>
                </select>
              </div>
              
              {item.redirect?.type !== 'none' && (
                <div className="flex gap-2 relative">
                  <input 
                    type="text" 
                    placeholder={item.redirect?.type === 'product' ? 'Slug / ID Sản phẩm...' : 'Đường dẫn đích... (vd: Product, /flash-sale)'} 
                    className="w-full px-3 py-2 rounded-[8px] border border-slate-200 text-xs bg-slate-50 focus:bg-white transition-colors outline-none focus:border-primary font-semibold"
                    value={item.redirect?.value || ''}
                    onChange={(e) => handleRedirectChange(idx, 'value', e.target.value)}
                    readOnly={item.redirect?.type === 'product'}
                  />
                  {item.redirect?.type === 'product' && (
                    <button 
                      onClick={() => onOpenProductModal(idx)}
                      className="px-3 py-2 bg-blue-50 text-blue-600 font-bold text-xs rounded-[8px] hover:bg-blue-100 shrink-0 border border-blue-100 transition-colors cursor-pointer"
                    >
                      Chọn SP
                    </button>
                  )}
                </div>
              )}
              {item.redirect?.type !== 'none' && item.redirect?.resolved_url && (
                <p className="text-[10px] text-emerald-600 font-semibold mt-1.5 pl-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">check_circle</span>
                  Đích đến hợp lệ: {item.redirect.resolved_url}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <button 
        onClick={() => onSave?.(formData)}
        className="w-full bg-primary hover:bg-primary/95 text-on-primary py-3.5 rounded-[8px] font-bold text-sm hover:scale-102 active:scale-98 transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
      >
        <span className="material-symbols-outlined text-[18px]">save</span>
        Lưu Bản Nháp (Save Draft)
      </button>
    </div>
  );
}
