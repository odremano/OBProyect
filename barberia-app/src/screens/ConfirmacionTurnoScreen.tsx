import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert, SafeAreaView } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import Icon from 'react-native-vector-icons/Ionicons';
import colors from '../theme/colors';
import { reservarTurno } from '../api/turnos';

type Props = NativeStackScreenProps<RootStackParamList, 'ConfirmacionTurno'>;

export default function ConfirmacionTurnoScreen({ route, navigation }: Props) {
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
    <View style={styles.container}>
      {/* Header fijo */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirmación</Text>
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
          <Text style={styles.confirmationTitle}>Confirma tu turno</Text>
          <Text style={styles.confirmationSubtitle}>
            Revisa los detalles de tu reserva antes de confirmar
          </Text>
        </View>

        {/* Información del turno */}
        <View style={styles.appointmentCard}>
          {/* Profesional */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Profesional</Text>
            <View style={styles.professionalInfo}>
              {profesional.profile_picture_url ? (
                <Image
                  source={{ uri: profesional.profile_picture_url }}
                  style={styles.professionalPhoto}
                />
              ) : (
                <View style={styles.professionalAvatar}>
                  <Icon name="person" size={24} color={colors.white} />
                </View>
              )}
              <View style={styles.professionalDetails}>
                <Text style={styles.professionalName}>
                  {profesional.user_details.first_name} {profesional.user_details.last_name}
                </Text>
                <Text style={styles.professionalBio}>
                  {profesional.bio || 'Especialista en cortes modernos y clásicos'}
                </Text>
              </View>
            </View>
          </View>

          {/* Servicio */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Servicio</Text>
            <View style={styles.serviceInfo}>
              <View style={styles.serviceIconContainer}>
                <Icon name="cut" size={20} color={colors.white} />
              </View>
              <View style={styles.serviceDetails}>
                <Text style={styles.serviceName}>{servicio.name}</Text>
                <Text style={styles.serviceDescription}>
                  {servicio.description || 'Servicio profesional de barbería'}
                </Text>
              </View>
            </View>
          </View>

          {/* Fecha y hora */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Fecha y hora</Text>
            <View style={styles.dateTimeInfo}>
              <View style={styles.dateTimeItem}>
                <Icon name="calendar" size={20} color={colors.primary} />
                <Text style={styles.dateTimeText}>{formatDate(fecha)}</Text>
              </View>
              <View style={styles.dateTimeItem}>
                <Icon name="time" size={20} color={colors.primary} />
                <Text style={styles.dateTimeText}>{hora} hs</Text>
              </View>
            </View>
          </View>

          {/* Resumen */}
          <View style={styles.summarySection}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Duración estimada:</Text>
              <Text style={styles.summaryValue}>{servicio.duration_minutes} minutos</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Precio:</Text>
              <Text style={styles.summaryValue}>${servicio.price}</Text>
            </View>
          </View>
        </View>

        {/* Nota informativa */}
        <View style={styles.noteContainer}>
          <Icon name="information-circle" size={16} color={colors.light3} />
          <Text style={styles.noteText}>
            Puedes cancelar tu turno hasta 2 horas antes del horario programado
          </Text>
        </View>

        {/* Botón de confirmación */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[styles.confirmButton, loading && styles.confirmButtonDisabled]}
            disabled={loading}
            onPress={handleConfirmarReserva}
          >
            <Text style={styles.confirmButtonText}>
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
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    backgroundColor: colors.primaryDark,
    paddingHorizontal: 20,
  },
  backButton: {
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
    color: colors.white,
    marginBottom: 8,
  },
  confirmationSubtitle: {
    fontSize: 14,
    color: colors.light3,
    textAlign: 'center',
    lineHeight: 20,
  },
  appointmentCard: {
    backgroundColor: colors.dark2,
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
    color: colors.light3,
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
    backgroundColor: colors.primary,
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
    color: colors.white,
    marginBottom: 4,
  },
  professionalBio: {
    fontSize: 12,
    color: colors.light3,
    lineHeight: 16,
  },
  serviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
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
    color: colors.white,
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 12,
    color: colors.light3,
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
    color: colors.light3,
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
    color: colors.white,
    marginLeft: 12,
  },
  summarySection: {
    borderTopWidth: 1,
    borderTopColor: colors.dark3,
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
    color: colors.light3,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.dark2,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  noteText: {
    fontSize: 12,
    color: colors.light3,
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
  bottomContainer: {
    // Sin padding adicional ya que está en contentContainerStyle
  },
  confirmButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: colors.dark2,
    opacity: 0.7,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
}); 