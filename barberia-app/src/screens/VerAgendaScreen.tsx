import React, { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, PanResponder } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { obtenerTurnosProfesional, obtenerDiasConTurnos, cancelarTurnoProfesional, marcarTurnoCompletado, TurnoProfesional } from '../api/turnos';
import { useNotifications } from '../hooks/useNotifications';
import { CalendarModal } from '../components/CalendarModal';

interface TurnoAgenda {
  id: number;
  hora: string;
  cliente: string;
  servicio: string;
  precio: string;
  status: 'confirmado' | 'completado' | 'cancelado';
  puede_cancelar: boolean;
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Función para formatear el precio en formato $00.000
export const formatearPrecio = (precio: string | number) => {
  const valor = Number(precio);
  if (isNaN(valor)) return precio;
  return '$' + valor.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

const VerAgendaScreen = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { user, tokens } = useContext(AuthContext);
  const { showSuccess, showError, showWarning } = useNotifications();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [turnosDelDia, setTurnosDelDia] = useState<TurnoAgenda[]>([]);
  const [diasConTurnos, setDiasConTurnos] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  // Configurar gestos de deslizamiento
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      // Solo activar si el deslizamiento es principalmente horizontal
      return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 20;
    },
    onPanResponderMove: (evt, gestureState) => {
      // Opcional: agregar feedback visual durante el deslizamiento
    },
    onPanResponderRelease: (evt, gestureState) => {
      const { dx } = gestureState;
      
      // Umbral mínimo para considerar un swipe válido
      if (Math.abs(dx) > 50) {
        if (dx > 0) {
          // Deslizar hacia la derecha = día anterior
          cambiarDia('anterior');
        } else {
          // Deslizar hacia la izquierda = día siguiente
          cambiarDia('siguiente');
        }
      }
    },
  });

  // Función para cambiar de día
  const cambiarDia = (direccion: 'anterior' | 'siguiente') => {
    const nuevaFecha = new Date(selectedDate);
    if (direccion === 'anterior') {
      nuevaFecha.setDate(nuevaFecha.getDate() - 1);
    } else {
      nuevaFecha.setDate(nuevaFecha.getDate() + 1);
    }
    setSelectedDate(nuevaFecha);
    setCurrentMonth(nuevaFecha);
  };

  // Verificar que el usuario es profesional
  if (user?.role !== 'profesional') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.primaryDark }]}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.closeButton}
          >
            <Icon name="close" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.white }]}>Agenda</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyState}>
          <Text style={[styles.emptyMessage, { color: colors.text }]}>
            Solo los profesionales pueden acceder a la agenda.
          </Text>
        </View>
      </View>
    );
  }

  // Función para convertir TurnoProfesional de API a TurnoAgenda
  const convertirTurno = (turno: TurnoProfesional): TurnoAgenda => {
    return {
      id: turno.id,
      hora: turno.hora_inicio,
      cliente: turno.cliente_name,
      servicio: turno.servicio_name,
      precio: turno.servicio_price,
      status: turno.status as 'confirmado' | 'completado' | 'cancelado',
      puede_cancelar: turno.puede_cancelar
    };
  };

  // Cargar turnos del día seleccionado
  const cargarTurnosDelDia = async (fecha: Date) => {
    if (!tokens) return;
    
    setLoading(true);
    try {
      const fechaStr = fecha.toISOString().split('T')[0]; // YYYY-MM-DD
      const turnos = await obtenerTurnosProfesional(tokens, fechaStr);
      const turnosConvertidos = turnos.map(convertirTurno);
      setTurnosDelDia(turnosConvertidos);
    } catch (error) {
      console.error('Error cargando turnos del día:', error);
      setTurnosDelDia([]);
    } finally {
      setLoading(false);
    }
  };

  // Cargar días con turnos del mes
  const cargarDiasConTurnos = async (fecha: Date) => {
    if (!tokens) return;
    
    try {
      const dias = await obtenerDiasConTurnos(tokens, fecha.getFullYear(), fecha.getMonth());
      setDiasConTurnos(dias);
    } catch (error) {
      console.error('Error cargando días con turnos:', error);
      setDiasConTurnos([]);
    }
  };

  // Efectos para cargar datos
  useEffect(() => {
    cargarTurnosDelDia(selectedDate);
  }, [selectedDate, tokens]);

  useEffect(() => {
    cargarDiasConTurnos(currentMonth);
  }, [currentMonth, tokens]);

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const diasSemanaCompletos = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  const formatearFechaCompleta = (fecha: Date) => {
    const dia = diasSemanaCompletos[fecha.getDay()];
    const numerodia = fecha.getDate();
    const mes = meses[fecha.getMonth()];
    const año = fecha.getFullYear();
    return `${dia}, ${numerodia} ${mes} ${año}`;
  };

  const formatearMesAño = (fecha: Date) => {
    const mes = meses[fecha.getMonth()];
    const año = fecha.getFullYear();
    return `${mes} ${año}`;
  };

  const manejarCancelarTurno = async (turno: TurnoAgenda) => {
    Alert.alert(
      'Cancelar turno',
      `¿Estás seguro de que quieres cancelar el turno de ${turno.hora} con ${turno.cliente}?`,
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Sí, cancelar', 
          style: 'destructive',
          onPress: async () => {
            if (!tokens) return;
            
            try {
              await cancelarTurnoProfesional(tokens, turno.id);
              
              // Actualizar el estado local inmediatamente
              setTurnosDelDia(prev => 
                prev.map(t => 
                  t.id === turno.id 
                    ? { ...t, status: 'cancelado' as const }
                    : t
                )
              );
              
              showSuccess('Turno cancelado', 'El turno se canceló correctamente');
              // Recargar datos del servidor para sincronizar
              cargarTurnosDelDia(selectedDate);
              cargarDiasConTurnos(currentMonth);
            } catch (error: any) {
              if (error.response && error.response.status === 400) {
                showWarning(
                  'Ya no puedes cancelar este turno',
                  'Las cancelaciones deben hacerse al menos 2 horas antes del horario reservado. Si necesitas ayuda, comunícate con el cliente.'
                );
              } else {
                showError('Error al cancelar turno', 'No se pudo cancelar el turno');
                console.error('Error cancelando turno:', error);
              }
            }
          }
        }
      ]
    );
  };

  const manejarRealizarTurno = async (turno: TurnoAgenda) => {
    Alert.alert(
      'Marcar como realizado',
      `¿El turno de ${turno.hora} con ${turno.cliente} fue completado?`,
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Sí, completado',
          onPress: async () => {
            if (!tokens) return;
            
            try {
              await marcarTurnoCompletado(tokens, turno.id);
              
              // Actualizar el estado local inmediatamente
              setTurnosDelDia(prev => 
                prev.map(t => 
                  t.id === turno.id 
                    ? { ...t, status: 'completado' as const }
                    : t
                )
              );
              
              showSuccess('Turno completado', 'El turno se marcó como realizado correctamente');
              // Recargar datos del servidor para sincronizar
              cargarTurnosDelDia(selectedDate);
            } catch (error: any) {
              showError('Error al completar turno', 'No se pudo marcar el turno como completado');
              console.error('Error completando turno:', error);
            }
          }
        }
      ]
    );
  };

  const hayTurnosDelDia = turnosDelDia.length > 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primaryDark }]}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.closeButton}
        >
          <Icon name="close" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.white }]}>Agenda</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Navegación de fecha */}
      <View style={[styles.dateNavigation, { backgroundColor: colors.background }]}>
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => cambiarDia('anterior')}
        >
          <Icon name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.dateButton}
          onPress={() => setShowCalendar(true)}
        >
          <Text style={[styles.dateText, { color: colors.text }]}>
            {showCalendar ? formatearMesAño(currentMonth) : formatearFechaCompleta(selectedDate)}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => cambiarDia('siguiente')}
        >
          <Icon name="chevron-forward" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Contenido principal */}
      <View style={{ flex: 1 }} {...panResponder.panHandlers}>
        {loading ? (
          <View style={styles.loadingState}>
            <Text style={[styles.loadingMessage, { color: colors.text }]}>Cargando turnos...</Text>
          </View>
        ) : hayTurnosDelDia ? (
          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.contentContainer}
          >
            {turnosDelDia.map((turno) => (
            <View 
              key={turno.id} 
              style={[
                styles.turnoCard, 
                { backgroundColor: colors.dark2 },
                (turno.status === 'completado' || turno.status === 'cancelado') && { opacity: 0.7 }
              ]}
            >
              <View style={styles.turnoHeader}>
                <Text style={[styles.turnoHora, { color: colors.text }]}>{turno.hora} hs</Text>
                <Text style={[styles.turnoFecha, { color: colors.textSecondary }]}>
                  {formatearFechaCompleta(selectedDate)}
                </Text>
              </View>
              
              <View style={styles.turnoInfo}>
                <Text style={[styles.turnoCliente, { color: colors.text }]}>{turno.cliente}</Text>
                <Text style={[styles.turnoServicio, { color: colors.textSecondary }]}>{turno.servicio}</Text>
              </View>
              
              <View style={styles.turnoFooter}>
                <Text style={[styles.turnoPrecio, { color: colors.text }]}>{formatearPrecio(turno.precio)}</Text>
                
                {turno.status === 'completado' ? (
                  <View style={[styles.statusBadge, { backgroundColor: colors.success }]}>
                    <Icon name="checkmark-circle" size={16} color={colors.white} style={{ marginRight: 4 }} />
                    <Text style={[styles.statusText, { color: colors.white }]}>Realizado</Text>
                  </View>
                ) : turno.status === 'cancelado' ? (
                  <View style={[styles.statusBadge, { backgroundColor: '#dc3545' }]}>
                    <Icon name="close-circle" size={16} color={colors.white} style={{ marginRight: 4 }} />
                    <Text style={[styles.statusText, { color: colors.white }]}>Cancelado</Text>
                  </View>
                ) : turno.puede_cancelar ? (
                  <TouchableOpacity 
                    style={[styles.cancelButton, { backgroundColor: '#dc3545' }]}
                    onPress={() => manejarCancelarTurno(turno)}
                  >
                    <Text style={[styles.buttonText, { color: colors.white }]}>Cancelar turno</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                    style={[styles.realizadoButton, { backgroundColor: colors.success }]}
                    onPress={() => manejarRealizarTurno(turno)}
                  >
                    <Text style={[styles.buttonText, { color: colors.white }]}>Marcar realizado</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
        ) : (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyMessage, { color: colors.text }]}>
              Este día no tienes turnos.
            </Text>
            <Text style={[styles.emptySubMessage, { color: colors.textSecondary }]}>
              ¡Aprovecha tu tiempo libre!
            </Text>
          </View>
        )}
      </View>

      {/* Calendario Modal */}
      <CalendarModal
        visible={showCalendar}
        onClose={() => setShowCalendar(false)}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        diasConIndicadores={diasConTurnos}
        title="Seleccionar fecha"
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
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  dateNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  navButton: {
    padding: 8,
  },
  dateButton: {
    flex: 1,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  turnoCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  turnoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  turnoHora: {
    fontSize: 16,
    fontWeight: '600',
  },
  turnoFecha: {
    fontSize: 14,
    fontWeight: '500',
  },
  turnoInfo: {
    marginBottom: 12,
  },
  turnoCliente: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  turnoServicio: {
    fontSize: 14,
  },
  turnoFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  turnoPrecio: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  realizadoButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyMessage: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubMessage: {
    fontSize: 16,
    textAlign: 'center',
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingMessage: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default VerAgendaScreen; 