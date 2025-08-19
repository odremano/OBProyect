import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
<<<<<<< HEAD
  text: string;         // Texto principal
  textSecondary: string; // Texto secundario
  success: string;      // ✅ Verde de confirmación
=======
  text: string;
  textSecondary: string;
  success: string;
  brand: string; // Nuevo color de marca
>>>>>>> development
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
  textSecondary: "#cccccc",
<<<<<<< HEAD
  success: "#22C55E", // ✅ Verde de confirmación
=======
  success: "#22C55E",
  brand: "#33FFC2", // Nuevo color de marca agregado
>>>>>>> development
};

// En ThemeContext.tsx
export const globalLightColors: ThemeColors = {
  /*  background: "#F4FAF6",
  primary: "#444072",
  primaryDark: "#6a67a5",
  dark2: "#FFFFFF",
  dark3: "#4A476B",
  light2: "#FFFFFF",
  light3: "#cccccc",
  white: "#FFFFFF",
  error: "#D32F2F",
  black: "#000000",
  text: "#181818", // Negro o gris oscuro para modo claro
  textSecondary: "#474747", // O el que prefieras// */
  background: "#F5F4FA",
  primary: "#2a2857",
  primaryDark: "#1D1C3D",
  dark2: "#FFFFFF",
  dark3: "#4A476B",
  light2: "#FFFFFF",
  light3: "#cccccc",
  white: "#FFFFFF",
  error: "#D32F2F",
  black: "#000000",
  text: "#181818",
  textSecondary: "#474747",
<<<<<<< HEAD
  success: "#22C55E", // ✅ Verde de confirmación
=======
  success: "#22C55E",
  brand: "#33FFC2",
>>>>>>> development
};

export const globalDarkColors: ThemeColors = {
  background: "#181736",
  primary: "#2a2857",
  primaryDark: "#1D1C3D",
  dark2: "#2E2D53",
  dark3: "#49476B",
  light2: "#F4FAF6",
  light3: "#cccccc",
  white: "#FFFFFF",
  error: "#D32F2F",
  black: "#000000",
  text: "#FFFFFF",
  textSecondary: "#cccccc",
<<<<<<< HEAD
  success: "#22C55E", // ✅ Verde de confirmación
=======
  success: "#22C55E",
  brand: "#33FFC2",
>>>>>>> development
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

  // Función para agregar colores de texto dinámicos
  const addTextColors = (theme: any, isDark: boolean) => ({
    ...theme,
    white: "#FFFFFF",
    text: isDark ? "#FFFFFF" : "#181818",
    textSecondary: isDark ? "#cccccc" : "#666666",
    success: "#22C55E",
  });

  // Cargar configuración persistente al inicializar
  useEffect(() => {
    const loadPersistedSettings = async () => {
      try {
        // Cargar modo de tema
        const savedMode = await AsyncStorage.getItem('themeMode');
        if (savedMode && ['light', 'dark', 'auto'].includes(savedMode)) {
          setMode(savedMode as ThemeMode);
        }

        // Cargar colores del negocio
        const negocioData = await AsyncStorage.getItem('negocio');
        if (negocioData) {
          const negocio = JSON.parse(negocioData);
          if (negocio && negocio.theme_colors) {
            setNegocioThemeColors({
              light: addTextColors(negocio.theme_colors.light, false),
              dark: addTextColors(negocio.theme_colors.dark, true),
            });
          }
        }
      } catch (error) {
        console.error('Error cargando configuración del tema:', error);
      }
    };

    loadPersistedSettings();
  }, []);

  // Función para establecer y persistir el modo de tema
  const setModeWithPersistence = async (newMode: ThemeMode) => {
    setMode(newMode);
    try {
      await AsyncStorage.setItem('themeMode', newMode);
    } catch (error) {
      console.error('Error guardando modo de tema:', error);
    }
  };

  useEffect(() => {
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
    
    // ✅ Debug temporal
    console.log(' Selected colors:', selectedColors);
    console.log('🎨 Success color in selected:', selectedColors.success);
    
    setColors(selectedColors);
  }, [mode, negocioThemeColors]);

  const updateColors = (newColors: Partial<ThemeColors>) => {
    setColors(prev => ({ ...prev, ...newColors }));
  };

  // Función para establecer y persistir los colores del negocio
  const setNegocioThemeColorsWithPersistence = async (colors: { light: ThemeColors; dark: ThemeColors } | undefined) => {
    setNegocioThemeColors(colors);
    
    // Si se están estableciendo colores, los guardamos en AsyncStorage
    if (colors) {
      try {
        const existingNegocioData = await AsyncStorage.getItem('negocio');
        let negocioData = existingNegocioData ? JSON.parse(existingNegocioData) : {};
        
        negocioData.theme_colors = {
          light: colors.light,
          dark: colors.dark
        };
        
        await AsyncStorage.setItem('negocio', JSON.stringify(negocioData));
      } catch (error) {
        console.error('Error guardando colores del negocio:', error);
      }
    }
  };

  return (
    <ThemeContext.Provider value={{
      colors, mode, setMode: setModeWithPersistence, updateColors, negocioThemeColors, setNegocioThemeColors: setNegocioThemeColorsWithPersistence
    }}>
      {children}
    </ThemeContext.Provider>
  );
};