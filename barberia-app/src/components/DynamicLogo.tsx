import React, { useContext, useState } from 'react';
import { Image, ImageSourcePropType, ImageStyle, View, Text, Appearance } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface DynamicLogoProps {
  style?: ImageStyle;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
  fallbackSourceDark?: ImageSourcePropType;
  fallbackSourceLight?: ImageSourcePropType;
}

const DynamicLogo: React.FC<DynamicLogoProps> = ({ 
  style, 
  resizeMode = 'contain',
  fallbackSourceDark = require('../../assets/logo2.png'),  // Logo claro (F4FAF6) para fondo oscuro
  fallbackSourceLight = require('../../assets/logo.png')   // Logo original para fondo claro
}) => {
  const { negocioLogo, user } = useContext(AuthContext);
  const { mode } = useTheme();
  const isAuthenticated = !!user;
  const [useFallback, setUseFallback] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Determinar si el tema actual es oscuro
  const isDarkTheme = () => {
    if (mode === 'dark') return true;
    if (mode === 'light') return false;
    // Si es 'auto', usar el esquema del sistema
    return Appearance.getColorScheme() === 'dark';
  };

  // Seleccionar el logo predeterminado basado en el tema
  const defaultLogo = isDarkTheme() ? fallbackSourceDark : fallbackSourceLight;

  console.log('=== DynamicLogo Debug ===');
  console.log('isAuthenticated:', isAuthenticated);
  console.log('negocioLogo:', negocioLogo);
  console.log('useFallback:', useFallback);
  console.log('imageError:', imageError);
  console.log('mode:', mode);
  console.log('isDarkTheme:', isDarkTheme());
  console.log('defaultLogo:', defaultLogo);

  // Si está autenticado y hay logo del negocio, usarlo; si no, usar el logo por tema
  const logoSource = isAuthenticated && negocioLogo && !useFallback && !imageError
    ? { uri: negocioLogo } 
    : defaultLogo;

  console.log('logoSource:', logoSource);

  return (
    <Image
      source={logoSource}
      style={style}
      resizeMode={resizeMode}
      // Manejar errores de carga del logo del negocio
      onError={() => {
        console.log('Error cargando logo del negocio, usando logo predeterminado por tema');
        setImageError(true);
        setUseFallback(true);
      }}
      onLoad={() => {
        console.log('Logo cargado exitosamente:', logoSource);
        setImageError(false);
      }}
      // Agregar key para forzar re-render cuando cambie el tema
      key={`logo-${isDarkTheme()}-${logoSource === defaultLogo ? 'default' : 'negocio'}`}
    />
  );
};

export default DynamicLogo; 