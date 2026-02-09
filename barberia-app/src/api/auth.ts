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

// Interfaz para negocio en el array inicial
export interface NegocioBasico {
  id: number;
  nombre: string;
  logo_url?: string;
  rol: string;
}

// Interfaz para negocio detallado de la lista
export interface NegocioDetallado {
  id: number;
  nombre: string;
  logo_url?: string;
  rol: string;
  is_favorite?: boolean;
  membership_id?: number;
}

// Interfaz para negocio completo (después de seleccionar)
export interface NegocioCompleto {
  id: number;
  nombre: string;
  logo_url?: string;
  logo_width?: number;
  logo_height?: number;
  theme_colors?: {
    light: ThemeColors;
    dark: ThemeColors;
  };
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
  negocios?: NegocioBasico[];
  negocio?: NegocioCompleto;
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

// Interfaz para seleccionar negocio
export interface SeleccionarNegocioSuccess {
  success: true;
  message: string;
  user: User; // Usuario con role y negocio completo
}

export interface SeleccionarNegocioError {
  success: false;
  message: string;
}

export type SeleccionarNegocioResult = SeleccionarNegocioSuccess | SeleccionarNegocioError;

export interface MisNegociosSuccess {
  success: true;
  negocios: NegocioDetallado[];
}

export interface MisNegociosError {
  success: false;
  message: string;
}

export type MisNegociosResult = MisNegociosSuccess | MisNegociosError;

// =============================================================================
// INTERFACES PARA REGISTRO
// =============================================================================

export interface RegistroData {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  password: string;
  password_confirm: string;
}

export interface RegistroSuccess {
  success: true;
  message: string;
  user: User;
  tokens: Tokens;
}

export interface RegistroError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

export type RegistroResult = RegistroSuccess | RegistroError;

// =============================================================================
// INTERFACES PARA UNIRSE A NEGOCIO
// =============================================================================

export interface UnirseNegocioSuccess {
  success: true;
  message: string;
  membership: {
    id: number;
    negocio_id: number;
    negocio_nombre: string;
    rol: string;
    is_active: boolean;
  };
}

export interface UnirseNegocioError {
  success: false;
  message: string;
}

export type UnirseNegocioResult = UnirseNegocioSuccess | UnirseNegocioError;

// =============================================================================
// INTERFACES PARA LISTAR NEGOCIOS DISPONIBLES
// =============================================================================

export interface NegocioPublico {
  id: number;
  nombre: string;
  address?: string;
  logo_url?: string;
  logo_width?: number;
  logo_height?: number;
  theme_colors?: {
    light: ThemeColors;
    dark: ThemeColors;
  };
}

export interface ListarNegociosSuccess {
  success: true;
  count: number;
  negocios: NegocioPublico[];
}

export interface ListarNegociosError {
  success: false;
  message: string;
}

export type ListarNegociosResult = ListarNegociosSuccess | ListarNegociosError;


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

// Función para seleccionar negocio
export async function seleccionarNegocio(
  negocioId: number,
  accessToken: string
): Promise<SeleccionarNegocioResult> {
  try {
    const response = await axios.post(
      `${API_URL}/auth/seleccionar-negocio/`,
      { negocio_id: negocioId },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

        if (response.data.success) {
      const backendUser = response.data.user;
      const backendNegocio = response.data.negocio;
      
      // Construir el usuario con la estructura correcta
      const mappedUser: User = {
        ...backendUser,
        role: backendUser.rol_en_negocio || backendNegocio?.rol, // Mapear rol
        negocio: backendNegocio, // Agregar negocio completo
      };
      
      console.log('Usuario mapeado:');
      console.log('- Rol:', mappedUser.role);
      console.log('- Negocio:', mappedUser.negocio?.nombre);
      
      return {
        success: true,
        message: response.data.message,
        user: mappedUser,
      };
    }
    
    
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data) {
      return {
        success: false,
        message: error.response.data.message || 'No se pudo seleccionar el negocio',
      };
    }
    return {
      success: false,
      message: 'Error de red o servidor no disponible',
    };
  }
}

export async function misNegocios(accessToken: string): Promise<MisNegociosResult> {
  try {
    const response = await axios.get(`${API_URL}/auth/mis-negocios/`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data) {
      return {
        success: false,
        message: error.response.data.message || 'No se pudieron cargar los negocios',
      };
    }
    return {
      success: false,
      message: 'Error de red o servidor no disponible',
    };
  }
}

// =============================================================================
// FUNCIÓN DE REGISTRO
// =============================================================================

export async function registro(
  data: RegistroData,
  negocioId?: number
): Promise<RegistroResult> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Si se proporciona negocioId, lo enviamos en el header para crear membership automáticamente
    if (negocioId) {
      headers['X-Negocio-ID'] = negocioId.toString();
    }
    
    const response = await axios.post(`${API_URL}/auth/registro/`, data, { headers });
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data) {
      const errorData = error.response.data;
      let errorMsg = errorData.message || 'Error en el registro';
      
      // Si hay errores específicos por campo, los agregamos al mensaje
      if (errorData.errors) {
        const erroresDetalle: string[] = [];
        Object.entries(errorData.errors).forEach(([campo, mensajes]) => {
          if (Array.isArray(mensajes)) {
            erroresDetalle.push(...mensajes);
          }
        });
        if (erroresDetalle.length > 0) {
          errorMsg = erroresDetalle.join('\n');
        }
      }
      
      return {
        success: false,
        message: errorMsg,
        errors: errorData.errors,
      };
    }
    return {
      success: false,
      message: 'Error de red o servidor no disponible',
    };
  }
}

// =============================================================================
// FUNCIÓN PARA UNIRSE A UN NEGOCIO
// =============================================================================

export async function unirseNegocio(
  negocioId: number,
  accessToken: string
): Promise<UnirseNegocioResult> {
  try {
    const response = await axios.post(
      `${API_URL}/auth/unirse-negocio/`,
      { negocio_id: negocioId },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data) {
      return {
        success: false,
        message: error.response.data.message || 'No se pudo unir al negocio',
      };
    }
    return {
      success: false,
      message: 'Error de red o servidor no disponible',
    };
  }
}

// =============================================================================
// FUNCIÓN PARA LISTAR NEGOCIOS DISPONIBLES (sin membership del usuario)
// =============================================================================

export async function negociosDisponibles(
  accessToken: string
): Promise<ListarNegociosResult> {
  try {
    const response = await axios.get(`${API_URL}/auth/negocios-disponibles/`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data) {
      return {
        success: false,
        message: error.response.data.message || 'No se pudieron cargar los negocios',
      };
    }
    return {
      success: false,
      message: 'Error de red o servidor no disponible',
    };
  }
}

// =============================================================================
// FUNCIÓN PARA LISTAR TODOS LOS NEGOCIOS (público, para registro)
// =============================================================================

export async function listarNegocios(): Promise<ListarNegociosResult> {
  try {
    const response = await axios.get(`${API_URL}/negocios/`);
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data) {
      return {
        success: false,
        message: error.response.data.message || 'No se pudieron cargar los negocios',
      };
    }
    return {
      success: false,
      message: 'Error de red o servidor no disponible',
    };
  }
}
