from django.db import models
from django.contrib.auth.models import AbstractUser # Para el Custom User Model
from django.conf import settings # Para referenciar el AUTH_USER_MODEL
from django.core.validators import MinValueValidator, MaxValueValidator # Para validaciones de valores mínimos
from datetime import timedelta
# =====================================================
# 1. MODELO USUARIO (Custom User Model)
# =====================================================
# Heredamos de AbstractUser para incluir todas las funcionalidades de usuario de Django
# y añadimos nuestros campos personalizados como 'role' y 'phone_number'.
class Usuario(AbstractUser):
    # Ya incluye: username, email, password, first_name, last_name, is_active, date_joined
    # Añadimos los campos que definimos en tu esquema SQL
    phone_number = models.CharField(max_length=20, null=True, blank=True)

    # Definimos las opciones para el campo 'role'
    ROLE_CHOICES = (
        ('cliente', 'Cliente'),
        ('profesional', 'Profesional'),
        ('administrador', 'Administrador'),
    )
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='cliente',
        help_text="Rol del usuario en el sistema."
    )

    # Añadimos los campos de timestamp que tienes en tu SQL
    created_at = models.DateTimeField(auto_now_add=True) # Se establece automáticamente en la creación
    updated_at = models.DateTimeField(auto_now=True)    # Se actualiza automáticamente en cada guardado

    class Meta:
        # Esto le dice a Django que este modelo se mapea a la tabla 'usuario' en tu base de datos
        db_table = 'usuario'
        verbose_name = 'Usuario del Sistema'
        verbose_name_plural = 'Usuarios del Sistema'
        # Puedes añadir índices si no los gestionas en tu SQL, pero ya los tienes en tu script

    def __str__(self):
        return self.username

# =====================================================
# 2. MODELO SERVICIO (Service)
# =====================================================
class Servicio(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(null=True, blank=True)
    # Usamos MinValueValidator para replicar CHECK (duration_minutes > 0)
    duration_minutes = models.IntegerField(validators=[MinValueValidator(1)])
    # decimal_places y max_digits para replicar DECIMAL(10,2) y CHECK (price >= 0)
    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0.00)])
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'servicio'
        verbose_name = 'Servicio Ofrecido'
        verbose_name_plural = 'Servicios Ofrecidos'

    def __str__(self):
        return self.name

# =====================================================
# 3. MODELO PROFESIONAL (Professional)
# =====================================================
class Profesional(models.Model):
    # Campo ID autoincremental como PK (coincide con la BD)
    id = models.AutoField(primary_key=True)
    
    # Relación uno a uno con nuestro Custom User Model (Usuario)
    # Sin primary_key=True para que coincida con la estructura real
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, # Referencia al modelo de usuario configurado en settings.py
        on_delete=models.CASCADE,
        unique=True  # Para mantener la relación uno a uno
    )
    bio = models.TextField(null=True, blank=True)
    profile_picture_url = models.CharField(max_length=500, null=True, blank=True)
    is_available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'profesional'
        verbose_name = 'Profesional del Servicio'
        verbose_name_plural = 'Profesionales del Servicio'

    def __str__(self):
        # Muestra el nombre y apellido del usuario asociado al profesional
        return f"{self.user.first_name} {self.user.last_name}"


# =====================================================
# 4. MODELO HORARIO_DISPONIBILIDAD (AvailabilitySchedule)
# =====================================================
class HorarioDisponibilidad(models.Model):
    profesional = models.ForeignKey(Profesional, on_delete=models.CASCADE)
    # Usamos SmallIntegerField para TINYINT y validamos el rango
    day_of_week_choices = (
        (0, 'Lunes'), (1, 'Martes'), (2, 'Miércoles'), (3, 'Jueves'),
        (4, 'Viernes'), (5, 'Sábado'), (6, 'Domingo')
    )
    day_of_week = models.SmallIntegerField(
        choices=day_of_week_choices,
        validators=[MinValueValidator(0), MaxValueValidator(6)] # Replicar CHECK (day_of_week >= 0 AND day_of_week <= 6)
    )
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_recurring = models.BooleanField(default=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'horario_disponibilidad'
        verbose_name = 'Horario de Disponibilidad'
        verbose_name_plural = 'Horarios de Disponibilidad'
        # Añadir un constraint para replicar CHECK (end_time > start_time) a nivel de base de datos no es directo aquí.
        # Django no tiene un Meta.check_constraints comparable directamente a MySQL's CHECK.
        # La validación se haría a nivel de formulario/serializer o en el método save() del modelo.
        # Sin embargo, el constraint ya está en tu SQL y se aplicará.
        constraints = [
            models.CheckConstraint(check=models.Q(end_time__gt=models.F('start_time')), name='check_time_valid'),
        ]
        unique_together = ('profesional', 'day_of_week', 'start_time', 'end_time', 'is_recurring', 'start_date', 'end_date') # Evitar duplicados


    def __str__(self):
        day_name = dict(self.day_of_week_choices).get(self.day_of_week, 'Desconocido')
        return f"{self.profesional.user.username} - {day_name} {self.start_time}-{self.end_time}"


# =====================================================
# 5. MODELO BLOQUEO_HORARIO (TimeBlock)
# =====================================================
class BloqueoHorario(models.Model):
    profesional = models.ForeignKey(Profesional, on_delete=models.CASCADE)
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()
    reason = models.CharField(max_length=200, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'bloqueo_horario'
        verbose_name = 'Bloqueo de Horario'
        verbose_name_plural = 'Bloqueos de Horario'
        constraints = [
            models.CheckConstraint(check=models.Q(end_datetime__gt=models.F('start_datetime')), name='check_datetime_valid'),
        ]

    def __str__(self):
        return f"Bloqueo para {self.profesional.user.username} de {self.start_datetime.strftime('%Y-%m-%d %H:%M')}"


# =====================================================
# 6. MODELO TURNO (Appointment)
# =====================================================
class Turno(models.Model):
    # Relación con nuestro Custom User Model (el cliente que reserva)
    cliente = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='turnos_cliente', on_delete=models.CASCADE)
    profesional = models.ForeignKey(Profesional, related_name='turnos_profesional', on_delete=models.CASCADE)
    servicio = models.ForeignKey(Servicio, on_delete=models.CASCADE)

    start_datetime = models.DateTimeField()

    #En caso de querer visualizar en modo lectura el endDateTime descomentar línea de abajo
    end_datetime = models.DateTimeField(null=True, blank=True)

    STATUS_CHOICES = (
        ('pendiente', 'Pendiente'),
        ('confirmado', 'Confirmado'),
        ('cancelado', 'Cancelado'),
        ('completado', 'Completado'),
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pendiente'
    )
    notes = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'turno'
        verbose_name = 'Turno'
        verbose_name_plural = 'Turnos'
        constraints = [
            models.CheckConstraint(check=models.Q(end_datetime__gt=models.F('start_datetime')), name='check_turno_datetime_valid'),
        ]
        # Puedes añadir índices directamente aquí si no los gestionas en tu SQL,
        # pero ya los tienes en tu script y Django los detectará/usará.
        # Ejemplo: indexes = [models.Index(fields=['profesional', 'start_datetime', 'end_datetime', 'status'])]
    def save(self, *args, **kwargs):
        # Siempre calculamos end_datetime basado en start_datetime + duration del servicio
        if self.start_datetime and self.servicio:
            self.end_datetime = self.start_datetime + timedelta(minutes=self.servicio.duration_minutes)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Turno de {self.cliente.username} con {self.profesional.user.username} para {self.servicio.name} el {self.start_datetime.strftime('%Y-%m-%d %H:%M')}"