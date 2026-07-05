import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getLevelForXP } from "@/lib/gamification";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const stats = await prisma.userStats.findUnique({ where: { userId } });

    if (!stats) {
      const defaultLevelInfo = getLevelForXP(0);
      return NextResponse.json({
        totalXp: 0,
        level: 1,
        currentStreak: 0,
        longestStreak: 0,
        scenariosCompleted: 0,
        correctDecisions: 0,
        totalDecisions: 0,
        levelInfo: defaultLevelInfo,
        earnedBadges: [],
      });
    }

    const levelInfo = getLevelForXP(stats.totalXp);

    const earnedBadges = await prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
    });

    return NextResponse.json({
      totalXp: stats.totalXp,
      level: stats.level,
      currentStreak: stats.currentStreak,
      longestStreak: stats.longestStreak,
      scenariosCompleted: stats.scenariosCompleted,
      correctDecisions: stats.correctDecisions,
      totalDecisions: stats.totalDecisions,
      levelInfo,
      earnedBadges,
    });
  } catch (error) {
    console.error("Stats API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user stats" },
      { status: 500 }
    );
  }
}
