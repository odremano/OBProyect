import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface HistorialItemProps {
  turno: {
    id: string;
    fecha: string;
    hora: string;
    profesional: string;
    servicio: string;
    estado: 'confirmado' | 'completado' | 'cancelado';
    precio: string;
  };
}

export default function HistorialItem({ turno }: HistorialItemProps) {
  const formatFecha = (fechaISO: string) => {
    const fecha = new Date(fechaISO);
    const dia = fecha.getDate().toString().padStart(2, '0');
    const meses = ['jan', 'feb', 'mar', 'abr', 'may', 'jun', 
                  'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const mes = meses[fecha.getMonth()];
    return `${dia} ${mes}`;
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'completado':
        return '#4CAF50'; // Verde
      case 'cancelado':
        return '#A0A0A0'; // Gris
      case 'confirmado':
      default:
        return '#FFFFFF'; // Blanco
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
    <View style={styles.item}>
      <View style={styles.fechaContainer}>
        <Text style={styles.fecha}>{formatFecha(turno.fecha)}</Text>
        <Text style={styles.profesionalNombre}>{turno.profesional}</Text>
      </View>
      
      <View style={styles.detallesContainer}>
        <Text style={styles.servicio}>{turno.servicio}</Text>
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
    backgroundColor: '#2D5336',
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
    color: '#B8D8BA',
    fontWeight: '300',
    marginBottom: 2,
  },
  profesionalNombre: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  detallesContainer: {
    alignItems: 'flex-end',
    flex: 1,
  },
  servicio: {
    fontSize: 14,
    color: '#E8F5E8',
    marginBottom: 2,
    textAlign: 'right',
  },
  estado: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
}); 