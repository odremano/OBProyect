from django.shortcuts import render
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.utils import timezone

from .models import Usuario, Servicio, Profesional, Turno, HorarioDisponibilidad, BloqueoHorario
from .serializers import (
    UsuarioSerializer, RegistroSerializer, LoginSerializer,
    ServicioSerializer, ProfesionalSerializer, TurnoBasicoSerializer,
    CrearTurnoSerializer, DisponibilidadConsultaSerializer, MisTurnosSerializer
)


# =============================================================================
# APIs DE AUTENTICACIÓN
# =============================================================================

class RegistroView(APIView):
    """
    API para registro de nuevos clientes.
    
    POST /api/v1/auth/registro/
    
    Permite a cualquier persona registrarse como cliente.
    Devuelve tokens JWT para autenticación inmediata.
    """
    permission_classes = [permissions.AllowAny]  # Público
    
    def post(self, request):
        serializer = RegistroSerializer(data=request.data)
        if serializer.is_valid():
            # Crear el usuario
            user = serializer.save()
            
            # Generar tokens JWT
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'success': True,
                'message': 'Usuario registrado exitosamente',
                'user': UsuarioSerializer(user).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            }, status=status.HTTP_201_CREATED)
        
        return Response({
            'success': False,
            'message': 'Error en el registro',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    """
    API para login de usuarios (clientes, profesionales, administradores).
    
    POST /api/v1/auth/login/
    
    Autentica usuario y devuelve tokens JWT.
    """
    permission_classes = [permissions.AllowAny]  # Público
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            
            # Generar tokens JWT
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'success': True,
                'message': 'Login exitoso',
                'user': UsuarioSerializer(user).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            })
        
        return Response({
            'success': False,
            'message': 'Credenciales inválidas',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    """
    API para logout de usuarios.
    
    POST /api/v1/auth/logout/
    
    Invalida el refresh token para mayor seguridad.
    """
    permission_classes = [permissions.IsAuthenticated]  # Requiere estar logueado
    
    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()  # Invalidar el token
                
            return Response({
                'success': True,
                'message': 'Logout exitoso'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'success': False,
                'message': 'Error en logout',
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class PerfilView(APIView):
    """
    API para obtener y actualizar el perfil del usuario autenticado.
    
    GET /api/v1/auth/perfil/ - Obtener perfil
    PUT /api/v1/auth/perfil/ - Actualizar perfil completo
    PATCH /api/v1/auth/perfil/ - Actualizar perfil parcial
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Obtener perfil del usuario autenticado"""
        serializer = UsuarioSerializer(request.user)
        return Response({
            'success': True,
            'user': serializer.data
        })
    
    def put(self, request):
        """Actualizar perfil completo"""
        serializer = UsuarioSerializer(request.user, data=request.data, partial=False)
        if serializer.is_valid():
            serializer.save()
            return Response({
                'success': True,
                'message': 'Perfil actualizado exitosamente',
                'user': serializer.data
            })
        
        return Response({
            'success': False,
            'message': 'Error al actualizar perfil',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    def patch(self, request):
        """Actualizar perfil parcial"""
        serializer = UsuarioSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({
                'success': True,
                'message': 'Perfil actualizado exitosamente',
                'user': serializer.data
            })
        
        return Response({
            'success': False,
            'message': 'Error al actualizar perfil',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


# =============================================================================
# APIs PÚBLICAS (SIN AUTENTICACIÓN)
# =============================================================================

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def servicios_publicos(request):
    """
    API pública para obtener servicios activos.
    
    GET /api/v1/servicios-publicos/
    
    Devuelve todos los servicios activos para mostrar en la app.
    """
    servicios = Servicio.objects.filter(is_active=True)
    serializer = ServicioSerializer(servicios, many=True)
    
    return Response({
        'success': True,
        'count': servicios.count(),
        'servicios': serializer.data
    })


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def profesionales_disponibles(request):
    """
    API pública para obtener profesionales disponibles.
    
    GET /api/v1/profesionales-disponibles/
    
    Devuelve profesionales activos para mostrar en la app.
    """
    profesionales = Profesional.objects.filter(is_available=True)
    serializer = ProfesionalSerializer(profesionales, many=True)
    
    return Response({
        'success': True,
        'count': profesionales.count(),
        'profesionales': serializer.data
    })


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def resumen_barberia(request):
    """
    API pública con información general de la barbería.
    
    GET /api/v1/resumen-barberia/
    
    Devuelve estadísticas básicas para mostrar en la app.
    """
    return Response({
        'success': True,
        'barberia': {
            'nombre': 'OdremanBarber',
            'total_servicios': Servicio.objects.filter(is_active=True).count(),
            'total_profesionales': Profesional.objects.filter(is_available=True).count(),
            'turnos_hoy': Turno.objects.filter(
                start_datetime__date__gte=timezone.now().date(),
                status__in=['pendiente', 'confirmado']
            ).count() if 'timezone' in globals() else 0,
        }
    })


# =============================================================================
# APIs DE RESERVAS
# =============================================================================

class CrearTurnoView(APIView):
    """
    API para crear nuevos turnos/reservas.
    
    POST /api/v1/reservas/crear/
    
    Solo para clientes autenticados.
    Valida disponibilidad completa antes de crear el turno.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        # Solo clientes pueden crear turnos
        if request.user.role != 'cliente':
            return Response({
                'success': False,
                'message': 'Solo los clientes pueden crear reservas'
            }, status=status.HTTP_403_FORBIDDEN)
        
        serializer = CrearTurnoSerializer(data=request.data)
        if serializer.is_valid():
            # Crear el turno asignando automáticamente el cliente
            turno = serializer.save(cliente=request.user)
            
            # Devolver información completa del turno creado
            turno_completo = MisTurnosSerializer(turno)
            
            return Response({
                'success': True,
                'message': 'Reserva creada exitosamente',
                'turno': turno_completo.data
            }, status=status.HTTP_201_CREATED)
        
        return Response({
            'success': False,
            'message': 'Error al crear la reserva',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class MisTurnosView(APIView):
    """
    API para obtener los turnos del usuario autenticado.
    
    GET /api/v1/reservas/mis-turnos/
    
    Devuelve todos los turnos del cliente con información completa.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        # Solo clientes pueden ver sus turnos
        if request.user.role != 'cliente':
            return Response({
                'success': False,
                'message': 'Solo los clientes pueden ver sus reservas'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Obtener turnos del usuario ordenados por fecha (más recientes primero)
        turnos = Turno.objects.filter(
            cliente=request.user
        ).order_by('-start_datetime')
        
        # Separar en diferentes categorías
        turnos_proximos = turnos.filter(
            start_datetime__gte=timezone.now(),
            status__in=['pendiente', 'confirmado']
        )
        
        turnos_pasados = turnos.filter(
            start_datetime__lt=timezone.now()
        )
        
        turnos_cancelados = turnos.filter(
            status='cancelado'
        )
        
        return Response({
            'success': True,
            'resumen': {
                'total_turnos': turnos.count(),
                'proximos': turnos_proximos.count(),
                'pasados': turnos_pasados.count(),
                'cancelados': turnos_cancelados.count(),
            },
            'turnos': {
                'proximos': MisTurnosSerializer(turnos_proximos, many=True).data,
                'pasados': MisTurnosSerializer(turnos_pasados[:5], many=True).data,  # Últimos 5
                'cancelados': MisTurnosSerializer(turnos_cancelados[:3], many=True).data,  # Últimos 3
            }
        })


class CancelarTurnoView(APIView):
    """
    API para cancelar un turno específico.
    
    POST /api/v1/reservas/cancelar/<turno_id>/
    
    Solo permite cancelar turnos propios con más de 2 horas de anticipación.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, turno_id):
        try:
            # Verificar que el turno existe y pertenece al usuario
            turno = Turno.objects.get(
                id=turno_id,
                cliente=request.user
            )
        except Turno.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Turno no encontrado'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Verificar que se puede cancelar
        from datetime import datetime, timedelta
        
        if turno.status not in ['pendiente', 'confirmado']:
            return Response({
                'success': False,
                'message': 'Este turno no se puede cancelar'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        tiempo_restante = turno.start_datetime - datetime.now()
        if tiempo_restante <= timedelta(hours=2):
            return Response({
                'success': False,
                'message': 'No se puede cancelar con menos de 2 horas de anticipación'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Cancelar el turno
        turno.status = 'cancelado'
        turno.save()
        
        return Response({
            'success': True,
            'message': 'Turno cancelado exitosamente',
            'turno': MisTurnosSerializer(turno).data
        })


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def consultar_disponibilidad(request):
    """
    API para consultar horarios disponibles de un profesional.
    
    GET /api/v1/reservas/disponibilidad/?profesional_id=1&fecha=2024-01-15&servicio_id=1
    
    Devuelve todos los horarios disponibles para hacer una reserva.
    """
    serializer = DisponibilidadConsultaSerializer(data=request.query_params)
    
    if not serializer.is_valid():
        return Response({
            'success': False,
            'message': 'Parámetros inválidos',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    profesional_id = serializer.validated_data['profesional_id']
    fecha = serializer.validated_data['fecha']
    servicio_id = serializer.validated_data['servicio_id']
    
    try:
        profesional = Profesional.objects.get(pk=profesional_id)
        servicio = Servicio.objects.get(id=servicio_id)
    except (Profesional.DoesNotExist, Servicio.DoesNotExist):
        return Response({
            'success': False,
            'message': 'Profesional o servicio no encontrado'
        }, status=status.HTTP_404_NOT_FOUND)
    
    # Obtener día de la semana (0=Lunes, 6=Domingo)
    dia_semana = fecha.weekday()
    
    # Obtener horarios de trabajo del profesional para ese día
    horarios_trabajo = HorarioDisponibilidad.objects.filter(
        profesional=profesional,
        day_of_week=dia_semana
    )
    
    if not horarios_trabajo.exists():
        return Response({
            'success': True,
            'profesional': profesional.user.get_full_name(),
            'fecha': fecha.strftime('%d/%m/%Y'),
            'servicio': servicio.name,
            'horarios_disponibles': [],
            'mensaje': 'El profesional no trabaja este día'
        })
    
    # Obtener turnos ya reservados para esa fecha
    turnos_ocupados = Turno.objects.filter(
        profesional=profesional,
        start_datetime__date=fecha,
        status__in=['pendiente', 'confirmado']
    )
    
    # Obtener bloqueos para esa fecha
    bloqueos = BloqueoHorario.objects.filter(
        profesional=profesional,
        start_datetime__date=fecha
    )
    
    # Generar slots de tiempo disponibles
    from datetime import datetime, timedelta
    slots_disponibles = []
    
    for horario_trabajo in horarios_trabajo:
        hora_inicio = horario_trabajo.start_time
        hora_fin = horario_trabajo.end_time
        
        # Generar slots cada 30 minutos
        slot_duration = timedelta(minutes=30)
        current_time = datetime.combine(fecha, hora_inicio)
        end_time = datetime.combine(fecha, hora_fin)
        
        while current_time + timedelta(minutes=servicio.duration_minutes) <= end_time:
            slot_start = current_time.time()
            slot_end = (current_time + timedelta(minutes=servicio.duration_minutes)).time()
            slot_start_datetime = datetime.combine(fecha, slot_start)
            slot_end_datetime = datetime.combine(fecha, slot_end)
            
            # Verificar si el slot está ocupado
            slot_disponible = True
            
            # Verificar turnos existentes
            for turno in turnos_ocupados:
                if not (slot_end_datetime <= turno.start_datetime or 
                       slot_start_datetime >= turno.end_datetime):
                    slot_disponible = False
                    break
            
            # Verificar bloqueos
            if slot_disponible:
                for bloqueo in bloqueos:
                    if not (slot_end_datetime <= bloqueo.start_datetime or 
                           slot_start_datetime >= bloqueo.end_datetime):
                        slot_disponible = False
                        break
            
            if slot_disponible:
                slots_disponibles.append({
                    'hora_inicio': slot_start.strftime('%H:%M'),
                    'hora_fin': slot_end.strftime('%H:%M'),
                    'datetime_inicio': slot_start_datetime.isoformat(),
                    'disponible': True
                })
            
            current_time += slot_duration
    
    return Response({
        'success': True,
        'profesional': profesional.user.get_full_name(),
        'fecha': fecha.strftime('%d/%m/%Y'),
        'servicio': servicio.name,
        'duracion_servicio': servicio.duration_minutes,
        'precio_servicio': float(servicio.price),
        'total_slots': len(slots_disponibles),
        'horarios_disponibles': slots_disponibles
    })
