from typing import Optional
from .models import Membership, Negocio, Profesional, Usuario

class Roles:
    PROFESIONAL = "profesional"
    CLIENTE = "cliente"


def get_membership_role(user, negocio: Negocio) -> Optional[str]:
    """
    Obtiene el rol del usuario en un negocio específico.
    
    Returns:
        str: 'cliente', 'profesional' o None
    """
    if not user or not getattr(negocio, "id", None):
        return None
    try:
        m = Membership.objects.only("rol").get(user=user, negocio=negocio, is_active=True)
        return m.rol
    except Membership.DoesNotExist:
        return None


def has_role(user, negocio, role: str) -> bool:
    """Verifica si el usuario tiene un rol específico en el negocio"""
    return get_membership_role(user, negocio) == role


def has_any_role(user, negocio, allowed: tuple[str, ...]) -> bool:
    """Verifica si el usuario tiene alguno de los roles permitidos"""
    rol = get_membership_role(user, negocio)
    return rol in allowed if rol else False


def is_profesional(user, negocio) -> bool:
    """Atajo: verifica si el usuario es profesional en el negocio"""
    return has_role(user, negocio, Roles.PROFESIONAL)


def is_cliente(user, negocio) -> bool:
    """Atajo: verifica si el usuario es cliente en el negocio"""
    return has_role(user, negocio, Roles.CLIENTE)


def can_receive_appointments(user, negocio) -> bool:
    """
    Verifica si el usuario puede recibir turnos.
    Requiere rol de profesional Y perfil profesional activo.
    """
    if not is_profesional(user, negocio):
        return False
    
    # Verificar que existe perfil profesional activo
    return Profesional.objects.filter(
        user=user,
        negocio=negocio,
        is_available=True
    ).exists()


def get_active_membership(user: Usuario, negocio: Negocio) -> Optional[Membership]:
    """
    Obtiene la membresía activa del usuario en un negocio.
    
    Returns:
        Membership o None
    """
    try:
        return Membership.objects.select_related('user', 'negocio').get(
            user=user,
            negocio=negocio,
            is_active=True
        )
    except Membership.DoesNotExist:
        return None


def user_has_access_to_negocio(user, negocio) -> bool:
    """
    Verifica si el usuario tiene acceso (cualquier rol activo) al negocio.
    """
    if not user or not user.is_authenticated:
        return False
    
    return Membership.objects.filter(
        user=user,
        negocio=negocio,
        is_active=True
    ).exists()