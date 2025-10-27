from rest_framework.permissions import BasePermission
from core.models import Membership
from core.roles import Roles, has_any_role, can_receive_appointments, user_has_access_to_negocio


class IsMemberOfSelectedNegocio(BasePermission):
    """
    Verifica que el usuario sea miembro activo del negocio en contexto.
    Requiere que request.negocio esté establecido por el middleware.
    """
    message = "No tienes acceso a este negocio."
    
    def has_permission(self, request, view):
        user = request.user
        negocio = getattr(request, 'negocio', None)

        if not user or not user.is_authenticated:
            return False

        if not negocio:
            return False

        return user_has_access_to_negocio(user, negocio)


class IsProfessionalOfSelectedNegocio(BasePermission):
    """
    Requiere que el usuario tenga rol 'profesional' en el negocio actual.
    """
    message = "Solo los profesionales pueden acceder a este recurso."
    
    def has_permission(self, request, view):
        negocio = getattr(request, "negocio", None)
        if not negocio or not request.user or not request.user.is_authenticated:
            return False
        
        return has_any_role(request.user, negocio, (Roles.PROFESIONAL,))


class CanReceiveAppointments(BasePermission):
    """
    Verifica que el usuario pueda recibir turnos:
    - Tiene rol profesional
    - Tiene perfil profesional activo en el negocio
    """
    message = "No tienes un perfil profesional activo para recibir turnos."
    
    def has_permission(self, request, view):
        negocio = getattr(request, "negocio", None)
        if not negocio or not request.user or not request.user.is_authenticated:
            return False
        
        return can_receive_appointments(request.user, negocio)


class IsClienteOfSelectedNegocio(BasePermission):
    """
    Verifica que el usuario sea cliente en el negocio actual.
    Usado para endpoints que solo clientes deben usar (crear turnos, etc.)
    """
    message = "Solo los clientes pueden realizar esta acción."
    
    def has_permission(self, request, view):
        negocio = getattr(request, "negocio", None)
        if not negocio or not request.user or not request.user.is_authenticated:
            return False
        
        return Membership.objects.filter(
            user=request.user,
            negocio=negocio,
            rol=Roles.CLIENTE,
            is_active=True
        ).exists()