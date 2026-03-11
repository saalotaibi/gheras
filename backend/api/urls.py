from django.conf import settings
from django.conf.urls.static import static
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from api.views import signup, signin, signout, me, ChildViewSet, StoryViewSet, config, stats, create_reading_log, create_behavior_task

router = DefaultRouter()
router.register(r"children", ChildViewSet, basename="child")
router.register(r"stories", StoryViewSet, basename="story")

urlpatterns = [
    path("api/auth/signup/", signup),
    path("api/auth/signin/", signin),
    path("api/auth/signout/", signout),
    path("api/auth/me/", me),
    path("api/config/", config),
    path("api/stats/", stats),
    path("api/reading-logs/", create_reading_log),
    path("api/tasks/", create_behavior_task),
    path("api/", include(router.urls)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
