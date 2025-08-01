import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from './apiURL';
import { Tokens } from './auth'; // Reutilizar el tipo Tokens de auth.ts

export interface CambiarContrasenaPayload {
  current_password: string;
  new_password: string;
  new_password_confirm: string;
}

export interface CambiarContrasenaSuccess {
  success: true;
  message: string;
  tokens: {
    access: string;
    refresh: string;
  };
}

export interface CambiarContrasenaError {
  success: false;
  message: string;
  errors?: {
    current_password?: string[];
    new_password?: string[];
    new_password_confirm?: string[];
    non_field_errors?: string[];
  };
}

export type CambiarContrasenaResponse = CambiarContrasenaSuccess | CambiarContrasenaError;

export async function cambiarContrasena(
  tokens: Tokens, 
  payload: CambiarContrasenaPayload
): Promise<CambiarContrasenaResponse> {
  try {
    const response = await axios.post<CambiarContrasenaResponse>(
      `${API_URL}/auth/cambiar-contrasena/`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${tokens.access}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data) {
      const data = error.response.data;
      let errorMsg = data.message || 'No se pudo cambiar la contraseña.';
      
      if (data.errors) {
        const errores = Object.entries(data.errors).map(([campo, mensajes]) => {
          if (Array.isArray(mensajes)) {
            return mensajes.join(', ');
          }
          return mensajes;
        });
        if (errores.length > 0) {
          errorMsg = errores.join('\n');
        }
      }
      
      return {
        success: false,
        message: errorMsg,
        errors: data.errors,
      };
    } else {
      return {
        success: false,
        message: 'Error de red o servidor no disponible',
      };
    }
  }
}

/**
 * Función helper para obtener tokens desde AsyncStorage de forma consistente con AuthContext
 */
export async function obtenerTokensDelStorage(): Promise<Tokens | null> {
  try {
    const tokenData = await AsyncStorage.getItem('tokens');
    if (tokenData) {
      return JSON.parse(tokenData) as Tokens;
    }
    return null;
  } catch (error) {
    console.error('Error obteniendo tokens del storage:', error);
    return null;
  }
}

/**
 * Función helper para guardar tokens en AsyncStorage de forma consistente con AuthContext
 */
export async function guardarTokensEnStorage(tokens: Tokens): Promise<void> {
  try {
    await AsyncStorage.setItem('tokens', JSON.stringify(tokens));
  } catch (error) {
    console.error('Error guardando tokens en storage:', error);
  }
}