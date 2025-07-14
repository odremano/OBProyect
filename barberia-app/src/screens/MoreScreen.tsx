import React, { useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import colors from '../theme/colors';
import { RootStackParamList } from '../navigation/AppNavigator';
import { AuthContext } from '../context/AuthContext';

interface MenuItem {
  id: string;
  title: string;
  icon: string;
  description?: string;
  requiresAuth: boolean;
  onPress: () => void;
}


const MoreScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { user, logout } = useContext(AuthContext);
  const isAuthenticated = !!user;
  const userName = user?.first_name || user?.username || 'Usuario';

  // Función para mostrar pantallas que aún no están implementadas
  const showComingSoon = (feature: string) => {
    Alert.alert(
      'Próximamente',
      `La función "${feature}" estará disponible pronto.`,
      [{ text: 'Entendido', style: 'default' }]
    );
  };
    // Solo se visualiza cuando estás logueado
  const perfilItems: MenuItem[] = [];
  if (isAuthenticated) {
    perfilItems.push({
      id: 'profile',
      title: 'Mi perfil',
      icon: 'person',
      description: 'Ver o editar tu perfil',
      requiresAuth: true,
      onPress: () => {
        // Placeholder para futura navegación a perfil
        Alert.alert('Próximamente', 'La función de perfil estará disponible pronto.');
      }
    });
    perfilItems.push({
      id: 'logout',
      title: 'Cerrar sesión',
      icon: 'log-out',
      description: 'Salir de tu cuenta',
      requiresAuth: true,
      onPress: () => {
        Alert.alert(
          'Cerrar sesión',
          '¿Estás seguro que deseas cerrar sesión?',
          [
            { text: 'Cancelar', style: 'cancel' },
            { 
              text: 'Cerrar sesión', 
              style: 'destructive', 
              onPress: async () => {
                await logout();
                navigation.navigate('Login');
              }
            }
          ]
        );
      }
    });
  }

  // Configuración de elementos del menú (Configuración)
  const menuItems: MenuItem[] = [
    {
      id: 'settings',
      title: 'Ajustes',
      icon: 'settings',
      description: 'Idioma, notificaciones y más',
      requiresAuth: false,
      onPress: () => navigation.navigate('Settings')
    },
    {
      id: 'about',
      title: 'Acerca de',
      icon: 'information-circle',
      description: 'Información de la app y desarrollador',
      requiresAuth: false,
      onPress: () => navigation.navigate('About')
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header fijo */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {isAuthenticated ? `Hola, ${userName}` : 'Menú Principal'}
        </Text>
        <Text style={styles.headerSubtitle}>
          {isAuthenticated 
            ? 'Gestiona tu cuenta y preferencias'
            : 'Configura la aplicación a tu gusto'
          }
        </Text>
      </View>

      {/* Contenido scrolleable */}
      <ScrollView 
        style={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContentContainer}
      >
        {/* Sección de Perfil primero */}
        {isAuthenticated && perfilItems.length > 0 && (
          <View style={styles.menuContainer}>
            <Text style={styles.sectionTitle}>Perfil</Text>
            {perfilItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <View style={styles.menuItemLeft}>
                  <View style={styles.iconContainer}>
                    <Icon
                      name={item.icon}
                      size={24}
                      color={colors.white}
                    />
                  </View>
                  <View style={styles.textContainer}>
                    <Text style={styles.menuTitle}>{item.title}</Text>
                    {item.description && (
                      <Text style={styles.menuDescription}>{item.description}</Text>
                    )}
                  </View>
                </View>
                <Icon
                  name="chevron-forward"
                  size={20}
                  color={colors.dark3}
                />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Sección de Configuración después */}
        <View style={styles.menuContainer}>
          <Text style={styles.sectionTitle}>Configuración</Text>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.iconContainer}>
                  <Icon
                    name={item.icon}
                    size={24}
                    color={colors.white}
                  />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  {item.description && (
                    <Text style={styles.menuDescription}>{item.description}</Text>
                  )}
                </View>
              </View>
              <Icon
                name="chevron-forward"
                size={20}
                color={colors.dark3}
              />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.versionText}>OdremanBarber v1.0.0</Text>
          <Text style={styles.footerText}>
            Desarrollado con ❤️ para la mejor experiencia
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 24,
    paddingTop: 56,
    backgroundColor: colors.primaryDark,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.light3,
    opacity: 0.9,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 34,
  },
  menuContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
    marginTop: 24,
    marginBottom: 12,
    marginLeft: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.dark2,
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
    marginBottom: 2,
  },
  menuDescription: {
    fontSize: 14,
    color: colors.light3,
  },
  footer: {
    padding: 24,
    alignItems: 'center',
    marginTop: 20,
  },
  versionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 4,
  },
  footerText: {
    fontSize: 12,
    color: colors.dark3,
    textAlign: 'center',
  },
});

export default MoreScreen; 