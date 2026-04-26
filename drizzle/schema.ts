import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean as mysqlBoolean } from "drizzle-orm/mysql-core";

// ==================== المستخدمون ====================
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ==================== مستخدمو المنصة (التسجيل المخصص) ====================
export const platformUsers = mysqlTable("platform_users", {
  id: int("id").autoincrement().primaryKey(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  fullName: varchar("fullName", { length: 200 }).notNull(),
  age: int("age").notNull(),
  specialization: varchar("specialization", { length: 200 }).notNull(),
  learningId: varchar("learningId", { length: 100 }).notNull(),
  favoriteSection: varchar("favoriteSection", { length: 200 }).notNull(),
  role: mysqlEnum("platformRole", ["student", "admin", "super_admin"]).default("student").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PlatformUser = typeof platformUsers.$inferSelect;
export type InsertPlatformUser = typeof platformUsers.$inferInsert;

// ==================== الأقسام التعليمية ====================
export const sections = mysqlTable("sections", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  titleAr: varchar("titleAr", { length: 200 }).notNull(),
  titleEn: varchar("titleEn", { length: 200 }),
  descriptionAr: text("descriptionAr"),
  descriptionEn: text("descriptionEn"),
  icon: varchar("icon", { length: 100 }),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Section = typeof sections.$inferSelect;
export type InsertSection = typeof sections.$inferInsert;

// ==================== الدروس ====================
export const lessons = mysqlTable("lessons", {
  id: int("id").autoincrement().primaryKey(),
  sectionId: int("sectionId").notNull(),
  slug: varchar("slug", { length: 200 }).notNull(),
  titleAr: varchar("titleAr", { length: 300 }).notNull(),
  titleEn: varchar("titleEn", { length: 300 }),
  contentAr: text("contentAr").notNull(),
  contentEn: text("contentEn"),
  imageUrl: text("imageUrl"),
  sortOrder: int("sortOrder").default(0).notNull(),
  isPublished: mysqlBoolean("isPublished").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Lesson = typeof lessons.$inferSelect;
export type InsertLesson = typeof lessons.$inferInsert;

// ==================== الاختبارات ====================
export const quizzes = mysqlTable("quizzes", {
  id: int("id").autoincrement().primaryKey(),
  lessonId: int("lessonId").notNull(),
  titleAr: varchar("titleAr", { length: 300 }).notNull(),
  titleEn: varchar("titleEn", { length: 300 }),
  passingScore: int("passingScore").default(60).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Quiz = typeof quizzes.$inferSelect;
export type InsertQuiz = typeof quizzes.$inferInsert;

// ==================== أسئلة الاختبارات ====================
export const quizQuestions = mysqlTable("quiz_questions", {
  id: int("id").autoincrement().primaryKey(),
  quizId: int("quizId").notNull(),
  questionAr: text("questionAr").notNull(),
  questionEn: text("questionEn"),
  optionAAr: varchar("optionAAr", { length: 500 }).notNull(),
  optionBAr: varchar("optionBAr", { length: 500 }).notNull(),
  optionCAr: varchar("optionCAr", { length: 500 }).notNull(),
  optionDAr: varchar("optionDAr", { length: 500 }).notNull(),
  optionAEn: varchar("optionAEn", { length: 500 }),
  optionBEn: varchar("optionBEn", { length: 500 }),
  optionCEn: varchar("optionCEn", { length: 500 }),
  optionDEn: varchar("optionDEn", { length: 500 }),
  correctOption: mysqlEnum("correctOption", ["A", "B", "C", "D"]).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
});

export type QuizQuestion = typeof quizQuestions.$inferSelect;
export type InsertQuizQuestion = typeof quizQuestions.$inferInsert;

// ==================== نتائج الاختبارات ====================
export const quizResults = mysqlTable("quiz_results", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  quizId: int("quizId").notNull(),
  score: int("score").notNull(),
  totalQuestions: int("totalQuestions").notNull(),
  passed: mysqlBoolean("passed").default(false).notNull(),
  completedAt: timestamp("completedAt").defaultNow().notNull(),
});

export type QuizResult = typeof quizResults.$inferSelect;
export type InsertQuizResult = typeof quizResults.$inferInsert;

// ==================== تقدم الدروس ====================
export const lessonProgress = mysqlTable("lesson_progress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  lessonId: int("lessonId").notNull(),
  completed: mysqlBoolean("completed").default(false).notNull(),
  completedAt: timestamp("completedAt"),
});

export type LessonProgress = typeof lessonProgress.$inferSelect;
export type InsertLessonProgress = typeof lessonProgress.$inferInsert;

