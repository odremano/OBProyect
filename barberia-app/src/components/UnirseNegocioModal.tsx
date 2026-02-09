import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Animated,
  PanResponder,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { negociosDisponibles, unirseNegocio, NegocioPublico } from '../api/auth';

const SCREEN_HEIGHT = Dimensions.get('window').height;

interface UnirseNegocioModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (negocioNombre: string) => void;
  accessToken: string;
}

const UnirseNegocioModal: React.FC<UnirseNegocioModalProps> = ({
  visible,
  onClose,
  onSuccess,
  accessToken,
}) => {
  const { colors } = useTheme();
  
  // Estados
  const [negocios, setNegocios] = useState<NegocioPublico[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [negocioSeleccionado, setNegocioSeleccionado] = useState<NegocioPublico | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingNegocios, setLoadingNegocios] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Animación para el gesto de deslizar
  const pan = useRef(new Animated.ValueXY()).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 5,
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event(
        [null, { dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 150) {
          closeModalAnimation();
        } else {
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  const closeModalAnimation = () => {
    Animated.timing(pan, {
      toValue: { x: 0, y: SCREEN_HEIGHT },
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      onClose();
    });
  };

  // Cargar negocios cuando se abre el modal
  useEffect(() => {
    if (visible) {
      pan.setValue({ x: 0, y: 0 });
      setNegocioSeleccionado(null);
      setBusqueda('');
      setError(null);
      cargarNegocios();
    }
  }, [visible]);

  const cargarNegocios = async () => {
    setLoadingNegocios(true);
    setError(null);
    try {
      const resultado = await negociosDisponibles(accessToken);
      if (resultado.success) {
        setNegocios(resultado.negocios);
      } else {
        setError(resultado.message);
      }
    } catch (err) {
      setError('Error al cargar los negocios disponibles');
    } finally {
      setLoadingNegocios(false);
    }
  };

  // Filtrar negocios por búsqueda
  const negociosFiltrados = negocios.filter((negocio) =>
    negocio.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  // Unirse al negocio seleccionado
  const handleUnirse = async () => {
    if (!negocioSeleccionado) return;

    setLoading(true);
    setError(null);

    try {
      const resultado = await unirseNegocio(negocioSeleccionado.id, accessToken);
      
      if (resultado.success) {
        onSuccess(negocioSeleccionado.nombre);
        closeModalAnimation();
      } else {
        setError(resultado.message);
      }
    } catch (err) {
      setError('Error al unirse al negocio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={closeModalAnimation}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={closeModalAnimation}>
          <View style={styles.overlayTouchable} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.modalContainer,
            { backgroundColor: colors.background },
            {
              transform: [
                { translateX: pan.x },
                { translateY: pan.y },
              ],
            },
          ]}
          {...panResponder.panHandlers}
        >
          {/* Handle para arrastrar */}
          <View style={[styles.handle, { backgroundColor: colors.dark3 }]} />

          {/* Título */}
          <Text style={[styles.title, { color: colors.text }]}>
            Unirse a un negocio
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Selecciona un negocio para agregarlo a tu lista
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
              value={busqueda}
              onChangeText={setBusqueda}
            />
            {busqueda.length > 0 && (
              <TouchableOpacity onPress={() => setBusqueda('')}>
                <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Lista de negocios */}
          {loadingNegocios ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Cargando negocios disponibles...
              </Text>
            </View>
          ) : negocios.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="checkmark-circle-outline" size={64} color={colors.success} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                Ya eres miembro de todos los negocios
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                No hay más negocios disponibles para unirse
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.negociosList}
              contentContainerStyle={styles.negociosContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {negociosFiltrados.length === 0 ? (
                <View style={styles.noResultsContainer}>
                  <Ionicons name="search-outline" size={48} color={colors.textSecondary} />
                  <Text style={[styles.noResultsText, { color: colors.textSecondary }]}>
                    No se encontraron negocios con "{busqueda}"
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
          {error && (
            <View style={[styles.errorContainer, { backgroundColor: `${colors.error}20` }]}>
              <Ionicons name="alert-circle" size={20} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            </View>
          )}

          {/* Botones */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[
                styles.primaryButton,
                {
                  backgroundColor: negocioSeleccionado ? colors.primary : colors.dark3,
                  opacity: loading ? 0.7 : 1,
                },
              ]}
              onPress={handleUnirse}
              disabled={!negocioSeleccionado || loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Ionicons name="add-circle-outline" size={20} color={colors.white} />
                  <Text style={[styles.primaryButtonText, { color: colors.white }]}>
                    Unirme al negocio
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={closeModalAnimation}
            >
              <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>
                Cancelar
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
    maxHeight: SCREEN_HEIGHT * 0.85,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
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
    paddingVertical: 48,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  emptyContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  negociosList: {
    maxHeight: 300,
  },
  negociosContent: {
    paddingBottom: 8,
  },
  noResultsContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  noResultsText: {
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
  },
  negocioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  negocioInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  negocioIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  negocioTexts: {
    flex: 1,
  },
  negocioNombre: {
    fontSize: 15,
    fontWeight: '600',
  },
  negocioDireccion: {
    fontSize: 12,
    marginTop: 2,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
  },
  buttonsContainer: {
    marginTop: 20,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  cancelButtonText: {
    fontSize: 15,
  },
});

export default UnirseNegocioModal;
