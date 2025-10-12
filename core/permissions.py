from rest_framework.permissions import BasePermission
from core.models import Membership

class IsMemberOfSelectedNegocio(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        negocio = getattr(request, 'negocio', None)

        if not user or not user.is_authenticated:
            return False

        if not negocio:
            return False  

        return Membership.objects.filter(
            user=user,
            negocio=negocio,
            is_active=True
        ).exists()
