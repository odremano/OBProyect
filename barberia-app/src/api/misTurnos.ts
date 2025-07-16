import axios from 'axios';
import { Tokens } from './auth';
import { API_URL } from './apiURL';

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
  turnos_proximos: any[];
  turnos_historial: any[];
  total_turnos: number;
}

export async function fetchMisTurnos(tokens: Tokens): Promise<MisTurnosResponse> {
  const response = await axios.get<MisTurnosResponse>(`${API_URL}/reservas/mis-turnos/`, {
    headers: {
      Authorization: `Bearer ${tokens.access}`,
    },
  });
  console.log('Respuesta de mis-turnos:', response.data);
  return response.data;
}

export async function cancelarTurno(tokens: Tokens, turnoId: number) {
  const response = await axios.post(`${API_URL}/reservas/cancelar/${turnoId}/`, {}, {
    headers: {
      Authorization: `Bearer ${tokens.access}`,
      'Content-Type': 'application/json',
    },
  });
  return response.data;
}
