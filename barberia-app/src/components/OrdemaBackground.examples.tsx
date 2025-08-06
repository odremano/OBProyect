// Ejemplo de cómo aplicar OrdemaBackground a otras pantallas

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import OrdemaBackground from '../components/OrdemaBackground';
import { useTheme } from '../context/ThemeContext';

// ✅ Ejemplo 1: Pantalla básica con fondo dinámico
const ExampleScreen = () => {
  const { colors } = useTheme();

  return (
    <OrdemaBackground>
      <View style={styles.container}>
        <Text style={[styles.title, { color: colors.white }]}>
          Mi Pantalla
        </Text>
        <Text style={[styles.subtitle, { color: colors.white }]}>
          Con fondo dinámico
        </Text>
      </View>
    </OrdemaBackground>
  );
};

// ✅ Ejemplo 2: Forzar tema específico
const DarkOnlyScreen = () => {
  return (
    <OrdemaBackground forceTheme="dark">
      <View style={styles.container}>
        <Text style={styles.lightText}>
          Siempre usa fondo oscuro
        </Text>
      </View>
    </OrdemaBackground>
  );
};

// ✅ Ejemplo 3: Fondo personalizado multitenant (futuro)
const BusinessScreen = ({ businessBackgroundUrl }: { businessBackgroundUrl?: string }) => {
  return (
    <OrdemaBackground customUri={businessBackgroundUrl}>
      <View style={styles.container}>
        <Text style={styles.lightText}>
          Fondo personalizado del negocio
        </Text>
      </View>
    </OrdemaBackground>
  );
};

// ✅ Ejemplo 4: Con overlay para mejor legibilidad
const OverlayScreen = () => {
  return (
    <OrdemaBackground>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.lightText}>
            Con overlay semi-transparente
          </Text>
        </View>
      </View>
    </OrdemaBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  lightText: {
    color: '#FFFFFF',
    fontSize: 18,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // Overlay opcional para mejor legibilidad
  },
});

export { ExampleScreen, DarkOnlyScreen, BusinessScreen, OverlayScreen };
