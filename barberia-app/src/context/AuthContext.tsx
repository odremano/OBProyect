import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Tokens } from '../api/auth';
import { useTheme } from './ThemeContext';

export interface AuthContextType {
  user: User | null;
  tokens: Tokens | null;
  negocioId: number | null;
  negocioLogo: string | null;
  logoDimensions: { width: number; height: number } | null;
  login: (user: User, tokens: Tokens) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  tokens: null,
  negocioId: null,
  negocioLogo: null,
  logoDimensions: null,
  login: async () => {},
  updateUser: async () => {},
  logout: async () => {},
  loading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<Tokens | null>(null);
  const [negocioLogo, setNegocioLogo] = useState<string | null>(null);
  const [logoDimensions, setLogoDimensions] = useState<{ width: number; height: number } | null>(null);
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

  const login = async (user: User, tokens: Tokens) => {
    setUser(user);
    setTokens(tokens);
    
    if (user.negocio) {
      if (user.negocio.logo_url) {
        setNegocioLogo(user.negocio.logo_url);
        setLogoDimensions({
          width: user.negocio.logo_width ?? 100,
          height: user.negocio.logo_height ?? 70
        });
        
        await AsyncStorage.setItem('negocioLogo', user.negocio.logo_url);
      }
      
      if (user.negocio.theme_colors) {
        const themeColors = user.negocio.theme_colors as any;
        if (themeColors.light && themeColors.dark) {
          setNegocioThemeColors({
            light: addTextColors(themeColors.light, false),
            dark: addTextColors(themeColors.dark, true),
          });
        }
      }
      
      await AsyncStorage.setItem('negocio', JSON.stringify(user.negocio));
    }
    
    await AsyncStorage.setItem('user', JSON.stringify(user));
    await AsyncStorage.setItem('tokens', JSON.stringify(tokens));
  };

  const updateUser = async (newUser: User) => {
    setUser(newUser);
    await AsyncStorage.setItem('user', JSON.stringify(newUser));
  };

  const loadSession = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      const tokenData = await AsyncStorage.getItem('tokens');
      const negocioData = await AsyncStorage.getItem('negocio');
      const negocioLogoData = await AsyncStorage.getItem('negocioLogo');
      
      if (userData && tokenData) {
        const user = JSON.parse(userData);
        const tokens = JSON.parse(tokenData);
        setUser(user);
        setTokens(tokens);
        
        if (negocioLogoData) {
          setNegocioLogo(negocioLogoData);
        } else if (negocioData) {
          const negocio = JSON.parse(negocioData);
          if (negocio && negocio.logo_url) {
            setNegocioLogo(negocio.logo_url);
          }
        }
        
        // Cargar dimensiones del logo
        if (negocioData) {
          const negocio = JSON.parse(negocioData);
          if (negocio && (negocio.logo_width || negocio.logo_height)) {
            setLogoDimensions({
              width: negocio.logo_width || 100,
              height: negocio.logo_height || 70
            });
          }
        } else if (user.negocio && (user.negocio.logo_width || user.negocio.logo_height)) {
          setLogoDimensions({
            width: user.negocio.logo_width || 100,
            height: user.negocio.logo_height || 70
          });
        }
        
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
      // Error silencioso para evitar logs innecesarios
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setUser(null);
    setTokens(null);
    setNegocioLogo(null);
    setLogoDimensions(null);
    setNegocioThemeColors(undefined);
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('tokens');
    await AsyncStorage.removeItem('negocio');
    await AsyncStorage.removeItem('negocioLogo');
  };

  const negocioId = user?.negocio?.id ?? null;

  return (
    <AuthContext.Provider value={{ user, tokens, negocioId, negocioLogo, logoDimensions, login, updateUser, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
