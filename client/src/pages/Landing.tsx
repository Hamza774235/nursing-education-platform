import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Heart, BookOpen, Award, Stethoscope, Activity, Shield } from "lucide-react";
import { useLocation } from "wouter";

export default function Landing() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen relative overflow-hidden medical-gradient">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 right-10 opacity-10"
          animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
          <Heart className="w-32 h-32 text-white" />
        </motion.div>
        <motion.div
          className="absolute top-40 left-20 opacity-10"
          animate={{ y: [0, -15, 0], rotate: [0, -5, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        >
          <Stethoscope className="w-24 h-24 text-white" />
        </motion.div>
        <motion.div
          className="absolute bottom-32 right-1/4 opacity-10"
          animate={{ y: [0, -25, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        >
          <Activity className="w-28 h-28 text-white" />
        </motion.div>
        <motion.div
          className="absolute bottom-20 left-10 opacity-10"
          animate={{ y: [0, -10, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        >
          <Shield className="w-20 h-20 text-white" />
        </motion.div>
        {/* Floating circles */}
        <motion.div
          className="absolute top-1/3 left-1/3 w-64 h-64 rounded-full bg-white/5"
          animate={{ scale: [1, 1.2, 1], opacity: [0.05, 0.1, 0.05] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/3 w-48 h-48 rounded-full bg-white/5"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.08, 0.03, 0.08] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
        {/* Logo and title */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-12"
        >
          <motion.div
            className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm mb-6 border border-white/30"
            animate={{ boxShadow: ["0 0 20px rgba(255,255,255,0.1)", "0 0 40px rgba(255,255,255,0.2)", "0 0 20px rgba(255,255,255,0.1)"] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Heart className="w-12 h-12 text-white" fill="white" />
          </motion.div>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight">
            منصة التمريض التعليمية
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
            منصتك المتكاملة لتعلم أساسيات التمريض وتطوير مهاراتك المهنية
          </p>
        </motion.div>

        {/* Feature cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12 max-w-3xl w-full"
        >
          {[
            { icon: BookOpen, title: "دروس تفاعلية", desc: "محتوى تعليمي شامل" },
            { icon: Award, title: "اختبارات وتقييم", desc: "تقييم مستمر وعرض التقدير" },
            { icon: Activity, title: "تتبع التقدم", desc: "متابعة إنجازاتك" },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 + i * 0.15 }}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 text-center"
            >
              <item.icon className="w-8 h-8 text-white/90 mx-auto mb-3" />
              <h3 className="text-white font-bold text-lg mb-1">{item.title}</h3>
              <p className="text-white/70 text-sm">{item.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="flex flex-col sm:flex-row gap-4 w-full max-w-md"
        >
          <Button
            onClick={() => setLocation("/login")}
            size="lg"
            className="flex-1 bg-white text-primary hover:bg-white/90 font-bold text-lg h-14 rounded-xl shadow-xl hover:shadow-2xl transition-all"
          >
            تسجيل الدخول
          </Button>
          <Button
            onClick={() => setLocation("/register")}
            size="lg"
            variant="outline"
            className="flex-1 border-2 border-white text-white hover:bg-white/10 font-bold text-lg h-14 rounded-xl transition-all"
          >
            تسجيل جديد
          </Button>
        </motion.div>

        {/* Bottom text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="text-white/50 text-sm mt-8"
        >
          منصة تعليمية متخصصة في علوم التمريض
        </motion.p>
      </div>
    </div>
  );
}
