import logging
from django.utils.deprecation import MiddlewareMixin
from core.models import Membership, Negocio
from rest_framework_simplejwt.authentication import JWTAuthentication

logger = logging.getLogger(__name__)

class NegocioContextMiddleware(MiddlewareMixin):
    def process_request(self, request):
        request.negocio = None

        # --- Autenticación vía JWT (solo si aplica; no interfiere con Admin) ---
        # Si la request trae JWT, autenticamos y dejamos request.user con ese usuario.
        # Si no trae, no tocamos request.user (sesión del Admin sigue igual).
        try:
            user_auth_tuple = JWTAuthentication().authenticate(request)
            if user_auth_tuple is not None:
                user, token = user_auth_tuple
                request.user = user
        except Exception as e:
            logger.debug("[JWT ERROR] %s", e)

        user = getattr(request, 'user', None)

        # --- 1) Negocio por Header/Query (app móvil/web) ---
        negocio_id = request.headers.get('X-Negocio-ID') or request.GET.get('negocio_id')
        print(f">> Header X-Negocio-ID recibido: {negocio_id}")

        if negocio_id:
            try:
                # Validar pertenencia si hay usuario autenticado (evita 404 y excepciones)
                if user and getattr(user, "is_authenticated", False) and not getattr(user, "is_superuser", False):
                    if not Membership.objects.filter(user=user, negocio_id=negocio_id, is_active=True).exists():
                        request.negocio = None
                        print(f"[DEBUG] Resultado final request.negocio = {getattr(request.negocio, 'id', None)}")
                        return
                request.negocio = Negocio.objects.filter(id=negocio_id).first()
                print(f"[DEBUG] Resultado final request.negocio = {getattr(request.negocio, 'id', None)}")
                return
            except Exception as e:
                logger.debug("[NEGOCIO HEADER ERROR] %s", e)

        # --- 2) Fallback Admin: sesión o primera membership activa ---
        # Aplica para usuario autenticado por sesión (Admin) o API sin header.
        if user and getattr(user, "is_authenticated", False) and not getattr(user, "is_superuser", False):
            # a) Sesión
            sid = request.session.get('active_negocio_id')
            if sid:
                request.negocio = Negocio.objects.filter(id=sid).first()
                if request.negocio:
                    print(f"[DEBUG] Resultado final request.negocio = {request.negocio.id}")
                    return
                else:
                    # limpiar sesión inválida
                    request.session.pop('active_negocio_id', None)

            # b) Primera membership activa
            mid = Membership.objects.filter(user=user, is_active=True).values_list('negocio_id', flat=True).first()
            if mid:
                request.session['active_negocio_id'] = mid
                request.negocio = Negocio.objects.filter(id=mid).first()

        print(f"[DEBUG] Resultado final request.negocio = {getattr(request.negocio, 'id', None)}")
