import axios from 'axios';
import { Tokens } from './auth';

// Reutiliza la interfaz Turno si ya la tienes, o defínela aquí
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

export interface ResumenTurnos {
  total_turnos: number;
  proximos: number;
  pasados: number;
  cancelados: number;
}

export interface MisTurnosResponse {
  success: boolean;
  resumen: ResumenTurnos;
  turnos: {
    proximos: Turno[];
    pasados: Turno[];
    cancelados: Turno[];
  };
}

export async function fetchMisTurnos(tokens: Tokens): Promise<MisTurnosResponse> {
  const API_URL = 'http://192.168.0.19:8000/api/v1/reservas/mis-turnos/';
  const response = await axios.get<MisTurnosResponse>(API_URL, {
    headers: {
      Authorization: `Bearer ${tokens.access}`,
    },
  });
  console.log('Respuesta de mis-turnos:', response.data);
  return response.data;
}

export async function cancelarTurno(tokens: Tokens, turnoId: number) {
  const API_URL = `http://192.168.0.19:8000/api/v1/reservas/cancelar/${turnoId}/`; // Usa la IP correcta si es necesario
  const response = await axios.post(API_URL, {}, {
    headers: {
      Authorization: `Bearer ${tokens.access}`,
      'Content-Type': 'application/json',
    },
  });
  return response.data;
}
