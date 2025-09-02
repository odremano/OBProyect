import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { NotificationProvider } from './src/context/NotificationContext';
import AppNavigator from './src/navigation/AppNavigator';
import BannerStack from './src/components/BannerStack';
import { useTheme } from './src/context/ThemeContext';

function AppContent() {
  const { colors } = useTheme();
  
  return (
    <>
      <StatusBar 
        backgroundColor={colors.primaryDark}
        barStyle="light-content"
        translucent={false}
      />
      <AppNavigator />
      <BannerStack />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <AppContent />
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}