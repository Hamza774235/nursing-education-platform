import { usePlatformAuth } from "@/hooks/usePlatformAuth";
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, CheckCircle2, Loader2, ClipboardCheck, Award, XCircle, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useLocation, useParams } from "wouter";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

export default function LessonView() {
  const { id } = useParams<{ id: string }>();
  const lessonId = parseInt(id || "0");
  const { user, loading } = usePlatformAuth();
  const [, setLocation] = useLocation();
  const [showQuiz, setShowQuiz] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [quizResult, setQuizResult] = useState<{ score: number; correct: number; totalQuestions: number; passed: boolean } | null>(null);

  const lessonQuery = trpc.lessons.getById.useQuery({ id: lessonId }, { enabled: lessonId > 0 });
  const quizQuery = trpc.quizzes.getByLesson.useQuery({ lessonId }, { enabled: lessonId > 0 });
  const progressQuery = trpc.progress.getUserProgress.useQuery();
  const utils = trpc.useUtils();

  const markCompleteMutation = trpc.progress.markComplete.useMutation({
    onSuccess: () => {
      utils.progress.getUserProgress.invalidate();
      toast.success("تم تسجيل إكمال الدرس!");
    },
  });

  const submitQuizMutation = trpc.quizzes.submit.useMutation({
    onSuccess: (data) => {
      setQuizResult(data);
      if (data.passed) {
        markCompleteMutation.mutate({ lessonId });
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  useEffect(() => {
    if (!loading && !user) setLocation("/login");
  }, [loading, user, setLocation]);

  if (loading || lessonQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const lesson = lessonQuery.data;
  if (!lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">الدرس غير موجود</h2>
          <Button onClick={() => setLocation("/dashboard")}>العودة</Button>
        </div>
      </div>
    );
  }

  const isCompleted = (progressQuery.data || []).some(p => p.lessonId === lessonId && p.completed);
  const quiz = quizQuery.data;

  const handleSubmitQuiz = () => {
    if (!quiz) return;
    const allAnswered = quiz.questions.every(q => answers[q.id]);
    if (!allAnswered) {
      toast.error("يرجى الإجابة على جميع الأسئلة");
      return;
    }
    submitQuizMutation.mutate({
      quizId: quiz.id,
      answers: quiz.questions.map(q => ({
        questionId: q.id,
        selectedOption: answers[q.id] as "A" | "B" | "C" | "D",
      })),
    });
  };

  const handleMarkComplete = () => {
    markCompleteMutation.mutate({ lessonId });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-50">
        <div className="container flex items-center gap-3 h-16">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
            <ArrowRight className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-foreground truncate">{lesson.titleAr}</h1>
          </div>
          {isCompleted && (
            <div className="flex items-center gap-1 text-emerald-600 text-sm">
              <CheckCircle2 className="w-4 h-4" />
              <span className="hidden sm:inline">مكتمل</span>
            </div>
          )}
        </div>
      </header>

      <main className="container py-6 max-w-3xl mx-auto space-y-6">
        {/* Lesson Content */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardContent className="p-6 md:p-8">
              {lesson.imageUrl && (
                <div className="mb-6 rounded-xl overflow-hidden">
                  <img src={lesson.imageUrl} alt={lesson.titleAr} className="w-full h-auto object-cover" />
                </div>
              )}
              <div className="prose prose-lg max-w-none" dir="rtl">
                <Streamdown>{lesson.contentAr}</Streamdown>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Mark as Complete (if no quiz) */}
        {!quiz && !isCompleted && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <Button
              size="lg"
              className="gap-2 h-12 px-8 font-bold rounded-xl"
              onClick={handleMarkComplete}
              disabled={markCompleteMutation.isPending}
            >
              {markCompleteMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  تم إكمال الدرس
                </>
              )}
            </Button>
          </motion.div>
        )}

        {/* Quiz Section */}
        {quiz && !showQuiz && !quizResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-6 text-center">
                <ClipboardCheck className="w-12 h-12 text-primary mx-auto mb-3" />
                <h3 className="text-lg font-bold mb-2">{quiz.titleAr}</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {quiz.questions.length} أسئلة - درجة النجاح {quiz.passingScore}%
                </p>
                <Button
                  size="lg"
                  className="gap-2 font-bold rounded-xl"
                  onClick={() => setShowQuiz(true)}
                >
                  <ClipboardCheck className="w-5 h-5" />
                  ابدأ الاختبار
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Quiz Questions */}
        {quiz && showQuiz && !quizResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{quiz.titleAr}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {quiz.questions.map((q, index) => (
                  <div key={q.id} className="space-y-3 pb-6 border-b border-border last:border-0 last:pb-0">
                    <h4 className="font-medium text-foreground">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-bold ml-2">
                        {index + 1}
                      </span>
                      {q.questionAr}
                    </h4>
                    <RadioGroup
                      value={answers[q.id] || ""}
                      onValueChange={(value) => setAnswers(prev => ({ ...prev, [q.id]: value }))}
                      className="space-y-2 pr-9"
                    >
                      {[
                        { key: "A", text: q.optionAAr },
                        { key: "B", text: q.optionBAr },
                        { key: "C", text: q.optionCAr },
                        { key: "D", text: q.optionDAr },
                      ].map(opt => (
                        <div key={opt.key} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                          <RadioGroupItem value={opt.key} id={`q${q.id}-${opt.key}`} />
                          <Label htmlFor={`q${q.id}-${opt.key}`} className="flex-1 cursor-pointer text-sm">
                            {opt.text}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                ))}

                <Button
                  size="lg"
                  className="w-full h-12 font-bold rounded-xl"
                  onClick={handleSubmitQuiz}
                  disabled={submitQuizMutation.isPending}
                >
                  {submitQuizMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "تسليم الإجابات"
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Quiz Result */}
        {quizResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className={`border-2 ${quizResult.passed ? "border-emerald-300 bg-emerald-50" : "border-red-300 bg-red-50"}`}>
              <CardContent className="p-8 text-center">
                {quizResult.passed ? (
                  <>
                    <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                      <Award className="w-10 h-10 text-emerald-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-emerald-700 mb-2">أحسنت! نجحت في الاختبار</h3>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                      <XCircle className="w-10 h-10 text-red-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-red-700 mb-2">لم تنجح هذه المرة</h3>
                  </>
                )}
                <p className="text-lg mb-1">
                  النتيجة: <span className="font-bold">{quizResult.score}%</span>
                </p>
                <p className="text-muted-foreground mb-6">
                  أجبت بشكل صحيح على {quizResult.correct} من {quizResult.totalQuestions} سؤال
                </p>
                <div className="flex gap-3 justify-center">
                  {!quizResult.passed && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setQuizResult(null);
                        setAnswers({});
                        setShowQuiz(true);
                      }}
                    >
                      أعد المحاولة
                    </Button>
                  )}
                  <Button onClick={() => window.history.back()}>
                    العودة للقسم
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </main>
    </div>
  );
}
