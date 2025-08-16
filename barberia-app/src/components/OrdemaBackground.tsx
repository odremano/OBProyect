import React from 'react';
import { ImageBackground, StyleSheet, useColorScheme, ViewStyle } from 'react-native';

interface OrdemaBackgroundProps {
  children: React.ReactNode;
  style?: ViewStyle;
  customUri?: string; // Para soportar fondo por negocio en el futuro
  forceTheme?: 'light' | 'dark'; // Para forzar un tema específico
}

const OrdemaBackground = ({ children, style, customUri, forceTheme }: OrdemaBackgroundProps) => {
  const systemTheme = useColorScheme();
  
  // Determinar el tema a usar
  const effectiveTheme = forceTheme || systemTheme || 'dark';
  
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
      style={[styles.container, style]} 
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
