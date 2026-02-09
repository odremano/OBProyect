"""
Utilidades para envío de emails en el sistema Ordema.
Centraliza toda la lógica de emails para facilitar mantenimiento y escalabilidad.
"""

from django.core.mail import send_mail, EmailMultiAlternatives
from django.conf import settings
from icalendar import Calendar, Event
from datetime import datetime


def enviar_email_bienvenida_usuario(user, password, negocio):
    """
    Envía email de bienvenida al usuario recién registrado con sus credenciales.
    
    Args:
        user: Instancia del modelo Usuario
        password: Contraseña temporal generada (en texto plano)
        negocio: Instancia del modelo Negocio al que fue agregado
    
    Returns:
        bool: True si se envió exitosamente, False si hubo error
    """
    try:
        asunto = f'Bienvenido a Ordema - Tus credenciales de acceso a la app'
        mensaje = f"""
Hola {user.first_name},

¡Bienvenido a Ordema!

Tu cuenta ha sido creada y relacionada al negocio {negocio.nombre} exitosamente. A continuación encontrarás tus credenciales de acceso a la app:

Usuario: {user.username}
Contraseña temporal: {password} (Por favor, cambia tu contraseña una vez accedas a la aplicación)

Pronto podrás iniciar sesión en la aplicación móvil con estas credenciales o comunicarte con nuestro chatbot OrdemAI al whatsapp +5491125593285 desde tu número registrado. 

Link de acceso directo al chatbot OrdemAI: https://wa.me/message/BYVIR2BDKTACD1

¡Te esperamos!

Saludos,
El equipo de {negocio.nombre} & Ordema.
        """
        
        send_mail(
            asunto,
            mensaje,
            settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@ordema.app',
            [user.email],
            fail_silently=False,
        )
        return True
        
    except Exception as e:
        _manejar_error_email(e, 'bienvenida_usuario')
        return False


def generar_archivo_ics(turno):
    """
    Genera un archivo iCalendar (.ics) con los datos del turno.
    
    Args:
        turno: Instancia del modelo Turno
    
    Returns:
        bytes: Contenido del archivo .ics en formato bytes
    """
    cal = Calendar()
    cal.add('prodid', '-//Ordema App//Confirmación de Turno//ES')
    cal.add('version', '2.0')
    cal.add('method', 'REQUEST')
    
    event = Event()
    event.add('summary', f'Turno en {turno.negocio.nombre} - {turno.servicio.name}')
    
    # Descripción detallada
    descripcion = f"""
Servicio: {turno.servicio.name}
Profesional: {turno.profesional.user.get_full_name()}
Precio: ${turno.servicio.price}
Duración: {turno.servicio.duration_minutes} minutos

{turno.servicio.description if turno.servicio.description else ''}
    """.strip()
    event.add('description', descripcion)
    
    # Fechas (sin timezone ya que USE_TZ = False en settings)
    event.add('dtstart', turno.start_datetime)
    event.add('dtend', turno.end_datetime)
    
    # Ubicación
    if turno.negocio.address:
        event.add('location', f'{turno.negocio.nombre}, {turno.negocio.address}')
    else:
        event.add('location', turno.negocio.nombre)
    
    # Organizador (negocio)
    organizer_email = settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@ordema.app'
    event.add('organizer', f'MAILTO:{organizer_email}')
    
    # Asistente (cliente)
    if turno.cliente.email:
        event.add('attendee', f'MAILTO:{turno.cliente.email}')
    
    # Estado confirmado
    event.add('status', 'CONFIRMED')
    
    # UID único
    event.add('uid', f'turno-{turno.id}@ordema.app')
    event.add('dtstamp', datetime.now())
    
    cal.add_component(event)
    
    return cal.to_ical()


def enviar_email_confirmacion_turno(turno):
    """
    Envía email de confirmación de turno con archivo .ics adjunto.
    
    Args:
        turno: Instancia del modelo Turno recién creado
    
    Returns:
        bool: True si se envió exitosamente, False si hubo error
    """
    try:
        # Validar que el cliente tenga email
        if not turno.cliente.email:
            print(f"[EMAIL] Cliente {turno.cliente.username} no tiene email registrado")
            return False
        
        asunto = f'Confirmación de Turno - {turno.negocio.nombre}'
        
        # Generar contenido texto plano
        texto_plano = _construir_texto_plano_turno(turno)
        
        # Generar contenido HTML
        html_content = _construir_template_html_turno(turno)
        
        # Crear mensaje con alternativas (texto + HTML)
        email = EmailMultiAlternatives(
            subject=asunto,
            body=texto_plano,
            from_email=settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@ordema.app',
            to=[turno.cliente.email]
        )
        
        # Adjuntar versión HTML
        email.attach_alternative(html_content, "text/html")
        
        # Generar y adjuntar archivo .ics
        ics_content = generar_archivo_ics(turno)
        email.attach(
            f'turno_{turno.id}.ics',
            ics_content,
            'text/calendar'
        )
        
        # Enviar
        email.send(fail_silently=False)
        print(f"[EMAIL] Confirmación de turno enviada a {turno.cliente.email}")
        return True
        
    except Exception as e:
        _manejar_error_email(e, 'confirmacion_turno')
        return False


def _construir_texto_plano_turno(turno):
    """
    Construye el contenido en texto plano para el email de confirmación.
    
    Args:
        turno: Instancia del modelo Turno
    
    Returns:
        str: Contenido del email en texto plano
    """
    fecha = turno.start_datetime.strftime('%d/%m/%Y')
    hora_inicio = turno.start_datetime.strftime('%H:%M')
    hora_fin = turno.end_datetime.strftime('%H:%M')
    
    texto = f"""
Hola {turno.cliente.first_name},

¡Tu turno ha sido confirmado exitosamente!

DETALLES DE TU TURNO:

📌 Servicio: {turno.servicio.name}
👤 Profesional: {turno.profesional.user.get_full_name()}
📅 Fecha: {fecha}
⏰ Horario: {hora_inicio} - {hora_fin}
⏱️  Duración: {turno.servicio.duration_minutes} minutos
💰 Precio: ${turno.servicio.price}
"""
    
    if turno.negocio.address:
        texto += f"📍 Dirección: {turno.negocio.address}\n"
    
    if turno.notes:
        texto += f"\n📝 Notas: {turno.notes}\n"
    
    texto += f"""

AGREGAR A TU CALENDARIO:
Hemos adjuntado un archivo .ics que puedes usar para agregar este turno a Google Calendar, Outlook, Apple Calendar o cualquier otra aplicación de calendario.

POLÍTICA DE CANCELACIÓN:
Recuerda que puedes cancelar tu turno desde la app hasta 2 horas antes de la hora programada.

¡Te esperamos!

Saludos,
{turno.negocio.nombre}
    """
    
    return texto.strip()


def _construir_template_html_turno(turno):
    """
    Construye el template HTML para el email de confirmación de turno.
    Usa colores neutros corporativos (sin personalización por negocio).
    
    Args:
        turno: Instancia del modelo Turno
    
    Returns:
        str: HTML del email
    """
    fecha = turno.start_datetime.strftime('%d/%m/%Y')
    hora_inicio = turno.start_datetime.strftime('%H:%M')
    hora_fin = turno.end_datetime.strftime('%H:%M')
    
    # Colores neutros corporativos
    COLOR_PRIMARY = '#4A90E2'  # Azul corporativo
    COLOR_DARK = '#2C3E50'     # Gris oscuro
    COLOR_LIGHT = '#F7F9FC'    # Gris claro de fondo
    COLOR_TEXT = '#34495E'     # Gris texto
    COLOR_BORDER = '#E1E8ED'   # Borde gris claro
    
    html = f"""
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirmación de Turno</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: {COLOR_LIGHT};">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: {COLOR_LIGHT}; padding: 20px 0;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden;">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background-color: {COLOR_PRIMARY}; padding: 30px 40px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                                ✅ Turno Confirmado
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Body -->
                    <tr>
                        <td style="padding: 40px;">
                            <p style="margin: 0 0 20px 0; color: {COLOR_TEXT}; font-size: 16px; line-height: 1.5;">
                                Hola <strong>{turno.cliente.first_name}</strong>,
                            </p>
                            <p style="margin: 0 0 30px 0; color: {COLOR_TEXT}; font-size: 16px; line-height: 1.5;">
                                ¡Tu turno ha sido confirmado exitosamente! A continuación encontrarás todos los detalles:
                            </p>
                            
                            <!-- Detalles del Turno -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: {COLOR_LIGHT}; border-radius: 6px; border: 1px solid {COLOR_BORDER};">
                                <tr>
                                    <td style="padding: 25px;">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="padding: 8px 0;">
                                                    <span style="color: {COLOR_TEXT}; font-size: 14px; display: inline-block; width: 120px;">📌 Servicio:</span>
                                                    <strong style="color: {COLOR_DARK}; font-size: 14px;">{turno.servicio.name}</strong>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0;">
                                                    <span style="color: {COLOR_TEXT}; font-size: 14px; display: inline-block; width: 120px;">👤 Profesional:</span>
                                                    <strong style="color: {COLOR_DARK}; font-size: 14px;">{turno.profesional.user.get_full_name()}</strong>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0;">
                                                    <span style="color: {COLOR_TEXT}; font-size: 14px; display: inline-block; width: 120px;">📅 Fecha:</span>
                                                    <strong style="color: {COLOR_DARK}; font-size: 14px;">{fecha}</strong>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0;">
                                                    <span style="color: {COLOR_TEXT}; font-size: 14px; display: inline-block; width: 120px;">⏰ Horario:</span>
                                                    <strong style="color: {COLOR_DARK}; font-size: 14px;">{hora_inicio} - {hora_fin}</strong>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0;">
                                                    <span style="color: {COLOR_TEXT}; font-size: 14px; display: inline-block; width: 120px;">⏱️  Duración:</span>
                                                    <strong style="color: {COLOR_DARK}; font-size: 14px;">{turno.servicio.duration_minutes} minutos</strong>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0;">
                                                    <span style="color: {COLOR_TEXT}; font-size: 14px; display: inline-block; width: 120px;">💰 Precio:</span>
                                                    <strong style="color: {COLOR_DARK}; font-size: 14px;">${turno.servicio.price}</strong>
                                                </td>
                                            </tr>
    """
    
    # Agregar dirección si existe
    if turno.negocio.address:
        html += f"""
                                            <tr>
                                                <td style="padding: 8px 0;">
                                                    <span style="color: {COLOR_TEXT}; font-size: 14px; display: inline-block; width: 120px;">📍 Dirección:</span>
                                                    <strong style="color: {COLOR_DARK}; font-size: 14px;">{turno.negocio.address}</strong>
                                                </td>
                                            </tr>
        """
    
    # Agregar notas si existen
    if turno.notes:
        html += f"""
                                            <tr>
                                                <td style="padding: 8px 0;">
                                                    <span style="color: {COLOR_TEXT}; font-size: 14px; display: inline-block; width: 120px;">📝 Notas:</span>
                                                    <strong style="color: {COLOR_DARK}; font-size: 14px;">{turno.notes}</strong>
                                                </td>
                                            </tr>
        """
    
    html += f"""
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Información sobre archivo .ics -->
                            <div style="margin-top: 30px; padding: 20px; background-color: #FFF9E6; border-left: 4px solid #FFC107; border-radius: 4px;">
                                <p style="margin: 0; color: {COLOR_TEXT}; font-size: 14px; line-height: 1.6;">
                                    <strong>📅 Agregar a tu calendario:</strong><br>
                                    Hemos adjuntado un archivo <code>.ics</code> que puedes usar para agregar este turno a Google Calendar, Outlook, Apple Calendar o cualquier otra aplicación de calendario.
                                </p>
                            </div>
                            
                            <!-- Política de cancelación -->
                            <div style="margin-top: 20px; padding: 15px; background-color: {COLOR_LIGHT}; border-radius: 4px;">
                                <p style="margin: 0; color: {COLOR_TEXT}; font-size: 13px; line-height: 1.5;">
                                    <strong>ℹ️  Política de cancelación:</strong><br>
                                    Recuerda que puedes cancelar tu turno desde la app hasta 2 horas antes de la hora programada.
                                </p>
                            </div>
                            
                            <p style="margin: 30px 0 0 0; color: {COLOR_TEXT}; font-size: 16px; line-height: 1.5;">
                                ¡Te esperamos!
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: {COLOR_LIGHT}; padding: 30px; text-align: center; border-top: 1px solid {COLOR_BORDER};">
                            <p style="margin: 0 0 10px 0; color: {COLOR_DARK}; font-size: 16px; font-weight: 600;">
                                {turno.negocio.nombre}
                            </p>
                            <p style="margin: 0; color: {COLOR_TEXT}; font-size: 13px;">
                                Powered by <strong>Ordema</strong>
                            </p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    """
    
    return html


def _manejar_error_email(error, contexto):
    """
    Maneja y registra errores de envío de email.
    
    Args:
        error: Excepción capturada
        contexto: String identificando el contexto del error ('bienvenida_usuario', 'confirmacion_turno', etc.)
    """
    mensaje_error = f"[EMAIL ERROR - {contexto}] {str(error)}"
    print(mensaje_error)
    # TODO: En el futuro, agregar logging más robusto (ej: logger.error())
