import React, { useContext, useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import CustomSplashScreen from '../screens/SplashScreen';
import { AuthContext } from '../context/AuthContext';
import ServiciosScreen from '../screens/ServiciosScreen';
import ProfesionalesScreen from '../screens/ProfesionalesScreen';
import ReservaTurnoScreen from '../screens/ReservaTurnoScreen';
import MisTurnosScreen from '../screens/MisTurnosScreen';
import MoreScreen from '../screens/MoreScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AboutScreen from '../screens/AboutScreen';
import TabNavigator from './TabNavigator';
import ConfirmacionTurnoScreen from '../screens/ConfirmacionTurnoScreen';
import MiDisponibilidadScreen from '../screens/MiDisponibilidadScreen';
import GananciasScreen from '../screens/GananciasScreen';
import VerAgendaScreen from '../screens/VerAgendaScreen';
import MiPerfilScreen from '../screens/MiPerfilScreen';
import SeleccionarNegocioScreen from '../screens/SeleccionarNegocioScreen';

export type RootStackParamList = {
  MainTabs: { screen?: string; params?: { showConfirmationBanner?: boolean } } | undefined;
  Servicios: { onSelect?: (servicio: any) => void; modal?: boolean } | undefined;
  Profesionales: { onSelect?: (profesional: any) => void } | undefined;
  ReservaTurno: { profesionalId?: number };
  ConfirmacionTurno: {
    profesional: any;
    servicio: any;
    fecha: string;
    hora: string;
  };
  Login: undefined;
  SeleccionarNegocio: { fromPrivateArea?: boolean } | undefined;
  MisTurnos: undefined;
  More: { isAuthenticated?: boolean; userName?: string } | undefined;
  Settings: undefined;
  About: undefined;
  MiDisponibilidad: undefined;
  Ganancias: undefined;
  VerAgenda: undefined;
  MiPerfil: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { user, loading } = useContext(AuthContext);
  const [appReady, setAppReady] = useState(false);
  
  // Simulación simple de inicialización
  useEffect(() => {
    const initializeApp = async () => {
      // Simular carga de configuraciones
      await new Promise(resolve => setTimeout(resolve, 2000));
      setAppReady(true);
    };
    
    initializeApp();
  }, []);

  // Mostrar splash screen mientras no esté listo o auth está cargando
  if (!appReady || loading) {
    return <CustomSplashScreen onFinish={() => setAppReady(true)} />;
  }

  console.log('Pantallas registradas en el stack: Home, Servicios, Profesionales, ReservaTurno, Login, MisTurnos');

  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="MainTabs" component={TabNavigator} options={{ headerShown: false }} />
        <Stack.Screen 
          name="ReservaTurno" 
          component={ReservaTurnoScreen} 
          options={{ 
            headerShown: false,
            presentation: 'card',
            animationTypeForReplace: 'push',
            animation: 'slide_from_bottom',
            animationDuration: 300  
          }} 
        />
        <Stack.Screen 
          name="Servicios" 
          component={ServiciosScreen} 
          options={({ route }) => ({
            headerShown: false,
            ...(route.params?.modal ? {
              presentation: 'card',
              animationTypeForReplace: 'push',
              animation: 'slide_from_bottom',
              animationDuration: 300
            } : {})
          })}
        />
        <Stack.Screen name="Profesionales" component={ProfesionalesScreen} options={{ headerShown: false }} />
        <Stack.Screen 
          name="MisTurnos" 
          component={MisTurnosScreen} 
          options={{ 
            headerShown: false,
            presentation: 'card',
            animationTypeForReplace: 'push',
            animation: 'slide_from_bottom',
            animationDuration: 300
          }} 
        />
        <Stack.Screen name="About" component={AboutScreen} options={{headerShown: false }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{headerShown: false }} />
        <Stack.Screen name="ConfirmacionTurno" component={ConfirmacionTurnoScreen} options={{ headerShown: false }} />
        <Stack.Screen 
          name="MiDisponibilidad" 
          component={MiDisponibilidadScreen} 
          options={{ 
            headerShown: false,
            presentation: 'card',
            animationTypeForReplace: 'push',
            animation: 'slide_from_bottom',
            animationDuration: 300
          }} 
        />
        <Stack.Screen 
          name="Ganancias" 
          component={GananciasScreen} 
          options={{ 
            headerShown: false,
            presentation: 'card',
            animationTypeForReplace: 'push',
            animation: 'slide_from_bottom',
            animationDuration: 300
          }} 
        />
        <Stack.Screen 
          name="VerAgenda" 
          component={VerAgendaScreen} 
          options={{ 
            headerShown: false,
            presentation: 'card',
            animationTypeForReplace: 'push',
            animation: 'slide_from_bottom',
            animationDuration: 300
          }} 
        />
        <Stack.Screen name="MiPerfil" component={MiPerfilScreen} options={{ headerShown: false }} />
        <Stack.Screen 
          name="SeleccionarNegocio" 
          component={SeleccionarNegocioScreen} 
          options={{ 
            headerShown: false,
            presentation: 'modal',
            animationTypeForReplace: 'push',
            animation: 'slide_from_bottom',
            animationDuration: 300
          }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}