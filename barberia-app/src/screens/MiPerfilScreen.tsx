import React, { useState, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  Alert,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { cambiarContrasena, CambiarContrasenaPayload, obtenerTokensDelStorage, guardarTokensEnStorage } from '../api/perfil';
import { Tokens } from '../api/auth';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface AccordionItemProps {
  id: string;
  title: string;
  subtitle: string;
  iconName: string;
  isExpanded: boolean;
  onToggle: (id: string) => void;
  children: React.ReactNode;
  expandable?: boolean;
}



const AccordionItem: React.FC<AccordionItemProps> = ({
  id,
  title,
  subtitle,
  iconName,
  isExpanded,
  onToggle,
  children,
  expandable = true
}) => {
  const { colors } = useTheme();
  
  return (
    <View style={[styles.accordionContainer, { backgroundColor: colors.dark2 }]}>
      <TouchableOpacity
        style={styles.accordionHeader}
        onPress={() => onToggle(id)}
        activeOpacity={0.7}
      >
        <View style={styles.accordionHeaderLeft}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
            <Icon name={iconName} size={20} color={colors.white} />
          </View>
          <View style={styles.accordionHeaderText}>
            <Text style={[styles.accordionTitle, { color: colors.text }]}>{title}</Text>
            <Text style={[styles.accordionSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
          </View>
        </View>
        {expandable && (
          <Icon 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={20} 
            color={colors.textSecondary} 
          />
        )}
      </TouchableOpacity>
      
      {isExpanded && expandable && (
        <View style={[styles.accordionContent, { borderTopColor: colors.dark3 }]}>
          {children}
        </View>
      )}
    </View>
  );
};


const MiPerfilScreen = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { user } = useContext(AuthContext);
  
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loadingPassword, setLoadingPassword] = useState(false);

  const reloadUserData = () => {
    // Función para recargar datos del usuario
    console.log('Recargando datos del usuario...');
    // Aquí iría la lógica para refrescar los datos del contexto
  };

  const handleToggleSection = (sectionId: string) => {
    if (sectionId === 'nuevo-negocio' || sectionId === 'eliminar-cuenta') {
      Alert.alert('Próximamente', 'Esta funcionalidad estará disponible próximamente.');
      return;
    }
    
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  const handlePasswordChange = async () => {
    // Evitar múltiples envíos si ya está cargando
    if (loadingPassword) return;

    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      Alert.alert('Error', 'Todos los campos son obligatorios');
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert('Error', 'Las contraseñas nuevas no coinciden');
      return;
    }
    
    if (passwordData.newPassword.length < 8) {
      Alert.alert('Error', 'La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }
    
    setLoadingPassword(true);
    
    try {
      // Obtener tokens del almacenamiento usando la función helper
      const tokens = await obtenerTokensDelStorage();
      
      if (!tokens) {
        Alert.alert('Error', 'No se encontraron credenciales. Por favor, inicia sesión nuevamente.');
        setLoadingPassword(false);
        return;
      }
      
      const payload: CambiarContrasenaPayload = {
        current_password: passwordData.currentPassword,
        new_password: passwordData.newPassword,
        new_password_confirm: passwordData.confirmPassword
      };
      
      // Llamar a la API
      const response = await cambiarContrasena(tokens, payload);
      
      if (response.success) {
        // Actualizar tokens si la API los devuelve
        if (response.tokens) {
          await guardarTokensEnStorage(response.tokens);
        }
        
        setLoadingPassword(false);
        Alert.alert(
          'Éxito', 
          'Contraseña cambiada correctamente',
          [
            {
              text: 'Aceptar',
              onPress: () => {
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setExpandedSection(null);
                reloadUserData();
              }
            }
          ]
        );
      } else {
        setLoadingPassword(false);
        Alert.alert('Error', response.message);
      }
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      setLoadingPassword(false);
      Alert.alert('Error', 'Ocurrió un error inesperado. Intenta nuevamente.');
    }
  };

  const renderEditableField = (label: string, value: string, onPress: () => void) => (
    <TouchableOpacity style={styles.editableField} onPress={onPress}>
      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
      <View style={styles.fieldRow}>
        <Text style={[styles.fieldValue, { color: colors.text }]}>{value}</Text>
        <Icon name="chevron-forward" size={16} color={colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );

  const userName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : 'Usuario';
  const userEmail = user?.email || 'correo@ejemplo.com';
  const userUsername = user?.username || 'usuario';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primaryDark }]}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.closeButton}
        >
          <Icon name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.white }]}>Mi perfil</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Avatar del usuario */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatarContainer, { borderColor: colors.primary }]}>
            {user?.profile_picture_url ? (
              <Image
                source={{ uri: user.profile_picture_url }}
                style={[styles.avatar, { borderColor: colors.primary }]}
              />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.dark2, borderColor: colors.primary }]}>
                <Icon name="person" size={48} color={colors.textSecondary} />
              </View>
            )}
            {/* Ícono de lapiz para editar */}
            <TouchableOpacity style={[styles.cameraIcon, { backgroundColor: colors.primary }]}>
              <Icon name="pencil" size={16} color={colors.white} />
            </TouchableOpacity>
          </View>
          
          {/* Nombre del usuario */}
          <Text style={[styles.userName, { color: colors.text }]}>{userName}</Text>
        </View>

        {/* Tarjetas desplegables */}
        <View style={styles.accordionsContainer}>
          {/* Datos personales */}
          <AccordionItem
            id="datos-personales"
            title="Datos personales"
            subtitle="Gestiona tu información personal"
            iconName="person"
            isExpanded={expandedSection === 'datos-personales'}
            onToggle={handleToggleSection}
          >
            {renderEditableField('Username', userUsername, () => 
              Alert.alert('Próximamente', 'Edición de username próximamente')
            )}
            {renderEditableField('Nombre y apellido', userName, () =>
              Alert.alert('Próximamente', 'Edición de nombre próximamente')
            )}
            {renderEditableField('Correo electrónico', userEmail, () =>
              Alert.alert('Próximamente', 'Edición de email próximamente')
            )}
          </AccordionItem>

          {/* Contraseña */}
          <AccordionItem
            id="contraseña"
            title="Contraseña"
            subtitle="Cambia tu contraseña"
            iconName="lock-closed"
            isExpanded={expandedSection === 'contraseña'}
            onToggle={handleToggleSection}
          >
            <View style={styles.passwordSection}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Contraseña actual</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: colors.background, color: colors.text }]}
                  secureTextEntry
                  value={passwordData.currentPassword}
                  onChangeText={(text) => setPasswordData(prev => ({ ...prev, currentPassword: text }))}
                  placeholder="Ingresa tu contraseña actual"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Nueva contraseña</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: colors.background, color: colors.text }]}
                  secureTextEntry
                  value={passwordData.newPassword}
                  onChangeText={(text) => setPasswordData(prev => ({ ...prev, newPassword: text }))}
                  placeholder="Ingresa tu nueva contraseña"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Repetir nueva contraseña</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: colors.background, color: colors.text }]}
                  secureTextEntry
                  value={passwordData.confirmPassword}
                  onChangeText={(text) => setPasswordData(prev => ({ ...prev, confirmPassword: text }))}
                  placeholder="Repite tu nueva contraseña"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
              
              <TouchableOpacity
                style={[
                  styles.saveButton, 
                  { 
                    backgroundColor: loadingPassword ? colors.textSecondary : colors.primary,
                    opacity: loadingPassword ? 0.7 : 1
                  }
                ]}
                onPress={handlePasswordChange}
                disabled={loadingPassword}
              >
                {loadingPassword ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={colors.white} />
                    <Text style={[styles.saveButtonText, { color: colors.white, marginLeft: 8 }]}>
                      Guardando...
                    </Text>
                  </View>
                ) : (
                  <Text style={[styles.saveButtonText, { color: colors.white }]}>Guardar cambios</Text>
                )}
              </TouchableOpacity>
            </View>
          </AccordionItem>

          {/* Nuevo negocio */}
          <AccordionItem
            id="nuevo-negocio"
            title="Nuevo negocio"
            subtitle="Súmate a otro negocio de Ordema"
            iconName="storefront"
            isExpanded={false}
            onToggle={handleToggleSection}
            expandable={false}
          >
            <></>
          </AccordionItem>

          {/* Eliminar cuenta */}
          <AccordionItem
            id="eliminar-cuenta"
            title="Eliminar cuenta"
            subtitle="Solicita la baja de tu cuenta"
            iconName="trash"
            isExpanded={false}
            onToggle={handleToggleSection}
            expandable={false}
          >
            <></>
          </AccordionItem>
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
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  closeButton: {
    padding: 4,
    marginRight: 8
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
  },
  accordionsContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  accordionContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  accordionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  accordionHeaderText: {
    flex: 1,
  },
  accordionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  accordionSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  accordionContent: {
    borderTopWidth: 1,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  editableField: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  fieldLabel: {
    fontSize: 12,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldValue: {
    fontSize: 16,
    flex: 1,
  },
  passwordSection: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  textInput: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  saveButton: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default MiPerfilScreen; 