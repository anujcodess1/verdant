import { Notification } from '../models/Notification.js';
import { ACHIEVEMENT_BY_ID, evaluateAchievements } from '../lib/achievements.js';

export async function syncAchievements(user, analytics, { createNotifications = true } = {}) {
  const alreadyUnlocked = (user.achievements || []).map((entry) => ({
    achievementId: entry.achievementId,
    habitId: entry.habitId ? String(entry.habitId) : null,
  }));
  const habitRows = analytics.habits.map((row) => ({ id: row.id, name: row.name, stats: row.stats }));
  const earned = evaluateAchievements({ alreadyUnlocked, habitRows, totals: analytics.totals });
  if (!earned.length) return { newlyUnlocked: [] };

  const now = new Date();
  for (const entry of earned) {
    user.achievements.push({ ...entry, unlockedAt: now });
  }
  await user.save();

  const published = [];
  for (const entry of earned) {
    const def = ACHIEVEMENT_BY_ID.get(entry.achievementId);
    if (!def) continue;
    const habitName = entry.habitId ? habitRows.find((row) => row.id === entry.habitId)?.name ?? '' : '';
    const body =
      def.metric === 'streak'
        ? `${def.threshold} day streak on ${habitName || 'your habit'}`
        : def.description;
    published.push({
      achievementId: def.id,
      title: def.title,
      description: def.description,
      icon: def.icon,
      rarity: def.rarity,
      habitId: entry.habitId,
      habitName,
      streakLength: entry.streakLength,
      unlockedAt: now,
    });
    if (!createNotifications) continue;
    const dedupeKey = `${user._id}|${def.id}|${entry.habitId ?? 'user'}`;
    await Notification.updateOne(
      { dedupeKey },
      {
        $setOnInsert: {
          user: user._id,
          kind: 'milestone',
          title: `${def.title} unlocked`,
          body,
          habitId: entry.habitId,
          habitName,
          achievementId: def.id,
          streakLength: entry.streakLength,
          dedupeKey,
        },
      },
      { upsert: true },
    );
  }

  return { newlyUnlocked: published };
}

export async function pushNotification(user, payload) {
  const dedupeKey = payload.dedupeKey ?? null;
  if (!dedupeKey) return Notification.create({ ...payload, user: user._id });
  const result = await Notification.updateOne(
    { dedupeKey },
    { $setOnInsert: { ...payload, user: user._id, dedupeKey } },
    { upsert: true },
  );
  if (!result.upsertedCount) return null;
  return Notification.findOne({ dedupeKey });
}
