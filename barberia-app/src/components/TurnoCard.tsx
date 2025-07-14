import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import colors from '../theme/colors';

interface TurnoCardProps {
  turno: {
    id: string;
    fecha: string;
    hora: string;
    profesional: string;
    servicio: string;
    precio: string;
    avatar: string;
  };
  onCancelar: (id: string) => void;
  puedeCancel?: boolean;
}

export default function TurnoCard({ turno, onCancelar, puedeCancel = true }: TurnoCardProps) {
  const formatFecha = (fechaISO: string) => {
    const fecha = new Date(fechaISO);
    const opciones: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    };
    return fecha.toLocaleDateString('es-ES', opciones);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        {turno.avatar ? (
          <Image
            source={{ uri: turno.avatar }}
            style={styles.avatar}
          />
        ) : (
          <View style={styles.avatarContainer}>
            <Icon name="person" size={24} color={colors.white} />
          </View>
        )}
        <View style={styles.info}>
          <Text style={styles.profesional}>{turno.profesional}</Text>
          <Text style={styles.servicio}>{turno.servicio}</Text>
        </View>
      </View>
      
      <View style={styles.detalles}>
        <Text style={styles.fecha}>{formatFecha(turno.fecha)}</Text>
        <Text style={styles.hora}>{turno.hora}</Text>
        <Text style={styles.precio}>{turno.precio}</Text>
      </View>

      {puedeCancel && (
        <TouchableOpacity 
          style={styles.botonCancelar}
          onPress={() => onCancelar(turno.id)}
        >
          <Text style={styles.textoCancelar}>Cancelar turno</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#2D5336',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  profesional: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  servicio: {
    fontSize: 16,
    color: '#E8F5E8',
  },
  detalles: {
    marginBottom: 16,
  },
  fecha: {
    fontSize: 14,
    color: '#B8D8BA',
    fontWeight: '300',
    marginBottom: 2,
  },
  hora: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
    marginBottom: 8,
  },
  precio: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  botonCancelar: {
    backgroundColor: '#D32F2F',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  textoCancelar: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 