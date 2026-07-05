import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getWeakestTactics, getTacticTips } from "@/lib/gamification";

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "yesterday";
  return `${diffDays}d ago`;
}

function mapDifficulty(difficulty: number): "Easy" | "Medium" | "Hard" {
  if (difficulty <= 2) return "Easy";
  if (difficulty <= 3) return "Medium";
  return "Hard";
}

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
        weakestTactics: [],
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

    // Get weakest tactics as string array, then map to dashboard format
    const weakTacticNames = getWeakestTactics(missRates);

    const weakestTactics = weakTacticNames.map((tactic) => ({
      name: tactic.charAt(0).toUpperCase() + tactic.slice(1),
      missRate: Math.round((missRates[tactic as keyof typeof missRates] || 0) * 100),
      tip: getTacticTips(tactic),
    }));

    // Get recent results in the format the dashboard expects
    const rawResults = await prisma.sessionResult.findMany({
      where: { userId },
      orderBy: { completedAt: "desc" },
      take: 10,
      select: {
        id: true,
        scenarioType: true,
        isCorrect: true,
        difficulty: true,
        completedAt: true,
      },
    });

    const recentResults = rawResults.map((r) => ({
      id: r.id,
      type: r.scenarioType as "phishing" | "pretexting" | "vishing",
      correct: r.isCorrect,
      timeAgo: formatTimeAgo(r.completedAt),
      difficulty: mapDifficulty(r.difficulty),
    }));

    return NextResponse.json({
      weakestTactics,
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
