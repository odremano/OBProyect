import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, SafeAreaView, Image, Platform } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { fetchProfesionales, Profesional } from '../api/profesionales';
import { fetchServicios, Servicio } from '../api/servicios';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import Icon from 'react-native-vector-icons/Ionicons';
import { reservarTurno, obtenerHorariosDisponibles, HorariosResponse, obtenerDiasConDisponibilidadOptimizada } from '../api/turnos';
import { formatearPrecio } from './VerAgendaScreen';
import { mostrarEstadoDisponibilidad } from '../utils/disponibilidadUtils';
import { CalendarModal } from '../components/CalendarModal';


type Props = NativeStackScreenProps<RootStackParamList, 'ReservaTurno'>;

interface ProfesionalConDisponibilidad extends Profesional {
  proximaDisponibilidad?: string;
  cargandoDisponibilidad?: boolean;
}

export default function ReservaTurnoScreen({ route, navigation }: Props) {
  const { colors } = useTheme();
  const { tokens, user } = useContext(AuthContext);
  const profesionalIdParam = route.params?.profesionalId;

  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados del formulario
  const [selectedProfesional, setSelectedProfesional] = useState<Profesional | null>(null);
  const [selectedServicio, setSelectedServicio] = useState<Servicio | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  // Estados para disponibilidad
  const [horariosDisponibles, setHorariosDisponibles] = useState<string[]>([]);
  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [mensajeHorarios, setMensajeHorarios] = useState<string | null>(null);
  const [profesionalNoTrabaja, setProfesionalNoTrabaja] = useState(false);
  
  // Estado para los días con disponibilidad del calendario
  const [diasConDisponibilidad, setDiasConDisponibilidad] = useState<number[]>([]);

  // Solo agregar estos estados mínimos
  const [proximaDisponibilidad, setProximaDisponibilidad] = useState<string | null>(null);
  const [cargandoDisponibilidadInicial, setCargandoDisponibilidadInicial] = useState(false);

  useEffect(() => {
    if (!tokens || !user?.negocio?.id) return;

    Promise.all([
      fetchProfesionales(tokens, user?.negocio?.id ?? 0),
      fetchServicios(tokens, user?.negocio?.id ?? 0)
    ]).then(([profData, servData]) => {
      setProfesionales(profData);
      setServicios(servData);
      
      // Auto-seleccionar profesional si hay solo uno o viene por parámetro
      if (profesionalIdParam) {
        const prof = profData.find(p => p.id === profesionalIdParam);
        if (prof) setSelectedProfesional(prof);
      } else if (profData.length === 1) {
        setSelectedProfesional(profData[0]);
      }
    }).catch(() => {
      setProfesionales([]);
      setServicios([]);
    }).finally(() => {
      setLoading(false);
    });
  }, [tokens, profesionalIdParam]);

  const isStep1Complete = !!selectedProfesional;
  const isStep2Complete = isStep1Complete && !!selectedServicio;
  const isStep3Complete = isStep2Complete && !!selectedDate && !!selectedTime;
  // Función para convertir fecha a string local sin problemas de zona horaria
  const formatDateForAPI = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  // Cargar horarios disponibles cuando se selecciona una fecha
  useEffect(() => {
    if (selectedProfesional && selectedServicio && selectedDate && tokens && user?.negocio?.id) {
      const fechaStr = formatDateForAPI(selectedDate); // Usar función local
      
      setLoadingHorarios(true);
      // Resetear estados anteriores
      setMensajeHorarios(null);
      setProfesionalNoTrabaja(false);
      setSelectedTime(null);
      
      obtenerHorariosDisponibles(tokens, selectedProfesional.id, fechaStr, selectedServicio.id, user?.negocio?.id)
        .then((response: HorariosResponse) => {
          setHorariosDisponibles(response.horarios);
          setMensajeHorarios(response.mensaje || null);
          setProfesionalNoTrabaja(response.profesionalNoTrabaja || false);
        })
        .catch((error) => {
          setHorariosDisponibles([]);
          setMensajeHorarios('Error al cargar horarios');
          setProfesionalNoTrabaja(false);
        })
        .finally(() => setLoadingHorarios(false));
    }
  }, [selectedProfesional, selectedServicio, selectedDate, tokens]);

  const formatDate = (date: Date) => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    const dayName = days[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const time = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    
    return `${dayName}, ${day} de ${month} del ${year}`;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  const showDatepicker = () => {
    if (isStep2Complete) {
      setShowDatePicker(true);
    }
  };

  const handleTimeSelection = () => {
    if (selectedDate) {
      // Si el profesional no trabaja este día, mostrar el modal con mensaje
      if (profesionalNoTrabaja) {
        setShowTimePicker(true);
        return;
      }
      setShowTimePicker(true);
    }
  };

  // Nueva función para cargar días con disponibilidad para el calendario
  const cargarDiasConDisponibilidad = async (fecha: Date, profesional?: Profesional, servicio?: Servicio) => {
    if (!tokens) return;
    
    const prof = profesional || selectedProfesional;
    const serv = servicio || selectedServicio;
    
    if (!prof || !serv) {
      console.log(' No se puede cargar disponibilidad - falta profesional o servicio');
      setDiasConDisponibilidad([]);
      return;
    }

    try {
      const año = fecha.getFullYear();
      const mes = fecha.getMonth() + 1; // Convertir 0-11 a 1-12 para el backend
      
      const diasDisponibles = await obtenerDiasConDisponibilidadOptimizada(
        año,
        mes, // Ya convertido a 1-12
        prof.id,
        serv.id,
        // Removido negocioId - la API ya no lo necesita como parámetro separado
      );
      
      setDiasConDisponibilidad(diasDisponibles);
      console.log(`Días con disponibilidad para ${año}/${mes}:`, diasDisponibles);
      
    } catch (error: any) {
      console.error('Error cargando días con disponibilidad:', error);
      setDiasConDisponibilidad([]);}
  };

  // Función simplificada para precargar disponibilidad
  const precargarDisponibilidad = async (profesional: Profesional) => {
    if (!tokens || !user?.negocio?.id || servicios.length === 0) return;

    setCargandoDisponibilidadInicial(true);

    try {
      // Próximos 7 días
      const fechas = [];
      for (let i = 0; i < 7; i++) {
        const fecha = new Date();
        fecha.setDate(fecha.getDate() + i);
        
        let label;
        if (i === 0) label = 'Hoy';
        else if (i === 1) label = 'Mañana';
        else {
          const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
          label = diasSemana[fecha.getDay()];
        }
        
        fechas.push({ fecha, label });
      }

      // Usar primeros 3 servicios para eficiencia
      const serviciosAProbar = servicios.slice(0, 3).map(s => s.id);

      for (const { fecha, label } of fechas) {
        const fechaStr = formatDateForAPI(fecha);

        for (const servicioId of serviciosAProbar) {
          try {
            const response = await obtenerHorariosDisponibles(
              tokens, 
              profesional.id,
              fechaStr, 
              servicioId,
              user?.negocio?.id ?? 0
            );

            if (response.horarios.length > 0) {
              const primerHorario = response.horarios[0];
              setProximaDisponibilidad(`${label} ${primerHorario}`);
              return; // Salir cuando encuentra disponibilidad
            }

            if (response.profesionalNoTrabaja) break;
          } catch (error) {
            continue;
          }
        }
      }

      // Si no encuentra disponibilidad
      setProximaDisponibilidad('Consultar disponibilidad');

    } catch (error) {
      setProximaDisponibilidad('Consultar disponibilidad');
    } finally {
      setCargandoDisponibilidadInicial(false);
    }
  };

  // Efecto corregido con dependencias completas
  useEffect(() => {
    if (selectedProfesional && servicios.length > 0 && !proximaDisponibilidad && !cargandoDisponibilidadInicial) {
      // Solo precargar si fue autoseleccionado (no viene por parámetro de navegación)
      const fuePrecargado = profesionales.length === 1 && !profesionalIdParam;
      
      if (fuePrecargado) {
        precargarDisponibilidad(selectedProfesional);
      }
    }
  }, [selectedProfesional, servicios, tokens, user?.negocio?.id, profesionales.length, profesionalIdParam, proximaDisponibilidad, cargandoDisponibilidadInicial]);

  // Limpiar disponibilidad cuando cambie el profesional
  useEffect(() => {
    setProximaDisponibilidad(null);
    setCargandoDisponibilidadInicial(false);
  }, [selectedProfesional?.id]);

  // Cargar días con disponibilidad cuando cambien profesional o servicio
  useEffect(() => {
    if (selectedProfesional && selectedServicio && tokens && user?.negocio?.id) {
      const currentDate = selectedDate || new Date();
      cargarDiasConDisponibilidad(currentDate, selectedProfesional, selectedServicio);
    } else {
      // Limpiar indicadores si no hay profesional o servicio seleccionado
      setDiasConDisponibilidad([]);
    }
  }, [selectedProfesional?.id, selectedServicio?.id, tokens, user?.negocio?.id]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

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
        <Text style={[styles.headerTitle, { color: colors.white }]}>Reserva de turno</Text>
        <View style={{ width: 20 }} />
      </View>

      {/* Contenido scrolleable */}
      <ScrollView 
        style={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContentContainer}
      >
        {/* 1: Seleccionar Profesional */}
        <View style={styles.stepContainer}>
          <Text style={[styles.stepTitle, { color: colors.text }]}>Profesional</Text>
          <TouchableOpacity
            style={[
              styles.inputContainer,
              { backgroundColor: colors.dark2 },
              selectedProfesional && { borderWidth: 1, borderColor: colors.primary }
            ]}
            onPress={() => {
              navigation.navigate('Profesionales', {
                onSelect: (profesional: Profesional) => {
                  setSelectedProfesional(profesional);
                  navigation.goBack();
                }
              });
            }}
          >
            {selectedProfesional ? (
              <View style={styles.selectedContent}>
                                <View style={styles.selectedInfo}>
                 {selectedProfesional.profile_picture_url ? (
                   <Image
                     source={{ uri: selectedProfesional.profile_picture_url }}
                     style={styles.foto}
                   />
                 ) : (
                   <View style={[styles.avatarContainer, { backgroundColor: colors.primary }]}>
                     <Icon name="person" size={24} color={colors.white} />
                   </View>
                 )}
                  <View>
                    <Text style={[styles.selectedName, { color: colors.text }]}>
                      {selectedProfesional.user_details.first_name} {selectedProfesional.user_details.last_name}
                    </Text>
                    <Text style={[styles.selectedDescription, { color: colors.textSecondary }]}>
                      {selectedProfesional.bio || 'Especialista en cortes modernos y clásicos con 6 años de experiencia'}
                    </Text>
                  </View>
                </View>
                <Icon name="chevron-forward" size={20} color={colors.white} />
              </View>
            ) : (
              <View style={styles.inputContent}>
                <Text style={[styles.inputPlaceholder, { color: colors.textSecondary }]}>¿Con quién querés atenderte?</Text>
                <Icon name="chevron-forward" size={20} color={colors.textSecondary} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* 2: Seleccionar Servicio */}
        <View style={[styles.stepContainer, !isStep1Complete && styles.stepDisabled]}>
          <Text style={[styles.stepTitle, { color: colors.text }, !isStep1Complete && { color: colors.dark3 }]}>Servicio</Text>
          <TouchableOpacity
            style={[
              styles.inputContainer,
              { backgroundColor: colors.dark2 },
              !isStep1Complete && { opacity: 0.7 },
              selectedServicio && { borderWidth: 1, borderColor: colors.primary }
            ]}
            disabled={!isStep1Complete}
            onPress={() => {
              if (isStep1Complete) {
                navigation.navigate('Servicios', {
                  onSelect: (servicio: Servicio) => {
                    setSelectedServicio(servicio);
                    navigation.goBack();
                  }
                });
              }
            }}
          >
            {selectedServicio ? (
              <View style={styles.selectedContent}>
                <View style={styles.selectedServiceInfo}>
                  <View style={[styles.selectedServiceIconContainer, { backgroundColor: colors.primary }]}>
                    <Icon
                      name={selectedServicio.icon_name || "stop"}
                      size={24}
                      color={colors.white}
                    />
                  </View>
                  <View style={styles.selectedServiceTextInfo}>
                    <Text style={[styles.selectedServiceName, { color: colors.text }]}>
                      {selectedServicio.name}
                    </Text>
                    <Text style={[styles.selectedServiceDescription, { color: colors.textSecondary }]}>
                      {selectedServicio.description || 'Servicio sin descripción'}
                    </Text>
                    <View style={styles.selectedServiceDetails}>
                      <View style={styles.selectedServiceDetailItem}>
                        <Icon name="time" size={12} color={colors.textSecondary} />
                        <Text style={[styles.selectedServiceDetailText, { color: colors.textSecondary }]}>
                          {selectedServicio.duration_minutes} min
                        </Text>
                      </View>
                      <View style={styles.selectedServiceDetailItem}>
                        <Icon name="cash" size={12} color={colors.textSecondary} />
                        <Text style={[styles.selectedServiceDetailText, { color: colors.textSecondary }]}>{formatearPrecio(selectedServicio.price)}</Text>
                      </View>
                    </View>
                  </View>
                </View>
                <Icon name="chevron-forward" size={20} color={colors.white} />
              </View>
            ) : (
              <View style={styles.inputContent}>
                <Text style={[
                  styles.inputPlaceholder,
                  { color: colors.textSecondary },
                  !isStep1Complete && { color: colors.textSecondary, opacity: 0.7 }
                ]}>
                  ¿Qué servicio vas a realizarte?
                </Text>
                <Icon 
                  name="chevron-forward" 
                  size={20} 
                  color={!isStep1Complete ? colors.textSecondary : colors.textSecondary} 
                />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* 3: Seleccionar Horario */}
        <View style={[styles.stepContainer, !isStep2Complete && styles.stepDisabled]}>
          <Text style={[styles.stepTitle, { color: colors.text }, !isStep2Complete && { color: colors.dark3 }]}>Fecha y horario</Text>
          
          {/* Información del turno */}
          <View style={[
            styles.appointmentInfo, 
            { backgroundColor: colors.dark2 },
            !isStep2Complete && { opacity: 0.7 },
            selectedTime && { borderWidth: 1, borderColor: colors.primary }
          ]}>
            
            {/* Información de disponibilidad del profesional */}
            {selectedProfesional && (proximaDisponibilidad || cargandoDisponibilidadInicial) && (
              <View style={styles.disponibilidadContainer}>
                <Icon name="time" size={12} color={colors.primary} />
                <Text style={[styles.disponibilidadText, { color: colors.primary }]}
                >
                  {cargandoDisponibilidadInicial 
                    ? 'Cargando disponibilidad...' 
                    : `Próximo turno: ${proximaDisponibilidad}`}
                </Text>
              </View>
            )}

            {/* Mostrar disponibilidad si viene de ProfesionalesScreen */}
            {selectedProfesional && !proximaDisponibilidad && !cargandoDisponibilidadInicial && 
             mostrarEstadoDisponibilidad(selectedProfesional as ProfesionalConDisponibilidad) && (
              <View style={styles.disponibilidadContainer}>
                <Icon name="time" size={12} color={colors.primary} />
                <Text style={[styles.disponibilidadText, { color: colors.primary }]}
                >
                  {mostrarEstadoDisponibilidad(selectedProfesional as ProfesionalConDisponibilidad)}
                </Text>
              </View>
            )}
            
            <Text style={[styles.appointmentDate, { color: colors.text }, !isStep2Complete && { opacity: 0.7 }]}>
              Tu turno será el día:
            </Text>
            <TouchableOpacity
              onPress={showDatepicker}
              disabled={!isStep2Complete}
              style={styles.selectableText}
            >
              <Text style={[
                styles.appointmentDateValue, 
                { color: colors.text },
                !isStep2Complete && { opacity: 0.7 },
                isStep2Complete && !selectedDate && { color: colors.primary, textDecorationLine: 'underline' }
              ]}>
                {selectedDate ? formatDate(selectedDate) : 'Seleccionar día'}
              </Text>
              {isStep2Complete && (
                <Icon 
                  name="chevron-down" 
                  size={16} 
                  color={colors.primary} 
                  style={{ marginLeft: 6, marginTop: -16 }}
                />
              )}
            </TouchableOpacity>
            
            <Text style={[styles.appointmentTime, { color: colors.text }, !isStep2Complete && { opacity: 0.7 }]}>
              Horarios disponibles:
            </Text>
            <TouchableOpacity
              onPress={handleTimeSelection}
              disabled={!selectedDate || loadingHorarios}
              style={styles.selectableText}
            >
              <Text style={[
                styles.appointmentTimeValue, 
                { color: colors.text },
                !selectedDate && { opacity: 0.7 },
                selectedDate && !selectedTime && { color: colors.primary, textDecorationLine: 'underline' }
              ]}>
                {loadingHorarios ? 'Cargando horarios...' :
                 selectedTime ? `${selectedTime} hs` :
                 selectedDate ? 'Seleccionar hora' : 'Seleccionar hora'}
              </Text>
              {selectedDate && horariosDisponibles.length > 0 && !selectedTime && (
                <Icon 
                  name="time" 
                  size={16} 
                  color={colors.primary} 
                  style={{ marginLeft: 6 }}
                />
              )}
              {selectedDate && (
                <Icon 
                  name="chevron-down" 
                  size={16} 
                  color={colors.primary} 
                  style={{ marginLeft: 6, marginTop: 3 }}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom Button */}
        <View>
          <TouchableOpacity
            style={[
              styles.nextButton,
              { backgroundColor: colors.primary },
              !isStep3Complete && { backgroundColor: colors.dark2, opacity: 0.7 }
            ]}
            disabled={!isStep3Complete}
            onPress={() => {
              if (isStep3Complete && selectedProfesional && selectedServicio && selectedDate && selectedTime) {
                navigation.navigate('ConfirmacionTurno', {
                  profesional: selectedProfesional,
                  servicio: selectedServicio,
                  fecha: selectedDate.toISOString(),
                  hora: selectedTime,
                });
              }
            }}
          >
            <Text style={[
              styles.nextButtonText,
              { color: colors.white },
              !isStep3Complete && { color: colors.light3 }
            ]}>
              Siguiente
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Calendario Modal */}
      <CalendarModal
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        selectedDate={selectedDate || new Date()}
        onSelectDate={(date: Date) => {
          setSelectedDate(date);
          setHorariosDisponibles([]);
          setSelectedTime(null);
          setLoadingHorarios(false);
        }}
        onMonthChange={(date: Date) => {
          // Recargar disponibilidad cuando cambie de mes
          cargarDiasConDisponibilidad(date);
        }}
        diasConIndicadores={diasConDisponibilidad} // Usar el estado con días disponibles
        title="Seleccionar fecha"
        minimumDate={(() => {
          const today = new Date();
          today.setHours(0, 0, 0, 0); // Medianoche
          return today;
        })()}
        maximumDate={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)}
      />

      {/* Time Picker Modal */}
      {showTimePicker && (
        <View style={styles.timePickerOverlay}>
          <View style={[styles.timePickerContainer, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={styles.timePickerHeader}>
              <TouchableOpacity onPress={() => setShowTimePicker(false)} style={styles.closeButton}>
                <Icon name="close" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.timePickerTitle, { color: colors.text }]}>Seleccionar hora</Text>
              <View style={{ width: 24 }} />
            </View>

            {/* Horarios disponibles */}
            <ScrollView style={styles.timePickerContent} showsVerticalScrollIndicator={false}>
              {profesionalNoTrabaja ? (
                <View style={styles.noWorkDayContainer}>
                  <Icon name="calendar-outline" size={48} color={colors.primary} style={styles.noTimesIcon} />
                  <Text style={[styles.noWorkDayMessage, { color: colors.text }]}>
                    {mensajeHorarios || 'El profesional no trabaja este día'}
                  </Text>
                  <Text style={[styles.noWorkDaySubMessage, { color: colors.primary }]}>
                    Por favor selecciona otra fecha
                  </Text>
                </View>
              ) : horariosDisponibles.length === 0 && !loadingHorarios ? (
                <View style={styles.noTimesContainer}>
                  <Icon name="calendar-outline" size={48} color={colors.primary} style={styles.noTimesIcon} />
                  <Text style={[styles.noTimesMessage, { color: colors.text }]}>
                    Se agotaron los turnos de este día
                  </Text>
                  <Text style={[styles.noTimesSubMessage, { color: colors.primary }]}>
                    Por favor selecciona otra fecha
                  </Text>
                </View>
              ) : (
                <View style={styles.timeGrid}>
                  {horariosDisponibles.map((horario, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.timeSlot,
                        { backgroundColor: colors.dark2 },
                        selectedTime === horario && { backgroundColor: colors.primary, borderWidth: 1, borderColor: colors.primary }
                      ]}
                      onPress={() => {
                        setSelectedTime(horario);
                        setShowTimePicker(false);
                      }}
                    >
                      <Text style={[
                        styles.timeSlotText,
                        { color: colors.text },
                        selectedTime === horario && { color: colors.text }
                      ]}>
                        {horario}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      )}
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
  loadingText: {
    fontSize: 16,
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
  stepContainer: {
    marginBottom: 32,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  inputContainer: {
    borderRadius: 12,
    padding: 20,
    minHeight: 60,
  },
  selectedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  selectedName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  selectedDescription: {
    fontSize: 12,
    lineHeight: 16,
    maxWidth: 220
  },
  selectedServiceName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  selectedServiceDescription: {
    fontSize: 12,
    marginBottom: 4,
  },
  selectedServiceDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedServiceDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  selectedServiceDetailText: {
    fontSize: 12,
    marginLeft: 4,
  },
  stepDisabled: {
    opacity: 0.8,
  },
  inputContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputPlaceholder: {
    fontSize: 14,
  },
  selectableText: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  appointmentInfo: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  appointmentDate: {
    fontSize: 14,
    marginBottom: 4,
  },
  appointmentDateValue: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  appointmentTime: {
    fontSize: 14,
    marginBottom: 4,
  },
  appointmentTimeValue: {
    fontSize: 16,
    fontWeight: '600',
  },

  nextButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  foto: {
    width: 52,
    height: 52,
    borderRadius: 24,
    marginRight: 16,
  },
  timePickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timePickerContainer: {
    padding: 20,
    borderRadius: 12,
    width: '90%',
    maxWidth: 400,
  },
  timePickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  timePickerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  timePickerContent: {
    // Add any specific styles for the ScrollView if needed
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: 10,
  },
  timeSlot: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '30%', // Adjust as needed for grid layout
  },
  timeSlotText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Estilos para cuando el profesional no trabaja
  noWorkDayContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  noWorkDayIcon: {
    marginBottom: 16,
  },
  noWorkDayMessage: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  noWorkDaySubMessage: {
    fontSize: 14,
    textAlign: 'center',
  },
  // Estilos para cuando no hay horarios disponibles
  noTimesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  noTimesIcon: {
    marginBottom: 16,
  },
  noTimesMessage: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  noTimesSubMessage: {
    fontSize: 14,
    textAlign: 'center',
  },
  selectedServiceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectedServiceIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  selectedServiceTextInfo: {
    flex: 1,
  },
  disponibilidadContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  disponibilidadText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
});
