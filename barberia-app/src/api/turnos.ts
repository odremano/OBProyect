import axios from 'axios';
import { Tokens } from './auth';
import { API_URL } from './apiURL';

export interface ReservaPayload {
  profesional: number;
  servicio: number;
  start_datetime: string; // Formato ISO 8601: "2025-07-06T12:30:00"
}

// Interfaz para la respuesta positiva
export interface Turno {
  id: number;
  start_datetime: string;
  end_datetime: string;
  status: string;
  notes: string | null;
  created_at: string;
  profesional_name: string;
  profesional_bio: string;
  profesional_photo: string | null;
  servicio_name: string;
  servicio_description: string;
  servicio_price: string;
  servicio_duration: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  puede_cancelar: boolean;
}

export interface ReservaSuccess {
  success: true;
  message: string;
  turno: Turno;
}

// Interfaz para la respuesta negativa
export interface ReservaError {
  success: false;
  message: string;
  errors?: {
    [key: string]: string[];
  };
}

export type ReservaResponse = ReservaSuccess | ReservaError;

export async function reservarTurno(tokens: Tokens, payload: ReservaPayload, negocioId: number): Promise<ReservaResponse> {
  console.log(' Enviando payload a la API:', payload); // Log del payload
  
  try {
    const response = await axios.post<ReservaResponse>(`${API_URL}/reservas/crear/?negocio_id=${negocioId}`, payload, {
      headers: {
        Authorization: `Bearer ${tokens.access}`,
        'Content-Type': 'application/json',
      },
    });
    console.log('✅ Respuesta exitosa:', response.data); // Log de respuesta exitosa
    return response.data;
  } catch (error: any) {
    console.log('Error en la petición:', error.response?.data); // Log de error
    console.log('Status code:', error.response?.status); // Log del status code
    throw error;
  }
}

// FUNCIÓN REMOVIDA: La API requiere profesional_id + servicio_id + fecha
// export async function obtenerDiasDisponibles(tokens: Tokens, profesionalId: number): Promise<string[]>

// Interfaz para la respuesta de horarios disponibles
export interface HorariosResponse {
  horarios: string[];
  mensaje?: string;
  profesionalNoTrabaja?: boolean;
}

// Obtener horarios disponibles para un profesional en una fecha específica con un servicio
export async function obtenerHorariosDisponibles(tokens: Tokens, profesionalId: number, fecha: string, servicioId: number, negocioId: number): Promise<HorariosResponse> {
  try {
    const response = await axios.get(`${API_URL}/reservas/disponibilidad/`, {
      headers: {
        Authorization: `Bearer ${tokens.access}`,
      },
      params: {
        profesional_id: profesionalId,
        fecha: fecha,
        servicio_id: servicioId,
        negocio_id: negocioId
      }
    });
    
    // Verificar si hay un mensaje específico
    const mensaje = response.data.mensaje || response.data.message;
    
    if (mensaje === "El profesional no trabaja este día") {
      return {
        horarios: [],
        mensaje: mensaje,
        profesionalNoTrabaja: true
      };
    }
    
    // La API devuelve objetos con hora_inicio, extraer solo las horas
    const horarios = response.data.horarios_disponibles || [];
    const horariosFormateados = horarios.map((horario: any) => horario.hora_inicio || horario);
    
    return {
      horarios: horariosFormateados,
      mensaje: mensaje
    };
  } catch (error: any) {
    if (error.response) {
      // Verificar si el error contiene el mensaje específico
      const errorMessage = error.response.data?.mensaje || error.response.data?.message;
      if (errorMessage === "El profesional no trabaja este día") {
        return {
          horarios: [],
          mensaje: errorMessage,
          profesionalNoTrabaja: true
        };
      }
    }
    return {
      horarios: [],
      mensaje: 'Error al cargar horarios'
    };
  }
}

// Interfaz específica para turnos del profesional (incluye datos del cliente)
export interface TurnoProfesional {
  id: number;
  start_datetime: string;
  end_datetime: string;
  status: string;
  notes: string | null;
  created_at: string;
  cliente_name: string;
  cliente_phone: string | null;
  servicio_name: string;
  servicio_description: string;
  servicio_price: string;
  servicio_duration: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  puede_cancelar: boolean;
}

export async function obtenerTurnosProfesional(tokens: Tokens, fecha: string, negocioId: number): Promise<TurnoProfesional[]> {
  try {
    const response = await axios.get(`${API_URL}/reservas/agenda-profesional/?negocio_id=${negocioId}`, {
      headers: {
        Authorization: `Bearer ${tokens.access}`,
      },
      params: {
        fecha: fecha,
      }
    });
    return response.data.turnos || [];
  } catch (error: any) {
    console.error('Error obteniendo turnos del profesional:', error);
    return [];
  }
}

// Función para marcar un turno como completado
export async function marcarTurnoCompletado(tokens: Tokens, turnoId: number) {
  try {
    const response = await axios.post(`${API_URL}/reservas/completar/${turnoId}/`, {}, {
      headers: {
        Authorization: `Bearer ${tokens.access}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      console.log('Error al completar turno:', error.response.data);
    }
    throw error;
  }
}

// Función para cancelar un turno
export async function cancelarTurno(tokens: Tokens, turnoId: number) {
  try {
    const response = await axios.post(`${API_URL}/reservas/cancelar/${turnoId}/`, {}, {
      headers: {
        Authorization: `Bearer ${tokens.access}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      console.log('Respuesta del backend:', error.response.data);
    }
    throw error;
  }
}

// Función para cancelar un turno (profesional)
export async function cancelarTurnoProfesional(tokens: Tokens, turnoId: number) {
  try {
    const response = await axios.post(`${API_URL}/reservas/cancelar-profesional/${turnoId}/`, {}, {
      headers: {
        Authorization: `Bearer ${tokens.access}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      console.log('Respuesta del backend:', error.response.data);
    }
    throw error;
  }
}

export async function obtenerDiasConTurnos(tokens: Tokens, año: number, mes: number, negocioId: number): Promise<number[]> {
  try {
    const response = await axios.get(`${API_URL}/reservas/dias-con-turnos/?negocio_id=${negocioId}`, {
      headers: {
        Authorization: `Bearer ${tokens.access}`,
      },
      params: {
        año: año,
        mes: mes + 1,
      }
    });
    return response.data.dias || [];
  } catch (error: any) {
    console.error('Error obteniendo días con turnos:', error);
    return [];
  }
}

// Nueva función API optimizada para obtener días con disponibilidad
export async function obtenerDiasConDisponibilidadOptimizada(
  year: number,
  month: number, // 1-12 (formato backend)
  profesionalId: number,
  servicioId: number
): Promise<number[]> {
  try {

    const response = await axios.get(`${API_URL}/reservas/dias-con-disponibilidad/`, {
      params: {
        year: year,
        month: month,
        profesional_id: profesionalId,
        servicio_id: servicioId
      }
    });

    console.log('Respuesta API disponibilidad:', response.data);
    
    if (response.data.success) {
      return response.data.dias || [];
    } else {
      console.error('Error en respuesta API:', response.data.error);
      return [];
    }
  } catch (error: any) {
    console.error('Error obteniendo días con disponibilidad:', error);
    if (error.response) {
      console.error('Detalles del error:', error.response.data);
      console.error('Status code:', error.response.status);
    }
    return [];
  }
}
