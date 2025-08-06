import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UseSplashScreenOptions {
  minDuration?: number; // Duración mínima en ms
  preloadTasks?: (() => Promise<any>)[]; // Tareas a ejecutar durante el splash
}

export const useSplashScreen = (options: UseSplashScreenOptions = {}) => {
  const { minDuration = 3000, preloadTasks = [] } = options;
  const [isReady, setIsReady] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let isMounted = true;
    
    const preparApp = async () => {
      const startTime = Date.now();
      
      try {
        // Ejecutar tareas de preload en paralelo
        const taskPromises = preloadTasks.map((task, index) => 
          task().then(() => {
            if (isMounted) {
              setProgress((prev) => prev + (100 / preloadTasks.length));
            }
          })
        );

        // Ejecutar todas las tareas
        await Promise.all(taskPromises);

        // Asegurar duración mínima
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, minDuration - elapsedTime);
        
        if (remainingTime > 0) {
          await new Promise(resolve => setTimeout(resolve, remainingTime));
        }

        if (isMounted) {
          setProgress(100);
          setIsReady(true);
        }
      } catch (error) {
        console.error('Error during splash screen preparation:', error);
        if (isMounted) {
          setIsReady(true); // Continuar aunque haya errores
        }
      }
    };

    preparApp();

    return () => {
      isMounted = false;
    };
  }, [minDuration, preloadTasks]);

  return {
    isReady,
    progress,
  };
};

// Tareas comunes de preload
export const createPreloadTasks = () => ({
  // Verificar tokens guardados
  checkStoredAuth: async () => {
    try {
      const tokens = await AsyncStorage.getItem('tokens');
      const user = await AsyncStorage.getItem('user');
      return { tokens, user };
    } catch (error) {
      console.error('Error checking stored auth:', error);
      return null;
    }
  },

  // Precargar configuración de tema
  loadThemeConfig: async () => {
    try {
      const themeConfig = await AsyncStorage.getItem('themeConfig');
      return themeConfig ? JSON.parse(themeConfig) : null;
    } catch (error) {
      console.error('Error loading theme config:', error);
      return null;
    }
  },

  // Simular carga de datos iniciales
  initializeApp: async () => {
    // Simular inicialización de la app
    await new Promise(resolve => setTimeout(resolve, 500));
    return true;
  },
});
