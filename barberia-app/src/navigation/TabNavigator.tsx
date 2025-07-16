import React, { useContext } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import MoreScreen from '../screens/MoreScreen';
import LoginScreen from '../screens/LoginScreen';
import UbicanosScreen from '../screens/UbicanosScreen';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import HandleTabBar from '../components/HandleTabBar';
import { View, Text } from 'react-native';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  const { colors: themeColors } = useTheme();
  const { user, logout } = useContext(AuthContext);
  const isAuthenticated = !!user;
  const userName = user?.first_name || user?.username || 'Usuario';

  // Usar colores del contexto siempre
  const tabColors = themeColors;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: tabColors.primaryDark,
          height: 85,
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
          elevation: 12,
          borderTopWidth: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -5 },
          shadowOpacity: 0.2,
          shadowRadius: 12,
        },
        tabBarActiveTintColor: tabColors.white,
        tabBarInactiveTintColor: tabColors.light3,
        tabBarIcon: ({ color, size, focused }) => {
          let iconName = '';
          if (route.name === 'Inicio') iconName = 'home';
          else if (route.name === 'Ubícanos') iconName = 'location';
          else if (route.name === 'Más') iconName = 'menu';
          else if (route.name === 'Login') iconName = 'log-in';

          return (
            <View style={{ alignItems: 'center' }}>
              {focused && <HandleTabBar />}
              <Icon name={iconName} size={24} color={color} />
            </View>
          );
        },
        tabBarLabel: ({ focused, color }) => (
          <Text
            style={{
              color,
              fontSize: 12,
              fontWeight: focused ? 'bold' : '600',
              marginTop: 8,
            }}
          >
            {route.name}
          </Text>
        ),
      })}
    >
      {user ? (
        <>
          <Tab.Screen name="Inicio" component={HomeScreen} />
          <Tab.Screen name="Ubícanos" component={UbicanosScreen} />
          <Tab.Screen name="Más" component={MoreScreen} />
        </>
      ) : (
        <>
          <Tab.Screen name="Login" component={LoginScreen} />
          <Tab.Screen name="Ubícanos" component={UbicanosScreen} />
          <Tab.Screen name="Más" component={MoreScreen} />
        </>
      )}
    </Tab.Navigator>
  );
}
