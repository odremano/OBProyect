import axios from 'axios';
import { Tokens } from './auth';
import { API_URL } from './apiURL';

export interface UserDetails {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  role: string;
  is_active: boolean;
  date_joined: string;
  profile_picture_url?: string;
}

export interface Profesional {
  id: number; // Este es el profesional_id que necesitamos
  user: number;
  user_details: UserDetails;
  bio: string;
  profile_picture_url: string | null;
  is_available: boolean;
}

interface ProfesionalesResponse {
  success: boolean;
  count: number;
  profesionales: Profesional[];
}

export async function fetchProfesionales(tokens: Tokens, negocioId: number): Promise<Profesional[]> {
  const response = await axios.get<ProfesionalesResponse>(`${API_URL}/profesionales-disponibles/?negocio_id=${negocioId}`, {
    headers: {
      Authorization: `Bearer ${tokens.access}`,
    },
  });
  return response.data.profesionales;
}
