import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Tokens } from '../api/auth';
import { useTheme } from './ThemeContext';

export interface AuthContextType {
  user: User | null;
  tokens: Tokens | null;
  negocioId: number | null;
  negocioLogo: string | null;
  login: (user: User, tokens: Tokens, negocio?: any) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  tokens: null,
  negocioId: null,
  negocioLogo: null,
  login: async () => {},
  logout: async () => {},
  loading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<Tokens | null>(null);
  const [negocioLogo, setNegocioLogo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { setNegocioThemeColors } = useTheme();

  useEffect(() => {
    loadSession();
  }, []);

  const addTextColors = (theme: any, isDark: boolean) => ({
    ...theme,
    white: "#FFFFFF",
    text: isDark ? "#FFFFFF" : "#181818",
    textSecondary: isDark ? "#cccccc" : "#474747",
  });

  const login = async (user: User, tokens: Tokens, negocio?: any) => {

    setUser(user);
    setTokens(tokens);

    // Intentar configurar logo desde cualquier fuente disponible
    let logoToSave = null;
    let negocioDataToSave = null;
    
    // Priorizar el negocio top-level si está disponible
    if (negocio && negocio.theme_colors) {
      setNegocioThemeColors({
        light: addTextColors(negocio.theme_colors.light, false),
        dark: addTextColors(negocio.theme_colors.dark, true),
      });
      negocioDataToSave = negocio;
    } else if (
      user.negocio &&
      user.negocio.theme_colors &&
      (user.negocio.theme_colors as any).light &&
      (user.negocio.theme_colors as any).dark
    ) {
      const themeColors = user.negocio.theme_colors as any;
      setNegocioThemeColors({
        light: addTextColors(themeColors.light, false),
        dark: addTextColors(themeColors.dark, true),
      });
      negocioDataToSave = user.negocio;
    }

    // Configurar logo desde cualquier fuente disponible
    if (negocio && negocio.logo_url) {
      setNegocioLogo(negocio.logo_url);
      logoToSave = negocio.logo_url;
      // Si no teníamos datos de negocio para guardar, crear objeto solo con logo
      if (!negocioDataToSave) {
        negocioDataToSave = { logo_url: negocio.logo_url };
      }
    } else if (user.negocio && user.negocio.logo_url) {
      setNegocioLogo(user.negocio.logo_url);
      logoToSave = user.negocio.logo_url;
      // Si no teníamos datos de negocio para guardar, usar user.negocio
      if (!negocioDataToSave) {
        negocioDataToSave = user.negocio;
      }
    }

    // Guardar datos del negocio en AsyncStorage si hay algo que guardar
    if (negocioDataToSave) {
      await AsyncStorage.setItem('negocio', JSON.stringify(negocioDataToSave));
    }

    await AsyncStorage.setItem('user', JSON.stringify(user));
    await AsyncStorage.setItem('tokens', JSON.stringify(tokens));
  };

  const loadSession = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      const tokenData = await AsyncStorage.getItem('tokens');
      const negocioData = await AsyncStorage.getItem('negocio');
      
      if (userData && tokenData) {
        const user = JSON.parse(userData);
        const tokens = JSON.parse(tokenData);
        setUser(user);
        setTokens(tokens);
        
        // Cargar logo del negocio si está disponible
        if (negocioData) {
          const negocio = JSON.parse(negocioData);
          if (negocio && negocio.logo_url) {
            setNegocioLogo(negocio.logo_url);
          }
        }
        
        // Cargar tema del negocio si está disponible
        if (
          user.negocio &&
          user.negocio.theme_colors &&
          (user.negocio.theme_colors as any).light &&
          (user.negocio.theme_colors as any).dark
        ) {
          const themeColors = user.negocio.theme_colors as any;
          setNegocioThemeColors({
            light: addTextColors(themeColors.light, false),
            dark: addTextColors(themeColors.dark, true),
          });
        }
      }
    } catch (error) {
      console.log('Error cargando sesión:', error);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setUser(null);
    setTokens(null);
    setNegocioLogo(null);
    setNegocioThemeColors(undefined); // Limpia el tema del negocio
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('tokens');
    await AsyncStorage.removeItem('negocio');
  };

  const negocioId = user?.negocio?.id ?? null;

  return (
    <AuthContext.Provider value={{ user, tokens, negocioId, negocioLogo, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
