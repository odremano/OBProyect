# OdremanBarber — Sistema de Gestión para Barbería

---

## Índice
1. [Descripción General](#descripcion-general)
2. [Arquitectura del Proyecto](#arquitectura-del-proyecto)
3. [Instalación y Configuración](#instalacion-y-configuracion)
4. [Modelos Principales](#modelos-principales)
5. [APIs REST Disponibles](#apis-rest-disponibles)
6. [Flujos Principales (MVP)](#flujos-principales-mvp)
7. [Personalización del Admin](#personalizacion-del-admin)
8. [Pruebas y Datos de Ejemplo](#pruebas-y-datos-de-ejemplo)
9. [Próximos Pasos y Mejoras](#proximos-pasos-y-mejoras)

---

## 1. <a name="descripcion-general"></a>Descripción General
OdremanBarber es un sistema de gestión para barberías, pensado para ser utilizado tanto por administradores/profesionales (vía panel web) como por clientes (vía app móvil). Permite gestionar reservas, servicios, profesionales, horarios y usuarios, con una arquitectura robusta y escalable basada en Django y Django REST Framework.

---

## 2. <a name="arquitectura-del-proyecto"></a>Arquitectura del Proyecto

```
┌───────────────┐      ┌───────────────┐
│   App Móvil   │      │   Panel Admin │
│ (ReactNative) │      │   (Django)    │
└──────┬────────┘      └──────┬────────┘
       │                        │
       └─────►  Django REST  ◄──┘
                (APIs + JWT)
                     │
              ┌──────┴──────┐
              │   MySQL     │
              │  Database   │
              └─────────────┘
```

---

## 3. <a name="instalacion-y-configuracion"></a>Instalación y Configuración

### **Requisitos**
- Python 3.11+
- Django 4.2+
- MySQL
- Node.js (para app móvil, opcional)

### **Instalación**
```bash
# Clona el repositorio
git clone <repo>
cd <repo>
# Crea y activa el entorno virtual
python -m venv venv
source venv/bin/activate  # o venv\Scripts\activate en Windows
# Instala dependencias
pip install -r requirements.txt
```

### **Configuración**
- Edita `barberia_project/settings.py` con tus credenciales de base de datos.
- Aplica migraciones:
  ```bash
  python manage.py makemigrations
  python manage.py migrate
  ```
- Crea un superusuario:
  ```bash
  python manage.py createsuperuser
  ```
- Corre el servidor:
  ```bash
  python manage.py runserver
  ```

---

## 4. <a name="modelos-principales"></a>Modelos Principales

- **Usuario:** Hereda de AbstractUser, con roles (cliente, profesional, administrador).
- **Servicio:** Nombre, descripción, duración, precio, activo.
- **Profesional:** Relación uno a uno con Usuario, bio, foto, disponibilidad.
- **HorarioDisponibilidad:** Horarios semanales de cada profesional.
- **BloqueoHorario:** Bloqueos puntuales de agenda.
- **Turno:** Reserva de un cliente con profesional y servicio, con validaciones de solapamiento y horarios.

---

## 5. <a name="apis-rest-disponibles"></a>APIs REST Disponibles

### **Autenticación**
- `POST /api/v1/auth/registro/` — Registro de clientes
- `POST /api/v1/auth/login/` — Login (JWT)
- `POST /api/v1/auth/logout/` — Logout (blacklist token)
- `GET/PUT/PATCH /api/v1/auth/perfil/` — Perfil de usuario

### **Públicas**
- `GET /api/v1/servicios-publicos/` — Listar servicios activos
- `GET /api/v1/profesionales-disponibles/` — Listar profesionales disponibles
- `GET /api/v1/resumen-barberia/` — Estadísticas generales

### **Reservas**
- `GET /api/v1/reservas/disponibilidad/?profesional_id=&fecha=&servicio_id=` — Consultar horarios disponibles
- `POST /api/v1/reservas/crear/` — Crear reserva (cliente autenticado)
- `GET /api/v1/reservas/mis-turnos/` — Ver mis turnos (cliente autenticado)
- `POST /api/v1/reservas/cancelar/<turno_id>/` — Cancelar turno

---

## 6. <a name="flujos-principales-mvp"></a>Flujos Principales (MVP)

1. **Registro/Login de cliente**
2. **Ver servicios y profesionales**
3. **Consultar disponibilidad y reservar turno**
4. **Ver y cancelar mis turnos**
5. **Gestión de agenda y servicios desde el admin**

---

## 7. <a name="personalizacion-del-admin"></a>Personalización del Admin

- **Formularios customizados** para turnos (solo clientes y profesionales disponibles).
- **Botón "+"** para agregar clientes, profesionales y servicios desde el formulario de turnos.
- **Filtros y búsquedas** en todos los modelos.
- **Widget de fecha/hora** con botón "Ahora".

---

## 8. <a name="pruebas-y-datos-de-ejemplo"></a>Pruebas y Datos de Ejemplo

- Usa el admin para crear servicios, profesionales y horarios.
- Prueba los endpoints con Postman (ver ejemplos en la documentación anterior).
- Los endpoints devuelven mensajes claros de error y validan solapamientos y horarios.

---

## 9. <a name="proximos-pasos-y-mejoras"></a>Próximos Pasos y Mejoras

- Desarrollar la app móvil en React Native.
- Mejorar la documentación técnica (OpenAPI/Swagger).
- Agregar tests automáticos.
- Mejorar la experiencia de usuario en el admin.
- Implementar notificaciones y recordatorios.
- Optimizar la gestión de horarios y bloqueos.

---

## **Contacto y Soporte**

Para dudas técnicas, sugerencias o reportar bugs, contacta a jaosodreman@gmail.com. 