import React, { useEffect, useState, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Button, Alert } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { fetchMisTurnos, Turno, MisTurnosResponse, cancelarTurno } from '../api/misTurnos';

export default function MisTurnosScreen() {
  const { tokens } = useContext(AuthContext);
  const [turnos, setTurnos] = useState<MisTurnosResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tokens) return;
    fetchMisTurnos(tokens)
      .then(setTurnos)
      .catch((err) => {
        if (err.response && err.response.status === 401) {
          Alert.alert('Sesión expirada', 'Por favor, inicia sesión nuevamente.');
          // Aquí puedes redirigir al login si lo deseas
        }
        setTurnos(null);
      })
      .finally(() => setLoading(false));
  }, [tokens]);

  const handleCancelar = async (turnoId: number) => {
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
              await cancelarTurno(tokens, turnoId);
              Alert.alert('Turno cancelado', 'El turno ha sido cancelado correctamente.');
              // Refresca la lista
              setLoading(true);
              const data = await fetchMisTurnos(tokens);
              setTurnos(data);
              setLoading(false);
            } catch (error) {
              Alert.alert('Error', 'No se pudo cancelar el turno.');
            }
          }
        }
      ]
    );
  };

  if (loading) return <ActivityIndicator size="large" color="#007cba" />;
  if (!turnos) return <Text style={{ textAlign: 'center', marginTop: 20 }}>No se pudieron cargar los turnos.</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mis Turnos</Text>
      <Text style={styles.resumen}>
        Total: {turnos.resumen.total_turnos} | Próximos: {turnos.resumen.proximos} | Pasados: {turnos.resumen.pasados} | Cancelados: {turnos.resumen.cancelados}
      </Text>

      <Text style={styles.seccion}>Próximos</Text>
      <FlatList
        data={turnos.turnos.proximos}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.turno}>
            <Text style={styles.servicio}>{item.servicio_name}</Text>
            <Text>Profesional: {item.profesional_name}</Text>
            <Text>Fecha: {item.fecha} {item.hora_inicio} - {item.hora_fin}</Text>
            <Text>Estado: {item.status}</Text>
            {item.puede_cancelar && (
              <Button
                title="Cancelar turno"
                color="#d9534f"
                onPress={() => handleCancelar(item.id)}
              />
            )}
          </View>
        )}
        ListEmptyComponent={<Text style={styles.vacio}>No hay turnos próximos.</Text>}
      />

      <Text style={styles.seccion}>Pasados</Text>
      <FlatList
        data={turnos.turnos.pasados}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.turno}>
            <Text style={styles.servicio}>{item.servicio_name}</Text>
            <Text>Profesional: {item.profesional_name}</Text>
            <Text>Fecha: {item.fecha} {item.hora_inicio} - {item.hora_fin}</Text>
            <Text>Estado: {item.status}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.vacio}>No hay turnos pasados.</Text>}
      />

      <Text style={styles.seccion}>Cancelados</Text>
      <FlatList
        data={turnos.turnos.cancelados}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.turno}>
            <Text style={styles.servicio}>{item.servicio_name}</Text>
            <Text>Profesional: {item.profesional_name}</Text>
            <Text>Fecha: {item.fecha} {item.hora_inicio} - {item.hora_fin}</Text>
            <Text>Estado: {item.status}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.vacio}>No hay turnos cancelados.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, marginBottom: 10, textAlign: 'center' },
  resumen: { fontSize: 16, marginBottom: 10, textAlign: 'center' },
  seccion: { fontSize: 20, marginTop: 20, marginBottom: 5, fontWeight: 'bold' },
  turno: { marginBottom: 10, padding: 10, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, backgroundColor: '#f9f9f9' },
  servicio: { fontWeight: 'bold', fontSize: 16 },
  vacio: { textAlign: 'center', color: '#888', marginBottom: 10 }
});
