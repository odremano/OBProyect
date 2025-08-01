import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import DynamicLogo from '../components/DynamicLogo';

const AboutScreen: React.FC = () => {
  const { colors: themeColors } = useTheme();
  const navigation = useNavigation();

  // Usar colores del contexto siempre
  const screenColors = themeColors;

  const openLink = async (url: string, label: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', `No se puede abrir ${label}`);
      }
    } catch (error) {
      Alert.alert('Error', `Error al abrir ${label}`);
    }
  };

  const handleContact = (method: string) => {
    Alert.alert(
      'Contacto',
      `Función de contacto por ${method} se implementará próximamente.`,
      [{ text: 'Entendido' }]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: screenColors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: screenColors.primaryDark }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={screenColors.white} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: screenColors.white }]}>Acerca de</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Logo y nombre de la app */}
        <View style={styles.appSection}>
          <DynamicLogo
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={[styles.appVersion, { color: screenColors.dark3 }]}>Versión 1.0.0</Text>
          <Text style={[styles.appDescription, { color: screenColors.textSecondary }]}>
            La evolución de un proyecto personal hecho con dedicación.
            Lo que comenzó como una solución para un sector, hoy se expande para ofrecer una gestión de turnos versátil y unificada. Me enorgullece enormemente este proyecto y tu feedback es fundamental para seguir mejorando.
          </Text>
        </View>

        {/* Información de la app */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: screenColors.text }]}>Información de la Aplicación</Text>
          
          <View style={[styles.infoItem, { backgroundColor: screenColors.dark2 }]}>
            <Icon name="calendar" size={20} color={screenColors.primary} />
            <View style={styles.infoText}>
              <Text style={[styles.infoLabel, { color: screenColors.text }]}>Fecha de lanzamiento</Text>
              <Text style={[styles.infoValue, { color: screenColors.textSecondary }]}>Junio 2025</Text>
            </View>
          </View>

          <View style={[styles.infoItem, { backgroundColor: screenColors.dark2 }]}>
            <Icon name="code-slash" size={20} color={screenColors.primary} />
            <View style={styles.infoText}>
              <Text style={[styles.infoLabel, { color: screenColors.text }]}>Tecnología</Text>
              <Text style={[styles.infoValue, { color: screenColors.textSecondary }]}>React Native + Django</Text>
            </View>
          </View>

          <View style={[styles.infoItem, { backgroundColor: screenColors.dark2 }]}>
            <Icon name="shield-checkmark" size={20} color={screenColors.primary} />
            <View style={styles.infoText}>
              <Text style={[styles.infoLabel, { color: screenColors.text }]}>Última actualización</Text>
              <Text style={[styles.infoValue, { color: screenColors.textSecondary }]}>Julio 2025</Text>
            </View>
          </View>
        </View>

        {/* Información del desarrollador */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: screenColors.text }]}>Desarrollador</Text>
          
          <View style={[styles.developerCard, { backgroundColor: screenColors.dark2 }]}>
            <View style={styles.developerInfo}>
              <View style={[styles.developerAvatar, { backgroundColor: screenColors.primary }]}>
                <Icon name="person" size={32} color={screenColors.light2} />
              </View>
              <View style={styles.developerText}>
                <Text style={[styles.developerName, { color: screenColors.text }]}>Jesús Odreman</Text>
                <Text style={[styles.developerTitle, { color: screenColors.dark3 }]}>Tester QA & Dev</Text>
                <Text style={[styles.developerDescription, { color: screenColors.textSecondary }]}>
                  Especializado en pruebas de software y estudiante de programación.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Contacto */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: screenColors.text }]}>Contacto</Text>
          
          <TouchableOpacity
            style={[styles.contactItem, { backgroundColor: screenColors.dark2 }]}
            onPress={() => handleContact('email')}
          >
            <Icon name="mail" size={24} color={screenColors.primary} />
            <View style={styles.contactText}>
              <Text style={[styles.contactLabel, { color: screenColors.text }]}>Email</Text>
              <Text style={[styles.contactValue, { color: screenColors.textSecondary }]}>jesus.odreman@ordema.app</Text>
            </View>
            <Icon name="chevron-forward" size={20} color={screenColors.dark3} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.contactItem, { backgroundColor: screenColors.dark2 }]}
            onPress={() => handleContact('WhatsApp')}
          >
            <Icon name="logo-whatsapp" size={24} color={screenColors.primary} />
            <View style={styles.contactText}>
              <Text style={[styles.contactLabel, { color: screenColors.text }]}>WhatsApp</Text>
              <Text style={[styles.contactValue, { color: screenColors.textSecondary }]}>+1 (234) 000-0000</Text>
            </View>
            <Icon name="chevron-forward" size={20} color={screenColors.dark3} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.contactItem, { backgroundColor: screenColors.dark2 }]}
            onPress={() => handleContact('LinkedIn')}
          >
            <Icon name="logo-linkedin" size={24} color={screenColors.primary} />
            <View style={styles.contactText}>
              <Text style={[styles.contactLabel, { color: screenColors.text }]}>LinkedIn</Text>
              <Text style={[styles.contactValue, { color: screenColors.textSecondary }]}>linkedin.com/in/jesus-odreman</Text>
            </View>
            <Icon name="chevron-forward" size={20} color={screenColors.dark3} />
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: screenColors.primaryDark }]}>
            Desarrollado con ❤️ por Jesús Odreman.
          </Text>
          <Text style={[styles.copyrightText, { color: screenColors.dark3 }]}>
            © 2025 Ordema. Todos los derechos reservados.
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  appSection: {
    alignItems: 'center',
    padding: 24,
    marginBottom: 24,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logo: {
    width: 200,
    height: 43,
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 16,
    marginBottom: 16,
  },
  appDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoText: {
    marginLeft: 16,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  developerCard: {
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  developerInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  developerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  developerText: {
    flex: 1,
  },
  developerName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  developerTitle: {
    fontSize: 14,
    marginBottom: 8,
  },
  developerDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contactText: {
    marginLeft: 16,
    flex: 1,
  },
  contactLabel: {
    fontSize: 16,
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    padding: 24,
    marginTop: 0,
  },
  footerText: {
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  copyrightText: {
    fontSize: 12,
    textAlign: 'center',
  },
});

export default AboutScreen; 