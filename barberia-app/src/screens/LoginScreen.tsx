import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Dimensions } from 'react-native';
import { useTheme } from '../context/ThemeContext';
// import BottomNavBar from '../components/BottomNavBar';
import LoginModal from '../components/LoginModal';
import DynamicLogo from '../components/DynamicLogo';
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
        
        // Actualiza el AuthContext - esto triggereará la navegación automática
        // Pasar el objeto negocio para que se carguen los colores dinámicos
        await contextLogin(data.user, data.tokens, data.negocio);
        
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <View style={styles.content}>
        <DynamicLogo style={styles.logo} resizeMode="contain" />
        <Text style={[styles.title, { color: colors.text }]}>Bienvenido/a</Text>
        <Text style={[styles.subtitle, { color: colors.dark3 }]}>al Gestor de Turnos{"\n"}ORDEMA</Text>
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
    width: 330,
    height: 80,
    marginBottom: 120,
    marginTop: 100,
    marginLeft: 10
  },
  logo1: {
    width: 330,
    height: 250,
    marginBottom: 12,
    marginTop: 60,
    marginLeft: 10
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'left',
  },
  subtitle: {
    fontSize: 20,
    marginBottom: 40,
    textAlign: 'left',
    fontWeight: '500',
  },
  button: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 40,
    alignItems: 'center',
    marginTop: 8,
    width: '100%',
    maxWidth: 340,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LoginScreen;