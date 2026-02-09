import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Dimensions, Image } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import LoginModal from '../components/LoginModal';
import OrdemaBackground from '../components/OrdemaBackground';
import { login, seleccionarNegocio } from '../api/auth';
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
      const loginData = await login(username, password);
      
      if (!loginData.success) {
        setLoginError(loginData.message || 'Error al iniciar sesión');
        setLoading(false);
        return;
      }

      const negociosDisponibles = loginData.user.negocios || [];

      if (negociosDisponibles.length === 0) {
        setLoginError('No tienes acceso a ningún negocio');
        setLoading(false);
        return;
      }

      if (negociosDisponibles.length === 1) {
        const primerNegocio = negociosDisponibles[0];
        
        const seleccionData = await seleccionarNegocio(
          primerNegocio.id,
          loginData.tokens.access
        );

        if (!seleccionData.success) {
          setLoginError(seleccionData.message || 'Error al seleccionar negocio');
          setLoading(false);
          return;
        }

        await AsyncStorage.setItem('negocio_id', primerNegocio.id.toString());
        await contextLogin(seleccionData.user, loginData.tokens);
        
        setLoginVisible(false);
      } else {
        await contextLogin(loginData.user, loginData.tokens);
        
        navigation.reset({
          index: 0,
          routes: [
            { 
              name: 'SeleccionarNegocio',
            }
          ],
        });
        
        setLoginVisible(false);
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
          <TouchableOpacity 
            style={[styles.registerButton, { borderColor: colors.primary }]} 
            onPress={() => navigation.navigate('Registro')}
          >
            <Text style={[styles.registerButtonText, { color: colors.white }]}>Registrate</Text>
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
    width: '100%',
    alignItems: 'center',
    marginTop: 100,
    marginBottom: 60,
  },
  logo: {
    width: width * 0.9,
    height: 165,
    maxWidth: 400,
    marginBottom: 60,
    marginTop: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8, 
  },
  title: {
    fontSize: 50,
    fontWeight: 'bold',
    textAlign: 'left',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: 30,
    marginBottom: 30,
    textAlign: 'left',
    fontWeight: '500',
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
    fontStyle: 'italic', 
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 0.3,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerButton: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: 'center',
    marginTop: 12,
    width: '100%',
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LoginScreen;