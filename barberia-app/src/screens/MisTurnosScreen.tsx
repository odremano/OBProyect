import React, { useEffect, useState, useContext } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator, 
  TouchableOpacity, 
  Alert,
  ScrollView,
  RefreshControl 
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import TurnoCard from '../components/TurnoCard';
import HistorialItem from '../components/HistorialItem';
import Icon from 'react-native-vector-icons/Ionicons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { fetchMisTurnos, cancelarTurno, Turno as TurnoAPI, MisTurnosResponse } from '../api/misTurnos';
import { useNotifications } from '../hooks/useNotifications';

type Props = NativeStackScreenProps<RootStackParamList, 'MisTurnos'>;

// Tipos para la nueva estructura de datos
interface Turno {
  id: string;
  fecha: string; // formato ISO
  hora: string; // ej: "18:30 hs"
  profesional: string;
  servicio: string;
  estado: 'confirmado' | 'completado' | 'cancelado';
  precio: string;
  avatar: string; // url de imagen
  fechaObj: Date | null; // Nuevo campo para la fecha completa
}

// Función para parsear fecha y hora en formato 'DD/MM/YYYY HH:mm' a Date
function parseFechaHora(fechaHora: string): Date | null {
  const match = fechaHora.match(/^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/);
  if (!match) return null;
  const [, dd, mm, yyyy, hh, min] = match;
  return new Date(Number(yyyy), Number(mm) - 1, Number(dd), Number(hh), Number(min));
}

// Función para mapear datos de la API a nuestra estructura
const mapearTurnosAPI = (turnosResponse: MisTurnosResponse): Turno[] => {
  const turnos: Turno[] = [];
  
  // Función auxiliar para formatear el precio
  const formatearPrecio = (precio: string) => {
    const precioNum = parseFloat(precio.replace(/[^0-9.-]+/g, ''));
    return isNaN(precioNum) ? precio : `$${precioNum.toLocaleString()}`;
  };
  
  // Función auxiliar para formatear la hora
  const formatearHora = (hora: string) => {
    return hora.includes('hs') ? hora : `${hora}hs`;
  };
  
  // Mapear turnos próximos
  (turnosResponse.turnos_proximos ?? []).forEach((turno: any) => {
    turnos.push({
      id: turno.id.toString(),
      fecha: turno.start_datetime,
      fechaObj: parseFechaHora(turno.start_datetime),
      hora: formatearHora(turno.hora_inicio),
      profesional: turno.profesional_name || 'Profesional no asignado',
      servicio: turno.servicio_name || 'Servicio no especificado',
      estado: turno.status || 'confirmado',
      precio: formatearPrecio(turno.servicio_price),
      avatar: turno.profesional_photo || ''
    });
  });
  
  // Mapear turnos historial
  (turnosResponse.turnos_historial ?? []).forEach((turno: any) => {
    turnos.push({
      id: turno.id.toString(),
      fecha: turno.start_datetime,
      fechaObj: parseFechaHora(turno.start_datetime),
      hora: formatearHora(turno.hora_inicio),
      profesional: turno.profesional_name || 'Profesional no asignado',
      servicio: turno.servicio_name || 'Servicio no especificado',
      estado: turno.status || 'completado',
      precio: formatearPrecio(turno.servicio_price),
      avatar: turno.profesional_photo || ''
    });
  });
  
  return turnos;
};

export default function MisTurnosScreen({ navigation }: Props) {
  const { tokens, user } = useContext(AuthContext);
  const { colors } = useTheme();
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { showSuccess, showError, showWarning } = useNotifications();

  // Función para cargar turnos desde la API
  const cargarTurnos = async (showLoading = true) => {
    if (!tokens) {
      setLoading(false);
      return;
    }

    if (showLoading) setLoading(true);

    try {
      const response = await fetchMisTurnos(tokens, user?.negocio?.id ?? 0);
      const turnosMapeados = mapearTurnosAPI(response);
      setTurnos(turnosMapeados);
    } catch (error: any) {
      console.error('Error cargando turnos:', error);
      if (error.response && error.response.status === 401) {
        showError('Sesión expirada', 'Por favor, inicia sesión nuevamente.');
      } else {
        showError('Error', 'No se pudieron cargar los turnos.');
      }
      setTurnos([]);
    } finally {
      if (showLoading) setLoading(false);
      setRefreshing(false);
    }
  };

  // Función para refrescar la lista
  const handleRefresh = () => {
    setRefreshing(true);
    cargarTurnos(false);
  };

  // Cargar turnos al montar el componente
  useEffect(() => {
    cargarTurnos();
  }, [tokens]);

  const handleCancelarTurno = async (turnoId: string) => {
    if (!tokens) return;
    
    Alert.alert(
      'Cancelar turno',
      '¿Estás seguro de que deseas cancelar este turno?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí',
          style: 'destructive',
          onPress: async () => {
            try {
              // Llamada real a la API
              await cancelarTurno(tokens, parseInt(turnoId), user?.negocio?.id ?? 0);
              
              // Refrescar la lista desde el servidor
              await cargarTurnos(false);
              
              showSuccess(
                'Turno cancelado',
                'Su turno ha sido cancelado correctamente.'    
              );
            } catch (error: any) {
              if (error.response && error.response.status === 400) {
                showWarning(
                  'Ya no puedes cancelar este turno',
                  'Las cancelaciones deben hacerse al menos 2 horas antes del horario reservado. Si necesitás ayuda, comunicate con el negocio.'
                );
              } else {
                console.error('Error cancelando turno:', error);
                showError('No se pudo cancelar el turno.');
              }
            }
          }
        }
      ]
    );
  };

  const handleReservarTurno = () => {
    navigation.navigate('ReservaTurno', {});
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Filtrar turnos confirmados y historial
  const turnosConfirmados = turnos.filter(turno => turno.estado === 'confirmado');
  const proximoTurno = turnosConfirmados.length > 0 ? turnosConfirmados[0] : null;
  const historial = turnos.filter(turno => turno.estado !== 'confirmado');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header fijo */}
      <View style={[styles.header, { backgroundColor: colors.primaryDark }]}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.closeButton}
        >
          <Icon name="close" size={24} color={colors.white}  />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.white }]}>Mis turnos</Text>
        <View style={{ width: 20 }} />
      </View>

      {/* Contenido scrolleable */}
      <ScrollView 
        style={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Próximo turno */}
        {proximoTurno ? (
          <View style={styles.seccion}>
            <Text style={[styles.subtitulo, { color: colors.text }]}>Próximo turno</Text>
            <TurnoCard 
              turno={proximoTurno} 
              onCancelar={handleCancelarTurno}
              puedeCancel={true}
            />
          </View>
        ) : (
          <View style={styles.seccionVacia}>
            <Text style={[styles.subtitulo, { color: colors.text }]}>Próximo turno</Text>
            <Text style={[styles.mensajeVacio, { color: colors.textSecondary }]}>
              Todavía no tienes turnos.{'\n'}¿Querés agendar uno ahora?
            </Text>
            <TouchableOpacity 
              style={[styles.botonReservar, { backgroundColor: colors.primary }]}
              onPress={handleReservarTurno}
            >
              <Text style={[styles.textoReservar, { color: colors.white }]}>Reservar turno</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Historial */}
        {historial.length > 0 && (
          <View style={styles.seccion}>
            <Text style={[styles.subtitulo, { color: colors.text }]}>Historial</Text>
            <FlatList
              data={historial}
              keyExtractor={item => item.id}
              renderItem={({ item }) => <HistorialItem turno={item} />}
              scrollEnabled={false}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingHorizontal: 20,
  },
  closeButton: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 34,
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  seccion: {
    marginBottom: 24,
  },
  seccionVacia: {
    marginBottom: 24,
  },
  subtitulo: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  mensajeVacio: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  botonReservar: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginHorizontal: 32,
    alignItems: 'center',
  },
  textoReservar: {
    fontSize: 16,
    fontWeight: '600',
  },
});
