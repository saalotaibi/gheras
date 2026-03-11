from django.contrib.auth.models import User
from rest_framework import serializers
from api.models import Child, Story, StoryPage, ReadingLog, BehaviorTask, Behavior, Genre, ArtStyle


class UserSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="first_name")

    class Meta:
        model = User
        fields = ["id", "name", "email"]


class ChildSerializer(serializers.ModelSerializer):
    storiesCount = serializers.IntegerField(source="stories.count", read_only=True)
    avatarUrl = serializers.URLField(source="avatar_url", required=False, allow_blank=True)
    appearanceDescription = serializers.CharField(
        source="appearance_description", required=False, allow_blank=True
    )

    class Meta:
        model = Child
        fields = ["id", "name", "gender", "age", "avatarUrl", "appearanceDescription", "photo", "storiesCount"]

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)


class StoryPageSerializer(serializers.ModelSerializer):
    pageNumber = serializers.IntegerField(source="page_number")
    illustrationUrl = serializers.URLField(source="illustration_url", required=False, allow_blank=True)

    class Meta:
        model = StoryPage
        fields = ["pageNumber", "text", "illustrationUrl"]


class StorySerializer(serializers.ModelSerializer):
    pages = StoryPageSerializer(many=True, read_only=True)
    childId = serializers.PrimaryKeyRelatedField(source="child", queryset=Child.objects.all())
    childName = serializers.CharField(source="child.name", read_only=True)
    coverUrl = serializers.URLField(source="cover_url", required=False, allow_blank=True)
    storyType = serializers.CharField(source="story_type")
    artStyle = serializers.CharField(source="art_style")
    targetBehavior = serializers.CharField(source="target_behavior")
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = Story
        fields = [
            "id", "title", "childId", "childName", "coverUrl",
            "storyType", "artStyle", "targetBehavior", "status", "pages", "createdAt",
        ]

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)


class StoryCreateSerializer(serializers.Serializer):
    childId = serializers.IntegerField()
    storyType = serializers.CharField(max_length=50)
    artStyle = serializers.CharField(max_length=50)
    targetBehavior = serializers.CharField(max_length=50)
    customBehavior = serializers.CharField(max_length=100, required=False, allow_blank=True, default="")


class ReadingLogCreateSerializer(serializers.Serializer):
    childId = serializers.IntegerField()
    storyId = serializers.IntegerField()
    timeSpent = serializers.IntegerField(required=False, default=0)
    finished = serializers.BooleanField(required=False, default=False)


class ReadingLogSerializer(serializers.ModelSerializer):
    childId = serializers.PrimaryKeyRelatedField(source="child", read_only=True)
    storyId = serializers.PrimaryKeyRelatedField(source="story", read_only=True)
    storyTitle = serializers.CharField(source="story.title", read_only=True)
    timeSpent = serializers.IntegerField(source="time_spent")
    startedAt = serializers.DateTimeField(source="started_at", read_only=True)
    finishedAt = serializers.DateTimeField(source="finished_at", read_only=True)

    class Meta:
        model = ReadingLog
        fields = ["id", "childId", "storyId", "storyTitle", "timeSpent", "startedAt", "finishedAt"]


class BehaviorTaskCreateSerializer(serializers.Serializer):
    childId = serializers.IntegerField()
    storyId = serializers.IntegerField()
    behavior = serializers.CharField(max_length=50)
    response = serializers.ChoiceField(choices=["yes", "try"])


class BehaviorTaskSerializer(serializers.ModelSerializer):
    childId = serializers.PrimaryKeyRelatedField(source="child", read_only=True)
    storyId = serializers.PrimaryKeyRelatedField(source="story", read_only=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = BehaviorTask
        fields = ["id", "childId", "storyId", "behavior", "response", "createdAt"]


class BehaviorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Behavior
        fields = ["id", "key", "label", "icon", "description"]


class GenreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Genre
        fields = ["id", "key", "label", "icon", "description"]


class ArtStyleSerializer(serializers.ModelSerializer):
    previewUrl = serializers.URLField(source="preview_url", required=False, allow_blank=True)

    class Meta:
        model = ArtStyle
        fields = ["id", "key", "label", "previewUrl", "description"]
