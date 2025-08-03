import { useNotification } from '../context/NotificationContext';

export const useNotifications = () => {
  const { showBanner } = useNotification();

  return {
    showSuccess: (title: string, message?: string) => 
      showBanner('success', title, message),
    
    showError: (title: string, message?: string) => 
      showBanner('error', title, message),
    
    showWarning: (title: string, message?: string) => 
      showBanner('warning', title, message),
    
    showInfo: (title: string, message?: string) => 
      showBanner('info', title, message),
    
    showCustom: showBanner
  };
}; 