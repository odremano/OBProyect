from django.shortcuts import render
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.utils import timezone

from .models import Usuario, Servicio, Profesional, Turno, HorarioDisponibilidad, BloqueoHorario, Negocio
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
    
    Autentica usuario y devuelve tokens JWT junto con datos del negocio.
    """
    permission_classes = [permissions.AllowAny]  # Público
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            username = serializer.validated_data['username']
            password = serializer.validated_data['password']
            
            # Autenticar usuario
            user = authenticate(username=username, password=password)
            if user:
                # Generar tokens JWT
                refresh = RefreshToken.for_user(user)
                
                # Preparar respuesta base
                response_data = {
                    'success': True,
                    'message': 'Login exitoso',
                    'user': UsuarioSerializer(user, context={'request': request}).data,
                    'tokens': {
                        'refresh': str(refresh),
                        'access': str(refresh.access_token),
                    }
                }
                
                # Añadir datos del negocio si el usuario tiene uno asignado
                if user.negocio:
                    negocio = user.negocio
                    response_data['negocio'] = {
                        'id': negocio.id,
                        'nombre': negocio.nombre,
                        'logo_url': request.build_absolute_uri(negocio.logo.url) if negocio.logo else None,
                        'theme_colors': negocio.theme_colors
                    }
                
                return Response(response_data, status=status.HTTP_200_OK)
            else:
                return Response({
                    'success': False,
                    'message': 'Credenciales inválidas'
                }, status=status.HTTP_401_UNAUTHORIZED)
        
        return Response({
            'success': False,
            'message': 'Datos inválidos',
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
    API pública para obtener servicios activos de un negocio específico.
    
    GET /api/v1/servicios-publicos/?negocio_id=1
    
    Devuelve todos los servicios activos para mostrar en la app.
    """
    negocio_id = request.query_params.get('negocio_id')
    
    if not negocio_id:
        return Response({
            'success': False,
            'message': 'Se requiere el parámetro negocio_id'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    servicios = Servicio.objects.filter(is_active=True, negocio_id=negocio_id)
    serializer = ServicioSerializer(servicios, many=True)
    
    return Response({
        'success': True,
        'servicios': serializer.data
    })


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def profesionales_disponibles(request):
    """
    API pública para obtener profesionales disponibles de un negocio específico.
    
    GET /api/v1/profesionales-disponibles/?negocio_id=1
    
    Devuelve profesionales activos para mostrar en la app.
    """
    negocio_id = request.query_params.get('negocio_id')
    
    if not negocio_id:
        return Response({
            'success': False,
            'message': 'Se requiere el parámetro negocio_id'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    profesionales = Profesional.objects.filter(is_available=True, negocio_id=negocio_id)
    serializer = ProfesionalSerializer(profesionales, many=True)
    
    return Response({
        'success': True,
        'profesionales': serializer.data
    })


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def resumen_barberia(request):
    """
    API pública con información general de un negocio específico.
    
    GET /api/v1/resumen-barberia/?negocio_id=1
    
    Devuelve estadísticas básicas para mostrar en la app.
    """
    negocio_id = request.query_params.get('negocio_id')
    
    if not negocio_id:
        return Response({
            'success': False,
            'message': 'Se requiere el parámetro negocio_id'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        negocio = Negocio.objects.get(id=negocio_id)
    except Negocio.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Negocio no encontrado'
        }, status=status.HTTP_404_NOT_FOUND)
    
    return Response({
        'success': True,
        'barberia': {
            'nombre': negocio.nombre,
            'total_servicios': Servicio.objects.filter(is_active=True, negocio_id=negocio_id).count(),
            'total_profesionales': Profesional.objects.filter(is_available=True, negocio_id=negocio_id).count(),
            'turnos_hoy': Turno.objects.filter(
                start_datetime__date__gte=timezone.now().date(),
                status__in=['pendiente', 'confirmado'],
                negocio_id=negocio_id
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
                'message': 'Solo los clientes pueden crear turnos'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Verificar que el usuario tenga negocio asignado
        if not request.user.negocio:
            return Response({
                'success': False,
                'message': 'Usuario no tiene negocio asignado'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = CrearTurnoSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            # Crear el turno asignando automáticamente el cliente y el negocio
            turno = serializer.save(cliente=request.user, negocio=request.user.negocio)
            
            # Devolver información completa del turno creado
            return Response({
                'success': True,
                'message': 'Turno creado exitosamente',
                'turno': MisTurnosSerializer(turno).data
            }, status=status.HTTP_201_CREATED)
        
        return Response({
            'success': False,
            'message': 'Datos inválidos',
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
                'message': 'Solo los clientes pueden ver sus turnos'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Verificar que el usuario tenga negocio asignado
        if not request.user.negocio:
            return Response({
                'success': False,
                'message': 'Usuario no tiene negocio asignado'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Obtener turnos del usuario del mismo negocio ordenados por fecha (más recientes primero)
        turnos = Turno.objects.filter(
            cliente=request.user,
            negocio=request.user.negocio
        ).order_by('-start_datetime')
        
        # Separar turnos por estado
        turnos_proximos = []
        turnos_historial = []
        
        for turno in turnos:
            turno_data = MisTurnosSerializer(turno).data
            
            # Si está confirmado y es futuro -> próximo
            if turno.status == 'pendiente' and turno.start_datetime > timezone.now():
                turnos_proximos.append(turno_data)
            # Si está completado, cancelado, o ya pasó -> historial
            else:
                turnos_historial.append(turno_data)
        
        return Response({
            'success': True,
            'turnos_proximos': turnos_proximos,
            'turnos_historial': turnos_historial,
            'total_turnos': len(turnos_proximos) + len(turnos_historial)
        })


class CancelarTurnoView(APIView):
    """
    API para cancelar un turno específico.
    
    POST /api/v1/reservas/cancelar/<turno_id>/
    
    Solo permite cancelar turnos propios con más de 2 horas de anticipación.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, turno_id):
        # Verificar que el usuario tenga negocio asignado
        if not request.user.negocio:
            return Response({
                'success': False,
                'message': 'Usuario no tiene negocio asignado'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Verificar que el turno existe, pertenece al usuario y al mismo negocio
            turno = Turno.objects.get(
                id=turno_id,
                cliente=request.user,
                negocio=request.user.negocio
            )
        except Turno.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Turno no encontrado'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Verificar que el turno se puede cancelar (más de 2 horas de anticipación)
        tiempo_restante = turno.start_datetime - timezone.now()
        if tiempo_restante.total_seconds() < 7200:  # 2 horas = 7200 segundos
            return Response({
                'success': False,
                'message': 'No se puede cancelar un turno con menos de 2 horas de anticipación'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verificar que el turno esté en estado válido para cancelar
        if turno.status not in ['pendiente', 'confirmado']:
            return Response({
                'success': False,
                'message': f'No se puede cancelar un turno en estado: {turno.status}'
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
    API para consultar horarios disponibles de un profesional de un negocio específico.
    
    GET /api/v1/reservas/disponibilidad/?profesional_id=1&fecha=2024-01-15&servicio_id=1&negocio_id=1
    
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
    negocio_id = request.query_params.get('negocio_id')
    
    if not negocio_id:
        return Response({
            'success': False,
            'message': 'Se requiere el parámetro negocio_id'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        profesional = Profesional.objects.get(pk=profesional_id, negocio_id=negocio_id)
        servicio = Servicio.objects.get(id=servicio_id, negocio_id=negocio_id)
    except (Profesional.DoesNotExist, Servicio.DoesNotExist):
        return Response({
            'success': False,
            'message': 'Profesional o servicio no encontrado en este negocio'
        }, status=status.HTTP_404_NOT_FOUND)
    
    # Obtener día de la semana (0=Lunes, 6=Domingo)
    dia_semana = fecha.weekday()
    
    # Obtener horarios de trabajo del profesional para ese día
    horarios_trabajo = HorarioDisponibilidad.objects.filter(
        profesional=profesional,
        day_of_week=dia_semana,
        negocio_id=negocio_id
    )
    
    if not horarios_trabajo.exists():
        return Response({
            'success': True,
            'horarios_disponibles': [],
            'message': 'El profesional no trabaja este día'
        })
    
    # Obtener turnos existentes para esa fecha
    turnos_existentes = Turno.objects.filter(
        profesional=profesional,
        start_datetime__date=fecha,
        status__in=['pendiente', 'confirmado'],
        negocio_id=negocio_id
    )
    
    # Obtener bloqueos para esa fecha
    bloqueos = BloqueoHorario.objects.filter(
        profesional=profesional,
        start_datetime__date=fecha,
        negocio_id=negocio_id
    )
    
    # Generar horarios disponibles
    horarios_disponibles = []
    duracion_servicio = servicio.duration_minutes
    
    for horario in horarios_trabajo:
        # Generar slots de tiempo cada 30 minutos
        hora_actual = timezone.datetime.combine(fecha, horario.start_time)
        hora_fin = timezone.datetime.combine(fecha, horario.end_time)
        
        while hora_actual + timezone.timedelta(minutes=duracion_servicio) <= hora_fin:
            # Verificar si hay conflicto con turnos existentes
            hay_conflicto = False
            
            for turno in turnos_existentes:
                if (hora_actual < turno.end_datetime and 
                    hora_actual + timezone.timedelta(minutes=duracion_servicio) > turno.start_datetime):
                    hay_conflicto = True
                    break
            
            # Verificar si hay conflicto con bloqueos
            if not hay_conflicto:
                for bloqueo in bloqueos:
                    if (hora_actual < bloqueo.end_datetime and 
                        hora_actual + timezone.timedelta(minutes=duracion_servicio) > bloqueo.start_datetime):
                        hay_conflicto = True
                        break
            
            # Si no hay conflicto, es un horario disponible
            if not hay_conflicto:
                horarios_disponibles.append({
                    'hora_inicio': hora_actual.time().strftime('%H:%M'),
                    'hora_fin': (hora_actual + timezone.timedelta(minutes=duracion_servicio)).time().strftime('%H:%M'),
                    'disponible': True
                })
            
            # Avanzar al siguiente slot (cada 30 minutos)
            hora_actual += timezone.timedelta(minutes=30)
    
    return Response({
        'success': True,
        'fecha': fecha.strftime('%Y-%m-%d'),
        'profesional': ProfesionalSerializer(profesional).data,
        'servicio': ServicioSerializer(servicio).data,
        'horarios_disponibles': horarios_disponibles,
        'total_disponibles': len(horarios_disponibles)
    })
