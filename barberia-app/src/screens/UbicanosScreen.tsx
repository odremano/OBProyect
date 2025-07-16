import React, { useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';

const UbicanosScreen: React.FC = () => {
  const { colors: themeColors } = useTheme();
  const { user } = useContext(AuthContext);
  const isAuthenticated = !!user;

  // Usar colores del contexto siempre
  const screenColors = themeColors;
  
  return (
    <View style={[styles.container, { backgroundColor: screenColors.background }]}>
      <Text style={[styles.text, { color: screenColors.text }]}>¡Aquí irá la pantalla de Ubícanos!</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center'
  },
  text: { 
    fontSize: 20
  }
});

export default UbicanosScreen;