export const ACHIEVEMENTS = [
  { id: 'sprout', title: 'First Sprout', description: 'Check in your very first habit', icon: 'sprout', rarity: 'common', metric: 'checkins', threshold: 1 },
  { id: 'streak_3', title: 'Tender Shoot', description: 'Keep a 3 day streak alive', icon: 'leaf', rarity: 'common', metric: 'streak', threshold: 3 },
  { id: 'streak_7', title: 'Week Warrior', description: 'Reach a 7 day streak', icon: 'flame', rarity: 'common', metric: 'streak', threshold: 7 },
  { id: 'checkins_30', title: 'Thirty Strong', description: 'Log 30 check-ins in total', icon: 'medal', rarity: 'common', metric: 'checkins', threshold: 30 },
  { id: 'streak_14', title: 'Fortnight Forge', description: 'Reach a 14 day streak', icon: 'chain', rarity: 'rare', metric: 'streak', threshold: 14 },
  { id: 'streak_21', title: 'Habit Wired', description: 'Reach a 21 day streak', icon: 'brain', rarity: 'rare', metric: 'streak', threshold: 21 },
  { id: 'perfect_day', title: 'Full Canopy', description: 'Complete every habit on a single day', icon: 'tree', rarity: 'rare', metric: 'perfectDays', threshold: 1 },
  { id: 'early_bird', title: 'Early Bird', description: 'Check in before 8am, 10 separate mornings', icon: 'sunrise', rarity: 'rare', metric: 'earlyCheckins', threshold: 10 },
  { id: 'streak_30', title: 'Moon Cycle', description: 'Reach a 30 day streak', icon: 'moon', rarity: 'epic', metric: 'streak', threshold: 30 },
  { id: 'checkins_100', title: 'Century Log', description: 'Log 100 check-ins in total', icon: 'star', rarity: 'epic', metric: 'checkins', threshold: 100 },
  { id: 'garden', title: 'Living Garden', description: 'Grow 5 habits at the same time', icon: 'flower', rarity: 'epic', metric: 'activeHabits', threshold: 5 },
  { id: 'streak_50', title: 'Deep Roots', description: 'Reach a 50 day streak', icon: 'anchor', rarity: 'epic', metric: 'streak', threshold: 50 },
  { id: 'streak_100', title: 'Century Club', description: 'Reach a 100 day streak', icon: 'trophy', rarity: 'legendary', metric: 'streak', threshold: 100 },
  { id: 'perfect_week', title: 'Perfect Week', description: 'Finish every habit 7 days in a row', icon: 'sparkle', rarity: 'legendary', metric: 'perfectWeeks', threshold: 1 },
  { id: 'streak_180', title: 'Iron Will', description: 'Reach a 180 day streak', icon: 'shield', rarity: 'legendary', metric: 'streak', threshold: 180 },
  { id: 'checkins_1000', title: 'Evergreen', description: 'Log 1000 check-ins in total', icon: 'pine', rarity: 'legendary', metric: 'checkins', threshold: 1000 },
  { id: 'streak_365', title: 'Full Year Forest', description: 'Reach a 365 day streak', icon: 'crown', rarity: 'mythic', metric: 'streak', threshold: 365 },
];

export const ACHIEVEMENT_BY_ID = new Map(ACHIEVEMENTS.map((entry) => [entry.id, entry]));

export const RARITY_ORDER = ['common', 'rare', 'epic', 'legendary', 'mythic'];

export function achievementProgress(def, stats) {
  if (def.metric === 'streak') return Math.max(stats.longestStreak, stats.currentStreak);
  if (def.metric === 'checkins') return stats.totalCompleted;
  if (def.metric === 'perfectDays') return stats.perfectDays;
  if (def.metric === 'perfectWeeks') return stats.perfectWeeks;
  if (def.metric === 'earlyCheckins') return stats.earlyCheckins;
  if (def.metric === 'activeHabits') return stats.activeHabits;
  return 0;
}

export function evaluateAchievements({ alreadyUnlocked, habitRows, totals }) {
  const unlockedKeys = new Set(alreadyUnlocked.map((entry) => `${entry.achievementId}::${entry.habitId ?? 'user'}`));
  const earned = [];

  for (const def of ACHIEVEMENTS) {
    if (def.metric === 'streak') {
      for (const habit of habitRows) {
        const best = Math.max(habit.stats.longestStreak, habit.stats.currentStreak);
        if (best >= def.threshold && !unlockedKeys.has(`${def.id}::${habit.id}`)) {
          earned.push({ achievementId: def.id, habitId: habit.id, streakLength: best });
          unlockedKeys.add(`${def.id}::${habit.id}`);
        }
      }
      continue;
    }
    if (def.metric === 'activeHabits') {
      if (totals.activeHabits >= def.threshold && !unlockedKeys.has(`${def.id}::user`)) {
        earned.push({ achievementId: def.id, habitId: null, streakLength: totals.activeHabits });
        unlockedKeys.add(`${def.id}::user`);
      }
      continue;
    }
    const value =
      def.metric === 'checkins'
        ? totals.totalCompleted
        : def.metric === 'perfectDays'
          ? totals.perfectDays
          : def.metric === 'perfectWeeks'
            ? totals.perfectWeeks
            : totals.earlyCheckins;
    if (value >= def.threshold && !unlockedKeys.has(`${def.id}::user`)) {
      earned.push({ achievementId: def.id, habitId: null, streakLength: 0 });
      unlockedKeys.add(`${def.id}::user`);
    }
  }

  return earned;
}
