import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import colors from '../theme/colors';

const AboutScreen: React.FC = () => {
  const navigation = useNavigation();

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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Acerca de</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Logo y nombre de la app */}
        <View style={styles.appSection}>
          <View style={styles.logoContainer}>
            <Icon name="cut" size={48} color={colors.light2} />
          </View>
          <Text style={styles.appName}>OdremanBarber</Text>
          <Text style={styles.appVersion}>Versión 1.0.0</Text>
          <Text style={styles.appDescription}>
            Tu barbería de confianza, ahora en tu dispositivo móvil. 
            Proyecto personal del que me siento muy orgulloso, tu feedback me ayuda a mejorar.
          </Text>
        </View>

        {/* Información de la app */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información de la Aplicación</Text>
          
          <View style={styles.infoItem}>
            <Icon name="calendar" size={20} color={colors.primary} />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Fecha de lanzamiento</Text>
              <Text style={styles.infoValue}>Junio 2025</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Icon name="code-slash" size={20} color={colors.primary} />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Tecnología</Text>
              <Text style={styles.infoValue}>React Native + Django</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Icon name="shield-checkmark" size={20} color={colors.primary} />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Última actualización</Text>
              <Text style={styles.infoValue}>Julio 2025</Text>
            </View>
          </View>
        </View>

        {/* Información del desarrollador */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Desarrollador</Text>
          
          <View style={styles.developerCard}>
            <View style={styles.developerInfo}>
              <View style={styles.developerAvatar}>
                <Icon name="person" size={32} color={colors.light2} />
              </View>
              <View style={styles.developerText}>
                <Text style={styles.developerName}>Jesús Odreman</Text>
                <Text style={styles.developerTitle}>Tester QA & Dev</Text>
                <Text style={styles.developerDescription}>
                  Especializado en pruebas de software y estudiante de programación.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Contacto */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contacto</Text>
          
          <TouchableOpacity
            style={styles.contactItem}
            onPress={() => handleContact('email')}
          >
            <Icon name="mail" size={24} color={colors.primary} />
            <View style={styles.contactText}>
              <Text style={styles.contactLabel}>Email</Text>
              <Text style={styles.contactValue}>jaosodreman@gmail.com</Text>
            </View>
            <Icon name="chevron-forward" size={20} color={colors.dark3} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactItem}
            onPress={() => handleContact('WhatsApp')}
          >
            <Icon name="logo-whatsapp" size={24} color={colors.primary} />
            <View style={styles.contactText}>
              <Text style={styles.contactLabel}>WhatsApp</Text>
              <Text style={styles.contactValue}>+1 (234) 567-8900</Text>
            </View>
            <Icon name="chevron-forward" size={20} color={colors.dark3} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactItem}
            onPress={() => handleContact('LinkedIn')}
          >
            <Icon name="logo-linkedin" size={24} color={colors.primary} />
            <View style={styles.contactText}>
              <Text style={styles.contactLabel}>LinkedIn</Text>
              <Text style={styles.contactValue}>linkedin.com/in/jesus-odreman</Text>
            </View>
            <Icon name="chevron-forward" size={20} color={colors.dark3} />
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Desarrollado con ❤️ para OdremanBarber
          </Text>
          <Text style={styles.copyrightText}>
            © 2025 OdremanBarber. Todos los derechos reservados.
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryDark,
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
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
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 16,
    color: colors.light2,
    marginBottom: 16,
  },
  appDescription: {
    fontSize: 16,
    color: colors.dark3,
    textAlign: 'center',
    lineHeight: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.light2,
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
  infoText: {
    marginLeft: 16,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.light2,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.light3,
  },
  developerCard: {
    backgroundColor: colors.dark2,
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
    backgroundColor: colors.primary,
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
    color: colors.white,
    marginBottom: 4,
  },
  developerTitle: {
    fontSize: 14,
    color: colors.light2,
    marginBottom: 8,
  },
  developerDescription: {
    fontSize: 14,
    color: colors.dark3,
    lineHeight: 20,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
  contactText: {
    marginLeft: 16,
    flex: 1,
  },
  contactLabel: {
    fontSize: 16,
    color: colors.white,
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.light3,
  },
  footer: {
    alignItems: 'center',
    padding: 24,
    marginTop: 0,
  },
  footerText: {
    fontSize: 14,
    color: colors.primaryDark,
    marginBottom: 8,
    textAlign: 'center',
  },
  copyrightText: {
    fontSize: 12,
    color: colors.dark3,
    textAlign: 'center',
  },
});

export default AboutScreen; 