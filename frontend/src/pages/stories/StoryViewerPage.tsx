import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import type { Story } from "../../types/story";
import { Button } from "../../components/ui/Button";
import { Spinner } from "../../components/ui/Spinner";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Download,
  Loader2,
  Share2,
  ArrowRight,
  Sparkles,
  CheckCircle,
} from "lucide-react";
import { cn } from "../../lib/cn";

const BEHAVIOR_PROMPTS: Record<string, { question: string; emoji: string }> = {
  courage: { question: "هل ستكون شجاعاً اليوم؟", emoji: "🦁" },
  kindness: { question: "هل ستكون لطيفاً مع الآخرين؟", emoji: "💖" },
  sharing: { question: "هل ستشارك أشياءك مع أصدقائك؟", emoji: "🤝" },
  honesty: { question: "هل ستقول الحقيقة دائماً؟", emoji: "⭐" },
  responsibility: { question: "هل ستتحمل مسؤولياتك اليوم؟", emoji: "📋" },
  patience: { question: "هل ستتحلى بالصبر؟", emoji: "🕐" },
  respect: { question: "هل ستحترم الآخرين؟", emoji: "👑" },
  gratitude: { question: "هل ستشكر من حولك؟", emoji: "🎁" },
};

// Simulated read-aloud: each paragraph gets ~5 seconds
const SECONDS_PER_PARAGRAPH = 5;

export function StoryViewerPage() {
  const { storyId } = useParams();
  const navigate = useNavigate();
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const readStartRef = useRef(Date.now());

  // Read-aloud state
  const [isPlaying, setIsPlaying] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // PDF download state
  const [downloading, setDownloading] = useState(false);

  // Post-story task state
  const [taskCompleted, setTaskCompleted] = useState(false);
  const [taskResponse, setTaskResponse] = useState<string | null>(null);

  useEffect(() => {
    if (!storyId) return;
    readStartRef.current = Date.now();
    api
      .get<Story>(`/stories/${storyId}/`)
      .then(setStory)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [storyId]);

  // Log reading start
  useEffect(() => {
    if (!story) return;
    api
      .post("/reading-logs/", {
        childId: story.childId,
        storyId: story.id,
        timeSpent: 0,
        finished: false,
      })
      .catch(() => {});
  }, [story]);

  // Split current page text into paragraphs for highlighting
  const paragraphs =
    story?.pages[currentPage]?.text
      .split(/\n+/)
      .filter((p) => p.trim().length > 0) ?? [];

  // Stop playback when page changes
  useEffect(() => {
    stopPlayback();
    setHighlightIndex(-1);
  }, [currentPage]);

  const stopPlayback = useCallback(() => {
    setIsPlaying(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const togglePlayback = useCallback(() => {
    if (isPlaying) {
      stopPlayback();
      return;
    }

    setIsPlaying(true);
    let idx = highlightIndex < 0 ? 0 : highlightIndex;
    setHighlightIndex(idx);

    timerRef.current = setInterval(() => {
      idx += 1;
      if (idx >= paragraphs.length) {
        stopPlayback();
        setHighlightIndex(-1);
        return;
      }
      setHighlightIndex(idx);
    }, SECONDS_PER_PARAGRAPH * 1000);
  }, [isPlaying, highlightIndex, paragraphs.length, stopPlayback]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleDownload = async () => {
    if (!story || downloading) return;
    setDownloading(true);
    try {
      const blob = await api.download(`/stories/${story.id}/download/`);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeTitle = story.title.replace(/[^a-zA-Z0-9\u0600-\u06FF\s-]/g, "").trim() || "story";
      a.download = `story-${safeTitle}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // download failed silently
    } finally {
      setDownloading(false);
    }
  };

  const handleTaskResponse = async (response: "yes" | "try") => {
    if (!story) return;
    setTaskResponse(response);

    // Calculate time spent
    const timeSpent = Math.round((Date.now() - readStartRef.current) / 1000);

    // Send behavior task
    await api
      .post("/tasks/", {
        childId: story.childId,
        storyId: story.id,
        behavior: story.targetBehavior,
        response,
      })
      .catch(() => {});

    // Log finished reading
    await api
      .post("/reading-logs/", {
        childId: story.childId,
        storyId: story.id,
        timeSpent,
        finished: true,
      })
      .catch(() => {});

    setTaskCompleted(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!story) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          القصة غير موجودة
        </h2>
        <p className="text-gray-500 mb-4">لم نتمكن من العثور على هذه القصة</p>
        <Button onClick={() => navigate("/library")}>العودة للمكتبة</Button>
      </div>
    );
  }

  const totalPages = story.pages.length;
  const isLastPage = currentPage === totalPages - 1;
  const showTaskCard = isLastPage && !taskCompleted;
  const behaviorPrompt =
    BEHAVIOR_PROMPTS[story.targetBehavior] || BEHAVIOR_PROMPTS.courage;

  const page = story.pages[currentPage];

  const goNext = () => setCurrentPage((p) => Math.min(p + 1, totalPages - 1));
  const goPrev = () => setCurrentPage((p) => Math.max(p - 1, 0));

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <ArrowRight className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">{story.title}</h1>
            <p className="text-sm text-gray-500">
              قصة {story.childName} · {totalPages} صفحات
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 ps-11 sm:ps-0">
          <Button
            variant={isPlaying ? "primary" : "secondary"}
            size="sm"
            onClick={togglePlayback}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">{isPlaying ? "إيقاف" : "استماع"}</span>
          </Button>
          <Button variant="secondary" size="sm" onClick={handleDownload} disabled={downloading}>
            {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            <span className="hidden sm:inline">{downloading ? "جاري التحميل..." : "تحميل"}</span>
          </Button>
          <Button variant="secondary" size="sm">
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">مشاركة</span>
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 md:min-h-[500px]">
          <div className="bg-gray-50 aspect-square md:aspect-auto">
            <img
              src={page.illustrationUrl}
              alt={`صفحة ${page.pageNumber}`}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex flex-col justify-center p-5 sm:p-8 md:p-12">
            <div className="space-y-3">
              {paragraphs.map((para, idx) => (
                <p
                  key={idx}
                  className={cn(
                    "text-lg leading-relaxed transition-all duration-300",
                    highlightIndex === idx
                      ? "text-primary bg-primary/10 rounded-lg px-3 py-2 font-medium"
                      : highlightIndex >= 0 && highlightIndex !== idx
                        ? "text-gray-400"
                        : "text-gray-800"
                  )}
                >
                  {para}
                </p>
              ))}
            </div>
            <p className="mt-6 text-sm text-gray-400">
              صفحة {currentPage + 1} من {totalPages}
            </p>
          </div>
        </div>
      </div>

      {/* Post-story behavior task card */}
      {showTaskCard && (
        <div className="mt-6 bg-gradient-to-br from-primary/5 to-accent-gold/10 rounded-2xl border-2 border-primary/20 p-8 text-center">
          <div className="text-5xl mb-4">{behaviorPrompt.emoji}</div>
          <Sparkles className="h-6 w-6 text-accent-gold mx-auto mb-2" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            أحسنت! أنهيت القصة
          </h3>
          <p className="text-lg text-gray-700 mb-6">{behaviorPrompt.question}</p>
          <div className="flex items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={() => handleTaskResponse("yes")}
              disabled={taskResponse !== null}
            >
              <CheckCircle className="h-5 w-5" />
              نعم!
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => handleTaskResponse("try")}
              disabled={taskResponse !== null}
            >
              سأحاول
            </Button>
          </div>
        </div>
      )}

      {/* Completion message */}
      {taskCompleted && isLastPage && (
        <div className="mt-6 bg-green-50 rounded-2xl border border-green-200 p-6 text-center">
          <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-2" />
          <h3 className="text-lg font-bold text-green-800">ممتاز! 🎉</h3>
          <p className="text-green-700 mt-1">تم تسجيل قراءتك بنجاح</p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-4"
            onClick={() => navigate("/library")}
          >
            العودة للمكتبة
          </Button>
        </div>
      )}

      <div className="flex items-center justify-center gap-4 mt-6">
        <button
          onClick={goNext}
          disabled={currentPage === totalPages - 1}
          className="rounded-full p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <ChevronRight className="h-6 w-6" />
        </button>

        <div className="flex items-center gap-2">
          {story.pages.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentPage(idx)}
              className={cn(
                "h-2.5 rounded-full transition-all cursor-pointer",
                idx === currentPage
                  ? "w-8 bg-sidebar"
                  : "w-2.5 bg-gray-300 hover:bg-gray-400"
              )}
            />
          ))}
        </div>

        <button
          onClick={goPrev}
          disabled={currentPage === 0}
          className="rounded-full p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}
