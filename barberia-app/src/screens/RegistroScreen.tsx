import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  registro,
  listarNegocios,
  seleccionarNegocio,
  NegocioPublico,
  RegistroData,
} from '../api/auth';

const { width } = Dimensions.get('window');

// Paso del formulario
type RegistroStep = 'datos' | 'negocio';

const RegistroScreen: React.FC = () => {
  const { colors } = useTheme();
  const { login: contextLogin } = useContext(AuthContext);
  const { showBanner } = useNotification();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  // Estado del paso actual
  const [step, setStep] = useState<RegistroStep>('datos');
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Estados del formulario de datos
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  // Estados de validación
  const [touched, setTouched] = useState({
    nombreCompleto: false,
    email: false,
    username: false,
    password: false,
    passwordConfirm: false,
  });

  // Estados de negocios
  const [negocios, setNegocios] = useState<NegocioPublico[]>([]);
  const [negocioSeleccionado, setNegocioSeleccionado] = useState<NegocioPublico | null>(null);
  const [busquedaNegocio, setBusquedaNegocio] = useState('');
  const [loadingNegocios, setLoadingNegocios] = useState(false);

  // Estados generales
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar negocios al inicio
  useEffect(() => {
    cargarNegocios();
  }, []);

  const cargarNegocios = async () => {
    setLoadingNegocios(true);
    try {
      const resultado = await listarNegocios();
      if (resultado.success) {
        setNegocios(resultado.negocios);
      } else {
        showBanner('error', 'Error', 'No se pudieron cargar los negocios disponibles');
      }
    } catch (err) {
      showBanner('error', 'Error', 'Error de conexión al cargar negocios');
    } finally {
      setLoadingNegocios(false);
    }
  };

  // Filtrar negocios por búsqueda
  const negociosFiltrados = negocios.filter((negocio) =>
    negocio.nombre.toLowerCase().includes(busquedaNegocio.toLowerCase())
  );

  // Validaciones
  const validarEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const validarDatos = (): boolean => {
    if (!nombreCompleto.trim()) {
      setError('El nombre completo es obligatorio');
      return false;
    }
    if (!email.trim() || !validarEmail(email)) {
      setError('Ingresa un email válido');
      return false;
    }
    if (!username.trim() || username.length < 3) {
      setError('El usuario debe tener al menos 3 caracteres');
      return false;
    }
    if (!password || password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return false;
    }
    if (password !== passwordConfirm) {
      setError('Las contraseñas no coinciden');
      return false;
    }
    setError(null);
    return true;
  };

  // Navegación entre pasos con animación
  const irANegocio = () => {
    setTouched({
      nombreCompleto: true,
      email: true,
      username: true,
      password: true,
      passwordConfirm: true,
    });

    if (!validarDatos()) return;

    Animated.timing(slideAnim, {
      toValue: -width,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setStep('negocio');
    });
  };

  const volverADatos = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setStep('datos');
    });
  };

  // Separar nombre completo en first_name y last_name
  const separarNombre = (nombreCompleto: string) => {
    const partes = nombreCompleto.trim().split(' ').filter(Boolean);
    if (partes.length === 0) return { first_name: '', last_name: '' };
    if (partes.length === 1) return { first_name: partes[0], last_name: '' };
    return {
      first_name: partes[0],
      last_name: partes.slice(1).join(' '),
    };
  };

  // Realizar registro
  const handleRegistro = async () => {
    if (!negocioSeleccionado) {
      showBanner('warning', 'Atención', 'Debes seleccionar un negocio para continuar');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { first_name, last_name } = separarNombre(nombreCompleto);

      const datosRegistro: RegistroData = {
        username: username.toLowerCase().trim(),
        email: email.trim(),
        first_name,
        last_name,
        phone_number: telefono.trim() || undefined,
        password,
        password_confirm: passwordConfirm,
      };

      // Registrar usuario con el negocio seleccionado
      const resultadoRegistro = await registro(datosRegistro, negocioSeleccionado.id);

      if (!resultadoRegistro.success) {
        setError(resultadoRegistro.message);
        setLoading(false);
        return;
      }

      // Seleccionar el negocio para obtener datos completos
      const resultadoSeleccion = await seleccionarNegocio(
        negocioSeleccionado.id,
        resultadoRegistro.tokens.access
      );

      if (!resultadoSeleccion.success) {
        // Aunque falló la selección, el usuario está registrado
        // Lo enviamos a seleccionar negocio
        await contextLogin(resultadoRegistro.user, resultadoRegistro.tokens);
        showBanner('success', 'Registro exitoso', 'Por favor, selecciona tu negocio');
        navigation.reset({
          index: 0,
          routes: [{ name: 'SeleccionarNegocio' }],
        });
        return;
      }

      // Login exitoso con todo configurado
      await AsyncStorage.setItem('negocio_id', negocioSeleccionado.id.toString());
      await contextLogin(resultadoSeleccion.user, resultadoRegistro.tokens);

      showBanner(
        'success',
        'Registro exitoso',
        `Bienvenido/a a ${negocioSeleccionado.nombre}`
      );

      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    } catch (err: any) {
      setError(err.message || 'Error al procesar el registro');
    } finally {
      setLoading(false);
    }
  };

  const renderPasoDatos = () => (
    <Animated.View
      style={[
        styles.stepContainer,
        { transform: [{ translateX: slideAnim }] },
      ]}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.stepTitle, { color: colors.text }]}>
          Crear cuenta
        </Text>
        <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
          Completa tus datos para registrarte
        </Text>

        {/* Nombre completo */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>
            Nombre completo *
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.dark2,
                borderColor: touched.nombreCompleto && !nombreCompleto.trim() ? colors.error : colors.dark3,
                color: colors.text,
              },
            ]}
            placeholder="Ej: Juan Pérez"
            placeholderTextColor={colors.textSecondary}
            value={nombreCompleto}
            onChangeText={setNombreCompleto}
            autoCapitalize="words"
            onBlur={() => setTouched((t) => ({ ...t, nombreCompleto: true }))}
          />
        </View>

        {/* Email */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>
            Correo electrónico *
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.dark2,
                borderColor: touched.email && (!email.trim() || !validarEmail(email)) ? colors.error : colors.dark3,
                color: colors.text,
              },
            ]}
            placeholder="tucorreo@ejemplo.com"
            placeholderTextColor={colors.textSecondary}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
          />
        </View>

        {/* Teléfono (opcional) */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>
            Teléfono <Text style={{ color: colors.textSecondary }}>(opcional)</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.dark2,
                borderColor: colors.dark3,
                color: colors.text,
              },
            ]}
            placeholder="+54 9 11 1234-5678"
            placeholderTextColor={colors.textSecondary}
            value={telefono}
            onChangeText={setTelefono}
            keyboardType="phone-pad"
          />
        </View>

        {/* Usuario */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>
            Nombre de usuario *
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.dark2,
                borderColor: touched.username && (!username.trim() || username.length < 3) ? colors.error : colors.dark3,
                color: colors.text,
              },
            ]}
            placeholder="juanperez"
            placeholderTextColor={colors.textSecondary}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            onBlur={() => setTouched((t) => ({ ...t, username: true }))}
          />
          <Text style={[styles.inputHint, { color: colors.textSecondary }]}>
            Mínimo 3 caracteres, sin espacios
          </Text>
        </View>

        {/* Contraseña */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>
            Contraseña *
          </Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[
                styles.passwordInput,
                {
                  backgroundColor: colors.dark2,
                  borderColor: touched.password && (!password || password.length < 8) ? colors.error : colors.dark3,
                  color: colors.text,
                },
              ]}
              placeholder="Mínimo 8 caracteres"
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? 'eye-off' : 'eye'}
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Confirmar contraseña */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>
            Confirmar contraseña *
          </Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[
                styles.passwordInput,
                {
                  backgroundColor: colors.dark2,
                  borderColor:
                    touched.passwordConfirm && password !== passwordConfirm
                      ? colors.error
                      : colors.dark3,
                  color: colors.text,
                },
              ]}
              placeholder="Repite tu contraseña"
              placeholderTextColor={colors.textSecondary}
              value={passwordConfirm}
              onChangeText={setPasswordConfirm}
              secureTextEntry={!showPasswordConfirm}
              autoCapitalize="none"
              autoCorrect={false}
              onBlur={() => setTouched((t) => ({ ...t, passwordConfirm: true }))}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPasswordConfirm(!showPasswordConfirm)}
            >
              <Ionicons
                name={showPasswordConfirm ? 'eye-off' : 'eye'}
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Error */}
        {error && step === 'datos' && (
          <View style={[styles.errorContainer, { backgroundColor: `${colors.error}20` }]}>
            <Ionicons name="alert-circle" size={20} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          </View>
        )}

        {/* Botón continuar */}
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          onPress={irANegocio}
        >
          <Text style={[styles.primaryButtonText, { color: colors.white }]}>
            Continuar
          </Text>
          <Ionicons name="arrow-forward" size={20} color={colors.white} />
        </TouchableOpacity>

        {/* Link a login */}
        <View style={styles.loginLinkContainer}>
          <Text style={[styles.loginLinkText, { color: colors.textSecondary }]}>
            ¿Ya tenés cuenta?{' '}
          </Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={[styles.loginLink, { color: colors.primary }]}>
              Iniciá sesión
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Animated.View>
  );

  const renderPasoNegocio = () => (
    <Animated.View
      style={[
        styles.stepContainer,
        styles.stepContainerNegocio,
        { transform: [{ translateX: Animated.add(slideAnim, width) }] },
      ]}
    >
      <Text style={[styles.stepTitle, { color: colors.text }]}>
        Selecciona un negocio
      </Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
        Elige el negocio donde deseas reservar turnos
      </Text>

      {/* Buscador */}
      <View
        style={[
          styles.searchContainer,
          { backgroundColor: colors.dark2, borderColor: colors.dark3 },
        ]}
      >
        <Ionicons name="search" size={20} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Buscar negocio..."
          placeholderTextColor={colors.textSecondary}
          value={busquedaNegocio}
          onChangeText={setBusquedaNegocio}
        />
        {busquedaNegocio.length > 0 && (
          <TouchableOpacity onPress={() => setBusquedaNegocio('')}>
            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Lista de negocios */}
      {loadingNegocios ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Cargando negocios...
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.negociosScrollView}
          contentContainerStyle={styles.negociosContent}
          showsVerticalScrollIndicator={false}
        >
          {negociosFiltrados.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="business-outline" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No se encontraron negocios
              </Text>
            </View>
          ) : (
            negociosFiltrados.map((negocio) => (
              <TouchableOpacity
                key={negocio.id}
                style={[
                  styles.negocioItem,
                  {
                    backgroundColor: colors.dark2,
                    borderColor:
                      negocioSeleccionado?.id === negocio.id
                        ? colors.primary
                        : colors.dark3,
                    borderWidth: negocioSeleccionado?.id === negocio.id ? 2 : 1,
                  },
                ]}
                onPress={() => setNegocioSeleccionado(negocio)}
              >
                <View style={styles.negocioInfo}>
                  <View
                    style={[
                      styles.negocioIcon,
                      { backgroundColor: `${colors.primary}30` },
                    ]}
                  >
                    <Ionicons name="business" size={24} color={colors.primary} />
                  </View>
                  <View style={styles.negocioTexts}>
                    <Text style={[styles.negocioNombre, { color: colors.text }]}>
                      {negocio.nombre}
                    </Text>
                    {negocio.address && (
                      <Text
                        style={[styles.negocioDireccion, { color: colors.textSecondary }]}
                        numberOfLines={1}
                      >
                        {negocio.address}
                      </Text>
                    )}
                  </View>
                </View>
                {negocioSeleccionado?.id === negocio.id && (
                  <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}

      {/* Error */}
      {error && step === 'negocio' && (
        <View style={[styles.errorContainer, { backgroundColor: `${colors.error}20` }]}>
          <Ionicons name="alert-circle" size={20} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        </View>
      )}

      {/* Botón registrar */}
      <View style={styles.bottomButtons}>
        <TouchableOpacity
          style={[
            styles.primaryButton,
            {
              backgroundColor: negocioSeleccionado ? colors.primary : colors.dark3,
              opacity: loading ? 0.7 : 1,
            },
          ]}
          onPress={handleRegistro}
          disabled={!negocioSeleccionado || loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Text style={[styles.primaryButtonText, { color: colors.white }]}>
                Crear cuenta
              </Text>
              <Ionicons name="checkmark" size={20} color={colors.white} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primaryDark} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primaryDark }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={step === 'datos' ? () => navigation.goBack() : volverADatos}
        >
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.white }]}>
          {step === 'datos' ? 'Registro' : 'Seleccionar negocio'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Indicador de pasos */}
      <View style={[styles.stepsIndicator, { backgroundColor: colors.background }]}>
        <View style={styles.stepsRow}>
          <View
            style={[
              styles.stepDot,
              { backgroundColor: colors.primary },
            ]}
          >
            <Text style={[styles.stepDotText, { color: colors.white }]}>1</Text>
          </View>
          <View
            style={[
              styles.stepLine,
              { backgroundColor: step === 'negocio' ? colors.primary : colors.dark3 },
            ]}
          />
          <View
            style={[
              styles.stepDot,
              {
                backgroundColor: step === 'negocio' ? colors.primary : colors.dark3,
              },
            ]}
          >
            <Text style={[styles.stepDotText, { color: colors.white }]}>2</Text>
          </View>
        </View>
        <View style={styles.stepsLabels}>
          <Text style={[styles.stepLabel, { color: colors.text }]}>Datos</Text>
          <Text
            style={[
              styles.stepLabel,
              { color: step === 'negocio' ? colors.text : colors.textSecondary },
            ]}
          >
            Negocio
          </Text>
        </View>
      </View>

      {/* Contenido */}
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.stepsWrapper}>
          {renderPasoDatos()}
          {renderPasoNegocio()}
        </View>
      </KeyboardAvoidingView>
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
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 40,
  },
  stepsIndicator: {
    paddingHorizontal: 48,
    paddingVertical: 16,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotText: {
    fontSize: 14,
    fontWeight: '600',
  },
  stepLine: {
    flex: 1,
    height: 3,
    marginHorizontal: 8,
    borderRadius: 2,
  },
  stepsLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  stepsWrapper: {
    flex: 1,
    flexDirection: 'row',
  },
  stepContainer: {
    width: width,
    paddingHorizontal: 24,
  },
  stepContainerNegocio: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    fontSize: 16,
  },
  inputHint: {
    fontSize: 12,
    marginTop: 4,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    borderRadius: 12,
    padding: 16,
    paddingRight: 50,
    borderWidth: 1,
    fontSize: 16,
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginLinkText: {
    fontSize: 14,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Estilos para paso de negocio
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  negociosScrollView: {
    flex: 1,
  },
  negociosContent: {
    paddingBottom: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
  },
  negocioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  negocioInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  negocioIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  negocioTexts: {
    flex: 1,
  },
  negocioNombre: {
    fontSize: 16,
    fontWeight: '600',
  },
  negocioDireccion: {
    fontSize: 13,
    marginTop: 2,
  },
  bottomButtons: {
    paddingVertical: 16,
  },
});

export default RegistroScreen;
