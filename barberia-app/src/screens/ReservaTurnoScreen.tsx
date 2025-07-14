import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Image, Platform } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { fetchProfesionales, Profesional } from '../api/profesionales';
import { fetchServicios, Servicio } from '../api/servicios';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/Ionicons';
import colors from '../theme/colors';
import { reservarTurno, obtenerHorariosDisponibles, HorariosResponse } from '../api/turnos';

type Props = NativeStackScreenProps<RootStackParamList, 'ReservaTurno'>;

export default function ReservaTurnoScreen({ route, navigation }: Props) {
  const { tokens } = useContext(AuthContext);
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
    if (!tokens) return;

    Promise.all([
      fetchProfesionales(tokens),
    fetchServicios(tokens)
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

  // Cargar horarios disponibles cuando se selecciona una fecha
  useEffect(() => {
    if (selectedProfesional && selectedServicio && selectedDate && tokens) {
      const fechaStr = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD
      
      setLoadingHorarios(true);
      // Resetear estados anteriores
      setMensajeHorarios(null);
      setProfesionalNoTrabaja(false);
      setSelectedTime(null);
      
      obtenerHorariosDisponibles(tokens, selectedProfesional.id, fechaStr, selectedServicio.id)
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
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
        <Text style={styles.headerTitle}>Reservar turno</Text>
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
          <Text style={styles.stepTitle}>Selecciona el profesional</Text>
          <TouchableOpacity
            style={[
              styles.inputContainer,
              selectedProfesional && styles.inputContainerSelected
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
                   <View style={styles.avatarContainer}>
                     <Icon name="person" size={24} color={colors.white} />
                   </View>
                 )}
                  <View>
                    <Text style={styles.selectedName}>
                      {selectedProfesional.user_details.first_name} {selectedProfesional.user_details.last_name}
                    </Text>
                    <Text style={styles.selectedDescription}>
                      {selectedProfesional.bio || 'Especialista en cortes modernos y clásicos con 6 años de experiencia'}
                    </Text>
                  </View>
                </View>
                <Icon name="chevron-forward" size={20} color={colors.white} />
              </View>
            ) : (
              <View style={styles.inputContent}>
                <Text style={styles.inputPlaceholder}>¿Con quién quieres atenderte?</Text>
                <Icon name="chevron-forward" size={20} color={colors.light2} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Step 2: Seleccionar Servicio */}
        <View style={[styles.stepContainer, !isStep1Complete && styles.stepDisabled]}>
          <Text style={[styles.stepTitle, !isStep1Complete && styles.stepTitleDisabled]}>Selecciona servicio</Text>
          <TouchableOpacity
            style={[
              styles.inputContainer,
              !isStep1Complete && styles.inputContainerDisabled,
              selectedServicio && styles.inputContainerSelected
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
                  <View style={styles.selectedServiceIconContainer}>
                    <Icon name="cut" size={24} color={colors.white} />
                  </View>
                  <View style={styles.selectedServiceTextInfo}>
                    <Text style={styles.selectedServiceName}>
                      {selectedServicio.name}
                    </Text>
                    <Text style={styles.selectedServiceDescription}>
                      {selectedServicio.description || 'Servicio profesional de barbería'}
                    </Text>
                    <View style={styles.selectedServiceDetails}>
                      <View style={styles.selectedServiceDetailItem}>
                        <Icon name="time" size={12} color={colors.light3} />
                        <Text style={styles.selectedServiceDetailText}>
                          {selectedServicio.duration_minutes} min
                        </Text>
                      </View>
                      <View style={styles.selectedServiceDetailItem}>
                        <Icon name="cash" size={12} color={colors.light3} />
                        <Text style={styles.selectedServiceDetailText}>
                          ${selectedServicio.price}
                        </Text>
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
                  !isStep1Complete && styles.inputPlaceholderDisabled
                ]}>
                  ¿Qué servicio vas a realizarte?
                </Text>
                <Icon 
                  name="chevron-forward" 
                  size={20} 
                  color={!isStep1Complete ? colors.dark3 : colors.light3} 
                />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Step 3: Seleccionar Horario */}
        <View style={[styles.stepContainer, !isStep2Complete && styles.stepDisabled]}>
          <Text style={[styles.stepTitle, !isStep2Complete && styles.stepTitleDisabled]}>Selecciona horario</Text>
          
          {/* Información del turno */}
          <View style={[
            styles.appointmentInfo, 
            !isStep2Complete && styles.appointmentInfoDisabled,
            selectedTime && styles.appointmentInfoSelected
          ]}>
            <Text style={[styles.appointmentDate, !isStep2Complete && styles.appointmentTextDisabled]}>
              Tu turno será el día:
            </Text>
            <TouchableOpacity
              onPress={showDatepicker}
              disabled={!isStep2Complete}
              style={styles.selectableText}
            >
              <Text style={[
                styles.appointmentDateValue, 
                !isStep2Complete && styles.appointmentTextDisabled,
                isStep2Complete && !selectedDate && styles.selectableTextActive
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
            
            <Text style={[styles.appointmentTime, !isStep2Complete && styles.appointmentTextDisabled]}>
              Horarios disponibles:
            </Text>
            <TouchableOpacity
              onPress={handleTimeSelection}
              disabled={!selectedDate || loadingHorarios}
              style={styles.selectableText}
            >
              <Text style={[
                styles.appointmentTimeValue, 
                !selectedDate && styles.appointmentTextDisabled,
                selectedDate && !selectedTime && styles.selectableTextActive
              ]}>
                {loadingHorarios ? 'Cargando horarios...' :
                 selectedTime ? selectedTime :
                 selectedDate ? 'Seleccionar hora' : 'Seleccionar hora'}
              </Text>
              {selectedDate && horariosDisponibles.length > 0 && (
                <Icon 
                  name="time" 
                  size={16} 
                  color={selectedTime ? colors.white : colors.primary} 
                  style={{ marginLeft: 8 }}
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
              !isStep3Complete && styles.nextButtonDisabled
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
              !isStep3Complete && styles.nextButtonTextDisabled
            ]}>
              Siguiente
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <View style={styles.datePickerOverlay}>
          <View style={styles.datePickerContainer}>
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
          <View style={styles.timePickerContainer}>
            {/* Header */}
            <View style={styles.timePickerHeader}>
              <TouchableOpacity onPress={() => setShowTimePicker(false)} style={styles.closeButton}>
                <Icon name="close" size={24} color={colors.white} />
              </TouchableOpacity>
              <Text style={styles.timePickerTitle}>Seleccionar hora</Text>
              <View style={{ width: 24 }} />
            </View>

            {/* Horarios disponibles */}
            <ScrollView style={styles.timePickerContent} showsVerticalScrollIndicator={false}>
              {profesionalNoTrabaja ? (
                <View style={styles.noWorkDayContainer}>
                  <Icon name="calendar-outline" size={48} color={colors.light3} style={styles.noWorkDayIcon} />
                  <Text style={styles.noWorkDayMessage}>
                    {mensajeHorarios || 'El profesional no trabaja este día'}
                  </Text>
                  <Text style={styles.noWorkDaySubMessage}>
                    Por favor selecciona otra fecha
                  </Text>
                </View>
              ) : horariosDisponibles.length === 0 && !loadingHorarios ? (
                <View style={styles.noTimesContainer}>
                  <Icon name="time-outline" size={48} color={colors.light3} style={styles.noTimesIcon} />
                  <Text style={styles.noTimesMessage}>
                    No hay horarios disponibles para esta fecha
                  </Text>
                  <Text style={styles.noTimesSubMessage}>
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
                        selectedTime === horario && styles.timeSlotSelected
                      ]}
                      onPress={() => {
                        setSelectedTime(horario);
                        setShowTimePicker(false);
                      }}
                    >
                      <Text style={[
                        styles.timeSlotText,
                        selectedTime === horario && styles.timeSlotTextSelected
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
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.white,
    fontSize: 16,
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
  stepContainer: {
    marginBottom: 32,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
    marginBottom: 16,
  },
  inputContainer: {
    backgroundColor: colors.dark2,
    borderRadius: 12,
    padding: 20,
    minHeight: 60,
  },
  inputContainerSelected: {
    backgroundColor: colors.dark2,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  inputContainerDisabled: {
    backgroundColor: colors.dark2,
    opacity: 0.7,
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
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  selectedName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
    marginBottom: 4,
  },
  selectedDescription: {
    fontSize: 12,
    color: colors.light3,
    lineHeight: 16,
    maxWidth: 220
  },
  selectedServiceName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
    marginBottom: 4,
  },
  selectedServiceDescription: {
    fontSize: 12,
    color: colors.light3,
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
    color: colors.light3,
    marginLeft: 4,
  },
  stepDisabled: {
    opacity: 0.8,
  },
  stepTitleDisabled: {
    color: colors.dark3,
  },
  inputContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputPlaceholder: {
    fontSize: 14,
    color: colors.light2,
  },
  inputPlaceholderDisabled: {
    color: colors.light3,
    opacity: 0.7,
  },
  placeholderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  placeholderText: {
    fontSize: 14,
    color: colors.light2,
  },
  placeholderTextDisabled: {
    color: colors.dark3,
  },
  appointmentInfoDisabled: {
    opacity: 0.7,
  },
  appointmentTextDisabled: {
    color: colors.light3,
    opacity: 0.7
  },
  selectableText: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  selectableTextActive: {
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  appointmentInfo: {
    backgroundColor: colors.dark2,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    
  },
  appointmentInfoSelected: {
    borderWidth: 1,
    borderColor: colors.primary,
  },
  appointmentDate: {
    fontSize: 14,
    color: colors.light3,
    marginBottom: 4,
  },
  appointmentDateValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
    marginBottom: 16,
  },
  appointmentTime: {
    fontSize: 14,
    color: colors.light3,
    marginBottom: 4,
  },
  appointmentTimeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  bottomContainer: {
    // Sin padding adicional ya que está en contentContainerStyle
  },
  nextButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: colors.dark2,
    opacity: 0.7,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  nextButtonTextDisabled: {
    color: colors.light3,
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
    backgroundColor: colors.background,
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
    backgroundColor: colors.background,
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
    color: colors.white,
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
    backgroundColor: colors.dark2,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '30%', // Adjust as needed for grid layout
  },
  timeSlotSelected: {
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  timeSlotText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  timeSlotTextSelected: {
    color: colors.white,
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
    color: colors.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  noWorkDaySubMessage: {
    fontSize: 14,
    color: colors.light3,
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
    color: colors.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  noTimesSubMessage: {
    fontSize: 14,
    color: colors.light3,
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
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  selectedServiceTextInfo: {
    flex: 1,
  },
});
