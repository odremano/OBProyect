import React, { useEffect, useState, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { fetchProfesionales, Profesional } from '../api/profesionales';


export default function ProfesionalesScreen() {
  const { tokens } = useContext(AuthContext);
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    console.log('Pantalla Profesionales montada');
    if (!tokens) return;
    fetchProfesionales(tokens)
      .then(setProfesionales)
      .catch(() => setProfesionales([]))
      .finally(() => setLoading(false));
  }, [tokens]);

  if (loading) return <ActivityIndicator size="large" color="#007cba" />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profesionales</Text>
      <FlatList
        data={profesionales}
        keyExtractor={item => item.user_details.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.profesional}
            onPress={() => navigation.navigate('ReservaTurno', { profesionalId: item.user_details.id })}
          >
            {item.profile_picture_url && (
              <Image
                source={{ uri: item.profile_picture_url }}
                style={styles.foto}
              />
            )}
            <Text style={styles.nombre}>
              {item.user_details.first_name} {item.user_details.last_name}
            </Text>
            <Text>{item.bio}</Text>
            <Text>Disponible: {item.is_available ? 'Sí' : 'No'}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, marginBottom: 20, textAlign: 'center' },
  profesional: { marginBottom: 15, padding: 10, borderWidth: 1, borderColor: '#ccc', borderRadius: 5 },
  nombre: { fontWeight: 'bold', fontSize: 18 },
  foto: { width: 60, height: 60, borderRadius: 30, marginBottom: 10 }
});
