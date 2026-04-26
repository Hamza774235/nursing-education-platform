import { usePlatformAuth } from "@/hooks/usePlatformAuth";
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";
import { Heart, BookOpen, Award, Activity, Stethoscope, Pill, FileText, ClipboardList, LogOut, Settings, ChevronLeft, Loader2, GraduationCap, CheckCircle2, BarChart3, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useLocation } from "wouter";
import { useEffect, useMemo } from "react";

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

function getGradeInfo(avgScore: number): { grade: string; color: string; bgColor: string; borderColor: string } {
  if (avgScore >= 90) return { grade: "ممتاز", color: "text-emerald-700", bgColor: "bg-emerald-50", borderColor: "border-emerald-200" };
  if (avgScore >= 80) return { grade: "جيد جداً", color: "text-blue-700", bgColor: "bg-blue-50", borderColor: "border-blue-200" };
  if (avgScore >= 70) return { grade: "جيد", color: "text-indigo-700", bgColor: "bg-indigo-50", borderColor: "border-indigo-200" };
  if (avgScore >= 60) return { grade: "مقبول", color: "text-amber-700", bgColor: "bg-amber-50", borderColor: "border-amber-200" };
  return { grade: "راسب", color: "text-red-700", bgColor: "bg-red-50", borderColor: "border-red-200" };
}

export default function Dashboard() {
  const { user, loading, logout, isAdmin } = usePlatformAuth();
  const [, setLocation] = useLocation();

  const sectionsQuery = trpc.sections.list.useQuery();
  const lessonsQuery = trpc.lessons.listAll.useQuery();
  const progressQuery = trpc.progress.getUserProgress.useQuery();
  const quizResultsQuery = trpc.progress.getQuizResults.useQuery();

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/login");
    }
  }, [loading, user, setLocation]);

  // حساب التقدير والمجموع
  const gradeData = useMemo(() => {
    const results = quizResultsQuery.data || [];
    if (results.length === 0) return null;

    // حساب أفضل نتيجة لكل اختبار
    const bestByQuiz = new Map<number, number>();
    for (const r of results) {
      const current = bestByQuiz.get(r.quizId);
      if (current === undefined || r.score > current) {
        bestByQuiz.set(r.quizId, r.score);
      }
    }

    const scores = Array.from(bestByQuiz.values());
    const totalScore = scores.reduce((a, b) => a + b, 0);
    const avgScore = Math.round(totalScore / scores.length);
    const gradeInfo = getGradeInfo(avgScore);

    return {
      avgScore,
      totalQuizzes: scores.length,
      totalAttempts: results.length,
      ...gradeInfo,
    };
  }, [quizResultsQuery.data]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const sections = sectionsQuery.data || [];
  const allLessons = lessonsQuery.data || [];
  const userProgress = progressQuery.data || [];
  const completedLessonIds = new Set(userProgress.filter(p => p.completed).map(p => p.lessonId));
  const publishedLessons = allLessons.filter(l => l.isPublished);
  const totalLessons = publishedLessons.length;
  const completedCount = publishedLessons.filter(l => completedLessonIds.has(l.id)).length;
  const overallProgress = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  const getSectionProgress = (sectionId: number) => {
    const sectionLessons = publishedLessons.filter(l => l.sectionId === sectionId);
    if (sectionLessons.length === 0) return 0;
    const completed = sectionLessons.filter(l => completedLessonIds.has(l.id)).length;
    return Math.round((completed / sectionLessons.length) * 100);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full medical-gradient flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" fill="white" />
            </div>
            <div>
              <h1 className="font-bold text-foreground text-sm">منصة التمريض التعليمية</h1>
              <p className="text-xs text-muted-foreground">مرحباً، {user.fullName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button variant="outline" size="sm" onClick={() => setLocation("/admin")} className="gap-1.5">
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">لوحة التحكم</span>
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={logout} className="gap-1.5 text-muted-foreground hover:text-destructive">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">خروج</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-8">
        {/* Welcome & Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Overall Progress Card */}
            <Card className="md:col-span-2 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-foreground mb-1">مرحباً، {user.fullName}!</h2>
                    <p className="text-muted-foreground text-sm">تابع رحلتك التعليمية في التمريض</p>
                  </div>
                  <div className="w-14 h-14 rounded-2xl medical-gradient flex items-center justify-center shadow-lg">
                    <GraduationCap className="w-7 h-7 text-white" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">التقدم العام</span>
                    <span className="font-bold text-primary">{overallProgress}%</span>
                  </div>
                  <Progress value={overallProgress} className="h-3" />
                  <p className="text-xs text-muted-foreground">
                    أكملت {completedCount} من {totalLessons} درس
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{completedCount}</p>
                    <p className="text-xs text-muted-foreground">دروس مكتملة</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{(quizResultsQuery.data || []).length}</p>
                    <p className="text-xs text-muted-foreground">اختبارات محلولة</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>

        {/* Grade & Score Banner */}
        {gradeData && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Card className={`${gradeData.bgColor} ${gradeData.borderColor} border-2`}>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-center gap-5">
                  {/* Grade Circle */}
                  <div className="relative">
                    <div className={`w-24 h-24 rounded-full border-4 ${gradeData.borderColor} ${gradeData.bgColor} flex flex-col items-center justify-center shadow-inner`}>
                      <span className={`text-3xl font-bold ${gradeData.color}`}>{gradeData.avgScore}%</span>
                    </div>
                  </div>

                  {/* Grade Info */}
                  <div className="flex-1 text-center sm:text-right">
                    <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                      <TrendingUp className={`w-5 h-5 ${gradeData.color}`} />
                      <h3 className={`text-xl font-bold ${gradeData.color}`}>التقدير: {gradeData.grade}</h3>
                    </div>
                    <p className="text-muted-foreground text-sm mb-3">
                      المعدل العام بناءً على أفضل نتائجك في {gradeData.totalQuizzes} اختبار
                    </p>

                    {/* Score Scale */}
                    <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                      {[
                        { label: "ممتاز", min: "90%+", active: gradeData.avgScore >= 90, color: "bg-emerald-200 text-emerald-800" },
                        { label: "جيد جداً", min: "80%+", active: gradeData.avgScore >= 80 && gradeData.avgScore < 90, color: "bg-blue-200 text-blue-800" },
                        { label: "جيد", min: "70%+", active: gradeData.avgScore >= 70 && gradeData.avgScore < 80, color: "bg-indigo-200 text-indigo-800" },
                        { label: "مقبول", min: "60%+", active: gradeData.avgScore >= 60 && gradeData.avgScore < 70, color: "bg-amber-200 text-amber-800" },
                        { label: "راسب", min: "<60%", active: gradeData.avgScore < 60, color: "bg-red-200 text-red-800" },
                      ].map(s => (
                        <span
                          key={s.label}
                          className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                            s.active ? s.color + " ring-2 ring-offset-1 ring-current" : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          {s.label} ({s.min})
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Sections Grid */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-4">الأقسام التعليمية</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sections.map((section, index) => {
              const Icon = SECTION_ICONS[section.slug] || BookOpen;
              const gradient = SECTION_COLORS[section.slug] || "from-gray-500 to-gray-600";
              const progress = getSectionProgress(section.id);
              const sectionLessons = publishedLessons.filter(l => l.sectionId === section.id);

              return (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <Card
                    className="group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden border-0 shadow-sm"
                    onClick={() => setLocation(`/section/${section.slug}`)}
                  >
                    <div className={`h-2 bg-gradient-to-r ${gradient}`} />
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                            {section.titleAr}
                          </h3>
                          <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                            {section.descriptionAr || "اضغط للبدء في التعلم"}
                          </p>
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">{sectionLessons.length} دروس</span>
                              <span className="font-medium text-primary">{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-1.5" />
                          </div>
                        </div>
                        <ChevronLeft className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-1" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>


      </main>
    </div>
  );
}
