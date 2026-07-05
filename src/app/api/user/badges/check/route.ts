import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { BADGES, getLevelForXP } from "@/lib/gamification";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Get user stats
    const stats = await prisma.userStats.findUnique({ where: { userId } });
    if (!stats) {
      return NextResponse.json({ newBadges: [] });
    }

    // Get already earned badge IDs
    const earnedBadges = await prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
    });
    const earnedBadgeNames = new Set(earnedBadges.map((eb) => eb.badge.name));

    // Check scenario type completion for all_types_completed
    const typeCounts = await prisma.sessionResult.groupBy({
      by: ["scenarioType"],
      where: { userId },
      _count: { id: true },
    });
    const completedTypes = typeCounts.map((t) => t.scenarioType);

    // Check for correct streak (consecutive correct decisions)
    const recentResults = await prisma.sessionResult.findMany({
      where: { userId },
      orderBy: { completedAt: "desc" },
      take: 20,
      select: { isCorrect: true },
    });
    let correctStreak = 0;
    for (const result of recentResults) {
      if (result.isCorrect) {
        correctStreak++;
      } else {
        break;
      }
    }

    // Check for fast completion
    const fastResult = await prisma.sessionResult.findFirst({
      where: { userId, timeSpentMs: { lt: 30000 }, isCorrect: true },
    });

    // Check for all flags found in a difficult scenario
    const allFlagsResult = await prisma.sessionResult.findFirst({
      where: {
        userId,
        difficulty: { gte: 4 },
        flagsMissed: { isEmpty: true },
        isCorrect: true,
      },
    });

    const levelInfo = getLevelForXP(stats.totalXp);

    // Check each badge condition
    const newlyEarnedBadges: typeof BADGES[number][] = [];

    for (const badge of BADGES) {
      // Skip if already earned
      if (earnedBadgeNames.has(badge.name)) continue;

      let earned = false;
      const condition = badge.condition;

      switch (condition.type) {
        case "scenarios_completed":
          earned = stats.scenariosCompleted >= condition.value;
          break;

        case "streak":
          earned = stats.currentStreak >= condition.value || stats.longestStreak >= condition.value;
          break;

        case "correct_streak":
          earned = correctStreak >= condition.value;
          break;

        case "type_accuracy": {
          const accuracyField = `${condition.scenarioType}Accuracy` as keyof typeof stats;
          const accuracy = (stats[accuracyField] as number) || 0;
          earned = accuracy >= condition.value;
          break;
        }

        case "all_types_completed":
          earned =
            completedTypes.includes("phishing") &&
            completedTypes.includes("pretexting") &&
            completedTypes.includes("vishing");
          break;

        case "fast_completion":
          earned = fastResult !== null;
          break;

        case "all_flags_found":
          earned = allFlagsResult !== null;
          break;

        case "reach_level":
          earned = levelInfo.level >= condition.value;
          break;
      }

      if (earned) {
        newlyEarnedBadges.push(badge);
      }
    }

    // Create UserBadge records for newly earned badges
    for (const badge of newlyEarnedBadges) {
      // Find or create the Badge record in the database
      let dbBadge = await prisma.badge.findUnique({
        where: { name: badge.name },
      });

      if (!dbBadge) {
        dbBadge = await prisma.badge.create({
          data: {
            name: badge.name,
            description: badge.description,
            icon: badge.icon,
            category: badge.category,
            condition: JSON.stringify(badge.condition),
            xpReward: badge.xpReward,
          },
        });
      }

      await prisma.userBadge.create({
        data: {
          userId,
          badgeId: dbBadge.id,
        },
      });

      // Award bonus XP for earning the badge
      await prisma.userStats.update({
        where: { userId },
        data: {
          totalXp: { increment: badge.xpReward },
        },
      });
    }

    return NextResponse.json({
      newBadges: newlyEarnedBadges.map((b) => ({
        id: b.id,
        name: b.name,
        description: b.description,
        icon: b.icon,
        category: b.category,
        xpReward: b.xpReward,
      })),
    });
  } catch (error) {
    console.error("Badge check error:", error);
    return NextResponse.json(
      { error: "Failed to check badges" },
      { status: 500 }
    );
  }
}
