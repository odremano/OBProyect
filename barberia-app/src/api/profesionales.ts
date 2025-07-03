import axios from 'axios';
import { Tokens } from './auth';

const API_URL = 'http://192.168.0.19:8000/api/v1/profesionales-disponibles/'; // Ajusta si es necesario

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
}

export interface Profesional {
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

export async function fetchProfesionales(tokens: Tokens): Promise<Profesional[]> {
  const response = await axios.get<ProfesionalesResponse>(API_URL, {
    headers: {
      Authorization: `Bearer ${tokens.access}`,
    },
  });
  return response.data.profesionales;
}
