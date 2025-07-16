import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';

const SettingsScreen: React.FC = () => {
  const { colors: themeColors, mode, setMode } = useTheme();
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);
  const isAuthenticated = !!user;
  const [selectedLanguage, setSelectedLanguage] = useState('es');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [themeModalVisible, setThemeModalVisible] = useState(false);

  // Usar colores del contexto siempre
  const screenColors = themeColors;

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

  const handleSelectTheme = (selectedMode: 'light' | 'dark' | 'auto') => {
    setMode(selectedMode);
    setThemeModalVisible(false);
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
        <Text style={[styles.headerTitle, { color: screenColors.white }]}>Configuración</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Sección de Idioma */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: screenColors.text }]}>Idioma</Text>
          <Text style={[styles.sectionDescription, { color: screenColors.dark3 }]}>
            Selecciona el idioma de la aplicación
          </Text>
          
          {languages.map((language) => (
            <TouchableOpacity
              key={language.code}
              style={[styles.languageItem, { backgroundColor: screenColors.dark2 }]}
              onPress={() => handleLanguageSelect(language.code)}
            >
              <View style={styles.languageLeft}>
                <Text style={styles.languageFlag}>{language.flag}</Text>
                <Text style={[styles.languageName, { color: screenColors.light2 }]}>{language.name}</Text>
              </View>
              {selectedLanguage === language.code && (
                <Icon name="checkmark-circle" size={24} color={screenColors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Sección de Notificaciones */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: screenColors.text }]}>Notificaciones</Text>
          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: screenColors.dark2 }]}
            onPress={() => showComingSoon('Notificaciones')}
          >
            <View style={styles.settingLeft}>
              <Icon name="notifications" size={24} color={screenColors.primary} />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: screenColors.light2 }]}>Notificaciones Push</Text>
                <Text style={[styles.settingDescription, { color: screenColors.light3 }]}>
                  Recibir notificaciones de citas y promociones
                </Text>
              </View>
            </View>
            <Icon name="chevron-forward" size={20} color={screenColors.dark3} />
          </TouchableOpacity>
        </View>

        {/* Sección de Apariencia */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: screenColors.text }]}>Apariencia</Text>
          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: screenColors.dark2 }]}
            onPress={() => setThemeModalVisible(true)}
          >
            <View style={styles.settingLeft}>
              <Icon name="color-palette" size={24} color={screenColors.primary} />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: screenColors.light2 }]}>Tema</Text>
                <Text style={[styles.settingDescription, { color: screenColors.light3 }]}>
                  Claro, oscuro o automático
                </Text>
              </View>
            </View>
            <Icon name="chevron-forward" size={20} color={screenColors.dark3} />
          </TouchableOpacity>
        </View>

        {/* Sección de Privacidad */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: screenColors.text }]}>Privacidad</Text>
          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: screenColors.dark2 }]}
            onPress={() => showComingSoon('Privacidad')}
          >
            <View style={styles.settingLeft}>
              <Icon name="shield-checkmark" size={24} color={screenColors.primary} />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: screenColors.light2 }]}>Política de Privacidad</Text>
                <Text style={[styles.settingDescription, { color: screenColors.light3 }]}>
                  Ver términos y condiciones
                </Text>
              </View>
            </View>
            <Icon name="chevron-forward" size={20} color={screenColors.dark3} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={themeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setThemeModalVisible(false)}
      >
        <View style={modalStyles.overlay}>
          <View style={[modalStyles.container, { backgroundColor: screenColors.light3 }]}>
            <Text style={[modalStyles.title, { color: screenColors.primary }]}>Selecciona el tema</Text>
            <TouchableOpacity
              style={modalStyles.option}
              onPress={() => handleSelectTheme('light')}
            >
              <Text style={{ color: mode === 'light' ? screenColors.primaryDark : screenColors.black }}>Claro</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={modalStyles.option}
              onPress={() => handleSelectTheme('dark')}
            >
              <Text style={{ color: mode === 'dark' ? screenColors.primaryDark : screenColors.black }}>Oscuro</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={modalStyles.option}
              onPress={() => handleSelectTheme('auto')}
            >
              <Text style={{ color: mode === 'auto' ? screenColors.primaryDark : screenColors.black }}>Automático</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={modalStyles.cancel}
              onPress={() => setThemeModalVisible(false)}
            >
              <Text style={{ color: screenColors.error }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  languageItem: {
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
  },
  settingItem: {
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
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: 300,
    borderRadius: 16,
    padding: 24,
    alignItems: 'stretch',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  option: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancel: {
    marginTop: 12,
    alignItems: 'center',
  },
});

export default SettingsScreen; 