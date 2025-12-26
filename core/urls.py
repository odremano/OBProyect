from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    # APIs de Autenticación
    RegistroView, BotRegistroView, mis_negocios, seleccionar_negocio, LoginView, LogoutView, PerfilView, CambiarContrasenaView,
    
    # APIs Públicas
    servicios_publicos, profesionales_disponibles, resumen_negocio,
    
    # APIs de Reservas
    CrearTurnoView, MisTurnosView, CancelarTurnoView, consultar_disponibilidad,

    # APIs de Disponibilidad de Profesionales (21/07/2025)
    disponibilidad_profesional,
    
    # APIs de Agenda del Profesional
    AgendaProfesionalView, DiasConTurnosView, CompletarTurnoView, CancelarTurnoProfesionalView,
    
    # Endpoint optimizado para calendario
    DiasConDisponibilidadView,

    # API Check User
    check_user
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
    path('auth/mis-negocios/', mis_negocios, name='mis-negocios'),
    path('auth/seleccionar-negocio/', seleccionar_negocio, name='seleccionar_negocio'),
    path('auth/cambiar-negocio/', seleccionar_negocio, name='cambiar_negocio'),  # Alias
    
    # Perfil de usuario
    path('auth/perfil/', PerfilView.as_view(), name='perfil'),
    path('auth/cambiar-contrasena/', CambiarContrasenaView.as_view(), name='cambiar_contrasena'),
    
    # Check User (21/07/2025)
    path('check-user/', check_user, name='check_user'),
    
    # =============================================================================
    # RUTAS DE BOT DE WHATSAPP
    # =============================================================================
    
    # Registro desde bot de WhatsApp
    path('bot/register/', BotRegistroView.as_view(), name='bot_registro'),
    
    # =============================================================================
    # RUTAS PÚBLICAS (SIN AUTENTICACIÓN)
    # =============================================================================
    
    path('servicios-publicos/', servicios_publicos, name='servicios_publicos'),
    path('profesionales-disponibles/', profesionales_disponibles, name='profesionales_disponibles'),
    path('resumen-negocio/', resumen_negocio, name='resumen_negocio'),
    
    # =============================================================================
    # RUTAS DE RESERVAS
    # =============================================================================
    
    # Consultar disponibilidad (público)
    path('reservas/disponibilidad/', consultar_disponibilidad, name='consultar_disponibilidad'),
    # Nuevo endpoint optimizado para obtener días con disponibilidad (público)
    path('reservas/dias-con-disponibilidad/', DiasConDisponibilidadView.as_view(), name='dias_con_disponibilidad'),
    # Consultar disponibilidad (privada)
    path('disponibilidad/', disponibilidad_profesional, name='disponibilidad_profesional'),
    
    # Gestión de turnos (requiere autenticación)
    path('reservas/crear/', CrearTurnoView.as_view(), name='crear_turno'),
    path('reservas/mis-turnos/', MisTurnosView.as_view(), name='mis_turnos'),
    path('reservas/cancelar/<int:turno_id>/', CancelarTurnoView.as_view(), name='cancelar_turno'),
    
    # =============================================================================
    # RUTAS DE AGENDA DEL PROFESIONAL
    # =============================================================================
    
    # Agenda del profesional
    path('reservas/agenda-profesional/', AgendaProfesionalView.as_view(), name='agenda_profesional'),
    path('reservas/dias-con-turnos/', DiasConTurnosView.as_view(), name='dias_con_turnos'),
    path('reservas/completar/<int:turno_id>/', CompletarTurnoView.as_view(), name='completar_turno'),
    path('reservas/cancelar-profesional/<int:turno_id>/', CancelarTurnoProfesionalView.as_view(), name='cancelar_turno_profesional'),

]