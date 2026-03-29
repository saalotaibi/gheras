import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "../lib/cn";
import { Button } from "./ui/Button";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

const ONBOARDING_KEY = "gheras_onboarding_seen";

interface TourStep {
  target: string;
  title: string;
  description: string;
  position: "top" | "bottom" | "left" | "right";
}

const tourSteps: TourStep[] = [
  {
    target: '[data-tour="children"]',
    title: "إضافة طفل",
    description: "ابدأ بإضافة طفلك هنا لتتمكن من إنشاء قصص مخصصة له",
    position: "left",
  },
  {
    target: '[data-tour="create-story"]',
    title: "إنشاء قصة",
    description: "بعد إضافة طفل، اضغط هنا لإنشاء قصة جديدة مخصصة",
    position: "left",
  },
];

export function OnboardingTour() {
  const [active, setActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [arrowStyle, setArrowStyle] = useState<React.CSSProperties>({});
  const [arrowDirection, setArrowDirection] = useState<"top" | "bottom" | "left" | "right">("right");
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const seen = localStorage.getItem(ONBOARDING_KEY);
    if (!seen) {
      const timer = setTimeout(() => setActive(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const positionTooltip = useCallback(() => {
    const step = tourSteps[currentStep];
    const el = document.querySelector(step.target);
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const tooltipEl = tooltipRef.current;
    const tooltipW = tooltipEl?.offsetWidth || 280;
    const tooltipH = tooltipEl?.offsetHeight || 120;
    const gap = 16;

    let top = 0;
    let left = 0;
    let aTop = 0;
    let aLeft = 0;
    let dir: "top" | "bottom" | "left" | "right" = step.position;

    if (step.position === "left") {
      top = rect.top + rect.height / 2 - tooltipH / 2;
      left = rect.right + gap;
      aTop = tooltipH / 2 - 6;
      aLeft = -6;
      dir = "right";
    } else if (step.position === "right") {
      top = rect.top + rect.height / 2 - tooltipH / 2;
      left = rect.left - tooltipW - gap;
      aTop = tooltipH / 2 - 6;
      aLeft = tooltipW - 6;
      dir = "left";
    } else if (step.position === "bottom") {
      top = rect.bottom + gap;
      left = rect.left + rect.width / 2 - tooltipW / 2;
      aTop = -6;
      aLeft = tooltipW / 2 - 6;
      dir = "top";
    } else {
      top = rect.top - tooltipH - gap;
      left = rect.left + rect.width / 2 - tooltipW / 2;
      aTop = tooltipH - 6;
      aLeft = tooltipW / 2 - 6;
      dir = "bottom";
    }

    top = Math.max(8, Math.min(top, window.innerHeight - tooltipH - 8));
    left = Math.max(8, Math.min(left, window.innerWidth - tooltipW - 8));

    setTooltipStyle({ top, left, width: tooltipW });
    setArrowStyle({ top: aTop, left: aLeft });
    setArrowDirection(dir);
  }, [currentStep]);

  useEffect(() => {
    if (!active) return;
    positionTooltip();
    window.addEventListener("resize", positionTooltip);
    return () => window.removeEventListener("resize", positionTooltip);
  }, [active, currentStep, positionTooltip]);

  useEffect(() => {
    if (!active) return;
    const step = tourSteps[currentStep];
    const el = document.querySelector(step.target) as HTMLElement | null;
    if (el) {
      el.style.position = "relative";
      el.style.zIndex = "60";
      el.style.borderRadius = "8px";
      el.style.boxShadow = "0 0 0 4px rgba(48, 148, 158, 0.4)";
    }
    return () => {
      if (el) {
        el.style.zIndex = "";
        el.style.boxShadow = "";
      }
    };
  }, [active, currentStep]);

  const dismiss = () => {
    setActive(false);
    localStorage.setItem(ONBOARDING_KEY, "true");
  };

  const nextStep = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      dismiss();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  };

  if (!active) return null;

  const step = tourSteps[currentStep];
  const isLast = currentStep === tourSteps.length - 1;
  const isFirst = currentStep === 0;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/40 transition-opacity"
        onClick={dismiss}
      />

      <div
        ref={tooltipRef}
        className="fixed z-[60] w-[280px] rounded-xl bg-white p-4 shadow-2xl border border-gray-200 animate-in fade-in"
        style={tooltipStyle}
      >
        <div
          className="absolute h-3 w-3 rotate-45 bg-white border border-gray-200"
          style={{
            ...arrowStyle,
            clipPath:
              arrowDirection === "right"
                ? "polygon(0 0, 0 100%, 100% 100%)"
                : arrowDirection === "left"
                  ? "polygon(100% 0, 0 0, 100% 100%)"
                  : arrowDirection === "top"
                    ? "polygon(0 100%, 100% 100%, 100% 0)"
                    : "polygon(0 0, 100% 0, 0 100%)",
          }}
        />

        <button
          onClick={dismiss}
          className="absolute top-2 end-2 rounded-md p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        <h4 className="text-sm font-bold text-gray-900 mb-1 pe-6">{step.title}</h4>
        <p className="text-xs text-gray-500 leading-relaxed mb-4">{step.description}</p>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {currentStep + 1} / {tourSteps.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={dismiss}
              className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              تخطي
            </button>
            {!isFirst && (
              <button
                onClick={prevStep}
                className="rounded-md p-1 text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
            <Button size="sm" onClick={nextStep}>
              {isLast ? "فهمت!" : "التالي"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
