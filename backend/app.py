import os
import sys
from pathlib import Path

import django
from django.conf import settings

BASE_DIR = Path(__file__).resolve().parent

settings.configure(
    DEBUG=True,
    SECRET_KEY="django-insecure-dev-key-change-in-production",
    ALLOWED_HOSTS=["*"],
    ROOT_URLCONF="api.urls",
    WSGI_APPLICATION=f"{__name__}.application",
    INSTALLED_APPS=[
        "django.contrib.auth",
        "django.contrib.contenttypes",
        "rest_framework",
        "rest_framework.authtoken",
        "corsheaders",
        "api",
    ],
    MIDDLEWARE=[
        "corsheaders.middleware.CorsMiddleware",
        "django.middleware.common.CommonMiddleware",
    ],
    DATABASES={
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": "qura",
            "USER": "qura",
            "PASSWORD": "qura",
            "HOST": "localhost",
            "PORT": "5434",
        }
    },
    REST_FRAMEWORK={
        "DEFAULT_AUTHENTICATION_CLASSES": [
            "rest_framework.authentication.TokenAuthentication",
        ],
        "DEFAULT_PERMISSION_CLASSES": [
            "rest_framework.permissions.IsAuthenticated",
        ],
    },
    CORS_ALLOWED_ORIGINS=[
        "http://localhost:5173",
    ],
    DEFAULT_AUTO_FIELD="django.db.models.BigAutoField",
    MEDIA_URL="/media/",
    MEDIA_ROOT=str(BASE_DIR / "media"),
)

django.setup()

from django.core.wsgi import get_wsgi_application
from django.core.management import execute_from_command_line

application = get_wsgi_application()

if __name__ == "__main__":
    execute_from_command_line(sys.argv)
