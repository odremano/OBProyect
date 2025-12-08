# CAMBIO IMPORTANTE: Cambiamos 'buster' por 'bookworm' (Debian 12)
# Esto arregla el error 404 de los repositorios.
FROM python:3.10-slim-bookworm

# Variables de entorno
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Directorio de trabajo
WORKDIR /app

# Instalar dependencias del sistema (necesarias para mysqlclient)
# En Bookworm esto funcionará perfectamente.
RUN apt-get update && apt-get install -y \
    pkg-config \
    gcc \
    default-libmysqlclient-dev \
    && rm -rf /var/lib/apt/lists/*

# Instalar dependencias de Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el código
COPY . .

# Exponer puerto
EXPOSE 8000

# Comando de arranque
CMD ["bash", "-c", "python manage.py migrate && gunicorn --bind 0.0.0.0:8000 barberia_project.wsgi:application"]