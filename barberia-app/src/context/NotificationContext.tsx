import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
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
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  
  const MAX_BANNERS = 3; // Límite máximo de banners

  const showBanner = (type: BannerType, title: string, message?: string, duration: number = 4000) => {
    const newBanner: BannerData = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type,
      title,
      message,
      duration,
    };

    setBanners(prev => {
      // Si ya hay 3 banners, remover el más antiguo
      const updatedBanners = prev.length >= MAX_BANNERS 
        ? prev.slice(1) // Quita el primero (más antiguo)
        : prev;
      
      return [...updatedBanners, newBanner];
    });

    // Crear timeout y guardarlo en la referencia
    const timeoutId = setTimeout(() => {
      hideBanner(newBanner.id);
    }, duration);
    
    timeoutsRef.current.set(newBanner.id, timeoutId);
  };

  const hideBanner = (id: string) => {
    // Limpiar timeout si existe
    const timeoutId = timeoutsRef.current.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutsRef.current.delete(id);
    }
    
    setBanners(prev => prev.filter(banner => banner.id !== id));
  };

  // Cleanup al desmontar el componente
  React.useEffect(() => {
    return () => {
      // Limpiar todos los timeouts pendientes
      timeoutsRef.current.forEach(timeoutId => clearTimeout(timeoutId));
      timeoutsRef.current.clear();
    };
  }, []);

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