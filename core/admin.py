from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django import forms
from django.utils.html import format_html
from .models import Usuario, Membership, Negocio, Servicio, Profesional, HorarioDisponibilidad, BloqueoHorario, Turno
import copy
from core.services.memberships import sync_profesional_profile

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
# === Helpers multi-negocio ===
def user_negocio_ids(user):
    """Retorna IDs de negocios a los que el usuario tiene acceso"""
    if user.is_superuser:
        return None  # Superusuario tiene acceso a todo
    
    # Obtener negocios desde Membership
    return list(
        Membership.objects.filter(user=user, is_active=True)
        .values_list('negocio_id', flat=True)
    )


def limit_queryset_by_user_negocios(qs, user):
    """Filtra un queryset por los negocios del usuario"""
    negocio_ids = user_negocio_ids(user)
    if negocio_ids is None:
        return qs  # Superusuario ve todo
    return qs.filter(negocio_id__in=negocio_ids)

# --- Membership --- 08/10/2025 Odreman.
@admin.register(Membership)
class MembershipAdmin(admin.ModelAdmin):
    list_display = ('user', 'negocio', 'rol', 'is_active', 'created_at')
    list_filter = ('rol', 'is_active', 'negocio')
    search_fields = ('user__username', 'user__email', 'negocio__nombre')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Membresía', {
            'fields': ('user', 'negocio', 'rol', 'is_active')
        }),
        ('Fechas', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def save_model(self, request, obj, form, change):
        """
        Al cambiar el rol, sincroniza automáticamente el perfil profesional
        """
        super().save_model(request, obj, form, change)
        
        # Si cambió el rol, sincronizar
        if 'rol' in form.changed_data or not change:
            sync_profesional_profile(
                user=obj.user,
                negocio=obj.negocio,
                rol=obj.rol
            )
    def delete_model(self, request, obj):
        """
        Muestra mensaje informativo al eliminar una Membresía.
        El signal se encargará de eliminar el perfil Profesional si aplica.
        """
        user_username = obj.user.username
        negocio_nombre = obj.negocio.nombre
        rol = obj.rol
        
        # Eliminar (el signal sync_profesional_on_membership_delete se ejecutará automáticamente)
        super().delete_model(request, obj)
        
        # Mensaje informativo
        from django.contrib import messages
        if rol == Membership.Roles.PROFESIONAL:
            messages.success(
                request,
                f"Membresía de profesional eliminada. "
                f"El perfil profesional de '{user_username}' en '{negocio_nombre}' fue eliminado."
            )
        else:
            messages.success(
                request,
                f"Membresía de cliente eliminada. "
                f"'{user_username}' ya no pertenece a '{negocio_nombre}'."
            )
    
    # NUEVO: Mensaje al eliminar VARIAS membresías
    def delete_queryset(self, request, queryset):
        """
        Mensaje al eliminar múltiples Membresías desde la lista.
        """
        count = queryset.count()
        count_profesionales = queryset.filter(rol=Membership.Roles.PROFESIONAL).count()
        
        # Guardar info antes de eliminar (para el mensaje)
        memberships_info = [
            f"{m.user.username} ({m.negocio.nombre}) - {m.get_rol_display()}" 
            for m in queryset[:5]  # Solo mostrar los primeros 5
        ]
        
        # Eliminar (los signals se ejecutarán automáticamente para cada uno)
        super().delete_queryset(request, queryset)
        
        # Mensaje informativo
        from django.contrib import messages
        mensaje = f"{count} membresía(s) eliminada(s)."
        
        if count_profesionales > 0:
            mensaje += f" Se eliminaron {count_profesionales} perfil(es) profesional(es)."
        
        if count <= 5:
            mensaje += f"\n\nUsuarios afectados:\n" + "\n".join(memberships_info)
        
        messages.success(request, mensaje)

    def get_queryset(self, request):
        """Filtra membresías por negocios del usuario"""
        qs = super().get_queryset(request)
        return limit_queryset_by_user_negocios(qs, request.user)

# --- Usuario ---
class UsuarioAdmin(UserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'phone_number', 'is_staff')
    search_fields = ('username', 'email', 'first_name', 'last_name', 'phone_number')

    def get_fieldsets(self, request, obj=None):
        # Convierte a lista y haz copia profunda
        fieldsets = list(copy.deepcopy(super().get_fieldsets(request, obj)))
        # Asegurar que el campo phone_number aparezca en "Personal info"
        for name, opts in fieldsets:
            if name == 'Información personal' and 'fields' in opts:
                fields_tuple = opts.get('fields', ())
                if 'phone_number' not in fields_tuple:
                    opts['fields'] = tuple(list(fields_tuple) + ['phone_number'])
                break
        return fieldsets

    def get_fields(self, request, obj=None):
        fields = list(super().get_fields(request, obj))  # crea una copia
        for f in ['is_superuser', 'is_staff']:
            if not request.user.is_superuser and f in fields:
                fields.remove(f)
        return fields

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(memberships__negocio_id__in=user_negocio_ids(request.user)).distinct()
    
    def save_model(self, request, obj, form, change):
        if not request.user.is_superuser:
            obj.is_superuser = False
        
        super().save_model(request, obj, form, change)

        try:
            # tomar el activo desde request.negocio si existe
            activo_id = getattr(getattr(request, 'negocio', None), 'id', None)
            # fallback: tomar de la sesión
            if not activo_id:
                activo_id = request.session.get('active_negocio_id')

            if activo_id:
                Membership.objects.get_or_create(
                    user=obj,
                    negocio_id=activo_id,
                    defaults={
                        'rol': getattr(obj, 'role', 'cliente'),
                        'is_active': True,
                    },
                )
        except Exception:
            pass

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
    list_display = ('nombre', 'id', 'propietario', 'logo_preview', 'fecha_creacion')
    list_filter = ('fecha_creacion',)
    search_fields = ('nombre', 'propietario__username')
    readonly_fields = ('fecha_creacion',)
    
    fieldsets = (
        ('Información General', {
            'fields': ('nombre', 'propietario', 'fecha_creacion')
        }),
        ('Logo y Dimensiones', {
            'fields': ('logo', 'logo_width', 'logo_height'),
            'description': 'Configura el logo del negocio y sus dimensiones de visualización en la aplicación.'
        }),
        ('Configuración de Tema', {
            'fields': ('theme_colors',),
            'classes': ('collapse',)
        }),
    )
    
    def logo_preview(self, obj):
        if obj.logo:
            return format_html(
                '<img src="{}" width="50" height="50" style="object-fit: contain; border: 1px solid #ddd;" />',
                obj.logo.url
            )
        return "Sin logo"
    logo_preview.short_description = "Vista previa"
    
    def logo_dimensions(self, obj):
        return f"{obj.logo_width}x{obj.logo_height}px"
    logo_dimensions.short_description = "Dimensiones"
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(id=request.negocio_id)
admin.site.register(Negocio, NegocioAdmin)

# --- Servicio ---
class ServicioAdmin(admin.ModelAdmin):
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(negocio=request.negocio)

    def save_model(self, request, obj, form, change):
        if not request.user.is_superuser:
            obj.negocio = request.negocio
        obj.save()

    def get_fields(self, request, obj=None):
        fields = super().get_fields(request, obj)
        if not request.user.is_superuser and 'negocio' in fields:
            fields = [f for f in fields if f != 'negocio']
        return fields
admin.site.register(Servicio, ServicioAdmin)

# --- Profesional ---
class ProfesionalAdmin(admin.ModelAdmin):
    list_display = ('user', 'negocio', 'bio', 'is_available', 'created_at')
    list_filter = ('is_available', 'negocio', 'created_at')
    search_fields = ('user__username', 'user__email', 'negocio__nombre')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('user', 'negocio', 'bio', 'is_available')
        }),
        ('Fechas', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(negocio=request.negocio)

    def save_model(self, request, obj, form, change):
        if not request.user.is_superuser:
            obj.negocio = request.negocio
        # CAMBIO: En lugar de modificar user.role, sincronizamos Membership
        obj.save()
        
        # Sincronizar automáticamente el Membership
        sync_profesional_profile(
            user=obj.user,
            negocio=obj.negocio,
            rol=Membership.Roles.PROFESIONAL
        )
    def delete_model(self, request, obj):
        """
        Muestra mensaje informativo al eliminar un Profesional.
        El signal se encargará de actualizar el Membership automáticamente.
        """
        user_username = obj.user.username
        negocio_nombre = obj.negocio.nombre
        
        # Eliminar (el signal sync_membership_on_profesional_delete se ejecutará automáticamente)
        super().delete_model(request, obj)
        
        # Mensaje informativo
        from django.contrib import messages
        messages.success(
            request,
            f" Profesional '{user_username}' eliminado. "
            f"Ahora es cliente en '{negocio_nombre}'."
        )
    
    def delete_queryset(self, request, queryset):
        """
        Mensaje al eliminar múltiples Profesionales desde la lista.
        """
        count = queryset.count()
        
        # Guardar info antes de eliminar (para el mensaje)
        profesionales_info = [
            f"{p.user.username} ({p.negocio.nombre})" 
            for p in queryset[:5]  # Solo mostrar los primeros 5
        ]
        
        # Eliminar (los signals se ejecutarán automáticamente para cada uno)
        super().delete_queryset(request, queryset)
        
        # Mensaje informativo
        from django.contrib import messages
        mensaje = f"{count} profesional(es) eliminado(s). Los Memberships fueron actualizados a 'cliente'."
        
        if count <= 5:
            mensaje += f"\n\nUsuarios afectados: {', '.join(profesionales_info)}"
        
        messages.success(request, mensaje)

    def get_fields(self, request, obj=None):
        fields = super().get_fields(request, obj)
        if not request.user.is_superuser and 'negocio' in fields:
            fields = [f for f in fields if f != 'negocio']
        return fields

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        # --- limitar el dropdown de "user" a usuarios que pertenezcan al negocio activo (o a los negocios del staff) ---
        if db_field.name == "user" and not request.user.is_superuser:
            from .models import Usuario  # importa local para evitar ciclos
            active_id = getattr(getattr(request, "negocio", None), "id", None)

            qs = Usuario.objects.all()

            if active_id:
                qs = qs.filter(memberships__negocio_id=active_id)
            else:
                # fallback: todos los negocios donde el staff tiene membership
                qs = qs.filter(memberships__negocio_id__in=user_negocio_ids(request.user))

            # (opcional) si tu modelo usa role, podés acotar:
            # qs = qs.filter(role__in=["profesional", ""])  # ajusta a tu realidad

            kwargs["queryset"] = qs.distinct()

        # --- limitar "negocio" igual que en los otros admins ---
        if db_field.name == "negocio" and not request.user.is_superuser:
            from .models import Negocio
            active_id = getattr(getattr(request, "negocio", None), "id", None)
            if active_id:
                kwargs["queryset"] = Negocio.objects.filter(id=active_id)
            else:
                kwargs["queryset"] = Negocio.objects.filter(id__in=user_negocio_ids(request.user))

        return super().formfield_for_foreignkey(db_field, request, **kwargs)
admin.site.register(Profesional, ProfesionalAdmin)

# --- HorarioDisponibilidad ---
class HorarioDisponibilidadAdmin(admin.ModelAdmin):
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(negocio=request.negocio)

    def save_model(self, request, obj, form, change):
        if not request.user.is_superuser:
            obj.negocio = request.negocio
        obj.save()

    def get_fields(self, request, obj=None):
        fields = super().get_fields(request, obj)
        if not request.user.is_superuser and 'negocio' in fields:
            fields = [f for f in fields if f != 'negocio']
        return fields

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if not request.user.is_superuser:
            if db_field.name == "profesional":
                kwargs["queryset"] = Profesional.objects.filter(negocio=request.negocio)
        return super().formfield_for_foreignkey(db_field, request, **kwargs)
admin.site.register(HorarioDisponibilidad, HorarioDisponibilidadAdmin)

# --- BloqueoHorario ---
class BloqueoHorarioAdmin(admin.ModelAdmin):
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(negocio=request.negocio)

    def save_model(self, request, obj, form, change):
        if not request.user.is_superuser:
            obj.negocio = request.negocio
        obj.save()

    def get_fields(self, request, obj=None):
        fields = super().get_fields(request, obj)
        if not request.user.is_superuser and 'negocio' in fields:
            fields = [f for f in fields if f != 'negocio']
        return fields

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if not request.user.is_superuser:
            if db_field.name == "profesional":
                kwargs["queryset"] = Profesional.objects.filter(negocio=request.negocio)
        return super().formfield_for_foreignkey(db_field, request, **kwargs)
admin.site.register(BloqueoHorario, BloqueoHorarioAdmin)

# --- Turno ---
class TurnoAdmin(admin.ModelAdmin):
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(negocio=request.negocio)

    def save_model(self, request, obj, form, change):
        if not request.user.is_superuser:
            obj.negocio = request.negocio
        obj.save()

    def get_fields(self, request, obj=None):
        fields = super().get_fields(request, obj)
        if not request.user.is_superuser and 'negocio' in fields:
            fields = [f for f in fields if f != 'negocio']
        return fields

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if not request.user.is_superuser:
            if db_field.name == "cliente":
                # CAMBIO: Filtrar por rol de Membership en lugar de user.role
                kwargs["queryset"] = Usuario.objects.filter(
                    memberships__negocio=request.negocio,
                    memberships__rol=Membership.Roles.CLIENTE,
                    memberships__is_active=True
                ).distinct()
            if db_field.name == "profesional":
                kwargs["queryset"] = Profesional.objects.filter(negocio=request.negocio)
            if db_field.name == "servicio":
                kwargs["queryset"] = Servicio.objects.filter(negocio=request.negocio)
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
        self.fields['cliente'].queryset = Usuario.objects.filter(
            memberships__rol=Membership.Roles.CLIENTE,
            memberships__is_active=True
        ).distinct()
        self.fields['cliente'].empty_label = "Selecciona un cliente"

# =====================================================
# CONFIGURACIÓN DEL SITIO ADMIN
# =====================================================
admin.site.site_header = "Administración de Negocios"
admin.site.site_title = "Sistema de Negocios"
admin.site.index_title = "Panel de Administración"

