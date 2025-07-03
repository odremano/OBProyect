import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import { AuthContext } from '../context/AuthContext';
import ServiciosScreen from '../screens/ServiciosScreen';
import ProfesionalesScreen from '../screens/ProfesionalesScreen';
import ReservaTurnoScreen from '../screens/ReservaTurnoScreen';
import MisTurnosScreen from '../screens/MisTurnosScreen';

export type RootStackParamList = {
  Home: undefined;
  Servicios: undefined;
  Profesionales: undefined;
  ReservaTurno: { profesionalId: number };
  Login: undefined;
  MisTurnos: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return null;
  }

  console.log('Pantallas registradas en el stack: Home, Servicios, Profesionales, ReservaTurno, Login, MisTurnos');

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {user ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Servicios" component={ServiciosScreen} />
            <Stack.Screen name="Profesionales" component={ProfesionalesScreen} />
            <Stack.Screen name="ReservaTurno" component={ReservaTurnoScreen} />
            <Stack.Screen name="MisTurnos" component={MisTurnosScreen} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}