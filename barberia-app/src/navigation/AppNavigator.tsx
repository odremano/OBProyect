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
import MoreScreen from '../screens/MoreScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AboutScreen from '../screens/AboutScreen';
import TabNavigator from './TabNavigator';

export type RootStackParamList = {
  MainTabs: undefined;
  Servicios: undefined;
  Profesionales: undefined;
  ReservaTurno: { profesionalId: number };
  Login: undefined;
  MisTurnos: undefined;
  More: { isAuthenticated?: boolean; userName?: string } | undefined;
  Settings: undefined;
  About: undefined;
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
        <Stack.Screen name="MainTabs" component={TabNavigator} options={{ headerShown: false }} />
        <Stack.Screen name="ReservaTurno" component={ReservaTurnoScreen} />
        <Stack.Screen name="Servicios" component={ServiciosScreen} />
        <Stack.Screen name="Profesionales" component={ProfesionalesScreen} />
        <Stack.Screen name="MisTurnos" component={MisTurnosScreen} />
        <Stack.Screen name="About" component={AboutScreen} options={{headerShown: false }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}