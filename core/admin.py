from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django import forms
from django.utils.html import format_html
from .models import Usuario, Negocio, Servicio, Profesional, HorarioDisponibilidad, BloqueoHorario, Turno
import copy

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

# --- Usuario ---
class UsuarioAdmin(UserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'phone_number', 'is_staff')
    search_fields = ('username', 'email', 'first_name', 'last_name', 'phone_number')

    def get_fieldsets(self, request, obj=None):
        # Convierte a lista y haz copia profunda
        fieldsets = list(copy.deepcopy(super().get_fieldsets(request, obj)))
        # Asegurar que el campo phone_number aparezca en "Personal info"
        for name, opts in fieldsets:
            if name == 'Personal info' and 'fields' in opts:
                fields_tuple = opts.get('fields', ())
                if 'phone_number' not in fields_tuple:
                    opts['fields'] = tuple(list(fields_tuple) + ['phone_number'])
                break
        if request.user.is_superuser:
            if not any('negocio' in opts.get('fields', ()) for _, opts in fieldsets):
                fieldsets.append(('Negocio', {'fields': ('negocio',)}))
        else:
            for name, opts in fieldsets:
                if 'fields' in opts:
                    opts['fields'] = tuple(
                        f for f in opts['fields']
                        if f not in ('negocio', 'is_superuser', 'is_staff')
                    )
        return fieldsets

    def get_fields(self, request, obj=None):
        fields = list(super().get_fields(request, obj))  # crea una copia
        if not request.user.is_superuser:
            for f in ['negocio', 'is_superuser', 'is_staff']:
                if f in fields:
                    fields.remove(f)
        return fields

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(negocio=request.user.negocio)

    def save_model(self, request, obj, form, change):
        if not request.user.is_superuser:
            obj.negocio = request.user.negocio
            obj.is_superuser = False
            obj.is_staff = False
        obj.save()

    def has_change_permission(self, request, obj=None):
        if request.user.is_superuser:
            return True
        if obj is not None and obj.pk == request.user.pk:
            return False
        return super().has_change_permission(request, obj)

    def has_delete_permission(self, request, obj=None):
        if request.user.is_superuser:
            return True
        if obj is not None and obj.pk == request.user.pk:
            return False
        return super().has_delete_permission(request, obj)

admin.site.register(Usuario, UsuarioAdmin)

# --- Negocio ---
class NegocioAdmin(admin.ModelAdmin):
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(id=request.user.negocio_id)
admin.site.register(Negocio, NegocioAdmin)

# --- Servicio ---
class ServicioAdmin(admin.ModelAdmin):
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(negocio=request.user.negocio)

    def save_model(self, request, obj, form, change):
        if not request.user.is_superuser:
            obj.negocio = request.user.negocio
        obj.save()

    def get_fields(self, request, obj=None):
        fields = super().get_fields(request, obj)
        if not request.user.is_superuser and 'negocio' in fields:
            fields = [f for f in fields if f != 'negocio']
        return fields
    IONIC_ICON_CHOICES = [
        ("bag-add", "Agregar a bolsa / pedido"),
        ("bag-check", "Bolsa con check / confirmado"),
        ("bag-handle", "Bolsa con manija"),
        ("bag-remove", "Eliminar de bolsa"),
        ("bag", "Bolsa de compra"),
        ("bandage", "Curación / Venda"),
        ("barbell", "Gimnasio / Pesas"),
        ("body", "Cuidado corporal"),
        ("briefcase", "Portafolio / Profesional"),
        ("brush", "Cepillo / Belleza"),
        ("build", "Obras / Reparación"),
        ("bus", "Transporte público"),
        ("business", "Negocio / Empresa"),
        ("cafe", "Cafetería"),
        ("calendar-clear", "Calendario vacío"),
        ("calendar-number", "Calendario con fecha"),
        ("calendar", "Calendario general"),
        ("call", "Llamada telefónica"),
        ("camera-reverse", "Cámara frontal"),
        ("camera", "Cámara fotográfica"),
        ("car-sport", "Auto deportivo / privado"),
        ("car", "Auto común"),
        ("card", "Tarjeta de pago"),
        ("caret-back-circle", "Atrás (círculo)"),
        ("caret-back", "Atrás"),
        ("caret-down-circle", "Abajo (círculo)"),
        ("caret-down", "Abajo"),
        ("caret-forward-circle", "Adelante (círculo)"),
        ("caret-forward", "Adelante"),
        ("caret-up-circle", "Arriba (círculo)"),
        ("caret-up", "Arriba"),
        ("cart", "Carrito de compras"),
        ("cash", "Pago en efectivo"),
        ("chatbox-ellipses", "Chat en caja con puntos"),
        ("chatbox", "Chat en caja"),
        ("chatbubble-ellipses", "Burbuja de chat con puntos"),
        ("chatbubble", "Burbuja de chat"),
        ("chatbubbles", "Conversación múltiple"),
        ("checkmark-circle", "Confirmación (círculo)"),
        ("checkmark-done-circle", "Confirmado totalmente"),
        ("checkmark-done", "Confirmado"),
        ("checkmark", "Check simple"),
        ("construct", "Herramientas / Construcción"),
        ("cut", "Tijera / Corte"),
        ("document-attach", "Documento adjunto"),
        ("document-lock", "Documento protegido"),
        ("document-text", "Documento con texto"),
        ("document", "Documento"),
        ("documents", "Varios documentos"),
        ("fast-food", "Comida rápida"),
    ]
admin.site.register(Servicio, ServicioAdmin)

# --- Profesional ---
class ProfesionalAdmin(admin.ModelAdmin):
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(negocio=request.user.negocio)

    def save_model(self, request, obj, form, change):
        if not request.user.is_superuser:
            obj.negocio = request.user.negocio
        # Asignar rol profesional
        if obj.user.role != 'profesional':
            obj.user.role = 'profesional'
            obj.user.save()
        obj.save()

    def get_fields(self, request, obj=None):
        fields = super().get_fields(request, obj)
        if not request.user.is_superuser and 'negocio' in fields:
            fields = [f for f in fields if f != 'negocio']
        return fields

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "user" and not request.user.is_superuser:
            kwargs["queryset"] = Usuario.objects.filter(negocio=request.user.negocio)
        return super().formfield_for_foreignkey(db_field, request, **kwargs)
admin.site.register(Profesional, ProfesionalAdmin)

# --- HorarioDisponibilidad ---
class HorarioDisponibilidadAdmin(admin.ModelAdmin):
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(negocio=request.user.negocio)

    def save_model(self, request, obj, form, change):
        if not request.user.is_superuser:
            obj.negocio = request.user.negocio
        obj.save()

    def get_fields(self, request, obj=None):
        fields = super().get_fields(request, obj)
        if not request.user.is_superuser and 'negocio' in fields:
            fields = [f for f in fields if f != 'negocio']
        return fields

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if not request.user.is_superuser:
            if db_field.name == "profesional":
                kwargs["queryset"] = Profesional.objects.filter(negocio=request.user.negocio)
        return super().formfield_for_foreignkey(db_field, request, **kwargs)
admin.site.register(HorarioDisponibilidad, HorarioDisponibilidadAdmin)

# --- BloqueoHorario ---
class BloqueoHorarioAdmin(admin.ModelAdmin):
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(negocio=request.user.negocio)

    def save_model(self, request, obj, form, change):
        if not request.user.is_superuser:
            obj.negocio = request.user.negocio
        obj.save()

    def get_fields(self, request, obj=None):
        fields = super().get_fields(request, obj)
        if not request.user.is_superuser and 'negocio' in fields:
            fields = [f for f in fields if f != 'negocio']
        return fields

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if not request.user.is_superuser:
            if db_field.name == "profesional":
                kwargs["queryset"] = Profesional.objects.filter(negocio=request.user.negocio)
        return super().formfield_for_foreignkey(db_field, request, **kwargs)
admin.site.register(BloqueoHorario, BloqueoHorarioAdmin)

# --- Turno ---
class TurnoAdmin(admin.ModelAdmin):
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(negocio=request.user.negocio)

    def save_model(self, request, obj, form, change):
        if not request.user.is_superuser:
            obj.negocio = request.user.negocio
        obj.save()

    def get_fields(self, request, obj=None):
        fields = super().get_fields(request, obj)
        if not request.user.is_superuser and 'negocio' in fields:
            fields = [f for f in fields if f != 'negocio']
        return fields

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if not request.user.is_superuser:
            if db_field.name == "cliente":
                kwargs["queryset"] = Usuario.objects.filter(negocio=request.user.negocio, role='cliente')
            if db_field.name == "profesional":
                kwargs["queryset"] = Profesional.objects.filter(negocio=request.user.negocio)
            if db_field.name == "servicio":
                kwargs["queryset"] = Servicio.objects.filter(negocio=request.user.negocio)
        return super().formfield_for_foreignkey(db_field, request, **kwargs)
admin.site.register(Turno, TurnoAdmin)

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
    
    class Meta:
        model = Turno
        fields = '__all__'
        exclude = ['end_datetime']
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['cliente'].queryset = Usuario.objects.filter(role='cliente')
        self.fields['cliente'].empty_label = "Selecciona un cliente"

# =====================================================
# CONFIGURACIÓN DEL SITIO ADMIN
# =====================================================
admin.site.site_header = "Administración de Barbería"
admin.site.site_title = "Sistema de Barbería"
admin.site.index_title = "Panel de Administración"

