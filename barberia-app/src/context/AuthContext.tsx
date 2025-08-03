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

    let logoToSave = null;
    let negocioDataToSave = null;
    
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

    if (negocio && negocio.logo_url) {
      setNegocioLogo(negocio.logo_url);
      logoToSave = negocio.logo_url;
      if (!negocioDataToSave) {
        negocioDataToSave = { logo_url: negocio.logo_url };
      }
    } else if (user.negocio && user.negocio.logo_url) {
      setNegocioLogo(user.negocio.logo_url);
      logoToSave = user.negocio.logo_url;
      if (!negocioDataToSave) {
        negocioDataToSave = user.negocio;
      }
    }

    if (negocioDataToSave) {
      await AsyncStorage.setItem('negocio', JSON.stringify(negocioDataToSave));
    }

    if (logoToSave) {
      await AsyncStorage.setItem('negocioLogo', logoToSave);
    }

    await AsyncStorage.setItem('user', JSON.stringify(user));
    await AsyncStorage.setItem('tokens', JSON.stringify(tokens));
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
    setNegocioThemeColors(undefined);
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('tokens');
    await AsyncStorage.removeItem('negocio');
    await AsyncStorage.removeItem('negocioLogo');
  };

  const negocioId = user?.negocio?.id ?? null;

  return (
    <AuthContext.Provider value={{ user, tokens, negocioId, negocioLogo, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
