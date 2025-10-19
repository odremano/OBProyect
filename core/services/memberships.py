from django.db import transaction
from core.models import Membership, Profesional, Usuario, Negocio
from typing import Optional
import logging

logger = logging.getLogger(__name__)


@transaction.atomic
def sync_profesional_profile(user: Usuario, negocio: Negocio, rol: str) -> Membership:
    """
    Sincroniza el perfil de Profesional con el rol de Membership.
    
    Lógica:
    - Si rol == 'profesional': crea/activa perfil Profesional
    - Si rol == 'cliente': desactiva perfil Profesional (no lo elimina para preservar historial)
    
    Args:
        user: Usuario a sincronizar
        negocio: Negocio en el que aplica el rol
        rol: Rol del usuario ('cliente', 'profesional')
    
    Returns:
        Membership: La membresía actualizada/creada
    """
    # 1. Crear o actualizar Membership
    membership, created = Membership.objects.get_or_create(
        user=user, 
        negocio=negocio,
        defaults={'rol': rol, 'is_active': True}
    )
    
    if not created and membership.rol != rol:
        membership.rol = rol
        membership.save(update_fields=['rol', 'updated_at'])
        logger.info(f"Membership actualizado: {user.username} @ {negocio.nombre} → {rol}")

    # 2. Sincronizar perfil Profesional según rol
    if rol == Membership.Roles.PROFESIONAL:
        # Crear o reactivar perfil profesional
        profesional, prof_created = Profesional.objects.get_or_create(
            user=user,
            negocio=negocio,
            defaults={
                'is_available': True,
                'bio': f'Profesional en {negocio.nombre}'
            }
        )
        
        if not prof_created:
            # Si ya existía pero estaba desactivado, reactivarlo
            if not profesional.is_available:
                profesional.is_available = True
                profesional.save(update_fields=['is_available', 'updated_at'])
                logger.info(f"Perfil profesional reactivado: {user.username} @ {negocio.nombre}")
        else:
            logger.info(f"Perfil profesional creado: {user.username} @ {negocio.nombre}")
    
    else:
        # Desactivar perfil profesional (no eliminarlo para preservar historial de turnos)
        updated = Profesional.objects.filter(
            user=user, 
            negocio=negocio,
            is_available=True
        ).update(is_available=False)
        
        if updated > 0:
            logger.info(f"Perfil profesional desactivado: {user.username} @ {negocio.nombre}")
    
    return membership


@transaction.atomic
def add_user_to_negocio(
    user: Usuario, 
    negocio: Negocio, 
    rol: str = Membership.Roles.CLIENTE,
    sync_profile: bool = True
) -> Membership:
    """
    Agrega un usuario a un negocio con un rol específico.
    
    Args:
        user: Usuario a agregar
        negocio: Negocio al que se agregará
        rol: Rol inicial ('cliente' por defecto)
        sync_profile: Si True, sincroniza automáticamente el perfil profesional
    
    Returns:
        Membership: La membresía creada/actualizada
    """
    if sync_profile:
        return sync_profesional_profile(user, negocio, rol)
    
    membership, _ = Membership.objects.get_or_create(
        user=user,
        negocio=negocio,
        defaults={'rol': rol, 'is_active': True}
    )
    return membership


def get_profesional_profile(user: Usuario, negocio: Negocio) -> Optional[Profesional]:
    """
    Obtiene el perfil profesional activo de un usuario en un negocio.
    
    Args:
        user: Usuario
        negocio: Negocio
    
    Returns:
        Profesional o None si no existe o está inactivo
    """
    try:
        return Profesional.objects.get(
            user=user,
            negocio=negocio,
            is_available=True
        )
    except Profesional.DoesNotExist:
        return None


def get_user_negocios(user: Usuario, only_active: bool = True) -> list[Negocio]:
    """
    Obtiene todos los negocios a los que pertenece un usuario.
    
    Args:
        user: Usuario
        only_active: Si True, solo devuelve membresías activas
    
    Returns:
        Lista de Negocio
    """
    queryset = Membership.objects.filter(user=user)
    
    if only_active:
        queryset = queryset.filter(is_active=True)
    
    return [m.negocio for m in queryset.select_related('negocio')]