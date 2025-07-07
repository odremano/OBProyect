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
