from django.shortcuts import render
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.utils import timezone
from django.conf import settings
from datetime import datetime, timedelta, date
from rest_framework import serializers
from core.permissions import IsMemberOfSelectedNegocio, IsBotOrAdmin, IsBotOrAuthenticatedMember
from core.roles import is_profesional, is_cliente
from core.services.memberships import get_profesional_profile
import calendar
from core.roles import Roles, has_role

from .models import Usuario, Servicio, Profesional, Turno, HorarioDisponibilidad, BloqueoHorario, Negocio, Membership
from .serializers import (
    UsuarioSerializer, UsuarioLoginSerializer, RegistroSerializer, LoginSerializer,
    ServicioSerializer, ProfesionalSerializer, TurnoBasicoSerializer,
    CrearTurnoSerializer, DisponibilidadConsultaSerializer, MisTurnosSerializer, HorarioDisponibilidadSerializer,
    AgendaProfesionalSerializer, CambiarContrasenaSerializer, NegocioSerializer, BotRegistroSerializer
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


class BotRegistroView(APIView):
    """
    API para registro de usuarios desde el bot de WhatsApp.
    
    POST /api/v1/bot/register/
    Header: X-BOT-TOKEN: <token_secreto>
    Body: {
        "phone": "+58424123456",
        "email": "usuario@example.com",
        "name": "Jesus Odreman",
        "negocio_id": 1
    }
    
    - No requiere JWT de usuario (el usuario aún no existe)
    - Requiere header X-BOT-TOKEN con valor correcto
    - Genera username y password automáticamente
    - Envía credenciales por email
    - Crea el usuario como cliente en el negocio especificado
    """
    permission_classes = [IsBotOrAdmin]
    
    def post(self, request):
        serializer = BotRegistroSerializer(data=request.data)
        
        if serializer.is_valid():
            try:
                # Crear el usuario (el serializer maneja la transacción y el email)
                resultado = serializer.save()
                
                return Response({
                    'success': True,
                    'message': 'Usuario registrado exitosamente. Se han enviado las credenciales por email.',
                    'data': {
                        'user_id': resultado['user_id'],
                        'username': resultado['username'],
                        'first_name': resultado['first_name'],
                        'email': resultado['email']
                    }
                }, status=status.HTTP_201_CREATED)
                
            except Exception as e:
                return Response({
                    'success': False,
                    'message': 'Error al procesar el registro',
                    'error': str(e)
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Si hay errores de validación, retornar 409 Conflict
        # (para email o teléfono duplicados)
        error_messages = []
        if 'email' in serializer.errors:
            error_messages.append(serializer.errors['email'][0])
        if 'phone' in serializer.errors:
            error_messages.append(serializer.errors['phone'][0])
        
        if error_messages:
            return Response({
                'success': False,
                'message': ' | '.join(error_messages),
                'errors': serializer.errors
            }, status=status.HTTP_409_CONFLICT)
        
        return Response({
            'success': False,
            'message': 'Error en la validación de datos',
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

        if not user.is_active:
            return Response({
                'success': False,
                'message': 'La cuenta está desactivada'
            }, status=status.HTTP_403_FORBIDDEN) #Pendiente de integrar respuesta de "Usuario inactivo" en el FE
        
        membership = Membership.objects.filter(
            user=user,
            is_active=True
        ).select_related('negocio').first()

        if not membership:
            return Response({
                'success': False,
                'message': 'No tienes acceso a ningún negocio',
            }, status=status.HTTP_403_FORBIDDEN)
        
        request.negocio = membership.negocio

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
        negocio = Negocio.objects.get(id=negocio_id)
    except Negocio.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Negocio no encontrado'
        }, status=status.HTTP_404_NOT_FOUND)

    try:
        membership = Membership.objects.select_related('negocio').get(
            user=request.user,
            negocio=negocio,
            is_active=True
        )
    except Membership.DoesNotExist:
        return Response({
            'success': False,
            'message': 'No tienes acceso a este negocio'
        }, status=status.HTTP_403_FORBIDDEN)

    request.negocio = negocio
    user_data = UsuarioSerializer(request.user, context={'request': request}).data
    negocio_data = NegocioSerializer(negocio, context={'request': request}).data
    user_data['rol_en_negocio'] = membership.rol
    # Respuesta completa con toda la info del negocio
    return Response({
        'success': True,
        'message': 'Negocio seleccionado correctamente',
        'user': user_data,
        'negocio': negocio_data,
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def unirse_negocio(request):
    """
    API para que un usuario existente se una a un nuevo negocio.
    
    POST /api/v1/auth/unirse-negocio/
    Body: { "negocio_id": 1 }
    
    Crea una membership como 'cliente' para el usuario autenticado
    en el negocio especificado.
    """
    from core.services.memberships import add_user_to_negocio
    
    negocio_id = request.data.get('negocio_id')
    
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
    
    # Verificar si ya tiene membership en este negocio
    existing_membership = Membership.objects.filter(
        user=request.user,
        negocio=negocio
    ).first()
    
    if existing_membership:
        if existing_membership.is_active:
            return Response({
                'success': False,
                'message': 'Ya eres miembro de este negocio'
            }, status=status.HTTP_409_CONFLICT)
        else:
            # Reactivar membership existente
            existing_membership.is_active = True
            existing_membership.save(update_fields=['is_active', 'updated_at'])
            membership = existing_membership
    else:
        # Crear nueva membership como cliente
        membership = add_user_to_negocio(
            user=request.user,
            negocio=negocio,
            rol=Membership.Roles.CLIENTE
        )
    
    return Response({
        'success': True,
        'message': f'Te has unido exitosamente a {negocio.nombre}',
        'membership': {
            'id': membership.id,
            'negocio_id': negocio.id,
            'negocio_nombre': negocio.nombre,
            'rol': membership.rol,
            'is_active': membership.is_active
        }
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def negocios_disponibles(request):
    """
    API para listar negocios donde el usuario NO tiene membership activa.
    
    GET /api/v1/auth/negocios-disponibles/
    
    Devuelve una lista de negocios a los que el usuario puede unirse.
    """
    # IDs de negocios donde el usuario YA tiene membership
    mis_negocios_ids = Membership.objects.filter(
        user=request.user,
        is_active=True
    ).values_list('negocio_id', flat=True)
    
    # Negocios donde NO tiene membership
    negocios = Negocio.objects.exclude(id__in=mis_negocios_ids).order_by('nombre')
    serializer = NegocioSerializer(negocios, many=True, context={'request': request})
    
    return Response({
        'success': True,
        'count': negocios.count(),
        'negocios': serializer.data
    })


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
def listar_negocios(request):
    """
    API pública para listar todos los negocios disponibles en Ordema.
    
    GET /api/v1/negocios/
    
    Devuelve una lista de todos los negocios para que el usuario pueda 
    seleccionar uno durante el registro.
    """
    negocios = Negocio.objects.all().order_by('nombre')
    serializer = NegocioSerializer(negocios, many=True, context={'request': request})
    
    return Response({
        'success': True,
        'count': negocios.count(),
        'negocios': serializer.data
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
            "name": membership.negocio.nombre,
            "role": membership.rol.capitalize()
        })

    response_data = {
        "found": True,
        "user": {
            "id": user.id,
            "username": user.username,
            "first_name": f"{user.first_name}".strip(),
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

    Soporta dos flujos:
    1. App móvil: Usuario autenticado crea su propio turno (JWT)
    2. Bot WhatsApp: Bot crea turno para un usuario específico (X-BOT-TOKEN + cliente_phone)
    
    Valida disponibilidad completa antes de crear el turno.
    """
    permission_classes = [IsBotOrAuthenticatedMember]

    def post(self, request):
        # Detectar si la request viene del bot verificando el header X-BOT-TOKEN
        bot_token = request.headers.get('X-BOT-TOKEN')
        expected_bot_token = getattr(settings, 'BOT_TOKEN', None)
        is_bot_request = bot_token and expected_bot_token and bot_token == expected_bot_token
        
        # Determinar el cliente real según el origen de la request
        if is_bot_request:
            # Flujo del bot: buscar usuario por teléfono
            cliente_phone = request.data.get('cliente_phone')
            
            if not cliente_phone:
                return Response({
                    'success': False,
                    'message': 'El bot debe especificar cliente_phone (sin prefijo +)'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                # Buscar usuario por teléfono (sin +, como se maneja en el backend)
                cliente = Usuario.objects.get(phone_number=cliente_phone)
            except Usuario.DoesNotExist:
                return Response({
                    'success': False,
                    'message': f'Usuario con teléfono {cliente_phone} no encontrado'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Verificar que el cliente pertenece al negocio
            if not has_role(cliente, request.negocio, Roles.CLIENTE):
                return Response({
                    'success': False,
                    'message': f'El usuario no es cliente del negocio {request.negocio.nombre}'
                }, status=status.HTTP_403_FORBIDDEN)
        else:
            # Flujo normal de la app: el usuario autenticado es el cliente
            cliente = request.user
            
            # Solo clientes pueden crear turnos (por Membership.rol en el negocio actual)
            if not has_role(cliente, request.negocio, Roles.CLIENTE):
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
            # Crea el turno asignando el cliente correcto (usuario real o especificado por el bot)
            turno = serializer.save(cliente=cliente, negocio=request.negocio)

            # Enviar email de confirmación con archivo .ics (no bloquea si falla)
            from core.utils.email_utils import enviar_email_confirmacion_turno
            try:
                enviar_email_confirmacion_turno(turno)
            except Exception as e:
                # Loguear error pero no afectar la respuesta al cliente
                print(f"Error al enviar email de confirmación de turno: {str(e)}")

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
            day_of_week=dia_semana,
            negocio=profesional.negocio
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

        # Generar solo algunos slots para verificar disponibilidad
        slot_actual = hora_inicio

        # Sin límite de slots disponibles, verifica todo
        while slot_actual + timedelta(minutes=duracion_servicio) <= hora_fin:
            slot_fin = slot_actual + timedelta(minutes=duracion_servicio)
            
            # Si es hoy, verificar que no sea hora pasada
            if fecha == timezone.now().date() and slot_actual.time() <= timezone.now().time():
                slot_actual += timedelta(minutes=30)
                continue

            # Verificar si este slot está ocupado
            turnos_conflictivos = Turno.objects.filter(
                profesional=profesional,
                start_datetime__date=fecha,
                start_datetime__time__lt=slot_fin.time(),
                end_datetime__time__gt=slot_actual.time(),
                status__in=['confirmado', 'pendiente'],
                negocio=profesional.negocio  # Filtrar por negocio
            )

            # Si encontramos UN slot libre, ya sabemos que hay disponibilidad
            if not turnos_conflictivos.exists():
                return True  # Encontró disponibilidad

            slot_actual += timedelta(minutes=30)

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


# =============================================================================
# API PARA WHATSAPP FLOW - PRÓXIMOS DÍAS DISPONIBLES
# =============================================================================

class ProximosDiasDisponiblesView(APIView):
    """
    API optimizada para WhatsApp Flow (n8n).
    Retorna los próximos N días con disponibilidad para un profesional y servicio.
    
    GET /api/v1/reservas/disponibilidad/proximos-dias/
    
    Query Parameters:
    - profesional_id (int, requerido): ID del profesional
    - servicio_id (int, requerido): ID del servicio
    - fecha_desde (str, opcional): Fecha de inicio en formato YYYY-MM-DD (default: hoy)
    - limite (int, opcional): Cantidad de días a retornar (default: 9, máx: 20)
    
    Response:
    {
        "success": true,
        "cantidad": 9,
        "fechas": [
            {
                "fecha": "2025-12-30",
                "nombre_dia": "Tuesday",
                "tiene_disponibilidad": true
            },
            ...
        ]
    }
    """
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        # Validar parámetros requeridos
        profesional_id = request.GET.get('profesional_id')
        servicio_id = request.GET.get('servicio_id')
        
        if not profesional_id or not servicio_id:
            return Response({
                'success': False,
                'error': 'Se requieren los parámetros profesional_id y servicio_id'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            profesional_id = int(profesional_id)
            servicio_id = int(servicio_id)
        except (ValueError, TypeError):
            return Response({
                'success': False,
                'error': 'profesional_id y servicio_id deben ser números enteros'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validar fecha de inicio (opcional, default: hoy)
        fecha_desde_str = request.GET.get('fecha_desde')
        if fecha_desde_str:
            try:
                fecha_desde = datetime.strptime(fecha_desde_str, '%Y-%m-%d').date()
            except ValueError:
                return Response({
                    'success': False,
                    'error': 'Formato de fecha inválido. Use YYYY-MM-DD'
                }, status=status.HTTP_400_BAD_REQUEST)
        else:
            fecha_desde = timezone.now().date()
        
        # Validar límite (opcional, default: 9, máx: 20)
        limite = request.GET.get('limite', 9)
        try:
            limite = int(limite)
            if limite < 1 or limite > 20:
                limite = 9
        except (ValueError, TypeError):
            limite = 9
        
        # Validar que el profesional y servicio existan
        try:
            profesional = Profesional.objects.get(id=profesional_id)
            servicio = Servicio.objects.get(id=servicio_id)
        except Profesional.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Profesional no encontrado'
            }, status=status.HTTP_404_NOT_FOUND)
        except Servicio.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Servicio no encontrado'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Obtener horarios de trabajo del profesional (pre-fetch para optimización)
        horarios_trabajo = HorarioDisponibilidad.objects.filter(
            profesional=profesional,
            negocio=profesional.negocio
        ).values('day_of_week', 'start_time', 'end_time')
        
        # Crear diccionario de horarios por día de la semana
        horarios_dict = {}
        for horario in horarios_trabajo:
            dia = horario['day_of_week']
            if dia not in horarios_dict:
                horarios_dict[dia] = []
            horarios_dict[dia].append({
                'start_time': horario['start_time'],
                'end_time': horario['end_time']
            })
        
        # Buscar días disponibles
        fechas_disponibles = []
        fecha_actual = fecha_desde
        max_dias_a_revisar = 60  # Límite de seguridad
        dias_revisados = 0
        
        while len(fechas_disponibles) < limite and dias_revisados < max_dias_a_revisar:
            # Verificar si hay disponibilidad en este día
            if self._verificar_disponibilidad_dia(
                profesional, 
                servicio, 
                fecha_actual, 
                horarios_dict
            ):
                fechas_disponibles.append({
                    'fecha': fecha_actual.strftime('%Y-%m-%d'),
                    'nombre_dia': fecha_actual.strftime('%A'),
                    'tiene_disponibilidad': True
                })
            
            # Avanzar al siguiente día
            fecha_actual += timedelta(days=1)
            dias_revisados += 1
        
        return Response({
            'success': True,
            'cantidad': len(fechas_disponibles),
            'profesional_id': profesional_id,
            'servicio_id': servicio_id,
            'fecha_desde': fecha_desde.strftime('%Y-%m-%d'),
            'fechas': fechas_disponibles
        }, status=status.HTTP_200_OK)
    
    def _verificar_disponibilidad_dia(self, profesional, servicio, fecha, horarios_dict):
        """
        Verifica si un día específico tiene al menos un slot disponible.
        Optimizado para no calcular todos los slots, solo verificar si existe al menos uno.
        
        Args:
            profesional: Instancia de Profesional
            servicio: Instancia de Servicio
            fecha: date object
            horarios_dict: Dict con horarios pre-cargados {day_of_week: [horarios]}
        
        Returns:
            bool: True si hay al menos un slot disponible
        """
        # Verificar si es día pasado
        if fecha < timezone.now().date():
            return False
        
        # Verificar si el profesional trabaja este día
        dia_semana = fecha.weekday()
        horarios_del_dia = horarios_dict.get(dia_semana)
        
        if not horarios_del_dia:
            return False
        
        # Si es hoy, verificar que no sea muy tarde
        ahora = timezone.now()
        if fecha == ahora.date():
            hora_actual = ahora.time()
            # Verificar si algún horario tiene slots después de la hora actual + 1 hora
            hora_limite = (ahora + timedelta(hours=1)).time()
            tiene_horario_valido = any(
                horario['end_time'] > hora_limite 
                for horario in horarios_del_dia
            )
            if not tiene_horario_valido:
                return False
        
        # Obtener turnos existentes para esta fecha (optimizado: una sola query)
        turnos_existentes = Turno.objects.filter(
            profesional=profesional,
            start_datetime__date=fecha,
            status__in=['confirmado', 'pendiente'],
            negocio=profesional.negocio
        ).values('start_datetime', 'end_datetime')
        
        # Convertir a lista para iterar múltiples veces
        lista_turnos = list(turnos_existentes)
        
        duracion_servicio = servicio.duration_minutes
        
        # Verificar cada bloque de horario del día
        for horario in horarios_del_dia:
            hora_inicio = datetime.combine(fecha, horario['start_time'])
            hora_fin = datetime.combine(fecha, horario['end_time'])
            
            # Generar slots cada 30 minutos
            slot_actual = hora_inicio
            
            while slot_actual + timedelta(minutes=duracion_servicio) <= hora_fin:
                slot_fin = slot_actual + timedelta(minutes=duracion_servicio)
                
                # Si es hoy, verificar que no sea hora pasada
                if fecha == ahora.date():
                    hora_limite = (ahora + timedelta(hours=1)).time()
                    if slot_actual.time() < hora_limite:
                        slot_actual += timedelta(minutes=30)
                        continue
                
                # Verificar si este slot está ocupado
                hay_conflicto = False
                for turno in lista_turnos:
                    turno_inicio = turno['start_datetime']
                    turno_fin = turno['end_datetime']
                    
                    # Hacer timezone-aware si es necesario
                    if timezone.is_aware(turno_inicio):
                        slot_actual_aware = timezone.make_aware(slot_actual)
                        slot_fin_aware = timezone.make_aware(slot_fin)
                    else:
                        slot_actual_aware = slot_actual
                        slot_fin_aware = slot_fin
                    
                    # Verificar solapamiento
                    if slot_actual_aware < turno_fin and slot_fin_aware > turno_inicio:
                        hay_conflicto = True
                        break
                
                # Si encontramos UN slot libre, el día tiene disponibilidad
                if not hay_conflicto:
                    return True
                
                slot_actual += timedelta(minutes=30)
        
        return False