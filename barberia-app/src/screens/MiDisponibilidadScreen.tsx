import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Platform, Modal, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { fetchDisponibilidad, saveDisponibilidad, DisponibilidadDia } from '../api/disponibilidad';
import { useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNotifications } from '../hooks/useNotifications';

interface DayAvailability {
  id: number;
  name: string;
  enabled: boolean;
  startTime: Date;
  endTime: Date;
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const MiDisponibilidadScreen = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { showSuccess, showError } = useNotifications();
  const { tokens } = useContext(AuthContext);
  
  const [loading, setLoading] = useState(true);

  const createWeekStructure = (): DayAvailability[] => [
    { id: 0, name: 'Lunes', enabled: false, startTime: new Date(1970, 0, 1, 9, 0), endTime: new Date(1970, 0, 1, 18, 0) },
    { id: 1, name: 'Martes', enabled: false, startTime: new Date(1970, 0, 1, 9, 0), endTime: new Date(1970, 0, 1, 18, 0) },
    { id: 2, name: 'Miércoles', enabled: false, startTime: new Date(1970, 0, 1, 9, 0), endTime: new Date(1970, 0, 1, 18, 0) },
    { id: 3, name: 'Jueves', enabled: false, startTime: new Date(1970, 0, 1, 9, 0), endTime: new Date(1970, 0, 1, 18, 0) },
    { id: 4, name: 'Viernes', enabled: false, startTime: new Date(1970, 0, 1, 9, 0), endTime: new Date(1970, 0, 1, 18, 0) },
    { id: 5, name: 'Sábado', enabled: false, startTime: new Date(1970, 0, 1, 9, 0), endTime: new Date(1970, 0, 1, 18, 0) },
    { id: 6, name: 'Domingo', enabled: false, startTime: new Date(1970, 0, 1, 9, 0), endTime: new Date(1970, 0, 1, 18, 0) },
  ];
  
  const [availability, setAvailability] = useState<DayAvailability[]>([]);

  const [showTimePicker, setShowTimePicker] = useState<{
    visible: boolean;
    dayId: number;
    field: 'startTime' | 'endTime';
  }>({ visible: false, dayId: -1, field: 'startTime' });

  const [tempTime, setTempTime] = useState<Date | null>(null);
  const [androidPicker, setAndroidPicker] = useState<{
    visible: boolean;
    dayId: number;
    field: 'startTime' | 'endTime';
  }>({ visible: false, dayId: -1, field: 'startTime' });

  const toggleDay = (dayId: number) => {
    setAvailability(prev => prev.map(day => 
      day.id === dayId 
        ? { ...day, enabled: !day.enabled }
        : day
    ));
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const openTimePicker = (dayId: number, field: 'startTime' | 'endTime') => {
    const current = availability.find(d => d.id === dayId)?.[field] || new Date();
    
    if (Platform.OS === 'ios') {
      setTempTime(current);
      setShowTimePicker({ visible: true, dayId, field });
    } else {
      setAndroidPicker({ visible: true, dayId, field });
    }
  };

  const onTimeChangeIOS = (event: any, selectedTime?: Date) => {
    if (selectedTime) {
      setTempTime(selectedTime);
    }
  };

  const onTimeChangeAndroid = (event: any, selectedTime?: Date) => {
    if (event?.type === 'dismissed') {
      setAndroidPicker({ visible: false, dayId: -1, field: 'startTime' });
      return;
    }
    if (selectedTime && androidPicker.dayId !== -1) {
      setAvailability(prev => prev.map(day =>
        day.id === androidPicker.dayId
          ? { ...day, [androidPicker.field]: selectedTime }
          : day
      ));
    }
    setAndroidPicker({ visible: false, dayId: -1, field: 'startTime' });
  };

  const confirmTime = () => {
    if (showTimePicker.dayId !== -1 && tempTime) {
      setAvailability(prev => prev.map(day =>
        day.id === showTimePicker.dayId
          ? { ...day, [showTimePicker.field]: tempTime }
          : day
      ));
    }
    setShowTimePicker(prev => ({ ...prev, visible: false }));
    setTempTime(null);
  };

  const closeModal = () => {
    setShowTimePicker(prev => ({ ...prev, visible: false }));
    setTempTime(null);
  };

  const dateToString = (date: Date) => {
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    const result = `${h}:${m}`;
    return result;
  };

  const stringToDate = (hhmm: string) => {
    const [h, m] = hhmm.split(':').map(Number);
    const result = new Date(1970, 0, 1, h, m, 0, 0); // año, mes, día, hora, minutos, segundos, milisegundos
    return result;
  };

  useEffect(() => {
    const loadAvailability = async () => {
      if (!tokens) return;
      
      try {
        setLoading(true);
        const data = await fetchDisponibilidad(tokens);
        
        const weekStructure = createWeekStructure();
        const updatedAvailability = weekStructure.map(day => {
          const found = data.find(d => d.day_of_week === day.id);
          if (found) {
            return {
              ...day,
              enabled: true,
              startTime: stringToDate(found.start_time),
              endTime: stringToDate(found.end_time),
            };
          }
          return day;
        });
        
        setAvailability(updatedAvailability);
      } catch (error) {
        console.error('Error loading availability:', error);
        setAvailability(createWeekStructure());
        showError('Error al cargar la disponibilidad');
      } finally {
        setLoading(false);
      }
    };

    loadAvailability();
  }, [tokens]);
  
  // Al guardar:
  const handleSave = async () => {
    if (!tokens) return;
    
    const payload: DisponibilidadDia[] = availability
      .filter(day => day.enabled)
      .map(day => {
        const startTimeStr = dateToString(day.startTime);
        const endTimeStr = dateToString(day.endTime);
        
        return {
          day_of_week: day.id,
          start_time: startTimeStr,
          end_time: endTimeStr,
          is_recurring: true,
        };
      });
      
    try {
      await saveDisponibilidad(tokens, payload);
      showSuccess(
        'Disponibilidad guardada',
        'Tu disponibilidad se actualizó correctamente'
      );
      // Resetear el stack para evitar volver con gesto de deslizar
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    } catch (error) {
      showError('Error al guardar la disponibilidad');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

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
        <Text style={[styles.headerTitle, { color: colors.white }]}>Mi disponibilidad</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Contenido scrolleable */}
      <ScrollView 
        style={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContentContainer}
      >
        {availability.map((day) => (
          <View key={day.id} style={[styles.dayRow, { backgroundColor: colors.dark2 }]}>
            <View style={styles.dayInfo}>
              <Text style={[styles.dayName, { color: colors.text }]}>{day.name}</Text>
              
              <View style={[styles.timeContainer, { opacity: day.enabled ? 1 : 0.4 }]}>
                <TouchableOpacity 
                  style={[styles.timeButton, { backgroundColor: colors.background }]}
                  onPress={() => day.enabled && openTimePicker(day.id, 'startTime')}
                  disabled={!day.enabled}
                >
                  <Text style={[styles.timeText, { color: day.enabled ? colors.text : colors.textSecondary }]}>
                    {day.enabled ? formatTime(day.startTime) : 'Hora'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.timeButton, { backgroundColor: colors.background }]}
                  onPress={() => day.enabled && openTimePicker(day.id, 'endTime')}
                  disabled={!day.enabled}
                >
                  <Text style={[styles.timeText, { color: day.enabled ? colors.text : colors.textSecondary }]}>
                    {day.enabled ? formatTime(day.endTime) : 'Hora'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <Switch
              value={day.enabled}
              onValueChange={() => toggleDay(day.id)}
              trackColor={{ false: colors.dark3, true: colors.primary }}
              thumbColor={colors.white}
              ios_backgroundColor={colors.dark3}
            />
          </View>
        ))}
      </ScrollView>

      {/* Time Picker Modal de iOS */}
      {Platform.OS === 'ios' && (
        <Modal
          visible={showTimePicker.visible}
          transparent={true}
          animationType="fade"
          onRequestClose={closeModal}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.dark2 }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Seleccionar {showTimePicker.field === 'startTime' ? 'hora de inicio' : 'hora de fin'}
                </Text>
                <TouchableOpacity 
                  onPress={closeModal}
                  style={styles.modalCloseButton}
                >
                  <Icon name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.pickerContainer}>
                {showTimePicker.visible && (
                  <DateTimePicker
                    value={tempTime || new Date()}
                    mode="time"
                    is24Hour={true}
                    display={'spinner'}
                    onChange={onTimeChangeIOS}
                    style={styles.picker}
                    textColor={colors.text}
                  />
                )}
              </View>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, { backgroundColor: colors.primary }]}
                  onPress={confirmTime}
                >
                  <Text style={[styles.modalButtonText, { color: colors.white }]}>Confirmar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Android: DateTimePicker nativo sin modal */}
      {Platform.OS === 'android' && androidPicker.visible && (
        <DateTimePicker
          value={availability.find(d => d.id === androidPicker.dayId)?.[androidPicker.field] || new Date()}
          mode="time"
          is24Hour={true}
          display={'default'}
          onChange={onTimeChangeAndroid}
        />
      )}

      {/* Botón guardar fijo */}
      <View style={[styles.footer, { backgroundColor: colors.background }]}>
        <TouchableOpacity 
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={handleSave}
          activeOpacity={0.8}
        >
          <Text style={[styles.saveButtonText, { color: colors.white }]}>Guardar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

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
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 100,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dayInfo: {
    flex: 1,
  },
  dayName: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 8,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeButton: {
    paddingVertical: 8,
    paddingHorizontal: 44,
    borderRadius: 8,
    marginRight: 2,
    minWidth: 60,
    alignItems: 'center',
  },
  timeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  saveButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 16,
    padding: 20,
    margin: 20,
    maxWidth: 300,
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  modalCloseButton: {
    padding: 4,
  },
  pickerContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  picker: {
    width: 200,
    height: 120,
  },
  modalButtons: {
    marginTop: 20,
    alignItems: 'center',
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MiDisponibilidadScreen;