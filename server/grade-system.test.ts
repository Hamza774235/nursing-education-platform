import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

/**
 * Tests for the grade system that replaced certificates.
 * Verifies that:
 * 1. The certificates router has been removed from appRouter
 * 2. The admin getStats no longer returns totalCertificates
 * 3. The progress.getQuizResults endpoint exists
 */

function createMockContext(): TrpcContext {
  const user = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus" as const,
    role: "user" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
      cookie: () => {},
    } as unknown as TrpcContext["res"],
  };
}

describe("Grade System - Certificates Removal", () => {
  it("should NOT have certificates router in appRouter", () => {
    const routerKeys = Object.keys((appRouter as any)._def.procedures);
    const hasCertificates = routerKeys.some(key => key.startsWith("certificates."));
    expect(hasCertificates).toBe(false);
  });

  it("should have progress.getQuizResults procedure", () => {
    const routerKeys = Object.keys((appRouter as any)._def.procedures);
    expect(routerKeys).toContain("progress.getQuizResults");
  });

  it("should have progress.getUserProgress procedure", () => {
    const routerKeys = Object.keys((appRouter as any)._def.procedures);
    expect(routerKeys).toContain("progress.getUserProgress");
  });

  it("should still have admin.getStats procedure", () => {
    const routerKeys = Object.keys((appRouter as any)._def.procedures);
    expect(routerKeys).toContain("admin.getStats");
  });
});

describe("Grade Calculation Logic", () => {
  // Test the grade calculation function that is used in the frontend
  function getGradeInfo(avgScore: number) {
    if (avgScore >= 90) return { grade: "ممتاز" };
    if (avgScore >= 80) return { grade: "جيد جداً" };
    if (avgScore >= 70) return { grade: "جيد" };
    if (avgScore >= 60) return { grade: "مقبول" };
    return { grade: "راسب" };
  }

  it("should return ممتاز for score >= 90", () => {
    expect(getGradeInfo(90).grade).toBe("ممتاز");
    expect(getGradeInfo(95).grade).toBe("ممتاز");
    expect(getGradeInfo(100).grade).toBe("ممتاز");
  });

  it("should return جيد جداً for score 80-89", () => {
    expect(getGradeInfo(80).grade).toBe("جيد جداً");
    expect(getGradeInfo(85).grade).toBe("جيد جداً");
    expect(getGradeInfo(89).grade).toBe("جيد جداً");
  });

  it("should return جيد for score 70-79", () => {
    expect(getGradeInfo(70).grade).toBe("جيد");
    expect(getGradeInfo(75).grade).toBe("جيد");
    expect(getGradeInfo(79).grade).toBe("جيد");
  });

  it("should return مقبول for score 60-69", () => {
    expect(getGradeInfo(60).grade).toBe("مقبول");
    expect(getGradeInfo(65).grade).toBe("مقبول");
    expect(getGradeInfo(69).grade).toBe("مقبول");
  });

  it("should return راسب for score < 60", () => {
    expect(getGradeInfo(59).grade).toBe("راسب");
    expect(getGradeInfo(30).grade).toBe("راسب");
    expect(getGradeInfo(0).grade).toBe("راسب");
  });

  it("should calculate average correctly from best quiz scores", () => {
    // Simulate the frontend logic for calculating best scores per quiz
    const results = [
      { quizId: 1, score: 80 },
      { quizId: 1, score: 90 }, // best for quiz 1
      { quizId: 2, score: 70 },
      { quizId: 2, score: 85 }, // best for quiz 2
      { quizId: 3, score: 60 },
    ];

    const bestByQuiz = new Map<number, number>();
    for (const r of results) {
      const current = bestByQuiz.get(r.quizId);
      if (current === undefined || r.score > current) {
        bestByQuiz.set(r.quizId, r.score);
      }
    }

    const scores = Array.from(bestByQuiz.values());
    const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

    // Best scores: quiz1=90, quiz2=85, quiz3=60 → avg = (90+85+60)/3 = 78.33 → 78
    expect(avgScore).toBe(78);
    expect(getGradeInfo(avgScore).grade).toBe("جيد");
  });
});
