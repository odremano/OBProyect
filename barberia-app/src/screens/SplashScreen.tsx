import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, StatusBar, Image } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import OrdemaBackground from '../components/OrdemaBackground';

interface SplashScreenProps {
  onFinish: () => void;
}

const LoadingDots: React.FC<{ color: string }> = ({ color }) => {
  return (
    <View style={styles.loadingContainer}>
      <View style={[styles.loadingDot, { backgroundColor: color }]} />
      <View style={[styles.loadingDot, { backgroundColor: color }]} />
      <View style={[styles.loadingDot, { backgroundColor: color }]} />
    </View>
  );
};

const CustomSplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const { colors } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Secuencia de animaciones más simple
    const animationSequence = Animated.sequence([
      // Entrada suave del logo
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 100,
          useNativeDriver: true,
        }),
      ]),
      // Mantener visible para dar tiempo a cargar
      Animated.delay(1800),
      // Salida elegante
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]);

    animationSequence.start(() => {
      onFinish();
    });

    // Cleanup en caso de unmount
    return () => {
      animationSequence.stop();
    };
  }, []); // Remover todas las dependencias problemáticas

  return (
    <OrdemaBackground>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="transparent" 
        translucent 
      />
      <View style={[styles.container, { backgroundColor: 'transparent' }]}>
        <Animated.View 
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Image
            source={require('../../assets/splash-icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>
        
        {/* Indicador de carga animado */}
        <Animated.View 
          style={[
            styles.loadingWrapper,
            { opacity: fadeAnim }
          ]}
        >
          <LoadingDots color={colors.white} />
        </Animated.View>
      </View>
    </OrdemaBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50, // Espacio para StatusBar translúcida
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
  },
  loadingWrapper: {
    marginTop: 50,
  },
  loadingContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.7,
  },
});

export default CustomSplashScreen;
