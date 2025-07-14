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
import TurnoCard from '../components/TurnoCard';
import HistorialItem from '../components/HistorialItem';
import Icon from 'react-native-vector-icons/Ionicons';
import colors from '../theme/colors';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { fetchMisTurnos, cancelarTurno, Turno as TurnoAPI, MisTurnosResponse } from '../api/misTurnos';

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
  
  // Mapear turnos próximos (confirmados)
  turnosResponse.turnos.proximos.forEach(turno => {
    turnos.push({
      id: turno.id.toString(),
      fecha: turno.start_datetime,
      hora: formatearHora(turno.hora_inicio),
      profesional: turno.profesional_name || 'Profesional no asignado',
      servicio: turno.servicio_name || 'Servicio no especificado',
      estado: 'confirmado',
      precio: formatearPrecio(turno.servicio_price),
      avatar: turno.profesional_photo || ''
    });
  });
  
  // Mapear turnos pasados (completados)
  turnosResponse.turnos.pasados.forEach(turno => {
    turnos.push({
      id: turno.id.toString(),
      fecha: turno.start_datetime,
      hora: formatearHora(turno.hora_inicio),
      profesional: turno.profesional_name || 'Profesional no asignado',
      servicio: turno.servicio_name || 'Servicio no especificado',
      estado: 'completado',
      precio: formatearPrecio(turno.servicio_price),
      avatar: turno.profesional_photo || ''
    });
  });
  
  // Mapear turnos cancelados
  turnosResponse.turnos.cancelados.forEach(turno => {
    turnos.push({
      id: turno.id.toString(),
      fecha: turno.start_datetime,
      hora: formatearHora(turno.hora_inicio),
      profesional: turno.profesional_name || 'Profesional no asignado',
      servicio: turno.servicio_name || 'Servicio no especificado',
      estado: 'cancelado',
      precio: formatearPrecio(turno.servicio_price),
      avatar: turno.profesional_photo || ''
    });
  });
  
  return turnos;
};

export default function MisTurnosScreen({ navigation }: Props) {
  const { tokens } = useContext(AuthContext);
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Función para cargar turnos desde la API
  const cargarTurnos = async (showLoading = true) => {
    if (!tokens) {
      setLoading(false);
      return;
    }

    if (showLoading) setLoading(true);

    try {
      const response = await fetchMisTurnos(tokens);
      const turnosMapeados = mapearTurnosAPI(response);
      setTurnos(turnosMapeados);
    } catch (error: any) {
      console.error('Error cargando turnos:', error);
      if (error.response && error.response.status === 401) {
        Alert.alert('Sesión expirada', 'Por favor, inicia sesión nuevamente.');
      } else {
        Alert.alert('Error', 'No se pudieron cargar los turnos.');
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
              await cancelarTurno(tokens, parseInt(turnoId));
              
              // Refrescar la lista desde el servidor
              await cargarTurnos(false);
              
              Alert.alert('Turno cancelado', 'El turno ha sido cancelado correctamente.');
            } catch (error: any) {
              console.error('Error cancelando turno:', error);
              Alert.alert('Error', 'No se pudo cancelar el turno.');
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#178232" />
      </View>
    );
  }

  // Filtrar turnos confirmados y historial
  const turnosConfirmados = turnos.filter(turno => turno.estado === 'confirmado');
  const proximoTurno = turnosConfirmados.length > 0 ? turnosConfirmados[0] : null;
  const historial = turnos.filter(turno => turno.estado !== 'confirmado');

  return (
    <View style={styles.container}>
      {/* Header fijo */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.closeButton}
        >
          <Icon name="close" size={24} color={colors.white}  />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis turnos</Text>
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
            <Text style={styles.subtitulo}>Próximo turno</Text>
            <TurnoCard 
              turno={proximoTurno} 
              onCancelar={handleCancelarTurno}
              puedeCancel={true}
            />
          </View>
        ) : (
          <View style={styles.seccionVacia}>
            <Text style={styles.subtitulo}>Próximo turno</Text>
            <Text style={styles.mensajeVacio}>
              Todavía no tienes turnos.{'\n'}¿Querés agendar uno ahora?
            </Text>
            <TouchableOpacity 
              style={styles.botonReservar}
              onPress={handleReservarTurno}
            >
              <Text style={styles.textoReservar}>Reservar turno</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Historial */}
        {historial.length > 0 && (
          <View style={styles.seccion}>
            <Text style={styles.subtitulo}>Historial</Text>
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
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    backgroundColor: colors.primaryDark,
    paddingHorizontal: 20,
  },
  closeButton: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
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
    color: colors.white,
    textAlign: 'center',
    marginBottom: 24,
  },
  seccion: {
    marginBottom: 24,
  },
  seccionVacia: {
    marginBottom: 24,
    alignItems: 'center',
  },
  subtitulo: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
    marginBottom: 16,
  },
  mensajeVacio: {
    fontSize: 16,
    color: colors.light3,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  botonReservar: {
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  textoReservar: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
