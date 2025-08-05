// Configuración de la Splash Screen
export const SPLASH_CONFIG = {
  // Duración mínima en milisegundos
  MIN_DURATION: 2500,
  
  // Animaciones
  ANIMATIONS: {
    FADE_IN_DURATION: 800,
    SCALE_SPRING: {
      friction: 4,
      tension: 100,
    },
    HOLD_DURATION: 1800,
    FADE_OUT_DURATION: 600,
  },
  
  // Dimensiones del logo
  LOGO: {
    WIDTH: 200,
    HEIGHT: 200,
  },
  
  // Configuración de loading dots
  LOADING_DOTS: {
    SIZE: 8,
    SPACING: 8,
    ANIMATION_DURATION: 400,
    DELAYS: [0, 200, 400], // Delay para cada dot
  },
};

// Tipos de splash screen según el contexto
export const SPLASH_TYPES = {
  INITIAL_LOAD: 'initial_load',
  AUTH_CHECK: 'auth_check',
  DATA_REFRESH: 'data_refresh',
} as const;

export type SplashType = typeof SPLASH_TYPES[keyof typeof SPLASH_TYPES];
