import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import colors from '../theme/colors';

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [selectedLanguage, setSelectedLanguage] = useState('es');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const languages = [
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
  ];

  const showComingSoon = (feature: string) => {
    Alert.alert(
      'Próximamente',
      `La función "${feature}" estará disponible pronto.`,
      [{ text: 'Entendido' }]
    );
  };

  const handleLanguageSelect = (langCode: string) => {
    setSelectedLanguage(langCode);
    const selectedLang = languages.find(lang => lang.code === langCode);
    Alert.alert(
      'Idioma seleccionado',
      `Has seleccionado ${selectedLang?.name}. Esta función se implementará próximamente.`,
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
        <Text style={styles.headerTitle}>Configuración</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Sección de Idioma */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Idioma</Text>
          <Text style={styles.sectionDescription}>
            Selecciona el idioma de la aplicación
          </Text>
          
          {languages.map((language) => (
            <TouchableOpacity
              key={language.code}
              style={styles.languageItem}
              onPress={() => handleLanguageSelect(language.code)}
            >
              <View style={styles.languageLeft}>
                <Text style={styles.languageFlag}>{language.flag}</Text>
                <Text style={styles.languageName}>{language.name}</Text>
              </View>
              {selectedLanguage === language.code && (
                <Icon name="checkmark-circle" size={24} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Sección de Notificaciones */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notificaciones</Text>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => showComingSoon('Notificaciones')}
          >
            <View style={styles.settingLeft}>
              <Icon name="notifications" size={24} color={colors.primary} />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Notificaciones Push</Text>
                <Text style={styles.settingDescription}>
                  Recibir notificaciones de citas y promociones
                </Text>
              </View>
            </View>
            <Icon name="chevron-forward" size={20} color={colors.dark3} />
          </TouchableOpacity>
        </View>

        {/* Sección de Apariencia */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Apariencia</Text>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => showComingSoon('Tema')}
          >
            <View style={styles.settingLeft}>
              <Icon name="color-palette" size={24} color={colors.primary} />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Tema</Text>
                <Text style={styles.settingDescription}>
                  Claro, oscuro o automático
                </Text>
              </View>
            </View>
            <Icon name="chevron-forward" size={20} color={colors.dark3} />
          </TouchableOpacity>
        </View>

        {/* Sección de Privacidad */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacidad</Text>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => showComingSoon('Privacidad')}
          >
            <View style={styles.settingLeft}>
              <Icon name="shield-checkmark" size={24} color={colors.primary} />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Política de Privacidad</Text>
                <Text style={styles.settingDescription}>
                  Ver términos y condiciones
                </Text>
              </View>
            </View>
            <Icon name="chevron-forward" size={20} color={colors.dark3} />
          </TouchableOpacity>
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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.dark3,
    marginBottom: 16,
  },
  languageItem: {
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
  languageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.light2,
  },
  settingItem: {
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
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 16,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.light2,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: colors.light3,
  },
});

export default SettingsScreen; 