import { type Tactic } from "./scenario-engine";

// Level definitions
export const LEVELS = [
  { level: 1, name: "Beginner", minXp: 0, icon: "🌱" },
  { level: 2, name: "Novice", minXp: 500, icon: "🛡️" },
  { level: 3, name: "Intermediate", minXp: 1500, icon: "⚔️" },
  { level: 4, name: "Advanced", minXp: 3500, icon: "🔥" },
  { level: 5, name: "Expert", minXp: 7000, icon: "👑" },
] as const;

// Badge definitions
export const BADGES = [
  // Milestone badges
  { id: "first-catch", name: "First Catch", description: "Complete your first scenario", icon: "🎯", category: "milestone", condition: { type: "scenarios_completed", value: 1 }, xpReward: 50 },
  { id: "ten-down", name: "Ten Down", description: "Complete 10 scenarios", icon: "🔟", category: "milestone", condition: { type: "scenarios_completed", value: 10 }, xpReward: 100 },
  { id: "fifty-strong", name: "Fifty Strong", description: "Complete 50 scenarios", icon: "💪", category: "milestone", condition: { type: "scenarios_completed", value: 50 }, xpReward: 250 },
  { id: "centurion", name: "Centurion", description: "Complete 100 scenarios", icon: "🏛️", category: "milestone", condition: { type: "scenarios_completed", value: 100 }, xpReward: 500 },
  
  // Streak badges
  { id: "three-day", name: "Hat Trick", description: "Maintain a 3-day streak", icon: "🔥", category: "streak", condition: { type: "streak", value: 3 }, xpReward: 75 },
  { id: "seven-day", name: "Week Warrior", description: "Maintain a 7-day streak", icon: "⚡", category: "streak", condition: { type: "streak", value: 7 }, xpReward: 150 },
  { id: "thirty-day", name: "Monthly Master", description: "Maintain a 30-day streak", icon: "🌟", category: "streak", condition: { type: "streak", value: 30 }, xpReward: 500 },
  
  // Accuracy badges
  { id: "sharp-eye", name: "Sharp Eye", description: "Get 5 correct answers in a row", icon: "👁️", category: "mastery", condition: { type: "correct_streak", value: 5 }, xpReward: 100 },
  { id: "perfect-ten", name: "Perfect Ten", description: "Get 10 correct answers in a row", icon: "🎯", category: "mastery", condition: { type: "correct_streak", value: 10 }, xpReward: 200 },
  { id: "phish-master", name: "Phish Master", description: "90%+ accuracy in phishing scenarios", icon: "🐟", category: "mastery", condition: { type: "type_accuracy", value: 90, scenarioType: "phishing" }, xpReward: 200 },
  { id: "pretext-pro", name: "Pretext Pro", description: "90%+ accuracy in pretexting scenarios", icon: "🎭", category: "mastery", condition: { type: "type_accuracy", value: 90, scenarioType: "pretexting" }, xpReward: 200 },
  { id: "vish-guard", name: "Vishing Guard", description: "90%+ accuracy in vishing scenarios", icon: "📞", category: "mastery", condition: { type: "type_accuracy", value: 90, scenarioType: "vishing" }, xpReward: 200 },
  
  // Special badges
  { id: "all-types", name: "Well Rounded", description: "Complete at least one of each scenario type", icon: "🌐", category: "special", condition: { type: "all_types_completed" }, xpReward: 150 },
  { id: "speed-demon", name: "Speed Demon", description: "Complete a scenario in under 30 seconds", icon: "⚡", category: "special", condition: { type: "fast_completion", value: 30000 }, xpReward: 100 },
  { id: "flag-finder", name: "Flag Finder", description: "Identify all red flags in a difficult scenario", icon: "🚩", category: "special", condition: { type: "all_flags_found", difficulty: 4 }, xpReward: 200 },
  { id: "level-up-5", name: "Cyber Expert", description: "Reach Level 5 (Expert)", icon: "👑", category: "special", condition: { type: "reach_level", value: 5 }, xpReward: 1000 },
] as const;

// XP calculation
export function calculateXP(params: {
  isCorrect: boolean;
  difficulty: number;
  currentStreak: number;
  flagsCaught: number;
  totalFlags: number;
  timeSpentMs: number;
}): number {
  if (!params.isCorrect) return 10; // Small consolation XP for participation

  const baseXP = 50;
  const difficultyMultiplier = 1 + (params.difficulty - 1) * 0.5; // 1x, 1.5x, 2x, 2.5x, 3x
  const streakBonus = Math.min(params.currentStreak * 0.1, 0.5); // Max 50% streak bonus
  const flagBonus = params.totalFlags > 0
    ? (params.flagsCaught / params.totalFlags) * 0.3
    : 0; // Up to 30% bonus for flags
  const speedBonus = params.timeSpentMs < 60000 ? 0.1 : 0; // 10% bonus for under 1 minute

  const totalMultiplier = difficultyMultiplier * (1 + streakBonus + flagBonus + speedBonus);
  return Math.round(baseXP * totalMultiplier);
}

// Level calculation
export function getLevelForXP(xp: number): { level: number; name: string; icon: string; progress: number; nextLevelXp: number } {
  let currentLevel = LEVELS[0];
  
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXp) {
      currentLevel = LEVELS[i];
      break;
    }
  }

  const nextLevel = LEVELS.find(l => l.level === currentLevel.level + 1);
  const progress = nextLevel
    ? ((xp - currentLevel.minXp) / (nextLevel.minXp - currentLevel.minXp)) * 100
    : 100;

  return {
    level: currentLevel.level,
    name: currentLevel.name,
    icon: currentLevel.icon,
    progress: Math.min(progress, 100),
    nextLevelXp: nextLevel?.minXp || currentLevel.minXp,
  };
}

// Streak calculation
export function calculateStreak(lastActiveDate: Date | null, currentStreak: number): {
  newStreak: number;
  isNewDay: boolean;
} {
  if (!lastActiveDate) {
    return { newStreak: 1, isNewDay: true };
  }

  const now = new Date();
  const last = new Date(lastActiveDate);
  const diffMs = now.getTime() - last.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return { newStreak: currentStreak, isNewDay: false };
  } else if (diffDays === 1) {
    return { newStreak: currentStreak + 1, isNewDay: true };
  } else {
    return { newStreak: 1, isNewDay: true }; // Streak broken
  }
}

// Tactic weakness identification
export function getWeakestTactics(missRates: Record<string, number>): Tactic[] {
  const entries = Object.entries(missRates)
    .filter(([_, rate]) => rate > 0.3) // Only flag tactics with >30% miss rate
    .sort(([_, a], [__, b]) => b - a); // Sort by worst first
  
  return entries.slice(0, 3).map(([tactic]) => tactic as Tactic);
}

export function getTacticTips(tactic: Tactic): string {
  const tips: Record<Tactic, string> = {
    urgency: "Watch for time pressure. Legitimate organizations rarely require instant action. When you see deadlines like 'immediately' or 'within 1 hour,' pause and verify independently.",
    authority: "Question claims of authority. Real officials don't need to threaten or pressure you. Always verify through official channels — not through links or numbers they provide.",
    fear: "Fear is a manipulation tool. When something makes you panic, that's exactly when you should slow down. Take a breath and think: would a legitimate organization communicate this way?",
    curiosity: "If something sounds too intriguing or exclusive, be skeptical. Attackers use 'secret deals' and 'exclusive offers' to make you click before thinking.",
    reward: "Be wary of unexpected rewards. Legitimate winnings require prior entry. Unsolicited gift cards, prizes, and investment returns are almost always scams.",
    trust: "Verify identity independently. Anyone can claim to be from a company. Call back using official numbers, check email domains carefully, and never share credentials with someone who contacted you.",
  };
  return tips[tactic];
}
