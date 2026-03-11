import { useState, useEffect } from "react";
import { api } from "../../lib/api";
import type { Story } from "../../types/story";
import { PageHeader } from "../../components/PageHeader";
import { StoryCard } from "../../components/StoryCard";
import { Spinner } from "../../components/ui/Spinner";
import { BookOpen } from "lucide-react";

export function LibraryPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Story[]>("/stories/")
      .then(setStories)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="المكتبة" description="جميع القصص التي تم إنشاؤها" />

      {stories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {stories.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100 mb-4">
            <BookOpen className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">لا توجد قصص بعد</h3>
          <p className="text-sm text-gray-500">ابدأ بإنشاء أول قصة لطفلك!</p>
        </div>
      )}
    </div>
  );
}
