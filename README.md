# Sistema de Gestión de Barbería

## 📋 Descripción

Sistema completo de gestión para barberías que incluye:
- Gestión de usuarios (clientes, profesionales, administradores)
- Catálogo de servicios
- Sistema de reservas y turnos
- Gestión de horarios y disponibilidad
- Backend API para aplicación móvil
- Panel de administración web

## 🗄️ Base de Datos

### Estructura de Tablas

1. **usuario** - Gestión de usuarios del sistema
2. **servicio** - Catálogo de servicios ofrecidos
3. **profesional** - Información específica de profesionales
4. **horario_disponibilidad** - Horarios regulares de trabajo
5. **bloqueo_horario** - Bloqueos específicos de tiempo
6. **turno** - Citas y reservas

### Instalación de la Base de Datos

1. **Requisitos previos:**
   - MySQL 8.0 o superior
   - Acceso de administrador a MySQL

2. **Ejecutar el script SQL:**
   ```bash
   mysql -u root -p < database_schema.sql
   ```

3. **Verificar la instalación:**
   ```sql
   USE barberia_system;
   SHOW TABLES;
   ```

### Características de la Base de Datos

- ✅ **Integridad referencial** con foreign keys
- ✅ **Índices optimizados** para consultas frecuentes
- ✅ **Validaciones de datos** con CHECK constraints
- ✅ **Vistas útiles** para consultas complejas
- ✅ **Procedimientos almacenados** para lógica de negocio
- ✅ **Datos de ejemplo** para pruebas

## 🚀 Próximos Pasos

### 1. Configurar Django

```bash
# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate

# Instalar dependencias
pip install django djangorestframework mysqlclient python-decouple

# Crear proyecto Django
django-admin startproject barberia_project .
```

### 2. Configurar settings.py

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'barberia_system',
        'USER': 'tu_usuario',
        'PASSWORD': 'tu_password',
        'HOST': 'localhost',
        'PORT': '3306',
        'OPTIONS': {
            'charset': 'utf8mb4',
        },
    }
}
```

### 3. Crear Apps Django

```bash
python manage.py startapp usuarios
python manage.py startapp servicios
python manage.py startapp turnos
python manage.py startapp api
```

### 4. Implementar Modelos Django

Los modelos deben reflejar la estructura de la base de datos creada, aprovechando las relaciones y validaciones ya definidas.

### 5. Crear APIs REST

- Autenticación JWT
- Endpoints para gestión de turnos
- Endpoints para disponibilidad
- Endpoints para servicios y profesionales

### 6. Implementar Funcionalidades

- Sistema de notificaciones
- Integración con pasarelas de pago
- Reportes y estadísticas
- Panel de administración

## 📱 Funcionalidades Principales

### Para Clientes
- Registro e inicio de sesión
- Ver servicios disponibles
- Reservar turnos
- Ver historial de citas
- Cancelar/modificar reservas

### Para Profesionales
- Gestionar horarios de trabajo
- Ver agenda de turnos
- Marcar servicios completados
- Gestionar bloqueos de tiempo

### Para Administradores
- Gestión completa de usuarios
- Configuración de servicios
- Reportes y estadísticas
- Gestión del sistema

## 🔧 Tecnologías Sugeridas

### Backend
- **Django** - Framework web
- **Django REST Framework** - APIs REST
- **MySQL** - Base de datos
- **Celery** - Tareas asíncronas
- **Redis** - Cache y cola de tareas

### Frontend (App Móvil)
- **React Native** o **Flutter**
- **Redux** o **Provider** para estado
- **Axios** para APIs

### Frontend (Panel Web)
- **React** o **Vue.js**
- **Material-UI** o **Ant Design**
- **Chart.js** para gráficos

## 📊 Estructura del Proyecto

```
barberia_system/
├── database_schema.sql      # Esquema de base de datos
├── README.md               # Este archivo
├── requirements.txt        # Dependencias Python
├── manage.py              # Django management
├── barberia_project/      # Configuración Django
├── usuarios/              # App de usuarios
├── servicios/             # App de servicios
├── turnos/                # App de turnos
├── api/                   # APIs REST
└── static/                # Archivos estáticos
```

## 🛠️ Comandos Útiles

### Base de Datos
```sql
-- Verificar disponibilidad de un profesional
CALL VerificarDisponibilidad(1, '2024-01-15', '10:00:00', '11:00:00');

-- Obtener horarios disponibles
CALL ObtenerHorariosDisponibles(1, '2024-01-15');

-- Ver turnos completos
SELECT * FROM v_turnos_completos;
```

### Django
```bash
# Crear migraciones
python manage.py makemigrations

# Aplicar migraciones
python manage.py migrate

# Crear superusuario
python manage.py createsuperuser

# Ejecutar servidor
python manage.py runserver
```

## 📞 Soporte

Para dudas o problemas con la implementación, revisa:
1. La documentación de Django
2. Los comentarios en el script SQL
3. Los logs de error del servidor

## 🔄 Versiones

- **v0.1** - Estructura base de base de datos
- **v0.2** - APIs REST básicas
- **v0.3** - App móvil
- **v1.0** - Sistema completo

---

**Nota:** Este es un sistema escalable diseñado para crecer con tu negocio. La estructura permite agregar múltiples ubicaciones, nuevos tipos de servicios y funcionalidades avanzadas en el futuro. 