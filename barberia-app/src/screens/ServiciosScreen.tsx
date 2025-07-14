import React, { useEffect, useState, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, SafeAreaView } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { fetchServicios, Servicio } from '../api/servicios';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import Icon from 'react-native-vector-icons/Ionicons';
import colors from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Servicios'>;

export default function ServiciosScreen({ route, navigation }: Props) {
  const { tokens } = useContext(AuthContext);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);
  const onSelect = route.params?.onSelect;
  const isModal = route.params?.modal || false;

  useEffect(() => {
    if (!tokens) return;
    fetchServicios(tokens)
      .then(setServicios)
      .catch(() => setServicios([]))
      .finally(() => setLoading(false));
  }, [tokens]);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={isModal ? styles.closeButton : styles.backButton}
        >
          <Icon name={isModal ? "close" : "arrow-back"} size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Servicios</Text>
        <View style={{ width: isModal ? 20 : 24 }} />
      </View>
      
      <FlatList
        data={servicios}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.servicioCard}
            onPress={() => {
              if (onSelect) {
                onSelect(item);
              }
            }}
            disabled={!onSelect}
          >
            <View style={styles.cardContent}>
              <View style={styles.servicioInfo}>
                <View style={styles.iconContainer}>
                  <Icon name="cut" size={24} color={colors.white} />
                </View>
                <View style={styles.textInfo}>
                  <Text style={styles.servicioName}>
                    {item.name}
                  </Text>
                  <Text style={styles.servicioDescription}>
                    {item.description || 'Servicio profesional de barbería'}
                  </Text>
                  <View style={styles.servicioDetails}>
                    <View style={styles.detailItem}>
                      <Icon name="time" size={12} color={colors.light3} />
                      <Text style={styles.detailText}>
                        {item.duration_minutes} min
                      </Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Icon name="cash" size={12} color={colors.light3} />
                      <Text style={styles.detailText}>
                        ${item.price}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
              {onSelect && (
                <Icon name="chevron-forward" size={20} color={colors.white} />
              )}
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background 
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
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: colors.primaryDark,
  },
  backButton: {
    padding: 4,
  },
  closeButton: {
    padding: 4,
    marginBottom: 18,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
    marginBottom: 15,
  },
  title: { fontSize: 24, marginBottom: 20, textAlign: 'center' },
  listContainer: {
    padding: 20,
    paddingBottom: 34,
  },
  servicioCard: {
    backgroundColor: colors.dark2,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    minHeight: 60,
    paddingRight: 40
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  servicioInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    backgroundColor: colors.primary,
    borderRadius: 26,
    width: 52,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textInfo: {
    flex: 1,
  },
  servicioName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
    marginBottom: 4,
  },
  servicioDescription: {
    fontSize: 12,
    color: colors.light3,
    lineHeight: 16,
    marginBottom: 4,
  },
  servicioDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  detailText: {
    fontSize: 12,
    color: colors.light3,
    marginLeft: 4,
  },
});