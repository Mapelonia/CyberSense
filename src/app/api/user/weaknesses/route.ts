import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getWeakestTactics, getTacticTips } from "@/lib/gamification";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const stats = await prisma.userStats.findUnique({ where: { userId } });

    if (!stats) {
      return NextResponse.json({
        missRates: {
          urgency: 0,
          authority: 0,
          fear: 0,
          curiosity: 0,
          reward: 0,
          trust: 0,
        },
        weakestTactics: [],
        tips: {},
        accuracy: {
          phishing: 0,
          pretexting: 0,
          vishing: 0,
        },
        recentResults: [],
      });
    }

    const missRates = {
      urgency: stats.urgencyMissRate,
      authority: stats.authorityMissRate,
      fear: stats.fearMissRate,
      curiosity: stats.curiosityMissRate,
      reward: stats.rewardMissRate,
      trust: stats.trustMissRate,
    };

    const weakestTactics = getWeakestTactics(missRates);

    const tips: Record<string, string> = {};
    for (const tactic of weakestTactics) {
      tips[tactic] = getTacticTips(tactic);
    }

    const accuracy = {
      phishing: stats.phishingAccuracy,
      pretexting: stats.pretextingAccuracy,
      vishing: stats.vishingAccuracy,
    };

    const recentResults = await prisma.sessionResult.findMany({
      where: { userId },
      orderBy: { completedAt: "desc" },
      take: 10,
      select: {
        userId: true,
        scenarioType: true,
        isCorrect: true,
        tacticsMissed: true,
        completedAt: true,
      },
    });

    return NextResponse.json({
      missRates,
      weakestTactics,
      tips,
      accuracy,
      recentResults,
    });
  } catch (error) {
    console.error("Weaknesses API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch weakness data" },
      { status: 500 }
    );
  }
}
