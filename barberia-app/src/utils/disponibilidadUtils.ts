import { Profesional } from '../api/profesionales';

interface ProfesionalConDisponibilidad extends Profesional {
  proximaDisponibilidad?: string;
  cargandoDisponibilidad?: boolean;
}

// Función para mostrar el estado de disponibilidad
export const mostrarEstadoDisponibilidad = (profesional: ProfesionalConDisponibilidad): string | null => {
  if (profesional.cargandoDisponibilidad) {
    return 'Verificando disponibilidad...';
  }
  
  if (profesional.proximaDisponibilidad && profesional.proximaDisponibilidad !== 'Consultar disponibilidad') {
    return `Próximo turno: ${profesional.proximaDisponibilidad}hs`;
  }
  
  // No mostrar nada si no hay disponibilidad específica o si es "Consultar disponibilidad"
  return null;
};

// Función para mostrar la bio del profesional
export const mostrarBioProfesional = (profesional: ProfesionalConDisponibilidad): string => {
  return profesional.bio || 'Especialista en cortes modernos y clásicos';
}; 