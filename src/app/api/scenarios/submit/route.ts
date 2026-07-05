import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateFeedback } from "@/lib/feedback-engine";
import { calculateXP, calculateStreak, getLevelForXP } from "@/lib/gamification";
import { generateScenario, type ScenarioType, type RedFlag } from "@/lib/scenario-engine";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();
    const {
      scenarioId,
      scenarioType,
      difficulty,
      decision,
      isCorrect,
      flagsCaught,
      flagsMissed,
      tacticsUsed,
      tacticsMissed,
      timeSpentMs,
      actualFlags,
    } = body;

    // Get user stats
    let stats = await prisma.userStats.findUnique({ where: { userId } });
    if (!stats) {
      stats = await prisma.userStats.create({ data: { userId } });
    }

    // Calculate streak
    const { newStreak, isNewDay } = calculateStreak(stats.lastActiveDate, stats.currentStreak);

    // Calculate XP
    const xpEarned = calculateXP({
      isCorrect,
      difficulty,
      currentStreak: newStreak,
      flagsCaught: flagsCaught.length,
      totalFlags: flagsCaught.length + flagsMissed.length,
      timeSpentMs,
    });

    // Update stats
    const newTotalXp = stats.totalXp + xpEarned;
    const newScenariosCompleted = stats.scenariosCompleted + 1;
    const newCorrectDecisions = stats.correctDecisions + (isCorrect ? 1 : 0);
    const newTotalDecisions = stats.totalDecisions + 1;

    // Update tactic miss rates
    const updateMissRate = (current: number, missed: boolean, total: number) => {
      if (total === 0) return current;
      return current + ((missed ? 1 : 0) - current) / total;
    };

    const missRateUpdates: Record<string, number> = {};
    const tacticTypes = ["urgency", "authority", "fear", "curiosity", "reward", "trust"];
    tacticTypes.forEach((tactic) => {
      const fieldName = `${tactic}MissRate`;
      const wasMissed = tacticsMissed.includes(tactic);
      const wasUsed = tacticsUsed.includes(tactic);
      if (wasUsed) {
        missRateUpdates[fieldName] = updateMissRate(
          (stats as any)[fieldName] || 0,
          wasMissed,
          newTotalDecisions
        );
      }
    });

    // Update type accuracy
    const accuracyField = `${scenarioType}Accuracy`;
    const typeAccuracy = isCorrect
      ? Math.min(((stats as any)[accuracyField] || 0) + 2, 100)
      : Math.max(((stats as any)[accuracyField] || 0) - 5, 0);

    await prisma.userStats.update({
      where: { userId },
      data: {
        totalXp: newTotalXp,
        level: getLevelForXP(newTotalXp).level,
        currentStreak: newStreak,
        longestStreak: Math.max(stats.longestStreak, newStreak),
        lastActiveDate: new Date(),
        scenariosCompleted: newScenariosCompleted,
        correctDecisions: newCorrectDecisions,
        totalDecisions: newTotalDecisions,
        [accuracyField]: typeAccuracy,
        ...missRateUpdates,
      },
    });

    // Save session result
    await prisma.sessionResult.create({
      data: {
        userId,
        scenarioType,
        difficulty,
        templateId: scenarioId,
        userDecision: decision,
        isCorrect,
        xpEarned,
        flagsCaught,
        flagsMissed,
        tacticsUsed,
        tacticsMissed,
        timeSpentMs,
      },
    });

    // Generate feedback
    // Use full red flag data from client if provided, otherwise fall back to IDs-only
    const resolvedFlags: RedFlag[] = actualFlags && actualFlags.length > 0
      ? actualFlags
      : (flagsCaught.concat(flagsMissed)).map((id: string) => ({
          id,
          tactic: tacticsUsed[0] || "trust",
          description: `Suspicious element identified`,
        }));

    const feedback = generateFeedback({
      isCorrect,
      userFlagIds: flagsCaught,
      actualFlags: resolvedFlags,
      scenarioType,
      difficulty,
      userMissRates: {
        urgency: (stats as any).urgencyMissRate || 0,
        authority: (stats as any).authorityMissRate || 0,
        fear: (stats as any).fearMissRate || 0,
        curiosity: (stats as any).curiosityMissRate || 0,
        reward: (stats as any).rewardMissRate || 0,
        trust: (stats as any).trustMissRate || 0,
      },
    });

    return NextResponse.json({
      feedback,
      xpEarned,
      newTotalXp,
      newStreak,
      levelUp: getLevelForXP(newTotalXp).level > stats.level,
    });
  } catch (error) {
    console.error("Submit error:", error);
    return NextResponse.json(
      { error: "Failed to submit results" },
      { status: 500 }
    );
  }
}
