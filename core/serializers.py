from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import Usuario, Servicio, Profesional, HorarioDisponibilidad, BloqueoHorario, Turno


# =============================================================================
# SERIALIZERS DE AUTENTICACIÓN
# =============================================================================

class UsuarioSerializer(serializers.ModelSerializer):
    """
    Serializer principal para el modelo Usuario.
    Convierte el modelo Usuario a JSON y viceversa.
    """
    password = serializers.CharField(write_only=True)  # Password solo para escritura
    
    class Meta:
        model = Usuario
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 
            'phone_number', 'role', 'is_active', 'date_joined', 'password'
        ]
        extra_kwargs = {
            'password': {'write_only': True},  # El password nunca se devuelve en GET
        }
    
    def create(self, validated_data):
        """Crear un nuevo usuario con password encriptado"""
        password = validated_data.pop('password')
        user = Usuario.objects.create_user(**validated_data)
        user.set_password(password)  # Encripta el password
        user.save()
        return user


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
    
    def create(self, validated_data):
        """Crear un nuevo cliente"""
        validated_data.pop('password_confirm')
        validated_data['role'] = 'cliente'  # Forzar rol de cliente
        password = validated_data.pop('password')
        user = Usuario.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    """
    Serializer para login de usuarios.
    Valida credenciales y devuelve el usuario autenticado.
    """
    username = serializers.CharField()
    password = serializers.CharField()
    
    def validate(self, data):
        """Validar credenciales de usuario"""
        username = data.get('username')
        password = data.get('password')
        
        if username and password:
            user = authenticate(username=username, password=password)
            if not user:
                raise serializers.ValidationError('Credenciales inválidas')
            if not user.is_active:
                raise serializers.ValidationError('Cuenta desactivada')
            data['user'] = user
        else:
            raise serializers.ValidationError('Username y password son requeridos')
        
        return data


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
        fields = ['id', 'name', 'description', 'duration_minutes', 'price', 'is_active']


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
    
    def validate(self, data):
        """
        Validaciones personalizadas para crear turnos:
        1. Verificar que el profesional esté disponible
        2. Verificar que no haya turnos superpuestos
        3. Verificar horarios de trabajo del profesional
        """
        profesional = data.get('profesional')
        servicio = data.get('servicio')
        start_datetime = data.get('start_datetime')
        
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
        from datetime import timedelta
        end_datetime = start_datetime + timedelta(minutes=servicio.duration_minutes)
        data['end_datetime'] = end_datetime
        
        # 4. Verificar que no haya turnos superpuestos
        turnos_existentes = Turno.objects.filter(
            profesional=profesional,
            start_datetime__date=start_datetime.date(),
            status__in=['pendiente', 'confirmado']
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
            day_of_week=dia_semana
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
        
        # 6. Verificar bloqueos de horario
        bloqueos = BloqueoHorario.objects.filter(
            profesional=profesional,
            start_datetime__date=start_datetime.date()
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
    """
    profesional_id = serializers.IntegerField()
    fecha = serializers.DateField()
    servicio_id = serializers.IntegerField()
    
    def validate_profesional_id(self, value):
        """Validar que el profesional exista y esté disponible"""
        try:
            profesional = Profesional.objects.get(pk=value, is_available=True)
        except Profesional.DoesNotExist:
            raise serializers.ValidationError('Profesional no encontrado o no disponible')
        return value
    
    def validate_servicio_id(self, value):
        """Validar que el servicio exista y esté activo"""
        try:
            servicio = Servicio.objects.get(id=value, is_active=True)
        except Servicio.DoesNotExist:
            raise serializers.ValidationError('Servicio no encontrado o no activo')
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
    profesional_photo = serializers.CharField(source='profesional.profile_picture_url', read_only=True)
    
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
        from datetime import datetime, timedelta
        
        # Solo se puede cancelar si:
        # 1. El turno está pendiente o confirmado
        # 2. Faltan más de 2 horas para el turno
        if obj.status not in ['pendiente', 'confirmado']:
            return False
        
        tiempo_restante = obj.start_datetime - datetime.now()
        return tiempo_restante > timedelta(hours=2) 