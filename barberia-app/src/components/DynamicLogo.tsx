import React, { useContext, useState } from 'react';
import { Image, ImageSourcePropType, ImageStyle, View, Text, Appearance } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface DynamicLogoProps {
  style?: ImageStyle;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
  fallbackSourceDark?: ImageSourcePropType;
  fallbackSourceLight?: ImageSourcePropType;
  forceDefault?: boolean; // ✅ Nueva prop para forzar logo por defecto
}

const DynamicLogo: React.FC<DynamicLogoProps> = ({
  style, 
  resizeMode = 'contain',
  fallbackSourceDark = require('../../assets/logo2.png'),
  fallbackSourceLight = require('../../assets/logo.png'),
  forceDefault = false // ✅ Valor por defecto
}) => {
  const { negocioLogo, user } = useContext(AuthContext);
  const { mode } = useTheme();
  const isAuthenticated = !!user;
  const [useFallback, setUseFallback] = useState(false);
  const [imageError, setImageError] = useState(false);

  const isDarkTheme = () => {
    if (mode === 'dark') return true;
    if (mode === 'light') return false;
    return Appearance.getColorScheme() === 'dark';
  };

  const defaultLogo = isDarkTheme() ? fallbackSourceDark : fallbackSourceLight;

  // ✅ Si forceDefault es true, siempre usar el logo por defecto
  const logoSource = forceDefault || !isAuthenticated || !negocioLogo || useFallback || imageError
    ? defaultLogo 
    : { uri: negocioLogo };

  return (
    <Image
      source={logoSource}
      style={style}
      resizeMode={resizeMode}
      onError={() => {
        setImageError(true);
        setUseFallback(true);
      }}
      onLoad={() => {
        setImageError(false);
      }}
      key={`logo-${isDarkTheme()}-${logoSource === defaultLogo ? 'default' : 'negocio'}`}
    />
  );
};

export default DynamicLogo; 