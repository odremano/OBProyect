# 🪒 Ordema — Sistema de Gestión de Turnos

[![Django](https://img.shields.io/badge/Django-4.2.7-green.svg)](https://www.djangoproject.com/)
[![React Native](https://img.shields.io/badge/React%20Native-0.79.4-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-53.0.15-black.svg)](https://expo.dev/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-orange.svg)](https://www.mysql.com/)
[![License](https://img.shields.io/badge/License-0BSD-blue.svg)](LICENSE)

Sistema completo de gestión para negocios que incluye un backend robusto con Django REST Framework y una aplicación móvil nativa desarrollada con React Native y Expo.

## 📋 Tabla de Contenidos

- [🎯 Descripción General](#-descripción-general)
- [🏗️ Arquitectura del Sistema](#️-arquitectura-del-sistema)
- [🚀 Características Principales](#-características-principales)
- [📱 Tecnologías Utilizadas](#-tecnologías-utilizadas)
- [⚙️ Instalación y Configuración](#️-instalación-y-configuración)
- [🗄️ Estructura de la Base de Datos](#️-estructura-de-la-base-de-datos)
- [🔌 APIs REST Disponibles](#-apis-rest-disponibles)
- [📱 Aplicación Móvil](#-aplicación-móvil)
- [👥 Roles de Usuario](#-roles-de-usuario)
- [🔄 Flujos Principales](#-flujos-principales)
- [🧪 Pruebas y Datos de Ejemplo](#-pruebas-y-datos-de-ejemplo)
- [🔧 Configuración del Entorno](#-configuración-del-entorno)
- [📈 Próximos Pasos](#-próximos-pasos)
- [🤝 Contribución](#-contribución)
- [📞 Contacto y Soporte](#-contacto-y-soporte)

---

## 🎯 Descripción General

Ordema es una solución completa para la gestión de negocios que permite:

- **Gestión de reservas** en tiempo real con validación de disponibilidad
- **Panel administrativo** personalizado para profesionales y administradores
- **Aplicación móvil** nativa para clientes con experiencia de usuario optimizada
- **Sistema de autenticación** seguro con JWT
- **Gestión de horarios** y disponibilidad de profesionales
- **Notificaciones** y recordatorios automáticos

### 🎯 Público Objetivo

- **Negocios que presten servicios con agenda** que buscan digitalizar su gestión
- **Profesionales** que necesitan administrar su agenda
- **Clientes** que desean reservar servicios de forma sencilla

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    OdremanBarber System                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │   App Móvil     │    │   Panel Admin   │                │
│  │ (React Native)  │    │   (Django)      │                │
│  │   + Expo        │    │   + Bootstrap   │                │
│  └─────────┬───────┘    └─────────┬───────┘                │
│            │                      │                        │
│            └──────────►  Django REST API  ◄───────────────┘
│                         (DRF + JWT)                        │
│                                │                            │
│                       ┌────────┴────────┐                  │
│                       │     MySQL       │                  │
│                       │   Database      │                  │
│                       └─────────────────┘                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 📁 Estructura del Proyecto

```
OdremanBarber/
├── 📁 barberia_project/          # Configuración principal de Django
│   ├── settings.py               # Configuración del proyecto
│   ├── urls.py                   # URLs principales
│   └── wsgi.py                   # Configuración WSGI
├── 📁 core/                      # Aplicación principal
│   ├── models.py                 # Modelos de datos
│   ├── views.py                  # Vistas y lógica de negocio
│   ├── serializers.py            # Serializadores DRF
│   ├── admin.py                  # Configuración del admin
│   └── urls.py                   # URLs de la API
├── 📁 barberia-app/              # Aplicación móvil React Native
│   ├── src/
│   │   ├── api/                  # Servicios de API
│   │   ├── components/           # Componentes reutilizables
│   │   ├── screens/              # Pantallas de la app
│   │   ├── navigation/           # Configuración de navegación
│   │   ├── context/              # Context API y estado global
│   │   └── theme/                # Temas y estilos
│   ├── App.tsx                   # Componente principal
│   └── package.json              # Dependencias de la app
├── 📁 media/                     # Archivos multimedia
├── 📁 negocio_logos/             # Logos de negocios
├── requirements.txt              # Dependencias de Python
├── database_schema.sql           # Esquema de base de datos
└── README.md                     # Este archivo
```

---

## 🚀 Características Principales

### 🔐 Autenticación y Seguridad
- **JWT (JSON Web Tokens)** para autenticación segura
- **Roles de usuario** (Cliente, Profesional, Administrador)
- **Validación de permisos** granular
- **Protección CSRF** habilitada

### 📅 Gestión de Reservas
- **Validación de disponibilidad** en tiempo real
- **Prevención de solapamientos** de horarios
- **Cancelación y modificación** de turnos
- **Historial completo** de reservas

### 👨‍💼 Gestión de Profesionales
- **Perfiles personalizados** con fotos y biografías
- **Horarios flexibles** por día de la semana
- **Bloqueos temporales** de agenda
- **Estadísticas de rendimiento**

### 🎨 Panel Administrativo
- **Interfaz personalizada** con CSS
- **Formularios dinámicos** con validación
- **Filtros avanzados** y búsquedas
- **Widgets de fecha/hora** optimizados

### 📱 Aplicación Móvil
- **Diseño nativo** para iOS y Android
- **Navegación intuitiva** con tabs
- **Tema personalizable** (claro/oscuro)
- **Negocios con personalización única**
- **Notificaciones push** (en desarrollo)

---

## 📱 Tecnologías Utilizadas

### Backend (Django)
- **Django 4.2.7** - Framework web principal
- **Django REST Framework 3.14.0** - APIs REST
- **MySQL 8.0** - Base de datos principal
- **Celery 5.3.4** - Tareas asíncronas
- **Redis 5.0.1** - Cache y broker de mensajes
- **JWT** - Autenticación stateless

### Frontend (React Native)
- **React Native 0.79.4** - Framework móvil
- **Expo 53.0.15** - Plataforma de desarrollo
- **React Navigation 7.x** - Navegación
- **Axios 1.10.0** - Cliente HTTP
- **AsyncStorage** - Almacenamiento local
- **Vector Icons** - Iconografía

### Herramientas de Desarrollo
- **TypeScript** - Tipado estático
- **ESLint/Prettier** - Formateo de código
- **Git** - Control de versiones
- **Postman** - Testing de APIs

---

## ⚙️ Instalación y Configuración

### 📋 Prerrequisitos

- **Python 3.11+**
- **Node.js 18+**
- **MySQL 8.0+**
- **Redis 6.0+** (opcional para desarrollo)
- **Git**

### 🔧 Instalación del Backend

```bash
# 1. Clonar el repositorio
git clone <repository-url>
cd OdremanBarber

# 2. Crear entorno virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
# o
venv\Scripts\activate     # Windows

# 3. Instalar dependencias
pip install -r requirements.txt

# 4. Configurar base de datos MySQL
mysql -u root -p
CREATE DATABASE barberia_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'barberia_user'@'localhost' IDENTIFIED BY 'tu_password';
GRANT ALL PRIVILEGES ON barberia_system.* TO 'barberia_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# 5. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# 6. Aplicar migraciones
python manage.py makemigrations
python manage.py migrate

# 7. Crear superusuario
python manage.py createsuperuser

# 8. Cargar datos de ejemplo (opcional)
python manage.py loaddata initial_data.json

# 9. Ejecutar servidor
python manage.py runserver
```

### 📱 Instalación de la App Móvil

```bash
# 1. Navegar al directorio de la app
cd barberia-app

# 2. Instalar dependencias
npm install
# o
yarn install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con la URL de tu API

# 4. Ejecutar en modo desarrollo
npm start
# o
expo start

# 5. Para desarrollo nativo
npm run android  # Android
npm run ios      # iOS
```

### 🔧 Configuración de Variables de Entorno

#### Backend (.env)
```env
DEBUG=True
SECRET_KEY=tu_secret_key_aqui
DATABASE_URL=mysql://barberia_user:password@localhost/barberia_system
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:19006
```

#### App Móvil (.env)
```env
API_BASE_URL=http://localhost:8000/api/v1
API_TIMEOUT=10000
```

---

## 🗄️ Estructura de la Base de Datos

### 📊 Modelos Principales

#### 👤 Usuario (Usuario)
```sql
- id: Primary Key
- username: Usuario único
- email: Email único
- first_name: Nombre
- last_name: Apellido
- is_active: Estado activo
- date_joined: Fecha de registro
- role: Rol (cliente, profesional, administrador)
```

#### 🎯 Servicio (Servicio)
```sql
- id: Primary Key
- nombre: Nombre del servicio
- descripcion: Descripción detallada
- duracion: Duración en minutos
- precio: Precio del servicio
- activo: Estado activo
- created_at: Fecha de creación
```

#### 👨‍💼 Profesional (Profesional)
```sql
- id: Primary Key
- usuario: OneToOne con Usuario
- bio: Biografía
- foto: Imagen de perfil
- especialidades: Texto
- created_at: Fecha de creación
```

#### 📅 Turno (Turno)
```sql
- id: Primary Key
- cliente: ForeignKey a Usuario
- profesional: ForeignKey a Profesional
- servicio: ForeignKey a Servicio
- fecha_hora: DateTime
- estado: Choices (confirmado, cancelado, completado)
- notas: Texto opcional
- created_at: Fecha de creación
```

#### ⏰ HorarioDisponibilidad
```sql
- id: Primary Key
- profesional: ForeignKey a Profesional
- dia_semana: Integer (0-6)
- hora_inicio: Time
- hora_fin: Time
- activo: Boolean
```

### 🔗 Relaciones Principales

```
Usuario (1) ←→ (1) Profesional
Usuario (1) ←→ (N) Turno (como cliente)
Profesional (1) ←→ (N) Turno (como profesional)
Profesional (1) ←→ (N) HorarioDisponibilidad
Servicio (1) ←→ (N) Turno
```

---

## 🔌 APIs REST Disponibles

### 🔐 Autenticación
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/v1/auth/registro/` | Registro de nuevos clientes |
| `POST` | `/api/v1/auth/login/` | Login y obtención de JWT |
| `POST` | `/api/v1/auth/logout/` | Logout (blacklist token) |
| `GET` | `/api/v1/auth/perfil/` | Obtener perfil del usuario |
| `PUT` | `/api/v1/auth/perfil/` | Actualizar perfil del usuario |

### 🌐 APIs Públicas
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/v1/servicios-publicos/` | Listar servicios activos |
| `GET` | `/api/v1/profesionales-disponibles/` | Listar profesionales disponibles |
| `GET` | `/api/v1/resumen-barberia/` | Estadísticas generales |

### 📅 Gestión de Reservas
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/v1/reservas/disponibilidad/` | Consultar horarios disponibles |
| `POST` | `/api/v1/reservas/crear/` | Crear nueva reserva |
| `GET` | `/api/v1/reservas/mis-turnos/` | Ver turnos del usuario |
| `POST` | `/api/v1/reservas/cancelar/<id>/` | Cancelar turno |
| `PUT` | `/api/v1/reservas/<id>/` | Modificar turno |

### 👨‍💼 Gestión de Profesionales
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/v1/profesionales/` | Listar profesionales |
| `GET` | `/api/v1/profesionales/<id>/` | Detalle de profesional |
| `GET` | `/api/v1/profesionales/<id>/horarios/` | Horarios de profesional |
| `POST` | `/api/v1/profesionales/<id>/bloqueos/` | Crear bloqueo de horario |

### 📊 Administración
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/v1/admin/servicios/` | CRUD de servicios |
| `GET` | `/api/v1/admin/usuarios/` | CRUD de usuarios |
| `GET` | `/api/v1/admin/turnos/` | CRUD de turnos |
| `GET` | `/api/v1/admin/estadisticas/` | Estadísticas administrativas |

### 📝 Ejemplos de Uso

#### Login de Usuario
```bash
curl -X POST http://localhost:8000/api/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "cliente@ejemplo.com",
    "password": "password123"
  }'
```

#### Crear Reserva
```bash
curl -X POST http://localhost:8000/api/v1/reservas/crear/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "profesional_id": 1,
    "servicio_id": 2,
    "fecha_hora": "2024-01-15T14:30:00Z"
  }'
```

---

## 📱 Aplicación Móvil

### 🎨 Características de la UI/UX

- **Diseño Material Design** con componentes nativos
- **Tema personalizable** (claro/oscuro)
- **Navegación por tabs** intuitiva
- **Animaciones fluidas** con React Native Reanimated
- **Iconografía consistente** con Vector Icons

### 📱 Pantallas Principales

#### 🏠 Home
- Resumen de servicios disponibles
- Profesionales destacados
- Acceso rápido a reservas

#### 📅 Reservas
- Calendario interactivo
- Selección de profesional y servicio
- Confirmación de disponibilidad
- Historial de turnos

#### 👤 Perfil
- Información personal
- Historial de servicios
- Configuración de notificaciones
- Cerrar sesión

#### 🔍 Servicios
- Catálogo completo de servicios
- Filtros por categoría
- Detalles y precios
- Favoritos

### 🛠️ Componentes Principales

#### 📋 Componentes Reutilizables
- `CustomButton` - Botones personalizados
- `ServiceCard` - Tarjetas de servicios
- `ProfessionalCard` - Tarjetas de profesionales
- `DateTimePicker` - Selector de fecha/hora
- `LoadingSpinner` - Indicador de carga

#### 🎨 Sistema de Temas
```typescript
// theme/colors.ts
export const lightTheme = {
  primary: '#6a67a5',
  secondary: '#f8f9fa',
  background: '#ffffff',
  text: '#212529',
  // ...
};
```

#### 🔄 Gestión de Estado
- **Context API** para estado global
- **AsyncStorage** para persistencia local
- **Axios interceptors** para manejo de tokens

---

## 👥 Roles de Usuario

### 👤 Cliente
- **Registro y login** en la aplicación móvil
- **Ver servicios** y profesionales disponibles
- **Hacer reservas** en horarios disponibles
- **Ver historial** de turnos
- **Cancelar/modificar** reservas propias

### 👨‍💼 Profesional
- **Acceso al panel admin** personalizado
- **Gestionar horarios** de disponibilidad
- **Ver agenda** de turnos asignados
- **Marcar servicios** como completados
- **Ver estadísticas** de rendimiento

### 👨‍💻 Administrador
- **Acceso completo** al panel de administración
- **Gestionar usuarios** (crear, editar, eliminar)
- **Gestionar servicios** y precios
- **Asignar profesionales** a servicios
- **Ver estadísticas** generales del negocio
- **Gestionar horarios** y bloqueos

---

## 🔄 Flujos Principales

### 📱 Flujo de Cliente (App Móvil)

```mermaid
graph TD
    A[Cliente abre app] --> B[Login/Registro]
    B --> C[Ver servicios disponibles]
    C --> D[Seleccionar servicio]
    D --> E[Ver profesionales]
    E --> F[Seleccionar profesional]
    F --> G[Ver disponibilidad]
    G --> H[Seleccionar fecha/hora]
    H --> I[Confirmar reserva]
    I --> J[Recibir confirmación]
    J --> K[Ver en mis turnos]
```

### 💼 Flujo de Profesional (Panel Admin)

```mermaid
graph TD
    A[Profesional accede al panel] --> B[Ver agenda del día]
    B --> C[Gestionar horarios disponibles]
    C --> D[Ver turnos asignados]
    D --> E[Marcar servicios completados]
    E --> F[Ver estadísticas]
    F --> G[Gestionar bloqueos]
```

### 🔧 Flujo de Administrador

```mermaid
graph TD
    A[Admin accede al panel] --> B[Gestionar usuarios]
    B --> C[Gestionar servicios]
    C --> D[Asignar profesionales]
    D --> E[Ver estadísticas generales]
    E --> F[Gestionar horarios]
    F --> G[Configurar sistema]
```

---

## 🧪 Pruebas y Datos de Ejemplo

### 🎯 Datos de Prueba Incluidos

El proyecto incluye datos de ejemplo para facilitar las pruebas:

#### 👤 Usuarios de Prueba
- **Cliente**: `cliente@ejemplo.com` / `password123`
- **Profesional**: `profesional@ejemplo.com` / `password123`
- **Admin**: `admin@ejemplo.com` / `password123`

#### 🎯 Servicios de Ejemplo
- Corte de cabello ($25, 30 min)
- Barba ($15, 20 min)
- Corte + Barba ($35, 45 min)
- Tratamiento capilar ($40, 60 min)

#### 👨‍💼 Profesionales de Ejemplo
- Juan Pérez - Especialista en cortes modernos
- María García - Experta en barbas y diseños
- Carlos López - Maestro en tratamientos

### 🧪 Comandos de Prueba

```bash
# Cargar datos de ejemplo
python manage.py loaddata initial_data.json

# Ejecutar tests
python manage.py test core.tests

# Crear datos de prueba personalizados
python create_default_business.py
```

### 📱 Testing de la App Móvil

```bash
# Ejecutar en modo desarrollo
npm start

# Testing en dispositivo físico
expo start --tunnel

# Testing en emulador
npm run android  # Android
npm run ios      # iOS
```

---

## 🔧 Configuración del Entorno

### 🐍 Configuración de Python

```bash
# Verificar versión de Python
python --version  # Debe ser 3.11+

# Instalar dependencias de desarrollo
pip install -r requirements.txt

# Configurar pre-commit hooks (opcional)
pre-commit install
```

### 📦 Configuración de Node.js

```bash
# Verificar versión de Node.js
node --version  # Debe ser 18+

# Instalar Expo CLI globalmente
npm install -g @expo/cli

# Verificar instalación de Expo
expo --version
```

### 🗄️ Configuración de MySQL

```sql
-- Crear base de datos
CREATE DATABASE barberia_system 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Crear usuario
CREATE USER 'barberia_user'@'localhost' 
IDENTIFIED BY 'tu_password_seguro';

-- Asignar permisos
GRANT ALL PRIVILEGES ON barberia_system.* 
TO 'barberia_user'@'localhost';

FLUSH PRIVILEGES;
```

### 🔧 Variables de Entorno

#### Backend (.env)
```env
# Configuración básica
DEBUG=True
SECRET_KEY=tu_secret_key_muy_seguro_aqui
ALLOWED_HOSTS=localhost,127.0.0.1,192.168.1.100

# Base de datos
DATABASE_URL=mysql://barberia_user:password@localhost/barberia_system
DB_NAME=barberia_system
DB_USER=barberia_user
DB_PASSWORD=tu_password
DB_HOST=localhost
DB_PORT=3306

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:19006,http://192.168.1.100:19006

# JWT
JWT_SECRET_KEY=tu_jwt_secret_key
JWT_ACCESS_TOKEN_LIFETIME=60
JWT_REFRESH_TOKEN_LIFETIME=1440

# Email (opcional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=tu_email@gmail.com
EMAIL_HOST_PASSWORD=tu_app_password

# Redis (opcional)
REDIS_URL=redis://localhost:6379/0
```

#### App Móvil (.env)
```env
# API Configuration
API_BASE_URL=http://localhost:8000/api/v1
API_TIMEOUT=10000
API_RETRY_ATTEMPTS=3

# App Configuration
APP_NAME=OdremanBarber
APP_VERSION=1.0.0

# Development
DEBUG=true
LOG_LEVEL=debug
```

---

## 📈 Próximos Pasos

### 🚀 Funcionalidades Pendientes

#### 🔔 Notificaciones
- [ ] **Notificaciones push** para recordatorios
- [ ] **Email automático** de confirmación
- [ ] **SMS** para recordatorios (opcional)

#### 📊 Analytics y Reportes
- [ ] **Dashboard** con métricas en tiempo real
- [ ] **Reportes** de rendimiento por profesional
- [ ] **Análisis** de tendencias de servicios

#### 💳 Pagos
- [ ] **Integración** con pasarelas de pago
- [ ] **Pagos online** en la app móvil
- [ ] **Facturación** automática

#### 🔧 Mejoras Técnicas
- [ ] **Tests unitarios** completos
- [ ] **CI/CD** pipeline
- [ ] **Docker** para despliegue
- [ ] **Documentación API** con Swagger

#### 📱 Mejoras de UX
- [ ] **Modo offline** para la app móvil
- [ ] **Búsqueda avanzada** de servicios
- [ ] **Sistema de favoritos**
- [ ] **Reseñas y calificaciones**

### 🎯 Roadmap

#### Fase 1 (Actual) - MVP
- ✅ Backend funcional
- ✅ APIs REST completas
- ✅ Panel administrativo
- ✅ App móvil básica

#### Fase 2 (Próxima)
- 🔄 Notificaciones push
- 🔄 Pagos online
- 🔄 Tests automatizados
- 🔄 Documentación completa

#### Fase 3 (Futura)
- 📋 Multi-tenancy
- 📋 API pública
- 📋 Integración con redes sociales
- 📋 Machine Learning para recomendaciones

---

## 🤝 Contribución

### 📋 Cómo Contribuir

1. **Fork** el repositorio
2. **Crea** una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. **Commit** tus cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. **Push** a la rama (`git push origin feature/nueva-funcionalidad`)
5. **Crea** un Pull Request

### 📝 Guías de Contribución

#### 🐍 Backend (Django)
- Sigue las **convenciones PEP 8**
- Escribe **tests** para nuevas funcionalidades
- Documenta **APIs** nuevas
- Usa **type hints** cuando sea posible

#### 📱 Frontend (React Native)
- Sigue las **convenciones de React**
- Usa **TypeScript** para nuevos archivos
- Mantén **componentes reutilizables**
- Documenta **props** y **interfaces**

#### 📚 Documentación
- Actualiza el **README** si es necesario
- Documenta **APIs** nuevas
- Incluye **ejemplos de uso**
- Mantén **changelog** actualizado

### 🐛 Reportar Bugs

Para reportar bugs, por favor incluye:

1. **Descripción** detallada del problema
2. **Pasos** para reproducir
3. **Comportamiento esperado** vs actual
4. **Información del sistema** (OS, versiones)
5. **Screenshots** si es relevante

---

## 📞 Contacto y Soporte

### 👨‍💻 Desarrollador Principal
- **Nombre**: Jesús Odreman
- **Email**: jaosodreman@gmail.com
- **GitHub**: [@odremano](https://github.com/odremano)

### 📧 Canales de Soporte

- **Email**: jaosodreman@gmail.com
- **Issues**: [GitHub Issues](https://github.com/odremano/OBProyect/issues)
- **Discussions**: [GitHub Discussions](https://github.com/odremano/OBProyect/discussions)

### 📚 Recursos Adicionales

- **Documentación API**: `/api/docs/` (cuando esté disponible)
- **Panel Admin**: `/admin/`
- **Base de datos**: `database_schema.sql`

### 🆘 Solución de Problemas Comunes

#### 🔧 Problemas de Instalación
```bash
# Error: mysqlclient no se instala
# Solución: Instalar dependencias del sistema
sudo apt-get install python3-dev default-libmysqlclient-dev build-essential

# Error: Expo no encuentra el proyecto
# Solución: Verificar que estás en el directorio correcto
cd barberia-app
npm install
```

#### 🗄️ Problemas de Base de Datos
```bash
# Error: Connection refused
# Solución: Verificar que MySQL esté corriendo
sudo systemctl start mysql

# Error: Access denied
# Solución: Verificar credenciales en .env
```

#### 📱 Problemas de la App Móvil
```bash
# Error: Metro bundler no inicia
# Solución: Limpiar cache
expo start --clear

# Error: App no se conecta al backend
# Solución: Verificar API_BASE_URL en .env
```

---

## 📄 Licencia

Este proyecto está bajo la licencia **0BSD**. Ver el archivo [LICENSE](LICENSE) para más detalles.
