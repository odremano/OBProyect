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

export async function reservarTurno(tokens: Tokens, payload: ReservaPayload): Promise<ReservaResponse> {
  const response = await axios.post<ReservaResponse>(`${API_URL}/reservas/crear/`, payload, {
    headers: {
      Authorization: `Bearer ${tokens.access}`,
      'Content-Type': 'application/json',
    },
  });
  return response.data;
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
