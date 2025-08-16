import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from './apiURL';
import { Tokens, User } from './auth'; // Reutilizar tipos de auth.ts

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

// ================================
// Actualizar / Obtener Perfil
// ================================
export interface ActualizarPerfilPayload {
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  profile_picture_url?: string;
}

export interface ActualizarPerfilSuccess {
  success: true;
  message: string;
  user: User;
}

export interface ActualizarPerfilError {
  success: false;
  message: string;
  errors?: Record<string, string[] | string>;
}

export type ActualizarPerfilResponse = ActualizarPerfilSuccess | ActualizarPerfilError;

export async function actualizarPerfil(
  tokens: Tokens,
  payload: ActualizarPerfilPayload
): Promise<ActualizarPerfilResponse> {
  try {
    const response = await axios.patch<ActualizarPerfilResponse>(
      `${API_URL}/auth/perfil/`,
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
      let errorMsg = data.message || 'No se pudo actualizar el perfil.';

      if (data.errors) {
        const errores = Object.entries(data.errors).map(([_, mensajes]) => {
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

export interface ObtenerPerfilSuccess {
  success: true;
  user: User;
}

export interface ObtenerPerfilError {
  success: false;
  message: string;
}

export type ObtenerPerfilResponse = ObtenerPerfilSuccess | ObtenerPerfilError;

export async function obtenerPerfil(tokens: Tokens): Promise<ObtenerPerfilResponse> {
  try {
    const response = await axios.get<ObtenerPerfilResponse>(`${API_URL}/auth/perfil/`, {
      headers: {
        Authorization: `Bearer ${tokens.access}`,
      },
    });
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data) {
      const data = error.response.data;
      return {
        success: false,
        message: data.message || 'No se pudo obtener el perfil.',
      };
    } else {
      return {
        success: false,
        message: 'Error de red o servidor no disponible',
      };
    }
  }
}