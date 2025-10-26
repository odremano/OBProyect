import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

type Variant = 'info' | 'warning' | 'danger' | 'success';

interface ConfirmDialogProps {
  visible: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmColor?: string;
  variant?: Variant;
  icon?: string;
  singleButton?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible,
  title = '¿Estás seguro?',
  message,
  confirmText = 'Sí',
  cancelText = 'No',
  onConfirm,
  onCancel,
  confirmColor,
  variant,
  icon,
  singleButton = false,
}) => {
  const { colors } = useTheme();

  const getVariantColor = (): string => {
    if (confirmColor) return confirmColor;
    
    switch (variant) {
      case 'danger':
        return '#EF4444';
      case 'warning':
        return '#F59E0B';
      case 'success':
        return '#10B981';
      case 'info':
      default:
        return colors.primary;
    }
  };

  const getVariantIcon = (): string | undefined => {
    if (icon) return icon;
    
    switch (variant) {
      case 'danger':
        return 'alert-circle';
      case 'warning':
        return 'warning';
      case 'success':
        return 'checkmark-circle';
      case 'info':
        return 'information-circle';
      default:
        return undefined;
    }
  };

  const variantColor = getVariantColor();
  const variantIcon = getVariantIcon();

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel || onConfirm}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          {variantIcon && (
            <View style={styles.iconContainer}>
              <Icon name={variantIcon} size={48} color={variantColor} />
            </View>
          )}
          
          {title && (
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          )}
          
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            {message}
          </Text>
          
          <View style={[
            styles.buttonContainer,
            singleButton && styles.buttonContainerSingle
          ]}>
            {!singleButton && onCancel && (
              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.dark2 }]}
                onPress={onCancel}
              >
                <Text style={[styles.buttonText, { color: colors.text }]}>
                  {cancelText}
                </Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: variantColor },
                singleButton && styles.buttonFull
              ]}
              onPress={onConfirm}
            >
              <Text style={[styles.buttonText, { color: colors.white }]}>
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: width * 0.85,
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  buttonContainerSingle: {
    flexDirection: 'column',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonFull: {
    flex: 1,
    width: '100%',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ConfirmDialog;
