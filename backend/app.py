import os
import sys
from pathlib import Path

import django
from django.conf import settings

BASE_DIR = Path(__file__).resolve().parent

DEBUG = os.environ.get("DEBUG", "True").lower() in ("true", "1", "yes")
SECRET_KEY = os.environ.get("SECRET_KEY", "django-insecure-dev-key-change-in-production")

ALLOWED_HOSTS = os.environ.get("ALLOWED_HOSTS", "*").split(",")

_cors_origins_env = os.environ.get("CORS_ALLOWED_ORIGINS", "")
if _cors_origins_env:
    CORS_ALLOWED_ORIGINS = [o.strip() for o in _cors_origins_env.split(",") if o.strip()]
else:
    CORS_ALLOWED_ORIGINS = ["http://localhost:5173"]

settings.configure(
    DEBUG=DEBUG,
    SECRET_KEY=SECRET_KEY,
    ALLOWED_HOSTS=ALLOWED_HOSTS,
    ROOT_URLCONF="api.urls",
    WSGI_APPLICATION=f"{__name__}.application",
    INSTALLED_APPS=[
        "django.contrib.admin",
        "django.contrib.auth",
        "django.contrib.contenttypes",
        "django.contrib.sessions",
        "django.contrib.messages",
        "django.contrib.staticfiles",
        "rest_framework",
        "rest_framework.authtoken",
        "corsheaders",
        "api",
    ],
    MIDDLEWARE=[
        "corsheaders.middleware.CorsMiddleware",
        "django.middleware.security.SecurityMiddleware",
        "whitenoise.middleware.WhiteNoiseMiddleware",
        "django.contrib.sessions.middleware.SessionMiddleware",
        "django.middleware.common.CommonMiddleware",
        "django.contrib.auth.middleware.AuthenticationMiddleware",
        "django.contrib.messages.middleware.MessageMiddleware",
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
    CORS_ALLOWED_ORIGINS=CORS_ALLOWED_ORIGINS,
    DEFAULT_AUTO_FIELD="django.db.models.BigAutoField",
    MEDIA_URL="/media/",
    MEDIA_ROOT=str(BASE_DIR / "media"),
    STATIC_URL="/static/",
    STATIC_ROOT=str(BASE_DIR / "staticfiles"),
    STORAGES={
        "staticfiles": {
            "BACKEND": "whitenoise.storage.CompressedStaticFilesStorage"
            if not DEBUG
            else "django.contrib.staticfiles.storage.StaticFilesStorage",
        },
    },
    TEMPLATES=[
        {
            "BACKEND": "django.template.backends.django.DjangoTemplates",
            "DIRS": [],
            "APP_DIRS": True,
            "OPTIONS": {
                "context_processors": [
                    "django.template.context_processors.debug",
                    "django.template.context_processors.request",
                    "django.contrib.auth.context_processors.auth",
                    "django.contrib.messages.context_processors.messages",
                ],
            },
        },
    ],
    EMAIL_BACKEND=os.environ.get(
        "EMAIL_BACKEND", "django.core.mail.backends.console.EmailBackend"
    ),
    EMAIL_HOST=os.environ.get("EMAIL_HOST", "smtp.gmail.com"),
    EMAIL_PORT=int(os.environ.get("EMAIL_PORT", "587")),
    EMAIL_USE_TLS=os.environ.get("EMAIL_USE_TLS", "True").lower() in ("true", "1"),
    EMAIL_HOST_USER=os.environ.get("EMAIL_HOST_USER", ""),
    EMAIL_HOST_PASSWORD=os.environ.get("EMAIL_HOST_PASSWORD", ""),
    DEFAULT_FROM_EMAIL=os.environ.get("DEFAULT_FROM_EMAIL", "noreply@gheras.app"),
    SECURE_BROWSER_XSS_FILTER=not DEBUG,
    SECURE_CONTENT_TYPE_NOSNIFF=not DEBUG,
    SESSION_COOKIE_SECURE=not DEBUG,
    CSRF_COOKIE_SECURE=not DEBUG,
    X_FRAME_OPTIONS="DENY",
)

django.setup()

from django.core.wsgi import get_wsgi_application
from django.core.management import execute_from_command_line

application = get_wsgi_application()

if __name__ == "__main__":
    execute_from_command_line(sys.argv)
