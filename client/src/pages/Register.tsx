import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";
import { Heart, ArrowRight, Loader2, User, Lock, GraduationCap, Calendar, IdCard, BookOpen } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

const SECTIONS = [
  "تقييم المريض",
  "الإجراءات التمريضية",
  "إعطاء الأدوية",
  "العلامات الحيوية",
  "التوثيق التمريضي",
];

const SPECIALIZATIONS = [
  "تمريض عام",
  "تمريض باطني جراحي",
  "تمريض أطفال",
  "تمريض نساء وولادة",
  "تمريض طوارئ",
  "تمريض عناية مركزة",
  "تمريض نفسي",
  "تمريض مجتمع",
  "إدارة تمريضية",
  "تعليم تمريض",
  "أخرى",
];

export default function Register() {
  const [, setLocation] = useLocation();
  const [form, setForm] = useState({
    fullName: "",
    age: "",
    specialization: "",
    learningId: "",
    favoriteSection: "",
    username: "",
    password: "",
    confirmPassword: "",
  });

  const registerMutation = trpc.platformAuth.register.useMutation({
    onSuccess: (data) => {
      toast.success("تم التسجيل بنجاح! مرحباً بك في المنصة");
      setLocation("/dashboard");
    },
    onError: (error) => {
      toast.error(error.message || "خطأ في التسجيل");
    },
  });

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.age || !form.specialization || !form.learningId || !form.favoriteSection || !form.username || !form.password) {
      toast.error("يرجى ملء جميع الحقول");
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error("كلمة المرور غير متطابقة");
      return;
    }
    if (form.password.length < 6) {
      toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }
    if (form.username.length < 3) {
      toast.error("اسم المستخدم يجب أن يكون 3 أحرف على الأقل");
      return;
    }
    const age = parseInt(form.age);
    if (isNaN(age) || age < 15 || age > 100) {
      toast.error("العمر يجب أن يكون بين 15 و 100");
      return;
    }

    registerMutation.mutate({
      fullName: form.fullName.trim(),
      age,
      specialization: form.specialization,
      learningId: form.learningId.trim(),
      favoriteSection: form.favoriteSection,
      username: form.username.trim(),
      password: form.password,
    });
  };

  return (
    <div className="min-h-screen medical-gradient flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-10 right-10 opacity-10"
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 5, repeat: Infinity }}
        >
          <Heart className="w-20 h-20 text-white" />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-lg relative z-10"
      >
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-lg">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <GraduationCap className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">تسجيل حساب جديد</CardTitle>
            <p className="text-muted-foreground text-sm mt-2">أنشئ حسابك وابدأ رحلة التعلم</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* الاسم الكامل */}
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-sm font-medium">الاسم الكامل</Label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    placeholder="أدخل اسمك الكامل"
                    value={form.fullName}
                    onChange={(e) => handleChange("fullName", e.target.value)}
                    className="pr-10 h-11"
                  />
                </div>
              </div>

              {/* العمر والتخصص */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="age" className="text-sm font-medium">العمر</Label>
                  <div className="relative">
                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="age"
                      type="number"
                      placeholder="العمر"
                      value={form.age}
                      onChange={(e) => handleChange("age", e.target.value)}
                      className="pr-10 h-11"
                      min={15}
                      max={100}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">التخصص</Label>
                  <Select value={form.specialization} onValueChange={(v) => handleChange("specialization", v)}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="اختر التخصص" />
                    </SelectTrigger>
                    <SelectContent>
                      {SPECIALIZATIONS.map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* هوية التعلم */}
              <div className="space-y-1.5">
                <Label htmlFor="learningId" className="text-sm font-medium">هوية التعلم (الرقم الأكاديمي)</Label>
                <div className="relative">
                  <IdCard className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="learningId"
                    placeholder="أدخل رقمك الأكاديمي"
                    value={form.learningId}
                    onChange={(e) => handleChange("learningId", e.target.value)}
                    className="pr-10 h-11"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* أكثر قسم يحبه */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">أكثر قسم تحبه</Label>
                <Select value={form.favoriteSection} onValueChange={(v) => handleChange("favoriteSection", v)}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="اختر القسم المفضل" />
                  </SelectTrigger>
                  <SelectContent>
                    {SECTIONS.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* اسم المستخدم */}
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-sm font-medium">اسم المستخدم</Label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="username"
                    placeholder="اختر اسم مستخدم فريد"
                    value={form.username}
                    onChange={(e) => handleChange("username", e.target.value)}
                    className="pr-10 h-11"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* كلمة المرور */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-sm font-medium">كلمة المرور</Label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="6 أحرف على الأقل"
                      value={form.password}
                      onChange={(e) => handleChange("password", e.target.value)}
                      className="pr-10 h-11"
                      dir="ltr"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">تأكيد كلمة المرور</Label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="أعد كتابة كلمة المرور"
                      value={form.confirmPassword}
                      onChange={(e) => handleChange("confirmPassword", e.target.value)}
                      className="pr-10 h-11"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-bold rounded-xl mt-2"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "إنشاء الحساب"
                )}
              </Button>
            </form>

            <div className="mt-5 text-center">
              <p className="text-muted-foreground text-sm">
                لديك حساب بالفعل؟{" "}
                <button
                  onClick={() => setLocation("/login")}
                  className="text-primary font-bold hover:underline"
                >
                  سجل دخول
                </button>
              </p>
            </div>

            <div className="mt-3 text-center">
              <button
                onClick={() => setLocation("/")}
                className="text-muted-foreground text-sm hover:text-primary inline-flex items-center gap-1"
              >
                <ArrowRight className="w-4 h-4" />
                العودة للصفحة الرئيسية
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
