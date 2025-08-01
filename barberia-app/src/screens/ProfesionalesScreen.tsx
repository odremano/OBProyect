import React, { useEffect, useState, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { fetchProfesionales, Profesional } from '../api/profesionales';
import { fetchServicios, Servicio } from '../api/servicios';
import { obtenerHorariosDisponibles } from '../api/turnos';
import Icon from 'react-native-vector-icons/Ionicons';

type Props = NativeStackScreenProps<RootStackParamList, 'Profesionales'>;

// Interface para manejar la disponibilidad de cada profesional
interface ProfesionalConDisponibilidad extends Profesional {
  proximaDisponibilidad?: string;
  cargandoDisponibilidad?: boolean;
}

export default function ProfesionalesScreen({ route, navigation }: Props) {
  const { tokens, negocioId } = useContext(AuthContext);
  const { colors } = useTheme();
  const [profesionales, setProfesionales] = useState<ProfesionalConDisponibilidad[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);
  const onSelect = route.params?.onSelect;

  // Función helper para convertir fecha a string local (sin UTC)
  const fechaToLocalString = (fecha: Date): string => {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Función para obtener la próxima disponibilidad (ahora usa servicios dinámicos)
  const obtenerProximaDisponibilidad = async (profesional: Profesional, serviciosDisponibles: Servicio[]): Promise<string> => {
    if (!tokens || negocioId == null) return 'Bio no disponible';

    try {
      // Generar próximos 7 días
      const fechas = [];
      for (let i = 0; i < 7; i++) {
        const fecha = new Date();
        fecha.setDate(fecha.getDate() + i);
        
        let label;
        if (i === 0) {
          label = 'Hoy';
        } else if (i === 1) {
          label = 'Mañana';
        } else {
          // Para días siguientes, mostrar el nombre del día
          const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
          label = diasSemana[fecha.getDay()];
        }
        
        fechas.push({ fecha, label });
      }

      // Usar los servicios reales disponibles (máximo 3 para eficiencia)
      const serviciosAProbar = serviciosDisponibles.slice(0, 3).map(s => s.id);

      for (const { fecha, label } of fechas) {
        const fechaStr = fechaToLocalString(fecha);

        // Intentar con diferentes servicios
        for (const servicioId of serviciosAProbar) {
          try {
            // Timeout de 5 segundos por solicitud
            const timeoutPromise = new Promise<never>((_, reject) => {
              setTimeout(() => reject(new Error('Timeout')), 5000);
            });

            const apiCall = obtenerHorariosDisponibles(
              tokens, 
              profesional.id,
              fechaStr, 
              servicioId,
              negocioId as number
            );

            const response = await Promise.race([apiCall, timeoutPromise]);

            if (response.horarios.length > 0) {
              const primerHorario = response.horarios[0];
              let resultado;
              
              if (label === 'Hoy' || label === 'Mañana') {
                resultado = `${label} ${primerHorario}`;
              } else {
                // Para días de la semana, agregar "este" si es la misma semana
                const hoy = new Date();
                const esMismaSemana = Math.floor((fecha.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)) < 7;
                resultado = esMismaSemana ? `${label} ${primerHorario}` : `${label} ${primerHorario}`;
              }
              
              return resultado;
            }

            // Si el profesional no trabaja este día, no intentar otros servicios para esta fecha
            if (response.profesionalNoTrabaja) {
              break; // Salir del loop de servicios, continuar con siguiente fecha
            }

          } catch (error: any) {
            continue; // Continúa con el siguiente servicio
          }
        }
      }

      // Si no hay disponibilidad en los próximos 7 días, mostrar mensaje genérico
      return 'Consultar disponibilidad';
      
    } catch (error: any) {
      return profesional.bio || 'Especialista en cortes y servicios de barbería';
    }
  };

  // Función para mostrar la bio del profesional
  const mostrarBioProfesional = (profesional: ProfesionalConDisponibilidad): string => {
    return profesional.bio || 'Especialista en cortes modernos y clásicos';
  };

  // Función para mostrar el estado de disponibilidad
  const mostrarEstadoDisponibilidad = (profesional: ProfesionalConDisponibilidad): string | null => {
    if (profesional.cargandoDisponibilidad) {
      return 'Verificando disponibilidad...';
    }
    
    if (profesional.proximaDisponibilidad && profesional.proximaDisponibilidad !== 'Consultar disponibilidad') {
      return `Próximo turno: ${profesional.proximaDisponibilidad}hs`;
    }
    
    // No mostrar nada si no hay disponibilidad específica o si es "Consultar disponibilidad"
    return null;
  };

  useEffect(() => {
    if (!tokens || negocioId == null) return;

    // Cargar servicios y profesionales en paralelo
    Promise.all([
      fetchProfesionales(tokens, negocioId),
      fetchServicios(tokens, negocioId)
    ]).then(async ([profData, servData]) => {
      console.log('Servicios y profesionales recibidos:', profData, servData);
      // Guardar servicios en estado
      setServicios(servData);
      
      // Inicializar profesionales con estado de carga
      const profesionalesConDisponibilidad = profData.map(prof => ({
        ...prof,
        cargandoDisponibilidad: true
      }));
      setProfesionales(profesionalesConDisponibilidad);

      // Cargar disponibilidad de forma asíncrona para cada profesional
      // Procesamos de 2 en 2 para no sobrecargar la API
      const batchSize = 2;
      const profesionalesActualizados: ProfesionalConDisponibilidad[] = [...profesionalesConDisponibilidad];

      for (let i = 0; i < profData.length; i += batchSize) {
        const batch = profData.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (prof, batchIndex) => {
          const actualIndex = i + batchIndex;
          try {
            const proximaDisponibilidad = await obtenerProximaDisponibilidad(prof, servData);
            
            // Actualizar el profesional específico
            profesionalesActualizados[actualIndex] = {
              ...prof,
              proximaDisponibilidad,
              cargandoDisponibilidad: false
            };
            
            // Actualizar estado inmediatamente para mostrar progreso
            setProfesionales([...profesionalesActualizados]);
            
            return { prof, proximaDisponibilidad };
          } catch (error) {
            profesionalesActualizados[actualIndex] = {
              ...prof,
              proximaDisponibilidad: 'Error al cargar',
              cargandoDisponibilidad: false
            };
            
            setProfesionales([...profesionalesActualizados]);
            return { prof, proximaDisponibilidad: 'Error al cargar' };
          }
        });

        // Esperar a que termine este batch antes del siguiente
        await Promise.all(batchPromises);
        
        // Pequeña pausa entre batches para no sobrecargar
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }).catch((error) => {
      console.log('Error al cargar servicios/profesionales:', error);
      setProfesionales([]);
      setServicios([]);
    }).finally(() => {
      console.log('Finalizó la carga');
      setLoading(false);
    });
  }, [tokens]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primaryDark }]}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.white }]}>Profesionales</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <FlatList
        data={profesionales}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.profesionalCard, { backgroundColor: colors.dark2 }]}
            onPress={() => {
              if (onSelect) {
                onSelect(item);
              } else {
                navigation.navigate('ReservaTurno', { profesionalId: item.id });
              }
            }}
          >
            <View style={styles.cardContent}>
              <View style={styles.profesionalInfo}>
                {item.profile_picture_url ? (
                  <Image
                    source={{ uri: item.profile_picture_url }}
                    style={styles.foto}
                  />
                ) : (
                  <View style={[styles.avatarContainer, { backgroundColor: colors.primary }]}>
                    <Icon name="person" size={24} color={colors.white} />
                  </View>
                )}
                <View style={styles.textInfo}>
                  <Text style={[styles.profesionalName, { color: colors.text }]}>
                    {item.user_details.first_name} {item.user_details.last_name}
                  </Text>
                  <Text style={[styles.profesionalBio, { color: colors.textSecondary }]}>
                    {mostrarBioProfesional(item)}
                  </Text>
                  {mostrarEstadoDisponibilidad(item) && (
                    <View style={styles.disponibilidadContainer}>
                      <Icon name="time" size={12} color={colors.primary} />
                      <Text style={[styles.disponibilidadText, { color: colors.primary }]}>
                        {mostrarEstadoDisponibilidad(item)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              <Icon name="chevron-forward" size={20} color={colors.white} />
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1
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
    paddingTop: 56,
    paddingHorizontal: 20
  },
  backButton: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20
  },
  listContainer: {
    padding: 20,
    paddingBottom: 34,
  },
  profesionalCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    minHeight: 60,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profesionalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  textInfo: {
    flex: 1,
  },
  profesionalName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  profesionalBio: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 4,
  },
  disponibilidadText: {
    fontSize: 11,
    marginLeft: 4,
    fontWeight: '500',
  },
  disponibilidadContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  foto: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 16,
  },
});
