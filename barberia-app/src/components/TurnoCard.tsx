import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useColors } from '../theme/colors';

interface TurnoCardProps {
  turno: {
    id: string;
    fecha: string;
    hora: string;
    profesional: string;
    servicio: string;
    precio: string;
    avatar: string;
    fechaObj?: Date | null;
  };
  onCancelar: (id: string) => void;
  puedeCancel?: boolean;
}

export default function TurnoCard({ turno, onCancelar, puedeCancel = true }: TurnoCardProps) {
  const colors = useColors();
  
  // Debug temporal
  console.log('Colores en TurnoCard:', colors);

  const formatFecha = (fechaObj?: Date | null, fechaStr?: string) => {
    if (fechaObj instanceof Date && !isNaN(fechaObj.getTime())) {
      const opciones: Intl.DateTimeFormatOptions = { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long' 
      };
      return fechaObj.toLocaleDateString('es-ES', opciones);
    }
    if (fechaStr) return fechaStr;
    return '';
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.dark2 }]}>
      <View style={styles.header}>
        {turno.avatar ? (
          <Image
            source={{ uri: turno.avatar }}
            style={styles.avatar}
          />
        ) : (
          <View style={[styles.avatarContainer, { backgroundColor: colors.primary }]}>
            <Icon name="person" size={24} color={colors.white} />
          </View>
        )}
        <View style={styles.info}>
          <Text style={[styles.profesional, { color: colors.white }]}>{turno.profesional}</Text>
          <Text style={[styles.servicio, { color: colors.light2 }]}>{turno.servicio}</Text>
        </View>
      </View>
      
      <View style={styles.detalles}>
        <View style={styles.rowFechaPrecio}>
          <Text style={[styles.fecha, { color: colors.light3 }]}>{formatFecha(turno.fechaObj, turno.fecha)}</Text>
          <Text style={[styles.precio, { color: colors.white }]}>{turno.precio}</Text>
        </View>
        <Text style={[styles.hora, { color: colors.white }]}>{turno.hora}</Text>
      </View>

      {puedeCancel && (
        <TouchableOpacity 
          style={[styles.botonCancelar, { backgroundColor: colors.error }]}
          onPress={() => onCancelar(turno.id)}
        >
          <Text style={[styles.textoCancelar, { color: colors.white }]}>Cancelar turno</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
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
    marginBottom: 4,
  },
  servicio: {
    fontSize: 16,
  },
  detalles: {
    marginBottom: 16,
  },
  rowFechaPrecio: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fecha: {
    fontSize: 14,
    fontWeight: '300',
    marginBottom: 2,
  },
  hora: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  precio: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  botonCancelar: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  textoCancelar: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 