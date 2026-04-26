import { usePlatformAuth } from "@/hooks/usePlatformAuth";
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";
import {
  ArrowRight, BookOpen, Users, Award, Plus, Trash2, Edit, Loader2,
  Heart, BarChart3, GraduationCap, Shield, Save, X, ChevronDown, ChevronUp,
  ClipboardCheck, UserPlus, UserMinus, Settings, Eye, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function AdminPanel() {
  const { user, loading, isAdmin, isSuperAdmin, logout } = usePlatformAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      setLocation("/dashboard");
    }
  }, [loading, user, isAdmin, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/dashboard")}>
              <ArrowRight className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg medical-gradient flex items-center justify-center">
                <Settings className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-foreground text-sm">لوحة التحكم</h1>
                <p className="text-xs text-muted-foreground">{isSuperAdmin ? "المشرف الرئيسي" : "مشرف"}</p>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground">
            خروج
          </Button>
        </div>
      </header>

      <main className="container py-6">
        <Tabs defaultValue="lessons" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 h-auto p-1">
            <TabsTrigger value="lessons" className="gap-1.5 text-xs sm:text-sm py-2">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">الدروس</span>
            </TabsTrigger>
            <TabsTrigger value="quizzes" className="gap-1.5 text-xs sm:text-sm py-2">
              <ClipboardCheck className="w-4 h-4" />
              <span className="hidden sm:inline">الاختبارات</span>
            </TabsTrigger>
            <TabsTrigger value="students" className="gap-1.5 text-xs sm:text-sm py-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">الطلاب</span>
            </TabsTrigger>
            {isSuperAdmin && (
              <TabsTrigger value="admins" className="gap-1.5 text-xs sm:text-sm py-2">
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">المشرفين</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="lessons">
            <LessonsTab />
          </TabsContent>
          <TabsContent value="quizzes">
            <QuizzesTab />
          </TabsContent>
          <TabsContent value="students">
            <StudentsTab />
          </TabsContent>
          {isSuperAdmin && (
            <TabsContent value="admins">
              <AdminsTab />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}

/* ========== Lessons Tab ========== */
function LessonsTab() {
  const [showForm, setShowForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState<any>(null);
  const [form, setForm] = useState({
    titleAr: "", contentAr: "", sectionId: 0, sortOrder: 0, imageUrl: "", isPublished: true
  });

  const sectionsQuery = trpc.sections.list.useQuery();
  const lessonsQuery = trpc.lessons.listAll.useQuery();
  const utils = trpc.useUtils();

  const createMutation = trpc.lessons.create.useMutation({
    onSuccess: () => {
      utils.lessons.listAll.invalidate();
      resetForm();
      toast.success("تم إضافة الدرس بنجاح");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateMutation = trpc.lessons.update.useMutation({
    onSuccess: () => {
      utils.lessons.listAll.invalidate();
      resetForm();
      toast.success("تم تحديث الدرس");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = trpc.lessons.delete.useMutation({
    onSuccess: () => {
      utils.lessons.listAll.invalidate();
      toast.success("تم حذف الدرس");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const resetForm = () => {
    setForm({ titleAr: "", contentAr: "", sectionId: 0, sortOrder: 0, imageUrl: "", isPublished: true });
    setEditingLesson(null);
    setShowForm(false);
  };

  const handleEdit = (lesson: any) => {
    setForm({
      titleAr: lesson.titleAr,
      contentAr: lesson.contentAr,
      sectionId: lesson.sectionId,
      sortOrder: lesson.sortOrder,
      imageUrl: lesson.imageUrl || "",
      isPublished: lesson.isPublished,
    });
    setEditingLesson(lesson);
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.titleAr || !form.contentAr || !form.sectionId) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }
    const slug = form.titleAr.replace(/\s+/g, "-").replace(/[^\u0621-\u064Aa-zA-Z0-9-]/g, "").slice(0, 100) || `lesson-${Date.now()}`;
    if (editingLesson) {
      updateMutation.mutate({ id: editingLesson.id, ...form });
    } else {
      createMutation.mutate({ ...form, slug });
    }
  };

  const sections = sectionsQuery.data || [];
  const lessons = lessonsQuery.data || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">إدارة الدروس ({lessons.length})</h2>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-1.5">
          <Plus className="w-4 h-4" />
          إضافة درس
        </Button>
      </div>

      {showForm && (
        <Card className="border-primary/20">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold">{editingLesson ? "تعديل الدرس" : "إضافة درس جديد"}</h3>
              <Button variant="ghost" size="icon" onClick={resetForm}><X className="w-4 h-4" /></Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>عنوان الدرس *</Label>
                <Input value={form.titleAr} onChange={e => setForm(p => ({ ...p, titleAr: e.target.value }))} placeholder="عنوان الدرس" />
              </div>
              <div className="space-y-2">
                <Label>القسم *</Label>
                <Select value={form.sectionId ? String(form.sectionId) : ""} onValueChange={v => setForm(p => ({ ...p, sectionId: parseInt(v) }))}>
                  <SelectTrigger><SelectValue placeholder="اختر القسم" /></SelectTrigger>
                  <SelectContent>
                    {sections.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.titleAr}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>الترتيب</Label>
                <Input type="number" value={form.sortOrder} onChange={e => setForm(p => ({ ...p, sortOrder: parseInt(e.target.value) || 0 }))} />
              </div>
              <div className="space-y-2">
                <Label>رابط الصورة (اختياري)</Label>
                <Input value={form.imageUrl} onChange={e => setForm(p => ({ ...p, imageUrl: e.target.value }))} placeholder="https://..." dir="ltr" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>محتوى الدرس * (يدعم Markdown)</Label>
              <Textarea
                value={form.contentAr}
                onChange={e => setForm(p => ({ ...p, contentAr: e.target.value }))}
                placeholder="اكتب محتوى الدرس هنا..."
                className="min-h-[200px]"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.isPublished} onCheckedChange={v => setForm(p => ({ ...p, isPublished: v }))} />
              <Label>منشور (مرئي للطلاب)</Label>
            </div>
            <Button onClick={handleSubmit} className="gap-1.5" disabled={createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {editingLesson ? "تحديث" : "إضافة"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Lessons List */}
      <div className="space-y-2">
        {sections.map(section => {
          const sectionLessons = lessons.filter(l => l.sectionId === section.id);
          if (sectionLessons.length === 0 && !showForm) return null;
          return (
            <Card key={section.id}>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm font-bold text-primary">{section.titleAr} ({sectionLessons.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {sectionLessons.map(lesson => (
                  <div key={lesson.id} className="flex items-center gap-3 px-4 py-3 border-t hover:bg-muted/50">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{lesson.titleAr}</p>
                      <p className="text-xs text-muted-foreground">ترتيب: {lesson.sortOrder} {!lesson.isPublished && "• مخفي"}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(lesson)}>
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => {
                          if (confirm("هل أنت متأكد من حذف هذا الدرس؟")) {
                            deleteMutation.mutate({ id: lesson.id });
                          }
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ========== Quizzes Tab ========== */
function QuizzesTab() {
  const [showForm, setShowForm] = useState(false);
  const [quizForm, setQuizForm] = useState({
    titleAr: "", lessonId: 0, passingScore: 70,
    questions: [] as { questionAr: string; optionAAr: string; optionBAr: string; optionCAr: string; optionDAr: string; correctOption: string }[]
  });

  const lessonsQuery = trpc.lessons.listAll.useQuery();
  const sectionsQuery = trpc.sections.list.useQuery();
  const utils = trpc.useUtils();

  // We'll fetch quizzes per section for display
  const [quizzesList, setQuizzesList] = useState<any[]>([]);

  // Fetch quizzes for all lessons
  const allLessons = lessonsQuery.data || [];

  const createMutation = trpc.quizzes.createQuiz.useMutation({
    onSuccess: () => {
      setShowForm(false);
      setQuizForm({ titleAr: "", lessonId: 0, passingScore: 70, questions: [] });
      toast.success("تم إنشاء الاختبار بنجاح");
      // Refresh page to see new quiz
      window.location.reload();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = trpc.quizzes.deleteQuiz.useMutation({
    onSuccess: () => {
      toast.success("تم حذف الاختبار");
      window.location.reload();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const addQuestion = () => {
    setQuizForm(p => ({
      ...p,
      questions: [...p.questions, { questionAr: "", optionAAr: "", optionBAr: "", optionCAr: "", optionDAr: "", correctOption: "A" }]
    }));
  };

  const updateQuestion = (index: number, field: string, value: string) => {
    setQuizForm(p => ({
      ...p,
      questions: p.questions.map((q, i) => i === index ? { ...q, [field]: value } : q)
    }));
  };

  const removeQuestion = (index: number) => {
    setQuizForm(p => ({ ...p, questions: p.questions.filter((_, i) => i !== index) }));
  };

  const handleSubmit = () => {
    if (!quizForm.titleAr || !quizForm.lessonId || quizForm.questions.length === 0) {
      toast.error("يرجى ملء جميع الحقول وإضافة سؤال واحد على الأقل");
      return;
    }
    createMutation.mutate({
      titleAr: quizForm.titleAr,
      lessonId: quizForm.lessonId,
      passingScore: quizForm.passingScore,
      questions: quizForm.questions.map((q, i) => ({
        ...q,
        correctOption: q.correctOption as "A" | "B" | "C" | "D",
      })),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">إدارة الاختبارات</h2>
        <Button onClick={() => setShowForm(!showForm)} className="gap-1.5">
          <Plus className="w-4 h-4" />
          إضافة اختبار
        </Button>
      </div>

      {showForm && (
        <Card className="border-primary/20">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold">إضافة اختبار جديد</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}><X className="w-4 h-4" /></Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>عنوان الاختبار *</Label>
                <Input value={quizForm.titleAr} onChange={e => setQuizForm(p => ({ ...p, titleAr: e.target.value }))} placeholder="اختبار..." />
              </div>
              <div className="space-y-2">
                <Label>الدرس المرتبط *</Label>
                <Select value={quizForm.lessonId ? String(quizForm.lessonId) : ""} onValueChange={v => setQuizForm(p => ({ ...p, lessonId: parseInt(v) }))}>
                  <SelectTrigger><SelectValue placeholder="اختر الدرس" /></SelectTrigger>
                  <SelectContent>
                    {allLessons.map(l => <SelectItem key={l.id} value={String(l.id)}>{l.titleAr}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>درجة النجاح (%)</Label>
                <Input type="number" value={quizForm.passingScore} onChange={e => setQuizForm(p => ({ ...p, passingScore: parseInt(e.target.value) || 70 }))} min={0} max={100} />
              </div>
            </div>

            {/* Questions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-bold">الأسئلة ({quizForm.questions.length})</Label>
                <Button variant="outline" size="sm" onClick={addQuestion} className="gap-1">
                  <Plus className="w-3.5 h-3.5" />
                  إضافة سؤال
                </Button>
              </div>
              {quizForm.questions.map((q, index) => (
                <Card key={index} className="bg-muted/30">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-primary">السؤال {index + 1}</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeQuestion(index)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    <Input value={q.questionAr} onChange={e => updateQuestion(index, "questionAr", e.target.value)} placeholder="نص السؤال" />
                    <div className="grid grid-cols-2 gap-2">
                      <Input value={q.optionAAr} onChange={e => updateQuestion(index, "optionAAr", e.target.value)} placeholder="الخيار أ" />
                      <Input value={q.optionBAr} onChange={e => updateQuestion(index, "optionBAr", e.target.value)} placeholder="الخيار ب" />
                      <Input value={q.optionCAr} onChange={e => updateQuestion(index, "optionCAr", e.target.value)} placeholder="الخيار ج" />
                      <Input value={q.optionDAr} onChange={e => updateQuestion(index, "optionDAr", e.target.value)} placeholder="الخيار د" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">الإجابة الصحيحة</Label>
                      <Select value={q.correctOption} onValueChange={v => updateQuestion(index, "correctOption", v)}>
                        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A">الخيار أ</SelectItem>
                          <SelectItem value="B">الخيار ب</SelectItem>
                          <SelectItem value="C">الخيار ج</SelectItem>
                          <SelectItem value="D">الخيار د</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Button onClick={handleSubmit} className="gap-1.5" disabled={createMutation.isPending}>
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              إنشاء الاختبار
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Info message */}
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <ClipboardCheck className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">الاختبارات مرتبطة بالدروس. أضف اختباراً جديداً وربطه بدرس معين.</p>
          <p className="text-xs mt-1">يمكنك حذف الاختبارات من صفحة الدرس المرتبط.</p>
        </CardContent>
      </Card>
    </div>
  );
}

/* ========== Students Tab ========== */
function StudentsTab() {
  const studentsQuery = trpc.admin.getStudents.useQuery();
  const students = studentsQuery.data || [];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">الطلاب المسجلين ({students.length})</h2>
      <div className="space-y-2">
        {students.map((student: any) => (
          <Card key={student.id}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <GraduationCap className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{student.fullName}</p>
                <p className="text-xs text-muted-foreground">
                  @{student.username} • {student.specialization}
                </p>
              </div>
              <div className="text-left shrink-0">
                <p className="text-xs text-muted-foreground">{student.role === "student" ? "طالب" : "مشرف"}</p>
              </div>
            </CardContent>
          </Card>
        ))}
        {students.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>لا يوجد طلاب مسجلين بعد</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ========== Admins Tab ========== */
function AdminsTab() {
  const [newAdminUsername, setNewAdminUsername] = useState("");
  const adminsQuery = trpc.admin.getAdmins.useQuery();
  const utils = trpc.useUtils();

  const promoteMutation = trpc.admin.promoteToAdmin.useMutation({
    onSuccess: () => {
      utils.admin.getAdmins.invalidate();
      setNewAdminUsername("");
      toast.success("تمت ترقية المستخدم إلى مشرف");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const demoteMutation = trpc.admin.demoteToStudent.useMutation({
    onSuccess: () => {
      utils.admin.getAdmins.invalidate();
      toast.success("تم إزالة صلاحيات المشرف");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const admins = adminsQuery.data || [];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">إدارة المشرفين</h2>

      {/* Add Admin */}
      <Card className="border-primary/20">
        <CardContent className="p-4">
          <Label className="text-sm font-bold mb-2 block">إضافة مشرف جديد</Label>
          <div className="flex gap-2">
            <Input
              value={newAdminUsername}
              onChange={e => setNewAdminUsername(e.target.value)}
              placeholder="أدخل اسم المستخدم"
              className="flex-1"
              dir="ltr"
            />
            <Button
              onClick={() => {
                if (!newAdminUsername.trim()) {
                  toast.error("أدخل اسم المستخدم");
                  return;
                }
                promoteMutation.mutate({ username: newAdminUsername.trim() });
              }}
              disabled={promoteMutation.isPending}
              className="gap-1.5"
            >
              {promoteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              إضافة
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Admins List */}
      <div className="space-y-2">
        {admins.map((admin: any) => (
          <Card key={admin.id}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{admin.fullName}</p>
                <p className="text-xs text-muted-foreground">
                  @{admin.username} • {admin.role === "super_admin" ? "المشرف الرئيسي" : "مشرف"}
                </p>
              </div>
              {admin.role !== "super_admin" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => {
                    if (confirm("هل أنت متأكد من إزالة صلاحيات المشرف؟")) {
                      demoteMutation.mutate({ username: admin.username });
                    }
                  }}
                >
                  <UserMinus className="w-4 h-4" />
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
