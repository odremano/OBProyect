import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert, SafeAreaView } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import Icon from 'react-native-vector-icons/Ionicons';
import { reservarTurno } from '../api/turnos';

type Props = NativeStackScreenProps<RootStackParamList, 'ConfirmacionTurno'>;

export default function ConfirmacionTurnoScreen({ route, navigation }: Props) {
  const { colors } = useTheme();
  const { tokens } = useContext(AuthContext);
  const { profesional, servicio, fecha, hora } = route.params;
  const [loading, setLoading] = useState(false);

  const formatDate = (date: Date) => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    const dayName = days[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    return `${dayName}, ${day} de ${month} del ${year}`;
  };

  const handleConfirmarReserva = async () => {
    if (!tokens) return;

    setLoading(true);
    try {
      // Combinar fecha y hora seleccionadas
      const fechaStr = fecha.toISOString().split('T')[0]; // YYYY-MM-DD
      const fechaHoraFormateada = `${fechaStr}T${hora}:00`;
      
      const result = await reservarTurno(tokens, {
        profesional: profesional.id,
        servicio: servicio.id,
        start_datetime: fechaHoraFormateada,
      });
      
      if (result.success) {
        Alert.alert(
          'Turno confirmado',
          'Tu turno ha sido reservado exitosamente',
          [
            {
              text: 'Aceptar',
              onPress: () => {
                // Resetear el stack de navegación para evitar volver a la confirmación
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'MainTabs' }],
                });
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', result.message || 'No se pudo reservar el turno');
      }
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error al reservar el turno');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header fijo */}
      <View style={[styles.header, { backgroundColor: colors.primaryDark }]}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.white }]}>Confirmación</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Contenido scrolleable */}
      <ScrollView 
        style={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContentContainer}
      >
        {/* Título de confirmación */}
        <View style={styles.confirmationHeader}>
          <View style={styles.checkIconContainer}>
            <Icon name="checkmark-circle" size={48} color={colors.primary} />
          </View>
          <Text style={[styles.confirmationTitle, { color: colors.text }]}>Confirma tu turno</Text>
          <Text style={[styles.confirmationSubtitle, { color: colors.textSecondary }]}>Revisa los detalles de tu reserva antes de confirmar</Text>
        </View>

        {/* Información del turno */}
        <View style={[styles.appointmentCard, { backgroundColor: colors.dark2 }]}>
          {/* Profesional */}
          <View style={styles.infoSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Profesional</Text>
            <View style={styles.professionalInfo}>
              {profesional.profile_picture_url ? (
                <Image
                  source={{ uri: profesional.profile_picture_url }}
                  style={styles.professionalPhoto}
                />
              ) : (
                <View style={[styles.professionalAvatar, { backgroundColor: colors.primary }]}>
                  <Icon name="person" size={24} color={colors.white} />
                </View>
              )}
              <View style={styles.professionalDetails}>
                <Text style={[styles.professionalName, { color: colors.text }]}>
                  {profesional.user_details.first_name} {profesional.user_details.last_name}
                </Text>
                <Text style={[styles.professionalBio, { color: colors.textSecondary }]}>
                  {profesional.bio || 'Especialista en cortes modernos y clásicos'}
                </Text>
              </View>
            </View>
          </View>

          {/* Servicio */}
          <View style={styles.infoSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Servicio</Text>
            <View style={styles.serviceInfo}>
              <View style={[styles.serviceIconContainer, { backgroundColor: colors.primary }]}>
                <Icon name="cut" size={24} color={colors.white} />
              </View>
              <View style={styles.serviceDetails}>
                <Text style={[styles.serviceName, { color: colors.text }]}>{servicio.name}</Text>
                <Text style={[styles.serviceDescription, { color: colors.textSecondary }]}>
                  {servicio.description || 'Servicio profesional de barbería'}
                </Text>
              </View>
            </View>
          </View>

          {/* Fecha y hora */}
          <View style={styles.infoSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Fecha y hora</Text>
            <View style={styles.dateTimeInfo}>
              <View style={styles.dateTimeItem}>
                <Icon name="calendar" size={20} color={colors.primary} />
                <Text style={[styles.dateTimeText, { color: colors.text }]}>{formatDate(fecha)}</Text>
              </View>
              <View style={styles.dateTimeItem}>
                <Icon name="time" size={20} color={colors.primary} />
                <Text style={[styles.dateTimeText, { color: colors.text }]}>{hora} hs</Text>
              </View>
            </View>
          </View>

          {/* Resumen */}
          <View style={[styles.summarySection, { borderTopColor: colors.dark3 }]}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Duración estimada:</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>{servicio.duration_minutes} minutos</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Precio:</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>${servicio.price}</Text>
            </View>
          </View>
        </View>

        {/* Nota informativa */}
        <View style={[styles.noteContainer, { backgroundColor: colors.dark2 }]}>
          <Icon name="information-circle" size={16} color={colors.primaryDark} />
          <Text style={[styles.noteText, { color: colors.text }]}>Puedes cancelar tu turno hasta 2 horas antes del horario programado</Text>
        </View>

        {/* Botón de confirmación */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[
              styles.confirmButton,
              { backgroundColor: colors.primary },
              loading && { backgroundColor: colors.dark2, opacity: 0.7 }
            ]}
            disabled={loading}
            onPress={handleConfirmarReserva}
          >
            <Text style={[styles.confirmButtonText, { color: colors.white }]}>
              {loading ? 'Reservando...' : 'Reservar turno'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

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
  confirmationHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  checkIconContainer: {
    marginBottom: 16,
  },
  confirmationTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  confirmationSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  appointmentCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
  },
  infoSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  professionalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  professionalPhoto: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 16,
  },
  professionalAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  professionalDetails: {
    flex: 1,
    marginTop: 5
  },
  professionalName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  professionalBio: {
    fontSize: 12,
    lineHeight: 16,
  },
  serviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  serviceDetails: {
    flex: 1,
    marginTop: 5
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 12,
    marginBottom: 8,
  },
  serviceSpecs: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceSpecItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  serviceSpecText: {
    fontSize: 12,
    marginLeft: 4,
  },
  dateTimeInfo: {
    gap: 12,
    marginTop: 5
  },
  dateTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateTimeText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  summarySection: {
    borderTopWidth: 1,
    paddingTop: 16,
    marginTop: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  noteText: {
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
  bottomContainer: {
    // Sin padding adicional ya que está en contentContainerStyle
  },
  confirmButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 