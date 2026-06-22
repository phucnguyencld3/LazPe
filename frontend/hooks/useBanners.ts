'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { Banner } from '@/types/banner';

export function getPageFromPath(path: string | null) {
  if (!path || path === '/') return 'home';
  if (path.startsWith('/products/')) return 'product_detail';
  if (path.startsWith('/products')) return 'products';
  if (path.startsWith('/cart')) return 'cart';
  if (path.startsWith('/checkout')) return 'checkout';
  if (path.startsWith('/profile')) return 'profile';
  if (path.startsWith('/bundles')) return 'combo';
  if (path.startsWith('/admin')) return 'admin';
  return 'home'; // default fallback
}

export function useBanners(position: string) {
  const pathname = usePathname();
  const page = getPageFromPath(pathname);

  const [fetchedBanners, setFetchedBanners] = useState<Banner[]>([]);
  const [previewBanner, setPreviewBanner] = useState<Banner | null>(null);
  const [activePreviewPos, setActivePreviewPos] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const connectionRef = useRef<HubConnection | null>(null);

  const banners = (() => {
    let resultList = fetchedBanners;
    
    if (previewBanner) {
      if (previewBanner.id) {
        const exists = fetchedBanners.some(b => b.id === previewBanner.id);
        if (exists) {
          resultList = fetchedBanners.map(b => b.id === previewBanner.id ? previewBanner : b);
        } else if (previewBanner.type === 'floating') {
          resultList = [...fetchedBanners, previewBanner];
        } else {
          resultList = [previewBanner];
        }
      } else {
        if (previewBanner.type === 'floating') {
          resultList = [...fetchedBanners, previewBanner];
        } else {
          resultList = [previewBanner];
        }
      }
    }

    return resultList.map(b => {
      if (activePreviewPos && b.position !== activePreviewPos && !(b as any).isPreview) {
        return { ...b, isDimmed: true };
      }
      return b;
    });
  })();

  const fetchBanners = async () => {
    try {
      // In a real app, this URL should come from env config e.g., process.env.NEXT_PUBLIC_API_URL
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5101';
      const res = await fetch(`${baseUrl}/api/clientbanners/position/${position}?page=${page}`);
      if (res.ok) {
        const data: Banner[] = await res.json();
        setFetchedBanners(data);
      }
    } catch (error) {
      console.error('Failed to fetch banners:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();

    // Setup SignalR connection to listen for realtime updates
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5101';
    const connection = new HubConnectionBuilder()
      .withUrl(`${baseUrl}/bannerHub`)
      .withAutomaticReconnect()
      .build();

    connection.start()
      .then(() => {
        console.log('Connected to BannerHub');
        connection.on('BannerUpdated', (updatedPosition: string) => {
          if (updatedPosition === position || updatedPosition === 'all') {
            // Apply a small random delay (0-2s) to prevent thundering herd
            const delay = Math.random() * 2000;
            setTimeout(() => {
              fetchBanners();
            }, delay);
          }
        });
      })
      .catch(err => console.error('SignalR BannerHub Connection Error: ', err));

    connectionRef.current = connection;

    return () => {
      if (connectionRef.current) {
        connectionRef.current.off('BannerUpdated');
        connectionRef.current.stop();
      }
    };
  }, [position]);

  // Setup Live Preview listener for Admin Iframe
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'LIVE_PREVIEW_BANNER') {
        const pb = event.data.banner as Banner;
        setActivePreviewPos(pb.position);
        if (pb.position === position) {
          setPreviewBanner({ ...pb, isPreview: true } as any);
        } else {
          // Revert to original if the position was changed
          setPreviewBanner(null);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [position]);

  // Re-fetch banners when the route (page) changes
  useEffect(() => {
    fetchBanners();
  }, [page]);

  return { banners, loading, refetch: fetchBanners };
}
