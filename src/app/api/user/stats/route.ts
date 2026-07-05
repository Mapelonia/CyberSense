import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getLevelForXP, BADGES } from "@/lib/gamification";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const userStats = await prisma.userStats.findUnique({ where: { userId } });

    if (!userStats) {
      const defaultLevel = getLevelForXP(0);
      return NextResponse.json({
        stats: {
          streak: 0,
          accuracy: 0,
          completedScenarios: 0,
        },
        levelInfo: {
          name: defaultLevel.name,
          level: defaultLevel.level,
          xp: 0,
          xpToNext: defaultLevel.nextLevelXp,
        },
        earnedBadges: BADGES.map((b) => ({
          id: b.id,
          emoji: b.icon,
          name: b.name,
          earned: false,
        })),
      });
    }

    const levelInfo = getLevelForXP(userStats.totalXp);
    const accuracy =
      userStats.totalDecisions > 0
        ? Math.round((userStats.correctDecisions / userStats.totalDecisions) * 100)
        : 0;

    // Get earned badge IDs
    const earnedUserBadges = await prisma.userBadge.findMany({
      where: { userId },
      select: { badgeId: true },
    });
    const earnedBadgeIds = new Set(earnedUserBadges.map((b) => b.badgeId));

    // Map all badges with earned status
    const allBadges = BADGES.map((b) => ({
      id: b.id,
      emoji: b.icon,
      name: b.name,
      earned: earnedBadgeIds.has(b.id),
    }));

    return NextResponse.json({
      stats: {
        streak: userStats.currentStreak,
        accuracy,
        completedScenarios: userStats.scenariosCompleted,
      },
      levelInfo: {
        name: levelInfo.name,
        level: levelInfo.level,
        xp: userStats.totalXp,
        xpToNext: levelInfo.nextLevelXp,
      },
      earnedBadges: allBadges,
    });
  } catch (error) {
    console.error("Stats API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user stats" },
      { status: 500 }
    );
  }
}
