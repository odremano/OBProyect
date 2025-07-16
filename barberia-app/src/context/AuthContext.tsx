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
  const { updateColors, setNegocioThemeColors } = useTheme();

  useEffect(() => {
    // Al iniciar la app, intenta cargar el usuario y tokens guardados
    const loadSession = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');
        const tokenData = await AsyncStorage.getItem('tokens');
        const negocioData = await AsyncStorage.getItem('negocio');
        
        if (userData && tokenData) {
          const user = JSON.parse(userData);
          setUser(user);
          setTokens(JSON.parse(tokenData));
          
          // Cargar colores y logo del negocio si están disponibles
          if (negocioData) {
            const negocio = JSON.parse(negocioData);
            if (negocio && negocio.theme_colors) {
              console.log('Cargando colores desde AsyncStorage:', negocio.theme_colors);
              updateColors(negocio.theme_colors);
            }
            if (negocio && negocio.logo_url) {
              console.log('Cargando logo desde AsyncStorage:', negocio.logo_url);
              setNegocioLogo(negocio.logo_url);
            }
          } else if (user.negocio && user.negocio.theme_colors) {
            console.log('Cargando colores desde user.negocio:', user.negocio.theme_colors);
            updateColors(user.negocio.theme_colors);
          }
        }
      } catch (e) {
        console.error('Error cargando sesión:', e);
      } finally {
        setLoading(false);
      }
    };
    loadSession();
  }, []); // Sin dependencias, solo se ejecuta al montar

  const addTextColors = (theme: any, isDark: boolean) => ({
    ...theme,
    white: "#FFFFFF",
    text: isDark ? "#FFFFFF" : "#181818",
    textSecondary: isDark ? "#cccccc" : "#444072",
  });

  const login = async (user: User, tokens: Tokens, negocio?: any) => {
    console.log('=== LOGIN DEBUG ===');
    console.log('Usuario:', user);
    console.log('Negocio top-level:', negocio);
    console.log('Negocio en usuario:', user.negocio);
    console.log('Logo URL del negocio:', negocio?.logo_url);
    console.log('Logo URL del usuario:', user.negocio?.logo_url);

    setUser(user);
    setTokens(tokens);

    // Priorizar el negocio top-level si está disponible
    if (negocio && negocio.theme_colors) {
      setNegocioThemeColors({
        light: addTextColors(negocio.theme_colors.light, false),
        dark: addTextColors(negocio.theme_colors.dark, true),
      });
      if (negocio.logo_url) {
        setNegocioLogo(negocio.logo_url);
      }
      await AsyncStorage.setItem('negocio', JSON.stringify(negocio));
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
      if (user.negocio.logo_url) {
        setNegocioLogo(user.negocio.logo_url);
      }
      await AsyncStorage.setItem('negocio', JSON.stringify(user.negocio));
    }

    await AsyncStorage.setItem('user', JSON.stringify(user));
    await AsyncStorage.setItem('tokens', JSON.stringify(tokens));
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
