from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django import forms
from django.utils.html import format_html
from .models import Usuario, Servicio, Profesional, HorarioDisponibilidad, BloqueoHorario, Turno

# =====================================================
# WIDGET PERSONALIZADO PARA DATETIME CON BOTÓN "AHORA"
# =====================================================
class DateTimeWithNowWidget(forms.SplitDateTimeWidget):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
    
    def render(self, name, value, attrs=None, renderer=None):
        # Renderizar el widget normal
        html = super().render(name, value, attrs, renderer)
        
        # Agregar botón "Ahora" con JavaScript inline
        button_html = format_html(
            '<button type="button" onclick="setCurrentDateTime(\'{}\');" '
            'style="margin-left: 10px; padding: 5px 10px; background: #007cba; '
            'color: white; border: none; border-radius: 3px; cursor: pointer;">'
            'Ahora</button>'
            '<script>'
            'function setCurrentDateTime(fieldName) {{'
            '  const now = new Date();'
            '  const dateField = document.querySelector(\'input[name="\' + fieldName + \'_0"]\');'
            '  const timeField = document.querySelector(\'input[name="\' + fieldName + \'_1"]\');'
            '  if (dateField) {{'
            '    const year = now.getFullYear();'
            '    const month = String(now.getMonth() + 1).padStart(2, "0");'
            '    const day = String(now.getDate()).padStart(2, "0");'
            '    dateField.value = `${{year}}-${{month}}-${{day}}`;'
            '  }}'
            '  if (timeField) {{'
            '    const hours = String(now.getHours()).padStart(2, "0");'
            '    const minutes = String(now.getMinutes()).padStart(2, "0");'
            '    timeField.value = `${{hours}}:${{minutes}}`;'
            '  }}'
            '}}'
            '</script>',
            name
        )
        
        return html + button_html

# =====================================================
# ADMIN PARA USUARIO PERSONALIZADO
# =====================================================
@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'role', 'is_active', 'date_joined')
    list_filter = ('role', 'is_active', 'is_staff', 'is_superuser', 'date_joined')
    search_fields = ('username', 'email', 'first_name', 'last_name', 'phone_number')
    ordering = ('-date_joined',)
    
    # Campos adicionales para el formulario de edición
    fieldsets = UserAdmin.fieldsets + (
        ('Información Personal', {
            'fields': ('phone_number', 'role')
        }),
    )
    
    # Campos para crear nuevo usuario
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Información Personal', {
            'fields': ('phone_number', 'role')
        }),
    )

# =====================================================
# ADMIN PARA SERVICIOS
# =====================================================
@admin.register(Servicio)
class ServicioAdmin(admin.ModelAdmin):
    list_display = ('name', 'price', 'duration_minutes', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('name', 'description')
    ordering = ('name',)
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('name', 'description')
        }),
        ('Configuración', {
            'fields': ('duration_minutes', 'price', 'is_active')
        }),
    )

# =====================================================
# ADMIN PARA PROFESIONALES
# =====================================================
@admin.register(Profesional)
class ProfesionalAdmin(admin.ModelAdmin):
    list_display = ('get_full_name', 'get_email', 'is_available', 'created_at')
    list_filter = ('is_available', 'created_at')
    search_fields = ('user__username', 'user__first_name', 'user__last_name', 'user__email')
    ordering = ('user__first_name',)
    
    fieldsets = (
        ('Usuario Asociado', {
            'fields': ('user',)
        }),
        ('Información Profesional', {
            'fields': ('bio', 'profile_picture_url', 'is_available')
        }),
    )
    
    def get_full_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}"
    get_full_name.short_description = 'Nombre Completo'
    
    def get_email(self, obj):
        return obj.user.email
    get_email.short_description = 'Email'

# =====================================================
# ADMIN PARA HORARIOS DE DISPONIBILIDAD
# =====================================================
@admin.register(HorarioDisponibilidad)
class HorarioDisponibilidadAdmin(admin.ModelAdmin):
    list_display = ('profesional', 'get_day_name', 'start_time', 'end_time', 'is_recurring')
    list_filter = ('day_of_week', 'is_recurring', 'profesional')
    search_fields = ('profesional__user__first_name', 'profesional__user__last_name')
    ordering = ('profesional__user__first_name', 'day_of_week', 'start_time')
    
    fieldsets = (
        ('Profesional', {
            'fields': ('profesional',)
        }),
        ('Horario', {
            'fields': ('day_of_week', 'start_time', 'end_time')
        }),
        ('Configuración', {
            'fields': ('is_recurring', 'start_date', 'end_date')
        }),
    )
    
    def get_day_name(self, obj):
        return dict(obj.day_of_week_choices).get(obj.day_of_week, 'Desconocido')
    get_day_name.short_description = 'Día'

# =====================================================
# ADMIN PARA BLOQUEOS DE HORARIO
# =====================================================
@admin.register(BloqueoHorario)
class BloqueoHorarioAdmin(admin.ModelAdmin):
    list_display = ('profesional', 'start_datetime', 'end_datetime', 'reason', 'created_at')
    list_filter = ('profesional', 'created_at')
    search_fields = ('profesional__user__first_name', 'profesional__user__last_name', 'reason')
    ordering = ('-start_datetime',)
    
    fieldsets = (
        ('Profesional', {
            'fields': ('profesional',)
        }),
        ('Período de Bloqueo', {
            'fields': ('start_datetime', 'end_datetime', 'reason')
        }),
    )

# =====================================================
# FORMULARIO PERSONALIZADO PARA TURNOS
# =====================================================
class TurnoForm(forms.ModelForm):
    start_datetime = forms.SplitDateTimeField(
        label='Fecha y Hora de Inicio',
        help_text='Selecciona la fecha y hora, o haz clic en "Ahora" para la fecha/hora actual.',
        widget=DateTimeWithNowWidget(
            date_attrs={'type': 'date'},
            time_attrs={'type': 'time', 'step': '60'}
        )
    )
    
    # ✅ FILTRAR SOLO CLIENTES:
    cliente = forms.ModelChoiceField(
        queryset=Usuario.objects.filter(role='cliente'),
        label='Cliente',
        empty_label="Selecciona un cliente"
    )
    
    class Meta:
        model = Turno
        fields = '__all__'
        exclude = ['end_datetime']  # Excluir end_datetime ya que se calcula automáticamente

# =====================================================
# ADMIN PARA TURNOS
# =====================================================
@admin.register(Turno)
class TurnoAdmin(admin.ModelAdmin):
    form = TurnoForm  # Usa el formulario personalizado
    
    list_display = ('get_cliente_name', 'get_profesional_name', 'servicio', 'start_datetime', 'status', 'created_at')
    list_filter = ('status', 'servicio', 'created_at', 'start_datetime')
    search_fields = (
        'cliente__username', 'cliente__first_name', 'cliente__last_name',
        'profesional__user__first_name', 'profesional__user__last_name',
        'servicio__name'
    )
    ordering = ('-start_datetime',)
    
    fieldsets = (
        ('Participantes', {
            'fields': ('cliente', 'profesional', 'servicio')
        }),
        ('Horario', {
            'fields': ('start_datetime',)
        }),
        ('Estado', {
            'fields': ('status', 'notes')
        }),
    )
    
    # readonly_fields = ('end_datetime',)  # Comentado porque end_datetime está excluido del formulario
    
    def get_cliente_name(self, obj):
        return f"{obj.cliente.first_name} {obj.cliente.last_name}"
    get_cliente_name.short_description = 'Cliente'
    
    def get_profesional_name(self, obj):
        return f"{obj.profesional.user.first_name} {obj.profesional.user.last_name}"
    get_profesional_name.short_description = 'Profesional'

# =====================================================
# CONFIGURACIÓN DEL SITIO ADMIN
# =====================================================
admin.site.site_header = "Administración de Barbería"
admin.site.site_title = "Sistema de Barbería"
admin.site.index_title = "Panel de Administración"

