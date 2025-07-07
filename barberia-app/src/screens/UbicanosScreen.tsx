import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import colors from '../theme/colors';
const UbicanosScreen: React.FC = () => (
  <View style={styles.container}>
    <Text style={styles.text}>¡Aquí irá la pantalla de Ubícanos!</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  text: { fontSize: 20, color: colors.white  }
});

export default UbicanosScreen;