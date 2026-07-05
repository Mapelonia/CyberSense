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

    // Get top 50 users by XP
    const topUsers = await prisma.userStats.findMany({
      orderBy: { totalXp: "desc" },
      take: 50,
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
      },
    });

    // Build leaderboard with rank and level info
    const leaderboard = topUsers.map((entry, index) => {
      const levelInfo = getLevelForXP(entry.totalXp);
      return {
        rank: index + 1,
        name: entry.user.name || "Anonymous",
        image: entry.user.image,
        totalXp: entry.totalXp,
        level: levelInfo.level,
        scenariosCompleted: entry.scenariosCompleted,
      };
    });

    // Find current user's rank
    const userStats = await prisma.userStats.findUnique({
      where: { userId },
    });

    let userRank = 0;
    if (userStats) {
      const usersAbove = await prisma.userStats.count({
        where: { totalXp: { gt: userStats.totalXp } },
      });
      userRank = usersAbove + 1;
    }

    return NextResponse.json({ leaderboard, userRank });
  } catch (error) {
    console.error("Leaderboard error:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}
