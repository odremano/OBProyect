import React, { useState, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView, // ✅ Agregar import
  Platform // ✅ Agregar import
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { cambiarContrasena, CambiarContrasenaPayload, obtenerTokensDelStorage, guardarTokensEnStorage, actualizarPerfil } from '../api/perfil';
import { Tokens } from '../api/auth';
import { useNotifications } from '../hooks/useNotifications';

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
    <View style={styles.accordionContainer}>
      <TouchableOpacity
        style={[styles.accordionHeader, { backgroundColor: colors.dark2 }]}
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
            color={colors.dark3} 
          />
        )}
      </TouchableOpacity>
      
      {isExpanded && expandable && (
        <View style={[styles.accordionContent, { backgroundColor: colors.dark2, borderTopColor: colors.dark3 }]}>
          {children}
        </View>
      )}
    </View>
  );
};


const MiPerfilScreen = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<NavigationProp>();
<<<<<<< HEAD
  const { user, logout } = useContext(AuthContext);
=======
  const { user, logout, updateUser } = useContext(AuthContext);
>>>>>>> development
  const { showSuccess, showError, showInfo } = useNotifications();
  
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneValue, setPhoneValue] = useState<string>('');
  const [loadingPhone, setLoadingPhone] = useState(false);
  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameValue, setUsernameValue] = useState<string>('');
  const [loadingUsername, setLoadingUsername] = useState(false);
  const [editingNames, setEditingNames] = useState(false);
  const [firstNameValue, setFirstNameValue] = useState<string>('');
  const [lastNameValue, setLastNameValue] = useState<string>('');
  const [loadingNames, setLoadingNames] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [emailValue, setEmailValue] = useState<string>('');
  const [loadingEmail, setLoadingEmail] = useState(false);
  
  // ✅ Estados para mostrar/ocultar contraseñas
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const reloadUserData = () => {
    // Función para recargar datos del usuario
    console.log('Recargando datos del usuario...');
    // Aquí iría la lógica para refrescar los datos del contexto
  };

  const handleToggleSection = (sectionId: string) => {
    if (sectionId === 'nuevo-negocio' || sectionId === 'eliminar-cuenta') {
      showInfo('Próximamente', 'Esta funcionalidad estará disponible próximamente.');
      return;
    }
    
    const next = expandedSection === sectionId ? null : sectionId;
    setExpandedSection(next);
    // Cerrar formularios inline si se colapsa o cambia de sección
    if (next !== 'datos-personales') {
      setEditingUsername(false);
      setEditingNames(false);
      setEditingEmail(false);
      setEditingPhone(false);
    }
  };

  const startEditPhone = () => {
    setExpandedSection('datos-personales');
    if (editingPhone) {
      setEditingPhone(false);
      return;
    }
    setEditingUsername(false);
    setEditingNames(false);
    setEditingEmail(false);
    setEditingPhone(true);
    setPhoneValue(user?.phone_number || '');
  };

  const cancelEditPhone = () => {
    setEditingPhone(false);
    setPhoneValue('');
  };

  const handleSavePhone = async () => {
    if (loadingPhone) return;
    const trimmed = (phoneValue || '').trim();
    if (!trimmed) {
      showError('Error', 'El teléfono no puede estar vacío');
      return;
    }
    if (trimmed.length < 6) {
      showError('Error', 'Ingresa un teléfono válido');
      return;
    }
    setLoadingPhone(true);
    try {
      const tokens = await obtenerTokensDelStorage();
      if (!tokens) {
        showError('Error', 'No se encontraron credenciales. Inicia sesión nuevamente.');
        setLoadingPhone(false);
        return;
      }
      const response = await actualizarPerfil(tokens, { phone_number: trimmed });
      if (response.success) {
        await updateUser(response.user);
        setEditingPhone(false);
        showSuccess('Datos actualizados', 'Teléfono actualizado correctamente');
      } else {
        showError('Error', response.message);
      }
    } catch (e) {
      showError('Error', 'No se pudo actualizar el teléfono.');
    } finally {
      setLoadingPhone(false);
    }
  };

  const startEditUsername = () => {
    setExpandedSection('datos-personales');
    if (editingUsername) {
      setEditingUsername(false);
      return;
    }
    setEditingPhone(false);
    setEditingNames(false);
    setEditingEmail(false);
    setEditingUsername(true);
    setUsernameValue(user?.username || '');
  };

  const cancelEditUsername = () => {
    setEditingUsername(false);
    setUsernameValue('');
  };

  const handleSaveUsername = async () => {
    if (loadingUsername) return;
    const trimmed = (usernameValue || '').trim();
    if (!trimmed || trimmed.length < 3) {
      showError('Error', 'El username debe tener al menos 3 caracteres');
      return;
    }
    setLoadingUsername(true);
    try {
      const tokens = await obtenerTokensDelStorage();
      if (!tokens) {
        showError('Error', 'No se encontraron credenciales. Inicia sesión nuevamente.');
        setLoadingUsername(false);
        return;
      }
      const response = await actualizarPerfil(tokens, { username: trimmed });
      if (response.success) {
        await updateUser(response.user);
        setEditingUsername(false);
        showSuccess('Datos actualizados', 'Username actualizado correctamente');
      } else {
        showError('Error', response.message);
      }
    } catch (e) {
      showError('Error', 'No se pudo actualizar el username.');
    } finally {
      setLoadingUsername(false);
    }
  };

  const startEditNames = () => {
    setExpandedSection('datos-personales');
    if (editingNames) {
      setEditingNames(false);
      return;
    }
    setEditingPhone(false);
    setEditingUsername(false);
    setEditingEmail(false);
    setEditingNames(true);
    setFirstNameValue(user?.first_name || '');
    setLastNameValue(user?.last_name || '');
  };

  const cancelEditNames = () => {
    setEditingNames(false);
    setFirstNameValue('');
    setLastNameValue('');
  };

  const handleSaveNames = async () => {
    if (loadingNames) return;
    const fn = (firstNameValue || '').trim();
    const ln = (lastNameValue || '').trim();
    if (!fn || !ln) {
      showError('Error', 'Nombre y apellido son obligatorios');
      return;
    }
    setLoadingNames(true);
    try {
      const tokens = await obtenerTokensDelStorage();
      if (!tokens) {
        showError('Error', 'No se encontraron credenciales. Inicia sesión nuevamente.');
        setLoadingNames(false);
        return;
      }
      const response = await actualizarPerfil(tokens, { first_name: fn, last_name: ln });
      if (response.success) {
        await updateUser(response.user);
        setEditingNames(false);
        showSuccess('Datos actualizados', 'Nombre y apellido actualizados');
      } else {
        showError('Error', response.message);
      }
    } catch (e) {
      showError('Error', 'No se pudo actualizar el nombre.');
    } finally {
      setLoadingNames(false);
    }
  };

  const startEditEmail = () => {
    setExpandedSection('datos-personales');
    if (editingEmail) {
      setEditingEmail(false);
      return;
    }
    setEditingPhone(false);
    setEditingUsername(false);
    setEditingNames(false);
    setEditingEmail(true);
    setEmailValue(user?.email || '');
  };

  const cancelEditEmail = () => {
    setEditingEmail(false);
    setEmailValue('');
  };

  const handleSaveEmail = async () => {
    if (loadingEmail) return;
    const trimmed = (emailValue || '').trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      showError('Error', 'Ingresa un correo válido');
      return;
    }
    setLoadingEmail(true);
    try {
      const tokens = await obtenerTokensDelStorage();
      if (!tokens) {
        showError('Error', 'No se encontraron credenciales. Inicia sesión nuevamente.');
        setLoadingEmail(false);
        return;
      }
      const response = await actualizarPerfil(tokens, { email: trimmed });
      if (response.success) {
        await updateUser(response.user);
        setEditingEmail(false);
        showSuccess('Datos actualizados', 'Correo actualizado correctamente');
      } else {
        showError('Error', response.message);
      }
    } catch (e) {
      showError('Error', 'No se pudo actualizar el correo.');
    } finally {
      setLoadingEmail(false);
    }
  };

  const handlePasswordChange = async () => {
    // Evitar múltiples envíos si ya está cargando
    if (loadingPassword) return;

    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      showError('Error', 'Todos los campos son obligatorios');
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showError('Error', 'Las contraseñas nuevas no coinciden');
      return;
    }
    
    if (passwordData.newPassword.length < 8) {
      showError('Error', 'La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }
    
    setLoadingPassword(true);
    
    try {
      // Obtener tokens del almacenamiento usando la función helper
      const tokens = await obtenerTokensDelStorage();
      
      if (!tokens) {
        showError('Error', 'No se encontraron credenciales. Por favor, inicia sesión nuevamente.');
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
        
        // Limpiar formulario
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setExpandedSection(null);
        
        // ✅ Redirección inmediata a Home
        navigation.navigate('MainTabs' as any);
        
        // ✅ Logout después de un delay corto
        setTimeout(async () => {
          await logout();
          
          // ✅ Un solo banner con título y descripción
          setTimeout(() => {
            showSuccess('Cambio de contraseña exitoso', 'Su sesión ha finalizado por seguridad.');
          }, 500);
        }, 1000);
        
      } else {
        setLoadingPassword(false);
        showError('Error', response.message);
      }
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      setLoadingPassword(false);
      showError('Error', 'Ocurrió un error inesperado. Intenta nuevamente.');
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

  // ✅ Componente para input de contraseña con ojo
  const renderPasswordInput = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    showPassword: boolean,
    setShowPassword: (show: boolean) => void,
    placeholder: string
  ) => (
    <View style={styles.inputGroup}>
      <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{label}</Text>
      <View style={styles.passwordInputContainer}>
        <TextInput
          style={[styles.passwordTextInput, { backgroundColor: colors.background, color: colors.text }]}
          secureTextEntry={!showPassword}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
        />
        <TouchableOpacity
          style={styles.eyeButton}
          onPress={() => setShowPassword(!showPassword)}
          activeOpacity={0.7}
        >
          <Icon 
            name={showPassword ? "eye-off" : "eye"} 
            size={20} 
            color={colors.textSecondary} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  const userName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : 'Usuario';
  const userEmail = user?.email || 'correo@ejemplo.com';
  const userUsername = user?.username || 'usuario';
  const userPhone = user?.phone_number || 'Sin teléfono';

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
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
        keyboardShouldPersistTaps="handled" // ✅ Permitir taps mientras el teclado está abierto
        keyboardDismissMode="interactive" // ✅ Cerrar teclado al hacer scroll
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
            subtitle="Gestioná tu información personal"
            iconName="person"
            isExpanded={expandedSection === 'datos-personales'}
            onToggle={handleToggleSection}
          >
<<<<<<< HEAD
            {renderEditableField('Username', userUsername, () => 
              showInfo('Próximamente', 'Edición de username próximamente')
            )}
            {renderEditableField('Nombre y apellido', userName, () =>
              showInfo('Próximamente', 'Edición de nombre próximamente')
            )}
            {renderEditableField('Correo electrónico', userEmail, () =>
              showInfo('Próximamente', 'Edición de email próximamente')
=======
            {renderEditableField('Username', userUsername, startEditUsername)}
            {editingUsername && (
              <View style={{ gap: 8, paddingTop: 8 }}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Nuevo username</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: colors.background, color: colors.text }]}
                  value={usernameValue}
                  onChangeText={setUsernameValue}
                  placeholder="Ingresa tu username"
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="none"
                />
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={[styles.secondaryButton, { borderColor: colors.dark3 }]}
                    onPress={cancelEditUsername}
                    disabled={loadingUsername}
                  >
                    <Text style={[styles.secondaryButtonText, { color: colors.textSecondary }]}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: colors.success, flex: 1, opacity: loadingUsername ? 0.7 : 1 }]}
                    onPress={handleSaveUsername}
                    disabled={loadingUsername}
                  >
                    {loadingUsername ? (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color={colors.white} />
                        <Text style={[styles.saveButtonText, { color: colors.white, marginLeft: 8 }]}>Guardando...</Text>
                      </View>
                    ) : (
                      <Text style={[styles.saveButtonText, { color: colors.white }]}>Guardar</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
            {renderEditableField('Nombre y apellido', userName, startEditNames)}
            {editingNames && (
              <View style={{ gap: 8, paddingTop: 8 }}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Nombre</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: colors.background, color: colors.text }]}
                  value={firstNameValue}
                  onChangeText={setFirstNameValue}
                  placeholder="Ingresa tu nombre"
                  placeholderTextColor={colors.textSecondary}
                />
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Apellido</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: colors.background, color: colors.text }]}
                  value={lastNameValue}
                  onChangeText={setLastNameValue}
                  placeholder="Ingresa tu apellido"
                  placeholderTextColor={colors.textSecondary}
                />
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={[styles.secondaryButton, { borderColor: colors.dark3 }]}
                    onPress={cancelEditNames}
                    disabled={loadingNames}
                  >
                    <Text style={[styles.secondaryButtonText, { color: colors.textSecondary }]}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: colors.success, flex: 1, opacity: loadingNames ? 0.7 : 1 }]}
                    onPress={handleSaveNames}
                    disabled={loadingNames}
                  >
                    {loadingNames ? (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color={colors.white} />
                        <Text style={[styles.saveButtonText, { color: colors.white, marginLeft: 8 }]}>Guardando...</Text>
                      </View>
                    ) : (
                      <Text style={[styles.saveButtonText, { color: colors.white }]}>Guardar</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
            {renderEditableField('Correo electrónico', userEmail, startEditEmail)}
            {editingEmail && (
              <View style={{ gap: 8, paddingTop: 8 }}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Nuevo correo</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: colors.background, color: colors.text }]}
                  value={emailValue}
                  onChangeText={setEmailValue}
                  placeholder="Ingresa tu correo"
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={[styles.secondaryButton, { borderColor: colors.dark3 }]}
                    onPress={cancelEditEmail}
                    disabled={loadingEmail}
                  >
                    <Text style={[styles.secondaryButtonText, { color: colors.textSecondary }]}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: colors.success, flex: 1, opacity: loadingEmail ? 0.7 : 1 }]}
                    onPress={handleSaveEmail}
                    disabled={loadingEmail}
                  >
                    {loadingEmail ? (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color={colors.white} />
                        <Text style={[styles.saveButtonText, { color: colors.white, marginLeft: 8 }]}>Guardando...</Text>
                      </View>
                    ) : (
                      <Text style={[styles.saveButtonText, { color: colors.white }]}>Guardar</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
            {renderEditableField('Teléfono', userPhone, startEditPhone)}
            {editingPhone && (
              <View style={{ gap: 8, paddingTop: 8 }}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Nuevo teléfono</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: colors.background, color: colors.text }]}
                  value={phoneValue}
                  onChangeText={setPhoneValue}
                  placeholder="Ingresa tu teléfono"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="phone-pad"
                />
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={[styles.secondaryButton, { borderColor: colors.dark3 }]}
                    onPress={cancelEditPhone}
                    disabled={loadingPhone}
                  >
                    <Text style={[styles.secondaryButtonText, { color: colors.textSecondary }]}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: colors.success, flex: 1, opacity: loadingPhone ? 0.7 : 1 }]}
                    onPress={handleSavePhone}
                    disabled={loadingPhone}
                  >
                    {loadingPhone ? (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color={colors.white} />
                        <Text style={[styles.saveButtonText, { color: colors.white, marginLeft: 8 }]}>Guardando...</Text>
                      </View>
                    ) : (
                      <Text style={[styles.saveButtonText, { color: colors.white }]}>Guardar</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
>>>>>>> development
            )}
          </AccordionItem>

          {/* Contraseña */}
          <AccordionItem
            id="contraseña"
            title="Contraseña"
            subtitle="Cambiá tu contraseña"
            iconName="lock-closed"
            isExpanded={expandedSection === 'contraseña'}
            onToggle={handleToggleSection}
          >
            <View style={styles.passwordSection}>
              {/* ✅ Contraseña actual con ojo */}
              {renderPasswordInput(
                'Contraseña actual',
                passwordData.currentPassword,
                (text) => setPasswordData(prev => ({ ...prev, currentPassword: text })),
                showCurrentPassword,
                setShowCurrentPassword,
                'Ingresá tu contraseña actual'
              )}
              
              {/* ✅ Nueva contraseña con ojo */}
              {renderPasswordInput(
                'Nueva contraseña',
                passwordData.newPassword,
                (text) => setPasswordData(prev => ({ ...prev, newPassword: text })),
                showNewPassword,
                setShowNewPassword,
                'Ingresá tu nueva contraseña'
              )}
              
              {/* ✅ Confirmar contraseña con ojo */}
              {renderPasswordInput(
                'Repetir nueva contraseña',
                passwordData.confirmPassword,
                (text) => setPasswordData(prev => ({ ...prev, confirmPassword: text })),
                showConfirmPassword,
                setShowConfirmPassword,
                'Repite tu nueva contraseña'
              )}
              
              <TouchableOpacity
                style={[
                  styles.saveButton, 
                  { 
                    backgroundColor: loadingPassword ? colors.success : colors.success,
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
    </KeyboardAvoidingView>
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
    paddingBottom: 100, // ✅ Aumentar padding bottom para espacio extra
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 8,
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
  
  // ✅ Actualizar estilos de campos editables para consistencia
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
  
  // ✅ Actualizar estilos de inputs de contraseña
  passwordInputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordTextInput: {
    flex: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingRight: 50,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    padding: 8,
    borderRadius: 20,
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
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default MiPerfilScreen; 