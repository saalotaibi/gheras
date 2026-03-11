import app

from api.models import Behavior, Genre, ArtStyle


BEHAVIORS = [
    {"key": "courage", "label": "الشجاعة", "icon": "Shield", "description": "تعزيز الثقة بالنفس والشجاعة"},
    {"key": "kindness", "label": "اللطف", "icon": "Heart", "description": "التعامل بلطف مع الآخرين"},
    {"key": "sharing", "label": "المشاركة", "icon": "HandHeart", "description": "تعلّم مشاركة الأشياء مع الآخرين"},
    {"key": "honesty", "label": "الصدق", "icon": "Star", "description": "أهمية قول الحقيقة دائماً"},
    {"key": "responsibility", "label": "المسؤولية", "icon": "ClipboardCheck", "description": "تحمّل المسؤولية والاعتماد على النفس"},
    {"key": "patience", "label": "الصبر", "icon": "Clock", "description": "التحلّي بالصبر وعدم الاستعجال"},
    {"key": "respect", "label": "الاحترام", "icon": "Crown", "description": "احترام الآخرين والاختلاف"},
    {"key": "gratitude", "label": "الامتنان", "icon": "Gift", "description": "تقدير النعم وشكر الآخرين"},
    {"key": "other", "label": "أخرى", "icon": "PenLine", "description": "سلوك مخصص من اختيارك"},
]

GENRES = [
    {"key": "adventure", "label": "مغامرة", "icon": "Compass", "description": "قصص مليئة بالمغامرات والاستكشاف"},
    {"key": "fantasy", "label": "خيال", "icon": "Sparkles", "description": "عوالم سحرية وشخصيات خيالية"},
    {"key": "educational", "label": "تعليمية", "icon": "GraduationCap", "description": "تعلّم مفاهيم جديدة بطريقة ممتعة"},
    {"key": "social", "label": "اجتماعية", "icon": "Users", "description": "مهارات التواصل والعلاقات"},
    {"key": "nature", "label": "طبيعة", "icon": "TreePine", "description": "استكشاف الطبيعة والحيوانات"},
    {"key": "space", "label": "فضاء", "icon": "Rocket", "description": "رحلات إلى الفضاء والكواكب"},
]

ART_STYLES = [
    {"key": "watercolor", "label": "ألوان مائية", "preview_url": "https://placehold.co/200x150/87CEEB/white?text=Watercolor", "description": "رسومات ناعمة بألوان مائية دافئة"},
    {"key": "cartoon", "label": "كرتون", "preview_url": "https://placehold.co/200x150/FF6B6B/white?text=Cartoon", "description": "رسومات كرتونية مرحة وملونة"},
    {"key": "storybook", "label": "كتاب أطفال", "preview_url": "https://placehold.co/200x150/4ECDC4/white?text=Storybook", "description": "أسلوب كتب الأطفال الكلاسيكي"},
    {"key": "anime", "label": "أنمي", "preview_url": "https://placehold.co/200x150/A78BFA/white?text=Anime", "description": "رسومات بأسلوب الأنمي الياباني"},
    {"key": "pixel", "label": "بكسل آرت", "preview_url": "https://placehold.co/200x150/F59E0B/white?text=Pixel", "description": "رسومات رقمية بأسلوب البكسل"},
    {"key": "paper", "label": "قص ولصق", "preview_url": "https://placehold.co/200x150/EC4899/white?text=Paper", "description": "أسلوب القص واللصق الورقي"},
]


def seed():
    for data in BEHAVIORS:
        Behavior.objects.get_or_create(key=data["key"], defaults=data)
    print(f"Behaviors: {Behavior.objects.count()}")

    for data in GENRES:
        Genre.objects.get_or_create(key=data["key"], defaults=data)
    print(f"Genres: {Genre.objects.count()}")

    for data in ART_STYLES:
        ArtStyle.objects.get_or_create(key=data["key"], defaults=data)
    print(f"ArtStyles: {ArtStyle.objects.count()}")

    print("Seed complete.")


if __name__ == "__main__":
    seed()
