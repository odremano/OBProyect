import React, { useState, useContext } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, StatusBar, Dimensions } from 'react-native';
import colors from '../theme/colors';
// import BottomNavBar from '../components/BottomNavBar';
import LoginModal from '../components/LoginModal';
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
        // Guarda los tokens en AsyncStorage
        await AsyncStorage.setItem('accessToken', data.tokens.access);
        await AsyncStorage.setItem('refreshToken', data.tokens.refresh);
        
        // Actualiza el AuthContext - esto triggereará la navegación automática
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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <View style={styles.content}>
        <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>Bienvenido/a</Text>
        <Text style={styles.subtitle}>al Gestor de Turnos{"\n"}OdremanBarber</Text>
        <TouchableOpacity style={styles.button} onPress={() => setLoginVisible(true)}>
          <Text style={styles.buttonText}>Ingresar</Text>
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
    backgroundColor: colors.background,
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
  logo: {
    width: 330,
    height: 71,
    marginBottom: 150,
    marginTop: 100,
  },
  title: {
    color: colors.white,
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'left',
  },
  subtitle: {
    color: colors.dark3,
    fontSize: 20,
    marginBottom: 40,
    textAlign: 'left',
    fontWeight: '500',
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 40,
    alignItems: 'center',
    marginTop: 8,
    width: '100%',
    maxWidth: 340,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LoginScreen;