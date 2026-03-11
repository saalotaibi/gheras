from django.db import models
from django.conf import settings


class Child(models.Model):
    GENDER_CHOICES = [("boy", "Boy"), ("girl", "Girl")]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="children")
    name = models.CharField(max_length=100)
    gender = models.CharField(max_length=4, choices=GENDER_CHOICES)
    age = models.IntegerField()
    avatar_url = models.URLField(blank=True, default="")
    appearance_description = models.TextField(blank=True, default="")
    photo = models.ImageField(upload_to="children/", blank=True, null=True)

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return self.name


class Story(models.Model):
    STATUS_CHOICES = [
        ("processing", "Processing"),
        ("completed", "Completed"),
        ("failed", "Failed"),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="stories")
    child = models.ForeignKey(Child, on_delete=models.CASCADE, related_name="stories")
    title = models.CharField(max_length=255, blank=True, default="")
    cover_url = models.URLField(blank=True, default="")
    story_type = models.CharField(max_length=50)
    art_style = models.CharField(max_length=50)
    target_behavior = models.CharField(max_length=50)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="processing")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class StoryPage(models.Model):
    story = models.ForeignKey(Story, on_delete=models.CASCADE, related_name="pages")
    page_number = models.IntegerField()
    text = models.TextField()
    illustration_url = models.URLField(blank=True, default="")

    class Meta:
        ordering = ["page_number"]

    def __str__(self):
        return f"{self.story.title} - Page {self.page_number}"


class ReadingLog(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reading_logs")
    child = models.ForeignKey("Child", on_delete=models.CASCADE, related_name="reading_logs")
    story = models.ForeignKey(Story, on_delete=models.CASCADE, related_name="reading_logs")
    started_at = models.DateTimeField(auto_now_add=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    time_spent = models.IntegerField(default=0, help_text="Time spent reading in seconds")

    class Meta:
        ordering = ["-started_at"]

    def __str__(self):
        return f"{self.child.name} read {self.story.title}"


class BehaviorTask(models.Model):
    RESPONSE_CHOICES = [
        ("yes", "Yes"),
        ("try", "I'll try"),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="behavior_tasks")
    child = models.ForeignKey("Child", on_delete=models.CASCADE, related_name="behavior_tasks")
    story = models.ForeignKey(Story, on_delete=models.CASCADE, related_name="behavior_tasks")
    behavior = models.CharField(max_length=50)
    response = models.CharField(max_length=10, choices=RESPONSE_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.child.name} - {self.behavior} ({self.response})"


class Behavior(models.Model):
    key = models.CharField(max_length=50, unique=True)
    label = models.CharField(max_length=100)
    icon = models.CharField(max_length=50, blank=True, default="")
    description = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return self.label


class Genre(models.Model):
    key = models.CharField(max_length=50, unique=True)
    label = models.CharField(max_length=100)
    icon = models.CharField(max_length=50, blank=True, default="")
    description = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return self.label


class ArtStyle(models.Model):
    key = models.CharField(max_length=50, unique=True)
    label = models.CharField(max_length=100)
    preview_url = models.URLField(blank=True, default="")
    description = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return self.label
