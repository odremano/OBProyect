import React, { useContext, useState } from 'react';
import { Image, ImageSourcePropType, ImageStyle, View, Text } from 'react-native';
import { AuthContext } from '../context/AuthContext';

interface DynamicLogoProps {
  style?: ImageStyle;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
  fallbackSource?: ImageSourcePropType;
}

const DynamicLogo: React.FC<DynamicLogoProps> = ({ 
  style, 
  resizeMode = 'contain',
  fallbackSource = require('../../assets/logo.png')
}) => {
  const { negocioLogo, user } = useContext(AuthContext);
  const isAuthenticated = !!user;
  const [useFallback, setUseFallback] = useState(false);
  const [imageError, setImageError] = useState(false);

  console.log('=== DynamicLogo Debug ===');
  console.log('isAuthenticated:', isAuthenticated);
  console.log('negocioLogo:', negocioLogo);
  console.log('useFallback:', useFallback);
  console.log('imageError:', imageError);

  // Si está autenticado y hay logo del negocio, usarlo; si no, usar el predeterminado
  const logoSource = isAuthenticated && negocioLogo && !useFallback && !imageError
    ? { uri: negocioLogo } 
    : fallbackSource;

  console.log('logoSource:', logoSource);

  return (
    <Image
      source={logoSource}
      style={style}
      resizeMode={resizeMode}
      // Manejar errores de carga del logo del negocio
      onError={() => {
        console.log('Error cargando logo del negocio, usando logo predeterminado');
        setImageError(true);
        setUseFallback(true);
      }}
      onLoad={() => {
        console.log('Logo cargado exitosamente:', logoSource);
        setImageError(false);
      }}
    />
  );
};

export default DynamicLogo; 