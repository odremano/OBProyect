import React from 'react';
import { ImageBackground, StyleSheet, useColorScheme, ViewStyle, Appearance } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface OrdemaBackgroundProps {
  children: React.ReactNode;
  style?: ViewStyle;
  customUri?: string; // Para soportar fondo por negocio en el futuro
  forceTheme?: 'light' | 'dark'; // Para forzar un tema específico
}

const OrdemaBackground = ({ children, style, customUri, forceTheme }: OrdemaBackgroundProps) => {
  const { mode, colors } = useTheme(); // Agregar colors al hook
  const systemTheme = useColorScheme();
  
  // Determinar el tema efectivo basado en el ThemeContext
  let effectiveTheme: 'light' | 'dark';
  
  if (forceTheme) {
    effectiveTheme = forceTheme;
  } else if (mode === 'auto') {
    effectiveTheme = systemTheme === 'dark' ? 'dark' : 'light';
  } else {
    effectiveTheme = mode; // 'light' o 'dark'
  }
  
  const defaultDark = require('../../assets/bgdark-ordema.png');
  const defaultLight = require('../../assets/bglight-ordema.png');

  const backgroundSource = customUri
    ? { uri: customUri }
    : effectiveTheme === 'dark'
    ? defaultDark
    : defaultLight;

  return (
    <ImageBackground 
      source={backgroundSource} 
      style={[
        styles.container, 
        { backgroundColor: colors.background }, // Usar color del tema como base
        style
      ]} 
      resizeMode="cover"
    >
      {children}
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default OrdemaBackground;
