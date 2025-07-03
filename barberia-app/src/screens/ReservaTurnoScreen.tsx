import React, { useState, useEffect, useContext } from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { fetchProfesionales, Profesional } from '../api/profesionales';
import { fetchServicios, Servicio } from '../api/servicios';
import { Picker } from '@react-native-picker/picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import DateTimePicker from '@react-native-community/datetimepicker';
import { reservarTurno } from '../api/turnos';

type Props = NativeStackScreenProps<RootStackParamList, 'ReservaTurno'>;

function toLocalISOString(date: Date) {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return (
    date.getFullYear() +
    '-' +
    pad(date.getMonth() + 1) +
    '-' +
    pad(date.getDate()) +
    'T' +
    pad(date.getHours()) +
    ':' +
    pad(date.getMinutes()) +
    ':00'
  );
}

export default function ReservaTurnoScreen({ route, navigation }: Props) {
  const { tokens } = useContext(AuthContext);
  const profesionalIdParam = route.params?.profesionalId ?? null;

  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [profesionalId, setProfesionalId] = useState<number | null>(profesionalIdParam);
  const [loading, setLoading] = useState(true);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [servicioId, setServicioId] = useState<number | null>(null);
  const [fecha, setFecha] = useState<Date>(new Date());
  const [mostrarPicker, setMostrarPicker] = useState(false);

  useEffect(() => {
    if (!tokens) return;
    fetchProfesionales(tokens)
      .then(setProfesionales)
      .catch(() => setProfesionales([]))
      .finally(() => setLoading(false));
  }, [tokens]);

  useEffect(() => {
    if (!tokens) return;
    fetchServicios(tokens)
      .then(setServicios)
      .catch(() => setServicios([]));
  }, [tokens]);

  // Si llegaste desde Home y no hay profesional preseleccionado, selecciona el primero por defecto
  useEffect(() => {
    if (!profesionalIdParam && profesionales.length > 0 && profesionalId === null) {
      setProfesionalId(profesionales[0].user_details.id);
    }
  }, [profesionales, profesionalIdParam, profesionalId]);

  const handleReservar = async () => {
    if (!profesionalId) {
      Alert.alert('Selecciona un profesional');
      return;
    }
    if (!servicioId) {
      Alert.alert('Selecciona un servicio');
      return;
    }
    if (!fecha) {
      Alert.alert('Selecciona fecha y hora');
      return;
    }
    const fechaFormateada = toLocalISOString(fecha);
    if (!tokens) {
      Alert.alert('Error', 'No hay sesión activa. Por favor, inicia sesión nuevamente.');
      return;
    }
    try {
      console.log('Payload enviado:', {
        profesional: profesionalId,
        servicio: servicioId,
        start_datetime: fechaFormateada,
      });
      const result = await reservarTurno(tokens, {
        profesional: profesionalId,
        servicio: servicioId,
        start_datetime: fechaFormateada,
      });
      if (result.success) {
        Alert.alert('¡Reserva exitosa!', result.message);
        navigation.goBack();
      } else {
        let errorMsg = result.message;
        if (result.errors) {
          // Muestra el primer error detallado si existe
          const detalles = Object.values(result.errors).flat().join('\n');
          errorMsg += '\n' + detalles;
        }
        Alert.alert('Error', errorMsg);
      }
    } catch (error: any) {
      console.log('Error al reservar:', error);
      if (error.response && error.response.data) {
        const data = error.response.data;
        console.log('Detalle del error de la API:', data);
        let errorMsg = data.message || 'No se pudo reservar el turno.';
        if (data.errors) {
          const detalles = Object.values(data.errors).flat().join('\n');
          errorMsg += '\n' + detalles;
        }
        Alert.alert('Error', errorMsg);
      } else {
        Alert.alert('Error', 'No se pudo reservar el turno. Intenta nuevamente.');
      }
    }
  };

  if (loading) return <Text>Cargando profesionales...</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reservar Turno</Text>
      <Text>Selecciona un profesional:</Text>
      <Picker
        selectedValue={profesionalId}
        onValueChange={setProfesionalId}
        enabled={!profesionalIdParam} // Si llegaste desde profesionales, no permitas cambiar
        style={styles.picker}
      >
        {profesionales.map(prof => (
          <Picker.Item
            key={prof.user_details.id}
            label={`${prof.user_details.first_name} ${prof.user_details.last_name}`}
            value={prof.user_details.id}
          />
        ))}
      </Picker>
      <Text>Selecciona un servicio:</Text>
      <Picker
        selectedValue={servicioId}
        onValueChange={setServicioId}
        style={styles.picker}
      >
        <Picker.Item label="Selecciona un servicio..." value={null} />
        {servicios.map(serv => (
          <Picker.Item
            key={serv.id}
            label={serv.name}
            value={serv.id}
          />
        ))}
      </Picker>
      <Text>Selecciona fecha y hora:</Text>
      <Button
        title={fecha ? fecha.toLocaleString() : "Elegir fecha y hora"}
        onPress={() => setMostrarPicker(true)}
      />
      {mostrarPicker && (
        <DateTimePicker
          value={fecha}
          mode="datetime"
          display="default"
          onChange={(_, selectedDate) => {
            setMostrarPicker(false);
            if (selectedDate) {
              // Redondear a cada 15 minutos
              const rounded = new Date(selectedDate);
              const minutes = rounded.getMinutes();
              const roundedMinutes = Math.round(minutes / 15) * 15;
              if (roundedMinutes === 60) {
                rounded.setHours(rounded.getHours() + 1);
                rounded.setMinutes(0);
              } else {
                rounded.setMinutes(roundedMinutes);
              }
              rounded.setSeconds(0);
              rounded.setMilliseconds(0);
              setFecha(rounded);
            }
          }}
          minimumDate={new Date()}
        />
      )}
      <Button title="Reservar" onPress={handleReservar} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 24, marginBottom: 20, textAlign: 'center' },
  picker: { marginVertical: 20 }
});
