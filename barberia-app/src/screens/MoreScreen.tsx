import React, { useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
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
  const { colors: themeColors } = useTheme();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { user, logout } = useContext(AuthContext);
  const isAuthenticated = !!user;
  const userName = user?.first_name || user?.username || 'Usuario';

  // Usar colores del contexto siempre
  const screenColors = themeColors;
  
  // Debug: verificar qué color se está usando
  console.log('=== MoreScreen Debug ===');
  console.log('themeColors.textSecondary:', themeColors.textSecondary);
  console.log('screenColors.textSecondary:', screenColors.textSecondary);
  console.log('themeColors === screenColors:', themeColors === screenColors);
  console.log('themeColors object:', JSON.stringify(themeColors, null, 2));

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
        navigation.navigate('MiPerfil');
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
    <View style={[styles.container, { backgroundColor: screenColors.background }]}>
      {/* Header fijo */}
      <View style={[styles.header, { backgroundColor: screenColors.primaryDark }]}>
        <Text style={[styles.headerTitle, { color: screenColors.white }]}>
          {isAuthenticated ? `Hola, ${userName}` : 'Menú Principal'}
        </Text>
        <Text style={[styles.headerSubtitle, { color: screenColors.light2 }]}>
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
            <Text style={[styles.sectionTitle, { color: screenColors.text }]}>Perfil</Text>
            {perfilItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.menuItem, { backgroundColor: screenColors.dark2 }]}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <View style={styles.menuItemLeft}>
                  <View style={[styles.iconContainer, { backgroundColor: screenColors.primary }]}>
                    <Icon
                      name={item.icon}
                      size={24}
                      color={screenColors.white}
                    />
                  </View>
                  <View style={styles.textContainer}>
                    <Text style={[styles.menuTitle, { color: screenColors.text }]}>{item.title}</Text>
                    {item.description && (
                      <Text style={[styles.menuDescription, { color: screenColors.textSecondary }]}>{item.description}</Text>
                    )}
                  </View>
                </View>
                <Icon
                  name="chevron-forward"
                  size={20}
                  color={screenColors.dark3}
                />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Sección de Configuración después */}
        <View style={styles.menuContainer}>
          <Text style={[styles.sectionTitle, { color: screenColors.text }]}>Configuración</Text>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.menuItem, { backgroundColor: screenColors.dark2 }]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.iconContainer, { backgroundColor: screenColors.primary }]}>
                  <Icon
                    name={item.icon}
                    size={24}
                    color={screenColors.white}
                  />
                </View>
                <View style={styles.textContainer}>
                  <Text style={[styles.menuTitle, { color: screenColors.text }]}>{item.title}</Text>
                  {item.description && (
                    <Text style={[styles.menuDescription, { color: screenColors.textSecondary }]}>
                      {(() => {
                        console.log('Aplicando color textSecondary:', screenColors.textSecondary, 'para item:', item.title);
                        return item.description;
                      })()}
                    </Text>
                  )}
                </View>
              </View>
              <Icon
                name="chevron-forward"
                size={20}
                color={screenColors.dark3}
              />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={[styles.versionText, { color: screenColors.primary }]}>Ordema v1.0.0</Text>
          <Text style={[styles.footerText, { color: screenColors.dark3 }]}>
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
  },
  header: {
    padding: 24,
    paddingTop: 56,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
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
    marginTop: 24,
    marginBottom: 12,
    marginLeft: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    marginBottom: 2,
  },
  menuDescription: {
    fontSize: 14,
  },
  footer: {
    padding: 24,
    alignItems: 'center',
    marginTop: 20,
  },
  versionText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
  },
});

export default MoreScreen; 