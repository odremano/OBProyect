import axios from 'axios';
import { Tokens } from './auth';
import { API_URL } from './apiURL';

export interface DisponibilidadDia {
  id?: number;
  day_of_week: number; // 0=Lunes, 6=Domingo
  start_time: string;  // "HH:MM"
  end_time: string;    // "HH:MM"
  is_recurring: boolean;
}

export async function fetchDisponibilidad(tokens: Tokens, negocioId: number): Promise<DisponibilidadDia[]> {
  const response = await axios.get<DisponibilidadDia[]>(`${API_URL}/disponibilidad/?negocio_id=${negocioId}`, {
    headers: {
      Authorization: `Bearer ${tokens.access}`,
    },
  });
  return response.data;
}

export async function saveDisponibilidad(tokens: Tokens, disponibilidad: DisponibilidadDia[], negocioId: number): Promise<DisponibilidadDia[]> {
  const response = await axios.put<DisponibilidadDia[]>(`${API_URL}/disponibilidad/?negocio_id=${negocioId}`, disponibilidad, {
    headers: {
      Authorization: `Bearer ${tokens.access}`,
      'Content-Type': 'application/json',
    },
  });
  return response.data;
}
