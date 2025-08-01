import axios from 'axios';
import { Alert } from 'react-native';
import { API_URL } from './apiURL';

// Interfaz para los colores del tema
export interface ThemeColors {
  dark2: string;
  dark3: string;
  light2: string;
  light3: string;
  primary: string;
  background: string;
  primaryDark: string;
}

// Define el tipo de respuesta esperada del backend
export interface User {
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
  negocio?: {
    id: number;
    nombre: string;
    logo_url?: string;
    theme_colors?: ThemeColors;
  };
}

export interface Tokens {
  refresh: string;
  access: string;
}

export interface LoginSuccess {
  success: true;
  message: string;
  user: User;
  tokens: Tokens;
  negocio?: {
    id: number;
    nombre: string;
    logo_url?: string;
    theme_colors?: ThemeColors;
  };
}

export interface LoginError {
  success: false;
  message: string;
  errors?: any;
}

export type LoginResult = LoginSuccess | LoginError;

export async function login(username: string, password: string): Promise<LoginResult> {
  try {
    console.log('Login URL:', `${API_URL}/auth/login/`);
    const response = await axios.post(`${API_URL}/auth/login/`, {
      username,
      password,
    });
    console.log('Respuesta completa del login:', response.data);
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data) {
      const data = error.response.data;
      let errorMsg = data.message || 'No se pudo iniciar sesión.';
      if (data.errors) {
        const detalles = Object.values(data.errors).flat();
        if (detalles.includes(errorMsg)) {
          errorMsg = errorMsg;
        } else {
          errorMsg += '\n' + detalles.join('\n');
        }
      }
      return {
        success: false,
        message: errorMsg,
      };
    } else {
      // Error de red
      return {
        success: false,
        message: 'Error de red o servidor no disponible',
      };
    }
  }
}

