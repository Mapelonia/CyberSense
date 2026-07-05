'use client'

import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import {
  Shield,
  Mail,
  Phone,
  MessageSquare,
  Trophy,
  Flame,
  Target,
  BarChart3,
  ArrowRight,
  Lock,
  LogOut,
  Loader2,
} from 'lucide-react'

interface LevelInfo {
  name: string
  level: number
  xp: number
  xpToNext: number
}

interface Stats {
  streak: number
  accuracy: number
  completedScenarios: number
}

interface Badge {
  id: string
  emoji: string
  name: string
  earned: boolean
}

interface WeakTactic {
  name: string
  missRate: number
  tip: string
}

interface RecentResult {
  id: string
  type: 'phishing' | 'pretexting' | 'vishing'
  correct: boolean
  timeAgo: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [stats, setStats] = useState<Stats | null>(null)
  const [levelInfo, setLevelInfo] = useState<LevelInfo | null>(null)
  const [earnedBadges, setEarnedBadges] = useState<Badge[]>([])
  const [weakestTactics, setWeakestTactics] = useState<WeakTactic[]>([])
  const [recentResults, setRecentResults] = useState<RecentResult[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  async function fetchData() {
    try {
      const [statsRes, weaknessRes] = await Promise.all([
        fetch('/api/user/stats'),
        fetch('/api/user/weaknesses'),
      ])

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData.stats)
        setLevelInfo(statsData.levelInfo)
        setEarnedBadges(statsData.earnedBadges)
      }

      if (weaknessRes.ok) {
        const weaknessData = await weaknessRes.json()
        setWeakestTactics(weaknessData.weakestTactics ?? [])
        setRecentResults(weaknessData.recentResults ?? [])
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-950 cyber-grid flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          <p className="text-cyan-400 text-sm">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!session) return null

  const userName = session.user?.name ?? 'Agent'
  const xpProgress = levelInfo
    ? Math.round((levelInfo.xp / levelInfo.xpToNext) * 100)
    : 0

  const typeIcons: Record<string, React.ReactNode> = {
    phishing: <Mail className="h-4 w-4" />,
    pretexting: <MessageSquare className="h-4 w-4" />,
    vishing: <Phone className="h-4 w-4" />,
  }

  return (
    <div className="min-h-screen bg-gray-950 cyber-grid">
      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-cyan-900/50 bg-gray-950/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-cyan-400" />
            <span className="text-xl font-bold text-white tracking-tight">
              CyberSense
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-300 hidden sm:inline">
              Welcome, <span className="text-cyan-400 font-medium">{userName}</span>
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-gray-400 hover:text-white hover:bg-gray-800"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-6xl mx-auto px-4 pt-24 pb-12 space-y-8">
        {/* STATS OVERVIEW */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-4">Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Level Card */}
            <Card className="bg-gray-900/80 border-cyan-900/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-400" />
                  Level
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-white">
                  {levelInfo?.name ?? 'Novice'}
                </p>
                <p className="text-xs text-gray-500 mb-2">
                  {levelInfo?.xp ?? 0} / {levelInfo?.xpToNext ?? 100} XP
                </p>
                <Progress value={xpProgress} className="h-2" />
              </CardContent>
            </Card>

            {/* Streak Card */}
            <Card className="bg-gray-900/80 border-cyan-900/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-400" />
                  Streak
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-white">
                  {stats?.streak ?? 0}
                  <span className="text-sm font-normal text-gray-400 ml-1">days</span>
                </p>
              </CardContent>
            </Card>

            {/* Accuracy Card */}
            <Card className="bg-gray-900/80 border-cyan-900/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                  <Target className="h-4 w-4 text-green-400" />
                  Accuracy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-white">
                  {stats?.accuracy ?? 0}%
                </p>
              </CardContent>
            </Card>

            {/* Scenarios Card */}
            <Card className="bg-gray-900/80 border-cyan-900/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-purple-400" />
                  Scenarios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-white">
                  {stats?.completedScenarios ?? 0}
                  <span className="text-sm font-normal text-gray-400 ml-1">completed</span>
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* QUICK START */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-4">Quick Start</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="bg-gray-900/80 border-cyan-900/40 hover:border-cyan-500/60 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Mail className="h-5 w-5 text-cyan-400" />
                  Phishing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-400">
                  Identify fraudulent emails and malicious links in simulated inbox scenarios.
                </p>
                <Link href="/simulate/phishing">
                  <Button size="sm" className="w-full bg-cyan-600 hover:bg-cyan-500 text-white">
                    Start Training
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/80 border-cyan-900/40 hover:border-cyan-500/60 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <MessageSquare className="h-5 w-5 text-cyan-400" />
                  Pretexting
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-400">
                  Detect social engineering attempts through fabricated scenarios and impersonation.
                </p>
                <Link href="/simulate/pretexting">
                  <Button size="sm" className="w-full bg-cyan-600 hover:bg-cyan-500 text-white">
                    Start Training
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/80 border-cyan-900/40 hover:border-cyan-500/60 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Phone className="h-5 w-5 text-cyan-400" />
                  Vishing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-400">
                  Recognize voice-based social engineering attacks and phone scam tactics.
                </p>
                <Link href="/simulate/vishing">
                  <Button size="sm" className="w-full bg-cyan-600 hover:bg-cyan-500 text-white">
                    Start Training
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* WEAK AREAS */}
        {weakestTactics.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-white mb-4">Weak Areas</h2>
            <Card className="bg-gray-900/80 border-cyan-900/40">
              <CardContent className="pt-6 space-y-4">
                {weakestTactics.slice(0, 3).map((tactic, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white">
                        {tactic.name}
                      </span>
                      <span className="text-sm text-red-400 font-mono">
                        {tactic.missRate}% miss rate
                      </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2.5">
                      <div
                        className={cn(
                          'h-2.5 rounded-full',
                          tactic.missRate >= 70
                            ? 'bg-red-500'
                            : tactic.missRate >= 40
                              ? 'bg-yellow-500'
                              : 'bg-orange-400'
                        )}
                        style={{ width: `${tactic.missRate}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 italic">💡 {tactic.tip}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>
        )}

        {/* RECENT ACTIVITY */}
        {recentResults.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
            <Card className="bg-gray-900/80 border-cyan-900/40">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {recentResults.slice(0, 5).map((result) => (
                    <div
                      key={result.id}
                      className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-cyan-400">
                          {typeIcons[result.type]}
                        </div>
                        <span className="text-sm text-white capitalize">
                          {result.type}
                        </span>
                        <span
                          className={cn(
                            'text-xs px-2 py-0.5 rounded-full font-medium',
                            result.correct
                              ? 'bg-green-900/50 text-green-400'
                              : 'bg-red-900/50 text-red-400'
                          )}
                        >
                          {result.correct ? 'Correct' : 'Incorrect'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            'text-xs px-2 py-0.5 rounded font-medium',
                            result.difficulty === 'Easy'
                              ? 'text-green-400'
                              : result.difficulty === 'Medium'
                                ? 'text-yellow-400'
                                : 'text-red-400'
                          )}
                        >
                          {result.difficulty}
                        </span>
                        <span className="text-xs text-gray-500">
                          {result.timeAgo}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* BADGES SHOWCASE */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-4">Badges</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {earnedBadges.map((badge) => (
              <Card
                key={badge.id}
                className={cn(
                  'bg-gray-900/80 border-cyan-900/40 text-center',
                  !badge.earned && 'opacity-50 grayscale'
                )}
              >
                <CardContent className="pt-4 pb-3 flex flex-col items-center gap-1">
                  {badge.earned ? (
                    <span className="text-3xl">{badge.emoji}</span>
                  ) : (
                    <div className="relative">
                      <span className="text-3xl opacity-30">{badge.emoji}</span>
                      <Lock className="h-4 w-4 text-gray-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                  )}
                  <span
                    className={cn(
                      'text-xs font-medium',
                      badge.earned ? 'text-white' : 'text-gray-600'
                    )}
                  >
                    {badge.name}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
