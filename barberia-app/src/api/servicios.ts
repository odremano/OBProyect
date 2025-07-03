import axios from 'axios';
import { Tokens } from './auth';

const API_URL = 'http://192.168.0.19:8000/api/v1/servicios-publicos/'; // Ajusta si es necesario

export interface Servicio {
  id: number;
  name: string;
  description: string;
  duration_minutes: number;
  price: string;
  is_active: boolean;
}

interface ServiciosResponse {
  success: boolean;
  count: number;
  servicios: Servicio[];
}

export async function fetchServicios(tokens: Tokens): Promise<Servicio[]> {
  const response = await axios.get<ServiciosResponse>(API_URL, {
    headers: {
      Authorization: `Bearer ${tokens.access}`,
    },
  });
  return response.data.servicios;
}
