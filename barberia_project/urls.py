"""
URL configuration for barberia_project project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
# Swagger/OpenAPI imports
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

schema_view = get_schema_view(
   openapi.Info(
      title="OdremanBarber API",
      default_version='v1',
      description="Documentación interactiva de la API REST de OdremanBarber",
      contact=openapi.Contact(email="jaosodreman@gmail.com"),
   ),
   public=True,
   permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    # Panel de Administración Django
    path('admin/', admin.site.urls),
    
    # APIs v1 - Para App Móvil y Panel Admin
    path('api/v1/', include('core.urls')),
    
    # Navegador de APIs (Django REST Framework)
    path('api-auth/', include('rest_framework.urls')),
    # Swagger/OpenAPI
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]

# Configuración del Admin
admin.site.site_header = "Ordema Administration"  # Título en el encabezado
admin.site.site_title = "Panel de Ordema"
admin.site.index_title = "Bienvenido al Panel de Administración de Ordema"

# Servir archivos de medios en desarrollo
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)