import { eq, and, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  platformUsers, InsertPlatformUser, PlatformUser,
  sections, InsertSection,
  lessons, InsertLesson,
  quizzes, InsertQuiz,
  quizQuestions, InsertQuizQuestion,
  quizResults, InsertQuizResult,
  lessonProgress, InsertLessonProgress,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ==================== OAuth Users (template) ====================
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) { values.lastSignedIn = new Date(); }
    if (Object.keys(updateSet).length === 0) { updateSet.lastSignedIn = new Date(); }
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot get user: database not available"); return undefined; }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ==================== Platform Users ====================
export async function createPlatformUser(user: InsertPlatformUser): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(platformUsers).values(user);
  return result[0].insertId;
}

export async function getPlatformUserByUsername(username: string): Promise<PlatformUser | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(platformUsers).where(eq(platformUsers.username, username)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getPlatformUserById(id: number): Promise<PlatformUser | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(platformUsers).where(eq(platformUsers.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updatePlatformUserRole(username: string, role: "student" | "admin" | "super_admin"): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  await db.update(platformUsers).set({ role }).where(eq(platformUsers.username, username));
  return true;
}

export async function getAllPlatformUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(platformUsers);
}

export async function getAdminUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(platformUsers).where(
    sql`${platformUsers.role} IN ('admin', 'super_admin')`
  );
}

// ==================== Sections ====================
export async function getAllSections() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(sections).orderBy(sections.sortOrder);
}

export async function getSectionBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(sections).where(eq(sections.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createSection(section: InsertSection) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(sections).values(section);
  return result[0].insertId;
}

export async function updateSection(id: number, data: Partial<InsertSection>) {
  const db = await getDb();
  if (!db) return;
  await db.update(sections).set(data).where(eq(sections.id, id));
}

export async function deleteSection(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(sections).where(eq(sections.id, id));
}

// ==================== Lessons ====================
export async function getLessonsBySection(sectionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(lessons).where(eq(lessons.sectionId, sectionId)).orderBy(lessons.sortOrder);
}

export async function getLessonById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(lessons).where(eq(lessons.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllLessons() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(lessons).orderBy(lessons.sectionId, lessons.sortOrder);
}

export async function createLesson(lesson: InsertLesson) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(lessons).values(lesson);
  return result[0].insertId;
}

export async function updateLesson(id: number, data: Partial<InsertLesson>) {
  const db = await getDb();
  if (!db) return;
  await db.update(lessons).set(data).where(eq(lessons.id, id));
}

export async function deleteLesson(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(lessons).where(eq(lessons.id, id));
}

// ==================== Quizzes ====================
export async function getQuizByLessonId(lessonId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(quizzes).where(eq(quizzes.lessonId, lessonId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createQuiz(quiz: InsertQuiz) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(quizzes).values(quiz);
  return result[0].insertId;
}

export async function updateQuiz(id: number, data: Partial<InsertQuiz>) {
  const db = await getDb();
  if (!db) return;
  await db.update(quizzes).set(data).where(eq(quizzes.id, id));
}

export async function deleteQuiz(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(quizQuestions).where(eq(quizQuestions.quizId, id));
  await db.delete(quizzes).where(eq(quizzes.id, id));
}

// ==================== Quiz Questions ====================
export async function getQuestionsByQuizId(quizId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(quizQuestions).where(eq(quizQuestions.quizId, quizId)).orderBy(quizQuestions.sortOrder);
}

export async function createQuizQuestion(question: InsertQuizQuestion) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(quizQuestions).values(question);
  return result[0].insertId;
}

export async function updateQuizQuestion(id: number, data: Partial<InsertQuizQuestion>) {
  const db = await getDb();
  if (!db) return;
  await db.update(quizQuestions).set(data).where(eq(quizQuestions.id, id));
}

export async function deleteQuizQuestion(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(quizQuestions).where(eq(quizQuestions.id, id));
}

// ==================== Quiz Results ====================
export async function saveQuizResult(result: InsertQuizResult) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const res = await db.insert(quizResults).values(result);
  return res[0].insertId;
}

export async function getQuizResultsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(quizResults).where(eq(quizResults.userId, userId));
}

export async function getBestQuizResult(userId: number, quizId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(quizResults)
    .where(and(eq(quizResults.userId, userId), eq(quizResults.quizId, quizId)))
    .orderBy(sql`${quizResults.score} DESC`)
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllQuizResults() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(quizResults);
}

// ==================== Lesson Progress ====================
export async function markLessonComplete(userId: number, lessonId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(lessonProgress)
    .where(and(eq(lessonProgress.userId, userId), eq(lessonProgress.lessonId, lessonId)))
    .limit(1);
  if (existing.length > 0) {
    await db.update(lessonProgress).set({ completed: true, completedAt: new Date() })
      .where(eq(lessonProgress.id, existing[0].id));
  } else {
    await db.insert(lessonProgress).values({ userId, lessonId, completed: true, completedAt: new Date() });
  }
}

export async function getUserProgress(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(lessonProgress).where(eq(lessonProgress.userId, userId));
}

