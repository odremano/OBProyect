"""
Utilidades del módulo core.
Incluye helpers para emails, validaciones, etc.
"""

from .email_utils import (
    enviar_email_bienvenida_usuario,
    enviar_email_confirmacion_turno,
)

__all__ = [
    'enviar_email_bienvenida_usuario',
    'enviar_email_confirmacion_turno',
]
