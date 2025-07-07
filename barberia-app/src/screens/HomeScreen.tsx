import React, { useContext } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import colors from '../theme/colors';
/*import BottomNavBar from '../components/BottomNavBar';*/

export default function HomeScreen() {
  const { user, logout } = useContext(AuthContext);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleTabPress = (tabName: string) => {
    if (tabName === 'Más') {
      navigation.navigate('More');
    } else if (tabName === 'Inicio') {
      // Ya estamos en Home
    } else {
      console.log(`Tab pressed: ${tabName}`);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>¡Bienvenido/a, {user?.first_name}!</Text>
        <Button
          title="Reservar turno"
          onPress={() => {
            console.log('Intentando navegar a Profesionales');
            navigation.navigate('Profesionales');
          }}
        /> 
        <Button title="Mis turnos" onPress={() => navigation.navigate('MisTurnos')} />
        <Button title="Ver servicios" onPress={() => navigation.navigate('Servicios')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'space-between', 
    backgroundColor: colors.background
  },
  content: {
    flex: 1,
    justifyContent: 'center', 
    alignItems: 'center'
  },
  title: { 
    fontSize: 24, 
    marginBottom: 20,
    color: colors.white
  }
});
