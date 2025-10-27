from rest_framework import serializers
from django.contrib.auth import authenticate
from django.utils import timezone
from datetime import timedelta
from .models import Usuario, Servicio, Profesional, HorarioDisponibilidad, BloqueoHorario, Turno, Negocio, Membership


# =============================================================================
# SERIALIZERS DE AUTENTICACIÓN
# =============================================================================

class NegocioSerializer(serializers.ModelSerializer):
    logo_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Negocio
        fields = ['id', 'nombre', 'logo_url', 'logo_width', 'logo_height', 'theme_colors']
    
    def get_logo_url(self, obj):
        if obj.logo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.logo.url)
            return obj.logo.url
        return None

class UsuarioSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = Usuario
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 
            'phone_number', 'is_active', 'date_joined', 'password',
            'profile_picture_url'
        ]
        extra_kwargs = {
            'password': {'write_only': True},
        }

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = Usuario.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        return user

# Nuevo serializer para login adaptado a Membership (Usuario registrado en múltiples negocios). 12/10/2025 Odreman.
class UsuarioLoginSerializer(UsuarioSerializer):
    negocios = serializers.SerializerMethodField()

    class Meta(UsuarioSerializer.Meta):
        fields = UsuarioSerializer.Meta.fields + ['negocios']

    def get_negocios(self, obj):
        memberships = Membership.objects.filter(user=obj).select_related('negocio')
        return [
            {
                'id': m.negocio.id,
                'nombre': m.negocio.nombre,
                'logo_url': self._get_logo_url(m.negocio),
                'rol': m.rol
            } for m in memberships
        ]

    def _get_logo_url(self, negocio):
        request = self.context.get('request')
        if negocio.logo:
            return request.build_absolute_uri(negocio.logo.url) if request else negocio.logo.url
        return None



class RegistroSerializer(serializers.ModelSerializer):
    """
    Serializer para registro de nuevos clientes.
    Solo permite crear clientes (no administradores ni profesionales).
    """
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = Usuario
        fields = [
            'username', 'email', 'first_name', 'last_name', 
            'phone_number', 'password', 'password_confirm'
        ]
    
    def validate(self, data):
        """Validar que las contraseñas coincidan"""
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError("Las contraseñas no coinciden")
        return data
    
    def validate_username(self, value):
        """Normalizar username a minúsculas"""
        return value.lower()
    
    def create(self, validated_data):
        """Crear un nuevo cliente"""
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = Usuario.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()

        request = self.context.get('request')
        if request and hasattr(request, 'negocio') and request.negocio:
            from core.models import Membership
            Membership.objects.create(
                user=user,
                negocio=request.negocio,
                rol=Membership.Roles.CLIENTE,
                is_active=True
            )
            
        return user

class LoginSerializer(serializers.Serializer):
    """
    Serializer para login de usuarios.
    Valida que los campos requeridos estén presentes.
    """
    username = serializers.CharField()
    password = serializers.CharField()
    
    def validate(self, data):
        """Validar que los campos requeridos estén presentes"""
        username = data.get('username')
        password = data.get('password')
        
        if not username:
            raise serializers.ValidationError({'username': 'Username es requerido'})
        if not password:
            raise serializers.ValidationError({'password': 'Password es requerido'})
        
        return data

    def validate_username(self, value):
        # Normalizar a minúsculas en la validación
        return value.lower()


# =============================================================================
# SERIALIZERS DE SERVICIOS
# =============================================================================

class ServicioSerializer(serializers.ModelSerializer):
    """
    Serializer para servicios de la barbería.
    Permite ver todos los campos del servicio.
    """
    
    class Meta:
        model = Servicio
        fields = ['id', 'name', 'description', 'duration_minutes', 'price', 'is_active', 'negocio', 'icon_name']
        read_only_fields = ['negocio']  # Solo superuser puede modificarlo

    def create(self, validated_data):
        request = self.context.get('request')
        if request and not request.user.is_superuser:
            validated_data['negocio'] = request.negocio
        return super().create(validated_data)


# =============================================================================
# SERIALIZERS DE PROFESIONALES
# =============================================================================

class ProfesionalSerializer(serializers.ModelSerializer):
    """
    Serializer para profesionales.
    Incluye los datos del usuario relacionado.
    """
    user_details = UsuarioSerializer(source='user', read_only=True)
    
    class Meta:
        model = Profesional
        fields = ['id', 'user', 'user_details', 'bio', 'profile_picture_url', 'is_available']
        read_only_fields = ['user_details']


# =============================================================================
# SERIALIZERS BÁSICOS PARA TURNOS
# =============================================================================

class TurnoBasicoSerializer(serializers.ModelSerializer):
    """
    Serializer básico para turnos.
    Incluye información legible de cliente, profesional y servicio.
    """
    cliente_name = serializers.CharField(source='cliente.get_full_name', read_only=True)
    profesional_name = serializers.CharField(source='profesional.user.get_full_name', read_only=True)
    servicio_name = serializers.CharField(source='servicio.name', read_only=True)
    servicio_price = serializers.DecimalField(source='servicio.price', max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = Turno
        fields = [
            'id', 'cliente', 'cliente_name', 'profesional', 'profesional_name',
            'servicio', 'servicio_name', 'servicio_price', 'start_datetime', 
            'end_datetime', 'status', 'notes', 'created_at'
        ]
        read_only_fields = ['end_datetime', 'created_at', 'cliente_name', 
                           'profesional_name', 'servicio_name', 'servicio_price']


# =============================================================================
# SERIALIZERS DE RESERVAS (SISTEMA COMPLETO)
# =============================================================================

class CrearTurnoSerializer(serializers.ModelSerializer):
    """
    Serializer para crear nuevos turnos.
    Valida disponibilidad y calcula automáticamente end_datetime.
    """
    
    class Meta:
        model = Turno
        fields = ['profesional', 'servicio', 'start_datetime', 'notes']
    
    def create(self, validated_data):
        validated_data['status'] = 'confirmado'  # O 'pendiente', según lo que desees
        return super().create(validated_data)

    def validate(self, data):
        """
        Validaciones personalizadas para crear turnos:
        1. Verificar que el profesional esté disponible
        2. Verificar que no haya turnos superpuestos
        3. Verificar horarios de trabajo del profesional
        4. Verificar que profesional y servicio pertenezcan al mismo negocio del usuario
        """
        profesional = data.get('profesional')
        servicio = data.get('servicio')
        start_datetime = data.get('start_datetime')
        
        # Obtener el usuario y negocio del contexto de la request
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            user_negocio = getattr(request, 'negocio', None)

            if not user_negocio:
                raise serializers.ValidationError('No se pudo determinar el negocio del usuario.')
            
            # Verificar que el profesional pertenezca al negocio del usuario
            if profesional.negocio != user_negocio:
                raise serializers.ValidationError({
                    'profesional': 'El profesional seleccionado no pertenece a tu negocio'
                })
            
            # Verificar que el servicio pertenezca al negocio del usuario
            if servicio.negocio != user_negocio:
                raise serializers.ValidationError({
                    'servicio': 'El servicio seleccionado no pertenece a tu negocio'
                })
        
        # 1. Verificar que el profesional esté disponible
        if not profesional.is_available:
            raise serializers.ValidationError({
                'profesional': 'El profesional seleccionado no está disponible'
            })
        
        # 2. Verificar que el servicio esté activo
        if not servicio.is_active:
            raise serializers.ValidationError({
                'servicio': 'El servicio seleccionado no está disponible'
            })
        
        # 3. Calcular end_datetime basado en la duración del servicio
        end_datetime = start_datetime + timedelta(minutes=servicio.duration_minutes)
        data['end_datetime'] = end_datetime
        
        # 4. Verificar que no haya turnos superpuestos (solo del mismo negocio)
        turnos_existentes = Turno.objects.filter(
            profesional=profesional,
            start_datetime__date=start_datetime.date(),
            status__in=['pendiente', 'confirmado'],
            negocio=profesional.negocio
        ).exclude(
            # Excluir turnos que no se superponen
            end_datetime__lte=start_datetime
        ).exclude(
            start_datetime__gte=end_datetime
        )
        
        if turnos_existentes.exists():
            turno_conflicto = turnos_existentes.first()
            raise serializers.ValidationError({
                'start_datetime': f'Horario no disponible. Hay un turno de {turno_conflicto.start_datetime.strftime("%H:%M")} a {turno_conflicto.end_datetime.strftime("%H:%M")}'
            })
        
        # 5. Verificar horarios de disponibilidad del profesional
        dia_semana = start_datetime.weekday()  # 0=Lunes, 6=Domingo
        horarios_disponibles = HorarioDisponibilidad.objects.filter(
            profesional=profesional,
            day_of_week=dia_semana,
            negocio=profesional.negocio
        )
        
        if not horarios_disponibles.exists():
            raise serializers.ValidationError({
                'start_datetime': 'El profesional no trabaja este día de la semana'
            })
        
        # Verificar que el turno esté dentro del horario de trabajo
        hora_inicio = start_datetime.time()
        hora_fin = end_datetime.time()
        
        horario_valido = False
        for horario in horarios_disponibles:
            if (hora_inicio >= horario.start_time and 
                hora_fin <= horario.end_time):
                horario_valido = True
                break
        
        if not horario_valido:
            horarios_texto = ', '.join([
                f"{h.start_time.strftime('%H:%M')}-{h.end_time.strftime('%H:%M')}"
                for h in horarios_disponibles
            ])
            raise serializers.ValidationError({
                'start_datetime': f'Horario fuera del rango de trabajo. Horarios disponibles: {horarios_texto}'
            })
        
        # 6. Verificar bloqueos de horario (solo del mismo negocio)
        bloqueos = BloqueoHorario.objects.filter(
            profesional=profesional,
            start_datetime__date=start_datetime.date(),
            negocio=profesional.negocio
        ).exclude(
            end_datetime__lte=start_datetime
        ).exclude(
            start_datetime__gte=end_datetime
        )
        
        if bloqueos.exists():
            bloqueo = bloqueos.first()
            raise serializers.ValidationError({
                'start_datetime': f'Horario bloqueado: {bloqueo.reason}'
            })
        
        return data


class DisponibilidadConsultaSerializer(serializers.Serializer):
    """
    Serializer para consultar disponibilidad de horarios.
    Usado en el endpoint de disponibilidad.
    Las validaciones específicas de negocio se realizan en la vista.
    """
    profesional_id = serializers.IntegerField()
    fecha = serializers.DateField()
    servicio_id = serializers.IntegerField()
    
    def validate_profesional_id(self, value):
        """Validar que el profesional exista y esté disponible"""
        if value <= 0:
            raise serializers.ValidationError('ID de profesional inválido')
        return value
    
    def validate_servicio_id(self, value):
        """Validar que el servicio exista y esté activo"""
        if value <= 0:
            raise serializers.ValidationError('ID de servicio inválido')
        return value
    
    def validate_fecha(self, value):
        """Validar que la fecha no sea en el pasado"""
        from datetime import date
        if value < date.today():
            raise serializers.ValidationError('No se pueden hacer reservas para fechas pasadas')
        return value


class MisTurnosSerializer(serializers.ModelSerializer):
    """
    Serializer optimizado para mostrar los turnos del usuario.
    Incluye toda la información necesaria para la app móvil.
    """
    profesional_name = serializers.CharField(source='profesional.user.get_full_name', read_only=True)
    profesional_bio = serializers.CharField(source='profesional.bio', read_only=True)
    profesional_photo = serializers.CharField(source='profesional.user.profile_picture_url', read_only=True)
    
    servicio_name = serializers.CharField(source='servicio.name', read_only=True)
    servicio_description = serializers.CharField(source='servicio.description', read_only=True)
    servicio_price = serializers.DecimalField(source='servicio.price', max_digits=10, decimal_places=2, read_only=True)
    servicio_duration = serializers.IntegerField(source='servicio.duration_minutes', read_only=True)
    
    # Campos calculados
    fecha = serializers.SerializerMethodField()
    hora_inicio = serializers.SerializerMethodField()
    hora_fin = serializers.SerializerMethodField()
    puede_cancelar = serializers.SerializerMethodField()
    
    class Meta:
        model = Turno
        fields = [
            'id', 'start_datetime', 'end_datetime', 'status', 'notes', 'created_at',
            'profesional_name', 'profesional_bio', 'profesional_photo',
            'servicio_name', 'servicio_description', 'servicio_price', 'servicio_duration',
            'fecha', 'hora_inicio', 'hora_fin', 'puede_cancelar'
        ]
    
    def get_fecha(self, obj):
        """Devolver fecha en formato legible"""
        if obj.start_datetime:
            return obj.start_datetime.strftime('%d/%m/%Y')
        return None
    
    def get_hora_inicio(self, obj):
        """Devolver hora de inicio en formato legible"""
        if obj.start_datetime:
            return obj.start_datetime.strftime('%H:%M')
        return None
    
    def get_hora_fin(self, obj):
        """Devolver hora de fin en formato legible"""
        if obj.end_datetime:
            return obj.end_datetime.strftime('%H:%M')
        return None
    
    def get_puede_cancelar(self, obj):
        """Determinar si el turno se puede cancelar"""
        # Solo se puede cancelar si:
        # 1. El turno está pendiente o confirmado
        # 2. Faltan más de 2 horas para el turno
        if obj.status not in ['pendiente', 'confirmado']:
            return False
        
        tiempo_restante = obj.start_datetime - timezone.now()
        return tiempo_restante > timedelta(hours=2) 


# =============================================================================
# SERIALIZERS DE PROFESIONALES (SISTEMA COMPLETO)
# =============================================================================        
class HorarioDisponibilidadSerializer(serializers.ModelSerializer):
    class Meta:
        model = HorarioDisponibilidad
        fields = ['id', 'day_of_week', 'start_time', 'end_time', 'is_recurring', 'profesional']
        read_only_fields = ['profesional']

    def create(self, validated_data):
        profesional = self.context.get('profesional')
        negocio = profesional.negocio  # Asume que el profesional tiene un campo negocio
        return HorarioDisponibilidad.objects.create(
            profesional=profesional,
            negocio=negocio,
            **validated_data
        ) 

class AgendaProfesionalSerializer(serializers.ModelSerializer):
    """
    Serializer para mostrar los turnos de un profesional en su agenda.
    Incluye información del cliente en lugar del profesional.
    """
    cliente_name = serializers.CharField(source='cliente.get_full_name', read_only=True)
    cliente_phone = serializers.CharField(source='cliente.phone_number', read_only=True)
    
    servicio_name = serializers.CharField(source='servicio.name', read_only=True)
    servicio_description = serializers.CharField(source='servicio.description', read_only=True)
    servicio_price = serializers.DecimalField(source='servicio.price', max_digits=10, decimal_places=2, read_only=True)
    servicio_duration = serializers.IntegerField(source='servicio.duration_minutes', read_only=True)
    
    # Campos calculados
    fecha = serializers.SerializerMethodField()
    hora_inicio = serializers.SerializerMethodField()
    hora_fin = serializers.SerializerMethodField()
    puede_cancelar = serializers.SerializerMethodField()
    
    class Meta:
        model = Turno
        fields = [
            'id', 'start_datetime', 'end_datetime', 'status', 'notes', 'created_at',
            'cliente_name', 'cliente_phone',
            'servicio_name', 'servicio_description', 'servicio_price', 'servicio_duration',
            'fecha', 'hora_inicio', 'hora_fin', 'puede_cancelar'
        ]
    
    def get_fecha(self, obj):
        """Devolver fecha en formato legible"""
        if obj.start_datetime:
            return obj.start_datetime.strftime('%d/%m/%Y')
        return None
    
    def get_hora_inicio(self, obj):
        """Devolver hora de inicio en formato legible"""
        if obj.start_datetime:
            return obj.start_datetime.strftime('%H:%M')
        return None
    
    def get_hora_fin(self, obj):
        """Devolver hora de fin en formato legible"""
        if obj.end_datetime:
            return obj.end_datetime.strftime('%H:%M')
        return None
    
    def get_puede_cancelar(self, obj):
        """Determinar si el turno se puede cancelar (2 horas antes)"""
        if obj.start_datetime:
            tiempo_limite = obj.start_datetime - timedelta(hours=2)
            return timezone.now() < tiempo_limite and obj.status in ['pendiente', 'confirmado']
        return False 

class CambiarContrasenaSerializer(serializers.Serializer):
    """Serializer para cambio de contraseña"""
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
    new_password_confirm = serializers.CharField(write_only=True)
    
    def validate(self, data):
        """Validaciones personalizadas"""
        # Verificar que las contraseñas nuevas coincidan
        if data['new_password'] != data['new_password_confirm']:
            raise serializers.ValidationError({
                'new_password_confirm': 'Las contraseñas nuevas no coinciden'
            })
        
        # Verificar que la contraseña actual sea correcta
        user = self.context['request'].user
        if not user.check_password(data['current_password']):
            raise serializers.ValidationError({
                'current_password': 'La contraseña actual es incorrecta'
            })
        
        # Verificar que la nueva contraseña sea diferente
        if data['current_password'] == data['new_password']:
            raise serializers.ValidationError({
                'new_password': 'La nueva contraseña debe ser diferente a la actual'
            })
        
        return data
