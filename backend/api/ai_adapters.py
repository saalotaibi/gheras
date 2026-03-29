import time
import random

PLACEHOLDER_ILLUSTRATIONS = [
    "https://placehold.co/800x600/FFE4B5/8B4513?text=صفحة+1",
    "https://placehold.co/800x600/E0F0FF/4169E1?text=صفحة+2",
    "https://placehold.co/800x600/F0FFF0/228B22?text=صفحة+3",
    "https://placehold.co/800x600/FFF0F5/DB7093?text=صفحة+4",
    "https://placehold.co/800x600/F5F5DC/8B8682?text=صفحة+5",
]

PLACEHOLDER_COVER = "https://placehold.co/800x600/30949E/FFFFFF?text=غلاف+القصة"

STORY_TEMPLATES = {
    "courage": {
        "title": "مغامرة {child_name} الشجاعة",
        "pages": [
            "في يوم من الأيام، كان {child_name} يلعب في الحديقة الكبيرة بالقرب من المنزل. كانت الشمس مشرقة والطيور تغرد بأجمل الألحان.",
            "فجأة، سمع {child_name} صوتاً غريباً قادماً من خلف الأشجار الكبيرة. كان قلبه ينبض بسرعة، لكنه قرر أن يكون شجاعاً ويذهب ليرى ما يحدث.",
            "وجد {child_name} قطة صغيرة عالقة في أعلى الشجرة وهي تبكي. نظر حوله ولم يجد أحداً يساعده، فقرر أن يتسلق الشجرة بنفسه.",
            "بحذر شديد، تسلق {child_name} الشجرة خطوة بخطوة حتى وصل إلى القطة الصغيرة. حملها بلطف ونزل بها إلى الأرض بسلام.",
            "فرحت القطة كثيراً وبدأت تلعب حول {child_name}. شعر بسعادة كبيرة لأنه كان شجاعاً وساعد من يحتاج المساعدة. تعلّم في ذلك اليوم أن الشجاعة هي أن تفعل الشيء الصحيح حتى لو كنت خائفاً.",
        ],
    },
    "default": {
        "title": "قصة {child_name} المميزة",
        "pages": [
            "كان يا ما كان في قديم الزمان، كان هناك طفل اسمه {child_name} يعيش في قرية جميلة محاطة بالجبال والأشجار الخضراء.",
            "في أحد الأيام، قرر {child_name} أن يذهب في مغامرة لاستكشاف الغابة القريبة. حمل حقيبته الصغيرة وانطلق بحماس كبير.",
            "في الغابة، التقى {child_name} بأرنب صغير ضائع يبحث عن طريق العودة إلى بيته. قال له: 'لا تقلق، سأساعدك!'",
            "مشى {child_name} مع الأرنب عبر الغابة، يتبعان صوت النهر الصغير. وأخيراً وجدوا جحر الأرنب بجانب شجرة البلوط الكبيرة.",
            "شكر الأرنب {child_name} كثيراً وأعطاه جزرة برتقالية لامعة. عاد {child_name} إلى البيت سعيداً، وقد تعلّم أن مساعدة الآخرين تجعلنا نشعر بالسعادة.",
        ],
    },
}


def build_prompt_payload(child, behavior, genre, art_style):
    return {
        "child": {
            "name": child.name,
            "age": child.age,
            "gender": child.gender,
            "appearance_description": child.appearance_description,
            "photo_url": child.photo.url if child.photo else None,
        },
        "behavior": {
            "key": behavior.key,
            "label": behavior.label,
            "description": behavior.description,
        },
        "genre": {
            "key": genre.key,
            "label": genre.label,
        },
        "art_style": {
            "key": art_style.key,
            "label": art_style.label,
        },
    }


def generate_story(prompt_payload):
    child_name = prompt_payload["child"]["name"]
    behavior_key = prompt_payload["behavior"]["key"]

    template = STORY_TEMPLATES.get(behavior_key, STORY_TEMPLATES["default"])

    # Simulate a real AI generation process (2 minutes total across all steps)
    time.sleep(120)

    return {
        "title": template["title"].format(child_name=child_name),
        "pages": [text.format(child_name=child_name) for text in template["pages"]],
    }


def generate_cover(prompt_payload):
    time.sleep(0)
    return PLACEHOLDER_COVER


def generate_illustrations(prompt_payload, num_pages):
    time.sleep(0)
    return [
        PLACEHOLDER_ILLUSTRATIONS[i % len(PLACEHOLDER_ILLUSTRATIONS)]
        for i in range(num_pages)
    ]
