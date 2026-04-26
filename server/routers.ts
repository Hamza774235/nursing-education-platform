import { COOKIE_NAME, PLATFORM_COOKIE_NAME, SUPER_ADMIN_USERNAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { ENV } from "./_core/env";
import * as db from "./db";

// ==================== JWT helpers for platform auth ====================
const PLATFORM_SECRET = new TextEncoder().encode(ENV.cookieSecret || "nursing-platform-secret-key-2024");

async function signPlatformToken(userId: number, username: string, role: string): Promise<string> {
  return new SignJWT({ userId, username, role })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(Math.floor((Date.now() + 365 * 24 * 60 * 60 * 1000) / 1000))
    .sign(PLATFORM_SECRET);
}

async function verifyPlatformToken(token: string): Promise<{ userId: number; username: string; role: string } | null> {
  try {
    const { payload } = await jwtVerify(token, PLATFORM_SECRET, { algorithms: ["HS256"] });
    return { userId: payload.userId as number, username: payload.username as string, role: payload.role as string };
  } catch {
    return null;
  }
}

// ==================== Platform Auth Router ====================
const platformAuthRouter = router({
  register: publicProcedure
    .input(z.object({
      username: z.string().min(3).max(50),
      password: z.string().min(6).max(100),
      fullName: z.string().min(2).max(200),
      age: z.number().min(15).max(100),
      specialization: z.string().min(1).max(200),
      learningId: z.string().min(1).max(100),
      favoriteSection: z.string().min(1).max(200),
    }))
    .mutation(async ({ input, ctx }) => {
      // Check if username already exists
      const existing = await db.getPlatformUserByUsername(input.username);
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "اسم المستخدم موجود بالفعل" });
      }

      // Determine role based on username
      let role: "student" | "admin" | "super_admin" = "student";
      if (input.username === SUPER_ADMIN_USERNAME) {
        role = "super_admin";
      }

      const passwordHash = await bcrypt.hash(input.password, 12);
      const userId = await db.createPlatformUser({
        username: input.username,
        passwordHash,
        fullName: input.fullName,
        age: input.age,
        specialization: input.specialization,
        learningId: input.learningId,
        favoriteSection: input.favoriteSection,
        role,
      });

      // Create session token
      const token = await signPlatformToken(userId, input.username, role);
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(PLATFORM_COOKIE_NAME, token, {
        ...cookieOptions,
        maxAge: 365 * 24 * 60 * 60 * 1000,
      });

      return { success: true, userId, role };
    }),

  login: publicProcedure
    .input(z.object({
      username: z.string().min(1),
      password: z.string().min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      const user = await db.getPlatformUserByUsername(input.username);
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "اسم المستخدم أو كلمة المرور غير صحيحة" });
      }

      const valid = await bcrypt.compare(input.password, user.passwordHash);
      if (!valid) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "اسم المستخدم أو كلمة المرور غير صحيحة" });
      }

      const token = await signPlatformToken(user.id, user.username, user.role);
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(PLATFORM_COOKIE_NAME, token, {
        ...cookieOptions,
        maxAge: 365 * 24 * 60 * 60 * 1000,
      });

      return { success: true, userId: user.id, role: user.role, fullName: user.fullName };
    }),

  me: publicProcedure.query(async ({ ctx }) => {
    const cookieHeader = ctx.req.headers.cookie;
    if (!cookieHeader) return null;
    const cookies = Object.fromEntries(
      cookieHeader.split(";").map(c => {
        const [k, ...v] = c.trim().split("=");
        return [k, v.join("=")];
      })
    );
    const token = cookies[PLATFORM_COOKIE_NAME];
    if (!token) return null;

    const payload = await verifyPlatformToken(token);
    if (!payload) return null;

    const user = await db.getPlatformUserById(payload.userId);
    if (!user) return null;

    return {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      age: user.age,
      specialization: user.specialization,
      learningId: user.learningId,
      favoriteSection: user.favoriteSection,
      role: user.role,
    };
  }),

  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(PLATFORM_COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true };
  }),
});

// ==================== Helper to get platform user from request ====================
async function getPlatformUserFromReq(req: any) {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((c: string) => {
      const [k, ...v] = c.trim().split("=");
      return [k, v.join("=")];
    })
  );
  const token = cookies[PLATFORM_COOKIE_NAME];
  if (!token) return null;
  const payload = await verifyPlatformToken(token);
  if (!payload) return null;
  return db.getPlatformUserById(payload.userId);
}

// ==================== Sections Router ====================
const sectionsRouter = router({
  list: publicProcedure.query(async () => {
    return db.getAllSections();
  }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      return db.getSectionBySlug(input.slug);
    }),

  create: publicProcedure
    .input(z.object({
      slug: z.string(),
      titleAr: z.string(),
      titleEn: z.string().optional(),
      descriptionAr: z.string().optional(),
      descriptionEn: z.string().optional(),
      icon: z.string().optional(),
      sortOrder: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const user = await getPlatformUserFromReq(ctx.req);
      if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
        throw new TRPCError({ code: "FORBIDDEN", message: "ليس لديك صلاحية" });
      }
      return db.createSection(input);
    }),

  update: publicProcedure
    .input(z.object({
      id: z.number(),
      titleAr: z.string().optional(),
      titleEn: z.string().optional(),
      descriptionAr: z.string().optional(),
      descriptionEn: z.string().optional(),
      icon: z.string().optional(),
      sortOrder: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const user = await getPlatformUserFromReq(ctx.req);
      if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
        throw new TRPCError({ code: "FORBIDDEN", message: "ليس لديك صلاحية" });
      }
      const { id, ...data } = input;
      await db.updateSection(id, data);
      return { success: true };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const user = await getPlatformUserFromReq(ctx.req);
      if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
        throw new TRPCError({ code: "FORBIDDEN", message: "ليس لديك صلاحية" });
      }
      await db.deleteSection(input.id);
      return { success: true };
    }),
});

// ==================== Lessons Router ====================
const lessonsRouter = router({
  listBySection: publicProcedure
    .input(z.object({ sectionId: z.number() }))
    .query(async ({ input }) => {
      return db.getLessonsBySection(input.sectionId);
    }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return db.getLessonById(input.id);
    }),

  listAll: publicProcedure.query(async () => {
    return db.getAllLessons();
  }),

  create: publicProcedure
    .input(z.object({
      sectionId: z.number(),
      slug: z.string(),
      titleAr: z.string(),
      titleEn: z.string().optional(),
      contentAr: z.string(),
      contentEn: z.string().optional(),
      imageUrl: z.string().optional(),
      sortOrder: z.number().optional(),
      isPublished: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const user = await getPlatformUserFromReq(ctx.req);
      if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
        throw new TRPCError({ code: "FORBIDDEN", message: "ليس لديك صلاحية" });
      }
      return db.createLesson(input);
    }),

  update: publicProcedure
    .input(z.object({
      id: z.number(),
      titleAr: z.string().optional(),
      titleEn: z.string().optional(),
      contentAr: z.string().optional(),
      contentEn: z.string().optional(),
      imageUrl: z.string().optional(),
      sortOrder: z.number().optional(),
      isPublished: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const user = await getPlatformUserFromReq(ctx.req);
      if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
        throw new TRPCError({ code: "FORBIDDEN", message: "ليس لديك صلاحية" });
      }
      const { id, ...data } = input;
      await db.updateLesson(id, data);
      return { success: true };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const user = await getPlatformUserFromReq(ctx.req);
      if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
        throw new TRPCError({ code: "FORBIDDEN", message: "ليس لديك صلاحية" });
      }
      await db.deleteLesson(input.id);
      return { success: true };
    }),
});

// ==================== Quizzes Router ====================
const quizzesRouter = router({
  getByLesson: publicProcedure
    .input(z.object({ lessonId: z.number() }))
    .query(async ({ input }) => {
      const quiz = await db.getQuizByLessonId(input.lessonId);
      if (!quiz) return null;
      const questions = await db.getQuestionsByQuizId(quiz.id);
      return { ...quiz, questions };
    }),

  submit: publicProcedure
    .input(z.object({
      quizId: z.number(),
      answers: z.array(z.object({
        questionId: z.number(),
        selectedOption: z.enum(["A", "B", "C", "D"]),
      })),
    }))
    .mutation(async ({ input, ctx }) => {
      const user = await getPlatformUserFromReq(ctx.req);
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED", message: "يجب تسجيل الدخول" });

      const questions = await db.getQuestionsByQuizId(input.quizId);
      let correct = 0;
      for (const answer of input.answers) {
        const q = questions.find(q => q.id === answer.questionId);
        if (q && q.correctOption === answer.selectedOption) correct++;
      }

      const score = Math.round((correct / questions.length) * 100);
      const quiz = await db.getQuizByLessonId(0); // we need quiz info
      const quizData = questions.length > 0 ? await (async () => {
        const dbObj = await db.getDb();
        if (!dbObj) return null;
        const { quizzes } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const res = await dbObj.select().from(quizzes).where(eq(quizzes.id, input.quizId)).limit(1);
        return res[0] || null;
      })() : null;

      const passingScore = quizData?.passingScore ?? 60;
      const passed = score >= passingScore;

      await db.saveQuizResult({
        userId: user.id,
        quizId: input.quizId,
        score,
        totalQuestions: questions.length,
        passed,
      });

      return { score, totalQuestions: questions.length, correct, passed };
    }),

  createQuiz: publicProcedure
    .input(z.object({
      lessonId: z.number(),
      titleAr: z.string(),
      titleEn: z.string().optional(),
      passingScore: z.number().optional(),
      questions: z.array(z.object({
        questionAr: z.string(),
        questionEn: z.string().optional(),
        optionAAr: z.string(),
        optionBAr: z.string(),
        optionCAr: z.string(),
        optionDAr: z.string(),
        optionAEn: z.string().optional(),
        optionBEn: z.string().optional(),
        optionCEn: z.string().optional(),
        optionDEn: z.string().optional(),
        correctOption: z.enum(["A", "B", "C", "D"]),
      })),
    }))
    .mutation(async ({ input, ctx }) => {
      const user = await getPlatformUserFromReq(ctx.req);
      if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
        throw new TRPCError({ code: "FORBIDDEN", message: "ليس لديك صلاحية" });
      }
      const quizId = await db.createQuiz({
        lessonId: input.lessonId,
        titleAr: input.titleAr,
        titleEn: input.titleEn,
        passingScore: input.passingScore ?? 60,
      });
      for (let i = 0; i < input.questions.length; i++) {
        await db.createQuizQuestion({ ...input.questions[i], quizId, sortOrder: i });
      }
      return { quizId };
    }),

  deleteQuiz: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const user = await getPlatformUserFromReq(ctx.req);
      if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
        throw new TRPCError({ code: "FORBIDDEN", message: "ليس لديك صلاحية" });
      }
      await db.deleteQuiz(input.id);
      return { success: true };
    }),
});

// ==================== Progress Router ====================
const progressRouter = router({
  markComplete: publicProcedure
    .input(z.object({ lessonId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const user = await getPlatformUserFromReq(ctx.req);
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED", message: "يجب تسجيل الدخول" });
      await db.markLessonComplete(user.id, input.lessonId);
      return { success: true };
    }),

  getUserProgress: publicProcedure.query(async ({ ctx }) => {
    const user = await getPlatformUserFromReq(ctx.req);
    if (!user) return [];
    return db.getUserProgress(user.id);
  }),

  getQuizResults: publicProcedure.query(async ({ ctx }) => {
    const user = await getPlatformUserFromReq(ctx.req);
    if (!user) return [];
    return db.getQuizResultsByUser(user.id);
  }),
});

// ==================== Admin Router ====================
const adminRouter = router({
  getStats: publicProcedure.query(async ({ ctx }) => {
    const user = await getPlatformUserFromReq(ctx.req);
    if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
      throw new TRPCError({ code: "FORBIDDEN", message: "ليس لديك صلاحية" });
    }
    const allUsers = await db.getAllPlatformUsers();
    const allSections = await db.getAllSections();
    const allLessons = await db.getAllLessons();
    const allResults = await db.getAllQuizResults();

    return {
      totalStudents: allUsers.filter(u => u.role === "student").length,
      totalAdmins: allUsers.filter(u => u.role === "admin" || u.role === "super_admin").length,
      totalSections: allSections.length,
      totalLessons: allLessons.length,
      totalQuizResults: allResults.length,
      averageScore: allResults.length > 0 ? Math.round(allResults.reduce((a, b) => a + b.score, 0) / allResults.length) : 0,
    };
  }),

  getStudents: publicProcedure.query(async ({ ctx }) => {
    const user = await getPlatformUserFromReq(ctx.req);
    if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
      throw new TRPCError({ code: "FORBIDDEN", message: "ليس لديك صلاحية" });
    }
    const allUsers = await db.getAllPlatformUsers();
    return allUsers.map(u => ({
      id: u.id,
      username: u.username,
      fullName: u.fullName,
      specialization: u.specialization,
      role: u.role,
      createdAt: u.createdAt,
    }));
  }),

  promoteToAdmin: publicProcedure
    .input(z.object({ username: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const user = await getPlatformUserFromReq(ctx.req);
      if (!user || user.role !== "super_admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "فقط المشرف الرئيسي يمكنه إضافة مشرفين" });
      }
      const target = await db.getPlatformUserByUsername(input.username);
      if (!target) throw new TRPCError({ code: "NOT_FOUND", message: "المستخدم غير موجود" });
      if (target.role === "super_admin") throw new TRPCError({ code: "BAD_REQUEST", message: "لا يمكن تغيير صلاحية المشرف الرئيسي" });
      await db.updatePlatformUserRole(input.username, "admin");
      return { success: true };
    }),

  demoteToStudent: publicProcedure
    .input(z.object({ username: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const user = await getPlatformUserFromReq(ctx.req);
      if (!user || user.role !== "super_admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "فقط المشرف الرئيسي يمكنه إزالة مشرفين" });
      }
      const target = await db.getPlatformUserByUsername(input.username);
      if (!target) throw new TRPCError({ code: "NOT_FOUND", message: "المستخدم غير موجود" });
      if (target.role === "super_admin") throw new TRPCError({ code: "BAD_REQUEST", message: "لا يمكن تغيير صلاحية المشرف الرئيسي" });
      await db.updatePlatformUserRole(input.username, "student");
      return { success: true };
    }),

  getAdmins: publicProcedure.query(async ({ ctx }) => {
    const user = await getPlatformUserFromReq(ctx.req);
    if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
      throw new TRPCError({ code: "FORBIDDEN", message: "ليس لديك صلاحية" });
    }
    return db.getAdminUsers();
  }),

  getStudentResults: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input, ctx }) => {
      const user = await getPlatformUserFromReq(ctx.req);
      if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
        throw new TRPCError({ code: "FORBIDDEN", message: "ليس لديك صلاحية" });
      }
      const results = await db.getQuizResultsByUser(input.userId);
      const progress = await db.getUserProgress(input.userId);
      return { results, progress };
    }),
});


// ==================== Main Router ====================
export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  platformAuth: platformAuthRouter,
  sections: sectionsRouter,
  lessons: lessonsRouter,
  quizzes: quizzesRouter,
  progress: progressRouter,
  admin: adminRouter,

});

export type AppRouter = typeof appRouter;
