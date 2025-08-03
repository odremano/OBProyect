import React, { createContext, useContext, useState, useRef, ReactNode } from 'react';
import { BannerType } from '../components/NotificationBanner';

interface BannerData {
  id: string;
  type: BannerType;
  title: string;
  message?: string;
  duration: number;
}

interface NotificationContextType {
  showBanner: (type: BannerType, title: string, message?: string, duration?: number) => void;
  hideBanner: (id: string) => void;
  banners: BannerData[];
}

const NotificationContext = createContext<NotificationContextType>({
  showBanner: () => {},
  hideBanner: () => {},
  banners: [],
});

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [banners, setBanners] = useState<BannerData[]>([]);

  const showBanner = (type: BannerType, title: string, message?: string, duration: number = 4000) => {
    const newBanner: BannerData = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type,
      title,
      message,
      duration,
    };

    setBanners(prev => [...prev, newBanner]);

    // Auto-hide después del tiempo especificado
    setTimeout(() => {
      hideBanner(newBanner.id);
    }, duration);
  };

  const hideBanner = (id: string) => {
    setBanners(prev => prev.filter(banner => banner.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ 
      showBanner, 
      hideBanner, 
      banners 
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext); 