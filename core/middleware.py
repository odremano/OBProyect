import logging
from django.utils.deprecation import MiddlewareMixin
from core.models import Membership, Negocio
from rest_framework_simplejwt.authentication import JWTAuthentication

logger = logging.getLogger(__name__)

class NegocioContextMiddleware(MiddlewareMixin):
    def process_request(self, request):
        request.negocio = None

        # Autenticación vía JWT (si aplica)
        jwt_auth = JWTAuthentication()
        try:
            user_auth_tuple = jwt_auth.authenticate(request)
            if user_auth_tuple is not None:
                user, token = user_auth_tuple
                request.user = user
        except Exception as e:
            print(f"[JWT ERROR] {e}")

        user = getattr(request, 'user', None)
        negocio_id = request.headers.get('X-Negocio-ID') or request.GET.get('negocio_id')

        print(f">> Header X-Negocio-ID recibido: {negocio_id}")

        if negocio_id:
            if user and user.is_authenticated:
                try:
                    Membership.objects.get(user=user, negocio_id=negocio_id, is_active=True)
                    request.negocio = Negocio.objects.get(id=negocio_id)
                except Membership.DoesNotExist:
                    request.negocio = None
                except Negocio.DoesNotExist:
                    request.negocio = None
            else:
                try:
                    request.negocio = Negocio.objects.get(id=negocio_id)
                except Negocio.DoesNotExist:
                    request.negocio = None

        print(f"[DEBUG] Resultado final request.negocio = {getattr(request.negocio, 'id', None)}")
