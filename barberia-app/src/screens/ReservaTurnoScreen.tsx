import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Image, Platform } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { fetchProfesionales, Profesional } from '../api/profesionales';
import { fetchServicios, Servicio } from '../api/servicios';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/Ionicons';
import { reservarTurno, obtenerHorariosDisponibles, HorariosResponse } from '../api/turnos';
import { formatearPrecio } from './VerAgendaScreen';

type Props = NativeStackScreenProps<RootStackParamList, 'ReservaTurno'>;

export default function ReservaTurnoScreen({ route, navigation }: Props) {
  const { colors } = useTheme();
  const { tokens, negocioId } = useContext(AuthContext);
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

  useEffect(() => {
    if (!tokens || negocioId == null) return;

    // Logs para debug
    console.log('tokens:', tokens);
    console.log('negocioId:', negocioId);

    Promise.all([
      fetchProfesionales(tokens, negocioId),
      fetchServicios(tokens, negocioId)
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
    if (selectedProfesional && selectedServicio && selectedDate && tokens && negocioId) {
      const fechaStr = formatDateForAPI(selectedDate); // Usar función local
      
      setLoadingHorarios(true);
      // Resetear estados anteriores
      setMensajeHorarios(null);
      setProfesionalNoTrabaja(false);
      setSelectedTime(null);
      
      obtenerHorariosDisponibles(tokens, selectedProfesional.id, fechaStr, selectedServicio.id, negocioId)
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

  const handleDateChange = (event: any, selectedDatePicker?: Date) => {
    // 1. Ocultar el picker inmediatamente
    setShowDatePicker(false);

    // 2. Si se seleccionó una fecha, actualizar el estado
    if (selectedDatePicker) {
      // Actualizar la fecha seleccionada
      setSelectedDate(selectedDatePicker);
      setSelectedTime(null); // Reset time when date changes
      setHorariosDisponibles([]); // Clear previous times
    }
  };

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
      // Si el profesional no trabaja este día, no cargar horarios simulados
      if (profesionalNoTrabaja) {
        setShowTimePicker(true);
      return;
      }
      
      // Si no hay horarios de la API y el profesional sí trabaja, usar horarios simulados
      if (horariosDisponibles.length === 0 && !loadingHorarios) {
        const horariosSimulados = ['10:00', '10:30', '11:00', '11:30', '12:00', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'];
        setHorariosDisponibles(horariosSimulados);
      }
      
      setShowTimePicker(true);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>Cargando...</Text>
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
        <Text style={[styles.headerTitle, { color: colors.white }]}>Reservar turno</Text>
        <View style={{ width: 20 }} />
      </View>

      {/* Contenido scrolleable */}
      <ScrollView 
        style={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContentContainer}
      >
        {/* Step 1: Seleccionar Profesional */}
        <View style={styles.stepContainer}>
          <Text style={[styles.stepTitle, { color: colors.text }]}>Selecciona el profesional</Text>
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
                <Text style={[styles.inputPlaceholder, { color: colors.textSecondary }]}>¿Con quién quieres atenderte?</Text>
                <Icon name="chevron-forward" size={20} color={colors.textSecondary} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Step 2: Seleccionar Servicio */}
        <View style={[styles.stepContainer, !isStep1Complete && styles.stepDisabled]}>
          <Text style={[styles.stepTitle, { color: colors.text }, !isStep1Complete && { color: colors.dark3 }]}>Selecciona servicio</Text>
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
                    <Icon name="cut" size={24} color={colors.white} />
                  </View>
                  <View style={styles.selectedServiceTextInfo}>
                    <Text style={[styles.selectedServiceName, { color: colors.text }]}>
                      {selectedServicio.name}
                    </Text>
                    <Text style={[styles.selectedServiceDescription, { color: colors.textSecondary }]}>
                      {selectedServicio.description || 'Servicio profesional de barbería'}
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

        {/* Step 3: Seleccionar Horario */}
        <View style={[styles.stepContainer, !isStep2Complete && styles.stepDisabled]}>
          <Text style={[styles.stepTitle, { color: colors.text }, !isStep2Complete && { color: colors.dark3 }]}>Selecciona horario</Text>
          
          {/* Información del turno */}
          <View style={[
            styles.appointmentInfo, 
            { backgroundColor: colors.dark2 },
            !isStep2Complete && { opacity: 0.7 },
            selectedTime && { borderWidth: 1, borderColor: colors.primary }
          ]}>
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
        <View style={styles.bottomContainer}>
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
                  fecha: selectedDate,
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

      {/* Date Picker Modal */}
      {showDatePicker && (
        <View style={styles.datePickerOverlay}>
          <View style={[styles.datePickerContainer, { backgroundColor: colors.background }]}>
            <DateTimePicker
              testID="dateTimePicker"
              value={selectedDate || new Date()}
              mode="date"
              display="default"
              onChange={handleDateChange}
          minimumDate={new Date()}
              maximumDate={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)} // 30 días adelante
            />
          </View>
        </View>
      )}

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
                  <Icon name="calendar-outline" size={48} color={colors.primary} style={styles.noWorkDayIcon} />
                  <Text style={[styles.noWorkDayMessage, { color: colors.text }]}>
                    {mensajeHorarios || 'El profesional no trabaja este día'}
                  </Text>
                  <Text style={[styles.noWorkDaySubMessage, { color: colors.primary }]}>
                    Por favor selecciona otra fecha
                  </Text>
                </View>
              ) : horariosDisponibles.length === 0 && !loadingHorarios ? (
                <View style={styles.noTimesContainer}>
                  <Icon name="time-outline" size={48} color={colors.light3} style={styles.noTimesIcon} />
                  <Text style={[styles.noTimesMessage, { color: colors.text }]}>
                    No hay horarios disponibles para esta fecha
                  </Text>
                  <Text style={[styles.noTimesSubMessage, { color: colors.primary }]}>
                    Intenta con otra fecha
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
  bottomContainer: {
    // Sin padding adicional ya que está en contentContainerStyle
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
  datePickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerContainer: {
    padding: 20,
    borderRadius: 12,
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
    marginBottom: 20,
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
});
