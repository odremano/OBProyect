import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Dimensions, Image } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import LoginModal from '../components/LoginModal';
import OrdemaBackground from '../components/OrdemaBackground';
import { login } from '../api/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { RootStackParamList } from '../navigation/AppNavigator';

const { width } = Dimensions.get('window');

const LoginScreen: React.FC = () => {
  const [loginVisible, setLoginVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | undefined>(undefined);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { login: contextLogin } = useContext(AuthContext);
  const { colors } = useTheme();

  const handleTabPress = (tabName: string) => {
    if (tabName === 'Más') {
      navigation.navigate('More');
    } else {
      // Para otros tabs que aún no están implementados
      console.log(`Tab pressed: ${tabName}`);
    }
  };

  const handleLogin = async (username: string, password: string) => {
    setLoading(true);
    setLoginError(undefined);
    try {
      const data = await login(username, password);
      if (data.success) {
        // Guarda los tokens en AsyncStorage (ya se hace en AuthContext, esto es redundante)
        // await AsyncStorage.setItem('accessToken', data.tokens.access);
        // await AsyncStorage.setItem('refreshToken', data.tokens.refresh);
        
        // ✅ Actualiza el AuthContext - ahora usa solo user.negocio como fuente única
        // ❌ ANTES: await contextLogin(data.user, data.tokens, data.negocio);
        // ✅ DESPUÉS: Remover el tercer parámetro
        await contextLogin(data.user, data.tokens);
        
        setLoginVisible(false);
      } else {
        setLoginError(data.message || 'Error al iniciar sesión');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Error de red');
    } finally {
      setLoading(false);
    }
  };

  return (
    <OrdemaBackground>
      <View style={[styles.container, { backgroundColor: 'transparent' }]}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={styles.content}>
          <Image 
            source={require('../../assets/logo.png')} 
            style={styles.logo} 
            resizeMode="contain" 
          />
          <Text style={[styles.title, { color: colors.brand }]}>Bienvenido/a</Text>
          <Text style={[styles.subtitle, { color: colors.brand }]}>al Gestor de Turnos</Text>
          <Text style={[styles.ordemaText, { color: colors.white }]}>Ordema</Text>
          <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={() => setLoginVisible(true)}>
            <Text style={[styles.buttonText, { color: colors.white }]}>Ingresá a tu usuario</Text>
          </TouchableOpacity>
        </View>
        <LoginModal
          visible={loginVisible}
          onClose={() => setLoginVisible(false)}
          onLogin={handleLogin}
          loading={loading}
          error={loginError}
        />
      </View>
    </OrdemaBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    paddingHorizontal: 24,
    paddingBottom: 80,
    width: '100%',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  logo: {
    width: 380,
    height: 165,
    marginBottom: 45,
    marginTop: 80,
    marginLeft: -15,
    // Sombra mejorada para el logo
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8, // Para Android
  },
  title: {
    fontSize: 50,
    fontWeight: 'bold',
    textAlign: 'left',
    // Agregar sombra para mejor legibilidad sobre el fondo
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: 30,
    marginBottom: 30,
    textAlign: 'left',
    fontWeight: '500',
    // Agregar sombra para mejor legibilidad sobre el fondo
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  ordemaText: {
    fontSize: 44,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: -25,
    textAlign: 'left',
    fontStyle: 'italic', // ← Agregar esta línea para cursiva
    // Agregar sombra para mejor legibilidad sobre el fondo
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: 'center',
    marginTop: 8,
    width: '100%',
    // Agregar sombra para mejor definición sobre el fondo
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    // Agregar un borde sutil para mejor definición
    borderWidth: 0.3,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LoginScreen;