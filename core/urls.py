from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    # APIs de Autenticación
    RegistroView, LoginView, LogoutView, PerfilView,
    
    # APIs Públicas
    servicios_publicos, profesionales_disponibles, resumen_barberia,
    
    # APIs de Reservas
    CrearTurnoView, MisTurnosView, CancelarTurnoView, consultar_disponibilidad
)

urlpatterns = [
    # =============================================================================
    # RUTAS DE AUTENTICACIÓN
    # =============================================================================
    
    # Registro y Login
    path('auth/registro/', RegistroView.as_view(), name='registro'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Perfil de usuario
    path('auth/perfil/', PerfilView.as_view(), name='perfil'),
    
    # =============================================================================
    # RUTAS PÚBLICAS (SIN AUTENTICACIÓN)
    # =============================================================================
    
    path('servicios-publicos/', servicios_publicos, name='servicios_publicos'),
    path('profesionales-disponibles/', profesionales_disponibles, name='profesionales_disponibles'),
    path('resumen-barberia/', resumen_barberia, name='resumen_barberia'),
    
    # =============================================================================
    # RUTAS DE RESERVAS
    # =============================================================================
    
    # Consultar disponibilidad (público)
    path('reservas/disponibilidad/', consultar_disponibilidad, name='consultar_disponibilidad'),
    
    # Gestión de turnos (requiere autenticación)
    path('reservas/crear/', CrearTurnoView.as_view(), name='crear_turno'),
    path('reservas/mis-turnos/', MisTurnosView.as_view(), name='mis_turnos'),
    path('reservas/cancelar/<int:turno_id>/', CancelarTurnoView.as_view(), name='cancelar_turno'),
] 