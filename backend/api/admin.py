from django.contrib import admin
from api.models import Behavior, Genre, ArtStyle, Child, Story, StoryPage, ReadingLog, BehaviorTask


@admin.register(Behavior)
class BehaviorAdmin(admin.ModelAdmin):
    list_display = ["key", "label", "icon"]
    search_fields = ["key", "label", "description"]


@admin.register(Genre)
class GenreAdmin(admin.ModelAdmin):
    list_display = ["key", "label", "icon"]
    search_fields = ["key", "label", "description"]


@admin.register(ArtStyle)
class ArtStyleAdmin(admin.ModelAdmin):
    list_display = ["key", "label", "preview_url"]
    search_fields = ["key", "label", "description"]


@admin.register(Child)
class ChildAdmin(admin.ModelAdmin):
    list_display = ["name", "user", "gender", "age"]
    list_filter = ["gender"]
    search_fields = ["name", "user__email"]


@admin.register(Story)
class StoryAdmin(admin.ModelAdmin):
    list_display = ["title", "user", "child", "story_type", "art_style", "status", "created_at"]
    list_filter = ["status", "story_type", "art_style"]
    search_fields = ["title", "user__email", "child__name"]
    readonly_fields = ["created_at"]


@admin.register(StoryPage)
class StoryPageAdmin(admin.ModelAdmin):
    list_display = ["story", "page_number"]
    list_filter = ["story"]
    search_fields = ["story__title", "text"]


@admin.register(ReadingLog)
class ReadingLogAdmin(admin.ModelAdmin):
    list_display = ["user", "child", "story", "time_spent", "started_at", "finished_at"]
    list_filter = ["finished_at"]
    search_fields = ["user__email", "child__name", "story__title"]
    readonly_fields = ["started_at"]


@admin.register(BehaviorTask)
class BehaviorTaskAdmin(admin.ModelAdmin):
    list_display = ["user", "child", "story", "behavior", "response", "created_at"]
    list_filter = ["behavior", "response"]
    search_fields = ["user__email", "child__name", "behavior"]
    readonly_fields = ["created_at"]
