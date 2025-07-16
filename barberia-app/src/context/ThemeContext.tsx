import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Appearance } from 'react-native';

// Interfaz para los colores del tema
export interface ThemeColors {
  dark2: string;
  dark3: string;
  light2: string;
  light3: string;
  primary: string;
  background: string;
  primaryDark: string;
  white: string;
  error: string;
  black: string;
  text: string;         // Texto principal
  textSecondary: string; // Texto secundario
}

// Colores por defecto (fallback)
export const defaultColors: ThemeColors = {
  dark2: '#302D53',
  dark3: '#4A476B',
  light2: '#F4FAF6',
  light3: '#cccccc',
  primary: '#444072',
  background: '#e8e8e8',
  primaryDark: '#2a2857',
  white: '#FFFFFF',
  error: '#D32F2F',
  black: '#000000',
  text: "#181818",
  textSecondary: "#444072"
};

// En ThemeContext.tsx
export const globalLightColors: ThemeColors = {
  background: "#F4FAF6",
  primary: "#444072",
  primaryDark: "#6a67a5",
  dark2: "#302D53",
  dark3: "#4A476B",
  light2: "#FFFFFF",
  light3: "#cccccc",
  white: "#FFFFFF",
  error: "#D32F2F",
  black: "#000000",
  text: "#181818", // Negro o gris oscuro para modo claro
  textSecondary: "#444072", // O el que prefieras
};

export const globalDarkColors: ThemeColors = {
  background: "#181818",
  primary: "#444072",
  primaryDark: "#2a2857",
  dark2: "#302D53",
  dark3: "#4A476B",
  light2: "#F4FAF6",
  light3: "#cccccc",
  white: "#FFFFFF",
  error: "#D32F2F",
  black: "#000000",
  text: "#FFFFFF", // Blanco para modo oscuro
  textSecondary: "#cccccc",
};

type ThemeMode = 'light' | 'dark' | 'auto';

// Interfaz del contexto
interface ThemeContextType {
  colors: ThemeColors;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  updateColors: (newColors: Partial<ThemeColors>) => void;
  negocioThemeColors?: { light: ThemeColors; dark: ThemeColors };
  setNegocioThemeColors: (colors: { light: ThemeColors; dark: ThemeColors } | undefined) => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  colors: globalDarkColors,
  mode: 'auto',
  setMode: () => {},
  updateColors: () => {},
  negocioThemeColors: undefined,
  setNegocioThemeColors: () => {},
});

// Hook personalizado para usar el contexto
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe usarse dentro de un ThemeProvider');
  }
  return context;
};

// Provider del contexto
export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<ThemeMode>('auto');
  const [negocioThemeColors, setNegocioThemeColors] = useState<{ light: ThemeColors; dark: ThemeColors } | undefined>(undefined);
  const [colors, setColors] = useState<ThemeColors>(globalDarkColors);

  useEffect(() => {
    console.log('=== ThemeProvider Debug ===');
    console.log('mode:', mode);
    console.log('negocioThemeColors:', negocioThemeColors ? 'existe' : 'no existe');
    console.log('systemScheme:', Appearance.getColorScheme());
    
    let selectedColors = globalDarkColors;
    const systemScheme = Appearance.getColorScheme();
    if (negocioThemeColors) {
      if (mode === 'light') selectedColors = negocioThemeColors.light;
      else if (mode === 'dark') selectedColors = negocioThemeColors.dark;
      else if (mode === 'auto') selectedColors = systemScheme === 'dark' ? negocioThemeColors.dark : negocioThemeColors.light;
    } else {
      if (mode === 'light') selectedColors = globalLightColors;
      else if (mode === 'dark') selectedColors = globalDarkColors;
      else if (mode === 'auto') selectedColors = systemScheme === 'dark' ? globalDarkColors : globalLightColors;
    }
    
    console.log('selectedColors.background:', selectedColors.background);
    setColors(selectedColors);
  }, [mode, negocioThemeColors]);

  const updateColors = (newColors: Partial<ThemeColors>) => {
    setColors(prev => ({ ...prev, ...newColors }));
  };

  return (
    <ThemeContext.Provider value={{
      colors, mode, setMode, updateColors, negocioThemeColors, setNegocioThemeColors
    }}>
      {children}
    </ThemeContext.Provider>
  );
};