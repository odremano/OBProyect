import axios from 'axios';
import { Alert } from 'react-native';

const API_URL = 'http://192.168.0.19:8000/api/v1'; // Cambia si usas otra IP o puerto

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
    // Si la respuesta es exitosa, response.data.success será true
    return response.data;
  } catch (error: any) {
    console.log('Error al reservar:', error);
    // Si el backend devolvió un error con detalles
    if (error.response && error.response.data) {
      const data = error.response.data;
      let errorMsg = data.message || 'No se pudo reservar el turno.';
      if (data.errors) {
        const detalles = Object.values(data.errors).flat().join('\n');
        errorMsg += '\n' + detalles;
      }
      Alert.alert('Error', errorMsg);
    } else {
      Alert.alert('Error', 'No se pudo reservar el turno. Intenta nuevamente.');
    }
    return {
      success: false,
      message: 'Error de red o servidor no disponible',
    };
  }
}

