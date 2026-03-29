import io
import threading

from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.db import close_old_connections
from django.http import FileResponse
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.authtoken.models import Token

from api.models import Child, Story, StoryPage, ReadingLog, BehaviorTask, Behavior, Genre, ArtStyle
from api.serializers import (
    UserSerializer,
    ChildSerializer,
    StorySerializer,
    StoryCreateSerializer,
    ReadingLogCreateSerializer,
    ReadingLogSerializer,
    BehaviorTaskCreateSerializer,
    BehaviorTaskSerializer,
    BehaviorSerializer,
    GenreSerializer,
    ArtStyleSerializer,
)
from api.ai_adapters import build_prompt_payload, generate_story, generate_cover, generate_illustrations


@api_view(["POST"])
@permission_classes([AllowAny])
def signup(request):
    name = request.data.get("name", "")
    email = request.data.get("email")
    password = request.data.get("password")
    if not email or not password:
        return Response(
            {"error": "Email and password required"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if User.objects.filter(email=email).exists():
        return Response(
            {"error": "Email already exists"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    user = User.objects.create_user(
        username=email, email=email, password=password, first_name=name
    )
    token, _ = Token.objects.get_or_create(user=user)
    return Response(
        {"token": token.key, "user": UserSerializer(user).data},
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def signin(request):
    email = request.data.get("email")
    password = request.data.get("password")
    user = authenticate(username=email, password=password)
    if not user:
        return Response(
            {"error": "Invalid credentials"},
            status=status.HTTP_401_UNAUTHORIZED,
        )
    token, _ = Token.objects.get_or_create(user=user)
    return Response({"token": token.key, "user": UserSerializer(user).data})


@api_view(["POST"])
def signout(request):
    request.user.auth_token.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET"])
def me(request):
    return Response(UserSerializer(request.user).data)


class ChildViewSet(viewsets.ModelViewSet):
    serializer_class = ChildSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        return Child.objects.filter(user=self.request.user)


def _send_story_ready_email(story):
    """Send an email to the parent when the story is done."""
    try:
        user = story.user
        child_name = story.child.name
        send_mail(
            subject=f"{child_name}'s story is ready to read!",
            message=(
                f"Hi {user.first_name or user.username},\n\n"
                f'The story "{story.title}" for {child_name} is now ready. '
                f"Open the app to start reading!\n\n"
                f"— Gheras"
            ),
            from_email=None,
            recipient_list=[user.email],
            fail_silently=True,
        )
    except Exception:
        pass


def _run_generation(story_id, prompt_payload):
    close_old_connections()
    try:
        story = Story.objects.get(id=story_id)

        result = generate_story(prompt_payload)
        story.title = result["title"]
        story.save(update_fields=["title"])

        cover_url = generate_cover(prompt_payload)
        story.cover_url = cover_url
        story.save(update_fields=["cover_url"])

        illustrations = generate_illustrations(prompt_payload, len(result["pages"]))

        for i, text in enumerate(result["pages"]):
            StoryPage.objects.create(
                story=story,
                page_number=i + 1,
                text=text,
                illustration_url=illustrations[i] if i < len(illustrations) else "",
            )

        story.status = "completed"
        story.save(update_fields=["status"])

        _send_story_ready_email(story)

    except Exception:
        try:
            story = Story.objects.get(id=story_id)
            story.status = "failed"
            story.save(update_fields=["status"])
        except Story.DoesNotExist:
            pass


def _build_story_pdf(story):
    """Generate a styled PDF for a story using ReportLab."""
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import cm
    from reportlab.lib.colors import HexColor
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.lib.enums import TA_CENTER, TA_RIGHT

    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=2.5 * cm,
        rightMargin=2.5 * cm,
        topMargin=3 * cm,
        bottomMargin=2.5 * cm,
    )

    title_style = ParagraphStyle(
        "title",
        fontSize=28,
        leading=36,
        alignment=TA_CENTER,
        spaceAfter=20,
        textColor=HexColor("#30949E"),
    )
    child_style = ParagraphStyle(
        "child",
        fontSize=18,
        leading=24,
        alignment=TA_CENTER,
        spaceAfter=10,
        textColor=HexColor("#555555"),
    )
    page_num_style = ParagraphStyle(
        "pagenum",
        fontSize=14,
        leading=18,
        alignment=TA_CENTER,
        spaceAfter=16,
        textColor=HexColor("#30949E"),
    )
    body_style = ParagraphStyle(
        "body",
        fontSize=14,
        leading=22,
        alignment=TA_RIGHT,
        spaceAfter=12,
        textColor=HexColor("#333333"),
    )
    illust_style = ParagraphStyle(
        "illust",
        fontSize=10,
        leading=14,
        alignment=TA_CENTER,
        spaceAfter=10,
        textColor=HexColor("#999999"),
    )

    elements = []

    elements.append(Spacer(1, 6 * cm))
    elements.append(Paragraph(story.title or "Untitled Story", title_style))
    elements.append(Spacer(1, 1 * cm))
    elements.append(Paragraph(f"A story for {story.child.name}", child_style))
    elements.append(Spacer(1, 0.5 * cm))
    elements.append(Paragraph(f"Age {story.child.age}", child_style))
    elements.append(PageBreak())

    pages = story.pages.all().order_by("page_number")
    for page in pages:
        elements.append(Paragraph(f"— Page {page.page_number} —", page_num_style))
        elements.append(Spacer(1, 0.5 * cm))
        elements.append(Paragraph(page.text, body_style))
        elements.append(Spacer(1, 0.5 * cm))
        if page.illustration_url:
            elements.append(
                Paragraph(f"[Illustration: {page.illustration_url}]", illust_style)
            )
        elements.append(Spacer(1, 1 * cm))
        if page != pages.last():
            elements.append(PageBreak())

    doc.build(elements)
    buf.seek(0)
    return buf


class StoryViewSet(viewsets.ModelViewSet):
    serializer_class = StorySerializer
    http_method_names = ["get", "post", "head", "options"]

    def get_queryset(self):
        qs = Story.objects.filter(user=self.request.user)
        if self.action == "list":
            qs = qs.filter(status="completed")
        return qs

    def create(self, request, *args, **kwargs):
        serializer = StoryCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            child = Child.objects.get(id=data["childId"], user=request.user)
        except Child.DoesNotExist:
            return Response(
                {"error": "Child not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            genre = Genre.objects.get(key=data["storyType"])
            art_style = ArtStyle.objects.get(key=data["artStyle"])
        except (Genre.DoesNotExist, ArtStyle.DoesNotExist):
            return Response(
                {"error": "Invalid genre or art style key"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if data["targetBehavior"] == "other":
            custom_label = data.get("customBehavior", "").strip() or "أخرى"

            class _CustomBehavior:
                key = "other"
                label = custom_label
                description = ""

            behavior = _CustomBehavior()
        else:
            try:
                behavior = Behavior.objects.get(key=data["targetBehavior"])
            except Behavior.DoesNotExist:
                return Response(
                    {"error": "Invalid behavior key"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        story = Story.objects.create(
            user=request.user,
            child=child,
            story_type=data["storyType"],
            art_style=data["artStyle"],
            target_behavior=data["targetBehavior"],
            status="processing",
        )

        prompt_payload = build_prompt_payload(child, behavior, genre, art_style)
        thread = threading.Thread(
            target=_run_generation,
            args=(story.id, prompt_payload),
            daemon=True,
        )
        thread.start()

        return Response(
            {"id": story.id, "status": story.status},
            status=status.HTTP_202_ACCEPTED,
        )

    @action(detail=True, methods=["get"], url_path="status")
    def get_status(self, request, pk=None):
        story = self.get_object()
        return Response({
            "id": story.id,
            "status": story.status,
        })

    @action(detail=True, methods=["get"], url_path="download")
    def download(self, request, pk=None):
        story = self.get_object()
        if story.status != "completed":
            return Response(
                {"error": "Story is not ready yet"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        pdf_buffer = _build_story_pdf(story)
        filename = f"{story.title or 'story'}.pdf"
        return FileResponse(
            pdf_buffer,
            as_attachment=True,
            filename=filename,
            content_type="application/pdf",
        )


@api_view(["POST"])
def create_reading_log(request):
    serializer = ReadingLogCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    try:
        child = Child.objects.get(id=data["childId"], user=request.user)
        story = Story.objects.get(id=data["storyId"], user=request.user)
    except (Child.DoesNotExist, Story.DoesNotExist):
        return Response({"error": "Child or story not found"}, status=status.HTTP_404_NOT_FOUND)

    from django.utils import timezone
    log = ReadingLog.objects.create(
        user=request.user,
        child=child,
        story=story,
        time_spent=data.get("timeSpent", 0),
        finished_at=timezone.now() if data.get("finished") else None,
    )
    return Response(ReadingLogSerializer(log).data, status=status.HTTP_201_CREATED)


@api_view(["POST"])
def create_behavior_task(request):
    serializer = BehaviorTaskCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    try:
        child = Child.objects.get(id=data["childId"], user=request.user)
        story = Story.objects.get(id=data["storyId"], user=request.user)
    except (Child.DoesNotExist, Story.DoesNotExist):
        return Response({"error": "Child or story not found"}, status=status.HTTP_404_NOT_FOUND)

    task = BehaviorTask.objects.create(
        user=request.user,
        child=child,
        story=story,
        behavior=data["behavior"],
        response=data["response"],
    )
    return Response(BehaviorTaskSerializer(task).data, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([AllowAny])
def config(request):
    return Response({
        "behaviors": BehaviorSerializer(Behavior.objects.all(), many=True).data,
        "genres": GenreSerializer(Genre.objects.all(), many=True).data,
        "styles": ArtStyleSerializer(ArtStyle.objects.all(), many=True).data,
    })


@api_view(["GET"])
def stats(request):
    user = request.user
    total_stories = Story.objects.filter(user=user, status="completed").count()
    children_count = Child.objects.filter(user=user).count()
    stories_read = ReadingLog.objects.filter(user=user, finished_at__isnull=False).values("story").distinct().count()
    tasks_completed = BehaviorTask.objects.filter(user=user).count()

    from django.utils import timezone
    from datetime import timedelta
    today = timezone.now().date()
    streak = 0
    check_date = today
    while True:
        has_log = ReadingLog.objects.filter(
            user=user,
            finished_at__date=check_date,
        ).exists()
        if has_log:
            streak += 1
            check_date -= timedelta(days=1)
        else:
            break

    behavior_counts = {}
    for bt in BehaviorTask.objects.filter(user=user):
        behavior_counts[bt.behavior] = behavior_counts.get(bt.behavior, 0) + 1

    read_story_ids = ReadingLog.objects.filter(
        user=user, finished_at__isnull=False
    ).values_list("story_id", flat=True).distinct()
    for story in Story.objects.filter(id__in=read_story_ids):
        behavior_counts[story.target_behavior] = behavior_counts.get(story.target_behavior, 0) + 1

    behavior_labels = {b.key: b.label for b in Behavior.objects.all()}
    radar_data = []
    for key, count in behavior_counts.items():
        radar_data.append({
            "behavior": behavior_labels.get(key, key),
            "key": key,
            "count": count,
        })

    day_names_map = {
        0: "الاثنين", 1: "الثلاثاء", 2: "الأربعاء",
        3: "الخميس", 4: "الجمعة", 5: "السبت", 6: "الأحد",
    }
    weekly_data = []
    for i in range(6, -1, -1):
        d = today - timedelta(days=i)
        count = ReadingLog.objects.filter(
            user=user,
            finished_at__date=d,
        ).count()
        weekly_data.append({
            "day": day_names_map[d.weekday()],
            "stories": count,
        })

    return Response({
        "totalStories": total_stories,
        "childrenCount": children_count,
        "storiesRead": stories_read,
        "tasksCompleted": tasks_completed,
        "streak": streak,
        "radarData": radar_data,
        "weeklyData": weekly_data,
    })
