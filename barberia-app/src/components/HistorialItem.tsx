import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface HistorialItemProps {
  turno: {
    id: string;
    fecha: string;
    hora: string;
    profesional: string;
    servicio: string;
    estado: 'confirmado' | 'completado' | 'cancelado';
    precio: string;
    fechaObj?: Date | null;
  };
}

export default function HistorialItem({ turno }: HistorialItemProps) {
  const { colors } = useTheme();
  const formatFecha = (fechaObj?: Date | null, fechaStr?: string) => {
    if (fechaObj instanceof Date && !isNaN(fechaObj.getTime())) {
      const dia = fechaObj.getDate().toString().padStart(2, '0');
      const meses = ['jan', 'feb', 'mar', 'abr', 'may', 'jun', 
                    'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
      const mes = meses[fechaObj.getMonth()];
      return `${dia} ${mes}`;
    }
    if (fechaStr) return fechaStr;
    return '';
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'completado':
        return colors.primary; // Verde
      case 'cancelado':
        return colors.error; // Rojo o color de error
      case 'confirmado':
      default:
        return colors.white; // Blanco
    }
  };

  const getEstadoTexto = (estado: string) => {
    switch (estado) {
      case 'completado':
        return 'Completado';
      case 'cancelado':
        return 'Cancelado';
      case 'confirmado':
        return 'Confirmado';
      default:
        return estado;
    }
  };

  return (
    <View style={[styles.item, { backgroundColor: colors.dark2 }]}> 
      <View style={styles.fechaContainer}>
        <Text style={[styles.fecha, { color: colors.light3 }]}>{formatFecha(turno.fechaObj, turno.fecha)}</Text>
        <Text style={[styles.profesionalNombre, { color: colors.white }]}>{turno.profesional}</Text>
      </View>
      
      <View style={styles.detallesContainer}>
        <Text style={[styles.servicio, { color: colors.light2 }]}>{turno.servicio}</Text>
        <Text 
          style={[styles.estado, { color: getEstadoColor(turno.estado) }]}
        >
          {getEstadoTexto(turno.estado)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fechaContainer: {
    flex: 1,
  },
  fecha: {
    fontSize: 14,
    fontWeight: '300',
    marginBottom: 2,
  },
  profesionalNombre: {
    fontSize: 16,
    fontWeight: '500',
  },
  detallesContainer: {
    alignItems: 'flex-end',
    flex: 1,
  },
  servicio: {
    fontSize: 14,
    marginBottom: 2,
    textAlign: 'right',
  },
  estado: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
}); 