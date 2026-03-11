import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useChildren } from "../../context/ChildrenContext";
import { useMultiStepForm } from "../../hooks/useMultiStepForm";
import { api } from "../../lib/api";
import type { ConfigResponse } from "../../types/story";
import { PageHeader } from "../../components/PageHeader";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Select";
import { Spinner } from "../../components/ui/Spinner";
import { StepIndicator } from "../../components/StepIndicator";
import { SelectableGrid } from "../../components/SelectableGrid";
import {
  Compass,
  Sparkles,
  GraduationCap,
  Users,
  TreePine,
  Rocket,
  Shield,
  Heart,
  HandHeart,
  Star,
  ClipboardCheck,
  Clock,
  Crown,
  Gift,
  PenLine,
} from "lucide-react";

const iconMap: Record<string, React.ReactNode> = {
  Compass: <Compass className="h-6 w-6" />,
  Sparkles: <Sparkles className="h-6 w-6" />,
  GraduationCap: <GraduationCap className="h-6 w-6" />,
  Users: <Users className="h-6 w-6" />,
  TreePine: <TreePine className="h-6 w-6" />,
  Rocket: <Rocket className="h-6 w-6" />,
  Shield: <Shield className="h-6 w-6" />,
  Heart: <Heart className="h-6 w-6" />,
  HandHeart: <HandHeart className="h-6 w-6" />,
  Star: <Star className="h-6 w-6" />,
  ClipboardCheck: <ClipboardCheck className="h-6 w-6" />,
  Clock: <Clock className="h-6 w-6" />,
  Crown: <Crown className="h-6 w-6" />,
  Gift: <Gift className="h-6 w-6" />,
  PenLine: <PenLine className="h-6 w-6" />,
};

const steps = ["نوع القصة", "الأسلوب الفني", "السلوك المستهدف"];

export function CreateStoryPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { children } = useChildren();
  const { currentStep, next, back, isFirst, isLast } = useMultiStepForm(3);

  const [config, setConfig] = useState<ConfigResponse | null>(null);
  const [configLoading, setConfigLoading] = useState(true);

  const [childId, setChildId] = useState(searchParams.get("childId") || children[0]?.id?.toString() || "");
  const [storyTypeId, setStoryTypeId] = useState<string | null>(null);
  const [artStyleId, setArtStyleId] = useState<string | null>(null);
  const [behaviorId, setBehaviorId] = useState<string | null>(null);
  const [customBehavior, setCustomBehavior] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get<ConfigResponse>("/config/")
      .then(setConfig)
      .catch(() => {})
      .finally(() => setConfigLoading(false));
  }, []);

  const canNext =
    (currentStep === 0 && storyTypeId) ||
    (currentStep === 1 && artStyleId) ||
    (currentStep === 2 && behaviorId && (behaviorId !== "other" || customBehavior.trim()));

  const handleFinish = async () => {
    if (!childId || !storyTypeId || !artStyleId || !behaviorId) return;
    setSubmitting(true);
    try {
      const res = await api.post<{ id: number; status: string }>("/stories/", {
        childId: Number(childId),
        storyType: storyTypeId,
        artStyle: artStyleId,
        targetBehavior: behaviorId,
        customBehavior: behaviorId === "other" ? customBehavior.trim() : "",
      });
      navigate("/create-story/generating", { state: { storyId: res.id } });
    } catch {
      setSubmitting(false);
    }
  };

  if (configLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  const storyTypes = config?.genres ?? [];
  const artStyles = config?.styles ?? [];
  const behaviors = config?.behaviors ?? [];

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader title="إنشاء قصة جديدة" description="اختر تفاصيل القصة لطفلك" />

      <Card>
        <div className="mb-6">
          <Select
            label="اختر الطفل"
            options={children.map((c) => ({ value: c.id.toString(), label: c.name }))}
            value={childId}
            onChange={(e) => setChildId(e.target.value)}
          />
        </div>

        <StepIndicator steps={steps} currentStep={currentStep} className="mb-8" />

        <div className="mb-8">
          {currentStep === 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">اختر نوع القصة</h3>
              <SelectableGrid
                items={storyTypes.map((t) => ({
                  id: t.key,
                  label: t.label,
                  description: t.description,
                  icon: iconMap[t.icon],
                }))}
                selectedId={storyTypeId}
                onSelect={setStoryTypeId}
              />
            </div>
          )}

          {currentStep === 1 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">اختر الأسلوب الفني</h3>
              <SelectableGrid
                items={artStyles.map((s) => ({
                  id: s.key,
                  label: s.label,
                  description: s.description,
                  previewUrl: s.previewUrl,
                }))}
                selectedId={artStyleId}
                onSelect={setArtStyleId}
              />
            </div>
          )}

          {currentStep === 2 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">اختر السلوك المستهدف</h3>
              <SelectableGrid
                items={behaviors.map((b) => ({
                  id: b.key,
                  label: b.label,
                  description: b.description,
                  icon: iconMap[b.icon],
                }))}
                selectedId={behaviorId}
                onSelect={(id) => { setBehaviorId(id); setCustomBehavior(""); }}
                columns={2}
              />
              {behaviorId === "other" && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    اكتب السلوك الذي تريده
                  </label>
                  <input
                    type="text"
                    value={customBehavior}
                    onChange={(e) => setCustomBehavior(e.target.value)}
                    placeholder="مثال: الاستماع الجيد، التعاون مع الأشقاء..."
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
                    autoFocus
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-between">
          <Button variant="secondary" onClick={back} disabled={isFirst}>
            السابق
          </Button>
          {isLast ? (
            <Button onClick={handleFinish} disabled={!canNext || submitting}>
              {submitting ? "جاري الإنشاء..." : "إنشاء القصة"}
            </Button>
          ) : (
            <Button onClick={next} disabled={!canNext}>
              التالي
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
