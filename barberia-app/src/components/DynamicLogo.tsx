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
  defaultWidth?: number; // ✅ Ancho por defecto si no hay dimensiones del negocio
  defaultHeight?: number; // ✅ Alto por defecto si no hay dimensiones del negocio
}

const DynamicLogo: React.FC<DynamicLogoProps> = ({
  style, 
  resizeMode = 'contain',
  fallbackSourceDark = require('../../assets/isologo2.png'),
  fallbackSourceLight = require('../../assets/isologo.png'),
  forceDefault = false, // ✅ Valor por defecto
  defaultWidth = 100, // ✅ Ancho por defecto
  defaultHeight = 70 // ✅ Alto por defecto
}) => {
  const { negocioLogo, logoDimensions, user } = useContext(AuthContext);
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

  // ✅ Extraer dimensiones simplificado (solo width y height)
  const logoWidth = logoDimensions?.width ?? defaultWidth;
  const logoHeight = logoDimensions?.height ?? defaultHeight;

  // ✅ Validar que las dimensiones sean números válidos
  const dynamicDimensions = {
    width: (typeof logoWidth === 'number' && logoWidth > 0) ? logoWidth : defaultWidth,
    height: (typeof logoHeight === 'number' && logoHeight > 0) ? logoHeight : defaultHeight
  };

  // ✅ Combinar estilos: primero las dimensiones dinámicas, luego los estilos personalizados
  const combinedStyle = [
    dynamicDimensions,
    style // Los estilos del usuario pueden sobrescribir las dimensiones si es necesario
  ];

  return (
    <Image
      source={logoSource}
      style={combinedStyle}
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