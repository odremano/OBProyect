import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';

interface CalendarModalProps {
  visible: boolean;
  onClose: () => void;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  diasConIndicadores?: number[]; // Días que tendrán el puntito de notificación
  title?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  onMonthChange?: (date: Date) => void; // Callback para cuando cambie el mes
}

export const CalendarModal: React.FC<CalendarModalProps> = ({
  visible,
  onClose,
  selectedDate,
  onSelectDate,
  diasConIndicadores = [],
  title = 'Seleccionar fecha',
  minimumDate,
  maximumDate,
  onMonthChange // Nuevo prop
}) => {
  const { colors } = useTheme();
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));

  // Sincronizar currentMonth cuando cambie selectedDate
  useEffect(() => {
    setCurrentMonth(new Date(selectedDate));
  }, [visible]);

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const diasSemana = ['LU', 'MA', 'MI', 'JU', 'VI', 'SA', 'DO'];

  const formatearMesAño = (fecha: Date) => {
    const mes = meses[fecha.getMonth()];
    const año = fecha.getFullYear();
    return `${mes} ${año}`;
  };

  const obtenerDiasDelMes = (fecha: Date) => {
    const año = fecha.getFullYear();
    const mes = fecha.getMonth();
    
    // Primer día del mes
    const primerDia = new Date(año, mes, 1);
    // Último día del mes
    const ultimoDia = new Date(año, mes + 1, 0);
    
    // Día de la semana del primer día (0 = domingo, pero queremos 0 = lunes)
    let primerDiaSemana = primerDia.getDay();
    primerDiaSemana = primerDiaSemana === 0 ? 6 : primerDiaSemana - 1; // Convertir domingo a 6
    
    const diasDelMes = [];
    
    // Días vacíos al inicio
    for (let i = 0; i < primerDiaSemana; i++) {
      diasDelMes.push(null);
    }
    
    // Días del mes
    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
      diasDelMes.push(dia);
    }
    
    return diasDelMes;
  };

  const seleccionarDia = (dia: number) => {
    const nuevaFecha = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), dia);
    
    // Validar fechas mínima y máxima
    if (minimumDate && nuevaFecha < minimumDate) {
      return;
    }
    if (maximumDate && nuevaFecha > maximumDate) {
      return;
    }
    
    onSelectDate(nuevaFecha);
    onClose();
  };

  const cambiarMes = (direccion: 'anterior' | 'siguiente') => {
    const nuevoMes = new Date(currentMonth);
    if (direccion === 'anterior') {
      nuevoMes.setMonth(nuevoMes.getMonth() - 1);
    } else {
      nuevoMes.setMonth(nuevoMes.getMonth() + 1);
    }
    setCurrentMonth(nuevoMes);
    
    // Notificar el cambio de mes al componente padre
    if (onMonthChange) {
      onMonthChange(nuevoMes);
    }
  };

  const esDiaSeleccionado = (dia: number) => {
    return dia === selectedDate.getDate() && 
           currentMonth.getMonth() === selectedDate.getMonth() && 
           currentMonth.getFullYear() === selectedDate.getFullYear();
  };

  const esDiaDeshabilitado = (dia: number) => {
    if (!dia) return true;
    
    const fecha = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), dia);
    
    if (minimumDate && fecha < minimumDate) {
      return true;
    }
    if (maximumDate && fecha > maximumDate) {
      return true;
    }
    
    return false;
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.calendarModal, { backgroundColor: colors.background }]}>
          {/* Header del calendario */}
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={() => cambiarMes('anterior')}>
              <Icon name="chevron-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.calendarTitle, { color: colors.text }]}>
              {formatearMesAño(currentMonth)}
            </Text>
            <TouchableOpacity onPress={() => cambiarMes('siguiente')}>
              <Icon name="chevron-forward" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Días de la semana */}
          <View style={styles.diasSemanaContainer}>
            {diasSemana.map((dia) => (
              <Text key={dia} style={[styles.diaSemana, { color: colors.text }]}>{dia}</Text>
            ))}
          </View>

          {/* Días del mes */}
          <View style={styles.diasContainer}>
            {obtenerDiasDelMes(currentMonth).map((dia, index) => {
              const esSeleccionado = dia ? esDiaSeleccionado(dia) : false;
              const esDeshabilitado = dia ? esDiaDeshabilitado(dia) : true;
              const tieneIndicador = dia ? diasConIndicadores.includes(dia) : false;

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.diaButton,
                    esSeleccionado ? { backgroundColor: colors.primaryDark } : null,
                    esDeshabilitado ? { opacity: 0.3 } : null
                  ]}
                  onPress={() => dia && !esDeshabilitado && seleccionarDia(dia)}
                  disabled={!dia || esDeshabilitado}
                >
                  {dia && (
                    <>
                      <Text style={[
                        styles.diaTexto,
                        { 
                          color: esSeleccionado 
                            ? colors.white 
                            : esDeshabilitado 
                              ? colors.textSecondary 
                              : colors.text 
                        }
                      ]}>
                        {dia}
                      </Text>
                      {tieneIndicador && (
                        <View style={[
                          styles.puntito, 
                          { 
                            backgroundColor: esSeleccionado
                              ? colors.light2  // Color del puntito cuando está seleccionado
                              : colors.primary        // Color del puntito normal
                          }
                        ]} />
                      )}
                    </>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Botón cerrar */}
          <TouchableOpacity 
            style={[styles.closeCalendarButton, { backgroundColor: colors.white }]}
            onPress={onClose}
          >
            <Text style={[styles.closeCalendarText, { color: colors.primaryDark }]}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarModal: {
    margin: 20,
    borderRadius: 16,
    padding: 20,
    width: '85%',
    maxWidth: 350,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  diasSemanaContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  diaSemana: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    width: '14.28%', // 100% / 7 días = 14.28%
  },
  diasContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  diaButton: {
    width: '14.28%', // 100% / 7 días = 14.28%
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  diaTexto: {
    fontSize: 16,
    fontWeight: '500',
  },
  puntito: {
    width: 6,
    height: 6,
    borderRadius: 3,
    position: 'absolute',
    bottom: 4,
  },
  closeCalendarButton: {
    marginTop: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeCalendarText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
