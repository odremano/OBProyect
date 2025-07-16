#!/usr/bin/env python
"""
Script para crear el negocio por defecto después de las migraciones multi-tenant
"""
import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'barberia_project.settings')
django.setup()

from core.models import Negocio, Usuario

def create_default_business():
    # Verificar si ya existe un negocio con ID 1
    if Negocio.objects.filter(id=1).exists():
        print("✅ Ya existe un negocio con ID 1")
        return
    
    # Buscar o crear un usuario propietario
    propietario = Usuario.objects.filter(role='administrador').first()
    
    if not propietario:
        print("Creando usuario administrador por defecto...")
        propietario = Usuario.objects.create_user(
            username='admin',
            email='admin@odreman.com',
            password='admin123',
            role='administrador',
            first_name='Admin',
            last_name='OdremanBarber'
        )
        print(f"✅ Usuario administrador creado: {propietario.username}")
    else:
        print(f"✅ Usando usuario existente: {propietario.username}")
    
    # Crear el negocio por defecto
    negocio = Negocio.objects.create(
        id=1,  # Forzar ID 1
        nombre='OdremanBarber',
        propietario=propietario
    )
    
    print(f"✅ Negocio creado: {negocio.nombre} (ID: {negocio.id})")
    
    # Asignar el negocio a todos los usuarios que no lo tengan
    usuarios_sin_negocio = Usuario.objects.filter(negocio__isnull=True)
    if usuarios_sin_negocio.exists():
        usuarios_sin_negocio.update(negocio=negocio)
        print(f"✅ Asignado negocio a {usuarios_sin_negocio.count()} usuarios")
    
    print("🎉 Configuración multi-tenant completada!")

if __name__ == '__main__':
    create_default_business() 