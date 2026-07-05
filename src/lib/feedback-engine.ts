import { type RedFlag, type Tactic } from "./scenario-engine";
import { getTacticTips, getWeakestTactics } from "./gamification";

export interface FeedbackItem {
  flag: RedFlag;
  caught: boolean;
}

export interface AdaptiveFeedback {
  score: number; // 0-100 percentage
  isCorrect: boolean;
  summary: string;
  items: FeedbackItem[];
  tacticsBreakdown: {
    tactic: Tactic;
    caught: number;
    missed: number;
    tip: string;
  }[];
  personalizedTips: string[];
  encouragement: string;
}

export function generateFeedback(params: {
  isCorrect: boolean;
  userFlagIds: string[];
  actualFlags: RedFlag[];
  scenarioType: string;
  difficulty: number;
  userMissRates?: Record<string, number>;
}): AdaptiveFeedback {
  const { isCorrect, userFlagIds, actualFlags, difficulty, userMissRates } = params;

  // Determine which flags were caught and missed
  const items: FeedbackItem[] = actualFlags.map((flag) => ({
    flag,
    caught: userFlagIds.includes(flag.id),
  }));

  const caughtCount = items.filter((i) => i.caught).length;
  const totalFlags = actualFlags.length;
  const score = totalFlags > 0 ? Math.round((caughtCount / totalFlags) * 100) : isCorrect ? 100 : 0;

  // Tactic breakdown
  const tacticMap = new Map<Tactic, { caught: number; missed: number }>();
  items.forEach((item) => {
    const tactic = item.flag.tactic;
    if (!tacticMap.has(tactic)) {
      tacticMap.set(tactic, { caught: 0, missed: 0 });
    }
    const entry = tacticMap.get(tactic)!;
    if (item.caught) {
      entry.caught++;
    } else {
      entry.missed++;
    }
  });

  const tacticsBreakdown = Array.from(tacticMap.entries()).map(([tactic, stats]) => ({
    tactic,
    caught: stats.caught,
    missed: stats.missed,
    tip: stats.missed > 0 ? getTacticTips(tactic) : "",
  }));

  // Personalized tips based on history
  const personalizedTips: string[] = [];
  if (userMissRates) {
    const weakTactics = getWeakestTactics(userMissRates);
    weakTactics.forEach((tactic) => {
      personalizedTips.push(
        `📊 Based on your history, you tend to miss **${tactic}** tactics. ${getTacticTips(tactic)}`
      );
    });
  }

  // Missed tactics in this session
  const missedTactics = tacticsBreakdown.filter((t) => t.missed > 0);
  missedTactics.forEach((t) => {
    if (!personalizedTips.some((tip) => tip.includes(t.tactic))) {
      personalizedTips.push(
        `⚠️ You missed a **${t.tactic}** indicator in this scenario. ${t.tip}`
      );
    }
  });

  // Generate summary
  let summary: string;
  if (isCorrect && score >= 80) {
    summary = "Excellent work! You correctly identified this threat and caught most of the red flags.";
  } else if (isCorrect && score >= 50) {
    summary = "Good job identifying the threat! You caught some red flags but missed a few others.";
  } else if (isCorrect) {
    summary = "You got the right answer, but there were more red flags to catch. Review the breakdown below.";
  } else {
    summary = "This one tricked you. Don't worry — review the red flags below to learn what to watch for next time.";
  }

  // Generate encouragement
  const encouragement = getEncouragement(isCorrect, score, difficulty);

  return {
    score,
    isCorrect,
    summary,
    items,
    tacticsBreakdown,
    personalizedTips,
    encouragement,
  };
}

function getEncouragement(isCorrect: boolean, score: number, difficulty: number): string {
  if (isCorrect && score === 100) {
    const messages = [
      "Perfect score! Your cyber instincts are razor-sharp! 🎯",
      "Flawless detection! Nothing gets past you! 🛡️",
      "100%! You're building serious resilience! 💪",
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }
  if (isCorrect) {
    const messages = [
      "Great catch! Keep sharpening those instincts! 🔥",
      "You spotted the threat — that's what matters! Keep going! ⚡",
      "Nice work! Each scenario makes you stronger! 🌟",
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }
  if (difficulty >= 4) {
    return "That was a tough one! Even experts get tricked by advanced attacks. Learn from this and keep training! 💪";
  }
  const messages = [
    "Don't be discouraged — this is exactly why we practice! You'll catch it next time. 🌱",
    "Every mistake is a learning opportunity. Review the red flags and try again! 📚",
    "Real attackers use these same tricks. Now you'll recognize them in the wild! 🧠",
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}
