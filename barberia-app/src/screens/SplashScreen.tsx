import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, StatusBar } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import DynamicLogo from '../components/DynamicLogo';

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
    <>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={colors.primaryDark} 
        translucent={false}
      />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Animated.View 
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <DynamicLogo
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
          <LoadingDots color={colors.text} />
        </Animated.View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 200,
    height: 200,
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
