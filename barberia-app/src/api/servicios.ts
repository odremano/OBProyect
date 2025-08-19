import axios from 'axios';
import { Tokens } from './auth';
import { API_URL } from './apiURL';

export interface Servicio {
  id: number;
  name: string;
  description: string;
  duration_minutes: number;
  price: string;
  is_active: boolean;
  icon_name: string;
}

interface ServiciosResponse {
  success: boolean;
  count: number;
  servicios: Servicio[];
}

export async function fetchServicios(tokens: Tokens, negocioId: number): Promise<Servicio[]> {
  try {
    const response = await axios.get<ServiciosResponse>(`${API_URL}/servicios-publicos/?negocio_id=${negocioId}`, {
      headers: {
        Authorization: `Bearer ${tokens.access}`,
      },
    });
    return response.data.servicios;
  } catch (error: any) {
    console.log('Error en fetchServicios:', error?.response?.data || error.message);
    throw error;
  }
}
