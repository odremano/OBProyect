import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated, 
  Dimensions
} from 'react-native';
import { 
  PanGestureHandler, 
  State, 
  GestureHandlerRootView 
} from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

export type BannerType = 'success' | 'error' | 'warning' | 'info';

interface NotificationBannerProps {
  visible: boolean;
  type: BannerType;
  title: string;
  message?: string;
  onClose?: () => void;
  position?: 'top' | 'bottom';
  style?: any; // ✅ Agregar prop de estilo personalizado
}

const NotificationBanner: React.FC<NotificationBannerProps> = ({
  visible,
  type,
  title,
  message,
  onClose,
  position = 'top',
  style // ✅ Recibir estilo personalizado
}) => {
  const { colors } = useTheme();
  const [bannerAnimation] = useState(new Animated.Value(-200));
  const [translateX] = useState(new Animated.Value(0));
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (visible) {
      // Cancelar animación anterior si existe
      if (animationRef.current) {
        animationRef.current.stop();
      }

      bannerAnimation.setValue(-200);
      translateX.setValue(0);

      // Animación de entrada
      animationRef.current = Animated.timing(bannerAnimation, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      });

      animationRef.current.start();
    } else {
      // Animación de salida
      if (animationRef.current) {
        animationRef.current.stop();
      }

      animationRef.current = Animated.timing(bannerAnimation, {
        toValue: -200,
        duration: 300,
        useNativeDriver: true,
      });

      animationRef.current.start();
    }

    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
      }
    };
  }, [visible]);

  const getBannerConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: 'checkmark-circle',
          backgroundColor: colors.dark2,
          borderColor: colors.primary,
          iconBackground: colors.success,
          textColor: colors.text,
          secondaryTextColor: colors.textSecondary
        };
      case 'error':
        return {
          icon: 'close-circle',
          backgroundColor: colors.dark2,
          borderColor: colors.error,
          iconBackground: colors.error,
          textColor: colors.text,
          secondaryTextColor: colors.textSecondary
        };
      case 'warning':
        return {
          icon: 'warning',
          backgroundColor: colors.dark2,
          borderColor: '#f59e0b',
          iconBackground: '#f59e0b',
          textColor: colors.text,
          secondaryTextColor: colors.textSecondary
        };
      case 'info':
        return {
          icon: 'information-circle',
          backgroundColor: colors.dark2,
          borderColor: colors.primary,
          iconBackground: colors.primary,
          textColor: colors.text,
          secondaryTextColor: colors.textSecondary
        };
      default:
        return {
          icon: 'checkmark-circle',
          backgroundColor: colors.dark2,
          borderColor: colors.primary,
          iconBackground: colors.primary,
          textColor: colors.text,
          secondaryTextColor: colors.textSecondary
        };
    }
  };

  const config = getBannerConfig();

  const handleClose = () => {
    onClose?.();
  };

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX } = event.nativeEvent;
      
      if (Math.abs(translationX) > screenWidth * 0.3) {
        Animated.timing(translateX, {
          toValue: translationX > 0 ? screenWidth : -screenWidth,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          handleClose();
        });
      } else {
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    }
  };

  return (
    <Animated.View 
      style={[
        styles.banner, 
        { 
          backgroundColor: config.backgroundColor,
          borderColor: config.borderColor,
          transform: [
            { translateY: bannerAnimation },
            { translateX }
          ],
          top: position === 'top' ? 80 : undefined,
          bottom: position === 'bottom' ? 20 : undefined,
        },
        style // ✅ Aplicar estilo personalizado
      ]}
    >
      <GestureHandlerRootView>
        <PanGestureHandler
          onGestureEvent={onGestureEvent}
          onHandlerStateChange={onHandlerStateChange}
        >
          <Animated.View style={styles.bannerContent}>
            <View style={[styles.iconContainer, { backgroundColor: config.iconBackground }]}>
              <Icon name={config.icon} size={20} color={colors.white} />
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.title, { color: config.textColor }]}>
                {title}
              </Text>
              {message && (
                <Text style={[styles.message, { color: config.secondaryTextColor }]}>
                  {message}
                </Text>
              )}
            </View>
            <TouchableOpacity 
              onPress={handleClose} 
              style={[styles.closeButton, { backgroundColor: colors.background }]}
              activeOpacity={0.7}
            >
              <Icon name="close" size={18} color={config.secondaryTextColor} />
            </TouchableOpacity>
          </Animated.View>
        </PanGestureHandler>
      </GestureHandlerRootView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 1000,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    maxHeight: 120,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 20,
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
  },
  closeButton: {
    padding: 6,
    marginTop: -2,
    borderRadius: 12,
  },
});

export default NotificationBanner; 