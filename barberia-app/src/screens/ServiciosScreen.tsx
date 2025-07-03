import React, { useEffect, useState, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { fetchServicios, Servicio } from '../api/servicios';

export default function ServiciosScreen() {
  const { tokens } = useContext(AuthContext);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tokens) return;
    fetchServicios(tokens)
      .then(data => {
        console.log('Respuesta de la API de servicios:', data);
        setServicios(data);
      })
      .catch((err) => {
        console.log('Error al obtener servicios:', err);
        setServicios([]);
      })
      .finally(() => setLoading(false));
  }, [tokens]);

  if (loading) return <ActivityIndicator size="large" color="#007cba" />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Servicios</Text>
      <FlatList
        data={servicios}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.servicio}>
            <Text style={styles.nombre}>{item.name}</Text>
            <Text>{item.description}</Text>
            <Text>Duración: {item.duration_minutes} min</Text>
            <Text>Precio: ${item.price}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, marginBottom: 20, textAlign: 'center' },
  servicio: { marginBottom: 15, padding: 10, borderWidth: 1, borderColor: '#ccc', borderRadius: 5 },
  nombre: { fontWeight: 'bold', fontSize: 18 }
});