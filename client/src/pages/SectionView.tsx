import { usePlatformAuth } from "@/hooks/usePlatformAuth";
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, CheckCircle2, Circle, Loader2, Lock, Heart, Stethoscope, Pill, Activity, FileText, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useLocation, useParams } from "wouter";
import { useEffect } from "react";

const SECTION_ICONS: Record<string, any> = {
  "assessment": ClipboardList,
  "procedures": Stethoscope,
  "medication": Pill,
  "vital-signs": Activity,
  "documentation": FileText,
};

const SECTION_COLORS: Record<string, string> = {
  "assessment": "from-emerald-500 to-teal-600",
  "procedures": "from-blue-500 to-indigo-600",
  "medication": "from-purple-500 to-violet-600",
  "vital-signs": "from-rose-500 to-pink-600",
  "documentation": "from-amber-500 to-orange-600",
};

export default function SectionView() {
  const { slug } = useParams<{ slug: string }>();
  const { user, loading } = usePlatformAuth();
  const [, setLocation] = useLocation();

  const sectionQuery = trpc.sections.getBySlug.useQuery({ slug: slug || "" }, { enabled: !!slug });
  const lessonsQuery = trpc.lessons.listBySection.useQuery(
    { sectionId: sectionQuery.data?.id || 0 },
    { enabled: !!sectionQuery.data?.id }
  );
  const progressQuery = trpc.progress.getUserProgress.useQuery();

  useEffect(() => {
    if (!loading && !user) setLocation("/login");
  }, [loading, user, setLocation]);

  if (loading || sectionQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const section = sectionQuery.data;
  if (!section) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">القسم غير موجود</h2>
          <Button onClick={() => setLocation("/dashboard")}>العودة</Button>
        </div>
      </div>
    );
  }

  const lessons = (lessonsQuery.data || []).filter(l => l.isPublished);
  const completedIds = new Set((progressQuery.data || []).filter(p => p.completed).map(p => p.lessonId));
  const completedCount = lessons.filter(l => completedIds.has(l.id)).length;
  const progress = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

  const Icon = SECTION_ICONS[section.slug] || BookOpen;
  const gradient = SECTION_COLORS[section.slug] || "from-gray-500 to-gray-600";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-50">
        <div className="container flex items-center gap-3 h-16">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/dashboard")}>
            <ArrowRight className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3 flex-1">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-foreground">{section.titleAr}</h1>
              <p className="text-xs text-muted-foreground">{lessons.length} دروس</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-6 max-w-3xl mx-auto">
        {/* Section Progress */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className={`bg-gradient-to-br ${gradient} border-0 text-white`}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <Icon className="w-10 h-10" />
                <div>
                  <h2 className="text-xl font-bold">{section.titleAr}</h2>
                  <p className="text-white/80 text-sm">{section.descriptionAr}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/80">أكملت {completedCount} من {lessons.length} درس</span>
                  <span className="font-bold">{progress}%</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2.5">
                  <div
                    className="bg-white rounded-full h-2.5 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Lessons List */}
        <div className="space-y-3">
          {lessons.map((lesson, index) => {
            const isCompleted = completedIds.has(lesson.id);
            return (
              <motion.div
                key={lesson.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card
                  className={`cursor-pointer hover:shadow-md transition-all ${isCompleted ? "border-emerald-200 bg-emerald-50/50" : ""}`}
                  onClick={() => setLocation(`/lesson/${lesson.id}`)}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      isCompleted ? "bg-emerald-100 text-emerald-600" : "bg-muted text-muted-foreground"
                    }`}>
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <span className="font-bold text-sm">{index + 1}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-medium ${isCompleted ? "text-emerald-700" : "text-foreground"}`}>
                        {lesson.titleAr}
                      </h3>
                      {isCompleted && (
                        <p className="text-xs text-emerald-600 mt-0.5">مكتمل</p>
                      )}
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground rotate-180 shrink-0" />
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}

          {lessons.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">لا توجد دروس متاحة حالياً</p>
              <p className="text-sm">سيتم إضافة الدروس قريباً</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
