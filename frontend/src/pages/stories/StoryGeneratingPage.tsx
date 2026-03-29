import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { api } from "../../lib/api";
import { Card } from "../../components/ui/Card";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import {
  PenLine,
  Image,
  Mic,
  BookOpen,
  Check,
  AlertCircle,
  Clock,
  RefreshCw,
  Lightbulb,
} from "lucide-react";
import { cn } from "../../lib/cn";

const generationSteps = [
  { id: "write", label: "كتابة القصة", icon: PenLine },
  { id: "cover", label: "إنشاء الغلاف", icon: BookOpen },
  { id: "images", label: "رسم الصور", icon: Image },
  { id: "audio", label: "تسجيل الصوت", icon: Mic },
];

const funFacts = [
  { emoji: "📚", text: "القراءة للأطفال 20 دقيقة يومياً تعزز مهاراتهم اللغوية بشكل كبير" },
  { emoji: "🧠", text: "القصص تساعد الأطفال على تطوير الذكاء العاطفي والتعاطف" },
  { emoji: "🌟", text: "الأطفال الذين يقرؤون بانتظام يتفوقون أكاديمياً" },
  { emoji: "💡", text: "القصص المخصصة تجعل الطفل يشعر أنه بطل حقيقي" },
  { emoji: "🎨", text: "الصور في القصص تنمي خيال الطفل وإبداعه" },
  { emoji: "❤️", text: "وقت القراءة مع طفلك يقوي الرابطة العاطفية بينكما" },
  { emoji: "🦋", text: "تعلم السلوكيات من خلال القصص أكثر فعالية من التعليم المباشر" },
  { emoji: "🌈", text: "كل قصة يتم توليدها خصيصاً لطفلك بناءً على عمره واهتماماته" },
];

const POLL_INTERVAL = 5000;
const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const EXPECTED_DURATION_MS = 2 * 60 * 1000; // ~2 minutes expected

export function StoryGeneratingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const storyId = (location.state as { storyId?: number })?.storyId;

  const [progress, setProgress] = useState(0);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [failed, setFailed] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [currentFactIndex, setCurrentFactIndex] = useState(0);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const factTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(Date.now());

  // Redirect if no storyId
  useEffect(() => {
    if (!storyId) {
      navigate("/create-story", { replace: true });
    }
  }, [storyId, navigate]);

  // Animated progress bar that fills over ~2 minutes, caps at 90%
  useEffect(() => {
    const stepMs = 1000;
    const totalSteps = EXPECTED_DURATION_MS / stepMs;
    const increment = 90 / totalSteps;

    animRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          if (animRef.current) clearInterval(animRef.current);
          return 90;
        }
        return Math.min(prev + increment, 90);
      });
    }, stepMs);

    return () => {
      if (animRef.current) clearInterval(animRef.current);
    };
  }, []);

  // Cycle through fun facts every 8 seconds
  useEffect(() => {
    factTimerRef.current = setInterval(() => {
      setCurrentFactIndex((prev) => (prev + 1) % funFacts.length);
    }, 8000);

    return () => {
      if (factTimerRef.current) clearInterval(factTimerRef.current);
    };
  }, []);

  // Timeout after 5 minutes
  useEffect(() => {
    if (!storyId) return;

    timeoutRef.current = setTimeout(() => {
      // Only trigger timeout if not already completed/failed
      setTimedOut(true);
      setErrorModalOpen(true);
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (animRef.current) clearInterval(animRef.current);
      if (factTimerRef.current) clearInterval(factTimerRef.current);
    }, TIMEOUT_MS);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [storyId]);

  // Poll status every 5 seconds
  useEffect(() => {
    if (!storyId) return;

    pollingRef.current = setInterval(async () => {
      try {
        const res = await api.get<{ id: number; status: string }>(
          `/stories/${storyId}/status/`
        );
        if (res.status === "completed") {
          clearAllTimers();
          setCompleted(true);
          setProgress(100);
          setActiveStepIndex(4);
        } else if (res.status === "failed") {
          clearAllTimers();
          setFailed(true);
          setErrorModalOpen(true);
        }
      } catch {
        // network error, keep polling
      }
    }, POLL_INTERVAL);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [storyId]);

  const clearAllTimers = useCallback(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    if (animRef.current) clearInterval(animRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (factTimerRef.current) clearInterval(factTimerRef.current);
  }, []);

  // Auto-navigate on completion
  useEffect(() => {
    if (completed && storyId) {
      const timeout = setTimeout(() => {
        navigate(`/stories/${storyId}`);
      }, 1200);
      return () => clearTimeout(timeout);
    }
  }, [completed, storyId, navigate]);

  // Update step indicator based on progress
  useEffect(() => {
    if (completed) return;
    if (progress < 25) setActiveStepIndex(0);
    else if (progress < 50) setActiveStepIndex(1);
    else if (progress < 75) setActiveStepIndex(2);
    else setActiveStepIndex(3);
  }, [progress, completed]);

  const handleRetry = () => {
    navigate("/create-story");
  };

  const currentFact = funFacts[currentFactIndex];

  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      {/* Error / Timeout Modal */}
      <Modal
        open={errorModalOpen}
        onClose={() => setErrorModalOpen(false)}
      >
        <div className="text-center py-2">
          <div className="mx-auto h-16 w-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
            {timedOut ? (
              <Clock className="h-8 w-8 text-amber-500" />
            ) : (
              <AlertCircle className="h-8 w-8 text-red-500" />
            )}
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            {timedOut ? "استغرق الأمر وقتاً طويلاً" : "حدث خطأ!"}
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            {timedOut
              ? "يبدو أن إنشاء القصة يستغرق أكثر من المتوقع. يمكنك المحاولة مرة أخرى."
              : "لم نتمكن من إنشاء القصة. يرجى المحاولة مرة أخرى."}
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button onClick={handleRetry}>
              <RefreshCw className="h-4 w-4" />
              المحاولة مرة أخرى
            </Button>
            <Button variant="secondary" onClick={() => navigate("/")}>
              الرئيسية
            </Button>
          </div>
        </div>
      </Modal>

      <Card className="w-full max-w-lg text-center">
        {/* Spinner / Check icon */}
        <div className="mb-6">
          <div className="mx-auto h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
            {completed ? (
              <Check className="h-10 w-10 text-primary animate-bounce" />
            ) : failed || timedOut ? (
              <AlertCircle className="h-10 w-10 text-red-500" />
            ) : (
              <div className="h-14 w-14 rounded-full border-4 border-primary/20 border-t-sidebar animate-spin" />
            )}
          </div>
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {completed
            ? "تم إنشاء القصة!"
            : failed
              ? "حدث خطأ"
              : timedOut
                ? "استغرق الأمر وقتاً طويلاً"
                : "جاري إنشاء القصة"}
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          {completed
            ? "سيتم نقلك إلى القصة الآن..."
            : failed || timedOut
              ? "يمكنك المحاولة مرة أخرى"
              : "يرجى الانتظار بينما نصنع قصة رائعة لطفلك"}
        </p>

        {/* Progress bar */}
        {!failed && !timedOut && (
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-500">التقدم</span>
              <span className="font-semibold text-sidebar">{Math.round(progress)}%</span>
            </div>
            <ProgressBar value={progress} color="bg-sidebar" />
          </div>
        )}

        {/* Generation steps */}
        {!failed && !timedOut && (
          <div className="space-y-3 text-start mb-6">
            {generationSteps.map((step, index) => {
              const isCompleted = index < activeStepIndex || completed;
              const isActive = index === activeStepIndex && !completed;
              return (
                <div
                  key={step.id}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-4 py-3 transition-colors",
                    isActive && "bg-primary/5",
                    isCompleted && "bg-emerald-50"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                      isCompleted && "bg-primary text-white",
                      isActive && "bg-sidebar text-white",
                      !isCompleted && !isActive && "bg-gray-200 text-gray-400"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <step.icon className="h-4 w-4" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-sm font-medium",
                      isActive && "text-sidebar",
                      isCompleted && "text-primary",
                      !isActive && !isCompleted && "text-gray-400"
                    )}
                  >
                    {step.label}
                  </span>
                  {isActive && (
                    <div className="ms-auto">
                      <div className="h-4 w-4 rounded-full border-2 border-sidebar border-t-transparent animate-spin" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Fun fact card */}
        {!completed && !failed && !timedOut && (
          <div className="rounded-xl bg-accent-gold/10 border border-accent-gold/20 p-4 text-start">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-gold/20">
                <Lightbulb className="h-4 w-4 text-amber-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-amber-700 mb-1">هل تعلم؟</p>
                <p className="text-sm text-gray-700 leading-relaxed transition-opacity duration-500">
                  <span className="me-1">{currentFact.emoji}</span>
                  {currentFact.text}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Retry button for error states (visible even without modal) */}
        {(failed || timedOut) && (
          <div className="mt-4 flex items-center justify-center gap-3">
            <Button onClick={handleRetry}>
              <RefreshCw className="h-4 w-4" />
              المحاولة مرة أخرى
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
