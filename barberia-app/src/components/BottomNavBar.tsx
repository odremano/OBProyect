import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import colors from '../theme/colors';
// Si luego usas íconos reales, importa react-native-vector-icons aquí

const BottomNavBar: React.FC = () => {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.item}>
        {/* Aquí puedes poner un ícono real */}
        <Text style={styles.icon}>🏠</Text>
        <Text style={styles.label}>Inicio</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.item}>
        <Text style={styles.icon}>🗺️</Text>
        <Text style={styles.label}>Ubícanos</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.item}>
        <Text style={styles.icon}>≡</Text>
        <Text style={styles.label}>Más</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.primaryDark,
    height: 85,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    justifyContent: 'space-around',
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  item: {
    alignItems: 'center',
    flex: 1,
    marginBottom: 10,
  },
  icon: {
    fontSize: 22,
    color: colors.white,
    marginBottom: 2,
  },
  label: {
    fontSize: 12,
    color: colors.white,
    fontWeight: '500',
  },
});

export default BottomNavBar;
