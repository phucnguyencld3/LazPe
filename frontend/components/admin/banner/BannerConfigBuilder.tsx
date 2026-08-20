'use client';

import React, { useState } from 'react';
import { Banner } from '@/types/banner';
import { ProductSelectModal } from '../combo/ProductSelectModal';
import { BannerForm } from './BannerForm';
import { BannerPreview } from './BannerPreview';

export function BannerConfigBuilder({ 
  initialBanner, 
  existingBanners,
  onSave,
  token
}: { 
  initialBanner?: Banner;
  existingBanners?: Banner[];
  onSave?: (banner: Partial<Banner>) => void;
  token?: string;
}) {
  const getInitial = (): Partial<Banner> => {
    if (!initialBanner || (!initialBanner.id && !initialBanner.type)) {
      return {
        name: '',
        position: 'home',
        type: 'slideshow',
        page: 'global',
        layoutConfig: {
          items: [],
          animation: '',
          containerStyle: '',
          gridColumns: 2,
          gridGap: 4,
          popupDelay: 1000,
          showCloseButton: true,
          responsive: {},
          floatingConfig: {
            anchor: 'bottom-right',
            closeable: true
          }
        }
      };
    }
    return initialBanner;
  };

  const [formData, setFormData] = useState<Partial<Banner>>(getInitial());

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'laptop' | 'tablet' | 'mobile'>('desktop');

  React.useEffect(() => {
    setFormData(getInitial());
  }, [initialBanner]);

  React.useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'SELECT_BANNER_POSITION') {
        setFormData(prev => ({ ...prev, position: e.data.position }));
      }
      if (e.data?.type === 'ROUTE_CHANGE') {
        // Automatically switch page based on iframe route navigation,
        // but only if we are not editing an existing banner, or if user permits
        const newPath = e.data.pathname;
        let mappedPage = 'home';
        if (newPath.startsWith('/products/')) mappedPage = 'product_detail';
        else if (newPath.startsWith('/products')) mappedPage = 'products';
        else if (newPath.startsWith('/cart')) mappedPage = 'cart';
        else if (newPath.startsWith('/checkout')) mappedPage = 'checkout';
        else if (newPath.startsWith('/profile')) mappedPage = 'profile';
        else if (newPath.startsWith('/bundles')) mappedPage = 'combo';
        
        // Don't auto-switch if position is global-only
        setFormData(prev => {
          if (prev.position === 'home' || prev.position === 'footer') {
            return prev;
          }
          return { ...prev, page: mappedPage };
        });
      }
      
      if (e.data?.type === 'UPDATE_FLOATING_DEVICE_OFFSET') {
        const { deviceMode, position } = e.data;
        console.log('Admin received UPDATE_FLOATING_DEVICE_OFFSET', deviceMode, position);
        
        setFormData(prev => {
          const newLayout = { ...(prev.layoutConfig || { items: [] }) };
          const floatingConfig = { ...(newLayout.floatingConfig || {}) } as any;
          
          if (deviceMode === 'desktop') {
            floatingConfig.desktopPosition = position;
          } else if (deviceMode === 'tablet') {
            floatingConfig.tabletPosition = position;
          } else if (deviceMode === 'mobile') {
            floatingConfig.mobilePosition = position;
          }
          
          newLayout.floatingConfig = floatingConfig;
          return { ...prev, layoutConfig: newLayout };
        });
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleProductSelect = (productId: number, productSlug?: string) => {
    if (activeItemIndex !== null) {
      const newItems = [...(formData.layoutConfig?.items || [])];
      const redirect = newItems[activeItemIndex].redirect || { enabled: true, type: 'product' };
      
      const targetIdentifier = productSlug || productId.toString();
      const resolvedUrl = `/products/${targetIdentifier}`;
      
      newItems[activeItemIndex] = {
        ...newItems[activeItemIndex],
        redirect: {
          ...redirect,
          type: 'product',
          value: targetIdentifier,
          resolved_url: resolvedUrl // usually single product uses /products/slug
        },
        redirectUrl: resolvedUrl
      };
      setFormData({
        ...formData,
        layoutConfig: { ...formData.layoutConfig!, items: newItems }
      });
    }
    setIsProductModalOpen(false);
  };

  const handleOpenProductModal = (index: number) => {
    setActiveItemIndex(index);
    setIsProductModalOpen(true);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-0">
      <BannerForm 
        formData={formData} 
        setFormData={setFormData}
        existingBanners={existingBanners}
        token={token}
        onSave={onSave}
        onOpenProductModal={handleOpenProductModal}
        previewMode={previewMode}
      />
      
      <BannerPreview 
        formData={formData} 
        previewMode={previewMode} 
        setPreviewMode={setPreviewMode} 
      />

      {token && (
        <ProductSelectModal
          isOpen={isProductModalOpen}
          onClose={() => setIsProductModalOpen(false)}
          onProductSelect={handleProductSelect}
          token={token}
        />
      )}
    </div>
  );
}
