import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { misNegocios, seleccionarNegocio, NegocioDetallado } from '../api/auth';
import { useNavigation, NavigationProp, useFocusEffect, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NegocioCard from '../components/NegocioCard';
import ConfirmDialog from '../components/ConfirmDialog';

type SeleccionarNegocioRouteProp = RouteProp<RootStackParamList, 'SeleccionarNegocio'>;

const SeleccionarNegocioScreen: React.FC = () => {
  const { colors } = useTheme();
  const { tokens, login, logout, user } = useContext(AuthContext);
  const { showBanner } = useNotification();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<SeleccionarNegocioRouteProp>();

  const [negocios, setNegocios] = useState<NegocioDetallado[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingNegocioId, setLoadingNegocioId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [negocioToRemove, setNegocioToRemove] = useState<NegocioDetallado | null>(null);
  const [menuAbiertoId, setMenuAbiertoId] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      cargarNegocios();
    }, [])
  );

  const cargarNegocios = async () => {
    if (!tokens?.access) {
      setError('No se encontró sesión activa');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const resultado = await misNegocios(tokens.access);

      if (resultado.success) {
        const negociosOrdenados = ordenarNegocios(resultado.negocios);
        setNegocios(negociosOrdenados);
      } else {
        setError(resultado.message);
      }
    } catch (err) {
      setError('Error al cargar los negocios');
    } finally {
      setLoading(false);
    }
  };

  const ordenarNegocios = (lista: NegocioDetallado[]): NegocioDetallado[] => {
    return [...lista].sort((a, b) => {
      if (a.is_favorite && !b.is_favorite) return -1;
      if (!a.is_favorite && b.is_favorite) return 1;
      return 0;
    });
  };

  const handleSeleccionarNegocio = async (negocio: NegocioDetallado) => {
    if (!tokens?.access) {
      showBanner(
        'error',
        'Error',
        'No se encontró sesión activa'
      );
      return;
    }

    try {
      setLoadingNegocioId(negocio.id);

      const resultado = await seleccionarNegocio(negocio.id, tokens.access);

      if (resultado.success) {
        await AsyncStorage.setItem('negocio_id', negocio.id.toString());
        await login(resultado.user, tokens);

        showBanner(
          'success',
          'Negocio seleccionado',
          `Bienvenido a ${negocio.nombre}`
        );

        navigation.reset({
          index: 0,
          routes: [{ name: 'MainTabs' }],
        });
      } else {
        showBanner(
          'error',
          'Error',
          'No se pudo ingresar al negocio. Por favor, intenta de nuevo.'
        );
      }
    } catch (err) {
      showBanner(
        'error',
        'Error',
        'No se pudo ingresar al negocio. Por favor, intenta de nuevo.'
      );
    } finally {
      setLoadingNegocioId(null);
    }
  };

  const handleToggleFavorite = async (negocio: NegocioDetallado) => {
    showBanner(
      'info',
      'Próximamente',
      'La funcionalidad de favoritos estará disponible pronto.'
    );
  };

  const handleRemoveNegocio = (negocio: NegocioDetallado) => {
    setNegocioToRemove(negocio);
    setShowRemoveDialog(true);
  };

  const confirmarRemoveNegocio = async () => {
    if (!negocioToRemove) return;

    setShowRemoveDialog(false);

    showBanner(
      'info',
      'Próximamente',
      'La funcionalidad de dar de baja estará disponible pronto.'
    );

    setNegocioToRemove(null);
  };

  const handleAgregarNegocio = () => {
    showBanner(
      'info',
      'Próximamente',
      'La funcionalidad de "Agregar nuevo negocio" aún no se encuentra disponible.'
    );
  };

  const handleExitPress = () => {
    const fromPrivateArea = route.params?.fromPrivateArea ?? false;
    const esDesdeLogin = !user?.negocio || !fromPrivateArea;
    
    if (esDesdeLogin) {
      setShowExitDialog(true);
    } else {
      navigation.goBack();
    }
  };

  const confirmarSalida = async () => {
    setShowExitDialog(false);
    await logout();
    await AsyncStorage.removeItem('negocio_id');
    
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    });
  };

  const handleToggleMenu = (negocioId: number) => {
    setMenuAbiertoId(menuAbiertoId === negocioId ? null : negocioId);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Cargando negocios...
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.textSecondary} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>Error al cargar</Text>
          <Text style={[styles.errorMessage, { color: colors.textSecondary }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={cargarNegocios}
          >
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (negocios.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Ionicons name="business-outline" size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No se encontraron negocios activos
          </Text>
          <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>
            No tienes acceso a ningún negocio en este momento
          </Text>
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {negocios.map((negocio) => (
          <NegocioCard
            key={negocio.id}
            negocio={negocio}
            onPress={() => handleSeleccionarNegocio(negocio)}
            onToggleFavorite={() => handleToggleFavorite(negocio)}
            onRemove={() => handleRemoveNegocio(negocio)}
            loading={loadingNegocioId === negocio.id}
            menuVisible={menuAbiertoId === negocio.id}
            onMenuToggle={() => handleToggleMenu(negocio.id)}
          />
        ))}
      </ScrollView>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primaryDark} />

      <View style={[styles.header, { backgroundColor: colors.primaryDark }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleExitPress}
        >
          <Ionicons name="close" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.white }]}>Selecciona negocio</Text>
        <View style={styles.headerSpacer} />
      </View>

      {renderContent()}

      {!loading && !error && negocios.length > 0 && (
        <View style={[styles.bottomButtonContainer, { backgroundColor: colors.background }]}>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={handleAgregarNegocio}
          >
            <Ionicons name="add-circle-outline" size={24} color={colors.white} />
            <Text style={[styles.addButtonText, { color: colors.white }]}>
              Agregar nuevo negocio
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <ConfirmDialog
        visible={showExitDialog}
        title="Salir"
        message="Estás a punto de salir. Si continúas, serás deslogueado del sistema Ordema. ¿Deseas continuar?"
        confirmText="Sí"
        cancelText="No"
        onConfirm={confirmarSalida}
        onCancel={() => setShowExitDialog(false)}
        confirmColor={colors.error}
      />

      <ConfirmDialog
        visible={showRemoveDialog}
        title="Dar de baja"
        message={`Estás a punto de darte de baja de ${negocioToRemove?.nombre}. Ya no tendrás acceso a este negocio desde tu cuenta. ¿Estás seguro?`}
        confirmText="Sí"
        cancelText="No"
        onConfirm={confirmarRemoveNegocio}
        onCancel={() => {
          setShowRemoveDialog(false);
          setNegocioToRemove(null);
        }}
        confirmColor={colors.error}
      />
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
    paddingTop: 56,
    paddingHorizontal: 20,
  },
  backButton: {
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
  },
  headerSpacer: {
    width: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SeleccionarNegocioScreen;
