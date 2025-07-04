import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  ActivityIndicator,
  Animated,
  PanResponder,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback
} from 'react-native';
import colors from '../theme/colors';

const SCREEN_HEIGHT = Dimensions.get('window').height;

interface LoginModalProps {
  visible: boolean;
  onClose: () => void;
  onLogin: (username: string, password: string) => Promise<void>;
  loading: boolean;
  error?: string;
}

const LoginModal: React.FC<LoginModalProps> = ({ visible, onClose, onLogin, loading, error }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState({ username: false, password: false });
  const [localError, setLocalError] = useState('');

  // Valor animado para la posición del modal
  const pan = useRef(new Animated.ValueXY()).current;

  // Configurar PanResponder para el gesto de deslizar
  const panResponder = useRef(
    PanResponder.create({
      // Activar el responder cuando el usuario mueva el dedo
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        console.log('onMoveShouldSetPanResponder:', gestureState.dy, gestureState.dx);
        // Simplificamos la condición para debug
        return gestureState.dy > 5;
      },
      
      // También agregamos este para mayor sensibilidad
      onStartShouldSetPanResponder: () => {
        return true;
      },
      
      // Mapear el gesto al valor animado
      onPanResponderMove: Animated.event(
        [null, { dy: pan.y }], // Mapear el desplazamiento vertical al pan.y
        { useNativeDriver: false } // Necesario para usar getLayout()
      ),

      // Cuando el usuario suelta el dedo
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dy > 150) {
          // Si deslizó más de 150px hacia abajo, cerrar el modal
          closeModalAnimation();
        } else {
          // Si no, devolver a la posición original con efecto resorte
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  // Animación para cerrar el modal
  const closeModalAnimation = () => {
    Animated.timing(pan, {
      toValue: { x: 0, y: SCREEN_HEIGHT },
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      onClose();
    });
  };

  // Resetear el pan cuando el modal se abre
  React.useEffect(() => {
    if (visible) {
      pan.setValue({ x: 0, y: 0 });
    }
  }, [visible]);

  const validate = () => {
    if (!username.trim() || !password.trim()) {
      setLocalError('Usuario y contraseña son obligatorios');
      return false;
    }
    setLocalError('');
    return true;
  };

  const handleLogin = async () => {
    setTouched({ username: true, password: true });
    if (!validate()) return;
    await onLogin(username, password);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? -30 : 20}
      >
        <TouchableWithoutFeedback onPress={closeModalAnimation}>
          <View style={styles.overlayTouchable} />
        </TouchableWithoutFeedback>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [
                { translateX: pan.x },
                { translateY: pan.y }
              ]
            }
          ]}
          {...panResponder.panHandlers}
        >
          <View style={styles.handle} />
          <Text style={styles.modalTitle}>Iniciar sesión</Text>
          
          <TextInput
            style={[
              styles.input,
              touched.username && !username ? styles.inputError : null,
            ]}
            placeholder="Usuario *"
            placeholderTextColor={colors.dark3}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            onBlur={() => setTouched(t => ({ ...t, username: true }))}
          />
          
          <TextInput
            style={[
              styles.input,
              touched.password && !password ? styles.inputError : null,
            ]}
            placeholder="Contraseña *"
            placeholderTextColor={colors.dark3}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            onBlur={() => setTouched(t => ({ ...t, password: true }))}
          />
          
          {(localError || error) && (
            <Text style={styles.errorText}>{localError || error}</Text>
          )}
          
          <TouchableOpacity
            style={styles.button}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.buttonText}>Ingresar</Text>
            )}
          </TouchableOpacity>
          
                     <TouchableOpacity onPress={closeModalAnimation} style={styles.closeButton}>
             <Text style={styles.closeButtonText}>Cancelar</Text>
           </TouchableOpacity>
         </Animated.View>
       </KeyboardAvoidingView>
     </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(23, 54, 30, 0.85)',
    justifyContent: 'flex-end',
  },
  overlayTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    backgroundColor: colors.light2,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingHorizontal: 24,
    paddingTop: 15,
    paddingBottom: 55,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 12,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.light3,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primaryDark,
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    backgroundColor: colors.light3,
    borderRadius: 12,
    padding: 18,
    marginBottom: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.dark3,
    fontSize: 16,
    color: colors.background,
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    color: colors.error,
    marginBottom: 8,
    textAlign: 'center',
    fontSize: 14,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 70,
    marginBottom: 18,
  },
  buttonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  closeButton: {
    alignItems: 'center',
    marginTop: 12,
  },
  closeButtonText: {
    color: colors.primaryDark,
    fontSize: 15,
  },
});

export default LoginModal;
