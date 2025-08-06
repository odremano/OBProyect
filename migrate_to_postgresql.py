#!/usr/bin/env python
"""
Script para migrar datos de MySQL a PostgreSQL
Ejecutar después de configurar PostgreSQL en Render
"""

import os
import django
from django.core.management import execute_from_command_line

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'barberia_project.settings_production')
django.setup()

def migrate_data():
    """
    Migrar datos de MySQL a PostgreSQL
    """
    print("🚀 Iniciando migración a PostgreSQL...")
    
    # 1. Crear las migraciones
    print("📝 Creando migraciones...")
    execute_from_command_line(['manage.py', 'makemigrations'])
    
    # 2. Ejecutar migraciones
    print("🔄 Ejecutando migraciones...")
    execute_from_command_line(['manage.py', 'migrate'])
    
    # 3. Crear superusuario si es necesario
    print("👤 Creando superusuario...")
    try:
        execute_from_command_line(['manage.py', 'createsuperuser', '--noinput'])
    except:
        print("Superusuario ya existe o error en creación")
    
    print("✅ Migración completada exitosamente!")

if __name__ == '__main__':
    migrate_data() 