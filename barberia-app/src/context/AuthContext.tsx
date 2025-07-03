import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Tokens } from '../api/auth';

interface AuthContextType {
  user: User | null;
  tokens: Tokens | null;
  login: (user: User, tokens: Tokens) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  tokens: null,
  login: async () => {},
  logout: async () => {},
  loading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<Tokens | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Al iniciar la app, intenta cargar el usuario y tokens guardados
    const loadSession = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');
        const tokenData = await AsyncStorage.getItem('tokens');
        if (userData && tokenData) {
          setUser(JSON.parse(userData));
          setTokens(JSON.parse(tokenData));
        }
      } catch (e) {
        // Manejo de error opcional
      } finally {
        setLoading(false);
      }
    };
    loadSession();
  }, []);

  const login = async (user: User, tokens: Tokens) => {
    setUser(user);
    setTokens(tokens);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    await AsyncStorage.setItem('tokens', JSON.stringify(tokens));
  };

  const logout = async () => {
    setUser(null);
    setTokens(null);
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('tokens');
  };

  return (
    <AuthContext.Provider value={{ user, tokens, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
