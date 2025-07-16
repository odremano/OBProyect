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
    def get_fieldsets(self, request, obj=None):
        # Convierte a lista y haz copia profunda
        fieldsets = list(copy.deepcopy(super().get_fieldsets(request, obj)))
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

