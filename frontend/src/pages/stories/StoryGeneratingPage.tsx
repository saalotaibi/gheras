import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { api } from "../../lib/api";
import { Card } from "../../components/ui/Card";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { PenLine, Image, Mic, BookOpen, Check, AlertCircle } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { cn } from "../../lib/cn";

const generationSteps = [
  { id: "write", label: "كتابة القصة", icon: PenLine },
  { id: "cover", label: "إنشاء الغلاف", icon: BookOpen },
  { id: "images", label: "رسم الصور", icon: Image },
  { id: "audio", label: "تسجيل الصوت", icon: Mic },
];

export function StoryGeneratingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const storyId = (location.state as { storyId?: number })?.storyId;

  const [progress, setProgress] = useState(0);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [failed, setFailed] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval>>(null);
  const animRef = useRef<ReturnType<typeof setInterval>>(null);

  useEffect(() => {
    if (!storyId) {
      navigate("/create-story", { replace: true });
    }
  }, [storyId, navigate]);

  useEffect(() => {
    animRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(animRef.current!);
          return 90;
        }
        return prev + 1;
      });
    }, 70);
    return () => {
      if (animRef.current) clearInterval(animRef.current);
    };
  }, []);

  useEffect(() => {
    if (!storyId) return;

    pollingRef.current = setInterval(async () => {
      try {
        const res = await api.get<{ id: number; status: string }>(
          `/stories/${storyId}/status/`
        );
        if (res.status === "completed") {
          clearInterval(pollingRef.current!);
          setCompleted(true);
          setProgress(100);
          setActiveStepIndex(4);
        } else if (res.status === "failed") {
          clearInterval(pollingRef.current!);
          if (animRef.current) clearInterval(animRef.current);
          setFailed(true);
        }
      } catch {
      }
    }, 3000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [storyId]);

  useEffect(() => {
    if (completed && storyId) {
      const timeout = setTimeout(() => {
        navigate(`/stories/${storyId}`);
      }, 800);
      return () => clearTimeout(timeout);
    }
  }, [completed, storyId, navigate]);

  useEffect(() => {
    if (completed) return;
    if (progress < 25) setActiveStepIndex(0);
    else if (progress < 50) setActiveStepIndex(1);
    else if (progress < 75) setActiveStepIndex(2);
    else setActiveStepIndex(3);
  }, [progress, completed]);

  if (failed) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Card className="w-full max-w-lg text-center">
          <div className="mb-6">
            <div className="mx-auto h-20 w-20 rounded-full bg-red-50 flex items-center justify-center">
              <AlertCircle className="h-10 w-10 text-red-500" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">حدث خطأ</h2>
          <p className="text-sm text-gray-500 mb-6">
            لم نتمكن من إنشاء القصة. يرجى المحاولة مرة أخرى.
          </p>
          <Button onClick={() => navigate("/create-story")}>المحاولة مرة أخرى</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <Card className="w-full max-w-lg text-center">
        <div className="mb-6">
          <div className="mx-auto h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
            {completed ? (
              <Check className="h-10 w-10 text-primary" />
            ) : (
              <div className="h-14 w-14 rounded-full border-4 border-primary/20 border-t-sidebar animate-spin" />
            )}
          </div>
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {completed ? "تم إنشاء القصة!" : "جاري إنشاء القصة"}
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          {completed
            ? "سيتم نقلك إلى القصة الآن..."
            : "يرجى الانتظار بينما نصنع قصة رائعة لطفلك"}
        </p>

        <div className="mb-8">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-500">التقدم</span>
            <span className="font-semibold text-sidebar">{progress}%</span>
          </div>
          <ProgressBar value={progress} color="bg-sidebar" />
        </div>

        <div className="space-y-3 text-start">
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
                    "flex h-8 w-8 items-center justify-center rounded-full",
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
      </Card>
    </div>
  );
}
