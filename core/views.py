from django.shortcuts import render
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.utils import timezone
from datetime import datetime, timedelta, date
from rest_framework import serializers
from core.permissions import IsMemberOfSelectedNegocio
from core.roles import is_profesional, is_cliente
from core.services.memberships import get_profesional_profile
import calendar
from core.roles import Roles, has_role

from .models import Usuario, Servicio, Profesional, Turno, HorarioDisponibilidad, BloqueoHorario, Negocio, Membership
from .serializers import (
    UsuarioSerializer, UsuarioLoginSerializer, RegistroSerializer, LoginSerializer,
    ServicioSerializer, ProfesionalSerializer, TurnoBasicoSerializer,
    CrearTurnoSerializer, DisponibilidadConsultaSerializer, MisTurnosSerializer, HorarioDisponibilidadSerializer,
    AgendaProfesionalSerializer, CambiarContrasenaSerializer
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
        # El serializer ya se encarga de normalizar el username
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

    Autentica usuario y devuelve tokens JWT junto con datos del usuario.
    """
    permission_classes = [permissions.AllowAny]  # Público

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'success': False,
                'message': 'Datos inválidos',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        username = serializer.validated_data['username'].lower()
        password = serializer.validated_data['password']

        # Autenticar usuario
        user = authenticate(username=username, password=password)
        if not user:
            return Response({
                'success': False,
                'message': 'Credenciales inválidas'
            }, status=status.HTTP_401_UNAUTHORIZED)

        # Generar tokens JWT
        refresh = RefreshToken.for_user(user)

        # Datos base del usuario
        user_data = UsuarioLoginSerializer(user, context={'request': request}).data

        # Foto de perfil: global en Usuario; fallback temporal a Profesional
        # (sin depender de user.role)
        if getattr(user, "profile_picture_url", None):
            user_data['profile_picture_url'] = user.profile_picture_url

        # Respuesta (mismo shape que ya usas)
        response_data = {
            'success': True,
            'message': 'Login exitoso',
            'user': user_data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }
        return Response(response_data, status=status.HTTP_200_OK)
    
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def mis_negocios(request):
    """
    API para obtener todos los negocios a los que el usuario está vinculado.
    
    GET /api/v1/auth/mis-negocios/
    
    Devuelve una lista de negocios con el rol del usuario en cada uno.
    """
    memberships = Membership.objects.filter(user=request.user).select_related('negocio')
    
    negocios = []
    for membership in memberships:
        negocio = membership.negocio
        negocios.append({
            'id': negocio.id,
            'nombre': negocio.nombre,
            'logo_url': request.build_absolute_uri(negocio.logo.url) if negocio.logo else None,
            'rol': membership.rol,
        })
    
    return Response({
        'success': True,
        'negocios': negocios
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def seleccionar_negocio(request):
    """
    API para validar y obtener información del negocio seleccionado.
    
    POST /api/v1/auth/seleccionar-negocio/
    Body: { "negocio_id": 1 }
    
    El frontend debe:
    1. Guardar el negocio_id en storage local
    2. Enviar X-Negocio-ID en cada request subsiguiente

    Sirve para ambos casos (Seleccionar negocio al primer login y para cambiar después)
    """
    negocio_id = request.data.get('negocio_id')

    if not negocio_id:
        return Response({
            'success': False,
            'message': 'Se requiere el parámetro negocio_id'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        membership = Membership.objects.select_related('negocio').get(
            user=request.user,
            negocio_id=negocio_id,
            is_active=True
        )
    except Membership.DoesNotExist:
        return Response({
            'success': False,
            'message': 'No tienes acceso a este negocio'
        }, status=status.HTTP_403_FORBIDDEN)

    negocio = membership.negocio

    # Respuesta completa con toda la info del negocio
    return Response({
        'success': True,
        'message': 'Negocio seleccionado correctamente',
        'negocio': {
            'id': negocio.id,
            'nombre': negocio.nombre,
            'logo_url': request.build_absolute_uri(negocio.logo.url) if negocio.logo else None,
            'logo_width': negocio.logo_width,
            'logo_height': negocio.logo_height,
            'theme_colors': negocio.theme_colors,
            'rol': membership.rol,  # IMPORTANTE: Incluir el rol del usuario
        },
        'user': {
            'id': request.user.id,
            'username': request.user.username,
            'rol_en_negocio': membership.rol,  # Para que el frontend sepa si es cliente o profesional
        }
    }, status=status.HTTP_200_OK)

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
@permission_classes([permissions.AllowAny])  # sigue siendo pública
def servicios_publicos(request):
    """
    API pública para obtener servicios activos de un negocio.
    Requiere negocio vía header X-Negocio-ID o fallback por middleware.

    GET /api/v1/servicios-publicos/

    Header opcional: X-Negocio-ID
    """
    negocio = getattr(request, 'negocio', None)

    if not negocio:
        return Response({
            'success': False,
            'message': 'No se pudo determinar el negocio. Asegúrese de enviar X-Negocio-ID.'
        }, status=status.HTTP_400_BAD_REQUEST)

    servicios = Servicio.objects.filter(is_active=True, negocio=negocio)
    serializer = ServicioSerializer(servicios, many=True)

    return Response({
        'success': True,
        'servicios': serializer.data
    })


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def profesionales_disponibles(request):
    """
    API pública para obtener profesionales disponibles del negocio en contexto.

    GET /api/v1/profesionales-disponibles/
    """
    negocio = getattr(request, 'negocio', None)

    if not negocio:
        return Response({
            'success': False,
            'message': 'No se pudo determinar el negocio.'
        }, status=status.HTTP_400_BAD_REQUEST)

    profesionales = Profesional.objects.filter(is_available=True, negocio=negocio)
    serializer = ProfesionalSerializer(profesionales, many=True)

    return Response({
        'success': True,
        'profesionales': serializer.data
    })



@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def resumen_negocio(request):
    """
    API pública con información general de un negocio específico.
    
    GET /api/v1/resumen-negocio/?negocio_id=1
    
    Devuelve estadísticas básicas para mostrar en la app.
    """
    negocio = getattr(request, 'negocio', None)
    
    if not negocio:
        return Response({
            'success': False,
            'message': 'No se pudo determinar el negocio. Asegúrese de enviar el X-Negocio-ID en los header'
        }, status=status.HTTP_400_BAD_REQUEST)

    today = timezone.now().date()

    return Response({
        'success': True,
        'negocio': {
            'nombre': negocio.nombre,
            'total_servicios': Servicio.objects.filter(is_active=True, negocio=negocio).count(),
            'total_profesionales': Profesional.objects.filter(is_available=True, negocio=negocio).count(),
            'turnos_hoy': Turno.objects.filter(
                start_datetime__date=today,
                status__in=['pendiente', 'confirmado'],
                negocio=negocio
            ).count(),
        }
    })


# =============================================================================
# API CHECK USER (07/12/2025) - BotWhatsapp
# =============================================================================

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def check_user(request):
    """
    API para verificar si un usuario existe por su número de teléfono.
    
    GET /api/v1/check-user/?phone=+5491173616085
    """
    phone = request.query_params.get('phone')
    
    if not phone:
        return Response({
            'found': False,
            'message': 'Parámetro phone requerido'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Buscar usuario por teléfono (case insensitive o exacto según necesidad, aquí exacto)
    try:
        user = Usuario.objects.get(phone_number=phone)
    except Usuario.DoesNotExist:
        return Response({
            "found": False,
            "message": "Usuario no registrado"
        }, status=status.HTTP_200_OK)

    # Obtener membresías del usuario
    memberships = Membership.objects.filter(user=user, is_active=True).select_related('negocio')
    
    businesses_data = []
    for membership in memberships:
        businesses_data.append({
            "id": membership.negocio.id,
            "name": membership.negocio.nombre
        })

    response_data = {
        "found": True,
        "user": {
            "id": user.id,
            "first_name": f"{user.first_name} {user.last_name}".strip(),
            "phone": user.phone_number
        },
        "business_count": len(businesses_data),
        "businesses": businesses_data
    }

    return Response([response_data], status=status.HTTP_200_OK)


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
    permission_classes = [permissions.IsAuthenticated, IsMemberOfSelectedNegocio]

    def post(self, request):
        # Solo clientes pueden crear turnos (por Membership.rol en el negocio actual)
        if not has_role(request.user, request.negocio, Roles.CLIENTE):
            return Response({
                'success': False,
                'message': 'Solo los clientes pueden crear turnos'
            }, status=status.HTTP_403_FORBIDDEN)

        # Verifica que el usuario tenga negocio asignado
        if not getattr(request, 'negocio', None):
            return Response({
                'success': False,
                'message': 'No se pudo determinar el negocio. Verifique que esté enviando el header X-Negocio-ID'
            }, status=status.HTTP_400_BAD_REQUEST)

        serializer = CrearTurnoSerializer(
            data=request.data,
            context={'request': request}
        )

        if serializer.is_valid():
            # Crea el turno asignando automáticamente el cliente y el negocio
            turno = serializer.save(cliente=request.user, negocio=request.negocio)

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
    permission_classes = [permissions.IsAuthenticated, IsMemberOfSelectedNegocio]
    
    def get(self, request):
        # Solo clientes pueden ver sus turnos
        if not is_cliente(request.user, request.negocio):
            return Response({
                'success': False,
                'message': 'Solo los clientes pueden ver sus turnos'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Verificar que el usuario tenga negocio asignado
        if not request.negocio:
            return Response({
                'success': False,
                'message': 'Usuario no tiene negocio asignado'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Obtener turnos del usuario del mismo negocio ordenados por fecha (más recientes primero)
        turnos = Turno.objects.filter(
            cliente=request.user,
            negocio=request.negocio
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
    permission_classes = [permissions.IsAuthenticated, IsMemberOfSelectedNegocio]
    
    def post(self, request, turno_id):
        # Verificar que el usuario tenga negocio asignado
        if not request.negocio:
            return Response({
                'success': False,
                'message': 'Usuario no tiene negocio asignado'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Verificar que el turno existe, pertenece al usuario y al mismo negocio
            turno = Turno.objects.get(
                id=turno_id,
                cliente=request.user,
                negocio=request.negocio
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
    
    negocio = getattr(request, 'negocio', None)
    if not negocio:
        return Response({
            'success': False,
            'message': 'No se pudo determinar el negocio'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        profesional = Profesional.objects.get(pk=profesional_id, negocio_id=negocio.id)
        servicio = Servicio.objects.get(id=servicio_id, negocio_id=negocio.id)
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
        negocio_id=negocio.id
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
        negocio_id=negocio.id
    )
    
    # Obtener bloqueos para esa fecha
    bloqueos = BloqueoHorario.objects.filter(
        profesional=profesional,
        start_datetime__date=fecha,
        negocio_id=negocio.id
    )
    
    # Generar horarios disponibles
    horarios_disponibles = []
    duracion_servicio = servicio.duration_minutes
    
    for horario in horarios_trabajo:
        # Generar slots de tiempo cada 30 minutos
        hora_actual = timezone.datetime.combine(fecha, horario.start_time)
        hora_fin = timezone.datetime.combine(fecha, horario.end_time)
        
        while hora_actual + timezone.timedelta(minutes=duracion_servicio) <= hora_fin:
            # Filtrar horarios pasados si la fecha es hoy
            ahora = timezone.now()
            # Asegúrate de que fecha es date, ahora es datetime
            if isinstance(fecha, str):
                from datetime import datetime as dt
                fecha = dt.strptime(fecha, "%Y-%m-%d").date()
            if fecha == ahora.date():
                # Si quieres filtrar a partir de 1 hora después de la actual:
                hora_limite = (ahora + timezone.timedelta(hours=1)).time()
                # Asegúrate de que hora_actual es datetime
                if hora_actual.time() < hora_limite:
                    hora_actual += timezone.timedelta(minutes=30)
                    continue

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
# =============================================================================
# SERIALIZERS DE DISPONIBILIDAD PROFESIONALES (SISTEMA COMPLETO)
# ============================================================================= 
@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def disponibilidad_profesional(request):
    try:
        profesional = Profesional.objects.get(user=request.user)
    except Profesional.DoesNotExist:
        return Response({'detail': 'No eres un profesional.'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        horarios = HorarioDisponibilidad.objects.filter(profesional=profesional)
        serializer = HorarioDisponibilidadSerializer(horarios, many=True)
        return Response(serializer.data)

    if request.method == 'PUT':
        # El frontend debe enviar una lista de objetos con day_of_week, start_time, end_time
        HorarioDisponibilidad.objects.filter(profesional=profesional).delete()
        data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
        for item in data:
            item['profesional'] = profesional.id
        serializer = HorarioDisponibilidadSerializer(data=data, many=True, context={'profesional': profesional})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ============================================================================= 
# ENDPOINTS PARA LA AGENDA DEL PROFESIONAL
# =============================================================================

class AgendaProfesionalView(APIView):
    """
    API para obtener los turnos de un profesional en una fecha específica.
    
    GET /api/v1/reservas/agenda-profesional/?fecha=YYYY-MM-DD
    
    Devuelve todos los turnos del profesional para la fecha especificada.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        # Solo profesionales pueden ver su agenda
        if not is_profesional(request.user, request.negocio):
            return Response({
                'success': False,
                'message': 'Solo los profesionales pueden ver su agenda'
            }, status=status.HTTP_403_FORBIDDEN)
        
        profesional = get_profesional_profile(request.user, request.negocio)
        if not profesional:
            return Response({
                'success': False,
                'message': 'Usuario profesional no encontrado'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Obtener fecha del parámetro
        fecha_str = request.GET.get('fecha')
        if not fecha_str:
            return Response({
                'success': False,
                'message': 'Parámetro fecha es requerido (formato: YYYY-MM-DD)'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            from datetime import datetime
            fecha = datetime.strptime(fecha_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({
                'success': False,
                'message': 'Formato de fecha inválido. Use YYYY-MM-DD'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Obtener turnos del profesional para la fecha específica
        turnos = Turno.objects.filter(
            profesional=profesional,
            start_datetime__date=fecha,
            negocio=profesional.negocio
        ).order_by('start_datetime')
        
        # Serializar los turnos
        serializer = AgendaProfesionalSerializer(turnos, many=True)
        
        return Response({
            'success': True,
            'fecha': fecha_str,
            'turnos': serializer.data,
            'total_turnos': len(serializer.data)
        })


class DiasConTurnosView(APIView):
    """
    API para obtener los días que tienen turnos en un mes específico.
    
    GET /api/v1/reservas/dias-con-turnos/?año=2024&mes=7
    
    Devuelve una lista de números de días que tienen turnos programados.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        # Solo profesionales pueden ver su agenda
        if not is_profesional(request.user, request.negocio):
            return Response({
                'success': False,
                'message': 'Solo los profesionales pueden ver su agenda'
            }, status=status.HTTP_403_FORBIDDEN)
        
        profesional = get_profesional_profile(request.user, request.negocio)
        if not profesional:
            return Response({
                'success': False,
                'message': 'Usuario profesional no encontrado'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Obtener parámetros año y mes
        año_str = request.GET.get('año')
        mes_str = request.GET.get('mes')
        
        if not año_str or not mes_str:
            return Response({
                'success': False,
                'message': 'Parámetros año y mes son requeridos'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            año = int(año_str)
            mes = int(mes_str)
            if mes < 1 or mes > 12:
                raise ValueError("Mes debe estar entre 1 y 12")
        except ValueError:
            return Response({
                'success': False,
                'message': 'Año y mes deben ser números válidos'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Obtener turnos del profesional para el mes específico
        turnos = Turno.objects.filter(
            profesional=profesional,
            start_datetime__year=año,
            start_datetime__month=mes,
            negocio=profesional.negocio,
            status__in=['pendiente', 'confirmado']  # Solo turnos activos
        ).values_list('start_datetime__day', flat=True).distinct()
        
        # Convertir a lista de enteros
        dias_con_turnos = list(set(turnos))
        dias_con_turnos.sort()
        
        return Response({
            'success': True,
            'año': año,
            'mes': mes,
            'dias': dias_con_turnos,
            'total_dias': len(dias_con_turnos)
        })


class CompletarTurnoView(APIView):
    """
    API para marcar un turno como completado.
    
    POST /api/v1/reservas/completar/{turno_id}/
    
    Marca el turno especificado como completado.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, turno_id):
        # Solo profesionales pueden completar turnos
        if not is_profesional(request.user, request.negocio):
            return Response({
                'success': False,
                'message': 'Solo los profesionales pueden completar turnos'
            }, status=status.HTTP_403_FORBIDDEN)
        
        profesional = get_profesional_profile(request.user, request.negocio)
        if not profesional:
            return Response({
                'success': False,
                'message': 'Usuario profesional no encontrado'
            }, status=status.HTTP_404_NOT_FOUND)
        
        try:
            turno = Turno.objects.get(
                id=turno_id,
                profesional=profesional,
                negocio=request.negocio  # CAMBIO: Usar request.negocio
            )
        except Turno.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Turno no encontrado'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Verificar que el turno se pueda completar
        if turno.status == 'completado':
            return Response({
                'success': False,
                'message': 'El turno ya está marcado como completado'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if turno.status == 'cancelado':
            return Response({
                'success': False,
                'message': 'No se puede completar un turno cancelado'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Marcar como completado
        turno.status = 'completado'
        turno.save()
        
        return Response({
            'success': True,
            'message': 'Turno marcado como completado exitosamente',
            'turno_id': turno.id,
            'nuevo_status': turno.status
        })


class CancelarTurnoProfesionalView(APIView):
    """
    API para que un profesional cancele un turno de su agenda.
    
    POST /api/v1/reservas/cancelar-profesional/{turno_id}/
    
    Permite a los profesionales cancelar turnos de su agenda.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, turno_id):
        # Solo profesionales pueden cancelar turnos de su agenda
        if not is_profesional(request.user, request.negocio):
            return Response({
                'success': False,
                'message': 'Solo los profesionales pueden cancelar turnos de su agenda'
            }, status=status.HTTP_403_FORBIDDEN)
        
        profesional = get_profesional_profile(request.user, request.negocio)
        if not profesional:
            return Response({
                'success': False,
                'message': 'Usuario profesional no encontrado'
            }, status=status.HTTP_404_NOT_FOUND)
        
        try:
            turno = Turno.objects.get(
                id=turno_id,
                profesional=profesional,
                negocio=request.negocio  # CAMBIO: Usar request.negocio
            )
        except Turno.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Turno no encontrado'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Verificar que el turno se puede cancelar
        if turno.status == 'cancelado':
            return Response({
                'success': False,
                'message': 'El turno ya está cancelado'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if turno.status == 'completado':
            return Response({
                'success': False,
                'message': 'No se puede cancelar un turno completado'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verificar tiempo límite (2 horas de anticipación)
        tiempo_restante = turno.start_datetime - timezone.now()
        if tiempo_restante.total_seconds() < 7200:  # 2 horas = 7200 segundos
            return Response({
                'success': False,
                'message': 'No se puede cancelar un turno con menos de 2 horas de anticipación'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Cancelar el turno
        turno.status = 'cancelado'
        turno.save()
        
        return Response({
            'success': True,
            'message': 'Turno cancelado exitosamente',
            'turno_id': turno.id,
            'nuevo_status': turno.status
        })


class DiasConDisponibilidadView(APIView):
    """
    API optimizada para obtener días con disponibilidad en un mes específico.
    
    GET /api/v1/reservas/dias-con-disponibilidad/?year=2025&month=9&profesional_id=1&servicio_id=2
    
    Retorna solo los días del mes que tienen AL MENOS un horario disponible.
    Optimizado para indicadores de calendario (solo True/False, no cantidad de horarios).
    """
    permission_classes = [permissions.AllowAny]  # Público para que los clientes puedan ver
    
    def get(self, request):
        try:
            # Parámetros requeridos
            year = int(request.GET.get('year'))
            month = int(request.GET.get('month'))
            profesional_id = int(request.GET.get('profesional_id'))
            servicio_id = int(request.GET.get('servicio_id'))

            # Validar que el profesional y servicio existen
            try:
                profesional = Profesional.objects.get(id=profesional_id)
                servicio = Servicio.objects.get(id=servicio_id)
            except (Profesional.DoesNotExist, Servicio.DoesNotExist):
                return Response({
                    'success': False,
                    'error': 'Profesional o servicio no encontrado'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Obtener días del mes
            _, dias_en_mes = calendar.monthrange(year, month)
            
            dias_con_disponibilidad = []

            for dia in range(1, dias_en_mes + 1):
                fecha = date(year, month, dia)
                
                # Solo verificar SI HAY disponibilidad, no cuánta
                if self._tiene_disponibilidad(profesional, servicio, fecha):
                    dias_con_disponibilidad.append(dia)

            return Response({
                'success': True,
                'year': year,
                'month': month,
                'profesional_id': profesional_id,
                'servicio_id': servicio_id,
                'dias': dias_con_disponibilidad,
                'total_dias': len(dias_con_disponibilidad)
            })

        except (ValueError, TypeError):
            return Response({
                'success': False,
                'error': 'Parámetros inválidos. Se requiere year, month, profesional_id y servicio_id'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _tiene_disponibilidad(self, profesional, servicio, fecha):
        """
        Solo retorna True/False, no calcula todos los horarios.
        Usa "early exit" para parar en el primer slot disponible encontrado.
        """
        # Verificar si el profesional trabaja este día
        dia_semana = fecha.weekday()
        horario_trabajo = HorarioDisponibilidad.objects.filter(
            profesional=profesional,
            day_of_week=dia_semana
        ).first()
        
        if not horario_trabajo:
            return False

        # Si es día pasado, no hay disponibilidad
        if fecha < timezone.now().date():
            return False

        # Si es hoy, verificar que no sea muy tarde
        if fecha == timezone.now().date():
            hora_actual = timezone.now().time()
            if hora_actual >= horario_trabajo.end_time:
                return False

        # En lugar de calcular todos los slots, 
        # solo verificamos si hay al menos uno disponible
        
        hora_inicio = datetime.combine(fecha, horario_trabajo.start_time)
        hora_fin = datetime.combine(fecha, horario_trabajo.end_time)
        duracion_servicio = servicio.duration_minutes

        # Generar solo algunos slots para verificar disponibilidad (más eficiente)
        slot_actual = hora_inicio
        slots_verificados = 0
        max_slots_a_verificar = 5  # Solo verificar primeros 5 slots
        
        while slot_actual + timedelta(minutes=duracion_servicio) <= hora_fin and slots_verificados < max_slots_a_verificar:
            slot_fin = slot_actual + timedelta(minutes=duracion_servicio)
            
            # Si es hoy, verificar que no sea hora pasada
            if fecha == timezone.now().date() and slot_actual.time() <= timezone.now().time():
                slot_actual += timedelta(minutes=30)
                slots_verificados += 1
                continue

            # Verificar si este slot está ocupado
            turnos_conflictivos = Turno.objects.filter(
                profesional=profesional,
                start_datetime__date=fecha,
                start_datetime__time__lt=slot_fin.time(),
                end_datetime__time__gt=slot_actual.time(),
                status__in=['confirmado', 'pendiente']
            )

            # Si encontramos UN slot libre, ya sabemos que hay disponibilidad
            if not turnos_conflictivos.exists():
                return True  # ¡Encontramos disponibilidad!

            slot_actual += timedelta(minutes=30)
            slots_verificados += 1

        return False  # No hay disponibilidad


class CambiarContrasenaView(APIView):
    """
    API para cambiar contraseña del usuario autenticado.
    
    POST /api/v1/auth/cambiar-contrasena/
    
    Requiere:
    - current_password: Contraseña actual
    - new_password: Nueva contraseña  
    - new_password_confirm: Confirmación de nueva contraseña
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = CambiarContrasenaSerializer(
            data=request.data, 
            context={'request': request}
        )
        
        if serializer.is_valid():
            # Cambiar la contraseña
            user = request.user
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            
            # Opcional: Invalidar todos los tokens JWT existentes
            # para forzar re-login en todos los dispositivos
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'success': True,
                'message': 'Contraseña cambiada exitosamente',
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            }, status=status.HTTP_200_OK)
        
        return Response({
            'success': False,
            'message': 'Error al cambiar contraseña',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)